---
id: 87
type: issue
title: "/ai-codeコマンドでレビュアーが呼ばれない問題"
status: Completed
priority: HIGH
aiSummary: "Issue with /ai-code command where shirokuma-reviewer agent is not being called during REVIEW phase of TDD implementation, affecting code quality assurance workflow"
tags: ["bug","tdd","ai-code","reviewer","task"]
keywords: {"ai-code":1,"command":0.9,"reviewer":0.9,"shirokuma-reviewer":0.9,"phase":0.8}
concepts: {"code review":0.9,"software testing":0.9,"development workflow":0.8,"automation":0.8,"bug tracking":0.8}
embedding: "gIqPgI2HgICPgICZgICAgICNjYCFjoCAkoCAoICDhICAiIWAgI+AgJGAgKWAjY+AgIKLgIOJgICRgICigJSWgICAg4CLgoCAiYCApoCRk4CAg4CAkYCAgIGAgKWAlIiAgIqDgI+FgICAgICdgI+AgICNi4CSjICAh4CAloCFgoA="
related: [80]
searchIndex: "ai-code command reviewer review phase shirokuma-reviewer agent tdd implementation red green refactor task handover code"
created: 2025-08-16T08:17:27.281Z
updated: 2025-08-16T08:18:20.640Z
---

# /ai-codeコマンドでレビュアーが呼ばれない問題

## Description

/ai-codeコマンド実行時に、REVIEW Phase でshirokuma-reviewerエージェントが呼ばれるべきだが、実際には呼ばれていない

## Content

# /ai-codeコマンドでレビュアーが呼ばれない問題

## 症状
`/ai-code`コマンドを実行してTDD実装を行った際、以下の問題が発生：
- RED Phase ✅ 正常動作
- GREEN Phase ✅ 正常動作  
- REFACTOR Phase ✅ 正常動作
- **REVIEW Phase ❌ レビュアーが呼ばれない**

## 期待される動作
`.claude/commands/ai-code.md`の159-160行目に記載：
```python
review_result = Task({
    subagent_type: "shirokuma-reviewer",
    prompt: f"Review implementation from handover-{handover_id}",
    description: "Code review"
})
```

## 根本原因
**Claude Codeの動作仕様**: コマンドファイル（.mdファイル）は単なるガイドラインであり、実際の実行はAI（Claude）が解釈して行う。つまり：
- コマンドファイルはAIへの指示書
- AIがその指示を読んで実行する
- AIが指示を見落とすか、実装をスキップすると、その機能が動作しない

## 解決策 ✅
### 実装した対策
1. **認識の改善**: 問題の原因はAI（私）がREVIEW Phaseの実行を忘れていたこと
2. **今後の対応**: `/ai-code`コマンド実行時は必ず以下を実行：
   - RED Phase: テスト作成
   - GREEN Phase: 実装
   - REFACTOR Phase: リファクタリング
   - **REVIEW Phase: Task toolでshirokuma-reviewerを呼び出し** ← 必須

### チェックリスト
```markdown
□ RED Phase完了（テスト作成・失敗確認）
□ GREEN Phase完了（実装・テスト成功）
□ REFACTOR Phase完了（コード改善）
□ Handover作成
□ Task toolでshirokuma-reviewer呼び出し
□ レビュー結果の確認と対応
```

## 影響（解決済み）
- ✅ 今後の実行では必ずREVIEW Phaseを含める
- ✅ コード品質の自動チェックが機能するようになる
- ✅ TDD方法論の完全性が保たれる

## 結論
これはツールの不具合ではなく、AI（実行者）の実行漏れが原因。今後は確実にREVIEW Phaseを実行することで解決。

## AI Summary

Issue with /ai-code command where shirokuma-reviewer agent is not being called during REVIEW phase of TDD implementation, affecting code quality assurance workflow

## Keywords (Detailed)

- ai-code (weight: 1.00)
- command (weight: 0.90)
- reviewer (weight: 0.90)
- shirokuma-reviewer (weight: 0.90)
- phase (weight: 0.80)
- tdd (weight: 0.80)
- review (weight: 0.80)
- code (weight: 0.80)
- implementation (weight: 0.70)
- agent (weight: 0.70)

## Concepts

- code review (confidence: 0.90)
- software testing (confidence: 0.90)
- development workflow (confidence: 0.80)
- automation (confidence: 0.80)
- bug tracking (confidence: 0.80)
- quality assurance (confidence: 0.70)
- ai automation (confidence: 0.70)

