---
id: 161
type: spec_requirements
title: "Requirements: search_items API改善とステータス管理の修正"
status: Specification
priority: CRITICAL
description: "search_items APIの検索機能改善とステータスのis_closableフラグ活用に関する要件定義"
aiSummary: "Requirements: search_items API改善とステータス管理の修正 search_items APIの検索機能改善とステータスのis_closableフラグ活用に関する要件定義 Requirements: search_items API改善とステータス管理の修正 search_items APIの検索機能改善とステータスのis_closableフラグ活用に関する要件定義 # ..."
tags: ["requirements","api","search","bug-fix","spec","issue-160"]
related: [160,162]
keywords: {"search_items":0.66,"then":0.61,"is_closable":0.57,"when":0.57,"api":0.48}
embedding: "goCAgICAgImAjqyAj5WAgIeAgICAgICNgIivgJWPgYCJgICAgICAi4CKpICRloiAh4CAgICAgIWAkpuAh5SOgIOAgICAgICAgJiTgICJjYCAgICAgICAg4CcjoCEgIeAgYCAgICAgICAmZeAgIKBgICAgICAgICCgJalgIWMgIA="
createdAt: 2025-08-24T01:40:41.000Z
updatedAt: 2025-08-24T01:40:51.000Z
---

# Requirements: search_items API改善とステータス管理の修正

## Metadata
- **Version**: 1.0
- **Created**: 2025-08-24
- **Status**: Draft
- **Phase**: Requirements
- **Related Issue**: #160

## 1. Introduction

### Summary
search_items APIが構造化クエリ（status:Open等）を正しく処理できず、またステータスのis_closableフラグが活用されていない問題を解決する。

### Business Value
- AIエージェントとコマンドが正確にイシューを把握できるようになる
- 開発者の作業効率が向上する
- システムの信頼性が向上する

### Scope
- search_items APIの検索ロジック改善
- ステータス管理の改善（is_closableフラグの活用）
- ドキュメント更新（回避策含む）

## 2. User Stories

### Story 1: AIエージェントのイシュー検索
**As an** AIエージェント
**I want to** search_itemsでOpenなイシューを検索できる
**So that** 現在の作業状況を正確に把握し、適切な作業計画を立てられる

**Acceptance Criteria:**
- `WHEN` search_itemsで"status:Open"を検索する `THEN` システムはOpen状態の全アイテムを返す
- `WHEN` 複数の条件を組み合わせて検索する `THEN` システムは正しくAND/OR条件を処理する

### Story 2: 開発者のCLI検索
**As a** 開発者
**I want to** CLIコマンドで様々な条件でアイテムを検索できる
**So that** 効率的にイシュー管理ができる

**Acceptance Criteria:**
- `WHEN` "type:issue status:Open"を検索する `THEN` システムはOpenなイシューのみを返す
- `WHEN` キーワードとフィルタを組み合わせる `THEN` システムは両方の条件を満たす結果を返す

### Story 3: ステータス管理の改善
**As a** システム管理者
**I want to** is_closableフラグを使って終了状態を管理できる
**So that** ステータスの意味が明確になり、一貫性のある管理ができる

**Acceptance Criteria:**
- `WHEN` 新しいステータスを作成する `THEN` システムはis_closableフラグを適切に設定する
- `WHEN` "closable"でフィルタする `THEN` システムは終了可能なステータスのアイテムのみを返す

## 3. Functional Requirements (EARS Format)

### FR1: 構造化クエリのサポート
`WHEN` ユーザーが"status:Open type:issue"のような構造化クエリを入力する
`THEN` システムはクエリをパースして適切なフィルタを適用する
`AND` 結果は指定された条件を全て満たすアイテムのみを含む

**Rationale**: 現在の単純なLIKE検索では構造化された検索条件を処理できない

### FR2: ステータスフィルタリング
`IF` クエリに"status:"フィルタが含まれる
`THEN` システムはステータス名をstatusIdに変換する
`AND` 該当するstatusIdを持つアイテムのみを返す

**Rationale**: ステータス名とIDのマッピングが必要

