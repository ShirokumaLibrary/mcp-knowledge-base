# フェーズ5: テスタビリティ改善計画（2週間）

## 概要
依存性注入（DI）パターンを導入し、モック可能な設計に変更することで、テストカバレッジ80%以上を達成します。

## 現状分析

### テスタビリティの問題点
1. **直接的な依存関係** - new演算子での直接インスタンス化（50箇所以上）
2. **ファイルシステムへの直接アクセス** - 100箇所以上
3. **静的メソッドへの依存** - 20箇所以上
4. **privateメソッドの過多** - 平均30%がprivate
5. **グローバル状態への依存** - console、process.env等

### 現在のテストカバレッジ
- 推定: 30-40%
- ユニットテスト: 不十分
- 統合テスト: 限定的
- E2Eテスト: なし

## Week 1: 依存性注入の基盤構築

### Day 1-2: DIコンテナの導入

```typescript
// src/container/types.ts
export const TYPES = {
  // Core
  DatabaseManager: Symbol.for('DatabaseManager'),
  DatabaseConnection: Symbol.for('DatabaseConnection'),
  Logger: Symbol.for('Logger'),
  Config: Symbol.for('Config'),
  
  // Repositories
  StatusRepository: Symbol.for('StatusRepository'),
  TagRepository: Symbol.for('TagRepository'),
  TaskRepository: Symbol.for('TaskRepository'),
  DocumentRepository: Symbol.for('DocumentRepository'),
  SearchRepository: Symbol.for('SearchRepository'),
  
  // Services
  DataService: Symbol.for('DataService'),
  FileSystemService: Symbol.for('FileSystemService'),
  ValidationService: Symbol.for('ValidationService'),
  EventBus: Symbol.for('EventBus'),
  
  // Handlers
  ItemHandlers: Symbol.for('ItemHandlers'),
  SessionHandlers: Symbol.for('SessionHandlers'),
  TagHandlers: Symbol.for('TagHandlers'),
  StatusHandlers: Symbol.for('StatusHandlers'),
} as const;

// src/container/container.ts
import { Container } from 'inversify';
import 'reflect-metadata';

export class DIContainer {
  private container: Container;
  
  constructor() {
    this.container = new Container();
    this.configure();
  }
  
  private configure(): void {
    // Config binding
    this.container.bind<AppConfig>(TYPES.Config)
      .toConstantValue(getConfig());
    
    // Logger binding
    this.container.bind<Logger>(TYPES.Logger)
      .toDynamicValue((context) => {
        const className = context.currentRequest.parentRequest?.serviceIdentifier.toString() || 'Unknown';
        return createLogger(className);
      });
    
    // Database bindings
    this.container.bind<DatabaseManager>(TYPES.DatabaseManager)
      .to(DatabaseManager)
      .inSingletonScope();
    
    // Repository bindings
    this.container.bind<IStatusRepository>(TYPES.StatusRepository)
      .to(StatusRepository)
      .inSingletonScope();
    
    this.container.bind<ITagRepository>(TYPES.TagRepository)
      .to(TagRepository)
      .inSingletonScope();
    
    // Service bindings
    this.container.bind<IDataService>(TYPES.DataService)
      .to(DataService)
      .inRequestScope();
    
    // Handler bindings
    this.container.bind<ItemHandlers>(TYPES.ItemHandlers)
      .to(ItemHandlers)
      .inRequestScope();
  }
  
  get<T>(serviceIdentifier: symbol): T {
    return this.container.get<T>(serviceIdentifier);
  }
  
  // テスト用のモックバインディング
  rebindForTesting<T>(serviceIdentifier: symbol, implementation: T): void {
    this.container.rebind<T>(serviceIdentifier).toConstantValue(implementation);
  }
}
```

### Day 3-4: インターフェースの定義と実装

