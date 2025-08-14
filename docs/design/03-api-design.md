# API設計書 - MCP Protocol Over Stdio

## 1. 概要

Shirokuma MCP Knowledge Base v0.8.0は、MCP (Model Context Protocol) over stdioで通信するGraphDB風データストレージです。REST APIは提供せず、MCPツールによる純粋なデータアクセスに特化しています。

## 2. 設計思想

### 2.1 基本原則

1. **stdio通信のみ**: HTTPサーバーは不要、プロセス間通信で完結
2. **純粋なデータストア**: TYPE別のビジネスロジックは一切含まない
3. **グラフ指向**: ノード（Item）と関連性（Related）の操作に特化
4. **AI中立**: 意味付けはクライアント側（AI）で管理

### 2.2 MCP通信モデル

```
┌─────────────┐    MCP Protocol    ┌─────────────┐
│   Client    │◄─────stdio───────►│   Server    │
│  (Claude)   │    JSON-RPC 2.0    │ (Shirokuma) │
└─────────────┘                    └─────────────┘
```

### 2.3 プロトコル仕様

- **Transport**: Standard Input/Output (stdio)
- **Protocol**: MCP (Model Context Protocol)
- **Encoding**: JSON-RPC 2.0
- **Message Format**: 行区切りJSON

## 3. MCPツール一覧

### 3.1 基本CRUD操作

#### 3.1.1 create_item - アイテム作成

```typescript
interface CreateItemTool {
  name: "create_item";
  description: "新しいアイテム（ノード）を作成";
  inputSchema: {
    type: "object";
    properties: {
      type: { 
        type: "string"; 
        description: "アイテムタイプ（任意の文字列）"; 
      };
      title: { 
        type: "string"; 
        description: "タイトル（必須）"; 
      };
      description: { 
        type: "string"; 
        description: "説明（デフォルト: 空文字）"; 
      };
      content: { 
        type: "string"; 
        description: "内容（Markdown、デフォルト: 空文字）"; 
      };
      status: { 
        type: "string"; 
        description: "ステータス名（デフォルト: 'Open'）"; 
      };
      priority: { 
        type: "string"; 
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "MINIMAL"];
        description: "優先度（デフォルト: 'MEDIUM'）"; 
      };
      category: { 
        type: "string"; 
        description: "カテゴリー（オプション）"; 
      };
      start_date: { 
        type: "string"; 
        format: "date-time";
        description: "開始日時（オプション）"; 
      };
      end_date: { 
        type: "string"; 
        format: "date-time";
        description: "終了日時（オプション）"; 
      };
      version: { 
        type: "string"; 
        description: "バージョン（オプション）"; 
      };
      related: { 
        type: "array"; 
        items: { type: "string" };
        description: "関連アイテムID配列（例: ['items-1', 'items-2']）"; 
      };
      tags: { 
        type: "array"; 
        items: { type: "string" };
        description: "タグ配列"; 
      };
    };
    required: ["type", "title"];
  };
}

// 応答例
interface CreateItemResponse {
  id: number;
  type: string;
  title: string;
  // ... 完全なItemオブジェクト
  created_at: string;
  updated_at: string;
}
```

#### 3.1.2 get_item_detail - アイテム取得

```typescript
interface GetItemDetailTool {
  name: "get_item_detail";
  description: "IDとタイプによるアイテム詳細取得";
  inputSchema: {
    type: "object";
    properties: {
      type: { 
        type: "string"; 
        description: "アイテムタイプ"; 
      };
      id: { 
        type: "number"; 
        description: "アイテムID"; 
      };
    };
    required: ["type", "id"];
  };
}

// 内部実装: type-idからnumeric IDに変換
// "items-123" → 123, "docs-456" → 456
```

#### 3.1.3 get_items - アイテム一覧取得

```typescript
interface GetItemsTool {
  name: "get_items";
  description: "フィルター条件によるアイテム一覧取得";
  inputSchema: {
    type: "object";
    properties: {
      type: { 
        type: "string"; 
        description: "アイテムタイプフィルター"; 
      };
      statuses: { 
        type: "array"; 
        items: { type: "string" };
        description: "ステータス名配列（OR条件）"; 
      };
      includeClosedStatuses: { 
        type: "boolean"; 
        description: "終了状態を含めるか（デフォルト: false）"; 
      };
      limit: { 
        type: "number"; 
        description: "取得件数上限（デフォルト: 20、最大: 100）"; 
      };
      start_date: { 
        type: "string"; 
        format: "date";
        description: "更新日時の開始範囲（YYYY-MM-DD）"; 
      };
      end_date: { 
        type: "string"; 
        format: "date";
        description: "更新日時の終了範囲（YYYY-MM-DD）"; 
      };
    };
    required: ["type"];
  };
}
```

