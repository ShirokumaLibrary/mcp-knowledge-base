# アップグレードガイド

このガイドは、Shirokuma MCPナレッジベースのメジャーバージョン間のアップグレードを支援します。

## 0.1.0へのアップグレード

### 破壊的変更

1. **リポジトリパターンの変更**
   - 全てのリポジトリが適切な型制約を持つ`BaseRepository`を拡張するようになりました
   - リポジトリコンストラクタは生のsqlite3の代わりに`./base.js`から`Database`型を要求します

   ```typescript
   // 以前
   import { Database } from 'sqlite3';
   
   // 以後
   import { Database } from './base.js';
   ```

2. **型安全性の改善**
   - 多くの`any`型が適切な型に置き換えられました
   - データベース操作は`DatabaseRow`と`QueryParameters`型を使用するようになりました
   
   ```typescript
   // 以前
   const row: any = await db.getAsync(sql);
   
   // 以後
   const row: DatabaseRow | undefined = await db.getAsync(sql);
   ```

3. **エラーハンドリング**
   - 全てのエラーは適切なエラーコードを持つ`BaseError`を拡張するようになりました
   - エラーミドルウェアが全てのエラータイプを一貫して処理します
   
   ```typescript
   // 以前
   throw new Error('Not found');
   
   // 以後
   throw new NotFoundError('Resource not found', { resource: 'item', id: 123 });
   ```

### 新機能

1. **パフォーマンス最適化**
   - 頻繁にアクセスされるデータのメモリキャッシング
   - バルク操作のバッチ処理
   - パフォーマンス監視ユーティリティ
   
   ```typescript
   import { MemoryCache, BatchProcessor } from './utils/performance-utils.js';
   
   const cache = new MemoryCache<Item>(100, 60000); // 100アイテム、1分TTL
   const processor = new BatchProcessor<Item>(items => processItems(items), 10, 100);
   ```

2. **セキュリティ強化**
   - 全てのユーザー入力の入力サニタイゼーション
   - 設定可能な制限付きレート制限
   - ロールベースアクセス制御
   
   ```typescript
   import { InputSanitizer, RateLimiter, AccessControlManager } from './security/index.js';
   
   // ユーザー入力をサニタイズ
   const sanitized = InputSanitizer.sanitizeString(userInput, 'fieldName');
   
   // レート制限
   const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 60 });
   ```

3. **テストの改善**
   - MCPプロトコルを通じたE2Eテスト
   - 全エンティティのモックファクトリー
   - テストヘルパーとユーティリティ
   
   ```typescript
   import { setupE2ETest, callTool } from './tests/e2e/setup-e2e.js';
   import { createMockIssue } from './tests/mocks/index.js';
   
   const context = await setupE2ETest();
   const result = await callTool(context.client, 'create_item', createMockIssue());
   ```

### マイグレーション手順

1. **TypeScript設定を更新**
   ```bash
   npm install
   npm run build
   ```

2. **型エラーを修正**
   - `any`型を適切な型に置き換え
   - リポジトリのインポートを更新
   - ジェネリック型制約を修正

3. **エラーハンドリングを更新**
   - 汎用エラーを特定のエラータイプに置き換え
   - 必要に応じてエラーコードを追加
   - catchブロックを更新

4. **アプリケーションをテスト**
   ```bash
   npm run test:unit
   npm run test:integration
   npm run test:e2e
   ```

5. **セキュリティ機能を有効化**（オプション）
   ```typescript
   import { createSecureHandler } from './security/secure-handlers.js';
   
   const handler = createSecureHandler(databasePath, {
     rateLimit: { enabled: true },
     accessControl: { enabled: true }
   });
   ```

### 非推奨

- リポジトリを使用しない直接的なデータベースアクセスは非推奨
- 型なしエラーのスローは非推奨
- デバッグ用のconsole.logは構造化ログに置き換えられました

### サポート

アップグレード中に問題が発生した場合：
1. 詳細な変更については[CHANGELOG.md](../CHANGELOG.md)を確認
2. 更新されたインターフェースについては[APIリファレンス](./API.md)をレビュー
3. プロジェクトリポジトリにイシューを提出