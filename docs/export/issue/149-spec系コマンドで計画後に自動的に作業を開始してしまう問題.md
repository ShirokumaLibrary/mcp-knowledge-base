---
id: 149
type: issue
title: "spec系コマンドで計画後に自動的に作業を開始してしまう問題"
status: Open
priority: HIGH
description: "spec:design等で計画を作成した後、承認なしに実装作業を開始してしまう"
aiSummary: "Issue about spec commands automatically starting implementation work after planning phase without user approval, requiring clearer boundaries between planning and execution phases"
tags: ["process","ai-behavior","spec-command","user-control"]
related: [141,142,146,148,150]
keywords: {"spec":1,"command":0.9,"design":0.8,"implementation":0.8,"automatic":0.7}
concepts: {"workflow management":0.9,"automation":0.8,"software development":0.7,"user interface":0.7,"system design":0.6}
embedding: "gICbgoCAjoCEgICqgIWAh4CAkYCAgImAjICApoCNgI2AgIiFgICCgJCAgKiAkICNgICWjYCAgICNgICngIyAjoCAh4eAgISAhYCAmICEgIyAgIuOgICAgICAgJOAioCFgICWkICAhoCDgICYgIKAgICAnoqAgIyAgICAo4CAgIE="
createdAt: 2025-08-23T06:43:13.000Z
updatedAt: 2025-08-23T06:43:22.000Z
---

# 問題の詳細

## 現象
spec系のコマンド（特に`/kuma:spec:design`）で設計書を作成した後、AIが勝手に実装作業を開始してしまうケースがある。

## 具体例
- `/kuma:spec:design 142`でMCPテストケース更新の設計を作成
- 設計完了後、ユーザーの承認なしにテストファイルの更新を開始
- 「作業開始って誰が言ったの？」という指摘を受ける

## 問題点
1. **計画と実行の境界が不明確** - 設計フェーズと実装フェーズの切り替えタイミングが曖昧
2. **承認プロセスの欠如** - 計画後の実行に明示的な承認ステップがない
3. **AIの過度な自律性** - 「計画したら実行」という暗黙の前提で動作

## 影響
- ユーザーの意図しない変更が発生する可能性
- 計画の確認・修正機会が失われる
- 制御感の喪失によるユーザー体験の低下

## 考えられる解決策

### 案1: 明示的な承認ステップの追加
spec:designコマンドの最後に確認プロンプトを表示：
```
設計が完了しました。
実装を開始しますか？ (Y/N)
または /kuma:spec:tasks で詳細なタスク分解を行いますか？
```

### 案2: コマンドの役割を明確化
各コマンドの説明に明記：
- `spec:req` - 要件定義のみ（実装しない）
- `spec:design` - 設計のみ（実装しない）
- `spec:tasks` - タスク分解のみ（実装しない）
- `kuma:go` - 実装作業の実行（明示的な実行コマンド）

### 案3: 設定可能な動作モード
```yaml
spec_behavior:
  auto_execute: false  # デフォルトは false
  require_confirmation: true
```

### 案4: ExitPlanModeツールの活用
計画系コマンドでは必ずExitPlanModeを使用し、ユーザーに次のアクションを選択させる

## 推奨される解決策

**案2 + 案4の組み合わせ**が最も効果的：

1. **コマンドファイルの更新**
   - 各spec系コマンドに「このコマンドは計画のみ、実装はしない」と明記
   - 実装は`/kuma:go`または`/kuma:vibe:code`で行うことを明示

2. **ExitPlanModeの一貫した使用**
   - spec系コマンドの終了時は必ずExitPlanModeを使用
   - ユーザーに次のステップを選択させる

3. **CLAUDE.mdへの追記**
   - spec系コマンドは計画フェーズ専用
   - 実装は明示的な指示が必要

## 関連項目
- #142 (spec_requirements: システム全体レビューと最適化の要件定義)
- #146 (spec_design: v0.9.0リリース実装アーキテクチャ)
- #148 (spec_design: MCP APIテストケース更新計画)