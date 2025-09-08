---
id: 148
type: spec_design
title: "MCP APIテストケース更新計画"
status: In Progress
priority: MEDIUM
description: "古いAPI名を現在の仕様に合わせて全テストケースを更新する詳細計画"
aiSummary: "MCP APIテストケース更新計画 古いAPI名を現在の仕様に合わせて全テストケースを更新する詳細計画 MCP APIテストケース更新計画 古いAPI名を現在の仕様に合わせて全テストケースを更新する詳細計画 # MCP APIテストケース更新計画\n\n## 現状分析\n\n### テストファイル一覧（17ファイル）\n**Phase 1 テスト（15ファイル）**\n1. 1.01-initial-stat..."
tags: ["testing","update","v0.9.0","mcp-api"]
related: [141,142,146,149,150]
keywords: {"api":1,"mcp__shirokuma":1,"tests":0.57,"type":0.47,"phase":0.43}
embedding: "gIqAgICAgICAgKOQgICAgICHgICAgYCAgICujICAgICAiICAgISAgICArJKAgICAgIOAgICFgICAgJqegICAgICHgICAhICAgICWj4CAgICAj4CAgIKAgICAmpyAgICAgJSAgICEgICAgKGmgICAgICSgICAgYCAgICmmYCAgIA="
createdAt: 2025-08-23T06:31:31.000Z
updatedAt: 2025-08-23T06:31:41.000Z
---

# MCP APIテストケース更新計画

## 現状分析

### テストファイル一覧（17ファイル）
**Phase 1 テスト（15ファイル）**
1. 1.01-initial-state.md - 初期状態確認
2. 1.02-data-creation.md - データ作成
3. 1.03-data-operations.md - データ操作
4. 1.04-tag-tests.md - タグ機能
5. 1.05-status-tests.md - ステータス管理
6. 1.06-session-tests.md - セッション管理
7. 1.07-summary-tests.md - サマリー機能
8. 1.08-verification.md - 総合検証
9. 1.09-deletion-tests.md - 削除操作
10. 1.10-edge-cases.md - エッジケース
11. 1.11-type-management.md - タイプ管理
12. 1.12-current-state.md - 現在状態
13. 1.13-type-change.md - タイプ変更
14. 1.14-field-validation.md - フィールド検証
15. 1.15-file-indexing.md - ファイルインデックス

**Phase 2 テスト（2ファイル）**
1. 2.01-rebuild-tests.md - リビルドテスト
2. 2.02-post-rebuild-verification.md - リビルド後検証

**その他（2ファイル）**
- test_results-01.md - テスト結果記録
- test_results-status-search.md - ステータス検索結果

### 主な変更点

#### API名の変更マッピング
**旧API名 → 新API名**
```
get_items → mcp__shirokuma-kb-dev__list_items
get_item_detail → mcp__shirokuma-kb-dev__get_item
create_item → mcp__shirokuma-kb-dev__create_item
update_item → mcp__shirokuma-kb-dev__update_item
delete_item → mcp__shirokuma-kb-dev__delete_item
search_items → mcp__shirokuma-kb-dev__search_items
search_items_by_tag → mcp__shirokuma-kb-dev__search_items_by_tag
get_statuses → mcp__shirokuma-kb-dev__get_statuses
get_tags → mcp__shirokuma-kb-dev__get_tags
create_tag → mcp__shirokuma-kb-dev__create_tag
delete_tag → mcp__shirokuma-kb-dev__delete_tag
search_tags → mcp__shirokuma-kb-dev__search_tags
get_types → mcp__shirokuma-kb-dev__get_types
create_type → mcp__shirokuma-kb-dev__create_type
update_type → mcp__shirokuma-kb-dev__update_type
delete_type → mcp__shirokuma-kb-dev__delete_type
search_suggest → mcp__shirokuma-kb-dev__search_suggest
get_current_state → mcp__shirokuma-kb-dev__get_current_state
update_current_state → mcp__shirokuma-kb-dev__update_current_state
change_item_type → mcp__shirokuma-kb-dev__change_item_type
index_codebase → mcp__shirokuma-kb-dev__index_codebase
search_code → mcp__shirokuma-kb-dev__search_code
get_related_files → mcp__shirokuma-kb-dev__get_related_files
get_index_status → mcp__shirokuma-kb-dev__get_index_status
get_stats → mcp__shirokuma-kb-dev__get_stats

# 削除されたAPI
get_sessions
get_latest_session
get_summaries
search_sessions_by_tag
```

#### パラメータの変更
- `type: "issues"` → `type: "issue"` (単数形)
- `type: "plans"` → `type: "plan"` または削除
- `type: "docs"` → `type: "document"`
- レスポンス形式: `{ data: [...] }` → 直接配列または値

## 更新作業計画

### Phase 1: API名の一括置換（優先度：高）
1. **1.01-initial-state.md** ✅ 完了済み（1.01-initial-state-updated.md作成）
2. **1.02-data-creation.md** - データ作成テスト
3. **1.03-data-operations.md** - データ操作テスト
4. **1.04-tag-tests.md** - タグ機能テスト
5. **1.05-status-tests.md** - ステータス管理テスト

### Phase 2: セッション系API更新（優先度：中）
6. **1.06-session-tests.md** - セッション関連API削除/代替
7. **1.07-summary-tests.md** - サマリー関連API削除/代替
8. **1.08-verification.md** - 総合検証

### Phase 3: 高度な機能テスト（優先度：中）
9. **1.09-deletion-tests.md** - 削除操作
10. **1.10-edge-cases.md** - エッジケース
11. **1.11-type-management.md** - タイプ管理
12. **1.12-current-state.md** - 現在状態
13. **1.13-type-change.md** - タイプ変更

### Phase 4: 検証系テスト（優先度：低）
14. **1.14-field-validation.md** - フィールド検証
15. **1.15-file-indexing.md** - ファイルインデックス
16. **2.01-rebuild-tests.md** - リビルドテスト
17. **2.02-post-rebuild-verification.md** - リビルド後検証

## 作業手順

### 各ファイルの更新手順
1. **ファイル読み込み** - 現在の内容確認
2. **API名置換** - マッピング表に基づき更新
3. **パラメータ修正** - 新仕様に合わせて調整
4. **期待値更新** - レスポンス形式の変更反映
5. **検証** - 更新内容の整合性確認

### 特殊対応が必要なケース
- **セッション系API**: 代替機能の検討または削除
- **サマリー系API**: 代替機能の検討または削除  
- **タイプ変更API**: change_item_type の新規追加
- **ファイルインデックス**: 新APIの活用

## 成功基準
- [ ] 全17ファイルが現在のAPI仕様に準拠
- [ ] mcp-api-testerエージェントで実行可能
- [ ] 期待値が現実的で検証可能
- [ ] 削除されたAPIの代替案明記

## リスクと対策
- **リスク1**: 削除されたAPIのテストケース
  - 対策: 代替機能で置き換えるか、テスト自体を削除
- **リスク2**: レスポンス形式の大幅変更
  - 対策: 実際のAPIレスポンスを確認して調整
- **リスク3**: 新規追加されたAPIの未カバー
  - 対策: 追加テストケースの作成を検討

## タイムライン
1. **即時対応** (30分): Phase 1のファイル5個
2. **短期対応** (1時間): Phase 2-3のファイル8個
3. **中期対応** (30分): Phase 4のファイル4個

## 次のステップ
1. 1.02-data-creation.mdから順次更新開始
2. 各ファイル更新後、差分確認
3. 全ファイル更新完了後、mcp-api-testerで実行テスト