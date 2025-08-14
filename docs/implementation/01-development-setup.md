# 開発環境セットアップガイド

## 1. 概要

本ガイドでは、Shirokuma MCP Knowledge Base v0.8.0の開発環境をゼロから構築する手順を説明します。v0.8.0は完全に新規のプロジェクトとして開発します。

## 2. 前提条件

### 2.1 必須ソフトウェア

| ソフトウェア | バージョン | 確認コマンド |
|------------|-----------|-------------|
| Node.js | 18.0.0以上 | `node --version` |
| npm | 9.0.0以上 | `npm --version` |
| Git | 2.x以上 | `git --version` |

### 2.2 推奨開発環境

- **OS**: macOS, Linux (Ubuntu 20.04+), Windows (WSL2)
- **エディタ**: Visual Studio Code
- **ターミナル**: iTerm2 (Mac), Windows Terminal (Windows)

## 3. プロジェクト初期化

### 3.1 プロジェクトディレクトリ作成

```bash
# プロジェクトディレクトリを作成
mkdir shirokuma-mcp-v0.8.0
cd shirokuma-mcp-v0.8.0

# Gitリポジトリを初期化
git init
```

### 3.2 package.json作成

```bash
npm init -y
```

`package.json`を以下のように編集:

```json
{
  "name": "shirokuma-mcp-kb",
  "version": "0.8.0",
  "description": "Simple GraphDB-like MCP Server for Knowledge Management",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx src/seed.ts",
    "db:reset": "rm -f ./data/*.db && npm run db:push && npm run db:seed"
  },
  "keywords": ["mcp", "knowledge-base", "graph", "cli"],
  "author": "",
  "license": "MIT",
  "type": "module"
}
```

## 4. 依存関係のインストール

### 4.1 本番依存関係

```bash
# Prisma ORM
npm install @prisma/client

# MCP SDK
npm install @modelcontextprotocol/sdk

# CLI関連
npm install commander chalk ora

# ユーティリティ
npm install dotenv zod
```

### 4.2 開発依存関係

```bash
# TypeScript
npm install -D typescript tsx @types/node

# Prisma CLI
npm install -D prisma

# テスト
npm install -D vitest @vitest/coverage-v8

# リンター & フォーマッター
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier eslint-plugin-prettier

# 型定義
npm install -D @types/commander
```

## 5. TypeScript設定

### 5.1 tsconfig.json作成

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "allowSyntheticDefaultImports": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

## 6. Prisma設定

### 6.1 Prisma初期化

```bash
npx prisma init --datasource-provider sqlite
```

### 6.2 schema.prisma編集

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../data/shirokuma.db"
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
  type        String
  title       String
  description String
  content     String    @db.Text
  statusId    Int       @map("status_id")
  priority    Priority  @default(MEDIUM)
  category    String?
  startDate   DateTime? @map("start_date")
  endDate     DateTime? @map("end_date")
  version     String?
  related     String?   // JSON array of IDs
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  status      Status    @relation(fields: [statusId], references: [id])
  tags        ItemTag[]
  
  @@index([type])
  @@index([statusId])
  @@index([priority])
  @@index([category])
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

### 6.3 データベース作成

```bash
# データディレクトリ作成
mkdir data

# データベースを作成してスキーマを適用
npx prisma db push

# Prismaクライアントを生成
npx prisma generate
```

## 7. プロジェクト構造

### 7.1 ディレクトリ構造作成

```bash
mkdir -p src/{cli,mcp,services,domain,infrastructure,utils}
mkdir -p src/domain/{entities,value-objects}
mkdir -p src/infrastructure/{repositories,database}
mkdir -p tests/{unit,integration,e2e}
```

### 7.2 最終的な構造

```
shirokuma-mcp-v0.8.0/
├── src/
│   ├── index.ts                 # エントリーポイント
│   ├── cli/                     # CLIインターフェース
│   │   ├── index.ts
│   │   └── commands/
│   ├── mcp/                     # MCPサーバー
│   │   ├── server.ts
│   │   └── tools/
│   ├── services/                # ビジネスロジック
│   │   ├── item-service.ts
│   │   ├── graph-service.ts
│   │   └── search-service.ts
│   ├── domain/                  # ドメインモデル
│   │   ├── entities/
│   │   └── value-objects/
│   ├── infrastructure/          # 技術的実装
│   │   ├── repositories/
│   │   └── database/
│   └── utils/                   # ユーティリティ
├── prisma/
│   └── schema.prisma
├── data/                        # SQLiteデータベース
│   └── shirokuma.db
├── tests/                       # テストファイル
├── docs/                        # ドキュメント
├── .env                         # 環境変数
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 8. 環境変数設定

### 8.1 .env作成

```bash
# .env
DATABASE_URL="file:./data/shirokuma.db"
LOG_LEVEL="info"
NODE_ENV="development"
MCP_PORT="3000"
```

### 8.2 .env.example作成

```bash
# .env.example
DATABASE_URL="file:./data/shirokuma.db"
LOG_LEVEL="info"
NODE_ENV="development"
MCP_PORT="3000"
```

## 9. 開発ツール設定

### 9.1 ESLint設定 (.eslintrc.json)

```json
{
  "env": {
    "es2022": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 9.2 Prettier設定 (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 9.3 Git設定 (.gitignore)

```
# Dependencies
node_modules/

# Build
dist/
*.tsbuildinfo

# Database
data/*.db
data/*.db-journal

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Testing
coverage/
*.log

# Temporary
tmp/
temp/
```

## 10. VSCode設定

### 10.1 推奨拡張機能 (.vscode/extensions.json)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "streetsidesoftware.code-spell-checker",
    "yoavbls.pretty-ts-errors"
  ]
}
```

### 10.2 ワークスペース設定 (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

## 11. 初期実装ファイル

### 11.1 エントリーポイント (src/index.ts)

```typescript
#!/usr/bin/env node
import { program } from 'commander';
import { startCLI } from './cli/index.js';
import { startMCPServer } from './mcp/server.js';

program
  .name('shirokuma')
  .description('Simple GraphDB-like MCP Server')
  .version('0.8.0');

program
  .option('-s, --serve', 'Start as MCP server')
  .option('-p, --port <port>', 'Server port', '3000');

program.parse();

const options = program.opts();

if (options.serve) {
  startMCPServer(parseInt(options.port));
} else {
  startCLI(program);
}
```

## 12. 開発開始

### 12.1 開発サーバー起動

```bash
# TypeScript開発サーバー
npm run dev

# Prisma Studio（データベース管理UI）
npx prisma studio
```

### 12.2 ビルド＆実行

```bash
# ビルド
npm run build

# 実行
npm start

# MCPサーバーとして起動
npm start -- --serve
```

### 12.3 テスト実行

```bash
# テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage
```

## 13. トラブルシューティング

### 13.1 よくある問題

**問題**: Prismaクライアントが見つからない
```bash
# 解決策
npx prisma generate
```

**問題**: TypeScriptのモジュール解決エラー
```bash
# 解決策: package.jsonに以下を追加
"type": "module"
```

**問題**: SQLiteデータベースがロックされる
```bash
# 解決策: データベースをリセット
npm run db:reset
```

## 14. 次のステップ

1. ドメインエンティティの実装
2. リポジトリパターンの実装
3. サービス層の実装
4. CLIコマンドの実装
5. MCPツールの実装
6. テストの作成
7. ドキュメントの整備

開発環境の準備が完了しました。次は[コーディング規約](./02-coding-standards.md)を確認してください。