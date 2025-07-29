# FileIssueDatabase分割計画

## 概要
735行、40以上のメソッド、7つの責任を持つ巨大クラスを、単一責任原則に従って分割します。

## 現状の問題点

### 責任の分析
1. **データベース接続管理** - 初期化、接続維持
2. **ステータス管理** - CRUD操作
3. **タグ管理** - CRUD操作、自動登録
4. **タスク管理** - Issue/Planの操作
5. **ドキュメント管理** - Doc/Knowledgeの操作
6. **セッション管理** - WorkSession/DailySummary
7. **検索機能** - 横断的検索

### メトリクス
- **行数**: 735行
- **メソッド数**: 40+
- **依存関係**: 7つのリポジトリ
- **循環的複雑度**: 推定50+

## 分割後のアーキテクチャ

```
┌─────────────────────────────────────────────┐
│            MCP Server Layer                  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│            Service Layer                     │
│  ┌─────────────────────────────────────┐    │
│  │         DataService                  │    │
│  │  - Orchestrates business logic      │    │
│  │  - Transaction management           │    │
│  │  - Cross-cutting concerns          │    │
│  └─────────────┬───────────────────────┘    │
└────────────────┼────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│           Repository Layer                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Status   │ │  Tag     │ │  Task    │   │
│  │ Repo     │ │  Repo    │ │  Repo    │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Document │ │ Session  │ │ Search   │   │
│  │ Repo     │ │ Repo     │ │ Repo     │   │
│  └──────────┘ └──────────┘ └──────────┘   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          Database Layer                      │
│  ┌─────────────────────────────────────┐    │
│  │      DatabaseConnection              │    │
│  │  - Connection management             │    │
│  │  - Table initialization              │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## 実装詳細

### 1. DatabaseManager（接続管理）

```typescript
// src/database/database-manager.ts
export interface DatabaseConfig {
  path: string;
  busyTimeout?: number;
  maxConnections?: number;
}

export class DatabaseManager {
  private connection: DatabaseConnection;
  private initialized = false;
  
  constructor(private config: DatabaseConfig) {}
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.connection = new DatabaseConnection(this.config.path);
    await this.connection.initialize();
    this.initialized = true;
  }
  
  getConnection(): Database {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }
    return this.connection.getDatabase();
  }
  
  async close(): Promise<void> {
    if (this.connection) {
      this.connection.close();
    }
  }
}
```

### 2. RepositoryFactory（リポジトリ生成）

```typescript
// src/database/repository-factory.ts
export class RepositoryFactory {
  private repositories = new Map<string, any>();
  
  constructor(
    private dbManager: DatabaseManager,
    private config: AppConfig
  ) {}
  
  getStatusRepository(): IStatusRepository {
    return this.getOrCreate('status', () => 
      new StatusRepository(this.dbManager.getConnection())
    );
  }
  
  getTagRepository(): ITagRepository {
    return this.getOrCreate('tag', () =>
      new TagRepository(this.dbManager.getConnection())
    );
  }
  
  getTaskRepository(): ITaskRepository {
    return this.getOrCreate('task', () =>
      new TaskRepository(
        this.dbManager.getConnection(),
        this.config.paths.tasks,
        this.getStatusRepository(),
        this.getTagRepository()
      )
    );
  }
  
  private getOrCreate<T>(key: string, factory: () => T): T {
    if (!this.repositories.has(key)) {
      this.repositories.set(key, factory());
    }
    return this.repositories.get(key);
  }
}
```

### 3. DataService（ビジネスロジック）

```typescript
// src/services/data-service.ts
export class DataService {
  constructor(
    private repoFactory: RepositoryFactory,
    private eventBus: EventBus
  ) {}
  
  // ステータス操作
  async getAllStatuses(): Promise<Status[]> {
    return this.repoFactory.getStatusRepository().getAllStatuses();
  }
  
  // タスク操作（トランザクション付き）
  async createTask(type: string, data: CreateTaskDto): Promise<Task> {
    return this.executeInTransaction(async (tx) => {
      // バリデーション
      await this.validateTaskData(data);
      
      // タスク作成
      const task = await this.repoFactory
        .getTaskRepository()
        .create(type, data);
      
      // タグ自動登録
      if (data.tags?.length > 0) {
        await this.repoFactory
          .getTagRepository()
          .ensureTagsExist(data.tags);
      }
      
      // イベント発火
      await this.eventBus.emit('task:created', {
        type,
        id: task.id,
        task,
      });
      
      return task;
    });
  }
  
