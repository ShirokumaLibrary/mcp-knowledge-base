# E2Eテストガイド

## 概要

エンドツーエンド（E2E）テストは、実際のMCPプロトコルインターフェースを通じてMCPナレッジベースシステムの完全な機能を検証します。

> **更新**: mcp-jestを含む複数のE2Eテストソリューションが利用可能になりました。

## テスト構造

### テストスイート

1. **CRUD操作** (`crud-operations.e2e.test.ts`)
   - 全エンティティタイプの完全なライフサイクルテスト
   - クロスタイプ操作
   - バッチ操作

2. **検索機能** (`search-functionality.e2e.test.ts`)
   - 全文検索
   - タグベース検索
   - 高度な検索機能

3. **パフォーマンス** (`performance.e2e.test.ts`)
   - レスポンスタイムベンチマーク
   - 負荷テスト
   - メモリ使用監視

4. **セキュリティ** (`security.e2e.test.ts`)
   - 入力検証
   - SQLインジェクション防止
   - XSS防止
   - エラーハンドリング

5. **ワークフロー** (`workflow.e2e.test.ts`)
   - プロジェクト管理ワークフロー
   - ナレッジ管理ワークフロー
   - タグ組織化ワークフロー

## E2Eテストの実行

### 前提条件

1. プロジェクトをビルド：
   ```bash
   npm run build
   ```

2. デフォルトポートでMCPサーバーが実行されていないことを確認

### テストオプション

#### オプション1: mcp-jestを使用（推奨）

```bash
# mcp-jestをインストール
npm install --save-dev mcp-jest

# テストを実行
npm run test:e2e:mcp-jest
```

#### オプション2: MCP Inspectorを使用

```bash
# インタラクティブテスト
npx @modelcontextprotocol/inspector node dist/server.js
```

#### オプション3: カスタムテストランナー

```bash
# カスタムE2Eテストを実行
npm run test:e2e:custom
```

### 既知の問題と解決策

- **ESMモジュール解決**: MCP SDKにはJest ESMモジュール解決の既知の問題があります
- **解決策**: [E2Eテスト実装ソリューション](./e2e-testing-solutions.md)に記載されている`mcp-jest`またはカスタムテストランナーを使用

または、テストランナーを直接使用：

```bash
npx tsx tests/e2e/run-e2e-tests.ts
```

### 個別のテストスイートを実行

```bash
npx jest tests/e2e/crud-operations.e2e.test.ts
```

### デバッグ付きで実行

```bash
SHOW_TEST_LOGS=true npm run test:e2e
```

## テスト環境

### セットアップ

各テストスイートは：
1. 一時的なテストデータベースを作成
2. MCPサーバーインスタンスを開始
3. MCPクライアントを接続
4. テストシナリオを実行
5. 全リソースをクリーンアップ

### テストユーティリティ

**セットアップ関数**：
```typescript
// テスト環境をセットアップ
const context = await setupE2ETest();

// MCPツールを呼び出し
const result = await callTool(context.client, 'tool_name', { params });

// テストシナリオを実行
await runScenario('シナリオ名', [
  {
    name: 'ステップ名',
    action: async () => { /* テストアクション */ },
    assertions: (result) => { /* アサーション */ }
  }
]);
```

**パフォーマンステスト**：
```typescript
const { result, duration } = await measurePerformance(
  async () => { /* 操作 */ },
  '操作名'
);
```

## パフォーマンス目標

### レスポンスタイム

- **作成**: < 100ms
- **読み取り**: < 50ms
- **更新**: < 100ms
- **削除**: < 50ms
- **リスト**: < 200ms
- **検索**: < 500ms

### 負荷テスト

- 10の同時操作を処理
- タイプごとに100以上のアイテムをサポート
- 長時間の操作中にメモリリークなし

## E2Eテストの作成

### ベストプラクティス

1. **説明的な名前を使用**
   ```typescript
   it('完全なイシューライフサイクルを実行する', async () => {
   ```

2. **テスト後のクリーンアップ**
   ```typescript
   afterAll(async () => {
     await context.cleanup();
   });
   ```

3. **テストフィクスチャを使用**
   ```typescript
   const testIssue = {
     title: 'テストイシュー',
     content: 'テストコンテンツ',
     priority: 'high'
   };
   ```

4. **実際のワークフローをテスト**
   ```typescript
   await runScenario('プロジェクト管理', [
     { name: 'プロジェクトを作成', ... },
     { name: 'タスクを追加', ... },
     { name: 'ステータスを更新', ... }
   ]);
   ```

5. **エッジケースを検証**
   - 空の入力
   - 無効なデータ
   - 大きなデータセット
   - 同時操作

### テスト例

```typescript
describe('E2E: 機能名', () => {
  let context: E2ETestContext;
  
  beforeAll(async () => {
    context = await setupE2ETest();
  });
  
  afterAll(async () => {
    await context.cleanup();
  });
  
  it('特定の機能をテストする', async () => {
    await runScenario('機能テスト', [
      {
        name: 'テストデータをセットアップ',
        action: async () => {
          return await callTool(context.client, 'create_item', {
            type: 'issues',
            title: 'テスト',
            content: 'コンテンツ'
          });
        },
        assertions: (result) => {
          expect(result.id).toBeDefined();
        }
      }
    ]);
  });
});
```

## トラブルシューティング

### 一般的な問題

1. **サーバー起動タイムアウト**
   - ポートが既に使用されているかチェック
   - `setupE2ETest()`でタイムアウトを増やす
   - エラーのためサーバーログをチェック

2. **テストの失敗**
   - `SHOW_TEST_LOGS=true`で実行
   - 一時的なテストデータベースをチェック
   - MCPサーバーが正しくビルドされているか確認

3. **メモリの問題**
   - テストを個別に実行
   - afterAllフックでのクリーンアップをチェック
   - `--detectOpenHandles`で監視

### デバッグモード

詳細なログを有効化：
```bash
LOG_LEVEL=debug SHOW_TEST_LOGS=true npm run test:e2e
```

## CI/CD統合

### GitHub Actions

```yaml
- name: E2Eテストを実行
  run: |
    npm ci
    npm run build
    npm run test:e2e
  env:
    CI: true
```

### テストレポート

E2Eテストは`test-results/e2e/`にJSONレポートを生成：
- テストサマリー
- 個別のスイート結果
- パフォーマンスメトリクス
- 環境情報

## メンテナンス

### 新しいテストの追加

1. `tests/e2e/`にテストファイルを作成
2. `run-e2e-tests.ts`の`testSuites`に追加
3. 既存のパターンに従う
4. ドキュメントを更新

### テストの更新

API変更時：
1. テストフィクスチャを更新
2. ツール呼び出しを修正
3. アサーションを調整
4. 完全なスイートを実行

### パフォーマンス監視

定期的なタスク：
- テストレポートをレビュー
- パフォーマンス目標を更新
- 遅いテストを最適化
- 新しいシナリオを追加