#### 3.1.4 update_item - アイテム更新

```typescript
interface UpdateItemTool {
  name: "update_item";
  description: "既存アイテムの更新";
  inputSchema: {
    type: "object";
    properties: {
      type: { type: "string"; };
      id: { type: "number"; };
      title: { type: "string"; };
      description: { type: "string"; };
      content: { type: "string"; };
      status: { type: "string"; };
      priority: { 
        type: "string"; 
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "MINIMAL"];
      };
      category: { type: "string"; };
      start_date: { type: "string"; format: "date-time"; };
      end_date: { type: "string"; format: "date-time"; };
      version: { type: "string"; };
      related: { 
        type: "array"; 
        items: { type: "string" };
      };
      tags: { 
        type: "array"; 
        items: { type: "string" };
      };
    };
    required: ["type", "id"];
  };
}
```

#### 3.1.5 delete_item - アイテム削除

```typescript
interface DeleteItemTool {
  name: "delete_item";
  description: "アイテムの削除";
  inputSchema: {
    type: "object";
    properties: {
      type: { type: "string"; };
      id: { type: "number"; };
    };
    required: ["type", "id"];
  };
}
```

### 3.2 検索操作

#### 3.2.1 search_items - 全文検索

```typescript
interface SearchItemsTool {
  name: "search_items";
  description: "タイトル・説明・内容の全文検索";
  inputSchema: {
    type: "object";
    properties: {
      query: { 
        type: "string"; 
        description: "検索クエリ"; 
      };
      types: { 
        type: "array"; 
        items: { type: "string" };
        description: "検索対象タイプ配列（省略時は全タイプ）"; 
      };
      limit: { 
        type: "number"; 
        description: "取得件数上限（デフォルト: 20、最大: 100）"; 
      };
      offset: { 
        type: "number"; 
        description: "検索結果のオフセット（デフォルト: 0）"; 
      };
    };
    required: ["query"];
  };
}
```

#### 3.2.2 search_suggest - 検索サジェスト

```typescript
interface SearchSuggestTool {
  name: "search_suggest";
  description: "検索クエリの補完候補取得";
  inputSchema: {
    type: "object";
    properties: {
      query: { 
        type: "string"; 
        description: "部分検索クエリ"; 
      };
      types: { 
        type: "array"; 
        items: { type: "string" };
        description: "検索対象タイプ配列"; 
      };
      limit: { 
        type: "number"; 
        description: "サジェスト件数（デフォルト: 10、最大: 20）"; 
      };
    };
    required: ["query"];
  };
}
```

### 3.3 グラフ操作

#### 3.3.1 get_related_items - 関連アイテム取得

```typescript
interface GetRelatedItemsTool {
  name: "get_related_items";
  description: "指定アイテムの関連アイテムを探索";
  inputSchema: {
    type: "object";
    properties: {
      type: { type: "string"; };
      id: { type: "number"; };
      depth: { 
        type: "number"; 
        description: "探索深度（デフォルト: 1、最大: 3）"; 
      };
      max_results: { 
        type: "number"; 
        description: "最大取得件数（デフォルト: 50）"; 
      };
    };
    required: ["type", "id"];
  };
}

// 応答例
interface RelatedItemsResponse {
  center_item: Item;
  related_items: Array<{
    item: Item;
    distance: number;      // 中心からの距離
    relationship: string;  // "direct" | "indirect"
  }>;
  graph_stats: {
    total_nodes: number;
    total_edges: number;
    max_depth: number;
  };
}
```

#### 3.3.2 find_path - パス探索

```typescript
interface FindPathTool {
  name: "find_path";
  description: "2つのアイテム間の関連パスを探索";
  inputSchema: {
    type: "object";
    properties: {
      from_type: { type: "string"; };
      from_id: { type: "number"; };
      to_type: { type: "string"; };
      to_id: { type: "number"; };
      max_depth: { 
        type: "number"; 
        description: "最大探索深度（デフォルト: 5）"; 
      };
    };
    required: ["from_type", "from_id", "to_type", "to_id"];
  };
}

// 応答例
interface PathResponse {
  paths: Array<{
    items: Item[];
    length: number;
    weight: number;  // パスの重み（距離の逆数）
  }>;
  shortest_path_length: number;
  total_paths_found: number;
}
```