  // 横断検索
  async searchByTag(tag: string): Promise<SearchResults> {
    const [tasks, documents, sessions] = await Promise.all([
      this.searchTasksByTag(tag),
      this.searchDocumentsByTag(tag),
      this.searchSessionsByTag(tag),
    ]);
    
    return {
      tasks,
      documents,
      sessions,
      total: tasks.length + documents.length + sessions.length,
    };
  }
  
  private async executeInTransaction<T>(
    operation: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    const tx = new Transaction(this.dbManager.getConnection());
    
    try {
      await tx.begin();
      const result = await operation(tx);
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
}
```

### 4. 移行用Facadeクラス

```typescript
// src/database/index.ts（縮小版）
export class FileIssueDatabase {
  private dataService: DataService;
  
  constructor(dbPath: string) {
    // 新アーキテクチャの初期化
    const config = { database: { path: dbPath } };
    const dbManager = new DatabaseManager(config.database);
    const repoFactory = new RepositoryFactory(dbManager, config);
    const eventBus = new EventBus();
    this.dataService = new DataService(repoFactory, eventBus);
  }
  
  async initialize(): Promise<void> {
    // DataServiceの初期化に委譲
    await this.dataService.initialize();
  }
  
  // 既存APIの維持（非推奨警告付き）
  
  /**
   * @deprecated Use DataService.getAllStatuses() instead
   */
  async getAllStatuses(): Promise<Status[]> {
    console.warn(
      'FileIssueDatabase.getAllStatuses() is deprecated. ' +
      'Use DataService.getAllStatuses() instead.'
    );
    return this.dataService.getAllStatuses();
  }
  
  // 他のメソッドも同様に委譲...
}
```

## 移行計画

### Phase 1: 準備（Day 1-2）
1. 新規ファイル構造の作成
2. インターフェース定義
3. テストケースの準備

### Phase 2: 実装（Day 3-5）
1. DatabaseManagerの実装
2. RepositoryFactoryの実装
3. DataServiceの実装
4. 既存リポジトリの調整

### Phase 3: 移行（Day 6-7）
1. Facadeパターンでの互換性維持
2. 段階的な呼び出し元の更新
3. 非推奨警告の追加

### Phase 4: クリーンアップ（Day 8）
1. 旧コードの削除
2. ドキュメント更新
3. 最終テスト

## テスト戦略

### ユニットテスト
```typescript
describe('DataService', () => {
  let dataService: DataService;
  let mockRepoFactory: jest.Mocked<RepositoryFactory>;
  
  beforeEach(() => {
    mockRepoFactory = createMockRepositoryFactory();
    dataService = new DataService(mockRepoFactory, new EventBus());
  });
  
  describe('createTask', () => {
    it('should create task with transaction', async () => {
      const mockTask = createMockTask();
      mockRepoFactory.getTaskRepository()
        .create.mockResolvedValue(mockTask);
      
      const result = await dataService.createTask('issues', {
        title: 'Test Issue',
        content: 'Test content',
      });
      
      expect(result).toEqual(mockTask);
      expect(mockRepoFactory.getTagRepository().ensureTagsExist)
        .not.toHaveBeenCalled();
    });
    
    it('should rollback on error', async () => {
      mockRepoFactory.getTaskRepository()
        .create.mockRejectedValue(new Error('DB Error'));
      
      await expect(
        dataService.createTask('issues', { title: 'Test' })
      ).rejects.toThrow('DB Error');
      
      // トランザクションがロールバックされたことを確認
    });
  });
});
```

### 統合テスト
```typescript
describe('FileIssueDatabase Migration', () => {
  it('should maintain backward compatibility', async () => {
    const oldApi = new FileIssueDatabase('./test.db');
    const newApi = new DataService(/* ... */);
    
    await oldApi.initialize();
    await newApi.initialize();
    
    // 同じ結果を返すことを確認
    const oldStatuses = await oldApi.getAllStatuses();
    const newStatuses = await newApi.getAllStatuses();
    
    expect(oldStatuses).toEqual(newStatuses);
  });
});
```

## 成功指標

### Before
- 1クラス: 735行
- 責任: 7つ
- テスタビリティ: 低

### After
- DatabaseManager: ~50行
- RepositoryFactory: ~100行
- DataService: ~300行
- 各クラス単一責任
- テスタビリティ: 高

## リスクと対策

### リスク1: API互換性
- **対策**: Facadeパターンで段階的移行

### リスク2: パフォーマンス
- **対策**: 接続プーリング、キャッシング

### リスク3: エラーハンドリング
- **対策**: 各層で適切なエラー変換