# E2Eテストガイド

## 概要

エンドツーエンド（E2E）テストは、MCPプロトコルインターフェースを通じてMCP Knowledge Baseシステムの完全な機能を検証します。

## 現在の実装

### テスト構造

```
tests/e2e/
├── README.md         # クイックリファレンス
├── custom-runner.ts  # シンプルなテストランナー実装
└── old/             # 廃止されたテストファイル（参考用）
```

### 利用可能なテスト方法

#### カスタムランナー

プロジェクトには、MCPサーバーを起動して基本的なテストを実行するシンプルなカスタムテストランナーが含まれています：

```bash
# カスタムE2Eテストランナーを実行
npx tsx tests/e2e/custom-runner.ts
```

機能：
- テストデータベースでMCPサーバーを起動
- 接続と基本操作のテストを実行
- 完了後にテストデータをクリーンアップ
- TypeScript以外の外部依存関係なし

### MCP Inspectorによる対話的テスト

手動テストとデバッグには：

```bash
# MCP Inspectorでサーバーを起動
npx @modelcontextprotocol/inspector node dist/server.js
```

これによりブラウザベースのインターフェースが開き、以下のことができます：
- MCPツールを手動で呼び出す
- リクエストとレスポンスを検査
- ツール実装をデバッグ

## E2Eテストの実行

### 前提条件

1. プロジェクトをビルド：
   ```bash
   npm run build
   ```

2. 配布ファイルが最新であることを確認

### カスタムランナーの実行

```bash
# 直接実行
npx tsx tests/e2e/custom-runner.ts

# デバッグログ付き
LOG_LEVEL=debug npx tsx tests/e2e/custom-runner.ts
```

## テストシナリオ

カスタムランナーは現在以下をテストします：

1. **サーバー接続**
   - サーバー起動
   - 基本的な接続性

2. **基本的なCRUD操作**
   - イシューの作成
   - イシューの詳細取得
   - タグによる検索
   - イシューの削除

3. **パフォーマンスチェック**
   - 操作のレスポンスタイム
   - バッチ操作

## 新しいE2Eテストの作成

カスタムランナーにテストを追加するには：

1. `tests/e2e/custom-runner.ts`を開く
2. `runTests()`メソッドにテストを追加：

```typescript
await runner.runTest('テスト名', async () => {
  // テスト実装
  // テストを失敗させるにはエラーをスロー
  if (!condition) {
    throw new Error('テスト失敗: 理由');
  }
});
```

## 既知の制限事項

1. **MCPクライアント実装**: 現在のカスタムランナーは完全なMCPクライアントではなく、MCP相互作用をシミュレート
2. **限定的なテストカバレッジ**: 基本的なシナリオのみテスト
3. **Jest統合なし**: MCP SDKのESMモジュール解決の問題のため

## 将来の改善点

E2Eテストの潜在的な強化：

1. **完全なMCPクライアント統合**: プロトコル準拠のテストのための適切なMCPクライアント実装
2. **包括的なテストスイート**: 以下のテストを追加：
   - すべてのエンティティタイプ（plans、docs、knowledge）
   - セッション管理
   - タグ操作
   - ステータスフィルタリング
   - タイプ管理
3. **パフォーマンスベンチマーク**: 詳細なパフォーマンスメトリクスを追加
4. **CI/CD統合**: GitHub ActionsでE2Eテストを自動化

## トラブルシューティング

### サーバー起動の問題

サーバーの起動に失敗する場合：
- 他のプロセスがMCP stdioインターフェースを使用していないか確認
- ビルドが正常に完了したことを確認
- 初期化エラーのサーバーログを確認

### テストの失敗

デバッグログを有効化：
```bash
LOG_LEVEL=debug npx tsx tests/e2e/custom-runner.ts
```

### 手動デバッグ

対話的デバッグにはMCP Inspectorを使用：
```bash
npx @modelcontextprotocol/inspector node dist/server.js
```

## 参考資料

- [MCP SDKドキュメント](https://github.com/modelcontextprotocol/sdk)
- [カスタムランナー実装](../tests/e2e/custom-runner.ts)
- [E2Eテスト README](../tests/e2e/README.md)