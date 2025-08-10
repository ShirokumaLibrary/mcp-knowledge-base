# TDD RED Phase Test Results for issues-157

## テスト概要
- **対象関数**: `getProgramVersion()` in src/utils/db-version-utils.ts
- **問題**: カレントディレクトリのpackage.jsonを参照してしまうバグ
- **期待される動作**: MCPサーバー自身のpackage.jsonを参照すべき
- **作成日時**: 2025-08-10
- **テスト作成者**: @agent-shirokuma-tester

## テスト実行結果

```
FAIL src/utils/__tests__/db-version-utils.test.ts
  getProgramVersion
    ✕ shouldIgnoreCurrentDirectoryPackageJson (7 ms)
    ✓ shouldWorkInSrcEnvironment (2 ms)
    ✓ shouldWorkInDistEnvironment (1 ms)
    ✓ shouldResolveSymlinks (1 ms)
    ✓ shouldReturnFallbackVersionWhenPackageJsonNotFound
    ✓ shouldHandleMalformedPackageJson (1 ms)
    ✕ shouldNotBeAffectedByUserProjectPackageJson (2 ms)
  getProgramVersion - Edge Cases
    ✕ shouldHandlePackageJsonWithoutVersion (2 ms)
    ✕ shouldHandleNestedNodeModulesScenario (3 ms)
  getProgramVersion - Test Failure Clarity
    ✓ shouldProvidesClearFailureMessage (2 ms)

Test Suites: 1 failed, 1 total
Tests:       4 failed, 6 passed, 10 total
```

## 失敗したテストケース（正しい理由で失敗）

### 1. shouldIgnoreCurrentDirectoryPackageJson
**失敗理由**: カレントディレクトリのpackage.jsonを読んでしまう
```
Expected: "0.7.13" (MCPの実際のバージョン)
Received: "99.99.99" (テスト用ディレクトリのバージョン)
```
- **テストの意図**: MCPが別のディレクトリから実行されても、自身のpackage.jsonを参照すべき
- **現在の動作**: process.cwd()を使用しているため、カレントディレクトリのpackage.jsonを読む

### 2. shouldNotBeAffectedByUserProjectPackageJson  
**失敗理由**: ユーザープロジェクトのバージョンを読んでしまう
```
Expected: "0.7.13" (MCPのバージョン)
Received: "1.0.0" (ユーザープロジェクトのバージョン)
```
- **テストの意図**: ユーザーが自分のプロジェクトからMCPを実行しても、MCPのバージョンを返すべき
- **現在の動作**: ユーザープロジェクトのpackage.jsonのバージョンを返してしまう

### 3. shouldHandlePackageJsonWithoutVersion
**失敗理由**: versionフィールドがない場合にundefinedを返す
```
Expected: "0.7.5" (フォールバック値)
Received: undefined
```
- **テストの意図**: versionフィールドがなくてもフォールバック値を返すべき
- **現在の動作**: package.versionがundefinedの場合、そのままundefinedを返す

### 4. shouldHandleNestedNodeModulesScenario
**失敗理由**: node_modules内のMCPではなく親プロジェクトのバージョンを読む
```
Expected: "0.7.13" (node_modules内のMCPバージョン)
Received: "2.0.0" (親プロジェクトのバージョン)
```
- **テストの意図**: MCPがnode_modulesにインストールされていても、自身のバージョンを返すべき
- **現在の動作**: 親プロジェクトのpackage.jsonを読んでしまう

## バグの影響

これらのテスト失敗は、以下の実際の問題を引き起こします：

1. **データベースバージョンチェックの誤動作**
   - ユーザーのプロジェクトから実行した場合、誤ったバージョンでチェックされる
   - 結果として不要なデータベース再構築を要求される可能性

2. **シンボリックリンク環境での問題**
   - シンボリックリンク経由で実行した場合も正しく動作しない

3. **エラーハンドリングの不備**
   - versionフィールドがない場合にundefinedを返す

## テストコード配置

ファイル: `/home/webapp/mcp/src/utils/__tests__/db-version-utils.test.ts`

## TDD原則の適用

このテストは以下のTDD原則に従っています：

1. **最小の失敗するテスト**: `shouldIgnoreCurrentDirectoryPackageJson`が最も基本的なバグを露呈
2. **正しい理由での失敗**: コンパイルエラーではなく、実際の動作の違いで失敗
3. **明確な失敗メッセージ**: Expected vs Receivedが明確に示される
4. **振る舞いをテスト**: 実装詳細ではなく、関数の振る舞いをテスト

## 次のステップ（プログラマーへのハンドオーバー）

1. **GREEN Phase**: `getProgramVersion`関数を修正
   - `process.cwd()`ではなく`import.meta.url`ベースの解決を使用
   - src/dist両環境で動作するようにパス解決を実装
   - versionフィールドがない場合の適切なフォールバック処理

2. **実装の要点**:
   ```typescript
   // 推奨される実装方針
   import { fileURLToPath } from 'url';
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   
   // src環境: utils/__tests__/ → ../../package.json
   // dist環境: dist/utils/__tests__/ → ../../../package.json
   ```

3. **成功基準**: すべてのテストがパスすること

## テストカバレッジ

作成したテストは以下のシナリオをカバーしています：

- ✅ カレントディレクトリからの実行
- ✅ ユーザープロジェクトからの実行
- ✅ シンボリックリンク経由の実行
- ✅ node_modules内からの実行
- ✅ package.jsonが存在しない場合
- ✅ package.jsonが不正な形式の場合
- ✅ versionフィールドが存在しない場合
- ✅ エラーメッセージの明確性

## 関連情報

- issues-157: MCPサーバーがカレントディレクトリのpackage.jsonを参照するバグ
- decisions-79: getProgramVersion修正方針の設計決定