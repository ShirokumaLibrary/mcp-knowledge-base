# Shirokuma MCP Knowledge Base v0.8.0 Documentation

## 📋 プロジェクト概要

**名称**: Shirokuma MCP Knowledge Base v0.8.0  
**目的**: MCPプロトコル対応の統一タスク管理システム  
**アーキテクチャ**: TypeScript + Node.js + SQLite + Prisma ORM

### 主要革新

1. **統一Itemモデル**: 全TYPE（issues, tasks, docs, patterns, decisions, sessions）を単一テーブルで管理
2. **デュアルインターフェース**: CLIツールとMCPサーバーを同一バイナリで提供
3. **AI最適化設計**: AIペアプログラミングに特化した知識管理システム

## 📁 ドキュメント構成

### [1. Requirements - 要件定義](./requirements/)
- **01-business-requirements.md**: ビジネス要件と期待効果
- **02-functional-requirements.md**: 機能要件の詳細定義
- **03-non-functional-requirements.md**: 非機能要件（性能・セキュリティ等）
- **04-user-stories.md**: ユーザーストーリーとユースケース

### [2. Specifications - 仕様書](./specifications/)
- **01-data-model-spec.md**: データモデル仕様
- **02-api-spec.md**: REST API仕様
- **03-mcp-protocol-spec.md**: MCPプロトコル仕様
- **04-cli-spec.md**: CLIコマンド仕様
- **05-validation-spec.md**: バリデーション仕様

### [3. Design - 設計書](./design/)
- **01-architecture-design.md**: システムアーキテクチャ設計
- **02-database-design.md**: データベース設計（統一スキーマ）
- **03-api-design.md**: API層設計
- **04-security-design.md**: セキュリティ設計
- **05-error-handling-design.md**: エラーハンドリング設計

### [4. Implementation - 実装ガイド](./implementation/)
- **01-development-setup.md**: 開発環境セットアップ
- **02-coding-standards.md**: コーディング規約
- **03-testing-guide.md**: テスト戦略とガイド
- **04-deployment-guide.md**: デプロイメントガイド
- **05-monitoring-guide.md**: モニタリングとログ設計

## 🎯 核心的な設計判断

### 統一Itemモデルの採用理由

**問題**: 従来の個別テーブル方式では横断検索が複雑化

**解決**: 単一テーブルによる統一管理で検索を簡潔化

```sql
-- 従来: 複雑なUNION検索
SELECT * FROM issues WHERE title LIKE '%keyword%'
UNION ALL
SELECT * FROM tasks WHERE title LIKE '%keyword%'
-- ... 6テーブル分

-- v0.8.0: 単一クエリ
SELECT * FROM items WHERE title LIKE '%keyword%'
```

### Priority設計（5段階Enum）

```typescript
enum Priority {
  CRITICAL  // 緊急対応必須
  HIGH      // 高優先度
  MEDIUM    // 通常（デフォルト）
  LOW       // 低優先度
  MINIMAL   // 最低優先度
}
```

### 動的TYPE管理

**v0.8.0の革新的特徴**: typeは事前登録不要で自由に作成可能

```typescript
// 推奨される標準タイプ（ガイドライン）
const STANDARD_TYPES = {
  issues: "課題・バグ管理",
  tasks: "タスク管理", 
  docs: "ドキュメント",
  patterns: "パターン集",
  decisions: "決定事項",
  sessions: "セッション記録",
  current_state: "システム状態"  // 特別な単一アイテム
};

// 自由に新しいタイプを作成可能
// 例: "bugs", "features", "meetings", "research", "experiments" など
```

### インテリジェントGraphDB機能

**自動的な知識グラフ構築**:

1. **AI駆動のキーワード抽出**: 多言語対応（日英自動ブリッジ）
2. **自動関連付け**: コンテンツ分析による関連性発見
3. **概念クラスタリング**: 意味的なグループ化
4. **双方向リレーション**: グラフ整合性の自動維持

```typescript
// スマート登録（自動関連付け）
await smartCreateItem({
  title: "認証システムの実装",
  content: "JWTを使用したログイン機能",
  analyzeContent: true,  // AI分析を実行
  autoRelate: true       // 自動関連付け
});
// → 自動的に関連アイテムを発見し、双方向リンクを作成
```

## 🚀 クイックスタート

### 必要環境

- Node.js 18以上
- npm 9以上
- SQLite 3

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/your-org/shirokuma-mcp-kb.git
cd shirokuma-mcp-kb

# 依存関係のインストール
npm install

# データベースのセットアップ
npx prisma migrate dev

# ビルド
npm run build
```

### 基本使用法

**CLIモード**:
```bash
# アイテム一覧
shirokuma list --type issues

# アイテム作成
shirokuma create --type tasks --title "新機能実装"

# 検索
shirokuma search "keyword"
```

**MCPサーバーモード**:
```bash
# サーバー起動
shirokuma serve --port 3000

# MCP接続
# Claude.aiなどのMCP対応クライアントから接続
```

## 📊 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| 言語 | TypeScript | 5.x |
| ランタイム | Node.js | 18+ |
| ORM | Prisma | 5.x |
| データベース | SQLite | 3 |
| テスト | Vitest | latest |
| リンター | ESLint | 8.x |
| フォーマッター | Prettier | 3.x |

## 🛣️ 主要機能

### v0.8.0
- ✅ 統一Itemモデル実装
- ✅ 動的TYPE管理（事前登録不要）
- ✅ CLIとMCPデュアルインターフェース
- ✅ 5段階Priority管理
- ✅ カレントステート機能
- ✅ GraphDB風の関連管理
- ✅ 多言語キーワード対応

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## 📞 サポート

- Issues: [GitHub Issues](https://github.com/your-org/shirokuma-mcp-kb/issues)
- Discussions: [GitHub Discussions](https://github.com/your-org/shirokuma-mcp-kb/discussions)

---

*詳細な技術情報は各セクションのドキュメントを参照してください。*