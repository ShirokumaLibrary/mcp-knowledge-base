# リポジトリ層の改善計画

## 概要
リポジトリ層の責任を明確に分離し、テスタブルで保守しやすい構造に改善します。
特にTaskRepository（490行）とDocumentRepository（512行）の分割が重要です。

## 現状の問題点

### 主要リポジトリの分析
| リポジトリ | 行数 | 責任の数 | 主な問題 |
|-----------|------|----------|----------|
| TaskRepository | 490 | 4 | ファイルI/O、DB同期、タグ管理、関連管理 |
| DocumentRepository | 512 | 4 | 同上 |
| SearchRepository | 350 | 3 | 複雑な検索ロジック、直接SQL |
| SessionRepository | 324 | 3 | 日付管理、ファイル操作、検索 |

### 共通の問題
1. **責任の混在** - ビジネスロジックとインフラストラクチャの混在
2. **テスタビリティ** - ファイルシステムへの直接依存
3. **重複コード** - 各リポジトリで同様のパターンが繰り返し
4. **エラーハンドリング** - 不統一で不完全

## 改善後のアーキテクチャ

```
Repository Layer Architecture

┌─────────────────────────────────────────────────┐
│           Repository Interfaces                  │
│  ┌──────────────┐  ┌──────────────┐           │
│  │ITaskRepository│  │IDocRepository│           │
│  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────┐
│         Domain Repositories (Business Logic)    │
│  ┌──────────────┐  ┌──────────────┐           │
│  │TaskRepository│  │DocRepository │           │
│  │  - CRUD      │  │  - CRUD      │           │
│  │  - Search    │  │  - Search    │           │
│  └──────┬───────┘  └──────┬───────┘           │
└─────────┼─────────────────┼────────────────────┘
          │                 │
┌─────────▼─────────────────▼────────────────────┐
│      Infrastructure Services                     │
│  ┌──────────────┐  ┌──────────────┐           │
│  │FileStorage   │  │DBSync        │           │
│  │Service       │  │Service       │           │
│  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐           │
│  │TagManager    │  │RelationManager│          │
│  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────┘
```

## TaskRepositoryの分割

### 現在の責任
1. ファイルI/O操作（読み書き、削除）
2. SQLite同期（検索インデックス更新）
3. タグ管理（自動登録、関連付け）
4. 関連アイテム管理（related_tasks, related_documents）

### 分割後の構造

#### 1. TaskRepository（ビジネスロジック層）
```typescript
// src/repositories/task-repository.ts
@injectable()
export class TaskRepository implements ITaskRepository {
  constructor(
    @inject(TYPES.TaskStorageService) private storage: ITaskStorageService,
    @inject(TYPES.TaskSyncService) private sync: ITaskSyncService,
    @inject(TYPES.TagManager) private tagManager: ITagManager,
    @inject(TYPES.RelationManager) private relationManager: IRelationManager,
    @inject(TYPES.StatusRepository) private statusRepo: IStatusRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}
  
  async createTask(type: string, dto: CreateTaskDto): Promise<Task> {
    // ビジネスロジックの調整のみ
    const task = await this.buildTask(type, dto);
    
    // 各サービスに委譲
    await this.storage.save(task);
    await this.sync.syncTask(task, type);
    
    if (task.tags.length > 0) {
      await this.tagManager.registerTags(task.tags);
    }
    
    if (task.related_tasks.length > 0 || task.related_documents.length > 0) {
      await this.relationManager.saveRelations(type, task.id, {
        tasks: task.related_tasks,
        documents: task.related_documents,
      });
    }
    
    return task;
  }
  
  async findById(type: string, id: number): Promise<Task | null> {
    return this.storage.findById(type, id);
  }
  
  async findByTag(type: string, tag: string): Promise<Task[]> {
    const taskIds = await this.tagManager.findTaskIdsByTag(type, tag);
    return this.storage.findByIds(type, taskIds);
  }
  
  private async buildTask(type: string, dto: CreateTaskDto): Promise<Task> {
    const id = await this.storage.getNextId(type);
    const status = dto.status || await this.getDefaultStatus();
    
    return {
      id,
      title: dto.title,
      content: dto.content || '',
      description: dto.description,
      priority: dto.priority || 'medium',
      status,
      status_id: await this.getStatusId(status),
      tags: dto.tags || [],
      start_date: dto.start_date || null,
      end_date: dto.end_date || null,
      related_tasks: dto.related_tasks || [],
      related_documents: dto.related_documents || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
```

