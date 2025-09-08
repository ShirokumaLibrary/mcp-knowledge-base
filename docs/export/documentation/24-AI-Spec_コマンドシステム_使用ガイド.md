---
id: 24
type: documentation
title: "AI-Spec コマンドシステム 使用ガイド"
status: Completed
priority: HIGH
description: "Spec駆動開発を実現するai-specコマンドシステムの包括的な使用方法ドキュメント"
aiSummary: "Comprehensive AI-Spec command system guide for Spec-driven development, covering requirement definition, design phases, task decomposition with EARS format validation and MCP integration"
tags: ["documentation","guide","commands","ai-spec","sdd","ears"]
related: [103,111,7,10,15,36,53,55,56,57,58,59,62,63,94,95,96]
keywords: {"spec":1,"ai":1,"specification":0.9,"command":0.9,"development":0.9}
concepts: {"software development":0.9,"requirements engineering":0.9,"project management":0.8,"validation":0.8,"system design":0.8}
embedding: "gIKAnICBgICYgICajIyAgICLgImAgYCAkoSAnJCTgICAkoCAgImAgJeMgJiNkICAgJGAioCTgICPkICfhYeAgICJgI6AjICAhI2Al4CAgICAj4CegJSAgICFgJKDhYCAgIaApYCTgICGgICRgICAgICAgJyAioCAkoKAlYSDgIA="
createdAt: 2025-08-22T13:32:41.000Z
updatedAt: 2025-08-22T13:32:41.000Z
---

# AI-Spec コマンドシステム 使用ガイド

## 概要
Spec駆動開発（SDD）を実現する包括的なコマンドセット。要件定義から設計、タスク分解まで全フェーズをサポート。

## コマンド体系

### メインコマンド
- `/ai-spec` - 完全な3フェーズSpec生成
- `/ai-spec:req` - 要件定義（EARS形式）
- `/ai-spec:design` - 設計フェーズ
- `/ai-spec:tasks` - タスク分解

### 軽量Spec
- `/ai-spec:micro` - 超軽量（<1日）
- `/ai-spec:quick` - クイック（1-3日）

### 検証・品質
- `/ai-spec:check` - 包括的チェック
- `/ai-spec:validate` - EARS形式検証
- `/ai-spec:when` - 使用判断ガイド

### プロジェクト設定
- `/ai-spec:steering` - ステアリング管理

## 使用フロー

1. **規模判断**: `/ai-spec:when "機能説明"`
2. **Spec生成**: 適切なコマンド選択
3. **検証**: `/ai-spec:check` / `validate`
4. **改善**: `/ai-spec:refine`
5. **実行**: `/ai-spec:execute`

## EARS形式
- WHEN: イベント駆動要件
- IF: 条件付き要件
- WHILE: 継続的動作
- WHERE: コンテキスト依存
- UNLESS: 例外条件

## MCP統合
全Specは自動的にtype:"spec"でshirokuma-kbに保存。検索・フィルタリング・関連付け可能。

## ベストプラクティス
- 作業量に応じた適切なSpec選択
- ステアリングドキュメントでプロジェクト標準定義
- 各フェーズ後の検証実施
- EARSフォーマットの厳密な適用