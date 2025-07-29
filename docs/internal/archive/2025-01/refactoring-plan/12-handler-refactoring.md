# ハンドラー層の改善計画

## 概要
ハンドラー層の責任を明確にし、44行のswitch文を解消して、テスタブルで拡張可能な構造に改善します。

## 現状の問題点

### 主要な問題
1. **巨大なswitch文** - server.tsのhandleToolCallメソッドが44行
2. **直接的な依存** - ハンドラーがデータベースに直接依存
3. **重複コード** - 各ハンドラーで同様のバリデーション、レスポンス生成
4. **エラーハンドリング不足** - 多くのハンドラーで未実装
5. **テスタビリティ** - 直接的な依存により単体テスト困難

### ハンドラー別分析
| ハンドラー | 行数 | メソッド数 | 主な問題 |
|-----------|------|------------|----------|
| ItemHandlers | 335 | 8 | 型チェック重複、エラーハンドリング不足 |
| SessionHandlers | 287 | 7 | console.log使用、エラーハンドリングなし |
| TagHandlers | 124 | 4 | エラーハンドリングなし |
| StatusHandlers | 98 | 2 | エラーハンドリングなし |

## 改善後のアーキテクチャ

```
┌─────────────────────────────────────────────┐
│            MCP Server                        │
│  ┌─────────────────────────────────────┐   │
│  │         ToolRegistry                 │   │
│  │  - Tool registration                 │   │
│  │  - Handler routing                   │   │
│  └─────────────┬───────────────────────┘   │
└────────────────┼────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Handler Layer                        │
│  ┌──────────────────────────────────────┐   │
│  │      BaseHandler (Abstract)          │   │
│  │  - Validation                        │   │
│  │  - Error handling                    │   │
│  │  - Response formatting               │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
│  ┌──────────────▼────────────────────────┐  │
│  │   ItemHandler   SessionHandler  etc.  │  │
│  │   - Business logic only               │  │
│  └──────────────┬────────────────────────┘  │
└─────────────────┼────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────┐
│          Service Layer                        │
│   DataService, SessionService, etc.          │
└──────────────────────────────────────────────┘
```

## 実装詳細

### 1. ToolRegistry（ルーティング層）

```typescript
// src/server/tool-registry.ts
export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodSchema<any>;
  handler: IToolHandler;
}

@injectable()
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();
  
  constructor(
    @inject(TYPES.Logger) private logger: Logger
  ) {}
  
  register(definition: ToolDefinition): void {
    if (this.tools.has(definition.name)) {
      throw new Error(`Tool ${definition.name} already registered`);
    }
    
    this.tools.set(definition.name, definition);
    this.logger.info(`Tool registered: ${definition.name}`);
  }
  
  async handleToolCall(
    toolName: string, 
    args: unknown
  ): Promise<ToolResponse> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${toolName}`
      );
    }
    
    // 入力バリデーション
    const validatedArgs = await this.validateArgs(tool.schema, args);
    
    // ハンドラー実行
    return tool.handler.handle(validatedArgs);
  }
  
  private async validateArgs(
    schema: z.ZodSchema<any>,
    args: unknown
  ): Promise<any> {
    try {
      return await schema.parseAsync(args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          'Invalid arguments',
          { errors: error.errors }
        );
      }
      throw error;
    }
  }
  
  getAllTools(): ToolInfo[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.schema),
    }));
  }
}
```

### 2. BaseHandler（共通処理の抽象化）

```typescript
// src/handlers/base-handler.ts
export interface IToolHandler {
  handle(args: any): Promise<ToolResponse>;
}

@injectable()
export abstract class BaseHandler implements IToolHandler {
  constructor(
    @inject(TYPES.Logger) protected logger: Logger,
    @inject(TYPES.ErrorHandler) protected errorHandler: ErrorHandler
  ) {}
  
  async handle(args: any): Promise<ToolResponse> {
    const context = this.getContext();
    const startTime = Date.now();
    
    try {
      // プリ処理
      await this.preProcess(args);
      
      // ビジネスロジック実行
      const result = await this.execute(args);
      
      // ポスト処理
      await this.postProcess(result);
      
      // レスポンス生成
      return this.formatResponse(result);
    } catch (error) {
      this.logger.error(`Handler error in ${context}`, {
        error,
        args,
        duration: Date.now() - startTime,
      });
      
      // エラーハンドリング
      return this.handleError(error);
    } finally {
      // メトリクス記録
      this.recordMetrics(context, Date.now() - startTime);
    }
  }
  
  protected async preProcess(args: any): Promise<void> {
    // デフォルトは何もしない
  }
  