#### 2. TaskStorageService（ファイル操作）
```typescript
// src/services/storage/task-storage-service.ts
@injectable()
export class TaskStorageService implements ITaskStorageService {
  constructor(
    @inject(TYPES.FileSystemService) private fs: IFileSystemService,
    @inject(TYPES.Config) private config: AppConfig,
    @inject(TYPES.Logger) private logger: Logger
  ) {}
  
  async save(task: Task): Promise<void> {
    const filePath = this.getFilePath(task.type, task.id);
    const content = this.serialize(task);
    await this.fs.writeFile(filePath, content);
    
    this.logger.debug('Task saved to file', { 
      type: task.type, 
      id: task.id, 
      path: filePath 
    });
  }
  
  async findById(type: string, id: number): Promise<Task | null> {
    const filePath = this.getFilePath(type, id);
    const content = await this.fs.readFile(filePath);
    
    if (!content) {
      return null;
    }
    
    try {
      return this.deserialize(content);
    } catch (error) {
      this.logger.error('Failed to parse task file', { 
        type, 
        id, 
        error 
      });
      throw new CorruptedDataError(
        `Task file corrupted: ${type}-${id}`,
        { type, id, error }
      );
    }
  }
  
  async delete(type: string, id: number): Promise<boolean> {
    const filePath = this.getFilePath(type, id);
    return this.fs.deleteFile(filePath);
  }
  
  async getNextId(type: string): Promise<number> {
    // Sequenceテーブルから取得
    const db = this.getDatabase();
    await db.runAsync(
      'UPDATE sequences SET current_value = current_value + 1 WHERE type = ?',
      [type]
    );
    
    const row = await db.getAsync(
      'SELECT current_value FROM sequences WHERE type = ?',
      [type]
    ) as { current_value: number };
    
    return row.current_value;
  }
  
  private serialize(task: Task): string {
    const metadata = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      status_id: task.status_id,
      tags: task.tags,
      start_date: task.start_date,
      end_date: task.end_date,
      related_tasks: task.related_tasks,
      related_documents: task.related_documents,
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
    
    return generateMarkdown(metadata, task.content);
  }
  
  private deserialize(content: string): Task {
    const { metadata, content: taskContent } = parseMarkdown(content);
    
    if (!metadata.id || !metadata.title) {
      throw new Error('Invalid task data: missing required fields');
    }
    
    return {
      id: metadata.id,
      title: metadata.title,
      content: taskContent,
      description: metadata.description,
      priority: metadata.priority || 'medium',
      status: metadata.status,
      status_id: metadata.status_id,
      tags: metadata.tags || [],
      start_date: metadata.start_date || null,
      end_date: metadata.end_date || null,
      related_tasks: metadata.related_tasks || [],
      related_documents: metadata.related_documents || [],
      created_at: metadata.created_at,
      updated_at: metadata.updated_at,
    };
  }
}
```

