# Debugging Guide

Shirokuma MCP Knowledge Baseのデバッグとトラブルシューティングガイドです。

## デバッグツール

### 1. MCPインスペクター

MCPプロトコルの通信を可視化：

```bash
npm run inspect
```

インスペクターを使用して：
- ツール呼び出しをテスト
- リクエスト/レスポンスを確認
- エラーメッセージを詳細に確認

### 2. ログレベル設定

環境変数でログレベルを制御：

```bash
# 詳細なデバッグログ
export LOG_LEVEL=debug

# エラーのみ
export LOG_LEVEL=error

# デフォルト（info）
export LOG_LEVEL=info
```

### 3. VS Codeデバッグ設定

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "program": "${workspaceFolder}/src/server.ts",
      "runtimeArgs": ["-r", "tsx"],
      "env": {
        "LOG_LEVEL": "debug",
        "MCP_DATABASE_PATH": "${workspaceFolder}/.shirokuma/data"
      }
    }
  ]
}
```

## 一般的な問題と解決方法

### 1. データベースエラー

#### 症状
```
Error: SQLITE_BUSY: database is locked
```

#### 解決方法
```bash
# データベースプロセスを確認
lsof | grep search.db

# データベースを再構築
npm run rebuild-db
```

#### 根本原因
- 複数のプロセスが同時にアクセス
- 未完了のトランザクション
- ファイルロックが残っている

### 2. ファイルが見つからない

#### 症状
```
Error: ENOENT: no such file or directory
```

#### 解決方法
```bash
# データディレクトリを確認
ls -la .shirokuma/data/

# 必要なディレクトリを作成
mkdir -p .shirokuma/data/{issues,plans,docs,knowledge,sessions}

# 権限を確認
chmod -R 755 .shirokuma/data/
```

### 3. MCPクライアント接続エラー

#### 症状
```
Failed to connect to MCP server
```

#### 解決方法
1. サーバーがビルドされているか確認
   ```bash
   npm run build
   ```

2. パスが正しいか確認（絶対パスを使用）
   ```json
   {
     "command": "node",
     "args": ["/absolute/path/to/dist/server.js"]
   }
   ```

3. Node.jsバージョンを確認
   ```bash
   node --version  # 18以上が必要
   ```

### 4. メモリ不足エラー

#### 症状
```
FATAL ERROR: Reached heap limit Allocation failed
```

#### 解決方法
```bash
# メモリ制限を増やす
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## デバッグテクニック

### 1. ログポイントの追加

重要な処理にログを追加：

```typescript
import { logger } from './utils/logger';

logger.debug('Processing item', { type, id, title });
logger.info('Item created successfully', { id: result.id });
logger.error('Failed to create item', { error, params });
```

### 2. データベースクエリのトレース

SQLiteクエリをログ出力：

```typescript
db.on('trace', (sql) => {
  logger.debug('SQL Query', { sql });
});
```

### 3. エラースタックトレース

詳細なエラー情報を取得：

```typescript
try {
  // 処理
} catch (error) {
  logger.error('Operation failed', {
    message: error.message,
    stack: error.stack,
    params: JSON.stringify(params)
  });
  throw error;
}
```

### 4. パフォーマンス計測

処理時間を計測：

```typescript
const startTime = Date.now();
try {
  const result = await operation();
  const duration = Date.now() - startTime;
  logger.info('Operation completed', { duration });
  return result;
} catch (error) {
  const duration = Date.now() - startTime;
  logger.error('Operation failed', { duration, error });
  throw error;
}
```

## 環境別デバッグ

### 開発環境

```bash
# フルデバッグモード
export NODE_ENV=development
export LOG_LEVEL=debug
export DEBUG=mcp:*

npm run dev
```

### テスト環境

```bash
# テストデバッグ
export KEEP_TEST_DATA=true
npm test -- --verbose --bail
```

### 本番環境

```bash
# 最小限のログ
export NODE_ENV=production
export LOG_LEVEL=error

# ヘルスチェック
curl http://localhost:3000/health
```

## デバッグチェックリスト

### 初期設定の確認

- [ ] Node.jsバージョンが18以上
- [ ] 依存関係がインストールされている
- [ ] ビルドが成功している
- [ ] データディレクトリが存在する
- [ ] 適切な権限が設定されている

### エラー発生時の確認

- [ ] エラーメッセージの詳細を確認
- [ ] ログファイルを確認
- [ ] データベースの状態を確認
- [ ] ファイルシステムの状態を確認
- [ ] メモリ使用量を確認

### パフォーマンス問題の確認

- [ ] データベースインデックスが作成されている
- [ ] 大量のデータがないか確認
- [ ] メモリリークがないか確認
- [ ] CPU使用率を確認
- [ ] ディスクI/Oを確認

## 高度なデバッグ

### 1. プロファイリング

```bash
# CPUプロファイル
node --cpu-prof dist/server.js

# ヒープスナップショット
node --heap-prof dist/server.js
```

### 2. メモリリーク検出

```javascript
// メモリ使用量を定期的にログ
setInterval(() => {
  const usage = process.memoryUsage();
  logger.info('Memory usage', {
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB'
  });
}, 60000);
```

### 3. トレーシング

```typescript
// OpenTelemetryトレーシング（将来実装予定）
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('mcp-server');
const span = tracer.startSpan('createItem');
try {
  // 処理
} finally {
  span.end();
}
```

## サポート

デバッグで解決できない問題は：

1. [GitHub Issues](https://github.com/your-repo/issues)で報告
2. ログファイルを添付
3. 再現手順を記載
4. 環境情報を含める