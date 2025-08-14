---
id: 3
type: issue
title: "ステータス \"In Progress\" が存在しないエラーの修正"
status: Closed
priority: HIGH
category: "bug-fix"
tags: ["bug","database","status","api","mcp","list-items"]
keywords: {"progress":1,"status":1,"api":0.86,"list_items":0.57,"open":0.57}
embedding: "gICPn4CAgICAj6yCgICAj4CAiKGAgICAgIikgICAg4+AgIGagICAgICBlYGAgJCJgICAkICAgICAgImFgICbgYCAh4yAgICAgIaEgoCAm4CAgI6OgICAgICOjoaAgI+AgICQjYCAgICAiZ+IgICCgYCAipWAgICAgI+whoCAgYg="
related: [2,10,12,19,24,34,35,39]
searchIndex: "progress status api list_items open pending not found mcp__shirokuma kb__list_items"
created: 2025-08-13T10:19:51.771Z
updated: 2025-08-13T11:00:44.724Z
---

# ステータス "In Progress" が存在しないエラーの修正

## Description

issue-2と重複のためクローズ

## Content

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

## AI Summary

ステータス "In Progress" が存在しないエラーの修正 list_items APIでstatus: ["Open","In Progress","Pending"]を指定すると、"Status 'In Progress' not found"エラーが発生する ## 問題の詳細

`mcp__shirokuma-kb__list_items` APIを呼び出す際に、ステータスフィルターに

## Keywords (Detailed)

- progress (weight: 1.00)
- status (weight: 1.00)
- api (weight: 0.86)
- list_items (weight: 0.57)
- open (weight: 0.57)
- pending (weight: 0.57)
- not (weight: 0.57)
- found (weight: 0.57)
- mcp__shirokuma (weight: 0.29)
- kb__list_items (weight: 0.29)

---
*Exported from SHIROKUMA Knowledge Base*
