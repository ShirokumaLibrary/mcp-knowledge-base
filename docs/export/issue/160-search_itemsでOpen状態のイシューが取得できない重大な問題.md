---
id: 160
type: issue
title: "search_itemsでOpen状態のイシューが取得できない重大な問題"
status: In Progress
priority: CRITICAL
description: "search_items APIでOpen状態のイシューを検索しても結果が返ってこない。list_itemsやget_itemでは取得できるが、search_itemsの検索機能が正しく動作していない"
aiSummary: "Critical bug in search_items API where Open status issues cannot be retrieved through search functionality, while list_items works correctly. Affects issue management commands and requires urgent fix before v0.9.0 release."
tags: ["api","mcp","critical","bug","search","urgent"]
related: [161,162]
keywords: {"search":1,"issue":1,"open":0.9,"items":0.9,"status":0.8}
concepts: {"search functionality":0.9,"api bug":0.9,"issue management":0.8,"database query":0.8,"system malfunction":0.7}
embedding: "iYCCgICAgICKkKGAgICKgJKAiYCAgICAh5SagICAhoCTgI2AgICAgI+YjoCAgJWAjICLgICAgICbmIaAgICfgJKAhYCAgICAlJWAgICAm4CJgIqAgICAgJ6ehYCAgIyAgYCDgICAgICflJaAgICBgIGAgICAgICAlZCjgICAg4A="
createdAt: 2025-08-24T01:23:47.000Z
updatedAt: 2025-08-24T03:13:58.000Z
---

# search_itemsでOpen状態のイシューが取得できない問題

## 問題の詳細

search_items APIに重大な問題が発生しています：

### 症状
1. `search_items` で `status:Open type:issue` を検索しても結果が0件
2. `list_items` では正常にOpen状態のイシューが取得できる
3. `get_item` で個別IDを指定すれば取得可能
4. 実際には多数のOpenイシューが存在（#158, #157, #149など）

### 再現手順
```typescript
// これは結果が返ってこない
mcp__shirokuma-kb__search_items({
  query: "status:Open type:issue",
  types: ["issue"]
})
// => []

// これは正常に動作
mcp__shirokuma-kb__list_items({
  type: "issue",
  limit: 20
})
// => 多数のイシューが返る（statusIdでフィルタ必要）
```

## 進捗状況（2025-08-24）

### ✅ 完了した対応

1. **根本原因の特定**
   - `ItemRepository.search()`が単純なLIKE検索のみ実装
   - 構造化クエリ（`status:Open`等）のパーサーが未実装
   - `is_closable`フラグがSQLite保存時に全て0になる問題

2. **is_closableフラグの修正**
   - マイグレーション作成: `1756004743896-FixStatusClosableFlags.ts`
   - 現在の環境は手動で修正済み
   - `migrate.ts`のseedDatabase関数も修正（SQLite対応）

3. **回避策のドキュメント化**
   - `.shirokuma/commands/shared/mcp-rules.markdown`に追加
   - list_itemsを使った代替方法を明記

4. **設計書作成**
   - spec-161: 要件定義
   - spec-162: 技術設計（v1.3）
   - SearchQueryParserとStatusRepositoryの設計完了

### 🔧 残りの作業

1. **実装フェーズ**
   - SearchQueryParserクラスの実装
   - StatusRepositoryクラスの実装  
   - ItemRepository.searchAdvanced()メソッドの追加
   - MCPサーバーでの統合

2. **テスト**
   - ユニットテスト作成
   - 統合テスト実施
   - パフォーマンステスト

## 影響範囲

- **重大度**: CRITICAL
- イシュー管理コマンドが正常に動作しない
- `/kuma:issue` コマンドでイシュー一覧が表示されない可能性
- AIがOpenイシューを認識できず、作業計画に影響

## 考えられる原因

1. **検索インデックスの問題** ✅ 確認済み
   - searchIndexフィールドは存在するが、構造化クエリ非対応

2. **ステータスフィルタの問題** ✅ 確認済み
   - クエリパーサーが未実装

3. **is_closableフラグの問題** ✅ 修正済み
   - SQLiteでのboolean値保存の問題

## 対応策

### 短期対応（実施済み）
- list_itemsを使用した回避策の実装と文書化
- is_closableフラグの手動修正

### 根本対応（実装予定）
- search_items APIのデバッグと修正
- SearchQueryParserの実装
- テストケースの追加

## 関連情報
- v0.9.0リリース前に回避策で対応
- v0.9.1で根本修正予定
- spec-161, spec-162で詳細設計済み