# データモデル仕様書

## 1. 概要

本書は、Shirokuma MCP Knowledge Base v0.8.0のデータモデル仕様を定義します。統一Itemモデルを中心とした、シンプルで拡張性の高いデータ構造を提供します。

## 2. 設計思想

### 2.1 核心原則

**「すべてのアイテムは平等」**

- TYPEは単なるカテゴリーラベル
- TYPE別の特別な処理は存在しない
- すべてのアイテムが同じフィールド、同じ機能を持つ
- TYPEによる制約や場合分けは一切なし

### 2.2 設計の利点

1. **極限のシンプルさ**: 単一モデルですべてを表現
2. **完全な柔軟性**: 新しいTYPEを自由に作成可能
3. **一貫性**: すべてのアイテムが同じ振る舞い
4. **保守性**: TYPE別のコードが不要

## 3. データベーススキーマ

### 3.1 Itemテーブル（統一モデル）

```sql
CREATE TABLE items (
    -- 識別子
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,  -- カテゴリーラベル（自由文字列）
    
    -- 必須フィールド
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    content     TEXT NOT NULL,
    status_id   INTEGER NOT NULL,
    priority    TEXT NOT NULL CHECK(priority IN ('CRITICAL','HIGH','MEDIUM','LOW','MINIMAL')),
    
    -- オプションフィールド
    category    TEXT,      -- サブカテゴリー（自由入力）
    start_date  DATETIME,  -- 汎用開始日時
    end_date    DATETIME,  -- 汎用終了日時
    version     TEXT,      -- バージョン情報
    related     TEXT,      -- JSON配列 "[1, 2, 3]"
    
    -- インテリジェント拡張フィールド
    search_index TEXT,     -- 多言語キーワード（空白区切り）
    concepts    TEXT,      -- JSON配列 '["auth", "security"]'
    entities    TEXT,      -- JSON配列 '["User", "LoginService"]'
    embedding   TEXT,      -- JSON配列（ベクトル検索用）
    metadata    TEXT,      -- JSON オブジェクト（追加メタデータ）
    
    -- メタデータ
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー
    FOREIGN KEY (status_id) REFERENCES statuses(id)
);

-- インデックス
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_status ON items(status_id);
CREATE INDEX idx_items_priority ON items(priority);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_dates ON items(start_date, end_date);
CREATE INDEX idx_items_created ON items(created_at);
CREATE INDEX idx_items_updated ON items(updated_at);
CREATE INDEX idx_items_search ON items(search_index);  -- 検索用インデックス
```

### 3.2 Statusテーブル

```sql
CREATE TABLE statuses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    is_closable BOOLEAN DEFAULT FALSE,
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 標準ステータスの挿入
INSERT INTO statuses (name, is_closable, sort_order) VALUES
    ('Open', FALSE, 1),
    ('Specification', FALSE, 2),
    ('Waiting', FALSE, 3),
    ('Ready', FALSE, 4),
    ('In Progress', FALSE, 5),
    ('Review', FALSE, 6),
    ('Testing', FALSE, 7),
    ('Pending', FALSE, 8),
    ('Completed', TRUE, 9),
    ('Closed', TRUE, 10),
    ('Canceled', TRUE, 11),
    ('Rejected', TRUE, 12);
```

### 3.3 Tagテーブル

```sql
CREATE TABLE tags (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE INDEX idx_tags_name ON tags(name);
```

### 3.4 ItemTagテーブル（多対多リレーション）

```sql
CREATE TABLE item_tags (
    item_id INTEGER NOT NULL,
    tag_id  INTEGER NOT NULL,
    PRIMARY KEY (item_id, tag_id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_item_tags_item ON item_tags(item_id);
CREATE INDEX idx_item_tags_tag ON item_tags(tag_id);
```

## 4. Prismaスキーマ定義

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum Priority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
  MINIMAL
}

