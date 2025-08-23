---
id: 53
type: issue
title: "ステータス \"In Progress\" が存在しないエラーの修正"
status: Completed
priority: HIGH
description: "list_items APIでstatus配列を指定するとエラーが発生する問題を修正完了"
aiSummary: "ステータス \"In Progress\" が存在しないエラーの修正 list_items APIでstatus: [\"Open\",\"In Progress\",\"Pending\"]を指定すると、\"Status 'In Progress' not found\"エラーが発生する ## 問題の詳細\n\n`mcp__shirokuma-kb__list_items` APIを呼び出す際に、ステータスフィルターに"
tags: ["status","bug","database","api-error"]
related: [3,10,12,19,24,26,34,35,36,39,6,55,94]
keywords: {"progress":1,"status":1,"api":0.86,"open":0.57,"list_items":0.57}
embedding: "gICPn4CAgICAj6yCgICAj4CAiKGAgICAgIikgICAg4+AgIGagICAgICBlYGAgJCJgICAkICAgICAgImFgICbgYCAh4yAgICAgIaEgoCAm4CAgI6OgICAgICOjoaAgI+AgICQjYCAgICAiZ+IgICCgYCAipWAgICAgI+whoCAgYg="
createdAt: 2025-08-22T13:32:43.000Z
updatedAt: 2025-08-22T13:32:43.000Z
---

## 問題の詳細

`mcp__shirokuma-kb__list_items` APIを呼び出す際に、ステータスフィルターに "In Progress" を含めると以下のエラーが発生します：

```
MCP error -32603: Operation failed: Status 'In Progress' not found
```

## 再現手順

1. `list_items` APIを呼び出す
2. statusパラメータに `["Open", "In Progress", "Pending"]` を指定
3. エラーが発生

## 原因

データベースのStatusテーブルに "In Progress" というステータスが登録されていない可能性があります。

## 修正案

1. データベースのStatusテーブルを確認
2. 必要なステータスが存在しない場合は追加
3. シードデータやマイグレーションスクリプトの更新

## 影響範囲

- `/ai-start` コマンド
- `/ai-issue` コマンド  
- その他ステータスフィルタリングを使用する全ての機能