---
id: 173
type: issue
title: "Spec系コマンドで計画中に作業を始めてしまう問題"
status: In Progress
priority: HIGH
description: "Spec系コマンド（/kuma:spec等）で計画フェーズ中に自動的に実装作業を開始してしまう問題を修正する必要がある"
aiSummary: "Spec系コマンドで計画中に作業を始めてしまう問題 Spec系コマンド（/kuma:spec等）で計画フェーズ中に自動的に実装作業を開始してしまう問題を修正する必要がある Spec系コマンドで計画中に作業を始めてしまう問題 Spec系コマンド（/kuma:spec等）で計画フェーズ中に自動的に実装作業を開始してしまう問題を修正する必要がある # Spec系コマンドで計画中に作業を始めてしまう問題\n..."
tags: ["commands","bug","ai-behavior","spec"]
related: [149,176]
keywords: {"spec":1,"kuma":1,"design":0.38,"tasks":0.26,"plan":0.26}
embedding: "gIuHgoCAh4CAhICqgICZgYCIgICBgIqAgICAm4CAh4aAgoGBg4CGgICDgIeAgIaKgIaHgIGAgYCAgICVgICZiYCBgoOEgICAgIGAg4CArYWAgIqJhYCEgICHgIGAgLGAgIOQi4SAiYCAioCSgICggICJj4iBgIuAgImApoCAqoA="
createdAt: 2025-08-29T07:33:22.000Z
updatedAt: 2025-08-29T07:55:23.000Z
---

# Spec系コマンドで計画中に作業を始めてしまう問題

## 問題の説明

Spec系コマンド（`/kuma:spec`, `/kuma:spec:design`, `/kuma:spec:tasks`など）を実行すると、計画フェーズ（仕様書や設計書の作成段階）であるにも関わらず、AIが自動的に実装作業を開始してしまうことがある。

## 現象

1. `/kuma:spec:design 169` を実行
2. 設計ドキュメントを作成（正常）
3. **問題**: その後、ユーザーの確認なしに自動的にタスク実装を開始してしまう

## 期待される動作

- Spec系コマンドは**計画と文書化のみ**を行う
- 実装作業は明示的に`/kuma:go`や`/kuma:vibe:code`を使用した時のみ開始
- 計画フェーズ完了後は、次のステップの提案のみ行う

## 影響範囲

- `/kuma:spec` - メイン仕様コマンド
- `/kuma:spec:design` - 設計フェーズ
- `/kuma:spec:tasks` - タスク分解フェーズ
- `/kuma:spec:req` - 要件定義フェーズ
- その他のspec系サブコマンド

## 根本原因（推測）

1. コマンド定義に「計画のみ」という制約が不明確
2. AIの「proactive」な性質が過度に働いている
3. Plan modeからの自動的なコード実行への移行

## 修正案

### オプション1: コマンド定義の強化
各spec系コマンドの定義に以下を追加：
- `**IMPORTANT**: This command is for PLANNING ONLY. Never start implementation.`
- `After creating documents, suggest next steps but DO NOT execute them.`

### オプション2: 明示的な確認ステップ
- 計画完了後、必ず「実装を開始しますか？」の確認を入れる
- ユーザーが明示的に承認しない限り作業を開始しない

### オプション3: ExitPlanModeの活用
- Plan mode中は自動的な作業開始を完全にブロック
- ExitPlanModeツールの使用を必須化

## 関連イシュー

- #149 - spec系コマンドで計画後に自動的に作業を開始してしまう問題
- #152 - Spec駆動開発をoutput-styleに移植
- #72, #73 - _ai-issueコマンドが予期しない作業を開始する問題（類似）

## 優先度

HIGH - 開発フローの予測可能性に影響するため

## 対応予定

1. 各spec系コマンドの定義ファイルを確認
2. 「計画のみ」の制約を明確に追加
3. テストして動作確認
4. 必要に応じてoutput-styleへの移行も検討