### 3.4 タグ・ステータス管理

#### 3.4.1 get_tags - タグ一覧取得

```typescript
interface GetTagsTool {
  name: "get_tags";
  description: "全タグ一覧の取得";
  inputSchema: {
    type: "object";
    properties: {};
  };
}
```

#### 3.4.2 search_items_by_tag - タグ検索

```typescript
interface SearchItemsByTagTool {
  name: "search_items_by_tag";
  description: "指定タグによるアイテム検索";
  inputSchema: {
    type: "object";
    properties: {
      tag: { 
        type: "string"; 
        description: "検索対象タグ名"; 
      };
      types: { 
        type: "array"; 
        items: { type: "string" };
        description: "検索対象タイプ配列"; 
      };
    };
    required: ["tag"];
  };
}
```

#### 3.4.3 get_statuses - ステータス一覧取得

```typescript
interface GetStatusesTool {
  name: "get_statuses";
  description: "全ステータス一覧の取得";
  inputSchema: {
    type: "object";
    properties: {};
  };
}
```

### 3.5 現在状態管理

#### 3.5.1 get_current_state - 現在状態取得

```typescript
interface GetCurrentStateTool {
  name: "get_current_state";
  description: "プロジェクト現在状態の取得";
  inputSchema: {
    type: "object";
    properties: {};
  };
}

// 応答例
interface CurrentStateResponse {
  content: string;        // Markdown形式
  metadata: {
    updated_by: string;   // 最終更新者
    updated_at: string;   // 最終更新日時
    related: string[];    // 関連アイテムID配列
    tags: string[];       // タグ配列
  };
}
```

#### 3.5.2 update_current_state - 現在状態更新

```typescript
interface UpdateCurrentStateTool {
  name: "update_current_state";
  description: "プロジェクト現在状態の更新";
  inputSchema: {
    type: "object";
    properties: {
      content: { 
        type: "string"; 
        description: "状態内容（Markdown形式）"; 
      };
      updated_by: { 
        type: "string"; 
        description: "更新者（例: 'ai-start', 'ai-finish'）"; 
      };
      related: { 
        type: "array"; 
        items: { type: "string" };
        description: "関連アイテムID配列"; 
      };
      tags: { 
        type: "array"; 
        items: { type: "string" };
        description: "タグ配列"; 
      };
    };
    required: ["content"];
  };
}
```

### 3.6 高度な操作

#### 3.6.1 change_item_type - タイプ変更

```typescript
interface ChangeItemTypeTool {
  name: "change_item_type";
  description: "アイテムのタイプを変更（新IDで再作成）";
  inputSchema: {
    type: "object";
    properties: {
      from_type: { type: "string"; };
      from_id: { type: "number"; };
      to_type: { 
        type: "string"; 
        description: "変更先タイプ"; 
      };
    };
    required: ["from_type", "from_id", "to_type"];
  };
}

// 内部処理:
// 1. 元アイテムの全データを取得
// 2. 新タイプで新アイテム作成
// 3. 関連アイテムのrelated配列を更新
// 4. 元アイテムを削除
```

#### 3.6.2 bulk_update - 一括更新

```typescript
interface BulkUpdateTool {
  name: "bulk_update";
  description: "複数アイテムの一括更新";
  inputSchema: {
    type: "object";
    properties: {
      updates: {
        type: "array";
        items: {
          type: "object";
          properties: {
            type: { type: "string"; };
            id: { type: "number"; };
            data: {
              type: "object";
              // update_itemと同じフィールド定義
            };
          };
          required: ["type", "id", "data"];
        };
      };
    };
    required: ["updates"];
  };
}
```

## 4. エラーハンドリング

### 4.1 標準エラーレスポンス

```typescript
interface MCPError {
  code: number;
  message: string;
  data?: {
    type: string;
    details: any;
    timestamp: string;
  };
}

// エラーコード定義
const ERROR_CODES = {
  // 一般エラー
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  
  // アプリケーションエラー
  ITEM_NOT_FOUND: 1001,
  VALIDATION_ERROR: 1002,
  DATABASE_ERROR: 1003,
  CONSTRAINT_VIOLATION: 1004,
  PERMISSION_DENIED: 1005
} as const;
```

### 4.2 具体的なエラー例

