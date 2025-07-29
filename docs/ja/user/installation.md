# インストールガイド

Shirokuma MCP Knowledge Baseのインストールと設定方法を説明します。

## システム要件

- **Node.js**: 18.0.0以上
- **npm**: 8.0.0以上
- **OS**: Windows、macOS、Linux
- **ディスク容量**: 最低100MB（データ保存用に追加容量が必要）

## インストール方法

### 方法1: GitHubからクローン（推奨）

```bash
# リポジトリをクローン
git clone https://github.com/your-repo/shirokuma-mcp-knowledge-base.git
cd shirokuma-mcp-knowledge-base

# 依存関係をインストール
npm install

# ビルド
npm run build
```

### 方法2: npmパッケージとしてインストール（将来予定）

```bash
npm install -g shirokuma-mcp-knowledge-base
```

## 設定

### 1. 環境変数の設定（オプション）

デフォルトでは `.shirokuma/data` ディレクトリにデータが保存されますが、カスタマイズできます：

```bash
# データディレクトリの指定
export MCP_DATABASE_PATH=/path/to/your/data

# SQLiteファイルの場所を指定
export MCP_SQLITE_PATH=/path/to/your/search.db
```

### 2. MCPクライアントの設定

#### Claude Desktop の場合

`claude_desktop_config.json` を編集：

```json
{
  "mcpServers": {
    "shirokuma": {
      "command": "node",
      "args": ["/absolute/path/to/shirokuma-mcp-knowledge-base/dist/server.js"]
    }
  }
}
```

**重要**: パスは絶対パスで指定してください。

#### その他のMCPクライアント

各クライアントのドキュメントに従って、以下のコマンドを設定：

```bash
node /path/to/shirokuma-mcp-knowledge-base/dist/server.js
```

## 初期セットアップ

### 1. データベースの初期化

初回起動時に自動的に作成されますが、手動で初期化する場合：

```bash
npm run rebuild-db
```

### 2. 動作確認

MCPインスペクターを使用して接続を確認：

```bash
npm run inspect
```

### 3. テスト実行

インストールが正しく完了したか確認：

```bash
# 単体テスト
npm test

# すべてのテスト
npm run test:all
```

## アップグレード

### 既存のインストールをアップグレード

```bash
# 最新版を取得
git pull origin main

# 依存関係を更新
npm install

# ビルド
npm run build

# データベースの再構築（必要な場合）
npm run rebuild-db
```

### バージョン間の移行

特定のバージョン間でデータ移行が必要な場合は、[アップグレードガイド](../releases/upgrade.md)を参照してください。

## ディレクトリ構造

インストール後のディレクトリ構造：

```
shirokuma-mcp-knowledge-base/
├── dist/              # ビルド済みファイル
├── src/               # ソースコード
├── tests/             # テストファイル
├── docs/              # ドキュメント
├── .shirokuma/data/   # データディレクトリ（デフォルト）
│   ├── issues/        # イシューファイル
│   ├── plans/         # プランファイル
│   ├── docs/          # ドキュメントファイル
│   ├── knowledge/     # ナレッジファイル
│   ├── sessions/      # セッションファイル
│   ├── dailies/       # デイリーサマリー
│   └── search.db      # 検索用データベース
└── package.json
```

## トラブルシューティング

### ビルドエラー

```bash
# node_modulesをクリーンアップ
rm -rf node_modules
npm install
npm run build
```

### 権限エラー

```bash
# 実行権限を付与
chmod +x dist/server.js

# データディレクトリの権限
chmod -R 755 .shirokuma/data/
```

### データベースエラー

```bash
# データベースを再構築
npm run rebuild-db
```

### Node.jsバージョンエラー

```bash
# Node.jsのバージョンを確認
node --version

# nvm を使用している場合
nvm install 18
nvm use 18
```

## 設定の確認

インストールが完了したら、以下を確認：

1. **ビルドの成功**: `dist/server.js` が存在する
2. **依存関係**: `node_modules` が正しくインストールされている
3. **データディレクトリ**: `.shirokuma/data` が作成されている
4. **権限**: 読み書き権限が適切に設定されている

## 次のステップ

- [クイックスタート](quickstart.md) - すぐに使い始める
- [使い方](usage.md) - 詳細な使用方法
- [APIリファレンス](api-reference.md) - 完全なAPI仕様