#### 3. TaskSyncService（DB同期）
```typescript
// src/services/sync/task-sync-service.ts
@injectable()
export class TaskSyncService implements ITaskSyncService {
  constructor(
    @inject(TYPES.DatabaseConnection) private db: Database,
    @inject(TYPES.Logger) private logger: Logger
  ) {}
  
  async syncTask(task: Task, type: string): Promise<void> {
    const transaction = await this.db.beginTransaction();
    
    try {
      // コアデータの同期
      await this.syncCore(task, type, transaction);
      
      // タグの同期
      await this.syncTags(task, type, transaction);
      
      // 関連の同期
      await this.syncRelations(task, type, transaction);
      
      await transaction.commit();
      
      this.logger.debug('Task synced to database', { 
        type, 
        id: task.id 
      });
    } catch (error) {
      await transaction.rollback();
      throw new DatabaseSyncError(
        'Failed to sync task to database',
        { type, id: task.id, error }
      );
    }
  }
  
  private async syncCore(
    task: Task, 
    type: string, 
    tx: Transaction
  ): Promise<void> {
    await tx.runAsync(
      `INSERT OR REPLACE INTO search_tasks 
       (type, id, title, summary, content, priority, status_id, 
        start_date, end_date, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type,
        task.id,
        task.title,
        task.description || null,
        task.content,
        task.priority,
        task.status_id,
        task.start_date,
        task.end_date,
        JSON.stringify(task.tags),
        task.created_at,
        task.updated_at,
      ]
    );
  }
  
  private async syncTags(
    task: Task, 
    type: string, 
    tx: Transaction
  ): Promise<void> {
    await tx.runAsync(
      'DELETE FROM task_tags WHERE task_type = ? AND task_id = ?',
      [type, task.id]
    );
    
    for (const tagName of task.tags) {
      const tagId = await this.getTagId(tagName, tx);
      await tx.runAsync(
        'INSERT INTO task_tags (task_type, task_id, tag_id) VALUES (?, ?, ?)',
        [type, task.id, tagId]
      );
    }
  }
  
  private async syncRelations(
    task: Task, 
    type: string, 
    tx: Transaction
  ): Promise<void> {
    // related_tasksの同期
    await tx.runAsync(
      'DELETE FROM related_tasks WHERE source_type = ? AND source_id = ?',
      [type, task.id]
    );
    
    for (const taskRef of task.related_tasks) {
      const [targetType, targetId] = taskRef.split('-');
      if (targetType && targetId) {
        await tx.runAsync(
          `INSERT INTO related_tasks 
           (source_type, source_id, target_type, target_id) 
           VALUES (?, ?, ?, ?)`,
          [type, task.id, targetType, parseInt(targetId)]
        );
      }
    }
    
    // related_documentsの同期も同様
  }
}
```

## DocumentRepositoryの分割

DocumentRepositoryも同様のパターンで分割：

### 分割後の構造
1. **DocumentRepository** - ビジネスロジック調整
2. **DocumentStorageService** - ファイル操作
3. **DocumentSyncService** - DB同期
4. **共通のTagManager** - タグ管理（Task/Document共用）
5. **共通のRelationManager** - 関連管理（Task/Document共用）

## SearchRepositoryの改善

### 現在の問題
- 生のSQL文字列が散在
- 複雑な検索ロジック
- エラーハンドリング不足

### 改善後
```typescript
// src/repositories/search-repository.ts
@injectable()
export class SearchRepository implements ISearchRepository {
  constructor(
    @inject(TYPES.DatabaseConnection) private db: Database,
    @inject(TYPES.QueryBuilder) private queryBuilder: IQueryBuilder,
    @inject(TYPES.Logger) private logger: Logger
  ) {}
  
  async searchByTag(tag: string, options?: SearchOptions): Promise<SearchResults> {
    const query = this.queryBuilder
      .select(['type', 'id', 'title', 'summary'])
      .from('search_index')
      .join('item_tags', 'search_index.id = item_tags.item_id')
      .join('tags', 'item_tags.tag_id = tags.id')
      .where('tags.name = ?', tag);
    
    if (options?.types) {
      query.whereIn('type', options.types);
    }
    
    if (options?.includeClosedStatuses === false) {
      query.join('statuses', 'search_index.status_id = statuses.id')
           .where('statuses.is_closed = ?', false);
    }
    
    const results = await query.execute<SearchResult[]>();
    
    return this.groupResultsByType(results);
  }
  
  async searchFullText(
    query: string, 
    options?: SearchOptions
  ): Promise<SearchResults> {
    // FTS5を使用した全文検索
    const ftsQuery = this.queryBuilder
      .select(['type', 'id', 'title', 'snippet(search_fts, -1, "<mark>", "</mark>", "...", 64) as snippet'])
      .from('search_fts')
      .where('search_fts MATCH ?', query);
    
    if (options?.types) {
      ftsQuery.whereIn('type', options.types);
    }
    
    const results = await ftsQuery.execute<SearchResult[]>();
    
    return this.groupResultsByType(results);
  }
}
```

## 共通サービスの実装

### TagManager
```typescript
// src/services/tag-manager.ts
@injectable()
export class TagManager implements ITagManager {
  constructor(
    @inject(TYPES.DatabaseConnection) private db: Database,
    @inject(TYPES.Logger) private logger: Logger
  ) {}
  
