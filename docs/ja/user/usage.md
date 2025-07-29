# 使い方ガイド

Shirokuma MCP Knowledge Baseの詳細な使い方を説明します。

## 基本概念

### コンテンツタイプ

システムは以下のコンテンツタイプをサポートしています：

- **Issues（イシュー）**: バグ、タスク、課題の管理
- **Plans（プラン）**: プロジェクト計画、マイルストーン
- **Docs（ドキュメント）**: 技術文書、ガイド
- **Knowledge（ナレッジ）**: チームの知識、ノウハウ
- **Sessions（セッション）**: 作業記録、活動ログ
- **Dailies（デイリーサマリー）**: 日次の成果まとめ
- **カスタムタイプ**: 独自のコンテンツタイプ

### データ構造

すべてのアイテムは以下の基本フィールドを持ちます：

```typescript
{
  type: string;        // コンテンツタイプ
  id: string;          // 一意のID
  title: string;       // タイトル
  content?: string;    // 本文（オプション）
  tags: string[];      // タグの配列
  created_at: string;  // 作成日時
  updated_at: string;  // 更新日時
}
```

## CRUD操作

### 作成（Create）

新しいアイテムを作成：

```typescript
// 基本的な作成
create_item({
  type: "issues",
  title: "ログイン機能のバグ",
  content: "パスワードリセット時にエラーが発生",
  tags: ["bug", "認証"],
  priority: "high",
  status: "Open"
})

// 関連アイテムを含む作成
create_item({
  type: "plans",
  title: "認証システムの改善",
  content: "セキュリティ強化のための計画",
  related_tasks: ["issues-1", "issues-2"],
  related_documents: ["docs-10"],
  start_date: "2025-02-01",
  end_date: "2025-02-28"
})
```

### 読み取り（Read）

アイテムの取得：

```typescript
// 一覧取得
get_items({
  type: "issues",
  limit: 20
})

// フィルタリング
get_items({
  type: "issues",
  statuses: ["Open", "In Progress"],
  includeClosedStatuses: false
})

// 日付範囲
get_items({
  type: "sessions",
  start_date: "2025-01-01",
  end_date: "2025-01-31"
})

// 詳細取得
get_item_detail({
  type: "issues",
  id: "42"
})
```

### 更新（Update）

既存アイテムの更新：

```typescript
update_item({
  type: "issues",
  id: "42",
  status: "In Progress",
  tags: ["bug", "認証", "進行中"],
  content: "原因を特定。修正作業中。"
})
```

### 削除（Delete）

アイテムの削除：

```typescript
delete_item({
  type: "issues",
  id: "42"
})
```

## 高度な機能

### タグ管理

```typescript
// すべてのタグを取得
get_tags()

// タグで検索
search_items_by_tag({
  tag: "重要"
})

// 複数タイプから検索
search_items_by_tag({
  tag: "セキュリティ",
  types: ["issues", "plans", "docs"]
})

// タグの作成
create_tag({
  name: "緊急"
})

// タグの削除（使用されていない場合のみ）
delete_tag({
  name: "古いタグ"
})
```

### ステータス管理

```typescript
// 利用可能なステータス一覧
get_statuses()
// 結果: Open, In Progress, Closed, On Hold, Cancelled など

// ステータスでフィルタ
get_items({
  type: "issues",
  statuses: ["Open", "In Progress"]
})

// クローズドステータスを除外（デフォルト）
get_items({
  type: "plans",
  includeClosedStatuses: false
})
```

### 全文検索

```typescript
// キーワード検索
search_items({
  query: "認証 バグ"
})

// タイプを指定して検索
search_items({
  query: "セキュリティ",
  types: ["issues", "docs"],
  limit: 50
})

// 検索候補の取得
search_suggest({
  query: "認",
  limit: 10
})
```

### セッション管理

```typescript
// 新しいセッションを開始
create_item({
  type: "sessions",
  title: "バグ修正作業",
  content: "認証システムのバグ修正を開始"
})

// カスタムIDでセッション作成
create_item({
  type: "sessions",
  id: "morning-standup",
  title: "朝会",
  content: "本日のタスク確認"
})

// 過去のセッションを記録
create_item({
  type: "sessions",
  title: "昨日の作業",
  datetime: "2025-01-28T15:30:00Z",
  content: "リファクタリング完了"
})
```

