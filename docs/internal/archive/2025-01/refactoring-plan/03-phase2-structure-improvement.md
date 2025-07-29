# フェーズ2: 構造改善計画（3週間）

## 概要
単一責任原則に違反している巨大クラスを分割し、適切な責任分離を実現します。
特にFileIssueDatabase（735行）の分割が最優先事項です。

## 現状の問題

### 巨大クラス一覧
| クラス | 行数 | メソッド数 | 責任の数 |
|--------|------|------------|----------|
| FileIssueDatabase | 735 | 40+ | 7 |
| TaskRepository | 490 | 43 | 4 |
| DocumentRepository | 512 | 31 | 4 |
| SearchRepository | 350 | 41 | 3 |
| DatabaseConnection | 389 | 10 | 3 |

### 長い関数（20行超）
- 合計35個の関数が20行を超えている
- 最長: createTask（89行）
- 平均: 約35行

## Week 1: FileIssueDatabaseの分割

### 現在の責任（7つ）
1. データベース接続管理
2. ステータス管理
3. タグ管理
4. タスク管理（Issue/Plan）
5. ドキュメント管理（Doc/Knowledge）
6. セッション管理
7. 検索機能

### 分割後のアーキテクチャ

```typescript
// src/database/database-manager.ts
export class DatabaseManager {
  private connection: DatabaseConnection;
  
  constructor(private config: DatabaseConfig) {}
  
  async initialize(): Promise<void> {
    this.connection = new DatabaseConnection(this.config.path);
    await this.connection.initialize();
  }
  
  getConnection(): Database {
    return this.connection.getDatabase();
  }
}

// src/database/repository-factory.ts
export class RepositoryFactory {
  constructor(private dbManager: DatabaseManager) {}
  
  createStatusRepository(): IStatusRepository {
    return new StatusRepository(this.dbManager.getConnection());
  }
  
  createTagRepository(): ITagRepository {
    return new TagRepository(this.dbManager.getConnection());
  }
  
  createTaskRepository(): ITaskRepository {
    return new TaskRepository(
      this.dbManager.getConnection(),
      this.config.tasksPath,
      this.createStatusRepository(),
      this.createTagRepository()
    );
  }
  
  // 他のリポジトリも同様
}

// src/services/data-service.ts
export class DataService {
  private repositories: {
    status: IStatusRepository;
    tag: ITagRepository;
    task: ITaskRepository;
    document: IDocumentRepository;
    search: ISearchRepository;
  };
  
  constructor(private repositoryFactory: RepositoryFactory) {
    this.repositories = {
      status: repositoryFactory.createStatusRepository(),
      tag: repositoryFactory.createTagRepository(),
      task: repositoryFactory.createTaskRepository(),
      document: repositoryFactory.createDocumentRepository(),
      search: repositoryFactory.createSearchRepository(),
    };
  }
  
  // ビジネスロジックをここに集約
  async createIssue(data: CreateIssueDto): Promise<Issue> {
    // トランザクション処理
    // バリデーション
    // リポジトリ呼び出し
    // イベント発火
  }
}
```

### Day 1-2: インターフェース定義

```typescript
// src/interfaces/repositories.ts
export interface IRepository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: number): Promise<boolean>;
}

export interface ITaskRepository extends IRepository<Task> {
  findByStatus(statusId: number): Promise<Task[]>;
  findByTag(tag: string): Promise<Task[]>;
  updateStatus(id: number, statusId: number): Promise<boolean>;
}

// src/interfaces/services.ts
export interface IDataService {
  // タスク関連
  createTask(type: string, data: CreateTaskDto): Promise<Task>;
  updateTask(type: string, id: number, data: UpdateTaskDto): Promise<Task>;
  deleteTask(type: string, id: number): Promise<boolean>;
  
  // ドキュメント関連
  createDocument(type: string, data: CreateDocumentDto): Promise<Document>;
  updateDocument(type: string, id: number, data: UpdateDocumentDto): Promise<Document>;
  deleteDocument(type: string, id: number): Promise<boolean>;
}
```

