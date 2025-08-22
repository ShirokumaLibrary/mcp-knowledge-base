---
id: 27
type: feature
title: "/ai-designコマンド - 設計専用コマンドの実装"
status: Completed
priority: MEDIUM
tags: ["automation","design","command","ai-design"]
related: [84,91,92,93,6,8,54,55,60,63,85,94,99]
keywords: {"design":1,"review":0.65,"issue":0.65,"mcp":0.43,"shirokuma":0.43}
embedding: "gICVgICAgImZi4CEgICAnoCAgoCDgICInZmEiYGAgJaAgIKAgICAhJyegImGgICIgICVgISAgICclISFiYCAgICAhoCIgICAkIaOgYeAgIWAgJyAiYCAhIOQlICKgICOgICtgIaAgImAg5CAh4CAiYCAqYCBgICJi4CHgIOAgJc="
createdAt: 2025-08-22T13:32:42.000Z
updatedAt: 2025-08-22T13:32:42.000Z
---

# /ai-designコマンド - 設計専用コマンドの実装

shirokuma-designerエージェントをベースにした設計専用コマンド。設計作成→自己検証→レビュー→ユーザー承認のフローを自動化

## AI Summary

/ai-designコマンド - 設計専用コマンドの実装 shirokuma-designerエージェントをベースにした設計専用コマンド。設計作成→自己検証→レビュー→ユーザー承認のフローを自動化 ## 概要

`/ai-design`コマンドは、イシューに対する技術設計を作成し、自動レビューを経てユーザーに提示する専用コマンドです。

## 主な機能

### 1. プロセスフロー
1. **I

## Issue #82: ai-goコマンドの役割再定義

### 実施内容

ai-goコマンドを汎用タスク実行コマンドとして再定義しました。

### 変更内容

1. **役割の変更**
   - 旧: 万能開発コマンド（設計・実装・テストすべて）
   - 新: 汎用タスク実行（メンテナンス・リファクタリング・ドキュメント等）

2. **削除した機能**
   - TDD開発ワークフロー
   - 設計フェーズ
   - 実装フェーズ
   - これらは`ai-design`と`ai-code`に委譲

3. **新しい機能**
   - タスクタイプ自動検出
   - 適切なコマンドへのリダイレクト
   - メンテナンスタスク専用ワークフロー

### 使い分けガイドライン

**ai-goを使う場合:**
- 依存関係の更新
- Lintエラーの修正
- テストの追加
- 小規模バグ修正
- リファクタリング
- ドキュメント更新
- 設定変更

**ai-designを使う場合:**
- 新機能の設計
- 大規模変更の設計
- アーキテクチャ変更

**ai-codeを使う場合:**
- 承認された設計の実装
- TDDによる開発

### 実装完了

`/home/webapp/shirokuma-v8/.claude/commands/ai-go.md`を更新し、汎用タスク実行に特化しました。
