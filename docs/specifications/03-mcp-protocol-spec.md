# MCPプロトコル仕様書

## 1. 概要

本書は、Shirokuma MCP Knowledge Base v0.8.0のMCP（Model Context Protocol）実装仕様を定義します。stdio通信によるAIとの対話インターフェースを提供します。

## 2. MCPプロトコル基本

### 2.1 通信方式

**プロトコル**: JSON-RPC 2.0 over stdio  
**エンコーディング**: UTF-8  
**メッセージ形式**: JSONL（JSON Lines）

### 2.2 接続フロー

```
1. クライアント → stdio → サーバー起動
2. サーバー → 初期化完了通知
3. クライアント → ツール一覧要求
4. サーバー → ツール定義送信
5. クライアント ↔ サーバー: ツール実行
```

## 3. ツール定義

### 3.1 基本CRUD操作

#### create_item
```json
{
  "name": "create_item",
  "description": "新しいアイテムを作成",
  "inputSchema": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "description": "アイテムタイプ（自由指定）"
      },
      "title": {
        "type": "string",
        "description": "タイトル"
      },
      "description": {
        "type": "string",
        "description": "概要説明"
      },
      "content": {
        "type": "string",
        "description": "詳細内容（Markdown）"
      },
      "status": {
        "type": "string",
        "description": "ステータス",
        "default": "Open"
      },
      "priority": {
        "type": "string",
        "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW", "MINIMAL"],
        "default": "MEDIUM"
      },
      "category": {
        "type": "string",
        "description": "カテゴリ"
      },
      "startDate": {
        "type": "string",
        "format": "date-time"
      },
      "endDate": {
        "type": "string",
        "format": "date-time"
      },
      "version": {
        "type": "string"
      },
      "related": {
        "type": "array",
        "items": {
          "type": "number"
        },
        "description": "関連アイテムID"
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "タグリスト"
      }
    },
    "required": ["type", "title"]
  }
}
```

#### get_item
```json
{
  "name": "get_item",
  "description": "アイテムをIDで取得",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number",
        "description": "アイテムID"
      }
    },
    "required": ["id"]
  }
}
```

#### update_item
```json
{
  "name": "update_item",
  "description": "既存アイテムを更新",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number",
        "description": "アイテムID"
      },
      "title": { "type": "string" },
      "description": { "type": "string" },
      "content": { "type": "string" },
      "status": { "type": "string" },
      "priority": {
        "type": "string",
        "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW", "MINIMAL"]
      },
      "category": { "type": "string" },
      "startDate": { "type": "string", "format": "date-time" },
      "endDate": { "type": "string", "format": "date-time" },
      "version": { "type": "string" },
      "related": {
        "type": "array",
        "items": { "type": "number" }
      },
      "tags": {
        "type": "array",
        "items": { "type": "string" }
      }
    },
    "required": ["id"]
  }
}
```

#### delete_item
```json
{
  "name": "delete_item",
  "description": "アイテムを削除",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number",
        "description": "アイテムID"
      }
    },
    "required": ["id"]
  }
}
```

### 3.2 検索操作

#### search_items
```json
{
  "name": "search_items",
  "description": "全文検索",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "検索クエリ"
      },
      "types": {
        "type": "array",
        "items": { "type": "string" },
        "description": "タイプフィルタ"
      },
      "limit": {
        "type": "number",
        "default": 20,
        "maximum": 100
      },
      "offset": {
        "type": "number",
        "default": 0
      }
    },
    "required": ["query"]
  }
}
```

#### list_items
```json
{
  "name": "list_items",
  "description": "条件指定でアイテム一覧取得",
  "inputSchema": {
    "type": "object",
    "properties": {
      "type": { "type": "string" },
      "status": {
        "type": "array",
        "items": { "type": "string" }
      },
      "priority": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW", "MINIMAL"]
        }
      },
      "tags": {
        "type": "array",
        "items": { "type": "string" }
      },
      "limit": {
        "type": "number",
        "default": 20,
        "maximum": 100
      },
      "offset": {
        "type": "number",
        "default": 0
      },
      "sortBy": {
        "type": "string",
        "enum": ["created", "updated", "priority"]
      },
      "sortOrder": {
        "type": "string",
        "enum": ["asc", "desc"]
      }
    }
  }
}
```

### 3.3 グラフ操作

#### get_related_items
```json
{
  "name": "get_related_items",
  "description": "関連アイテムを深度指定で取得",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number",
        "description": "起点アイテムID"
      },
      "depth": {
        "type": "number",
        "description": "探索深度",
        "default": 1,
        "minimum": 1,
        "maximum": 3
      },
      "types": {
        "type": "array",
        "items": { "type": "string" },
        "description": "タイプフィルタ"
      }
    },
    "required": ["id"]
  }
}
```

#### add_relations
```json
{
  "name": "add_relations",
  "description": "アイテム間の関連を追加",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sourceId": {
        "type": "number",
        "description": "起点アイテムID"
      },
      "targetIds": {
        "type": "array",
        "items": { "type": "number" },
        "description": "関連先アイテムID配列"
      }
    },
    "required": ["sourceId", "targetIds"]
  }
}
```

#### remove_relations
```json
{
  "name": "remove_relations",
  "description": "アイテム間の関連を削除",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sourceId": {
        "type": "number",
        "description": "起点アイテムID"
      },
      "targetIds": {
        "type": "array",
        "items": { "type": "number" },
        "description": "削除する関連先ID配列"
      }
    },
    "required": ["sourceId", "targetIds"]
  }
}
```

### 3.4 カレントステート操作