### Day 3-5: FileIssueDatabaseの解体

#### Step 1: リポジトリ層の整理
```typescript
// 既存のリポジトリを独立させる
- StatusRepository → 独立したファイルとして維持
- TagRepository → 独立したファイルとして維持
- TaskRepository → 責任を分割（後述）
- DocumentRepository → 責任を分割（後述）
```

#### Step 2: サービス層の作成
```typescript
// src/services/status-service.ts
export class StatusService {
  constructor(private statusRepo: IStatusRepository) {}
  
  async getAllStatuses(): Promise<Status[]> {
    return this.statusRepo.getAllStatuses();
  }
  
  // ビジネスロジックを含む操作
  async createWorkflowStatus(name: string, isClosing: boolean): Promise<Status> {
    // バリデーション
    if (!name || name.length < 3) {
      throw new ValidationError('Status name must be at least 3 characters');
    }
    
    // 重複チェック
    const existing = await this.statusRepo.findByName(name);
    if (existing) {
      throw new ConflictError(`Status '${name}' already exists`);
    }
    
    return this.statusRepo.createStatus(name, isClosing);
  }
}
```

### Day 6-7: 既存コードの移行

#### 移行戦略
```typescript
// src/database/index.ts を段階的に縮小

// Phase 1: Facade として維持
export class FileIssueDatabase {
  private dataService: DataService;
  
  constructor(dbPath: string) {
    const dbManager = new DatabaseManager({ path: dbPath });
    const repoFactory = new RepositoryFactory(dbManager);
    this.dataService = new DataService(repoFactory);
  }
  
  // 既存のメソッドをdataServiceに委譲
  async getAllStatuses(): Promise<Status[]> {
    return this.dataService.getAllStatuses();
  }
  
  // @deprecated Use DataService directly
  async createIssue(...args): Promise<Issue> {
    console.warn('FileIssueDatabase.createIssue is deprecated. Use DataService instead.');
    return this.dataService.createIssue(...args);
  }
}
```

## Week 2: リポジトリ層の改善

### Day 8-10: TaskRepositoryの分割

#### 現在の責任（4つ）
1. ファイルI/O操作
2. SQLite同期
3. タグ管理
4. 関連アイテム管理

#### 分割後
```typescript
// src/repositories/task/task-file-repository.ts
export class TaskFileRepository {
  async readTaskFile(type: string, id: number): Promise<string | null> {
    const filePath = this.getFilePath(type, id);
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }
  
  async writeTaskFile(type: string, id: number, content: string): Promise<void> {
    const filePath = this.getFilePath(type, id);
    await this.ensureDirectory(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }
}

// src/repositories/task/task-sync-service.ts
export class TaskSyncService {
  constructor(
    private db: Database,
    private tagRepo: ITagRepository
  ) {}
  
  async syncTaskToDatabase(task: Task, type: string): Promise<void> {
    await this.syncTaskCore(task, type);
    await this.syncTaskTags(task, type);
    await this.syncRelatedItems(task, type);
  }
  
  private async syncTaskCore(task: Task, type: string): Promise<void> {
    // 20行以下の関数に分割
  }
}

// src/repositories/task/task-repository.ts
export class TaskRepository implements ITaskRepository {
  constructor(
    private fileRepo: TaskFileRepository,
    private syncService: TaskSyncService,
    private statusRepo: IStatusRepository
  ) {}
  
  async createTask(type: string, data: CreateTaskDto): Promise<Task> {
    // 1. バリデーション（15行）
    const validatedData = await this.validateTaskData(data);
    
    // 2. エンティティ作成（10行）
    const task = await this.buildTaskEntity(type, validatedData);
    
    // 3. ファイル保存（10行）
    await this.fileRepo.writeTaskFile(type, task.id, this.serializeTask(task));
    
    // 4. DB同期（10行）
    await this.syncService.syncTaskToDatabase(task, type);
    
    return task;
  }
}
```

