---
id: 130
type: steering
title: "Steering: MCP API Design Standards"
status: Open
priority: HIGH
description: "MCP APIの設計規約とツール実装標準"
aiSummary: "MCP API design standards document covering tool naming conventions, CRUD operations, parameter design, response formats, error handling, search functionality, and performance considerations for MCP server implementation."
tags: ["design","api","mcp","steering","inclusion:filematch","pattern:mcp/**"]
keywords: {"api":1,"mcp":1,"design":0.9,"standards":0.9,"implementation":0.8}
concepts: {"api-design":0.9,"mcp-protocol":0.9,"software-architecture":0.8,"data-management":0.7,"error-handling":0.7}
embedding: "gICdgICAoYWAgJaAgICPgICAkYCGgKKAgICegICAkICAgIiAjYCegYKAk4CAgIuAgICYgI6Aj4CLgI2AgICQgICAiICIgIODkoCRgICAiICAgI2AgoCCipKAnICAgIGAgICZgICAg46JgKOAgICAgICAoYCEgJKMgYCggICAh4A="
createdAt: 2025-08-23T01:25:52.000Z
updatedAt: 2025-08-23T01:32:49.000Z
---

# MCP API Design Standards

## ツール命名規則
- **CRUD操作**: `create_item`, `get_item`, `update_item`, `delete_item`
- **検索**: `search_items`, `list_items`
- **関係**: `add_relations`, `get_related_items`
- **システム**: `get_stats`, `get_current_state`

## パラメータ設計
### 必須パラメータ
- 最小限の必須パラメータ
- 明確な型定義（Zodスキーマ）
- わかりやすい名前

### オプショナルパラメータ
- デフォルト値の明示
- 制限値の設定（例: limit最大100）

## レスポンス形式
```typescript
// 成功時
{
  id: number,
  type: string,
  title: string,
  // ... その他のフィールド
  createdAt: string,
  updatedAt: string
}

// エラー時
throw new McpError(
  ErrorCode.InvalidParams,
  "明確なエラーメッセージ"
)
```

## エラーコード
- **InvalidParams**: パラメータ不正
- **InternalError**: サーバーエラー
- **NotFound**: リソース未発見

## 検索API設計
### search_items
- クエリパラメータでAND/OR検索
- 日付範囲フィルター
- タイプフィルター
- ソート機能

### list_items
- ページネーション（offset/limit）
- フィルタリング（type, status）
- ソート（作成日時、更新日時）

## AI機能統合
- 自動エンリッチメント（create/update時）
- 非同期処理でレスポンス遅延回避
- エラー時の graceful degradation

## パフォーマンス考慮
- N+1クエリ防止
- 適切なインデックス使用
- バッチ処理の活用
- レスポンスサイズの制限