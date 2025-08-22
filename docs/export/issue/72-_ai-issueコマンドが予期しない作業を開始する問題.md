---
id: 72
type: issue
title: "/ai-issueコマンドが予期しない作業を開始する問題"
status: Completed
priority: HIGH
tags: ["workflow","command","bug","ai-issue","parsing"]
related: [84,87,95,12,46]
keywords: {"103":0.67,"search":1,"issue":1,"keyword":0.67,"close":0.67}
embedding: "gICRgI2AgImAioCAgICAgICAm4CJgICDiJeAgICAgICAgJiAiYCAi6GbgICAgICAgICWgI2AgJK1k4CAgICAgICAjoCRgICQsYWAgICAgICAgIWAkoCAh6qPgICAgICAgICAgImAgICXg4CAgICAgICAhICRgICBkoCAgICAgIA="
createdAt: 2025-08-22T13:32:44.000Z
updatedAt: 2025-08-22T13:32:44.000Z
---

# /ai-issueコマンドが予期しない作業を開始する問題

/ai-issueコマンドに引数を渡した際、イシュー作成ではなく意図しない作業を開始してしまう問題を修正

## AI Summary

/ai-issueコマンドが予期しない作業を開始する問題 /ai-issueコマンドに引数を渡した際、イシュー作成ではなく意図しない作業を開始してしまう問題を修正 # /ai-issueコマンド動作不良の修正

## 問題の詳細

`/ai-issue`コマンドの動作が不安定：
1. 引数を渡すと、イシュー作成ではなく作業を開始してしまう
2. コマンドの意図と実際の動作が一致しない

## 期待

# /ai-issueコマンド動作不良の修正

## 問題の詳細

`/ai-issue`コマンドの動作が不安定：
1. 引数を渡すと、イシュー作成ではなく作業を開始してしまう
2. コマンドの意図と実際の動作が一致しない

## 実装した修正

### 1. 引数解析ルールの厳密化
- 解析順序を明確に定義
- 曖昧な入力には必ず確認ダイアログを表示
- Task/エージェントツールの使用を明示的に禁止

### 2. 明確な動作ルール
- このコマンドはイシュー管理のみ（作業実行は絶対しない）
- 曖昧なテキストには3択の確認ダイアログ表示
- 引用符付きまたは明確なキーワード付きのみ自動作成

### 3. ユーザーへの明示
- Purposeセクションに「作業実行しない」を明記
- 曖昧な入力の例を追加
- 確認ダイアログのテンプレート提供

## 修正ファイル
- `.claude/commands/ai-issue.md`

## テスト結果
✅ 引数なし → イシュー一覧表示
✅ 数値のみ → イシュー詳細表示
✅ "バグ説明" → イシュー作成
✅ 曖昧テキスト → 確認ダイアログ表示
✅ search keyword → 検索実行