model Item {
  id          Int       @id @default(autoincrement())
  type        String    // 完全に自由な文字列
  
  // 必須フィールド
  title       String
  description String
  content     String    @db.Text
  statusId    Int       @map("status_id")
  priority    Priority  @default(MEDIUM)
  
  // オプションフィールド
  category    String?
  startDate   DateTime? @map("start_date")
  endDate     DateTime? @map("end_date")
  version     String?
  related     String?   // JSON: "[1, 2, 3]"
  
  // インテリジェント拡張フィールド
  searchIndex String?   @map("search_index") @db.Text
  concepts    String?   // JSON: '["auth", "security"]'
  entities    String?   // JSON: '["User", "LoginService"]'
  embedding   String?   // JSON: ベクトル配列
  metadata    String?   // JSON: 追加メタデータ
  
  // メタデータ
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  // リレーション
  status      Status    @relation(fields: [statusId], references: [id])
  tags        ItemTag[]
  
  @@index([type])
  @@index([statusId])
  @@index([priority])
  @@index([category])
  @@index([startDate, endDate])
  @@index([createdAt])
  @@index([updatedAt])
  @@index([searchIndex])
  @@map("items")
}

model Status {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  isClosable  Boolean  @default(false) @map("is_closable")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  items       Item[]
  
  @@index([sortOrder])
  @@map("statuses")
}

model Tag {
  id    Int       @id @default(autoincrement())
  name  String    @unique
  items ItemTag[]
  
  @@map("tags")
}

