---
id: 103
type: documentation
title: "AI-Spec 開発フロー実例集"
description: "実際の開発シナリオに基づいたAI-Specコマンドの具体的な使用例とベストプラクティス"
status: Completed
priority: HIGH
aiSummary: "A comprehensive guide for AI-Spec development workflows featuring 5 practical scenarios ranging from large-scale OAuth authentication to micro-level bug fixes, with specific command usage patterns and best practices for different development scales and types."
tags: ["documentation","workflow","best-practices","ai-spec","examples"]
keywords: {"ai":1,"spec":1,"development":0.9,"flow":0.8,"scenario":0.8}
concepts: {"software development":0.9,"development methodology":0.9,"project management":0.8,"workflow automation":0.8,"feature development":0.8}
related: [102]
created: 2025-08-21T13:44:54.329Z
updated: 2025-08-21T13:44:54.329Z
---

# AI-Spec 開発フロー実例集

## 5つの実践シナリオ

### シナリオ1: 大規模機能（OAuth認証）
- 規模: 5-7日
- 使用: `/ai-spec`（完全3フェーズ）
- フロー: 判断→ステアリング確認→Spec生成→検証→改善→実行→進捗管理

### シナリオ2: バグ修正（ログインボタン）
- 規模: 1-2時間
- 使用: `/ai-spec:micro`
- フロー: Micro Spec作成→即実装→コミット

### シナリオ3: API追加（CSVエクスポート）
- 規模: 1.5日
- 使用: `/ai-spec:quick`
- フロー: 判断→Quick Spec→タスク実行

### シナリオ4: UI改善（ダークモード）
- 規模: 3-4時間
- 使用: `/ai-spec:micro`
- フロー: Micro Spec→実装→検証

### シナリオ5: DB最適化
- 規模: 3-5日
- 使用: `/ai-spec`（設計重視）
- フロー: 調査→ステアリング→設計詳細→リスク評価→段階実装

## パターン別クイックリファレンス

### 機能追加
- 小規模: `/ai-spec:micro`
- 中規模: `/ai-spec:quick`
- 大規模: `/ai-spec`

### バグ修正
- 緊急: `/ai-spec:micro`
- 複雑: `/ai-spec:quick`

### リファクタリング
- 設計重視: `/ai-spec --focus design`
- タスク重視: `/ai-spec:tasks`

### パフォーマンス改善
- 要件定義: `/ai-spec:req`
- 設計重視: `/ai-spec:design`

## ベストプラクティス
1. 必ず規模判断から開始（`/ai-spec:when`）
2. ステアリングドキュメントの活用
3. 各フェーズ後の検証実施
4. 実装と見積もりの差異を記録
5. 知見をステアリングに反映

## アンチパターン対策
- ❌ Spec省略 → 最低限Micro Spec作成
- ❌ 過度な詳細 → 適切な規模判断
- ❌ 更新放置 → 定期的なrefine