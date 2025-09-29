---
id: 149
type: issue
title: "spec系コマンドで計画後に自動的に作業を開始してしまう問題"
status: Closed
priority: HIGH
description: "spec:design等で計画を作成した後、承認なしに実装作業を開始してしまう"
aiSummary: "Issue about spec commands automatically starting implementation work after planning phase without user approval, requiring clearer boundaries between planning and execution phases"
tags: ["process","ai-behavior","spec-command","user-control"]
related: [173,176,141,146,148,142,150]
keywords: {"spec":1,"command":0.9,"design":0.8,"implementation":0.8,"automatic":0.7}
concepts: {"workflow management":0.9,"automation":0.8,"software development":0.7,"user interface":0.7,"system design":0.6}
embedding: "gICbgoCAjoCEgICqgIWAh4CAkYCAgImAjICApoCNgI2AgIiFgICCgJCAgKiAkICNgICWjYCAgICNgICngIyAjoCAh4eAgISAhYCAmICEgIyAgIuOgICAgICAgJOAioCFgICWkICAhoCDgICYgIKAgICAnoqAgIyAgICAo4CAgIE="
createdAt: 2025-08-29T07:33:22.000Z
updatedAt: 2025-08-29T07:55:34.000Z
---

# spec系コマンドで計画後に自動的に作業を開始してしまう問題

**注意**: このイシューは #173 に統合されました。対応は #173 で追跡されています。

## 問題の詳細

spec系のコマンド（特に`/kuma:spec:design`）で設計書を作成した後、AIが勝手に実装作業を開始してしまうケースがある。

## 対応状況

- 2025-08-29: #173 に統合され、修正が実施されました
- 各Spec系コマンドファイルに「PLANNING ONLY」の明示的な制約を追加
- 実装開始には明示的なコマンド（`/kuma:go`または`/kuma:vibe:code`）が必要であることを明記

## 関連項目
- #173 - Spec系コマンドで計画中に作業を始めてしまう問題（統合先）