model ItemTag {
  itemId Int @map("item_id")
  tagId  Int @map("tag_id")
  
  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([itemId, tagId])
  @@map("item_tags")
}
```

## 5. フィールド詳細仕様

### 5.1 必須フィールド

| フィールド | 型 | 説明 | 制約 |
|-----------|-----|------|------|
| id | INTEGER | 一意識別子 | 自動採番、1から開始 |
| type | STRING | カテゴリーラベル | 任意の文字列、推奨: 小文字英数字 |
| title | STRING | タイトル | 最大200文字、空文字不可 |
| description | STRING | 概要説明 | 最大1000文字、空文字不可 |
| content | TEXT | 詳細内容 | Markdown形式、最大100KB |
| statusId | INTEGER | ステータスID | statusesテーブル参照 |
| priority | ENUM | 優先度 | 5段階固定値 |
| createdAt | DATETIME | 作成日時 | 自動設定、UTC |
| updatedAt | DATETIME | 更新日時 | 自動更新、UTC |

### 5.2 オプションフィールド

| フィールド | 型 | 説明 | 用途例 |
|-----------|-----|------|--------|
| category | STRING | サブカテゴリー | "frontend", "backend", "database" など |
| startDate | DATETIME | 汎用開始日時 | 作業開始、期間開始、セッション開始など |
| endDate | DATETIME | 汎用終了日時 | 作業終了、期限、セッション終了など |
| version | STRING | バージョン情報 | "v1.2.3", "2024.01", "alpha" など |
| related | JSON | 関連アイテムID | "[1, 2, 3]" 形式 |

### 5.3 TYPE仕様

#### 特徴
- **完全に自由**: 任意の文字列を使用可能
- **事前登録不要**: 使用時に自動的に有効
- **制約なし**: TYPE別の特別な処理は存在しない
- **推奨のみ**: システムは推奨TYPEを提案するが強制しない

#### 推奨TYPE（ガイドライン）

```javascript
// これらは単なる推奨値であり、強制ではない
const SUGGESTED_TYPES = {
  // 基本的なタスク管理
  'issue': '問題・課題',
  'task': 'タスク・TODO',
  'bug': 'バグ・不具合',
  'feature': '機能要望',
  
  // ドキュメント系
  'doc': 'ドキュメント',
  'spec': '仕様書',
  'guide': 'ガイド',
  'note': 'メモ・ノート',
  
  // 設計・決定系
  'pattern': 'デザインパターン',
  'decision': '決定事項',
  'proposal': '提案',
  'review': 'レビュー',
  
  // 活動記録系
  'session': '作業セッション',
  'meeting': '会議記録',
  'research': '調査記録',
  'experiment': '実験記録'
};
```

### 5.4 Priority仕様

```typescript
enum Priority {
  CRITICAL = "CRITICAL",  // 緊急対応必須、システム停止級
  HIGH = "HIGH",         // 高優先度、早急な対応が必要
  MEDIUM = "MEDIUM",     // 通常優先度（デフォルト）
  LOW = "LOW",          // 低優先度、時間がある時に
  MINIMAL = "MINIMAL"    // 最低優先度、nice to have
}
```

### 5.5 Status仕様

#### 標準ステータス

| ID | Name | is_closable | 説明 |
|----|------|-------------|------|
| 1 | Open | false | 新規作成、未着手 |
| 2 | Specification | false | 仕様検討中 |
| 3 | Waiting | false | 他の作業待ち |
| 4 | Ready | false | 着手可能状態 |
| 5 | In Progress | false | 作業進行中 |
| 6 | Review | false | レビュー中 |
| 7 | Testing | false | テスト中 |
| 8 | Pending | false | 一時保留 |
| 9 | Completed | true | 完了 |
| 10 | Closed | true | クローズ |
| 11 | Canceled | true | キャンセル |
| 12 | Rejected | true | 却下 |

## 6. データ整合性ルール

### 6.1 参照整合性

- statusIdは必ずstatusesテーブルに存在するIDを参照
- tagはtagsテーブルに存在するか、新規作成される
- relatedフィールドのIDは検証されるが、存在しないIDも許容（削除済みアイテムへの参照を保持）

### 6.2 カスケード削除

- アイテム削除時、item_tagsの関連レコードも削除
- タグ削除時、item_tagsの関連レコードも削除
- ステータスは削除不可（システム固定）

### 6.3 データ検証

```typescript
// バリデーションルール
const validationRules = {
  type: {
    required: true,
    pattern: /^[a-z0-9_-]+$/i,  // 推奨パターン（強制ではない）
    maxLength: 50
  },
  title: {
    required: true,
    minLength: 1,
    maxLength: 200
  },
  description: {
    required: true,
    minLength: 1,
    maxLength: 1000
  },
  content: {
    required: true,
    maxLength: 102400  // 100KB
  },
  category: {
    required: false,
    maxLength: 50
  },
  version: {
    required: false,
    maxLength: 50
  },
  related: {
    required: false,
    validator: (value) => {
      try {
        const ids = JSON.parse(value);
        return Array.isArray(ids) && ids.every(id => Number.isInteger(id));
      } catch {
        return false;
      }
    }
  }
};
```

## 7. インデックス戦略

### 7.1 主要インデックス

1. **type**: TYPEによるフィルタリング高速化
2. **statusId**: ステータスフィルタリング
3. **priority**: 優先度ソート・フィルタリング
4. **createdAt/updatedAt**: 時系列ソート

### 7.2 複合インデックス

- **(type, statusId)**: TYPE別ステータス検索
- **(type, priority)**: TYPE別優先度検索
- **(startDate, endDate)**: 期間検索

## 8. データベース初期化

### 8.1 初期セットアップ

```sql
-- 001_initial_schema.sql
CREATE TABLE items (...);
CREATE TABLE statuses (...);
CREATE TABLE tags (...);
CREATE TABLE item_tags (...);

-- インデックス作成
CREATE INDEX ...;

-- 初期データ投入
INSERT INTO statuses ...;
```


## 9. パフォーマンス考慮事項

### 9.1 クエリ最適化

- 全文検索: SQLiteのFTS5拡張を検討
- ページネーション: LIMIT/OFFSET使用
- ソート: インデックスを活用

### 9.2 データサイズ管理

- contentフィールド: 100KB制限で肥大化防止
- 古いアイテムのアーカイブ機能
- VACUUM定期実行でデータベース最適化

## 10. まとめ

本データモデルは「すべてのアイテムは平等」という原則に基づき、極めてシンプルで柔軟な設計を実現しています。TYPEによる特別な処理を完全に排除することで、保守性と拡張性を最大化しています。