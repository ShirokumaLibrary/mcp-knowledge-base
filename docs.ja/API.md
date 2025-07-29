# APIドキュメント

## 概要

Shirokuma MCPナレッジベースは、Model Context Protocol (MCP)を通じてイシュー、プラン、ドキュメント、ナレッジ、ワークセッション、デイリーサマリーを管理するための包括的なAPIを提供します。

## コア概念

### エンティティタイプ

システムは以下のベースエンティティタイプをサポートします：

- **Issues（イシュー）**: バグレポートとタスク追跡
- **Plans（プラン）**: プロジェクト計画と管理
- **Documents（ドキュメント）**: 一般的なドキュメンテーション
- **Knowledge（ナレッジ）**: ナレッジベース記事
- **Work Sessions（ワークセッション）**: 時間追跡された作業記録
- **Daily Summaries（デイリーサマリー）**: 日々の活動サマリー

カスタムタイプはこれらのベースタイプに基づいて作成できます。

### 共通プロパティ

全エンティティは以下の共通プロパティを共有します：

```typescript
interface BaseEntity {
  id: number | string;
  title: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}
```

### タスクベースエンティティ（Issues、Plans）

タスクベースエンティティには追加のプロパティがあります：

```typescript
interface TaskEntity extends BaseEntity {
  content?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  status_id?: number;
  start_date?: string;
  end_date?: string;
  related_tasks?: string[];
  related_documents?: string[];
}
```

### ドキュメントベースエンティティ（Documents、Knowledge）

ドキュメントベースエンティティはコンテンツが必須です：

```typescript
interface DocumentEntity extends BaseEntity {
  content: string;
  description?: string;
  related_documents?: string[];
  related_tasks?: string[];
}
```

## MCPツール

### アイテム管理

#### create_item
任意のタイプの新しいアイテムを作成します。

**パラメータ:**
- `type` (string, 必須): エンティティタイプ
- `title` (string, 必須): アイテムタイトル
- `content` (string, ドキュメントには必須): アイテムコンテンツ
- `description` (string): アイテムの説明
- `tags` (string[]): カテゴリ分けのためのタグ
- `priority` (string): 優先度レベル (high/medium/low)
- `status` (string): ステータス名
- `start_date` (string): 開始日 (YYYY-MM-DD)
- `end_date` (string): 終了日 (YYYY-MM-DD)
- `related_tasks` (string[]): 関連タスクの参照
- `related_documents` (string[]): 関連ドキュメントの参照

**例:**
```json
{
  "type": "issues",
  "title": "ログインバグを修正",
  "content": "特殊文字でユーザーがログインできない",
  "priority": "high",
  "tags": ["バグ", "認証"]
}
```

#### get_items
オプションのフィルタリングでタイプ別にアイテムを取得します。

**パラメータ:**
- `type` (string, 必須): エンティティタイプ
- `statuses` (string[]): ステータス名でフィルタ
- `includeClosedStatuses` (boolean): クローズドアイテムを含む

#### get_item_detail
特定のアイテムの詳細情報を取得します。

**パラメータ:**
- `type` (string, 必須): エンティティタイプ
- `id` (number, 必須): アイテムID

#### update_item
既存のアイテムを更新します。

**パラメータ:**
- `type` (string, 必須): エンティティタイプ
- `id` (number, 必須): アイテムID
- その他のパラメータはcreate_itemと同じ（全てオプション）

#### delete_item
アイテムを削除します。

**パラメータ:**
- `type` (string, 必須): エンティティタイプ
- `id` (number, 必須): アイテムID

### 検索操作

#### search_items_by_tag
タイプを跨いでタグでアイテムを検索します。

**パラメータ:**
- `tag` (string, 必須): 検索するタグ
- `types` (string[]): 検索するタイプ（省略時は全て）

#### search_items
全アイテムのタイトル、説明、コンテンツに対する全文検索。

**パラメータ:**
- `query` (string, 必須): 検索クエリテキスト
- `types` (string[]): 特定のタイプでフィルタ（オプション）
- `limit` (number): 最大結果数（デフォルト: 20、最大: 100）
- `offset` (number): ページネーション用のスキップ数（デフォルト: 0）

**例:**
```json
{
  "query": "認証エラー",
  "types": ["issues", "docs"],
  "limit": 10
}
```

#### search_suggest
オートコンプリート用の検索候補を取得。

**パラメータ:**
- `query` (string, 必須): 部分的な検索クエリ
- `types` (string[]): 特定のタイプで候補をフィルタ（オプション）
- `limit` (number): 最大候補数（デフォルト: 10、最大: 20）

**例:**
```json
{
  "query": "認証",
  "limit": 5
}
```

### タグ管理

#### get_tags
利用可能な全タグを取得します。

**戻り値:** 名前と使用回数を含むタグオブジェクトの配列。

