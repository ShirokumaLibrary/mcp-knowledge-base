---
id: 176
type: knowledge
title: "Spec系コマンドの計画と実装の分離ルール"
status: Open
priority: HIGH
description: "Spec系コマンドが計画フェーズで自動的に実装を開始しないようにするためのルールと修正内容"
aiSummary: "Rules for separating planning and implementation phases in Spec commands to prevent automatic code execution during specification phase"
tags: ["documentation","spec-commands","ai-behavior","planning","system-rules"]
related: [149,173]
keywords: {"spec":1,"command":0.9,"implementation":0.9,"phase":0.8,"kuma":0.8}
concepts: {"software_development":0.9,"workflow_management":0.8,"command_system":0.8,"development_process":0.8,"automation":0.7}
embedding: "gICYgICHgICEgIisgIWAgICAkICAjYCAi4CCsICNgICAgIeAgI2AgJCAgLGAkICAgICTgICHgICNgICrgIuAgICAhoCAgYCAhYCAloCEgICAgIiAgICAgICAhpCAiYCAgICRgICFgICDgIybgIKAgICAmYCAjICAgICNoICAgIA="
createdAt: 2025-08-29T07:56:11.000Z
updatedAt: 2025-08-29T07:56:20.000Z
---

# Spec系コマンドの計画と実装の分離ルール

## 背景

Spec系コマンド（`/kuma:spec`, `/kuma:spec:design`, `/kuma:spec:tasks`, `/kuma:spec:req`など）で、計画フェーズ中にAIが自動的に実装作業を開始してしまう問題が発生していました（Issue #149, #173）。

## 基本原則

### 1. 明確な境界の設定

**計画フェーズ（Spec系コマンド）**:
- 要件定義、設計、タスク分解のドキュメント作成のみ
- 実装コードの生成や実行は一切行わない
- TodoWriteへのタスク登録は「追跡用」であり「実行用」ではない

**実装フェーズ（実行系コマンド）**:
- `/kuma:go` - イシューに基づく実装作業
- `/kuma:vibe:code` - コード生成と実装
- これらのコマンドを明示的に実行した時のみ実装開始

### 2. コマンドファイルの必須要素

各Spec系コマンドファイルには以下を含める：

```markdown
## Purpose

[通常の説明文]

**IMPORTANT**: This command is for [PHASE] ONLY. I will never start implementation work automatically. After creating [documents/specifications], I'll suggest next steps but will NOT execute them without your explicit approval using commands like `/kuma:go` or `/kuma:vibe:code`.
```

### 3. 次フェーズへの遷移ルール

計画フェーズ完了後の動作：

```markdown
## Next Phase

After [phase] is approved, I'll suggest these options but will NOT execute them automatically:
- Use `/kuma:spec:design` to create technical design
- Use `/kuma:spec:tasks` to create implementation plan
- Use `/kuma:go` when you're ready to start implementation

**Remember**: These are suggestions only. You must explicitly choose the next action.
```

### 4. executeサブコマンドの扱い

`/kuma:spec:tasks execute` のようなサブコマンドは：
- タスクをTodoWriteに登録して「可視化」するだけ
- 実際の実装作業は開始しない
- 明示的な注記を追加

```markdown
**NOTE**: The execute function loads tasks into TodoWrite for visibility but does NOT start implementation. Actual implementation must be initiated separately using `/kuma:go` or `/kuma:vibe:code`.
```

## 実装された修正

### 2025-08-29 実施内容

1. **`/kuma:spec.md`**:
   - Purpose欄に「PLANNING and DOCUMENTATION ONLY」の明記
   - executeサブコマンドに「NOT automatic execution」の注記

2. **`/kuma:spec/design.md`**:
   - Purpose欄に「DESIGN DOCUMENTATION ONLY」の明記
   - Next Phase欄に明示的な選択が必要であることを記載

3. **`/kuma:spec/tasks.md`**:
   - Purpose欄に「TASK PLANNING ONLY」の明記
   - Task Execution欄に「TRACKING ONLY」の明記

4. **`/kuma:spec/req.md`**:
   - Purpose欄に「REQUIREMENTS GATHERING ONLY」の明記
   - Next Phase欄に選択制であることを記載

5. **`/kuma:spec.md` (output-style)**:
   - Your Options欄に自動実装しないことを明記
   - Mode Awareness欄に実装制限を強調

## チェックリスト

Spec系コマンドの動作確認時：

- [ ] 計画フェーズ完了後、自動的に実装を開始していないか
- [ ] 次のステップを「提案」のみしているか
- [ ] ユーザーの明示的な指示を待っているか
- [ ] TodoWrite登録を「実行」と誤解していないか
- [ ] ExitPlanModeを適切に使用しているか

## 今後の改善案

1. **ExitPlanModeツールの活用**:
   - Plan mode中は実装を完全にブロック
   - モード終了時に明示的な選択を要求

2. **output-styleの強化**:
   - Mode Awarenessセクションの拡充
   - 実装制限の視覚的表示

3. **確認プロンプトの追加**:
   - 各フェーズ完了時に「次に何をしますか？」の確認
   - 選択肢の明示的な表示

## 関連リソース

- Issue #173: Spec系コマンドで計画中に作業を始めてしまう問題
- Issue #149: spec系コマンドで計画後に自動的に作業を開始してしまう問題（#173に統合）
- `.shirokuma/commands/kuma/spec/*.md` - 各Spec系コマンドファイル
- `.claude/output-styles/kuma-spec.md` - Spec mode output-style