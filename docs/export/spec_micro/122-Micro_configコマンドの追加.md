---
id: 122
type: spec_micro
title: "Micro: configコマンドの追加"
status: Open
priority: LOW
description: "システム設定情報を表示するconfigコマンドの実装仕様"
tags: ["configuration","cli","spec","micro"]
related: [121]
createdAt: 2025-08-22T23:30:55.000Z
updatedAt: 2025-08-22T23:54:00.000Z
---

# configコマンドの追加 - AI機能テスト更新

**Type:** Minor Feature
**Effort:** 2 hours
**Date:** 2025-08-23
**Updated:** AI機能の動作テスト中

## What
CLIに`config`コマンドを追加して、現在のシステム設定情報を表示する

## Why
- デバッグ時に設定確認が困難
- ユーザーがデータベースやエクスポート先を把握できない
- Claude CLI利用状態が不透明

## How
1. `src/cli/index.ts`に`config`コマンドを追加
2. 以下の情報を収集して表示：
   - パッケージバージョン（package.json）
   - データベースパス（AppDataSource.options）
   - エクスポートディレクトリ（環境変数/デフォルト）
   - データディレクトリ（環境変数/デフォルト）
   - **Claude CLI状態（`which claude`コマンドで確認）**
3. cli-table3を使用して整形表示

## Acceptance
`shirokuma-kb config`コマンドで以下の形式で設定が表示される：

```
SHIROKUMA Configuration
┌──────────────┬────────────────────────────────────────┐
│ Version      │ 0.9.0                                  │
│ Database     │ /home/webapp/shirokuma-v8/.shirokuma/ │
│              │ data-prod/shirokuma.db                 │
│ Export Dir   │ ./exports                              │
│ Data Dir     │ .shirokuma/data-prod                   │
│ Claude CLI   │ Available (/usr/local/bin/claude)     │
│ Environment  │ production                             │
└──────────────┴────────────────────────────────────────┘
```

## Files
- `src/cli/index.ts` - configコマンドの追加
- `src/cli/commands/config.ts` - 設定情報取得ロジック（新規作成）

## 注意事項
- ANTHROPIC_API_KEYは現在の実装では不要（Claude CLIを使用）
- Claude CLIの存在確認のみ（API KEYチェック不要）

## テスト追記
AIエンリッチメント機能のテストのため、このアイテムを更新しています。
キーワード: configuration, system, debug, TypeORM, database, export
コンセプト: システム設定、デバッグツール、CLI開発