### FR3: is_closableフラグの活用
`WHEN` ユーザーが"is:open"または"is:closed"でフィルタする
`THEN` システムはis_closableフラグを使ってフィルタリングする
`AND` Openは is_closable=false、Closedは is_closable=true のアイテムを返す

**Rationale**: ステータスの意味を明確にし、管理を簡素化する

### FR4: 後方互換性の維持
`WHEN` 従来の単純なキーワード検索を実行する
`THEN` システムは引き続き title/description/content でのLIKE検索を実行する
`AND` 既存の動作を変更しない

**Rationale**: 既存の利用者への影響を最小限にする

### FR5: list_itemsとの整合性
`WHEN` 同じ条件でsearch_itemsとlist_itemsを実行する
`THEN` 両方のAPIは同じアイテムセットを返す
`UNLESS` search_itemsは全文検索、list_itemsは単純フィルタという違いがある

**Rationale**: APIの一貫性を保つ

## 4. Non-Functional Requirements

### NFR1: Performance
- 検索は2秒以内に結果を返す
- 1000件のアイテムでも性能劣化しない

### NFR2: Compatibility
- 既存のAPIインターフェースを変更しない
- 既存のクライアントコードが引き続き動作する

### NFR3: Reliability
- 検索結果の正確性を100%保証する
- エラー時は適切なメッセージを返す

### NFR4: Maintainability
- 検索ロジックは拡張可能な設計とする
- テストカバレッジ80%以上を維持する

## 5. Edge Cases & Error Scenarios

### Edge Case 1: 無効なステータス名
`WHEN` ユーザーが存在しないステータス名を指定する
`THEN` システムは空の結果を返す
`AND` エラーメッセージは返さない（柔軟な検索を許可）

### Edge Case 2: 複雑なクエリ
`WHEN` ユーザーが"(status:Open OR status:Ready) AND type:issue"のような複雑なクエリを入力する
`THEN` システムは可能な範囲で解析する
`OR` サポートされない構文の場合は単純検索にフォールバックする

### Error Scenario 1: データベース接続エラー
`WHEN` データベース接続が失敗する
`THEN` システムは適切なエラーメッセージを返す
`AND` 可能であればキャッシュから結果を返す

## 6. Integration Points

### MCP Commands
- `/kuma:issue` コマンドがsearch_itemsを使用
- 修正後も正常に動作することを確認

### CLI Interface
- `shirokuma-kb search` コマンドの動作確認
- 新しい検索構文のドキュメント化

### Database
- statusesテーブルのis_closableフラグ更新
- マイグレーションスクリプトの作成

## 7. Success Metrics

- search_itemsで"status:Open"が正しく動作する
- is_closableフラグが適切に設定される
- 既存の検索機能が引き続き動作する
- パフォーマンスが2秒以内を維持する

## 8. Out of Scope

- 全文検索エンジンの導入（将来の改善として検討）
- 複雑なブール演算のサポート（第2フェーズで検討）
- UIの変更（CLIとAPIのみ対応）

## 9. Alternative Solutions

### Option 1: 最小限の修正（推奨）
- search_itemsの検索ロジックを改善
- is_closableフラグを正しく設定
- ドキュメントに回避策を明記

### Option 2: 全面的な検索エンジン導入
- ElasticsearchやMeilisearchの導入
- より高度な検索機能の実装
- （大規模変更のため、v1.0.0以降で検討）

### Option 3: 回避策のみ
- search_itemsは修正せず、list_itemsの使用を推奨
- ドキュメントで明確に説明
- （根本解決にならないため非推奨）

## 10. Dependencies

- TypeORM のクエリビルダー機能
- SQLiteの検索機能
- 既存のステータス管理システム

## 11. Risks

- **Risk 1**: 既存の検索が壊れる可能性
  - **Mitigation**: 十分なテストと段階的なリリース
  
- **Risk 2**: パフォーマンスの劣化
  - **Mitigation**: インデックスの最適化とキャッシュの活用

## 12. Next Steps

1. この要件のレビューと承認
2. 設計フェーズ（`/kuma:spec:design`）での技術設計
3. タスク分解と実装計画
4. テスト計画の作成