```typescript
// src/interfaces/file-system-service.ts
export interface IFileSystemService {
  readFile(path: string): Promise<string | null>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<boolean>;
  exists(path: string): Promise<boolean>;
  readdir(path: string): Promise<string[]>;
  mkdir(path: string, options?: { recursive: boolean }): Promise<void>;
}

// src/services/file-system-service.ts
@injectable()
export class FileSystemService implements IFileSystemService {
  constructor(
    @inject(TYPES.Logger) private logger: Logger
  ) {}
  
  async readFile(path: string): Promise<string | null> {
    try {
      return await fs.readFile(path, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      this.logger.error('Failed to read file', { path, error });
      throw new FileSystemError('read', path, error.message);
    }
  }
  
  async writeFile(path: string, content: string): Promise<void> {
    const dir = path.dirname(path);
    await this.mkdir(dir, { recursive: true });
    await fs.writeFile(path, content, 'utf-8');
  }
  
  // 他のメソッドも同様に実装
}

// src/services/mock-file-system-service.ts
export class MockFileSystemService implements IFileSystemService {
  private files = new Map<string, string>();
  
  async readFile(path: string): Promise<string | null> {
    return this.files.get(path) || null;
  }
  
  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }
  
  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }
  
  // テスト用ヘルパー
  getFileContent(path: string): string | undefined {
    return this.files.get(path);
  }
  
  clear(): void {
    this.files.clear();
  }
}
```

### Day 5-6: リポジトリ層のDI対応

```typescript
// src/database/task-repository.ts
@injectable()
export class TaskRepository implements ITaskRepository {
  constructor(
    @inject(TYPES.DatabaseConnection) private db: Database,
    @inject(TYPES.FileSystemService) private fileSystem: IFileSystemService,
    @inject(TYPES.StatusRepository) private statusRepo: IStatusRepository,
    @inject(TYPES.TagRepository) private tagRepo: ITagRepository,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.Config) private config: AppConfig
  ) {
    this.tasksDir = config.paths.tasks;
  }
  
  async createTask(type: string, data: CreateTaskDto): Promise<Task> {
    // fileSystemサービスを使用
    const filePath = this.getTaskFilePath(type, task.id);
    const content = this.serializeTask(task);
    await this.fileSystem.writeFile(filePath, content);
    
    // 他の処理...
  }
  
  async getTask(type: string, id: number): Promise<Task | null> {
    const filePath = this.getTaskFilePath(type, id);
    const content = await this.fileSystem.readFile(filePath);
    
    if (!content) {
      return null;
    }
    
    return this.parseTaskFromMarkdown(content);
  }
}
```

### Day 7: ハンドラー層のDI対応

```typescript
// src/handlers/item-handlers.ts
@injectable()
export class ItemHandlers {
  constructor(
    @inject(TYPES.DataService) private dataService: IDataService,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ValidationService) private validator: IValidationService
  ) {}
  
  async handleGetItems(args: unknown): Promise<ToolResponse> {
    try {
      const validatedArgs = await this.validator.validate(
        GetItemsSchema,
        args
      );
      
      const items = await this.dataService.getItems(
        validatedArgs.type,
        validatedArgs
      );
      
      return ResponseFormatter.success(items);
    } catch (error) {
      this.logger.error('Failed to get items', { error });
      throw error;
    }
  }
}
```

## Week 2: テスト基盤の構築

### Day 8-9: テストユーティリティの作成

```typescript
// src/__tests__/helpers/test-container.ts
export class TestContainer extends DIContainer {
  constructor() {
    super();
    this.configureForTesting();
  }
  
  private configureForTesting(): void {
    // ファイルシステムをモックに置き換え
    this.rebindForTesting(
      TYPES.FileSystemService,
      new MockFileSystemService()
    );
    
    // データベースをインメモリに置き換え
    this.rebindForTesting(
      TYPES.DatabaseConnection,
      new InMemoryDatabase()
    );
    
    // ロガーをモックに置き換え
    this.rebindForTesting(
      TYPES.Logger,
      createMockLogger()
    );
  }
  
  // テスト用ヘルパー
  getMockFileSystem(): MockFileSystemService {
    return this.get<MockFileSystemService>(TYPES.FileSystemService);
  }
  
  reset(): void {
    this.getMockFileSystem().clear();
    this.get<InMemoryDatabase>(TYPES.DatabaseConnection).clear();
  }
}

// src/__tests__/helpers/test-data-builders.ts
export class TaskBuilder {
  private task: Partial<Task> = {
    id: 1,
    title: 'Test Task',
    content: 'Test content',
    priority: 'medium',
    status: 'Open',
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  withId(id: number): this {
    this.task.id = id;
    return this;
  }
  
  withTitle(title: string): this {
    this.task.title = title;
    return this;
  }
  
  withTags(...tags: string[]): this {
    this.task.tags = tags;
    return this;
  }
  
  build(): Task {
    return this.task as Task;
  }
}

// src/__tests__/helpers/test-fixtures.ts
export class TestFixtures {
  static validCreateTaskDto(): CreateTaskDto {
    return {
      title: 'Test Task',
      content: 'Test content',
      priority: 'medium',
      tags: ['test', 'fixture'],
    };
  }
  
  static mockApiResponse<T>(data: T): ToolResponse {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ data }, null, 2),
      }],
    };
  }
}
```

