---
id: 169
type: spec_requirements
title: "Requirements: SHIROKUMA_EXPORT_DIR環境変数設定時の自動エクスポート機能"
status: Specification
priority: HIGH
description: "Requirements phase of spec-driven development for automatic file export functionality when SHIROKUMA_EXPORT_DIR environment variable is set"
aiSummary: "Requirements specification for automatic file export functionality when SHIROKUMA_EXPORT_DIR environment variable is set, enabling real-time synchronization between database and filesystem for MCP server operations."
tags: ["mcp","ears","export","spec","requirements","environment-variable"]
related: [168,170,171,172]
keywords: {"export":1,"environment":0.9,"database":0.9,"automatic":0.9,"api":0.8}
concepts: {"file management":0.9,"data synchronization":0.9,"configuration management":0.8,"automation":0.8,"api integration":0.8}
embedding: "kYKAgIeAgICAgICnhoqAgI+JgICAgICAgICDnJiIgICHjoCAgYCAgICAgJimjYCAgI6AgIiAgICAgIOKo5GAgIGHgICQgICAgICLhJ6egICJjICAkICAgICAj4ySnoCAg4WAgIqAgICAgIybh5iAgIuAgICCgICAgICFoICSgIA="
createdAt: 2025-08-29T06:23:58.000Z
updatedAt: 2025-08-29T06:24:09.000Z
---

---
version: "1.0"
date: "2025-08-29"
status: "Specification"
phase: "Requirements"
---

# Requirements: SHIROKUMA_EXPORT_DIR環境変数設定時の自動エクスポート機能

## 1. Introduction

### 1.1 Summary
MCPサーバー実行時に`SHIROKUMA_EXPORT_DIR`環境変数が設定されている場合、データベースの変更を自動的にファイルシステムにエクスポートする機能の要件定義です。

### 1.2 Business Value
- **リアルタイム同期**: データベースとファイルシステムの自動同期により、常に最新の状態を保持
- **バージョン管理**: Gitでの変更追跡が容易になり、履歴管理が改善
- **災害復旧**: 自動的なファイルベースのバックアップによりデータ保護を強化
- **開発効率**: エディタで直接内容確認が可能になり、開発者の生産性向上
- **AIセッション継続性**: カレントステートの永続化により、セッション間での文脈保持が可能

### 1.3 Scope
**対象APIとトリガー**:
- create_item API実行時の自動エクスポート
- update_item API実行時の自動エクスポート
- update_current_state API実行時の自動エクスポート

**対象データ**:
- 全てのアイテムタイプ（issue, task, knowledge, session等）
- カレントステート（システム状態）

## 2. User Stories

### 2.1 システム管理者として

**Story 1: データベースとファイルシステムの同期**
- **As a** システム管理者
- **I want** データベースの変更が自動的にファイルシステムに反映される
- **So that** データの一貫性を保ちながら、複数の方法でデータにアクセスできる

**Acceptance Criteria:**
- WHEN アイテムが作成される THEN 対応するファイルが自動的に作成される
- WHEN アイテムが更新される THEN 対応するファイルが自動的に更新される
- WHEN エクスポートに失敗する THEN エラーがログに記録されるがAPI応答は成功する

### 2.2 開発者として

**Story 2: エディタでの直接確認**
- **As a** 開発者
- **I want** エクスポートされたファイルをエディタで直接確認できる
- **So that** データベースツールを使わずに内容を把握できる

**Acceptance Criteria:**
- WHEN ファイルがエクスポートされる THEN Markdown形式で人間が読める形式になっている
- WHEN ファイルを開く THEN フロントマターにメタデータが含まれている

**Story 3: AIセッション間での文脈保持**
- **As a** AI開発者
- **I want** カレントステートが自動的にファイルに保存される
- **So that** AIセッション間で文脈を引き継げる

**Acceptance Criteria:**
- WHEN カレントステートが更新される THEN 専用ディレクトリにファイルが保存される
- WHEN 新しいセッションが開始される THEN 前回のカレントステートを読み込める

## 3. Functional Requirements (EARS Format)

### 3.1 環境変数による機能の有効化

