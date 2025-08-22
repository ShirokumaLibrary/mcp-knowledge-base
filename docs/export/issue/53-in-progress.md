# ステータス "In Progress" が存在しないエラーの修正

## Metadata

- **ID**: 53
- **Type**: issue
- **Status ID**: 13
- **Priority**: HIGH
- **Created**: Fri Aug 22 2025 22:32:43 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:43 GMT+0900 (Japan Standard Time)

## Description

list_items APIでstatus配列を指定するとエラーが発生する問題を修正完了

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