  async registerTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.ensureTagExists(tag);
    }
  }
  
  async ensureTagExists(tagName: string): Promise<number> {
    const existing = await this.db.getAsync(
      'SELECT id FROM tags WHERE name = ?',
      [tagName]
    ) as { id: number } | undefined;
    
    if (existing) {
      return existing.id;
    }
    
    const result = await this.db.runAsync(
      'INSERT INTO tags (name) VALUES (?)',
      [tagName]
    );
    
    this.logger.debug('Tag created', { name: tagName, id: result.lastID });
    
    return result.lastID!;
  }
  
  async findTaskIdsByTag(type: string, tag: string): Promise<number[]> {
    const rows = await this.db.allAsync(
      `SELECT task_id FROM task_tags 
       JOIN tags ON task_tags.tag_id = tags.id 
       WHERE task_type = ? AND tags.name = ?`,
      [type, tag]
    ) as Array<{ task_id: number }>;
    
    return rows.map(row => row.task_id);
  }
}
```

### RelationManager
```typescript
// src/services/relation-manager.ts
@injectable()
export class RelationManager implements IRelationManager {
  constructor(
    @inject(TYPES.DatabaseConnection) private db: Database,
    @inject(TYPES.Logger) private logger: Logger
  ) {}
  
  async saveRelations(
    sourceType: string,
    sourceId: number,
    relations: {
      tasks?: string[];
      documents?: string[];
    }
  ): Promise<void> {
    const tx = await this.db.beginTransaction();
    
    try {
      // 既存の関連を削除
      await this.clearRelations(sourceType, sourceId, tx);
      
      // 新しい関連を追加
      if (relations.tasks) {
        await this.saveTaskRelations(
          sourceType, 
          sourceId, 
          relations.tasks, 
          tx
        );
      }
      
      if (relations.documents) {
        await this.saveDocumentRelations(
          sourceType, 
          sourceId, 
          relations.documents, 
          tx
        );
      }
      
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
  
  private async saveTaskRelations(
    sourceType: string,
    sourceId: number,
    taskRefs: string[],
    tx: Transaction
  ): Promise<void> {
    for (const ref of taskRefs) {
      const parsed = this.parseReference(ref);
      if (!parsed) continue;
      
      await tx.runAsync(
        `INSERT INTO related_tasks 
         (source_type, source_id, target_type, target_id) 
         VALUES (?, ?, ?, ?)`,
        [sourceType, sourceId, parsed.type, parsed.id]
      );
    }
  }
  
  private parseReference(ref: string): { type: string; id: number } | null {
    const match = ref.match(/^(\w+)-(\d+)$/);
    if (!match) return null;
    
    return {
      type: match[1],
      id: parseInt(match[2], 10),
    };
  }
}
```

## テスト戦略

### リポジトリのテスト
```typescript
describe('TaskRepository', () => {
  let repository: TaskRepository;
  let mockStorage: jest.Mocked<ITaskStorageService>;
  let mockSync: jest.Mocked<ITaskSyncService>;
  let mockTagManager: jest.Mocked<ITagManager>;
  
  beforeEach(() => {
    mockStorage = createMock<ITaskStorageService>();
    mockSync = createMock<ITaskSyncService>();
    mockTagManager = createMock<ITagManager>();
    
    repository = new TaskRepository(
      mockStorage,
      mockSync,
      mockTagManager,
      // ... other mocks
    );
  });
  
  describe('createTask', () => {
    it('should coordinate all services correctly', async () => {
      // Arrange
      const dto = { title: 'Test', tags: ['test'] };
      const expectedTask = { id: 1, ...dto };
      
      mockStorage.getNextId.mockResolvedValue(1);
      mockStorage.save.mockResolvedValue(undefined);
      mockSync.syncTask.mockResolvedValue(undefined);
      mockTagManager.registerTags.mockResolvedValue(undefined);
      
      // Act
      const result = await repository.createTask('issues', dto);
      
      // Assert
      expect(result).toMatchObject(expectedTask);
      expect(mockStorage.save).toHaveBeenCalledWith(expectedTask);
      expect(mockSync.syncTask).toHaveBeenCalledWith(expectedTask, 'issues');
      expect(mockTagManager.registerTags).toHaveBeenCalledWith(['test']);
    });
  });
});
```

## 成功指標

### Before
- TaskRepository: 490行、4つの責任
- DocumentRepository: 512行、4つの責任
- 密結合、テスト困難

### After
- 各リポジトリ: ~150行、単一責任
- 各サービス: ~100行、単一責任
- 疎結合、完全にテスト可能

## リスクと対策

### リスク1: パフォーマンス劣化
- **対策**: トランザクション最適化、バッチ処理

### リスク2: 複雑性の増加
- **対策**: 明確なインターフェース定義

### リスク3: 移行の困難さ
- **対策**: 段階的な移行、既存APIの維持