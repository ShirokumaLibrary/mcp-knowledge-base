# Database Design

Shirokuma MCP Knowledge Baseのデータベース設計について説明します。

## 概要

システムは二重ストレージアーキテクチャを採用しています：

1. **Markdownファイル**: 永続的なデータストレージ（真実の源）
2. **SQLite**: 高速検索用のインデックス（再構築可能）

## SQLiteスキーマ

### itemsテーブル

すべてのコンテンツタイプを統一的に管理するメインテーブル：

```sql
CREATE TABLE items (
  type TEXT NOT NULL,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  priority TEXT,
  status_id INTEGER,
  start_date TEXT,
  end_date TEXT,
  start_time TEXT,
  tags TEXT,  -- JSON array
  related TEXT,  -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (type, id)
);
```

### statusesテーブル

ステータス管理：

```sql
CREATE TABLE statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_closed BOOLEAN DEFAULT 0
);
```

### tagsテーブル

タグマスター：

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
```

### item_tagsテーブル

アイテムとタグの関連：

```sql
CREATE TABLE item_tags (
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (item_type, item_id, tag_id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

### related_itemsテーブル

アイテム間の関連：

```sql
CREATE TABLE related_items (
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  PRIMARY KEY (source_type, source_id, target_type, target_id)
);
```

### sequencesテーブル

ID生成用シーケンス：

```sql
CREATE TABLE sequences (
  type TEXT PRIMARY KEY,
  current_value INTEGER NOT NULL DEFAULT 0,
  base_type TEXT DEFAULT 'tasks',
  description TEXT
);
```

### search_itemsテーブル（FTS5）

全文検索用：

```sql
CREATE VIRTUAL TABLE search_items USING fts5(
  type,
  id,
  title,
  content,
  tags
);
```

## Markdownファイル構造

### ファイル名規則

```
{type}-{id}.md
```

例：
- `issues-1.md`
- `plans-42.md`
- `docs-100.md`

### ディレクトリ構造

```
.shirokuma/data/
├── issues/
│   ├── issues-1.md
│   └── issues-2.md
├── plans/
├── docs/
├── knowledge/
├── sessions/
│   └── 2025-01-29/
│       └── session-2025-01-29-10.30.15.123.md
├── dailies/
│   └── daily-2025-01-29.md
└── search.db
```

### Markdownフォーマット

```markdown
---json
{
  "id": "1",
  "title": "タイトル",
  "description": "説明",
  "tags": ["tag1", "tag2"],
  "status": "Open",
  "priority": "high",
  "related_tasks": ["issues-2", "plans-3"],
  "related_documents": ["docs-1"],
  "created_at": "2025-01-29T10:00:00Z",
  "updated_at": "2025-01-29T10:00:00Z"
}
---

コンテンツ本文
```

## インデックス戦略

### プライマリインデックス

- `items`: (type, id) - 複合主キー
- `statuses`: id, name（UNIQUE）
- `tags`: id, name（UNIQUE）

### セカンダリインデックス

```sql
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_status ON items(status_id);
CREATE INDEX idx_items_updated ON items(updated_at);
CREATE INDEX idx_item_tags_tag ON item_tags(tag_id);
```

## データ整合性

### トランザクション

すべての書き込み操作はトランザクション内で実行：

```typescript
await db.run('BEGIN TRANSACTION');
try {
  // 複数の操作
  await db.run('COMMIT');
} catch (error) {
  await db.run('ROLLBACK');
  throw error;
}
```

### 再構築機能

Markdownファイルからデータベースを完全に再構築可能：

```bash
npm run rebuild-db
```

## パフォーマンス最適化

### 全文検索

FTS5を使用した高速検索：

```sql
SELECT * FROM search_items 
WHERE search_items MATCH ?
ORDER BY rank;
```

### バッチ処理

大量データのインポート時はバッチ処理：

```typescript
const BATCH_SIZE = 100;
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await processBatch(batch);
}
```

### 接続管理

リクエストごとに新しい接続を作成し、自動的にクローズ：

```typescript
const db = await createConnection();
try {
  // 操作実行
} finally {
  await db.close();
}
```

## セキュリティ考慮事項

### SQLインジェクション対策

すべてのクエリでプレースホルダーを使用：

```typescript
db.get('SELECT * FROM items WHERE id = ?', [id]);
```

### パストラバーサル対策

ファイルパスの検証：

```typescript
if (id.includes('..') || id.includes('/')) {
  throw new Error('Invalid ID format');
}
```

## マイグレーション

### スキーマ変更時

1. 新しいスキーマでテーブル作成
2. データ移行
3. 古いテーブル削除
4. インデックス再作成

詳細は[マイグレーションガイド](migration.md)を参照。