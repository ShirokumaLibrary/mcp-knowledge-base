# 開発ガイド

## 開発環境のセットアップ

### 前提条件

- Node.js 18.0以上
- npm 8.0以上
- Git
- VSCode（推奨）またはお好みのエディタ

### 初期セットアップ

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/your-username/shirokuma-mcp-knowledge-base.git
   cd shirokuma-mcp-knowledge-base
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   ```

3. **環境変数を設定**
   ```bash
   cp .env.example .env
   # .envファイルを編集して設定を調整
   ```

4. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

## プロジェクト構造

```
shirokuma-mcp-knowledge-base/
├── src/                    # ソースコード
│   ├── server.ts          # MCPサーバーエントリーポイント
│   ├── handlers/          # リクエストハンドラー
│   ├── database/          # データアクセス層
│   ├── schemas/           # Zodスキーマ定義
│   ├── types/             # TypeScript型定義
│   ├── utils/             # ユーティリティ関数
│   ├── errors/            # カスタムエラークラス
│   └── security/          # セキュリティ関連
├── tests/                 # テストファイル
│   ├── unit/             # ユニットテスト
│   ├── integration/      # 統合テスト
│   └── e2e/              # E2Eテスト
├── docs/                  # ドキュメント（英語）
├── docs.ja/               # ドキュメント（日本語）
└── scripts/               # ユーティリティスクリプト
```

## 開発ワークフロー

### 1. 新機能の開発

1. **イシューを作成**
   - 機能の説明
   - 実装計画
   - 影響範囲

2. **ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **TDDで開発**
   - テストを書く
   - 実装する
   - リファクタリング

4. **コミット**
   ```bash
   git add .
   git commit -m "feat: 新機能の説明"
   ```

### 2. バグ修正

1. **バグを再現**
   - 失敗するテストを書く
   - バグを確認

2. **修正を実装**
   - 最小限の変更で修正
   - テストが通ることを確認

3. **回帰テスト**
   - 関連する全テストを実行
   - 新しいバグを導入していないことを確認

## コーディング標準

### TypeScriptスタイルガイド

```typescript
// インターフェースはPascalCase
interface UserData {
  id: number;
  name: string;
  createdAt: Date;
}

// 型エイリアスもPascalCase
type UserId = string | number;

// 関数はcamelCase
function getUserById(id: UserId): Promise<UserData> {
  // 実装
}

// 定数はUPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// クラスはPascalCase
class UserRepository {
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  async findById(id: UserId): Promise<UserData | null> {
    // 実装
  }
}
```

### ファイル構成

```typescript
// 1. インポート（外部 → 内部の順）
import { z } from 'zod';
import type { Database } from 'sqlite3';

import { BaseRepository } from './base-repository.js';
import { createLogger } from '../utils/logger.js';
import type { Issue, CreateIssueInput } from '../types/index.js';

// 2. 定数定義
const TABLE_NAME = 'issues';
const logger = createLogger('IssueRepository');

// 3. 型定義
interface IssueRow {
  id: number;
  title: string;
  // ...
}

// 4. メインクラス/関数
export class IssueRepository extends BaseRepository<Issue> {
  // 実装
}

// 5. ヘルパー関数
function mapRowToIssue(row: IssueRow): Issue {
  // 実装
}

// 6. エクスポート
export { IssueRepository };
```

## 開発ツール

### VSCode拡張機能

推奨される拡張機能（`.vscode/extensions.json`）:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-tslint-plugin",
    "streetsidesoftware.code-spell-checker",
    "wayou.vscode-todo-highlight"
  ]
}
```

### デバッグ設定

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/src/server.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "env": {
        "LOG_LEVEL": "debug"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### スクリプト

**開発用スクリプト:**
```bash
# 開発サーバー（ホットリロード付き）
npm run dev

# TypeScriptをビルド
npm run build

# リンターを実行
npm run lint

# テストを実行
npm test

# テストをウォッチモードで実行
npm test -- --watch

# カバレッジレポートを生成
npm test -- --coverage
```

**データベース管理:**
```bash
# データベースを再構築
npm run rebuild-db

# マイグレーションを実行
npm run migrate
```

## ローカルテスト

### MCPクライアントとの統合テスト

1. **サーバーをビルド**
   ```bash
   npm run build
   ```

2. **テスト用設定を作成**
   ```json
   {
     "mcpServers": {
       "shirokuma-test": {
         "command": "node",
         "args": ["./dist/server.js"],
         "cwd": "/path/to/project"
       }
     }
   }
   ```

3. **MCPクライアントで接続**
   - Claude Desktopまたは他のMCPクライアントを使用
   - 上記の設定を適用
   - ツールが利用可能か確認

### テストデータの準備

```bash
# テストデータを生成
npm run generate-test-data

# 特定のタイプのテストデータ
npm run generate-test-data -- --type=issues --count=100
```

## トラブルシューティング

### よくある問題

1. **TypeScriptビルドエラー**
   ```bash
   # クリーンビルド
   rm -rf dist
   npm run build
   ```

2. **依存関係の問題**
   ```bash
   # node_modulesを削除して再インストール
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **データベースエラー**
   ```bash
   # データベースを再構築
   npm run rebuild-db
   ```

### デバッグ Tips

1. **ログレベルを上げる**
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

2. **特定のモジュールのログ**
   ```typescript
   const logger = createLogger('MyModule', { level: 'debug' });
   ```

3. **ブレークポイントデバッグ**
   - VSCodeのデバッグ機能を使用
   - `debugger;`文を挿入
   - Chrome DevToolsを使用

## パフォーマンス分析

### プロファイリング

```bash
# CPUプロファイル
node --prof dist/server.js
node --prof-process isolate-*.log > profile.txt

# メモリプロファイル
node --expose-gc --trace-gc dist/server.js

# ヒープスナップショット
node --heapsnapshot-signal=SIGUSR2 dist/server.js
```

### ベンチマーク

```bash
# パフォーマンステストを実行
npm run benchmark

# 特定の操作をベンチマーク
npm run benchmark -- --operation=create --iterations=1000
```

## リリース準備

### チェックリスト

- [ ] 全テストが通る
- [ ] リンターエラーなし
- [ ] ドキュメントが最新
- [ ] CHANGELOGを更新
- [ ] バージョン番号を更新
- [ ] セキュリティ監査を実行

### リリースプロセス

```bash
# バージョンを更新
npm version patch|minor|major

# ビルドとテスト
npm run build
npm test

# タグをプッシュ
git push origin main --tags

# リリースノートを作成
# GitHubでリリースを作成
```