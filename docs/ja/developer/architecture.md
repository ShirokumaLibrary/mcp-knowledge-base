# アーキテクチャドキュメント

## 概要

Shirokuma MCPナレッジベースは、効率的で拡張可能なナレッジ管理を提供するために設計された階層化アーキテクチャに従っています。

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                   MCPクライアント                    │
│              (Claude Desktop, etc.)                 │
└─────────────────────────────────────────────────────┘
                          │
                    MCP Protocol
                          │
┌─────────────────────────────────────────────────────┐
│                    MCPサーバー                       │
│                  (server.ts)                        │
├─────────────────────────────────────────────────────┤
│                  ハンドラー層                        │
│              (handlers/*.ts)                        │
├─────────────────────────────────────────────────────┤
│                 データベース層                       │
│              (database/*.ts)                        │
├─────────────────────────────────────────────────────┤
│            ┌──────────────┬──────────────┐         │
│            │ Markdownファイル │   SQLite    │        │
│            │   (Primary)   │  (Index)    │         │
│            └──────────────┴──────────────┘         │
└─────────────────────────────────────────────────────┘
```

## ディレクトリ構造

```
shirokuma-mcp-knowledge-base/
├── src/                      # ソースコード
│   ├── server.ts            # MCPサーバーエントリーポイント
│   ├── handlers/            # ビジネスロジックハンドラー
│   │   ├── base-handler.ts  # ベースハンドラークラス
│   │   ├── item-handlers.ts # アイテムCRUD操作
│   │   ├── tag-handlers.ts  # タグ管理
│   │   ├── status-handlers.ts # ステータス管理
│   │   ├── session-handlers.ts # ワークセッション
│   │   └── summary-handlers.ts # デイリーサマリー
│   ├── database/            # データアクセス層
│   │   ├── base.ts         # データベース接続
│   │   ├── base-repository.ts # ベースリポジトリパターン
│   │   ├── task-repository.ts # タスク（イシュー/プラン）
│   │   ├── document-repository.ts # ドキュメント
│   │   ├── tag-repository.ts # タグ管理
│   │   ├── status-repository.ts # ステータス管理
│   │   ├── search-repository.ts # 検索機能
│   │   └── index.ts        # データベースファサード
│   ├── schemas/            # Zodバリデーションスキーマ
│   ├── types/              # TypeScript型定義
│   ├── utils/              # ユーティリティ関数
│   ├── errors/             # カスタムエラークラス
│   └── security/           # セキュリティユーティリティ
├── database/               # データストレージ（実行時）
│   ├── search.db          # SQLite検索インデックス
│   ├── issues/            # イシューMarkdownファイル
│   ├── plans/             # プランMarkdownファイル
│   ├── docs/              # ドキュメントMarkdownファイル
│   ├── knowledge/         # ナレッジMarkdownファイル
│   └── sessions/          # セッション/サマリーファイル
└── tests/                  # テストスイート
    ├── unit/              # ユニットテスト
    ├── integration/       # 統合テスト
    └── e2e/               # エンドツーエンドテスト
```

## コアコンポーネント

### 1. MCPサーバー（server.ts）

- MCPクライアントとのstdio通信を処理
- ツール定義をMCPプロトコルに公開
- リクエストを適切なハンドラーにルーティング

### 2. ハンドラー層

各ハンドラーは特定のドメインロジックを実装：

- **BaseHandler**: 共通機能（データベース接続、エラーハンドリング）
- **ItemHandlers**: 全アイテムタイプのCRUD操作
- **TagHandlers**: タグの作成、削除、検索
- **StatusHandlers**: ステータス管理
- **SessionHandlers**: ワークセッションとデイリーサマリー

### 3. データベース層

#### デュアルストレージアプローチ

1. **Markdownファイル（プライマリ）**
   - 真実の源
   - 人間が読める形式
   - JSONメタデータヘッダー
   - バージョン管理しやすい

2. **SQLite（セカンダリ）**
   - 検索インデックス
   - 関係性の追跡
   - パフォーマンス最適化
   - 再構築可能

#### リポジトリパターン

```typescript
abstract class BaseRepository<T extends BaseEntity> {
  // 共通CRUD操作
  abstract create(data: CreateInput): Promise<T>;
  abstract findById(id: number): Promise<T | null>;
  abstract update(id: number, data: UpdateInput): Promise<T>;
  abstract delete(id: number): Promise<boolean>;
}
```

### 4. 型システム

#### エンティティ階層

```typescript
interface BaseEntity {
  id: number;
  title: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface TaskEntity extends BaseEntity {
  content?: string;
  priority?: Priority;
  status?: string;
  related_tasks?: string[];
  related_documents?: string[];
}

interface DocumentEntity extends BaseEntity {
  content: string;
  related_documents?: string[];
  related_tasks?: string[];
}
```

### 5. セキュリティ層

- **入力サニタイゼーション**: 全ユーザー入力を検証・クリーン
- **レート制限**: トークンバケットアルゴリズム
- **アクセス制御**: ロールベースパーミッション
- **監査ログ**: 全操作を追跡

## データフロー

### 作成/更新フロー

```
MCPクライアント
    ↓ (1) ツール呼び出し
server.ts
    ↓ (2) リクエストルーティング
Handler
    ↓ (3) 入力検証（Zod）
    ↓ (4) ビジネスロジック
Database Facade
    ↓ (5) トランザクション開始
Repository
    ├─→ (6a) Markdownファイル書き込み
    └─→ (6b) SQLiteインデックス更新
    ↓ (7) トランザクションコミット
Response → MCPクライアント
```

### 検索フロー

```
MCPクライアント
    ↓ (1) 検索クエリ
server.ts
    ↓ (2) SearchRepositoryへルーティング
SearchRepository
    ↓ (3) SQLiteクエリ実行
    ↓ (4) 結果集約
    ↓ (5) Markdownファイル読み取り（詳細用）
Response → MCPクライアント
```

## 設計原則

### 1. 関心の分離

- ハンドラー：ビジネスロジック
- リポジトリ：データアクセス
- スキーマ：バリデーション
- ユーティリティ：共通機能

### 2. 型安全性

- 厳密なTypeScript型
- Zodランタイムバリデーション
- ジェネリック制約
- 型推論の活用

### 3. パフォーマンス最適化

- メモリキャッシング
- バッチ処理
- インデックス最適化
- 遅延読み込み

### 4. 拡張性

- プラグイン可能なタイプシステム
- カスタムハンドラーサポート
- 設定可能なミドルウェア
- イベント駆動アーキテクチャ

## エラーハンドリング

### エラー階層

```typescript
class BaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {}
}

class ValidationError extends BaseError {}
class NotFoundError extends BaseError {}
class DatabaseError extends BaseError {}
```

### エラーミドルウェア

```typescript
async function errorMiddleware(error: Error): Promise<ErrorResponse> {
  if (error instanceof BaseError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details
    };
  }
  // 一般的なエラーハンドリング
}
```

## パフォーマンス考慮事項

### キャッシング戦略

1. **エンティティキャッシュ**: 頻繁にアクセスされるアイテム
2. **クエリキャッシュ**: 検索結果
3. **タグキャッシュ**: タグ使用統計

### データベース最適化

1. **インデックス**
   - タイプ、ステータス、タグでインデックス
   - 全文検索インデックス
   - 複合インデックス

2. **バッチ操作**
   - バルクインサート
   - トランザクションバッチング
   - 遅延書き込み

## セキュリティアーキテクチャ

### 多層防御

1. **入力層**: サニタイゼーションとバリデーション
2. **アプリケーション層**: レート制限とアクセス制御
3. **データ層**: SQLインジェクション防止
4. **出力層**: 機密データのマスキング

### セキュリティコンポーネント

- **InputSanitizer**: XSS、SQLインジェクション防止
- **RateLimiter**: DoS保護
- **AccessControlManager**: RBAC実装
- **AuditLogger**: セキュリティイベント追跡

## 将来の拡張

### 計画された機能

1. **プラグインシステム**: カスタムハンドラーとタイプ
2. **WebSocketサポート**: リアルタイム更新
3. **分散ストレージ**: マルチノードサポート
4. **高度な検索**: AI搭載検索機能

### 拡張ポイント

- カスタムリポジトリ実装
- 新しいエンティティタイプ
- 代替ストレージバックエンド
- カスタムバリデーションルール