#### create_tag
新しいタグを作成します。

**パラメータ:**
- `name` (string, 必須): タグ名

#### delete_tag
タグを削除します。

**パラメータ:**
- `name` (string, 必須): タグ名

#### search_tags
パターンでタグを検索します。

**パラメータ:**
- `pattern` (string, 必須): 検索パターン

### ステータス管理

#### get_statuses
利用可能な全ステータスを取得します。

**戻り値:** ID、名前、説明、is_closedフラグを含むステータスオブジェクトの配列。

### ワークセッション

#### get_sessions
日付範囲内のワークセッションを取得します。

**パラメータ:**
- `start_date` (string): 開始日 (YYYY-MM-DD)
- `end_date` (string): 終了日 (YYYY-MM-DD)

#### get_session_detail
セッションの詳細情報を取得します。

**パラメータ:**
- `id` (string, 必須): セッションID

#### get_latest_session
今日の最新のワークセッションを取得します。

#### create_session
新しいワークセッションを作成します。

**パラメータ:**
- `title` (string, 必須): セッションタイトル
- `content` (string): セッションコンテンツ
- `tags` (string[]): タグ
- `related_tasks` (string[]): 関連タスクの参照
- `related_documents` (string[]): 関連ドキュメントの参照
- `datetime` (string): ISO 8601日時（マイグレーション用）

#### update_session
既存のセッションを更新します。

**パラメータ:**
- `id` (string, 必須): セッションID
- その他のパラメータはcreate_sessionと同じ（全てオプション）

### デイリーサマリー

#### get_summaries
日付範囲内のデイリーサマリーを取得します。

**パラメータ:**
- `start_date` (string): 開始日 (YYYY-MM-DD)
- `end_date` (string): 終了日 (YYYY-MM-DD)

#### get_summary_detail
デイリーサマリーの詳細情報を取得します。

**パラメータ:**
- `date` (string, 必須): 日付 (YYYY-MM-DD)

#### create_summary
デイリーサマリーを作成します。

**パラメータ:**
- `date` (string, 必須): 日付 (YYYY-MM-DD)
- `title` (string, 必須): サマリータイトル
- `content` (string, 必須): サマリーコンテンツ
- `tags` (string[]): タグ
- `related_tasks` (string[]): 関連タスクの参照
- `related_documents` (string[]): 関連ドキュメントの参照

#### update_summary
既存のデイリーサマリーを更新します。

**パラメータ:**
- `date` (string, 必須): 日付 (YYYY-MM-DD)
- その他のパラメータはcreate_summaryと同じ（全てオプション）

### タイプ管理

#### get_types
利用可能な全コンテンツタイプを取得します。

**パラメータ:**
- `include_definitions` (boolean): 完全なタイプ定義を含む

**戻り値:** base_type（tasks、documents）でグループ化されたタイプ。

#### create_type
新しいカスタムコンテンツタイプを作成します。

**パラメータ:**
- `name` (string, 必須): タイプ名（小文字、アンダースコア）
- `base_type` (string): ベースタイプ（tasks/documents）

#### delete_type
カスタムコンテンツタイプを削除します。

**パラメータ:**
- `name` (string, 必須): タイプ名

## エラーハンドリング

全APIエラーは一貫したフォーマットに従います：

```typescript
interface McpError {
  code: string;
  message: string;
  details?: any;
}
```

一般的なエラーコード：
- `VALIDATION_ERROR`: 無効な入力パラメータ
- `NOT_FOUND`: リソースが見つからない
- `DATABASE_ERROR`: データベース操作が失敗
- `INTERNAL_ERROR`: 予期しないサーバーエラー

## レート制限

APIは悪用を防ぐためにレート制限を実装しています：
- デフォルト: クライアントあたり1分間に60リクエスト
- デプロイメントごとに設定可能
- 制限超過時は429ステータスを返す

## ベストプラクティス

1. **タグを効果的に使用**
   - 一貫したタグ分類法を作成
   - 階層的なタグを使用（例："フロントエンド"、"フロントエンド-React"）
   - 検索性を向上させるためタグの長さを制限

2. **参照を管理**
   - 参照には`{type}-{id}`フォーマットを使用
   - 例：`issues-123`、`plans-45`、`docs-67`
   - 関係を作成する前に参照が存在することを検証

3. **日付を適切に処理**
   - 常にISO 8601フォーマット（YYYY-MM-DD）を使用
   - タイムゾーンの影響を考慮
   - フィルタリングには日付範囲を使用

4. **検索を最適化**
   - 可能な場合は特定のタイプフィルタを使用
   - カテゴリ分けにはタグ検索を活用
   - 大きな結果セットにはページネーションを実装

5. **エラー回復**
   - 一時的なエラーにはリトライロジックを実装
   - デバッグのためエラーをログ
   - ユーザーフレンドリーなエラーメッセージを提供