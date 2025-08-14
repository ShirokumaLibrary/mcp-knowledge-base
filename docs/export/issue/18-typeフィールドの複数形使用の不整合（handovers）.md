---
id: 18
type: issue
title: "typeフィールドの複数形使用の不整合（handovers）"
status: Completed
priority: HIGH
tags: ["bug","consistency","type-validation","data-integrity"]
keywords: {"handover":1,"shirokuma":1,"type":1,"handovers":1,"claude":1}
embedding: "i4CehICAjICAgICAgICJmoOAnICAgIaAgICMgICAiZKPgJmIgICGgICAloCAgIWGmYCXlYCAiYCAgJCAgICBgJiAmIyAgIyAgICfgICAgIaNgJyXgICGgICAo4CAgIOSgoCSmoCAhYCAgJaAgICIiYGAnJCAgIiAgICGgICAhZY="
related: [1,5,11,19,20,22,33,34]
searchIndex: "shirokuma type handovers handover claude agents mcp knowledge curator programmer"
created: 2025-08-13T12:34:49.161Z
updated: 2025-08-13T12:39:47.604Z
---

# typeフィールドの複数形使用の不整合（handovers）

## Description

handoverタイプが単数形と複数形（handovers）で混在している。エージェント定義ファイルで複数形が使われている。

## Content

## 問題の詳細

MCPデータベースを調査した結果、`handover`タイプが単数形と複数形で混在していることが判明。

### 現状
- **正しい形（単数形）**: handover - 4件（ID: 6, 7, 10, 12）
- **誤った形（複数形）**: handovers - 2件（ID: 9, 11）

### 原因箇所
以下のエージェント定義ファイルで`type: 'handovers'`が使用されていた：

1. `.claude/agents/shirokuma-knowledge-curator.md:295` ✅ 修正済み
2. `.claude/agents/shirokuma-programmer.md:257` ✅ 修正済み
3. `.claude/agents/shirokuma-issue-manager.md:202` ✅ 修正済み

## 解決内容

### ✅ 完了した対応
1. **エージェント定義ファイルの修正**
   - 3箇所すべてで`handovers`を`handover`に変更
   - 今後新規作成されるhandoverは正しく単数形になる

2. **問題の文書化**
   - 既存データの修正方法について調査
   - 技術的制約の明確化

### 技術的制約
- `update_item` APIではtypeフィールドの変更不可
- `change_item_type` APIは未実装
- 既存の2件（ID: 9, 11）は当面そのまま

## 今後の対応

1. **機能追加** (issue-19として登録済み)
   - change_item_type APIの実装
   - typeフィールド変更機能の追加

2. **回避策**
   - 検索時: `type:handover OR type:handovers`を使用
   - 次回DBメンテナンス時に一括修正を検討

## 影響評価
- **影響度**: 低
- **理由**: 新規作成時は正しく動作するため、実害は限定的
- **既存データ**: 2件のみが影響（全体の33%）

## AI Summary

typeフィールドの複数形使用の不整合（handovers） handoverタイプが単数形と複数形（handovers）で混在している。エージェント定義ファイルで複数形が使われている。 ## 問題の詳細

MCPデータベースを調査した結果、`handover`タイプが単数形と複数形で混在していることが判明。

### 現状
- **正しい形（単数形）**: handover - 4件（ID: 6

## Keywords (Detailed)

- handover (weight: 1.00)
- shirokuma (weight: 1.00)
- type (weight: 1.00)
- handovers (weight: 1.00)
- claude (weight: 1.00)
- agents (weight: 1.00)
- mcp (weight: 0.36)
- knowledge (weight: 0.36)
- curator (weight: 0.36)
- programmer (weight: 0.36)

---
*Exported from SHIROKUMA Knowledge Base*