#### get_current_state
```json
{
  "name": "get_current_state",
  "description": "現在のシステム状態を取得",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

#### update_current_state
```json
{
  "name": "update_current_state",
  "description": "現在のシステム状態を更新",
  "inputSchema": {
    "type": "object",
    "properties": {
      "content": {
        "type": "string",
        "description": "Markdown形式の状態記述"
      },
      "related": {
        "type": "array",
        "items": { "type": "number" },
        "description": "関連アイテムID"
      },
      "tags": {
        "type": "array",
        "items": { "type": "string" },
        "description": "タグリスト"
      },
      "metadata": {
        "type": "object",
        "properties": {
          "updatedBy": {
            "type": "string",
            "description": "更新者識別子"
          },
          "context": {
            "type": "string",
            "description": "コンテキスト情報"
          }
        }
      }
    },
    "required": ["content"]
  }
}
```

### 3.5 集計・統計操作

#### get_stats
```json
{
  "name": "get_stats",
  "description": "システム統計情報を取得",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

#### get_type_stats
```json
{
  "name": "get_type_stats",
  "description": "タイプ別統計を取得",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

### 3.6 タグ操作

#### get_tags
```json
{
  "name": "get_tags",
  "description": "タグ一覧を取得",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

#### suggest_tags
```json
{
  "name": "suggest_tags",
  "description": "タグのサジェスト",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prefix": {
        "type": "string",
        "description": "プレフィックス"
      },
      "limit": {
        "type": "number",
        "default": 10,
        "maximum": 20
      }
    },
    "required": ["prefix"]
  }
}
```

## 4. メッセージフォーマット

### 4.1 リクエスト形式

```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "tools/call",
  "params": {
    "name": "create_item",
    "arguments": {
      "type": "task",
      "title": "新しいタスク",
      "description": "タスクの説明"
    }
  }
}
```

### 4.2 レスポンス形式（成功）

```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Item created successfully"
      }
    ],
    "data": {
      "id": 123,
      "type": "task",
      "title": "新しいタスク",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 4.3 レスポンス形式（エラー）

```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "field": "title",
      "error": "Title is required"
    }
  }
}
```

## 5. エラーコード

| コード | 意味 | 説明 |
|--------|------|------|
| -32700 | Parse error | JSON解析エラー |
| -32600 | Invalid Request | 不正なリクエスト |
| -32601 | Method not found | ツールが存在しない |
| -32602 | Invalid params | パラメータエラー |
| -32603 | Internal error | 内部エラー |
| -32000 | Server error | サーバーエラー |
| -32001 | Not found | アイテムが見つからない |
| -32002 | Validation error | バリデーションエラー |
| -32003 | Database error | データベースエラー |

## 6. セッション管理

### 6.1 初期化

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {},
      "prompts": {}
    },
    "clientInfo": {
      "name": "claude-desktop",
      "version": "0.7.4"
    }
  }
}
```

### 6.2 ツール一覧取得

```json
{
  "jsonrpc": "2.0",
  "id": "list-tools",
  "method": "tools/list"
}
```

### 6.3 接続終了

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/exit"
}
```

## 7. ストリーミング

大量データの転送時はストリーミング対応:

```json
{
  "jsonrpc": "2.0",
  "id": "stream-1",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Processing..."
      }
    ],
    "isPartial": true
  }
}
```

## 8. セキュリティ

### 8.1 入力検証
- 全パラメータのスキーマ検証
- SQLインジェクション対策
- XSS対策（HTMLエスケープ）

### 8.2 アクセス制御
- ローカル接続のみ（stdio）
- 外部ネットワークアクセスなし

### 8.3 データサイズ制限
- 最大ペイロード: 10MB
- 最大文字列長: 100KB
- 最大配列要素数: 1000

## 9. パフォーマンス

### 9.1 タイムアウト
- リクエストタイムアウト: 30秒
- 接続タイムアウト: 60秒
- アイドルタイムアウト: 300秒

### 9.2 並行処理
- 最大同時リクエスト: 10
- キューサイズ: 100

## 10. 実装例

### サーバー起動

```typescript
import { MCPServer } from '@modelcontextprotocol/sdk';

const server = new MCPServer({
  name: 'shirokuma-mcp-kb',
  version: '0.8.0'
});

// ツール登録
server.tool('create_item', createItemHandler);
server.tool('get_item', getItemHandler);
// ... 他のツール

// stdio起動
server.connect({
  transport: 'stdio'
});
```

### クライアント接続

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

const client = new MCPClient();

await client.connect({
  command: 'shirokuma',
  args: ['serve']
});

// ツール実行
const result = await client.callTool('create_item', {
  type: 'task',
  title: 'New Task'
});
```

## 11. テスト

### テストケース例

```typescript
describe('MCP Protocol', () => {
  it('should handle create_item request', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 'test-1',
      method: 'tools/call',
      params: {
        name: 'create_item',
        arguments: {
          type: 'task',
          title: 'Test Task'
        }
      }
    };
    
    const response = await server.handleRequest(request);
    expect(response.result).toBeDefined();
    expect(response.result.data.id).toBeGreaterThan(0);
  });
});
```

## 12. トラブルシューティング

### よくある問題

1. **接続できない**
   - サーバーが起動しているか確認
   - パスが正しいか確認
   - 権限を確認

2. **ツールが見つからない**
   - ツール名のタイポを確認
   - ツール一覧を取得して確認

3. **パラメータエラー**
   - スキーマ定義を確認
   - 必須フィールドを確認
   - データ型を確認

## 13. 今後の拡張

- バッチ操作のサポート
- イベントストリーミング
- プログレス通知
- キャンセル機能