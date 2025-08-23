---
id: 158
type: issue
title: "README.mdおよび主要ドキュメントの全面改訂が必要"
status: Open
priority: HIGH
description: "v0.9.0の現在の機能を正確に反映するため、README.mdを始めとする主要ドキュメントの全面的な書き換えが必要。新機能や変更された仕様が文書化されていない状態"
aiSummary: "Complete revision of README.md and major documentation needed to accurately reflect v0.9.0 features, including hybrid spec-driven development, new commands, and updated installation procedures"
tags: ["documentation","user-experience","v0.9.0","readme","high-priority"]
related: [152,157]
keywords: {"documentation":1,"readme":1,"update":0.9,"revision":0.9,"version":0.8}
concepts: {"documentation":1,"software maintenance":0.9,"project management":0.8,"version management":0.8,"development workflow":0.7}
embedding: "gICTj4+QgIiIgJSSgJWAgICAhoaHl4CAgICCi4CRgICAgICAgJOAgoGAhIOAh4CAgICGgoGYgICLgI6JgICAgICAkouKkYCFk4CXgYCCgICAgImSkYWAkY6AoYCAjICAgICWkJGAgJeVgKKIgJSAgICAmoiJhYCTkoCZkICPgIA="
createdAt: 2025-08-23T14:12:02.000Z
updatedAt: 2025-08-23T14:12:11.000Z
---

# README.mdおよび主要ドキュメントの全面改訂

## 問題点
- README.mdが古い情報のまま更新されていない
- v0.9.0で追加された機能が文書化されていない
- ハイブリッドSpec駆動開発などの新しいアプローチが説明されていない
- インストール手順や初期設定が現状と合っていない可能性

## 更新が必要なドキュメント

### 1. README.md（最優先）
- プロジェクト概要の更新
- 最新の機能一覧
- インストール手順
- クイックスタートガイド
- 主要コマンドの使用例

### 2. README.ja.md（日本語版）
- README.mdの日本語翻訳
- 日本語ユーザー向けの追加説明

### 3. docs/getting-started.md
- 初期セットアップ手順
- MCP設定方法
- 基本的なワークフロー

### 4. docs/commands.md
- 全コマンドの詳細リファレンス
- 新コマンド（/kuma:update等）の追加
- 使用例の更新

### 5. docs/architecture.md
- システムアーキテクチャの最新化
- MCP Serverの説明
- output-styleとコマンドのハイブリッド構造

## 重要な更新内容

### 新機能の文書化
- ハイブリッドSpec駆動開発（output-style + commands）
- /kuma:updateコマンド
- 自然言語コマンド化
- system-harmonizerの機能拡張

### 削除された機能の除去
- v0.7.0のセマンティックインデックス（削除済み）
- 非推奨コマンドの削除

### 改善された機能
- Spec駆動開発の流れ
- MCP統合の強化
- エージェントの役割明確化

## 作業計画

### Phase 1: 現状調査
- 既存ドキュメントのレビュー
- 実装との差分確認
- 不足している情報のリストアップ

### Phase 2: README.md更新
- 構成の見直し
- 内容の全面改訂
- 例の更新

### Phase 3: 関連ドキュメント更新
- 各ドキュメントの整合性確認
- 相互参照の修正
- バージョン情報の統一

### Phase 4: レビューと検証
- 実際のインストール手順での検証
- コマンド例の動作確認
- 誤字脱字チェック

## 優先度の理由
- **HIGH**: 新規ユーザーが最初に見るドキュメント
- プロジェクトの第一印象を左右
- 誤った情報による混乱を防ぐ必要がある

## 関連
- Issue #152: Spec駆動開発のハイブリッド化
- Issue #157: セマンティックインデックスの再検討
- v0.9.0リリースノート