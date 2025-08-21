---
id: 51
type: analysis
title: "MCP API使用状況分析結果"
description: "全25個のMCP APIの実際の使用状況を分析。頻繁に使用されるもの、時々使用されるもの、未使用のものに分類。"
status: Completed
priority: MEDIUM
aiSummary: "MCP API使用状況分析結果 全25個のMCP APIの実際の使用状況を分析。頻繁に使用されるもの、時々使用されるもの、未使用のものに分類。 ## MCP API使用状況分析\n\n全25個のAPIを使用頻度で分類：\n\n### 🔥 頻繁に使用（コア機能）\n1. **create_item** - アイテム作成（イシュー、知識、セッション等）\n2. **update_item** - アイテム更新（"
tags: ["api","optimization","analysis","cleanup","usage-stats"]
keywords: {"api":1,"mcp":0.4,"find_shortest_path":0.4,"find_hub_nodes":0.4,"find_clusters":0.4}
related: [24,25,26,54]
created: 2025-08-14T01:19:56.102Z
updated: 2025-08-14T01:19:56.102Z
---

## MCP API使用状況分析

全25個のAPIを使用頻度で分類：

### 🔥 頻繁に使用（コア機能）
1. **create_item** - アイテム作成（イシュー、知識、セッション等）
2. **update_item** - アイテム更新（ステータス変更等）
3. **get_item** - アイテム取得（詳細確認）
4. **search_items** - 検索（重複チェック、関連項目検索）
5. **list_items** - 一覧表示（オープンイシュー確認等）
6. **add_relations** - リレーション追加（関連付け）
7. **get_current_state** - 現在状態取得（セッション開始時）
8. **update_current_state** - 状態更新（ハンドオーバー）

### 📊 時々使用（補助機能）
9. **get_stats** - 統計情報（プロジェクト状況確認）
10. **get_tags** - タグ一覧（タグ管理）
11. **delete_item** - アイテム削除（まれに使用）
12. **get_related_items** - 関連アイテム取得（コンテキスト拡張時）

### ❓ ほぼ未使用（特殊機能）
13. **remove_relations** - リレーション削除
14. **get_type_stats** - タイプ別統計
15. **suggest_tags** - タグサジェスト
16. **find_shortest_path** - 最短パス検索
17. **find_similar_items** - 類似アイテム検索（AI埋め込み使用）
18. **get_graph_stats** - グラフ統計
19. **find_hub_nodes** - ハブノード検索
20. **find_isolated_nodes** - 孤立ノード検索
21. **find_clusters** - クラスター検索
22. **save_checkpoint** - チェックポイント保存
23. **list_checkpoints** - チェックポイント一覧
24. **change_item_type** - タイプ変更（新機能）
25. **index_codebase** - コードベースインデックス（未実装？）

## 分析結果

### 使用パターン
- **8個（32%）**: 日常的に使用されるコアAPI
- **4個（16%）**: 必要時に使用される補助API
- **13個（52%）**: ほぼ使用されない特殊API

### 観察事項

1. **CRUD操作が中心**
   - create, read (get/list/search), update が主要
   - deleteはほとんど使われない

2. **グラフ分析機能は未活用**
   - find_shortest_path, find_hub_nodes, find_clusters等
   - 複雑すぎて使い方が不明？
   - 実用的な用途が不明確？

3. **AIベースの機能も低利用**
   - find_similar_items（埋め込みベース）
   - conceptsベースの検索は使われているが、embedding直接利用は少ない

4. **チェックポイント機能は未使用**
   - save_checkpoint, list_checkpoints
   - バックアップ的な機能だが必要性が低い？

## 推奨事項

### 1. APIの整理
- **維持**: コア8個 + 補助4個 = 12個のAPIは必須
- **検討**: グラフ分析系APIの必要性を再評価
- **削除候補**: チェックポイント機能（使用実績なし）

### 2. ドキュメント改善
- よく使うAPIの使用例を充実
- グラフ分析APIの実用的な使用例を追加
- 未使用APIの用途を明確化

### 3. API簡素化
```typescript
// 現在: 複雑なグラフ分析API群
find_shortest_path, find_hub_nodes, find_clusters

// 提案: 統合されたグラフ分析API
analyze_graph({
  type: 'shortest_path' | 'hubs' | 'clusters',
  params: { ... }
})
```

### 4. 使用統計の追跡
- 各APIの呼び出し回数を記録
- 長期間未使用のAPIを定期的にレビュー
- ユーザーフィードバックの収集

## 結論

**52%のAPIがほぼ未使用**という状況は、以下を示唆：
1. APIが複雑すぎる
2. ドキュメントが不足
3. 実用的な用途が不明確
4. オーバーエンジニアリング

シンプルで使いやすいAPIセットへの再設計を検討すべき。