### Day 11-12: DocumentRepositoryの分割

同様のパターンでDocumentRepositoryも分割：
- DocumentFileRepository（ファイルI/O）
- DocumentSyncService（DB同期）
- DocumentRepository（ビジネスロジック）

### Day 13-14: 長い関数の分割

#### 分割テンプレート
```typescript
// Before: 89行の関数
async createTask(...args): Promise<Task> {
  // 全ての処理が一つの関数に
}

// After: 各20行以下の関数に分割
async createTask(type: string, data: CreateTaskDto): Promise<Task> {
  const validatedData = await this.validateCreateData(data);
  const task = await this.buildNewTask(type, validatedData);
  await this.persistTask(task);
  await this.notifyTaskCreated(task);
  return task;
}

private async validateCreateData(data: CreateTaskDto): Promise<ValidatedTaskData> {
  // 15行程度のバリデーションロジック
}

private async buildNewTask(type: string, data: ValidatedTaskData): Promise<Task> {
  // 15行程度のエンティティ構築
}

private async persistTask(task: Task): Promise<void> {
  // 15行程度の永続化処理
}

private async notifyTaskCreated(task: Task): Promise<void> {
  // 10行程度のイベント通知
}
```

## Week 3: 最終調整と品質保証

### Day 15-17: 引数の削減

#### 引数オブジェクト化
```typescript
// Before: 13個の引数
async updateTask(
  type: string,
  id: number,
  title?: string,
  content?: string,
  priority?: string,
  status?: string,
  tags?: string[],
  description?: string,
  start_date?: string,
  end_date?: string,
  related_tasks?: string[],
  related_documents?: string[]
): Promise<Task>

// After: 引数オブジェクト使用
interface UpdateTaskParams {
  type: string;
  id: number;
  updates: Partial<TaskUpdateData>;
}

async updateTask(params: UpdateTaskParams): Promise<Task>
```

### Day 18-19: ネストの削減

#### 早期リターンパターンの適用
```typescript
// Before: 深いネスト
function processTask(task: Task): void {
  if (task) {
    if (task.status === 'active') {
      if (task.priority === 'high') {
        // 処理
      }
    }
  }
}

// After: 早期リターン
function processTask(task: Task): void {
  if (!task) return;
  if (task.status !== 'active') return;
  if (task.priority !== 'high') return;
  
  // 処理
}
```

### Day 20-21: 統合テストと移行

#### 移行チェックリスト
- [ ] 全ての既存テストが通過
- [ ] 新規アーキテクチャのテスト作成
- [ ] パフォーマンステスト実施
- [ ] メモリ使用量の検証
- [ ] APIの後方互換性確認

## 成果物

### 新規作成ファイル
1. `src/database/database-manager.ts`
2. `src/database/repository-factory.ts`
3. `src/services/data-service.ts`
4. `src/services/*-service.ts`（各ドメイン）
5. `src/repositories/*/`（分割されたリポジトリ）

### リファクタリング対象
- `src/database/index.ts`（735行 → 100行以下）
- `src/database/task-repository.ts`（490行 → 200行以下）
- `src/database/document-repository.ts`（512行 → 200行以下）

## 成功指標

### 定量的指標
- 最大クラスサイズ: 735行 → 200行以下
- 20行超の関数: 35個 → 0個
- 引数4個以上の関数: 147個 → 20個以下
- 平均メソッド数/クラス: 40 → 10以下

### 定性的指標
- 各クラスが単一の責任を持つ
- 新機能追加時の影響範囲が限定的
- テストが書きやすい構造

## リスクと対策

### リスク1: 大規模な構造変更による不具合
- **対策**: 段階的移行とfeature flag

### リスク2: パフォーマンス劣化
- **対策**: ベンチマークテストの継続実施

### リスク3: 過度な抽象化
- **対策**: YAGNI原則の遵守