**REQ-001: 環境変数チェック**
- **WHEN** MCPサーバーが起動する
- **THEN** システムは`SHIROKUMA_EXPORT_DIR`環境変数の存在を確認する
- **Rationale**: 環境変数の存在が機能の有効/無効を決定する

**REQ-002: ディレクトリ検証**
- **IF** `SHIROKUMA_EXPORT_DIR`環境変数が定義されている
- **THEN** システムは指定されたディレクトリの存在と書き込み権限を検証する
- **Rationale**: 事前検証により実行時エラーを防止

### 3.2 アイテム作成時の自動エクスポート

**REQ-003: create_item時のエクスポート**
- **WHEN** create_item APIが正常に完了する
- **AND** `SHIROKUMA_EXPORT_DIR`環境変数が定義されている
- **THEN** システムは作成されたアイテムを指定ディレクトリにエクスポートする
- **Rationale**: 新規アイテムの即座の永続化

**REQ-004: ファイルパス生成**
- **WHEN** アイテムをエクスポートする
- **THEN** システムは`${SHIROKUMA_EXPORT_DIR}/${type}/${id}-${sanitized_title}.md`形式でファイルパスを生成する
- **Rationale**: 一貫性のあるファイル構造と命名規則

### 3.3 アイテム更新時の自動エクスポート

**REQ-005: update_item時のエクスポート**
- **WHEN** update_item APIが正常に完了する
- **AND** `SHIROKUMA_EXPORT_DIR`環境変数が定義されている
- **THEN** システムは更新されたアイテムを既存ファイルに上書きエクスポートする
- **Rationale**: 最新状態の維持

**REQ-006: ファイル名変更の処理**
- **WHEN** アイテムのタイトルが変更される
- **THEN** システムは新しいファイル名でエクスポートする
- **AND** 古いファイル名のファイルを削除する
- **Rationale**: ファイルシステムの整合性維持

### 3.4 カレントステート更新時の自動エクスポート

**REQ-007: update_current_state時のエクスポート**
- **WHEN** update_current_state APIが正常に完了する
- **AND** `SHIROKUMA_EXPORT_DIR`環境変数が定義されている
- **THEN** システムはカレントステートを`${SHIROKUMA_EXPORT_DIR}/.system/current_state/${id}.md`にエクスポートする
- **Rationale**: システム状態の永続化

**REQ-008: カレントステートディレクトリの作成**
- **IF** `.system/current_state`ディレクトリが存在しない
- **THEN** システムは自動的にディレクトリを作成する
- **Rationale**: 初回実行時の自動セットアップ

### 3.5 エクスポート形式

**REQ-009: Markdownフロントマター**
- **WHEN** アイテムをエクスポートする
- **THEN** システムはMarkdownフロントマター形式でメタデータを含める
- **Rationale**: メタデータと内容の分離、機械可読性の確保

**REQ-010: 文字エンコーディング**
- **WHEN** ファイルを書き込む
- **THEN** システムはUTF-8エンコーディングを使用する
- **Rationale**: 国際化対応と互換性

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

**NFR-001: エクスポート処理時間**
- **Requirement**: 単一アイテムのエクスポートは2秒以内に完了する
- **Metric**: 95パーセンタイルで2秒以内
- **Rationale**: API応答時間への影響を最小限に抑える

**NFR-002: 並行処理**
- **Requirement**: 複数のエクスポート処理を並行して実行可能
- **Metric**: 同時に10件まで処理可能
- **Rationale**: 高負荷時のシステム応答性維持

### 4.2 Reliability Requirements

**NFR-003: エラー分離**
- **Requirement**: エクスポート失敗がAPI応答に影響しない
- **Metric**: エクスポート失敗時もAPI成功率100%
- **Rationale**: コア機能の可用性確保

**NFR-004: ログ記録**
- **Requirement**: 全てのエクスポート処理をログに記録
- **Metric**: 成功/失敗、処理時間、ファイルパスを記録
- **Rationale**: 問題の診断とトラブルシューティング

### 4.3 Scalability Requirements

**NFR-005: 大量データ対応**
- **Requirement**: 10,000アイテムまでエクスポート可能
- **Metric**: ディレクトリあたり10,000ファイルまで
- **Rationale**: 長期運用での拡張性確保

### 4.4 Security Requirements

