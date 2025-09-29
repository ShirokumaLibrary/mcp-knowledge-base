---
id: 165
type: issue
title: "list_items APIでOpenステータスのissue-158が取得できない問題"
status: Completed
priority: CRITICAL
description: "list_items APIでstatus:Openを指定してもissue-158が取得できない。get_itemでは正常に取得でき、ステータスもOpenと表示されるが、一覧取得では表示されない。設計仕様書作成済み。"
aiSummary: "Database API bug where list_items cannot retrieve issue-158 with Open status filter, though get_item works correctly. Problem affects issue management functionality."
tags: ["api","v0.9.0","status","critical","bug","list_items"]
related: [158,160,164,166,167]
keywords: {"api":1,"status":1,"open":0.9,"issue":0.9,"item":0.8}
concepts: {"api":0.9,"bug":0.9,"database":0.8,"status management":0.8,"filtering":0.8}
embedding: "iICAkIWAgoCAh6aAgICNgJCAgIqHgIqAgJGggICAiICRgICRlICPgICUk4CAgJuAioCAkJyAjYCAjoiAgICngJCAgIibgIaAgISAgICAooCIgICBloCMgICLhoCAgJCAgYCAgYqAhICAgpqAgICCgIGAgIiCgICAgICpgICAhIA="
createdAt: 2025-08-29T07:33:22.000Z
updatedAt: 2025-08-29T07:33:22.000Z
---

# list_items APIでOpenステータスのissue-158が取得できない問題

## 現象
- `mcp__shirokuma-kb__list_items` で `type: "issue", status: "Open"` を指定すると空配列が返る
- `mcp__shirokuma-kb__get_item(158)` では正常に取得でき、statusId: 1 (Open) と表示される
- 他のステータスのイシューは正常に取得できる

## 再現手順
1. `list_items(type: "issue", status: "Open")` を実行 → 結果: []
2. `get_item(158)` を実行 → 結果: statusId: 1 (Open) で正常取得
3. `list_items(type: "issue")` を実行 → issue-158は含まれているがstatusId: 1

## 影響
- `/kuma:issue` コマンドでOpenイシューが正しく表示されない
- Openステータスのイシューの見落とし
- 作業計画の立案に支障

## 根本原因
`ItemRepository.findAll()`メソッドが`item.status`（リレーションオブジェクト）を文字列値と直接比較しようとしていたため、SQLエラーが発生して空の結果が返されていました。

## 実装した修正
設計仕様書（#166）に基づき、直接JOINアプローチで修正：

```typescript
// ステータスフィルタが必要な場合にJOINを追加
if (options?.status) {
  query.leftJoinAndSelect('item.status', 'status')
       .andWhere('LOWER(status.name) = LOWER(:statusName)', { 
         statusName: options.status 
       });
}
```

## 検証結果
✅ **修正完了** - 2025-08-28
- Issue #158を含む21件のOpenステータスのissueが正しく取得できることを確認
- 大文字小文字を区別しない検索が動作
- searchAdvanced APIとの一貫性を維持
- 後方互換性を保持

## テスト
- ユニットテストを作成（`tests/unit/repositories/ItemRepository.test.ts`）
- Issue #158の特定ケースのリグレッションテストを含む
- ステータスフィルタリングの包括的なテストカバレッジ

## 関連
- Issue #160: search_itemsでOpen状態のイシューが取得できない問題（解決済み）
- Spec #166: 設計仕様書