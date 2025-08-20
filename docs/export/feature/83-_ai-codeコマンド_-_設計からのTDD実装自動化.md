---
id: 83
type: feature
title: "/ai-codeコマンド - 設計からのTDD実装自動化"
description: "承認済み設計からTDDメソッドでコード実装を行うコマンド。RED-GREEN-REFACTORサイクルと自動レビューを含む"
status: Completed
priority: HIGH
aiSummary: "AI command for automated TDD implementation from approved design specifications, following RED-GREEN-REFACTOR cycle with automated review"
tags: ["automation","tdd","implementation","command","ai-code"]
keywords: {"code":1,"ai":1,"test":0.9,"tdd":0.9,"command":0.9}
concepts: {"test driven development":0.9,"testing":0.8,"software engineering":0.8,"automation":0.8,"development workflow":0.7}
related: [84,91,92,93]
created: 2025-08-16T06:06:00.403Z
updated: 2025-08-16T06:06:00.403Z
---

## 概要

`/ai-code`コマンドは、承認済みの技術設計からTDDメソッドに従ってコード実装を行う専用コマンドです。

## 前提条件

- **設計が存在すること** - `/ai-design`で先に設計を作成
- **設計が承認済みであること** - レビューを通過した設計
- **明確な仕様があること** - 実装詳細が設計に含まれている

## プロセスフロー

### 1. RED Phase (テストファースト)
- 設計からテストケースを抽出
- 失敗するテストを作成
- テストが正しい理由で失敗することを確認

### 2. GREEN Phase (動作させる)
- テストを通すための最小限のコードを実装
- 機能性に焦点を当てる（最適化はしない）
- 全テストが通ることを確認

### 3. REFACTOR Phase (改善する)
- コード構造を改善
- 重複を削除
- テストカバレッジを維持

### 4. REVIEW Phase (品質チェック)
- shirokuma-reviewerエージェントを使用
- 自動コードレビュー
- 必要に応じて問題を修正

## 使用方法

```bash
/ai-code              # 最新の設計を実装
/ai-code 42          # design-42から実装
/ai-code issue-67    # issue-67の設計を見つけて実装
```

## 成果物

### 作成されるファイル
1. **テストファイル** - 包括的なテストスイート
2. **実装ファイル** - 動作するコード
3. **引き継ぎドキュメント** - 実装詳細

### MCPレコード
- 実装記録を`handover`タイプとして作成
- イシューステータスを更新（In Progress → Review）
- すべての成果物を設計とイシューにリンク

## 品質基準

### テストカバレッジ
- すべての関数にユニットテスト
- ワークフローの統合テスト
- エッジケースをカバー
- エラーシナリオをテスト

### コード品質
- プロジェクト規約に従う
- リンティングをパス
- セキュリティ脆弱性なし
- パフォーマンス要件を満たす

## 実装例

```bash
/ai-code 42
> Loading design #42...
> Design: "User Authentication Module"

## 📝 RED Phase - Writing Tests
> Creating auth.test.ts...
> Writing 15 test cases...
> Running tests... ❌ 15 failures (expected)

## 🔨 GREEN Phase - Implementation
> Creating auth.service.ts...
> Running tests... ✅ 15 passing

## ♻️ REFACTOR Phase - Optimization
> Improving code structure...
> Running tests... ✅ 15 passing

## 👀 REVIEW Phase - Quality Check
> Review: APPROVED ✅

## ✨ Implementation Complete!
```

## 特徴

1. **設計駆動** - 仕様なしにコードを書かない
2. **テスト駆動** - RED-GREEN-REFACTORを厳格に実施
3. **インクリメンタル** - 一度に1コンポーネント
4. **自動レビュー** - 品質保証の自動化
5. **トレーサビリティ** - MCPですべて追跡可能

## 関連コマンド

- `/ai-design` - 技術設計の作成
- `/ai-test` - テストの追加
- `/ai-review` - 手動コードレビュー
- `/ai-go` - フルサイクル（設計＋コード）

## 実装状況

✅ コマンド定義作成完了（.claude/commands/ai-code.md）