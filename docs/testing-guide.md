# MCP Server Testing Guide

このドキュメントでは、Shirokuma MCP Knowledge Baseサーバーのテスト実行方法を説明します。

## テスト環境のセットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. プロジェクトのビルド

```bash
npm run build
```

## テスト実行方法

### 方法1: Jestによる自動テスト

```bash
# 単体テストのみ
npm run test:unit

# 統合テストのみ
npm run test:integration

# すべてのテスト
npm run test:all

# カバレッジ付き
npm run test:coverage
```

### テストカバレッジ

現在のテストカバレッジ状況：
- **全体カバレッジ**: 79.3%
- **関数カバレッジ**: 80.33% ✅
- **テスト数**: 952 tests (全てパス)
- **テストスイート**: 50 suites

### 方法2: シナリオベーステスト

```bash
npm run test:scenarios
```

### 方法3: MCPインスペクターを使用した手動テスト

1. MCPインスペクターをインストール：
```bash
npm install -g @modelcontextprotocol/inspector
```

2. MCPサーバーを起動：
```bash
npm run start
```

3. インスペクターでサーバーに接続：
```bash
mcp-inspector stdio -- node dist/server.js
```

4. ブラウザで http://localhost:5173 を開く

5. インスペクターUIでツールを実行してテスト

### 方法4: Claude Desktopでの統合テスト

1. Claude Desktopの設定ファイル（`~/Library/Application Support/Claude/claude_desktop_config.json`）に追加：

```json
{
  "mcpServers": {
    "shirokuma-knowledge-base": {
      "command": "node",
      "args": ["/path/to/mcp/dist/server.js"]
    }
  }
}
```

2. Claude Desktopを再起動

3. 会話内で以下のようにMCPツールを使用：
```
@mcp__shirokuma-knowledge-base__get_items(type: "issues")
```

## テストケース一覧

### 1. 初期状態確認
- 空のデータベース状態を確認
- デフォルトステータスの存在確認

### 2. データ作成
- Issue、Plan、Document、Knowledgeの作成
- Unicode文字（日本語、絵文字）のサポート
- 必須フィールドのバリデーション

### 3. データ取得・更新
- 個別アイテムの詳細取得
- フィールドの更新
- 関連アイテムの設定

### 4. タグ機能
- タグの自動登録
- タグによる検索
- タグの削除

### 5. ステータス管理
- カスタムステータスの使用
- Closedステータスのフィルタリング
- includeClosedStatusesパラメータ

### 6. セッション管理
- ワークセッションの作成
- 日付範囲での検索
- 最新セッションの取得

### 7. 日次サマリー
- サマリーの作成・更新
- 日付による取得

### 8. カスタムタイプ
- 新しいタイプの作成
- タイプ別のアイテム管理
- タイプの削除

### 9. エラーハンドリング
- 無効なデータの拒否
- 存在しないアイテムへのアクセス
- 重複データの防止

### 10. パフォーマンス
- 同時実行での動作確認
- 大量データの処理

## トラブルシューティング

### TypeScriptエラー
```bash
# 型定義を再生成
npm run build
```

### テストがタイムアウトする場合
```bash
# タイムアウトを延長
npm test -- --testTimeout=60000
```

### MCPサーバーが起動しない場合
```bash
# ログを確認
npm run dev
```

## CI/CD統合

### GitHub Actions設定例

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Run tests
      run: npm run test:all
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
```

## デバッグ方法

### VS Codeでのデバッグ

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test:integration"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### ログレベルの調整

環境変数でログレベルを設定：
```bash
LOG_LEVEL=debug npm test
```

## ベストプラクティス

1. **テストの独立性**: 各テストは他のテストに依存しない
2. **クリーンアップ**: テスト後は必ずデータを削除
3. **エラーケース**: 正常系だけでなく異常系もテスト
4. **並行実行**: 可能な限り並行実行でテスト
5. **モック使用**: 外部依存はモック化

## 参考リンク

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [Jest Documentation](https://jestjs.io/)