### Day 10-11: ユニットテストの実装

```typescript
// src/__tests__/unit/repositories/task-repository.test.ts
describe('TaskRepository', () => {
  let container: TestContainer;
  let taskRepo: TaskRepository;
  let mockFileSystem: MockFileSystemService;
  
  beforeEach(() => {
    container = new TestContainer();
    taskRepo = container.get<TaskRepository>(TYPES.TaskRepository);
    mockFileSystem = container.getMockFileSystem();
  });
  
  afterEach(() => {
    container.reset();
  });
  
  describe('createTask', () => {
    it('should create task file with correct content', async () => {
      // Arrange
      const dto = TestFixtures.validCreateTaskDto();
      
      // Act
      const result = await taskRepo.createTask('issues', dto);
      
      // Assert
      expect(result).toMatchObject({
        title: dto.title,
        content: dto.content,
        priority: dto.priority,
      });
      
      const filePath = `/database/tasks/issues/issues-${result.id}.md`;
      const fileContent = mockFileSystem.getFileContent(filePath);
      
      expect(fileContent).toBeDefined();
      expect(fileContent).toContain(`title: ${dto.title}`);
      expect(fileContent).toContain(dto.content);
    });
    
    it('should auto-register tags', async () => {
      // Arrange
      const dto = TestFixtures.validCreateTaskDto();
      const mockTagRepo = container.get<ITagRepository>(TYPES.TagRepository);
      const spy = jest.spyOn(mockTagRepo, 'ensureTagsExist');
      
      // Act
      await taskRepo.createTask('issues', dto);
      
      // Assert
      expect(spy).toHaveBeenCalledWith(dto.tags);
    });
    
    it('should handle file system errors', async () => {
      // Arrange
      mockFileSystem.writeFile = jest.fn()
        .mockRejectedValue(new Error('Disk full'));
      
      // Act & Assert
      await expect(
        taskRepo.createTask('issues', TestFixtures.validCreateTaskDto())
      ).rejects.toThrow(FileSystemError);
    });
  });
});

// src/__tests__/unit/handlers/item-handlers.test.ts
describe('ItemHandlers', () => {
  let container: TestContainer;
  let handlers: ItemHandlers;
  let mockDataService: jest.Mocked<IDataService>;
  
  beforeEach(() => {
    container = new TestContainer();
    mockDataService = createMockDataService();
    container.rebindForTesting(TYPES.DataService, mockDataService);
    handlers = container.get<ItemHandlers>(TYPES.ItemHandlers);
  });
  
  describe('handleGetItems', () => {
    it('should return items for valid type', async () => {
      // Arrange
      const mockItems = [
        new TaskBuilder().withId(1).build(),
        new TaskBuilder().withId(2).build(),
      ];
      mockDataService.getItems.mockResolvedValue(mockItems);
      
      // Act
      const result = await handlers.handleGetItems({
        type: 'issues',
        includeClosedStatuses: false,
      });
      
      // Assert
      expect(result).toEqual(TestFixtures.mockApiResponse(mockItems));
      expect(mockDataService.getItems).toHaveBeenCalledWith('issues', {
        type: 'issues',
        includeClosedStatuses: false,
      });
    });
    
    it('should handle validation errors', async () => {
      // Act & Assert
      await expect(
        handlers.handleGetItems({ type: 123 }) // 不正な型
      ).rejects.toThrow(ValidationError);
      
      expect(mockDataService.getItems).not.toHaveBeenCalled();
    });
  });
});
```

### Day 12: 統合テストの実装

