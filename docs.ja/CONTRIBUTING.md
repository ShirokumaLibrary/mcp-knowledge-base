# Shirokuma MCPナレッジベースへの貢献

Shirokuma MCPナレッジベースへの貢献に興味を持っていただきありがとうございます！この文書はプロジェクトへの貢献のためのガイドラインと手順を提供します。

## 目次

- [行動規範](#行動規範)
- [はじめに](#はじめに)
- [開発プロセス](#開発プロセス)
- [コーディング標準](#コーディング標準)
- [テスト](#テスト)
- [変更の提出](#変更の提出)
- [問題の報告](#問題の報告)

## 行動規範

このプロジェクトに参加することで、全ての貢献者に対して敬意を持ち、包括的な環境を維持することに同意します。

## はじめに

### 前提条件

- Node.js 18.0以上
- npm 8.0以上
- Git
- TypeScriptとMCPの基本的な知識

### セットアップ

1. リポジトリをフォーク
2. フォークをクローン：
   ```bash
   git clone https://github.com/your-username/shirokuma-mcp-knowledge-base.git
   cd shirokuma-mcp-knowledge-base
   ```

3. 依存関係をインストール：
   ```bash
   npm install
   ```

4. プロジェクトをビルド：
   ```bash
   npm run build
   ```

5. テストを実行して全てが動作することを確認：
   ```bash
   npm test
   ```

## 開発プロセス

### ブランチ戦略

- `main` - 安定したリリースブランチ
- `develop` - 開発ブランチ
- `feature/*` - 機能ブランチ
- `bugfix/*` - バグ修正ブランチ
- `hotfix/*` - 本番環境の緊急修正

### ワークフロー

1. `develop`から機能ブランチを作成：
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. コーディング標準に従って変更を行う

3. 変更のためのテストを作成/更新

4. 全てのテストが通ることを確認：
   ```bash
   npm run test:all
   ```

5. 明確なメッセージで変更をコミット

6. フォークにプッシュしてプルリクエストを作成

## コーディング標準

### TypeScriptガイドライン

1. **型安全性**
   - `any`型の使用を避ける
   - 適切な型定義を使用
   - TypeScriptの型推論を活用

2. **命名規則**
   - 変数と関数にはcamelCaseを使用
   - 型とクラスにはPascalCaseを使用
   - 定数にはUPPER_SNAKE_CASEを使用

3. **ファイル構成**
   ```
   src/
   ├── handlers/      # MCPツールハンドラー
   ├── database/      # データアクセス層
   ├── schemas/       # Zodスキーマ
   ├── types/         # TypeScript型
   ├── utils/         # ユーティリティ関数
   └── security/      # セキュリティユーティリティ
   ```

### コードスタイル

1. **関数**
   - 関数を小さく、焦点を絞る
   - 説明的な名前を使用
   - パブリックAPIにはJSDocコメントを追加

   ```typescript
   /**
    * システムに新しいイシューを作成
    * @param data イシュー作成データ
    * @returns 生成されたIDを持つ作成されたイシュー
    */
   async function createIssue(data: CreateIssueInput): Promise<Issue> {
     // 実装
   }
   ```

2. **エラーハンドリング**
   - カスタムエラークラスを使用
   - 意味のあるエラーメッセージを提供
   - エラーにコンテキストを含める

   ```typescript
   throw new ValidationError('無効なイシューデータ', { 
     field: 'title', 
     value: data.title 
   });
   ```

3. **非同期/待機**
   - コールバックよりも常にasync/awaitを使用
   - Promiseの拒否を適切に処理
   - エラーハンドリングにはtry-catchを使用

### AIアノテーション

コンテキストを提供するためにAIアノテーションを使用：

- `@ai-context` - コードに関する一般的なコンテキスト
- `@ai-pattern` - 使用されているデザインパターン
- `@ai-critical` - 重要な実装の詳細
- `@ai-flow` - データフローの説明
- `@ai-why` - 決定の背後にある理由

例：
```typescript
/**
 * @ai-context イシューを管理するためのリポジトリ
 * @ai-pattern キャッシング付きリポジトリパターン
 * @ai-critical 参照整合性を維持
 */
export class IssueRepository extends BaseRepository<Issue> {
  // 実装
}
```

## テスト

### テスト構造

- ユニットテスト：`src/**/*.test.ts`
- 統合テスト：`tests/integration/*.test.ts`
- E2Eテスト：`tests/e2e/*.e2e.test.ts`

### テストの作成

1. **ユニットテスト**
   ```typescript
   describe('IssueRepository', () => {
     it('有効なデータでイシューを作成する', async () => {
       const issue = await repository.create({
         title: 'テストイシュー',
         content: 'テストコンテンツ'
       });
       
       expect(issue.id).toBeDefined();
       expect(issue.title).toBe('テストイシュー');
     });
   });
   ```

2. **統合テスト**
   - 完全なワークフローをテスト
   - 実際のデータベース接続を使用
   - テストデータをクリーンアップ

3. **E2Eテスト**
   - MCPプロトコルを通じてテスト
   - 完全なシナリオを検証
   - パフォーマンスメトリクスをチェック

### テストの実行

```bash
# 全テストを実行
npm run test:all

# 特定のテストタイプを実行
npm run test:unit
npm run test:integration
npm run test:e2e

# カバレッジ付きで実行
npm test -- --coverage
```

## 変更の提出

### プルリクエストプロセス

1. **提出前**
   - 全てのテストが通ることを確認
   - リンターを実行：`npm run lint`
   - 必要に応じてドキュメントを更新
   - CHANGELOG.mdにエントリを追加

2. **PR説明**
   - 変更を明確に説明
   - 関連するイシューを参照
   - UI変更の場合はスクリーンショットを含める
   - 破壊的変更をリスト

3. **PRテンプレート**
   ```markdown
   ## 説明
   変更の簡潔な説明

   ## 変更のタイプ
   - [ ] バグ修正
   - [ ] 新機能
   - [ ] 破壊的変更
   - [ ] ドキュメント更新

   ## テスト
   - [ ] ユニットテストが通る
   - [ ] 統合テストが通る
   - [ ] E2Eテストが通る

   ## チェックリスト
   - [ ] コードがスタイルガイドラインに従っている
   - [ ] セルフレビューを完了
   - [ ] 複雑なコードにコメントを追加
   - [ ] ドキュメントを更新
   - [ ] 新しい警告なし
   ```

### コードレビュー

- 全てのレビューコメントに対応
- フィードバックに対してオープンに
- 必要に応じて理由を説明
- フィードバックに基づいてPRを更新

## 問題の報告

### バグレポート

以下を含める：
- 明確な説明
- 再現手順
- 期待される動作
- 実際の動作
- 環境の詳細
- エラーメッセージ/ログ

### 機能リクエスト

以下を含める：
- ユースケースの説明
- 提案された解決策
- 代替解決策
- 既存機能への影響

### セキュリティ問題

- パブリックなイシューを作成しない
- セキュリティの懸念をメールで送信：shirokuma@gadget.to
- 詳細な説明を含める
- 開示前に返答を待つ

## 開発のヒント

### デバッグ

1. console.logの代わりにロガーを使用：
   ```typescript
   import { createLogger } from './utils/logger.js';
   const logger = createLogger('MyModule');
   logger.debug('デバッグメッセージ', { data });
   ```

2. デバッグログを有効化：
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

### パフォーマンス

1. 高コストな操作にはキャッシングを使用
2. データベース操作をバッチ処理
3. パフォーマンスユーティリティで監視
4. 最適化前にプロファイリング

### 一般的な問題

1. **ビルドエラー**
   - クリーンして再ビルド：`rm -rf dist && npm run build`
   - TypeScriptバージョンの互換性をチェック

2. **テストの失敗**
   - クリーンなテストデータベースを確保
   - タイミングの問題をチェック
   - モックデータを検証

3. **MCP接続の問題**
   - サーバーが実行中かチェック
   - ポートの可用性を確認
   - MCP設定をレビュー

## リソース

- [TypeScriptドキュメント](https://www.typescriptlang.org/docs/)
- [MCPドキュメント](https://modelcontextprotocol.io/docs)
- [プロジェクトアーキテクチャ](./architecture.md)
- [APIリファレンス](./API.md)

## 質問がありますか？

- まず既存のイシューをチェック
- イシューでディスカッションに参加
- 必要に応じてメンテナーに連絡

Shirokuma MCPナレッジベースへの貢献をありがとうございます！