```typescript
// アイテム未発見エラー
{
  "code": 1001,
  "message": "Item not found",
  "data": {
    "type": "ItemNotFoundError",
    "details": {
      "type": "docs",
      "id": 999,
      "requested_id": "docs-999"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// バリデーションエラー
{
  "code": 1002,
  "message": "Validation failed",
  "data": {
    "type": "ValidationError",
    "details": {
      "field": "title",
      "value": "",
      "constraint": "Title is required and must not be empty"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// データベース制約違反
{
  "code": 1004,
  "message": "Constraint violation",
  "data": {
    "type": "ConstraintViolationError",
    "details": {
      "constraint": "fk_items_status_id",
      "message": "Referenced status does not exist"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## 5. パフォーマンス設計

### 5.1 応答時間目標

| 操作種別 | 目標応答時間 | 最大許容時間 |
|----------|-------------|-------------|
| 単一アイテム取得 | < 10ms | < 50ms |
| アイテム一覧取得 | < 50ms | < 200ms |
| 全文検索 | < 100ms | < 500ms |
| グラフ探索（深度1） | < 100ms | < 300ms |
| グラフ探索（深度3） | < 300ms | < 1000ms |

### 5.2 最適化戦略

#### 5.2.1 クエリ最適化

```typescript
class OptimizedQueryBuilder {
  // フィルター条件を効率的なSQLに変換
  buildWhereClause(filter: ItemFilter): Prisma.ItemWhereInput {
    const where: Prisma.ItemWhereInput = {};

    // インデックス使用を意識した条件構築
    if (filter.type) {
      where.type = filter.type; // idx_items_type使用
    }

    if (filter.statuses?.length) {
      where.status = {
        name: { in: filter.statuses } // idx_items_status使用
      };
    }

    if (filter.dateRange) {
      where.AND = [
        filter.dateRange.start && {
          updatedAt: { gte: filter.dateRange.start }
        },
        filter.dateRange.end && {
          updatedAt: { lte: filter.dateRange.end }
        }
      ].filter(Boolean); // idx_items_updated使用
    }

    return where;
  }

  // 必要なフィールドのみ選択
  buildSelect(includeContent: boolean = false): Prisma.ItemSelect {
    const base = {
      id: true,
      type: true,
      title: true,
      status: { select: { name: true } },
      priority: true,
      createdAt: true,
      updatedAt: true
    };

    if (includeContent) {
      return {
        ...base,
        description: true,
        content: true,
        category: true,
        startDate: true,
        endDate: true,
        version: true,
        related: true,
        tags: {
          select: {
            tag: { select: { name: true } }
          }
        }
      };
    }

    return base;
  }
}
```

#### 5.2.2 キャッシュ戦略

```typescript
class ResponseCache {
  private cache = new Map<string, CachedResponse>();
  private readonly TTL = 60000; // 1分

  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // よくアクセスされるデータのキー生成
  static buildKey(operation: string, params: any): string {
    return `${operation}:${JSON.stringify(params)}`;
  }
}

// 使用例
class ItemService {
  async getItem(type: string, id: number): Promise<Item> {
    const cacheKey = ResponseCache.buildKey('get_item', { type, id });
    const cached = await this.cache.get<Item>(cacheKey);
    
    if (cached) return cached;

    const item = await this.repository.findById(id);
    if (item) {
      this.cache.set(cacheKey, item);
    }

    return item;
  }
}
```

### 5.3 並行処理設計

```typescript
class ConcurrentRequestHandler {
  private activeRequests = new Map<string, Promise<any>>();

  async handleRequest<T>(
    requestId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // 同一リクエストの重複実行を防ぐ
    const existing = this.activeRequests.get(requestId);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = operation()
      .finally(() => {
        this.activeRequests.delete(requestId);
      });

    this.activeRequests.set(requestId, promise);
    return promise;
  }

  // 関連データの並列取得
  async getItemWithRelated(id: number): Promise<ItemWithRelated> {
    const [item, relatedItems, tags] = await Promise.all([
      this.getItem(id),
      this.getRelatedItems(id),
      this.getItemTags(id)
    ]);

    return {
      ...item,
      relatedItems,
      tags
    };
  }
}
```

## 6. セキュリティ設計

### 6.1 入力検証

```typescript
class InputValidator {
  validateCreateItem(data: CreateItemInput): void {
    // 必須フィールド検証
    if (!data.title?.trim()) {
      throw new ValidationError('Title is required');
    }

    // 長さ制限
    if (data.title.length > 200) {
      throw new ValidationError('Title too long (max 200 characters)');
    }

    if (data.content && data.content.length > 102400) {
      throw new ValidationError('Content too long (max 100KB)');
    }

    // データ型検証
    if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
      throw new ValidationError('Invalid priority value');
    }

