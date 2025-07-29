# データベース統一化計画

作成日時: 2025-01-27 14:22:09

## 概要

このドキュメントは、Shirokuma MCP Knowledge Baseのデータベース構造を統一し、機能を維持しながらデータモデルを簡素化する計画を示します。

## 現在のアーキテクチャ

### 複数テーブル構造

#### メインテーブル
- `search_tasks` - タスク型（issues、plans、bugs等）
  - 複合キー: (type, id)
  - カラム: type, id, title, summary, content, priority, status_id, start_date, end_date, tags, created_at, updated_at
- `search_documents` - ドキュメント型（docs、knowledge等）
  - 複合キー: (type, id)
  - カラム: type, id, title, summary, content, tags, created_at, updated_at
- `search_sessions` - 作業セッション
  - 主キー: id (YYYY-MM-DD-HH.MM.SS.sss形式)
- `search_daily_summaries` - 日次サマリー
  - 主キー: date (YYYY-MM-DD形式)

#### 関連テーブル
- `related_tasks` - タスク間の関連（many-to-many）
  - source_type, source_id, target_type, target_id
- `related_documents` - アイテムとドキュメントの関連
  - source_type, source_id (TEXT), target_type, target_id

#### タグテーブル
- `tags` - マスターテーブル（id, name, created_at）
- `task_tags` - タスクのタグ（task_type, task_id, tag_id）
- `document_tags` - ドキュメントのタグ（document_type, document_id, tag_id）
- `session_tags` - セッションのタグ（session_id, tag_id）
- `summary_tags` - サマリーのタグ（summary_date, tag_id）

#### その他のテーブル
- `sequences` - ID管理（type, current_value, base_type）
- `statuses` - ステータスマスター（id, name, is_closed）

### 現在のMarkdownフォーマット

#### タスク型（issues/plans）
```yaml
---
id: 123
title: タイトル
description: 説明（オプション）
priority: high
status: Open
start_date: 2024-01-01
end_date: 2024-01-31
related_tasks: ["issues-456", "plans-789"]
related_documents: ["docs-101", "knowledge-202"]
tags: ["tag1", "tag2"]
created_at: 2024-01-01T00:00:00Z
updated_at: 2024-01-01T00:00:00Z
---
コンテンツ本文
```

#### ドキュメント型（docs/knowledge）
```yaml
---
id: 101
title: タイトル
description: 説明（オプション）
tags: ["tag1", "tag2"]
created_at: 2024-01-01T00:00:00Z
updated_at: 2024-01-01T00:00:00Z
---
コンテンツ本文（必須）
```

### 現在のディレクトリ構造
```
.shirokuma/data/
├── tasks/                    # ベースタイプディレクトリ
│   ├── issues/              # 具体的な型
│   │   └── issues-{id}.md
│   ├── plans/               
│   │   └── plans-{id}.md
│   └── bugs/                # カスタム型
│       └── bugs-{id}.md
├── documents/               # ベースタイプディレクトリ
│   ├── docs/               
│   │   └── docs-{id}.md
│   ├── knowledge/          
│   │   └── knowledge-{id}.md
│   ├── recipe/             # カスタム型
│   │   └── recipe-{id}.md
│   └── tutorial/           # カスタム型
│       └── tutorial-{id}.md
├── sessions/               # 独立型（ベースタイプなし）
│   └── YYYY-MM-DD/
│       └── session-{timestamp}.md
└── search.db               # SQLiteデータベース
```

## 提案する統一アーキテクチャ

### 単一テーブル構造

#### 1. メインアイテムテーブル
```sql
CREATE TABLE items (
  type TEXT NOT NULL,           -- issues, plans, docs, knowledge, sessions, summaries等
  id TEXT NOT NULL,             -- INTEGER または STRING（セッション用）
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,                  -- ドキュメント/セッション/サマリー用
  priority TEXT,                 -- high/medium/low（全タイプで重要度として使用）
  status_id INTEGER,             -- 全タイプで使用（ドキュメントはOpen/Closed）
  start_date TEXT,               -- タスク用、またはセッション/サマリーのdate
  end_date TEXT,                 -- タスク用
  start_time TEXT,               -- セッション用（HH:MM:SS）
  tags TEXT,                     -- JSON配列
  related TEXT,                  -- JSON配列 ["type-id", ...]
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (type, id)
);

-- 全文検索
CREATE VIRTUAL TABLE items_fts USING fts5(
  type, title, description, content, tags
);

-- 日付検索用インデックス（セッション用）
CREATE INDEX idx_items_date ON items(start_date) WHERE type = 'sessions';
```

