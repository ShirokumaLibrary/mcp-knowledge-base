---
id: 80
type: issue
title: "/ai-issueコマンドが予期しない作業を開始する問題"
status: Open
priority: HIGH
aiSummary: "/ai-issueコマンドが予期しない作業を開始する問題 /ai-issueコマンドに引数を渡した際、イシュー作成ではなく意図しない作業を開始してしまう問題を修正 # /ai-issueコマンド動作不良の修正\n\n## 問題の詳細\n\n`/ai-issue`コマンドの動作が不安定：\n1. 引数を渡すと、イシュー作成ではなく作業を開始してしまう\n2. コマンドの意図と実際の動作が一致しない\n\n## 期待"
tags: ["bug","workflow","command","ai-issue","parsing"]
keywords: {"103":0.67,"issue":1,"search":1,"keyword":0.67,"close":0.67}
embedding: "gICRgI2AgImAioCAgICAgICAm4CJgICDiJeAgICAgICAgJiAiYCAi6GbgICAgICAgICWgI2AgJK1k4CAgICAgICAjoCRgICQsYWAgICAgICAgIWAkoCAh6qPgICAgICAgICAgImAgICXg4CAgICAgICAhICRgICBkoCAgICAgIA="
related: [84,87]
searchIndex: "issue search 103 close keyword 123 bash claude commands"
created: 2025-08-16T05:45:02.693Z
updated: 2025-08-16T05:45:02.693Z
---

# /ai-issueコマンドが予期しない作業を開始する問題

## Description

/ai-issueコマンドに引数を渡した際、イシュー作成ではなく意図しない作業を開始してしまう問題を修正

## Content

# /ai-issueコマンド動作不良の修正

## 問題の詳細

`/ai-issue`コマンドの動作が不安定：
1. 引数を渡すと、イシュー作成ではなく作業を開始してしまう
2. コマンドの意図と実際の動作が一致しない

## 期待される動作

```bash
/ai-issue                    # イシュー一覧表示
/ai-issue "説明文"           # 新規イシュー作成
/ai-issue 103                # イシュー詳細表示
/ai-issue 103 close          # ステータス更新
/ai-issue search "keyword"   # イシュー検索
```

## 修正内容

1. コマンド引数の解析ロジックを明確化
2. 数値のみ → イシュー詳細表示
3. 文字列 → 新規イシュー作成
4. search + キーワード → 検索
5. 数値 + アクション → ステータス更新

## 影響範囲

- `.claude/commands/ai-issue.md`のコマンド定義
- 引数解析ロジックの改善

## 技術的詳細

コマンドの引数解析において、以下の優先順位で判定：
1. 数値パターン（イシューID）
2. "search"キーワード（検索コマンド）
3. 文字列（新規作成）
4. 引数なし（一覧表示）

## テストケース

- [ ] `/ai-issue` → 一覧表示
- [ ] `/ai-issue "新しいバグ"` → イシュー作成
- [ ] `/ai-issue 123` → イシュー詳細
- [ ] `/ai-issue search "keyword"` → 検索実行
- [ ] `/ai-issue 123 close` → ステータス更新

## AI Summary

/ai-issueコマンドが予期しない作業を開始する問題 /ai-issueコマンドに引数を渡した際、イシュー作成ではなく意図しない作業を開始してしまう問題を修正 # /ai-issueコマンド動作不良の修正

## 問題の詳細

`/ai-issue`コマンドの動作が不安定：
1. 引数を渡すと、イシュー作成ではなく作業を開始してしまう
2. コマンドの意図と実際の動作が一致しない

## 期待

## Keywords (Detailed)

- issue (weight: 1.00)
- search (weight: 1.00)
- keyword (weight: 0.67)
- 103 (weight: 0.67)
- close (weight: 0.67)
- 123 (weight: 0.67)
- claude (weight: 0.33)
- bash (weight: 0.33)
- commands (weight: 0.33)

