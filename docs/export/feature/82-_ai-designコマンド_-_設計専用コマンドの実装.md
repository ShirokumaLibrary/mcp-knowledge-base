---
id: 82
type: feature
title: "/ai-designコマンド - 設計専用コマンドの実装"
status: Completed
priority: MEDIUM
aiSummary: "/ai-designコマンド - 設計専用コマンドの実装 shirokuma-designerエージェントをベースにした設計専用コマンド。設計作成→自己検証→レビュー→ユーザー承認のフローを自動化 ## 概要\n\n`/ai-design`コマンドは、イシューに対する技術設計を作成し、自動レビューを経てユーザーに提示する専用コマンドです。\n\n## 主な機能\n\n### 1. プロセスフロー\n1. **I"
tags: ["automation","design","command","ai-design"]
keywords: {"design":1,"issue":0.65,"review":0.65,"mcp":0.43,"shirokuma":0.43}
embedding: "gICVgICAgImZi4CEgICAnoCAgoCDgICInZmEiYGAgJaAgIKAgICAhJyegImGgICIgICVgISAgICclISFiYCAgICAhoCIgICAkIaOgYeAgIWAgJyAiYCAhIOQlICKgICOgICtgIaAgImAg5CAh4CAiYCAqYCBgICJi4CHgIOAgJc="
related: [84]
searchIndex: "design issue review shirokuma mcp designer analysis creation self validation"
created: 2025-08-16T05:52:24.588Z
updated: 2025-08-16T05:52:24.588Z
---

# /ai-designコマンド - 設計専用コマンドの実装

## Description

shirokuma-designerエージェントをベースにした設計専用コマンド。設計作成→自己検証→レビュー→ユーザー承認のフローを自動化

## Content

## 概要

`/ai-design`コマンドは、イシューに対する技術設計を作成し、自動レビューを経てユーザーに提示する専用コマンドです。

## 主な機能

### 1. プロセスフロー
1. **Issue Analysis** - 問題の理解
2. **Design Creation** - 技術設計の生成
3. **Self-Validation** - 完全性チェック
4. **Peer Review** - shirokuma-reviewerによる自動レビュー
5. **User Review** - 最終承認のための提示

### 2. 使用方法
```bash
/ai-design           # 現在/選択中のイシューの設計
/ai-design 42        # 特定イシューの設計
/ai-design "feature" # 新機能の設計（イシュー作成から）
```

### 3. 設計ドキュメント構造
- Problem Statement（問題定義）
- Solution Overview（解決策の概要）
- Design Decisions（設計決定と根拠）
- Architecture（アーキテクチャ）
- Implementation Plan（実装計画）
- Testing Strategy（テスト戦略）
- Security & Performance（セキュリティとパフォーマンス）

### 4. 品質ゲート
- **自己検証チェックリスト** - 完全性の確認
- **自動レビュー** - APPROVEDステータスが必要
- **フィードバック自動反映** - 最大2回の改善試行

### 5. MCP統合
- 設計を`design`タイプとして保存
- 元のイシューとリンク
- タグ: ["design", "issue-XX", "reviewed"]

## 利点

1. **設計品質の向上** - 構造化された設計プロセス
2. **レビュー自動化** - 品質チェックの自動実行
3. **トレーサビリティ** - イシューと設計の明確なリンク
4. **再利用性** - MCPに保存される設計知識

## 実装状況

✅ コマンド定義作成完了（.claude/commands/ai-design.md）

## 関連コマンド

- `/ai-issue` - イシューの作成・表示
- `/ai-go` - 承認された設計の実装
- `/ai-review` - 実装のレビュー

## AI Summary

/ai-designコマンド - 設計専用コマンドの実装 shirokuma-designerエージェントをベースにした設計専用コマンド。設計作成→自己検証→レビュー→ユーザー承認のフローを自動化 ## 概要

`/ai-design`コマンドは、イシューに対する技術設計を作成し、自動レビューを経てユーザーに提示する専用コマンドです。

## 主な機能

### 1. プロセスフロー
1. **I

## Keywords (Detailed)

- design (weight: 1.00)
- issue (weight: 0.65)
- review (weight: 0.65)
- mcp (weight: 0.43)
- shirokuma (weight: 0.43)
- validation (weight: 0.22)
- analysis (weight: 0.22)
- designer (weight: 0.22)
- creation (weight: 0.22)
- self (weight: 0.22)

