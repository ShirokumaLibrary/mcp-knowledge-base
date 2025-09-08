---
id: 132
type: steering
title: "Steering: Development Environment Setup"
status: Open
priority: MEDIUM
description: "開発環境のセットアップと設定ガイド"
aiSummary: "Development environment setup guide covering required tools, configuration, database management, and troubleshooting for a Node.js TypeScript project with SQLite database"
tags: ["environment","setup","development","steering","inclusion:manual"]
keywords: {"environment":1,"development":1,"setup":1,"database":0.9,"node":0.9}
concepts: {"development":0.9,"database":0.8,"configuration":0.8,"tooling":0.7,"testing":0.6}
embedding: "gICKgICBgICAgICWgKWAgICAj4CBgICAgICAjYCggICAgJOAiIeAgICAgIaAm4CAgICUgI2PgICAgICHgJmAgICAj4CNioCAgICAj4CdgICAgI2Ah5GAgICAgJeAooCAgICUgIGQgICAgICdgKqAgICAloCFiICAgICAmICkgIA="
createdAt: 2025-08-23T01:27:09.000Z
updatedAt: 2025-08-23T01:38:01.000Z
---

# Development Environment Setup

## 必須ツール
- **Node.js**: 18.0.0以上
- **npm**: 9.0.0以上
- **Git**: 2.30以上
- **SQLite3**: 最新版
- **VS Code** (推奨)

## 初期セットアップ
```bash
# リポジトリクローン
git clone https://github.com/ShirokumaLibrary/mcp-knowledge-base.git
cd mcp-knowledge-base

# 依存関係インストール
npm install

# データベース初期化
shirokuma-kb migrate

# 開発サーバー起動
npm run dev
```

## 環境変数
### .env ファイル
```bash
# データベース
DATABASE_URL="file:.shirokuma/data/shirokuma.db"

# AI設定（オプション）
ANTHROPIC_API_KEY="your-api-key"

# 開発環境
NODE_ENV="development"
```

## VS Code推奨拡張
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Vitest
- SQLite Viewer

## 開発コマンド
```bash
# TypeScript監視モード
npm run dev

# ビルド
npm run build

# リント
npm run lint
npm run lint:errors  # エラーのみ

# テスト
npm test
npm run test:watch
npm run test:coverage

# CLIコマンド
shirokuma-kb [command]

# MCPサーバー起動
npm run serve
```

## データベース管理
### 本番データベース
```bash
# 場所: .shirokuma/data-prod/shirokuma.db
shirokuma-kb serve  # 本番サーバー起動
```

### 開発データベース
```bash
# 場所: .shirokuma/data-dev/shirokuma.db
npm run serve  # 開発サーバー起動
```

### テストデータベース
```bash
# 場所: .shirokuma/data-test/shirokuma.db
# テスト実行時に自動使用
```

## トラブルシューティング
### ビルドエラー
```bash
# TypeScript型チェック
npx tsc --noEmit

# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install
```

### データベースエラー
```bash
# マイグレーションリセット
shirokuma-kb migrate --reset --seed
```

### ESLintエラー
```bash
# 自動修正
npx eslint src --fix
```