    // サニタイゼーション
    data.title = this.sanitizeString(data.title);
    data.description = this.sanitizeString(data.description || '');
  }

  private sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // HTMLタグ除去
      .trim()
      .substring(0, 1000);   // 最大長制限
  }
}
```

### 6.2 アクセス制御

```typescript
// v0.8.0はローカル単一ユーザーのため基本的な制限のみ
class AccessControl {
  validateLocalAccess(): void {
    // プロセス実行ユーザーの確認
    const currentUser = os.userInfo();
    if (!currentUser.uid) {
      throw new PermissionError('Root execution not allowed');
    }
  }

  validateDatabasePath(dbPath: string): void {
    // データベースファイルパスの安全性確認
    const resolvedPath = path.resolve(dbPath);
    const dataDir = path.resolve('./data');
    
    if (!resolvedPath.startsWith(dataDir)) {
      throw new PermissionError('Database path outside allowed directory');
    }
  }

  validateFileAccess(filePath: string): void {
    // ファイルアクセス権限の確認
    try {
      fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      throw new PermissionError('Insufficient file permissions');
    }
  }
}
```

## 7. 拡張性設計

### 7.1 プラグインAPI

```typescript
interface MCPToolPlugin {
  name: string;
  version: string;
  description: string;
  tools: MCPToolDefinition[];
  initialize(context: PluginContext): Promise<void>;
  cleanup(): Promise<void>;
}

class PluginManager {
  private plugins = new Map<string, MCPToolPlugin>();

  async registerPlugin(plugin: MCPToolPlugin): Promise<void> {
    // プラグイン登録とツール追加
    await plugin.initialize(this.createContext());
    this.plugins.set(plugin.name, plugin);
    
    // MCPツールレジストリに追加
    for (const tool of plugin.tools) {
      this.toolRegistry.register(tool);
    }
  }

  private createContext(): PluginContext {
    return {
      database: this.db,
      logger: this.logger,
      config: this.config
    };
  }
}

// プラグイン例: カスタム検索機能
class SemanticSearchPlugin implements MCPToolPlugin {
  name = "semantic_search";
  version = "1.0.0";
  description = "AI-powered semantic search";
  
  tools = [{
    name: "semantic_search",
    description: "Semantic similarity search using embeddings",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number", default: 10 }
      },
      required: ["query"]
    }
  }];

  async initialize(context: PluginContext): Promise<void> {
    // 埋め込みモデルの初期化など
  }

  async cleanup(): Promise<void> {
    // リソースクリーンアップ
  }
}
```

## 8. 監視・ログ設計

### 8.1 構造化ログ

```typescript
interface MCPOperationLog {
  timestamp: string;
  operation: string;
  request_id: string;
  tool_name: string;
  parameters: any;
  response_time_ms: number;
  success: boolean;
  error?: string;
  user_info?: {
    process_id: number;
    working_directory: string;
  };
}

class MCPLogger {
  log(operation: string, data: Partial<MCPOperationLog>): void {
    const logEntry: MCPOperationLog = {
      timestamp: new Date().toISOString(),
      operation,
      request_id: this.generateRequestId(),
      response_time_ms: 0,
      success: true,
      ...data
    };

    console.log(JSON.stringify(logEntry));
  }

  logToolExecution<T>(
    toolName: string,
    parameters: any,
    execution: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    return execution()
      .then(result => {
        this.log('tool_execution', {
          request_id: requestId,
          tool_name: toolName,
          parameters,
          response_time_ms: Date.now() - startTime,
          success: true
        });
        return result;
      })
      .catch(error => {
        this.log('tool_execution', {
          request_id: requestId,
          tool_name: toolName,
          parameters,
          response_time_ms: Date.now() - startTime,
          success: false,
          error: error.message
        });
        throw error;
      });
  }
}
```

## 9. まとめ

本API設計では、以下を実現しています：

1. **純粋なMCP通信**: stdio経由のJSON-RPC 2.0プロトコル
2. **GraphDB風操作**: ノードとエッジを中心とした直感的なAPI
3. **高性能**: 適切なキャッシュとクエリ最適化
4. **拡張性**: プラグインによる機能追加
5. **安全性**: 入力検証とアクセス制御

MCPプロトコルの特性を活かし、AI クライアントとの効率的な通信を実現する設計となっています。