  protected async postProcess(result: any): Promise<void> {
    // デフォルトは何もしない
  }
  
  protected formatResponse(result: any): ToolResponse {
    return ResponseFormatter.success(result);
  }
  
  protected handleError(error: unknown): ToolResponse {
    const baseError = this.errorHandler.normalize(error);
    return ResponseFormatter.error(baseError);
  }
  
  protected recordMetrics(context: string, duration: number): void {
    // メトリクス記録（将来実装）
  }
  
  protected abstract getContext(): string;
  protected abstract execute(args: any): Promise<any>;
}
```

### 3. 具体的なハンドラー実装

```typescript
// src/handlers/item/get-items-handler.ts
@injectable()
export class GetItemsHandler extends BaseHandler {
  constructor(
    @inject(TYPES.DataService) private dataService: IDataService,
    @inject(TYPES.TypeValidator) private typeValidator: ITypeValidator,
    @inject(TYPES.Logger) logger: Logger,
    @inject(TYPES.ErrorHandler) errorHandler: ErrorHandler
  ) {
    super(logger, errorHandler);
  }
  
  protected getContext(): string {
    return 'GetItemsHandler';
  }
  
  protected async execute(args: GetItemsArgs): Promise<any> {
    // 型の検証
    await this.typeValidator.validate(args.type);
    
    // データ取得
    const items = await this.dataService.getItems(
      args.type,
      {
        includeClosedStatuses: args.includeClosedStatuses,
        statusIds: args.statusIds,
      }
    );
    
    return items;
  }
}

// src/handlers/item/create-item-handler.ts
@injectable()
export class CreateItemHandler extends BaseHandler {
  constructor(
    @inject(TYPES.DataService) private dataService: IDataService,
    @inject(TYPES.TypeValidator) private typeValidator: ITypeValidator,
    @inject(TYPES.EventBus) private eventBus: IEventBus,
    @inject(TYPES.Logger) logger: Logger,
    @inject(TYPES.ErrorHandler) errorHandler: ErrorHandler
  ) {
    super(logger, errorHandler);
  }
  
  protected getContext(): string {
    return 'CreateItemHandler';
  }
  
  protected async preProcess(args: CreateItemArgs): Promise<void> {
    // 型の検証
    await this.typeValidator.validate(args.type);
    
    // ビジネスルールの検証
    if (args.type === 'tasks' && args.priority && 
        !['high', 'medium', 'low'].includes(args.priority)) {
      throw new ValidationError('Invalid priority value');
    }
  }
  
  protected async execute(args: CreateItemArgs): Promise<any> {
    const item = await this.dataService.createItem(args.type, args);
    return item;
  }
  
  protected async postProcess(item: any): Promise<void> {
    // イベント発火
    await this.eventBus.emit('item:created', {
      type: item.type,
      id: item.id,
      item,
    });
  }
  
  protected formatResponse(item: any): ToolResponse {
    return ResponseFormatter.created(item, item.type);
  }
}
```

### 4. ハンドラー登録の改善

```typescript
// src/server/handler-registration.ts
@injectable()
export class HandlerRegistration {
  constructor(
    @inject(TYPES.ToolRegistry) private registry: ToolRegistry,
    @inject(TYPES.Container) private container: Container
  ) {}
  
  registerAll(): void {
    // Item handlers
    this.registerItemHandlers();
    
    // Session handlers
    this.registerSessionHandlers();
    
    // Tag handlers
    this.registerTagHandlers();
    
    // Status handlers
    this.registerStatusHandlers();
    
    // Type handlers
    this.registerTypeHandlers();
  }
  
  private registerItemHandlers(): void {
    this.registry.register({
      name: 'get_items',
      description: 'Get list of items by type',
      schema: GetItemsSchema,
      handler: this.container.get<IToolHandler>(TYPES.GetItemsHandler),
    });
    
    this.registry.register({
      name: 'get_item_detail',
      description: 'Get detailed information for specified item',
      schema: GetItemDetailSchema,
      handler: this.container.get<IToolHandler>(TYPES.GetItemDetailHandler),
    });
    
    this.registry.register({
      name: 'create_item',
      description: 'Create new item',
      schema: CreateItemSchema,
      handler: this.container.get<IToolHandler>(TYPES.CreateItemHandler),
    });
    
    // ... 他のアイテムハンドラー
  }
  