**NFR-006: パストラバーサル防止**
- **Requirement**: ファイルパスのサニタイズ
- **Metric**: 指定ディレクトリ外への書き込み0件
- **Rationale**: セキュリティ脆弱性の防止

## 5. Edge Cases & Error Scenarios

### 5.1 ディレクトリ関連

**EDGE-001: ディレクトリ作成失敗**
- **Condition**: エクスポートディレクトリの作成に失敗
- **Behavior**: エラーをログに記録し、エクスポートをスキップ
- **Recovery**: API処理は正常に継続

**EDGE-002: 書き込み権限不足**
- **Condition**: ディレクトリへの書き込み権限がない
- **Behavior**: エラーをログに記録し、エクスポートをスキップ
- **Recovery**: 管理者への通知

### 5.2 ファイル操作関連

**EDGE-003: ディスク容量不足**
- **Condition**: ディスク容量が不足している
- **Behavior**: エラーをログに記録し、部分的な書き込みを削除
- **Recovery**: 容量確保後に再試行可能

**EDGE-004: ファイルロック**
- **Condition**: 既存ファイルが他のプロセスでロックされている
- **Behavior**: 3回までリトライ（1秒間隔）
- **Recovery**: リトライ失敗時はエラーログ記録

### 5.3 データ関連

**EDGE-005: 巨大コンテンツ**
- **Condition**: アイテムのコンテンツが10MB以上
- **Behavior**: 分割してエクスポート、またはサマリーのみエクスポート
- **Recovery**: 完全なデータはデータベースから取得

**EDGE-006: 特殊文字を含むタイトル**
- **Condition**: ファイル名に使用できない文字を含む
- **Behavior**: 安全な文字に置換してエクスポート
- **Recovery**: メタデータに元のタイトルを保持

## 6. Integration Points

### 6.1 ExportManager Integration

**Interface**: ExportManager class
- **Methods**: 
  - `exportSingleItem(item: Item): Promise<void>`
  - `exportCurrentState(state: CurrentState): Promise<void>`
- **Data Flow**: Repository → ExportManager → FileSystem
- **Error Handling**: 例外をキャッチしてログ記録

### 6.2 MCP Handler Integration

**Handlers to Modify**:
- `create-item-handler.ts`
- `update-item-handler.ts`
- `update-current-state-handler.ts`

**Integration Pattern**:
```typescript
// After successful API operation
if (process.env.SHIROKUMA_EXPORT_DIR) {
  try {
    await exportManager.exportSingleItem(item);
  } catch (error) {
    logger.error('Export failed:', error);
    // Continue without throwing
  }
}
```

## 7. Success Metrics

### 7.1 Operational Metrics

- **Export Success Rate**: > 99%（測定期間: 日次）
- **Average Export Time**: < 500ms（測定期間: リアルタイム）
- **Storage Usage Growth**: < 100MB/日（測定期間: 週次）

### 7.2 User Experience Metrics

- **File Accessibility**: エクスポートされたファイルの100%がエディタで開ける
- **Data Consistency**: データベースとファイルシステムの不整合0件
- **Recovery Time**: エクスポート失敗からの自動回復時間 < 1分

## 8. Out of Scope

以下の項目は本要件の対象外とする：

- **delete_item時のファイル削除**: 削除ポリシーは別途検討
- **バッチエクスポート**: 既存データの一括エクスポート機能
- **インポート機能**: ファイルからデータベースへの逆同期
- **差分エクスポート**: 変更部分のみのエクスポート
- **圧縮・暗号化**: エクスポートファイルの圧縮や暗号化
- **外部ストレージ**: クラウドストレージへの直接エクスポート
- **WebDAV/FTP対応**: ネットワークプロトコル経由のエクスポート

## 9. Future Considerations

将来的な拡張可能性：

- **他のAPI対応**: delete_item, batch操作等への拡張
- **設定可能なエクスポート形式**: JSON, YAML等の対応
- **フィルタリング機能**: 特定タイプのみエクスポート
- **イベント通知**: エクスポート完了時のWebhook
- **監視ダッシュボード**: エクスポート状況の可視化

## 10. Approval

この要件定義書は、自動エクスポート機能の実装における合意事項を文書化したものです。

---
**Document Status**: Draft
**Next Phase**: Design (/kuma:spec:design)
**Related Issue**: #168