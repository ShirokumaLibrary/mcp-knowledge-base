---
id: 181
type: spec_tasks
title: "Tasks: 自動エクスポート時のフロントマター欠落問題の修正"
status: Ready
priority: HIGH
description: "spec #180のタスクフェーズ - AIエンリッチメント後のデータ再取得とエクスポート同期化の実装タスク"
aiSummary: "Task breakdown for fixing automatic export frontmatter missing data issue, implementing AI enrichment data re-retrieval and export synchronization with comprehensive testing phases"
tags: ["mcp","implementation","export","spec","bug-fix","tasks"]
related: [178,180,182]
keywords: {"export":1,"frontmatter":0.9,"ai":0.8,"enrichment":0.8,"synchronization":0.8}
concepts: {"software testing":0.9,"api development":0.8,"data synchronization":0.8,"automated export":0.7,"artificial intelligence":0.7}
embedding: "lICAgICAjYWUgKCAkJKAgJGAgICHgIKAkICjgJOLgICIgICAjoCAgZSAn4CZk4CAgICAgI+AiICNgJWAm5OAgIGAgICJgJODg4CIgJqKgICKgICAgoCLioCAg4CbgYCAg4CAgICAlY+FgIyAl4CAgI2AgICFgJaMj4CagJKIgIA="
createdAt: 2025-09-29T06:02:09.000Z
updatedAt: 2025-09-29T06:15:21.000Z
---

# Tasks: 自動エクスポート時のフロントマター欠落問題の修正

## メタデータ
- **Version**: 0.9.1
- **Created**: 2025-09-29
- **Status**: Ready
- **Phase**: Tasks
- **Design Spec**: #180
- **Issue**: #178
- **Total Tasks**: 12
- **Estimated Hours**: 12-16

## 概要

### 実装戦略
シンプルで確実な修正を段階的に実装します：
1. テストケースで問題を再現
2. データ再取得ロジックの実装
3. エクスポート同期化
4. オプションでタイムアウト処理の削除

### テストアプローチ
- 単体テスト: モックを使用したタイミング問題の検証
- 統合テスト: 実際のファイル出力の検証
- E2Eテスト: API全体フローの確認

### デプロイ戦略
- Phase 1のみでも効果があるため、段階的リリース可能
- 各フェーズ独立してロールバック可能

## タスク分解

### Phase 1: 問題の再現と検証 [3-4h]

#### Task 1.1: 問題再現テストケースの作成 [2h]
- **作業内容**: 
  - フロントマター欠落を再現するテストケース作成
  - `test/integration/export-timing.test.ts`を新規作成
- **依存**: なし
- **完了条件**: 
  - AIエンリッチメント前のデータでエクスポートされることを確認
  - テストが失敗すること（問題の存在を証明）
- **テスト**: 
  - モックでタイミングを制御
  - フロントマターのフィールド検証

#### Task 1.2: 現状の処理フロー確認 [1h]
- **作業内容**: 
  - `src/mcp/server.ts`の`create_item`ケースを詳細確認
  - エクスポート呼び出しタイミングの確認
  - デバッグログ追加で実行順序を可視化
- **依存**: Task 1.1
- **完了条件**: 
  - 処理順序が明確にドキュメント化される
  - 問題箇所が特定される

### Phase 2: create_item APIの修正 [3-4h]

#### Task 2.1: create_item用の単体テスト作成 [1h]
- **作業内容**: 
  - `test/mcp/create-item.test.ts`にテストケース追加
  - データ再取得が行われることを検証
- **依存**: Task 1.2
- **完了条件**: 
  - テストが失敗する（TDD red phase）
  - 期待する動作が明確

#### Task 2.2: create_itemでのデータ再取得実装 [2h]
- **作業内容**: 
  ```typescript
  // src/mcp/server.ts のcreate_itemケース内
  // AIエンリッチメント後に追加：
  const freshItem = await itemRepo.findById(item.id);
  if (!freshItem) {
    throw new McpError(ErrorCode.InternalError, 'Failed to retrieve created item');
  }
  ```
- **依存**: Task 2.1
- **完了条件**: 
  - 再取得したデータがエクスポートに渡される
  - テストがパスする（TDD green phase）

#### Task 2.3: エクスポート呼び出しの同期化 [1h]
- **作業内容**: 
  ```typescript
  // Before: exportManager.autoExportItem(item).catch(...)
  // After:
  try {
    await exportManager.autoExportItem(freshItem);
  } catch (error) {
    console.error('Auto-export failed:', error);
  }
  ```
- **依存**: Task 2.2
- **完了条件**: 
  - エクスポートがawaitで実行される
  - エラーが適切にハンドリングされる

### Phase 3: update_item APIの修正 [2-3h]