```typescript
// src/__tests__/integration/create-task-flow.test.ts
describe('Create Task Flow', () => {
  let container: TestContainer;
  let dataService: IDataService;
  let mockFileSystem: MockFileSystemService;
  
  beforeEach(async () => {
    container = new TestContainer();
    dataService = container.get<IDataService>(TYPES.DataService);
    mockFileSystem = container.getMockFileSystem();
    
    // データベース初期化
    await container.get<DatabaseManager>(TYPES.DatabaseManager).initialize();
  });
  
  it('should create task with all relationships', async () => {
    // Arrange
    const dto: CreateTaskDto = {
      title: 'Integration Test Task',
      content: 'Test content',
      priority: 'high',
      tags: ['integration', 'test'],
      related_tasks: ['issues-1', 'plans-2'],
      related_documents: ['docs-3'],
    };
    
    // Act
    const task = await dataService.createTask('issues', dto);
    
    // Assert
    // ファイルが作成されている
    const filePath = `/database/tasks/issues/issues-${task.id}.md`;
    expect(mockFileSystem.getFileContent(filePath)).toBeDefined();
    
    // タグが登録されている
    const tags = await dataService.getAllTags();
    expect(tags.map(t => t.name)).toContain('integration');
    expect(tags.map(t => t.name)).toContain('test');
    
    // 検索で見つかる
    const searchResults = await dataService.searchByTag('integration');
    expect(searchResults.tasks).toContainEqual(task);
  });
});
```

### Day 13: E2Eテストの基盤

```typescript
// src/__tests__/e2e/mcp-server.test.ts
describe('MCP Server E2E', () => {
  let server: MCPTestServer;
  
  beforeEach(async () => {
    server = new MCPTestServer({
      useInMemoryDatabase: true,
      mockFileSystem: true,
    });
    await server.start();
  });
  
  afterEach(async () => {
    await server.stop();
  });
  
  it('should handle complete task lifecycle', async () => {
    // Create
    const createResponse = await server.callTool('create_item', {
      type: 'issues',
      title: 'E2E Test Issue',
      content: 'Test content',
      priority: 'high',
    });
    
    const createdIssue = JSON.parse(createResponse.content[0].text).data;
    expect(createdIssue.id).toBeDefined();
    
    // Read
    const getResponse = await server.callTool('get_item_detail', {
      type: 'issues',
      id: createdIssue.id,
    });
    
    const retrievedIssue = JSON.parse(getResponse.content[0].text).data;
    expect(retrievedIssue).toEqual(createdIssue);
    
    // Update
    const updateResponse = await server.callTool('update_item', {
      type: 'issues',
      id: createdIssue.id,
      status: 'In Progress',
    });
    
    const updatedIssue = JSON.parse(updateResponse.content[0].text).data;
    expect(updatedIssue.status).toBe('In Progress');
    
    // Delete
    const deleteResponse = await server.callTool('delete_item', {
      type: 'issues',
      id: createdIssue.id,
    });
    
    expect(deleteResponse.content[0].text).toContain('deleted successfully');
  });
});
```

### Day 14: テストカバレッジとCI設定

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};

// .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run lints
        run: npm run lint
        
      - name: Run type checks
        run: npm run type-check
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Check coverage
        run: npm run test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 成果物

### 新規作成ファイル
1. `src/container/types.ts` - DI用の型定義
2. `src/container/container.ts` - DIコンテナ
3. `src/interfaces/*.ts` - 全インターフェース定義
4. `src/services/mock-*.ts` - モックサービス
5. `src/__tests__/helpers/*.ts` - テストヘルパー
6. `src/__tests__/unit/**/*.test.ts` - ユニットテスト
7. `src/__tests__/integration/**/*.test.ts` - 統合テスト
8. `src/__tests__/e2e/**/*.test.ts` - E2Eテスト

### 修正対象ファイル
- 全てのクラスに@injectable()デコレータ追加
- コンストラクタをDI対応に変更
- 直接的な依存を注入可能な形に変更

## 成功指標

### 定量的指標
- テストカバレッジ: 30% → 80%以上
- モック可能なクラス: 100%
- 直接的な依存: 0
- テスト実行時間: 5分以内

### 定性的指標
- 新機能追加時のテスト作成が容易
- リファクタリング時の安全性向上
- バグの早期発見

## リスクと対策

### リスク1: 過度な抽象化
- **対策**: 必要な箇所のみインターフェース化

### リスク2: テスト実行時間の増加
- **対策**: 並列実行とテストの最適化

### リスク3: 学習コスト
- **対策**: DIパターンのドキュメントとサンプル作成