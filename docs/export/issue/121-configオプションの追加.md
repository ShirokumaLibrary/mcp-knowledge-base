---
id: 121
type: issue
title: "configオプションの追加"
status: Completed
priority: HIGH
description: "参照しているDBのフルPATHとEXPORTのディレクトリが何処になってるかなどの設定情報を表示する機能を追加"
tags: ["configuration","cli","feature"]
related: [122]
createdAt: 2025-08-22T23:29:43.000Z
updatedAt: 2025-08-23T00:21:35.000Z
---

# configオプションの追加

## 概要
データベースやエクスポートディレクトリなどの設定を確認できる`config`コマンドの実装

## 要件
- データベースパス（SHIROKUMA_DATA_DIR）の表示
- エクスポートディレクトリ（SHIROKUMA_EXPORT_DIR）の表示
- 環境変数として設定可能
- NODE_ENV の表示

## 実装内容

### 1. ConfigManagerのクリーンアップ
- 不要な設定項目を削除
  - ~~SHIROKUMA_DATABASE_URL~~ (TypeORM移行により不要)
  - ~~ANTHROPIC_API_KEY~~ (Claude CLIを使用するため不要)
- バージョンを0.9.0に更新

### 2. configコマンドの実装
```bash
# 現在の設定を表示（テーブル形式）
shirokuma-kb config show

# JSON形式で表示
shirokuma-kb config show --format json

# env形式で表示
shirokuma-kb config show --format env

# 設定の検証
shirokuma-kb config validate

# .env.exampleの作成
shirokuma-kb config init
```

### 3. 表示内容の改善
- データベースの実際のパスを表示
- ファイルの存在確認（✓ exists / ! missing）
- 設定のソース表示（env / default）
- 見やすいテーブル形式

## 結果

```
⚙️  Current Configuration

┌─────────────────────────┬───────────────────────────────────────────────────────┬───────────────┐
│ Setting                 │ Value                                                 │ Status        │
├─────────────────────────┼───────────────────────────────────────────────────────┼───────────────┤
│ SHIROKUMA_DATA_DIR      │ /home/webapp/shirokuma-v8/.shirokuma/data-prod        │ default       │
├─────────────────────────┼───────────────────────────────────────────────────────┼───────────────┤
│   └─ Database Path      │ /path/to/shirokuma.db                                 │ ✓ exists      │
├─────────────────────────┼───────────────────────────────────────────────────────┼───────────────┤
│ SHIROKUMA_EXPORT_DIR    │ docs/export                                           │ default       │
├─────────────────────────┼───────────────────────────────────────────────────────┼───────────────┤
│   └─ Export Path        │ /home/webapp/shirokuma-v8/docs/export                 │ ✓ exists      │
├─────────────────────────┼───────────────────────────────────────────────────────┼───────────────┤
│ NODE_ENV                │ development                                           │ default       │
└─────────────────────────┴───────────────────────────────────────────────────────┴───────────────┘
```

## 完了
- ConfigManagerから不要な設定項目を削除
- configコマンドを実装し、データベースパスとエクスポートディレクトリを分かりやすく表示
- 環境変数の設定状況も確認可能