### デイリーサマリー

```typescript
// 今日のサマリーを作成
create_item({
  type: "dailies",
  date: "2025-01-29",
  title: "本日の成果",
  content: `
## 完了したタスク
- 認証バグの修正
- ドキュメント更新

## 明日の予定
- テストケースの追加
- コードレビュー
`,
  tags: ["productive"]
})

// 特定の日のサマリーを取得
get_items({
  type: "dailies",
  start_date: "2025-01-29",
  end_date: "2025-01-29"
})
```

### カスタムタイプ

独自のコンテンツタイプを作成：

```typescript
// 新しいタイプを定義
create_type({
  name: "meeting_notes",
  base_type: "documents",
  description: "会議議事録の管理"
})

// カスタムタイプで作成
create_item({
  type: "meeting_notes",
  title: "週次定例会議",
  content: "議事録の内容...",
  tags: ["定例", "週次"]
})

// 利用可能なタイプ一覧
get_types({
  include_definitions: true
})
```

## ベストプラクティス

### 1. タグの活用

- 一貫性のあるタグ名を使用
- 階層的なタグ（例: `frontend/react`、`backend/api`）
- プロジェクト固有のタグを作成

### 2. ステータスの管理

- ワークフローに合わせたステータスを使用
- 定期的にクローズドアイテムを確認
- ステータス変更時はコメントを追加

### 3. 関連付け

- 関連するアイテムは積極的にリンク
- `related_tasks`と`related_documents`を活用
- 双方向の関連付けを維持

### 4. 検索の最適化

- 意味のあるタイトルとコンテンツ
- 重要なキーワードをタグに含める
- 定期的に不要なデータを削除

### 5. セッション記録

- 作業開始時にセッションを作成
- 進捗や気づきを随時記録
- 終了時にサマリーを追加

## 実践例

### プロジェクト管理フロー

```typescript
// 1. プロジェクトプランを作成
const plan = await create_item({
  type: "plans",
  title: "認証システムリニューアル",
  content: "OAuth2.0対応とセキュリティ強化",
  start_date: "2025-02-01",
  end_date: "2025-03-31",
  tags: ["project", "security"]
});

// 2. 関連イシューを作成
const issue1 = await create_item({
  type: "issues",
  title: "OAuth2.0プロバイダーの実装",
  related_tasks: [`plans-${plan.id}`],
  priority: "high",
  tags: ["feature", "security"]
});

// 3. ドキュメントを作成
const doc = await create_item({
  type: "docs",
  title: "OAuth2.0実装ガイド",
  content: "実装手順と設定方法...",
  related_tasks: [`issues-${issue1.id}`],
  tags: ["guide", "security"]
});

// 4. 進捗を追跡
const session = await create_item({
  type: "sessions",
  title: "OAuth実装作業",
  content: "プロバイダー設定開始",
  related_tasks: [`issues-${issue1.id}`]
});
```

### 日次ワークフロー

```typescript
// 朝: その日のタスクを確認
const openTasks = await get_items({
  type: "issues",
  statuses: ["Open", "In Progress"],
  limit: 10
});

// 作業開始: セッションを作成
const session = await create_item({
  type: "sessions",
  title: "開発作業",
  content: `本日のタスク:\n${openTasks.map(t => `- ${t.title}`).join('\n')}`
});

// 作業中: 進捗を更新
await update_item({
  type: "issues",
  id: openTasks[0].id,
  status: "In Progress",
  content: "実装50%完了"
});

// 夕方: デイリーサマリーを作成
await create_item({
  type: "dailies",
  date: new Date().toISOString().split('T')[0],
  title: "本日の成果",
  content: "- OAuth実装進捗50%\n- ドキュメント更新完了",
  tags: ["productive"]
});
```

## トラブルシューティング

### データが見つからない

- 正しいタイプを指定しているか確認
- IDが正しいか確認
- データベースが最新か確認（`npm run rebuild-db`）

### 検索結果が不正確

- 検索インデックスを再構築
- クエリの構文を確認
- 部分一致検索を試す

### パフォーマンスが遅い

- 取得件数を制限（`limit`パラメータ）
- 不要なデータを削除
- データベースを最適化