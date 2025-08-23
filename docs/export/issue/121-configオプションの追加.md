---
id: 121
type: issue
title: "configオプションの追加"
status: Open
priority: HIGH
description: "参照しているDBのフルPATHとEXPORTのディレクトリが何処になってるかなどの設定情報を表示する機能を追加"
tags: ["configuration","cli","feature"]
related: [122]
createdAt: 2025-08-22T23:29:43.000Z
updatedAt: 2025-08-23T00:15:18.000Z
---

# configオプションの追加

## 概要
現在のシステム設定情報を表示するconfigオプションを追加する。

## 要件
- 参照しているデータベースのフルパスを表示
- エクスポートディレクトリのパスを表示
- その他の重要な設定情報を表示

## 実装内容
1. CLIに`config`コマンドを追加
2. 以下の情報を表示：
   - データベースパス（実際のSQLiteファイルパス）
   - エクスポートディレクトリ（SHIROKUMA_EXPORT_DIR）
   - データディレクトリ（SHIROKUMA_DATA_DIR）
   - 現在のバージョン
   - Claude CLI状態（利用可能/不可）

## 期待される出力例
```
SHIROKUMA Configuration:
  Version: 0.9.0
  Database: /home/webapp/shirokuma-v8/.shirokuma/data/shirokuma.db
  Export Dir: docs/export
  Data Dir: .shirokuma/data
  Claude CLI: Available
  Environment: production
```

## 重要な注意事項

### 正しい環境変数名
- エクスポートディレクトリ: `SHIROKUMA_EXPORT_DIR`（EXPORT_DIRではない）
- データディレクトリ: `SHIROKUMA_DATA_DIR`

### DATABASE_URLは使用されていない
- TypeORM移行後、DATABASE_URLは不要になった
- 現在はSHIROKUMA_DATA_DIRからデータベースパスを決定
- ConfigManagerにDATABASE_URL項目が残っているが、実際には使用されていない
- data-source.tsはSHIROKUMA_DATA_DIRのみ参照

### API KEYも不要
- 現在のAI機能はClaude CLIを使用（Claude Code内部のCLI）
- ANTHROPIC_API_KEYは不要
- ConfigManagerにAPI KEY項目はあるが、実際には使用されていない