#### 2. 関連アイテムテーブル（正規化）
```sql
CREATE TABLE related_items (
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (source_type, source_id, target_type, target_id)
);

-- 効率的なクエリのためのインデックス
CREATE INDEX idx_related_source ON related_items(source_type, source_id);
CREATE INDEX idx_related_target ON related_items(target_type, target_id);
```

#### 3. アイテムタグテーブル（正規化）
```sql
CREATE TABLE item_tags (
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (item_type, item_id, tag_id),
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- タグクエリ用インデックス
CREATE INDEX idx_item_tags_tag ON item_tags(tag_id);
```

#### 4. データマッピング例

**タスク（issues/plans）のマッピング**
```yaml
type: "issues"
id: "123"                         # 整数を文字列として格納
title: "バグ修正"
description: "ログイン機能の不具合"
content: "詳細な説明..."
priority: "high"
status_id: 2                      # "In Progress"
start_date: "2024-01-01"
end_date: "2024-01-31"
start_time: null
tags: ["bug", "urgent"]
related: ["plans-456", "docs-789"]
```

**ドキュメント（docs/knowledge）のマッピング**
```yaml
type: "docs"
id: "456"
title: "API仕様書"
description: "REST APIの仕様"
content: "# API仕様\n..."
priority: "medium"                # ドキュメントでも重要度として使用
status_id: 1                      # "Open"（有効）または 5（"Closed"無効）
start_date: null
end_date: null
start_time: null
tags: ["api", "documentation"]
related: ["knowledge-123"]
```

**セッション（sessions）のマッピング**
```yaml
type: "sessions"
id: "2024-01-01-14.30.00.000"    # タイムスタンプ形式
title: "作業セッションタイトル"
description: null                  # セッションでは未使用
content: "セッション内容"
priority: "low"                    # セッションでも使用可能
status_id: 1                       # 通常は"Open"
start_date: "2024-01-01"          # 日付（検索用）
end_date: null                     # タスク専用
start_time: "14:30:00"            # セッション開始時刻
tags: ["work", "development"]
related: ["issues-123", "docs-456"]
```

**日次サマリー（summaries）のマッピング**
```yaml
type: "summaries"
id: "2024-01-01"                  # 日付がID
title: "2024年1月1日のまとめ"
description: null
content: "本日の作業内容..."
priority: "medium"                 # サマリーでも使用可能
status_id: 1                      # 通常は"Open"
start_date: "2024-01-01"          # 日付（検索用）
end_date: null
start_time: null
tags: ["daily", "summary"]
related: ["sessions-2024-01-01-14.30.00.000"]
```

### 統一Markdownフォーマット
```yaml
---
id: 123
type: issues                    # 明示的な型フィールド
title: タイトル
description: 説明
priority: high                  # 全タイプで使用可能（重要度）
status: Open                    # 全タイプで使用（ドキュメントも有効/無効）
start_date: 2024-01-01         # タスク・セッション・サマリー用
end_date: 2024-01-31           # タスク専用
tags: ["tag1", "tag2"]
related: ["issues-456", "plans-789", "docs-101", "knowledge-202"]  # 統一
created_at: 2024-01-01T00:00:00Z
updated_at: 2024-01-01T00:00:00Z
---
```

### 統一後のディレクトリ構造（案）

#### 案1: フラットな構造（ベースタイプディレクトリを廃止）
```
.shirokuma/data/
├── issues/              # 各型が直接配置
│   └── issues-{id}.md
├── plans/               
│   └── plans-{id}.md
├── bugs/                
│   └── bugs-{id}.md
├── docs/               
│   └── docs-{id}.md
├── knowledge/          
│   └── knowledge-{id}.md
├── recipe/             
│   └── recipe-{id}.md
├── tutorial/           
│   └── tutorial-{id}.md
├── sessions/           
│   └── YYYY-MM-DD/
│       └── session-{timestamp}.md
└── search.db           
```

#### 案2: 現在の構造を維持
```
.shirokuma/data/
├── tasks/              # ベースタイプを維持
│   ├── issues/         
│   ├── plans/          
│   └── bugs/           
├── documents/          
│   ├── docs/           
│   ├── knowledge/      
│   ├── recipe/         
│   └── tutorial/       
├── sessions/           
└── search.db           
```

**推奨**: 案1（フラット構造）
- 統一テーブルではベースタイプの区別が不要
- ディレクトリ構造がシンプル
- 型の追加が直感的

## メリット

1. **簡素化されたスキーマ**
   - 複数の型別テーブルの代わりに単一メインテーブル
   - 統一されたリレーション処理
   - コード重複の削減

