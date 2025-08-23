---
id: 9
type: analysis
title: "未使用MCP APIの想定用途と実態のギャップ分析"
status: Completed
priority: MEDIUM
description: "ほぼ使われていないAPIが何を想定して作られたのか、なぜ使われないのかを分析"
aiSummary: "Analysis of unused MCP APIs revealing gap between intended complex graph analysis features and actual simple knowledge base usage patterns, suggesting overengineering and need for API simplification"
tags: ["analysis","api","optimization","yagni","mcp","usage"]
related: [25,26,47,18,40,81,88]
keywords: {"api":1,"unused":0.9,"analysis":0.8,"graph":0.8,"search":0.7}
concepts: {"api design":0.9,"graph analysis":0.8,"knowledge management":0.8,"system analysis":0.8,"software architecture":0.7}
embedding: "gIiAgICFlYCAgKqAgICDgICBgICFiYqAg4CmgICAgICAgICAgIeDgIuAp4CAgIWAgICAgIiViICQgJOAgICOgICAgICQnJOAjoCCgICAiICAhoCAkpaVgJCAhICAgJCAgIyAgIuJnoCMgJaAgICSgICNgICDipuAhICpgICAjIA="
createdAt: 2025-08-22T13:32:41.000Z
updatedAt: 2025-08-22T13:32:41.000Z
---

# 未使用APIの想定用途と実態のギャップ分析

## 未使用APIの想定用途分析

### 🔍 グラフ分析系API

#### find_shortest_path（最短パス検索）
**想定用途**: 
- 「このバグとこの機能の関連を辿りたい」
- 「AとBの知識がどう繋がっているか知りたい」

**使われない理由**:
- 実際は直接的な関連（1ホップ）で十分
- 複雑な関連性を辿る必要がない
- get_related_itemsで事足りる

#### find_hub_nodes（ハブノード検索）
**想定用途**:
- 「最も参照される重要な知識を特定」
- 「中心的なイシューを発見」
- 「影響範囲の大きいアイテムを特定」

**使われない理由**:
- プロジェクト規模が小さい（50アイテム程度）
- 自然に重要なものは把握している
- タグやtypeで十分分類できている

#### find_clusters（クラスター検索）
**想定用途**:
- 「関連の強いアイテム群を自動発見」
- 「隠れたトピックグループを検出」
- 「モジュール分割の参考」

**使われない理由**:
- アイテム数が少なくクラスターが形成されない
- typeやtagで既に分類されている
- 自動クラスタリングより手動分類の方が正確

#### find_isolated_nodes（孤立ノード検索）
**想定用途**:
- 「関連付けが漏れているアイテムを発見」
- 「整理が必要なアイテムを特定」
- 「品質管理」

**使われない理由**:
- 孤立していても問題ない（単独の知識など）
- create時に自動で関連付けされる
- わざわざ検索する必要がない

### 💾 チェックポイント系API

#### save_checkpoint / list_checkpoints
**想定用途**:
- 「プロジェクトの特定時点を記録」
- 「大きな変更前のバックアップ」
- 「マイルストーン管理」

**使われない理由**:
- Gitで十分（コードと一緒に管理）
- データベース自体が永続的
- ロールバック機能が不要
- sessionやhandoverで代替可能

### 🤖 AI分析系API

#### find_similar_items（埋め込みベース類似検索）
**想定用途**:
- 「意味的に似たアイテムを発見」
- 「重複の可能性があるアイテムを検出」
- 「関連知識の推薦」

**使われない理由**:
- keywordsやconceptsベースの検索で十分
- 埋め込みベクトルの精度が不明
- get_related_items のhybrid戦略で代替可能

### 📊 統計系API

#### get_type_stats（タイプ別統計）
**想定用途**:
- 「プロジェクトの構成を分析」
- 「アイテムタイプのバランス確認」
- 「レポート生成」

**使われない理由**:
- get_statsで基本情報は取得可能
- 詳細な統計が必要な場面がない
- タイプ数が少ない（10種類程度）

#### get_graph_stats（グラフ構造統計）
**想定用途**:
- 「知識ベースの健全性評価」
- 「接続性の分析」
- 「ネットワーク密度の把握」

**使われない理由**:
- 専門的すぎて解釈が困難
- 実用的なアクションに繋がらない
- 小規模では意味がない

### 🏷️ タグ系API

#### suggest_tags（タグサジェスト）
**想定用途**:
- 「入力補完による利便性向上」
- 「タグの一貫性維持」
- 「タイポ防止」

**使われない理由**:
- タグ数が少ない（20-30個）
- AIが自動でタグ付けする
- 手動入力の機会が少ない

### 🔄 変更系API

#### remove_relations（リレーション削除）
**想定用途**:
- 「誤った関連付けの修正」
- 「リファクタリング」
- 「データクリーンアップ」

**使われない理由**:
- 一度作った関連は維持される傾向
- 削除より新規作成が多い
- 間違いが少ない（自動関連付けが正確）

## 根本的な問題

### 1. オーバーエンジニアリング
- **想定**: 大規模知識ベース（数千〜数万アイテム）
- **実態**: 小規模（50-100アイテム）
- **結果**: 複雑な分析機能が不要

### 2. ユースケース不在
- **想定**: 複雑なナレッジグラフ分析
- **実態**: シンプルなイシュートラッカー的使用
- **結果**: 高度な機能が活用されない

### 3. 自動化の成功
- **想定**: 手動での関連付けや分類が必要
- **実態**: AIによる自動化が効果的
- **結果**: 手動操作用APIが不要

### 4. 代替手段の存在
- グラフ分析 → get_related_itemsで十分
- チェックポイント → Gitで管理
- タグサジェスト → AIが自動付与

## 結論

これらのAPIは**将来の拡張性**を考慮して実装されたが：

1. **実際の使用規模が想定より小さい**
2. **AIによる自動化が想定以上に効果的**
3. **シンプルな機能で十分なユースケース**
4. **他のツールとの重複**（Git等）

結果として、**YAGNI原則**（You Aren't Gonna Need It）に反する実装となっている。

## 提案

### 削除候補（使用実績ゼロ）
- チェックポイント系（2個）
- グラフ分析系の一部（3-4個）

### 統合候補
- find_similar_items → get_related_itemsに統合
- 各種統計API → get_statsに統合

### 維持すべきコア機能
- 基本CRUD（create, get, update, list, search）
- リレーション管理（add_relations, get_related_items）
- 状態管理（get/update_current_state）

**「シンプルで十分」**という実態に合わせてAPIを整理すべき。