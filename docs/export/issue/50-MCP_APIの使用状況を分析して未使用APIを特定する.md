---
id: 50
type: issue
title: "MCP APIの使用状況を分析して未使用APIを特定する"
description: "多数のMCP APIが定義されているが、実際に使用されているものはどれか？未使用のAPIを特定して整理の必要性を検討。"
status: Completed
priority: MEDIUM
aiSummary: "Analysis of MCP API usage to identify and clean up unused APIs, resulting in significant codebase reduction and maintenance cost savings"
tags: ["api","mcp","analysis","cleanup"]
keywords: {"api":1,"mcp":1,"usage":0.9,"unused":0.9,"analysis":0.9}
concepts: {"api management":0.9,"code optimization":0.8,"maintenance":0.8,"analysis":0.7}
related: [55]
created: 2025-08-14T01:19:00.349Z
updated: 2025-08-14T05:13:02.952Z
---

## 背景

MCPツール定義には多くのAPIが存在するが、実際の使用状況が不明。未使用のAPIがあれば、メンテナンスコストを削減するため整理すべき。

## 調査対象

tool-definitions.tsに定義されている全API

## 完了

このイシューはissue-55「未使用MCP APIの削除によるコードベース簡素化」で完全に対応されました。

### 分析結果
- 44%（11個）のAPIが完全未使用と判明
- 未使用APIは全て削除済み
- 約800-1000行のコード削減を達成

### 削除されたAPI
1. グラフ分析系（6個）
2. チェックポイント系（2個）
3. その他（3個）

詳細はissue-55を参照してください。