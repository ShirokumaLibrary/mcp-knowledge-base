# API Architecture

Shirokuma MCP Knowledge BaseのAPI設計とMCPプロトコル実装について説明します。

## MCPプロトコル実装

### 概要

Model Context Protocol (MCP) は、AIモデルとツール間の標準化された通信プロトコルです。本システムはMCP SDKを使用してサーバーを実装しています。

### サーバー構成

```typescript
// src/server.ts
const server = new McpServer({
  name: 'shirokuma-knowledge-base',
  version: '0.4.2'
});

// stdioトランスポートを使用
const transport = new StdioServerTransport();
await server.connect(transport);
```

## API設計原則

### 1. 統一API

すべてのコンテンツタイプ（issues, plans, docs等）を統一的に扱う：

```typescript
// 共通のCRUD操作
get_items(type, filters)
get_item_detail(type, id)
create_item(type, data)
update_item(type, id, data)
delete_item(type, id)
```

### 2. RESTfulな命名規則

- リソースは複数形（items, tags, statuses）
- 動詞は操作を明確に表現（get, create, update, delete）
- 検索は専用エンドポイント（search_items, search_tags）

### 3. 一貫したレスポンス形式

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: string;
}
```

## ハンドラー層

### 構造

```
src/handlers/
├── base-handler.ts      # 基底クラス
├── unified-handlers.ts  # 統一CRUD操作
├── session-handlers.ts  # セッション専用
├── status-handlers.ts   # ステータス管理
├── tag-handlers.ts      # タグ管理
├── type-handlers.ts     # 型管理
├── search-handlers.ts   # 検索機能
└── summary-handlers.ts  # サマリー管理
```

### BaseHandler

すべてのハンドラーの基底クラス：

```typescript
export abstract class BaseHandler {
  protected database: Database;
  
  constructor(database: Database) {
    this.database = database;
  }
  
  protected async validateParams<T>(
    params: unknown,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    return schema.parse(params);
  }
  
  protected handleError(error: unknown): never {
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Validation error: ${error.message}`
      );
    }
    throw error;
  }
}
```

## ツール定義

### スキーマ駆動開発

Zodスキーマで入力検証：

```typescript
const CreateItemSchema = z.object({
  type: z.string(),
  title: z.string().min(1),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // ... その他のフィールド
});
```

### ツール登録

```typescript
server.addTool({
  name: 'create_item',
  description: 'Create a new item',
  inputSchema: zodToJsonSchema(CreateItemSchema),
  handler: async (params) => {
    const validated = await validateParams(params, CreateItemSchema);
    return await handlers.createItem(validated);
  }
});
```

## エラーハンドリング

### エラー階層

```typescript
// MCPエラー
throw new McpError(ErrorCode.InvalidParams, 'Invalid parameters');
throw new McpError(ErrorCode.InternalError, 'Database error');

// カスタムエラー
export class NotFoundError extends Error {
  constructor(type: string, id: string) {
    super(`${type} with id ${id} not found`);
  }
}
```

### エラーミドルウェア

```typescript
async function withErrorHandling<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error('Operation failed', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        formatZodError(error)
      );
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      'An unexpected error occurred'
    );
  }
}
```

## パフォーマンス最適化

### 1. データベース接続プーリング

```typescript
// リクエストごとに新しい接続
const db = await this.database.getConnection();
try {
  return await operation(db);
} finally {
  await db.close();
}
```

### 2. キャッシング戦略

```typescript
class CachedRepository {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5分
  
  async get(id: string): Promise<Item> {
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    
    const data = await this.repository.get(id);
    this.cache.set(id, {
      data,
      timestamp: Date.now()
    });
    return data;
  }
}
```

### 3. バッチ処理

```typescript
async function batchOperation<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await operation(batch);
    results.push(...batchResults);
  }
  
  return results;
}
```

## セキュリティ

### 入力検証

```typescript
// Zodスキーマによる自動検証
const schema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9\-_.]+$/),
  title: z.string().max(200),
  content: z.string().max(10000)
});
```

### サニタイゼーション

```typescript
function sanitizeForSQL(value: string): string {
  return value.replace(/['";\\]/g, '');
}

function sanitizeForPath(value: string): string {
  if (value.includes('..') || value.includes('/')) {
    throw new Error('Invalid path component');
  }
  return value;
}
```

### レート制限

```typescript
const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1分
  maxRequests: 100
});

server.use(async (request, next) => {
  await rateLimiter.check(request.clientId);
  return next();
});
```

## テスト戦略

### 単体テスト

```typescript
describe('UnifiedHandlers', () => {
  let handlers: UnifiedHandlers;
  let mockDb: MockDatabase;
  
  beforeEach(() => {
    mockDb = new MockDatabase();
    handlers = new UnifiedHandlers(mockDb);
  });
  
  test('should create item', async () => {
    const result = await handlers.createItem({
      type: 'issues',
      title: 'Test Issue'
    });
    
    expect(result.success).toBe(true);
    expect(result.data.id).toBeDefined();
  });
});
```

### 統合テスト

```typescript
describe('MCP Protocol Integration', () => {
  let server: TestServer;
  
  beforeAll(async () => {
    server = await TestServer.start();
  });
  
  test('should handle tool call', async () => {
    const response = await server.callTool('get_items', {
      type: 'issues'
    });
    
    expect(response).toHaveProperty('items');
  });
});
```

## 拡張性

### 新しいツールの追加

1. スキーマ定義を作成
2. ハンドラーメソッドを実装
3. server.tsでツールを登録

### カスタムタイプのサポート

動的型システムにより、実行時に新しいコンテンツタイプを追加可能：

```typescript
await typeHandler.createType({
  name: 'recipe',
  base_type: 'documents',
  description: 'Recipe management'
});
```

## ベストプラクティス

1. **常にスキーマ検証を使用**
2. **エラーは適切にラップして返す**
3. **ログを適切に記録**
4. **トランザクションで一貫性を保証**
5. **パフォーマンスメトリクスを監視**