2. **保守性の向上**
   - 型別リポジトリの代わりに単一リポジトリクラス
   - 統一された検索実装
   - よりシンプルな移行スクリプト

3. **拡張性の向上**
   - 新しい型の追加にスキーマ変更不要
   - すべての型が同じインフラを共有
   - 全コンテンツタイプで一貫したAPI

4. **パフォーマンスの考慮事項**
   - 単一テーブルはNULL値が多くなるが、データ量が少ないため影響は無視できる
   - インデックスによりクエリパフォーマンスは最適に保たれる
   - 型テーブル間のJOINが不要なシンプルなクエリ

## 実装計画

### フェーズ1：新しいデータベーススキーマ実装
1. 既存のテーブル作成を削除
2. 新しい統一テーブル構造を実装：
   - `items` テーブル
   - `related_items` テーブル
   - `item_tags` テーブル
3. FTSインデックスの作成
4. 必要なインデックスの追加

### フェーズ2：リポジトリ層の再構築
1. `BaseRepository`を拡張して統一アクセスを提供
2. 統一された`ItemRepository`クラスを作成
   - `TaskRepository`と`DocumentRepository`の機能を統合
   - 型判定ロジックを実装
3. 既存のリポジトリをItemRepositoryへ移行
4. リポジトリインターフェースを統一

### フェーズ3：ハンドラー層の更新
1. `unified-handlers.ts`を拡張
   - すべてのアイテム操作を単一ハンドラーで処理
   - 型に基づく動的バリデーション
2. 既存のハンドラーを統合
3. MCPツール定義を統一API用に更新

### フェーズ4：テストと検証
1. 単体テストの更新（359テスト）
2. 統合テストの更新（45テスト）
3. E2Eテストの実行（5シナリオ）
4. データ整合性の検証
5. パフォーマンスベンチマーク
6. ドキュメントの更新

## 実装詳細

### 現在のリポジトリ構造
```
src/database/
├── base.ts                    # Database基底クラス
├── base-repository.ts         # BaseRepository（共通CRUD）
├── task-repository.ts         # TaskRepository（issues/plans）
├── document-repository.ts     # DocumentRepository（docs/knowledge）
├── tag-repository.ts          # TagRepository
├── status-repository.ts       # StatusRepository
├── session-repository.ts      # SessionRepository
├── summary-repository.ts      # SummaryRepository
└── search-repository.ts       # SearchRepository
```

### 統一後のリポジトリ構造
```typescript
// src/database/item-repository.ts
class ItemRepository extends BaseRepository {
  private taskValidator: TaskValidator;
  private documentValidator: DocumentValidator;
  private typeRegistry: TypeRegistry;
  
  async create(type: string, data: Partial<Item>): Promise<Item> {
    // 型レジストリから型定義を取得
    const typeDef = await this.typeRegistry.getType(type);
    if (!typeDef) throw new Error(`Unknown type: ${type}`);
    
    // ベースタイプに基づいて検証
    if (typeDef.baseType === 'tasks') {
      await this.taskValidator.validate(data);
    } else if (typeDef.baseType === 'documents') {
      await this.documentValidator.validate(data);
    }
    
    // 共通の作成ロジック
    let id: string;
    if (type === 'sessions') {
      // セッションはタイムスタンプID
      id = this.generateSessionId();
    } else if (type === 'summaries') {
      // サマリーは日付がID
      id = data.start_date || new Date().toISOString().split('T')[0];
    } else {
      // その他は整数IDを文字列として
      const numId = await this.getNextId(type);
      id = numId.toString();
    }
    
    const item = await this.saveToMarkdown(type, id, data);
    await this.syncToSQLite(item);
    return item;
  }
  
  async search(query: SearchQuery): Promise<Item[]> {
    // 統一されたitemsテーブルから検索
    const sql = `
      SELECT * FROM items_fts 
      WHERE items_fts MATCH ? 
      ${query.type ? 'AND type = ?' : ''}
      ORDER BY rank
    `;
    // 実行と結果のマッピング
  }
  
  private async syncToSQLite(item: Item): Promise<void> {
    // items テーブルへの同期
    await this.db.runAsync(`
      INSERT OR REPLACE INTO items 
      (type, id, title, description, content, priority, status_id, 
       start_date, end_date, start_time, tags, related, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [...]);
    
    // related_items テーブルの更新
    await this.updateRelatedItems(item);
    
    // item_tags テーブルの更新
    await this.updateItemTags(item);
  }
}
```

### 型安全性
```typescript
interface BaseItem {
  id: string;              // 文字列に統一（整数IDも文字列として格納）
  type: string;
  title: string;
  description?: string;
  tags: string[];
  related: string[];  // ["type-id", ...]
  created_at: string;
  updated_at: string;
}