#### Task 3.1: update_item用の単体テスト作成 [1h]
- **作業内容**: 
  - `test/mcp/update-item.test.ts`にテストケース追加
  - 更新後のデータ再取得を検証
- **依存**: Task 2.3
- **完了条件**: 
  - テストが失敗する（TDD red phase）

#### Task 3.2: update_itemでのデータ再取得実装 [1.5h]
- **作業内容**: 
  - create_itemと同様の修正を`update_item`ケースに適用
  - 更新後にfindByIdで再取得
  - 再取得データでエクスポート実行
- **依存**: Task 3.1
- **完了条件**: 
  - テストがパスする（TDD green phase）
  - create_itemと同じパターンで実装

### Phase 4: 統合テストと検証 [2h]

#### Task 4.1: E2Eテストの実装 [1h]
- **作業内容**: 
  - 実際のエクスポートファイルを検証するテスト
  - フロントマターの全フィールド確認
- **依存**: Task 3.2
- **完了条件**: 
  - aiSummary, keywords, conceptsが出力される
  - ファイルが正しく作成される

#### Task 4.2: 手動検証とログ確認 [1h]
- **作業内容**: 
  - 実環境でのテスト実行
  - ログで処理順序の確認
  - エクスポートファイルの目視確認
- **依存**: Task 4.1
- **完了条件**: 
  - 問題が解決されていることを確認
  - パフォーマンスへの影響がないことを確認

### Phase 5: タイムアウト処理の削除（オプション）[2h]

#### Task 5.1: タイムアウト削除の影響調査 [0.5h]
- **作業内容**: 
  - ExportManagerのタイムアウト関連コードの確認
  - 削除による影響範囲の特定
- **依存**: Task 4.2
- **完了条件**: 
  - 削除可能であることの確認
  - 影響箇所のリストアップ

#### Task 5.2: タイムアウト処理の削除 [1h]
- **作業内容**: 
  - `exportWithTimeout`メソッドの削除
  - `Promise.race`の削除
  - 環境変数処理の簡略化
- **依存**: Task 5.1
- **完了条件**: 
  - コードがシンプルになる
  - 既存テストがすべてパス

#### Task 5.3: ドキュメント更新 [0.5h]
- **作業内容**: 
  - README.mdから`SHIROKUMA_EXPORT_TIMEOUT`の記述削除
  - 環境変数一覧の更新
- **依存**: Task 5.2
- **完了条件**: 
  - ドキュメントが最新状態に

## サマリー

### メトリクス
- **総タスク数**: 12
- **推定時間**: 12-16時間
- **必須フェーズ**: Phase 1-4（10-13時間）
- **オプション**: Phase 5（2時間）

### マイルストーン
1. **問題の再現確認**: Task 1.2完了時
2. **create_item修正完了**: Task 2.3完了時
3. **全API修正完了**: Task 3.2完了時
4. **リリース可能**: Task 4.2完了時

### リスク評価
- **低リスク**: 変更は局所的で影響範囲が明確
- **テスト可能**: 各ステップで検証可能
- **ロールバック容易**: フェーズごとに独立

### 依存関係
```
Task 1.1 → Task 1.2
         ↓
      Task 2.1 → Task 2.2 → Task 2.3
                                ↓
                           Task 3.1 → Task 3.2
                                          ↓
                                    Task 4.1 → Task 4.2
                                                   ↓
                                            Task 5.1 → Task 5.2 → Task 5.3
```

## 実行メモ

### 前提条件
- TypeScript/Node.js開発環境
- テストフレームワーク（Jest/Vitest）
- ローカルDBとファイルシステムアクセス

### テスト要件
- 単体テスト: すべての変更箇所
- 統合テスト: API全体フロー
- 手動検証: 実際のエクスポート確認

### ドキュメント要件
- コード内コメント: 変更理由を記載
- README更新: 環境変数変更時
- Issue更新: 完了時に#178を更新

## タスクチェックリスト

コピー＆ペースト用：

```
- [ ] Task 1.1: 問題再現テストケースの作成 [2h]
- [ ] Task 1.2: 現状の処理フロー確認 [1h]
- [ ] Task 2.1: create_item用の単体テスト作成 [1h]
- [ ] Task 2.2: create_itemでのデータ再取得実装 [2h]
- [ ] Task 2.3: エクスポート呼び出しの同期化 [1h]
- [ ] Task 3.1: update_item用の単体テスト作成 [1h]
- [ ] Task 3.2: update_itemでのデータ再取得実装 [1.5h]
- [ ] Task 4.1: E2Eテストの実装 [1h]
- [ ] Task 4.2: 手動検証とログ確認 [1h]
- [ ] Task 5.1: タイムアウト削除の影響調査 [0.5h]
- [ ] Task 5.2: タイムアウト処理の削除 [1h]
- [ ] Task 5.3: ドキュメント更新 [0.5h]
```