# クイックスタートガイド

Shirokuma MCP Knowledge Baseをすぐに使い始めるためのガイドです。

## 前提条件

- Node.js 18以上
- npm または yarn
- MCP対応クライアント（Claude Desktop など）

## インストール

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-repo/shirokuma-mcp-knowledge-base.git
cd shirokuma-mcp-knowledge-base
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. ビルド

```bash
npm run build
```

### 4. MCP設定

MCPクライアントの設定ファイルに以下を追加します。

Claude Desktopの場合（`claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "shirokuma": {
      "command": "node",
      "args": ["/path/to/shirokuma-mcp-knowledge-base/dist/server.js"]
    }
  }
}
```

## 基本的な使い方

### 1. 最初のイシューを作成

```typescript
// MCPツール呼び出し
create_item({
  type: "issues",
  title: "最初のイシュー",
  content: "これは最初のイシューです",
  tags: ["bug", "high-priority"]
})
```

### 2. アイテムの検索

タグで検索：
```typescript
search_items_by_tag({
  tag: "bug"
})
```

全文検索：
```typescript
search_items({
  query: "最初の"
})
```

### 3. セッションの記録

作業セッションを開始：
```typescript
create_item({
  type: "sessions",
  title: "開発作業",
  content: "新機能の実装を開始"
})
```

### 4. デイリーサマリーの作成

その日の作業をまとめる：
```typescript
create_item({
  type: "dailies",
  date: "2025-01-29",
  title: "本日の成果",
  content: "- バグ修正完了\n- 新機能の設計"
})
```

## よく使うコマンド

### データの一覧表示

```typescript
// イシュー一覧
get_items({ type: "issues" })

// 最新10件のプラン
get_items({ type: "plans", limit: 10 })

// オープンなタスクのみ
get_items({ 
  type: "issues", 
  statuses: ["Open", "In Progress"] 
})
```

### データの更新

```typescript
update_item({
  type: "issues",
  id: "1",
  status: "Closed",
  tags: ["bug", "resolved"]
})
```

### タグ管理

```typescript
// 利用可能なタグ一覧
get_tags()

// 新しいタグを作成
create_tag({ name: "重要" })
```

## トラブルシューティング

### データベースエラーが発生する場合

```bash
npm run rebuild-db
```

### ファイルが見つからない場合

環境変数でデータディレクトリを指定：

```bash
export MCP_DATABASE_PATH=/path/to/your/data
```

### 接続できない場合

1. Node.jsのバージョンを確認（18以上が必要）
2. ビルドが完了しているか確認
3. パスが絶対パスで指定されているか確認

## 次のステップ

- [使い方](usage.md) - より詳細な使用方法
- [APIリファレンス](api-reference.md) - 完全なAPI仕様
- [FAQ](faq.md) - よくある質問

## サポート

問題が発生した場合は、[GitHub Issues](https://github.com/your-repo/issues)で報告してください。