  private registerSessionHandlers(): void {
    this.registry.register({
      name: 'get_sessions',
      description: 'Get work sessions',
      schema: GetSessionsSchema,
      handler: this.container.get<IToolHandler>(TYPES.GetSessionsHandler),
    });
    
    // ... 他のセッションハンドラー
  }
}
```

### 5. 改善されたserver.ts

```typescript
// src/server.ts
@injectable()
export class MCPServer {
  constructor(
    @inject(TYPES.ToolRegistry) private toolRegistry: ToolRegistry,
    @inject(TYPES.HandlerRegistration) private registration: HandlerRegistration,
    @inject(TYPES.Logger) private logger: Logger
  ) {}
  
  async initialize(): Promise<void> {
    // ハンドラーの登録
    this.registration.registerAll();
    
    this.logger.info('MCP Server initialized', {
      toolCount: this.toolRegistry.getAllTools().length,
    });
  }
  
  async handleToolCall(
    toolName: string,
    args: unknown
  ): Promise<ToolResponse> {
    // ToolRegistryに委譲（44行→1行）
    return this.toolRegistry.handleToolCall(toolName, args);
  }
  
  getTools(): ToolInfo[] {
    return this.toolRegistry.getAllTools();
  }
}
```

## ハンドラー分割戦略

### ItemHandlers（335行）の分割

現在1つのクラスに8つのメソッドが混在している状態を、個別のハンドラーに分割：

1. `GetItemsHandler` - アイテムリスト取得
2. `GetItemDetailHandler` - アイテム詳細取得
3. `CreateItemHandler` - アイテム作成
4. `UpdateItemHandler` - アイテム更新
5. `DeleteItemHandler` - アイテム削除
6. `SearchItemsByTagHandler` - タグ検索

各ハンドラーは50-70行程度に収まり、単一責任を持つ。

### SessionHandlers（287行）の分割

1. `GetSessionsHandler` - セッション一覧取得
2. `GetSessionDetailHandler` - セッション詳細取得
3. `GetLatestSessionHandler` - 最新セッション取得
4. `CreateSessionHandler` - セッション作成
5. `UpdateSessionHandler` - セッション更新
6. `SearchSessionsByTagHandler` - タグ検索

## テスト戦略

### ハンドラーのテスト

```typescript
describe('CreateItemHandler', () => {
  let handler: CreateItemHandler;
  let mockDataService: jest.Mocked<IDataService>;
  let mockTypeValidator: jest.Mocked<ITypeValidator>;
  let mockEventBus: jest.Mocked<IEventBus>;
  
  beforeEach(() => {
    mockDataService = createMock<IDataService>();
    mockTypeValidator = createMock<ITypeValidator>();
    mockEventBus = createMock<IEventBus>();
    
    handler = new CreateItemHandler(
      mockDataService,
      mockTypeValidator,
      mockEventBus,
      createMockLogger(),
      new ErrorHandler(createMockLogger())
    );
  });
  
  describe('execute', () => {
    it('should create item successfully', async () => {
      // Arrange
      const args = { type: 'issues', title: 'Test Issue' };
      const expectedItem = { id: 1, ...args };
      
      mockTypeValidator.validate.mockResolvedValue(true);
      mockDataService.createItem.mockResolvedValue(expectedItem);
      mockEventBus.emit.mockResolvedValue(undefined);
      
      // Act
      const response = await handler.handle(args);
      
      // Assert
      expect(response).toEqual(
        ResponseFormatter.created(expectedItem, 'issues')
      );
      expect(mockEventBus.emit).toHaveBeenCalledWith('item:created', {
        type: 'issues',
        id: 1,
        item: expectedItem,
      });
    });
    
    it('should handle validation errors', async () => {
      // Arrange
      const args = { type: 'invalid-type', title: 'Test' };
      mockTypeValidator.validate.mockRejectedValue(
        new ValidationError('Unknown type: invalid-type')
      );
      
      // Act
      const response = await handler.handle(args);
      
      // Assert
      expect(response).toEqual(
        ResponseFormatter.error(
          new ValidationError('Unknown type: invalid-type')
        )
      );
      expect(mockDataService.createItem).not.toHaveBeenCalled();
    });
  });
});
```

## 成功指標

### Before
- server.ts: 44行のswitch文
- ハンドラー総行数: 844行
- 直接的な依存: 多数
- テスタビリティ: 低

### After
- server.ts: 簡潔な委譲のみ
- 各ハンドラー: 50-70行
- 依存性注入: 100%
- テスタビリティ: 高

## リスクと対策

### リスク1: ハンドラー数の増加
- **対策**: 命名規則とディレクトリ構造で整理

### リスク2: ボイラープレートコード
- **対策**: BaseHandlerで共通処理を吸収

### リスク3: パフォーマンスオーバーヘッド
- **対策**: DIコンテナのシングルトン管理