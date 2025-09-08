---
id: 147
type: knowledge
title: "MCP APIテスター活用によるテスト戦略"
status: Open
priority: HIGH
description: "既存のmcp-api-testerエージェントを活用した統合テスト戦略"
aiSummary: "MCP APIテスター再構築案 既存のmcp-api-testerエージェントを活用した統合テスト戦略 MCP APIテスター再構築案 既存のmcp-api-testerエージェントを活用した統合テスト戦略 # MCP APIテスター再構築案\n\n## 背景\n- STDIO接続のMCPサーバーの自動テストが困難\n- 既存の`mcp-api-tester`エージェントが存在するが未活用\n- テストディ..."
tags: ["mcp","testing","v0.9.0","agent","integration-test"]
related: [146]
keywords: {"mcp":1,"api":0.95,"item":0.68,"tester":0.61,"claude":0.34}
embedding: "gI+RlYCAgIWAiJ2AgICAj4CVl46AgICBgISogICAgJGAkJOWgICAgICAmYCAgICNgIaJlYCAgIOAgJKAgICAhoCOgIqAgICHgISZgICAgIOAhIKBgICAiYCIp4CAgICGgICHgYCAgIaAibCAgICAg4CFjYqAgICCgIWsgICAgIg="
createdAt: 2025-08-23T06:26:40.000Z
updatedAt: 2025-08-23T06:28:19.000Z
---

# MCP APIテスター活用によるテスト戦略

## 現状確認
- 既存の`mcp-api-tester`エージェントが存在
- テストケースが`.shirokuma/mcp-api-tester-tests/`に既に作成済み
- Phase 1: 15個のテストファイル（初期状態、CRUD、エッジケースなど）
- Phase 2: 2個のテストファイル（リビルド関連）

## 既存テストケース

### Phase 1: 基本機能テスト
1. `1.01-initial-state.md` - 初期状態確認
2. `1.02-data-creation.md` - データ作成
3. `1.03-data-operations.md` - データ操作
4. `1.04-tag-tests.md` - タグ機能
5. `1.05-status-tests.md` - ステータス管理
6. `1.06-session-tests.md` - セッション管理
7. `1.07-summary-tests.md` - サマリー機能
8. `1.08-verification.md` - 検証
9. `1.09-deletion-tests.md` - 削除機能
10. `1.10-edge-cases.md` - エッジケース
11. `1.11-type-management.md` - タイプ管理
12. `1.12-current-state.md` - 現在状態
13. `1.13-type-change.md` - タイプ変更
14. `1.14-field-validation.md` - フィールド検証
15. `1.15-file-indexing.md` - ファイルインデックス

### Phase 2: リビルドテスト
1. `2.01-rebuild-tests.md` - リビルドテスト
2. `2.02-post-rebuild-verification.md` - リビルド後検証

## 活用方法

### 1. エージェントの更新
```markdown
# 更新済み
- テストパス: .shirokuma/mcp-api-tester-tests/*.md
- ツール: shirokuma-kb-dev用のMCP API
```

### 2. テスト実行手順

#### 開発環境でのテスト
```bash
# 1. 開発用MCPサーバー起動
npm run serve

# 2. エージェント経由でテスト実行
claude "@agent-mcp-api-tester Please run Phase 1 tests from .shirokuma/mcp-api-tester-tests/"

# 3. 特定のテストのみ実行
claude "@agent-mcp-api-tester Please run test 1.01-initial-state.md"
```

#### コマンドテスト（新規追加提案）
```bash
# コマンド動作確認用テストケース作成
.shirokuma/mcp-api-tester-tests/3.01-command-tests.md
- /kuma:start の動作確認
- /kuma:issue の動作確認
- /kuma:spec:* の動作確認
```

### 3. v0.9.0リリースのためのテスト計画

#### Phase A: 既存テスト実行
1. mcp-api-testerで全Phase 1テスト実行
2. 結果レポート確認
3. 失敗項目の修正

#### Phase B: コマンドテスト（手動）
1. `/kuma:start` - セッション開始
2. `/kuma:issue` - イシュー管理
3. `/kuma:spec:req` - 要件定義
4. `/kuma:spec:design` - 設計
5. `/kuma:spec:tasks` - タスク生成

#### Phase C: リリース前最終確認
1. git status クリーン確認
2. TypeScriptコード除去確認
3. ドキュメント言語統一確認

## メリット

1. **既存資産の完全活用**: 作成済みの17個のテストケース
2. **エージェント駆動**: Task toolで実行可能
3. **詳細なテスト**: CRUD、エッジケース、検証まで網羅
4. **開発環境分離**: shirokuma-kb-devで安全にテスト

## 実装タスク

1. ✅ エージェントのテストパス更新（完了）
2. ⬜ コマンドテストケース作成（3.01-command-tests.md）
3. ⬜ エージェント経由でPhase 1テスト実行
4. ⬜ 結果レポート生成と問題修正
5. ⬜ 手動コマンドテスト実施

## 結論

既に充実したテストケースが存在するため、これを活用することで効率的なテストが可能。
エージェント駆動の半自動テストでv0.9.0の品質を担保できる。