interface TaskItem extends BaseItem {
  content: string;
  priority: 'high' | 'medium' | 'low';
  status_id: number;
  start_date: string | null;
  end_date: string | null;
  start_time: null;
}

interface DocumentItem extends BaseItem {
  content: string;
  priority: 'high' | 'medium' | 'low';
  status_id: number;
  start_date: null;
  end_date: null;
  start_time: null;
}

interface SessionItem extends BaseItem {
  content: string;
  priority: 'high' | 'medium' | 'low';
  status_id: number;
  start_date: string;      // 日付として使用
  end_date: null;
  start_time: string;      // HH:MM:SS
}

interface SummaryItem extends BaseItem {
  content: string;
  priority: 'high' | 'medium' | 'low';
  status_id: number;
  start_date: string;      // 日付として使用
  end_date: null;
  start_time: null;
}

type Item = TaskItem | DocumentItem | SessionItem | SummaryItem;
```

### ヘルパー関数
```typescript
class RelatedItemsHelper {
  // "type-id"形式をパース
  static parse(ref: string): { type: string; id: string } {
    const [type, ...idParts] = ref.split('-');
    return { type, id: idParts.join('-') };
  }
  
  // "type-id"としてフォーマット
  static format(type: string, id: string | number): string {
    return `${type}-${id}`;
  }
  
  // ベースタイプでフィルター
  static filterTasks(related: string[]): string[] {
    return related.filter(ref => {
      const { type } = this.parse(ref);
      return isTaskType(type);
    });
  }
}
```

## 現在の課題と統一化の必要性

### 課題
1. **コード重複**：TaskRepositoryとDocumentRepositoryで類似ロジック
2. **複雑な型管理**：動的型システムとハードコードされた型の混在
3. **テーブル分離**：search_tasksとsearch_documentsで同様の構造
4. **関連管理の複雑さ**：related_tasksとrelated_documentsの分離
5. **タグ管理の重複**：task_tags、document_tagsなど型別テーブル

### 統一化のメリット
1. **単一リポジトリ**：すべてのアイテムを1つのリポジトリで管理
2. **柔軟な型システム**：新しい型の追加が容易
3. **統一API**：すべての型で一貫したインターフェース
4. **保守性向上**：コード量の削減とバグの減少
5. **ステータス管理の統一**：すべてのアイテムタイプでステータス管理可能
   - タスク：従来通りのワークフロー管理
   - ドキュメント：有効（Open）/無効（Closed）の管理
   - セッション/サマリー：アーカイブ状態の管理


## タイムライン

### 第1週：データベース層の実装
- 新テーブル構造の作成
- ItemRepositoryの実装
- 単体テストの作成

### 第2週：統合とテスト
- ハンドラーの更新
- 統合テストの実施
- パフォーマンステスト
- ドキュメントの更新

## リスクと軽減策

| リスク | 影響度 | 発生確率 | 軽減策 |
|------|--------|---------|--------|
| パフォーマンス低下 | 中 | 中 | 事前ベンチマーク、インデックス最適化 |
| 型安全性の問題 | 中 | 中 | 厳密な型定義、実行時検証 |
| テスト失敗 | 中 | 高 | 段階的実装、十分なテスト作成 |

## 成功基準

### 機能面
- [x] すべての既存APIが動作する
- [x] データの整合性が保たれる
- [x] 新しい型の追加が可能

### パフォーマンス面
- [x] 検索速度が現行以上
- [x] メモリ使用量が許容範囲内
- [x] データベースサイズが適切

### 品質面
- [x] 全テストスイートがパス（409テスト）
- [x] コードカバレッジ80%以上
- [x] ドキュメント更新完了

## 注記

### 設計上の決定事項
- **統一テーブル採用**：NULL値の増加よりもシンプルさを優先
- **JSON配列使用**：関連アイテムの高速アクセスのため
- **セッション/サマリー統合**：すべてのアイテムタイプを単一テーブルで管理
- **FTS5使用継続**：全文検索のパフォーマンスのため
- **ID文字列化**：すべてのIDをTEXT型で統一（整数IDも文字列として格納）
- **プライオリティ統一**：すべてのアイテムタイプで重要度管理
- **ステータス統一**：すべてのアイテムタイプで状態管理

### 今後の拡張性
- カスタム型の追加が容易
- フィールドの追加が柔軟
- 新しいベースタイプの追加可能