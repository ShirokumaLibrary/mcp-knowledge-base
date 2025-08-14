---
id: 56
type: issue
title: "MCPアイテムのエクスポート機能と環境変数管理の実装完了"
status: Completed
priority: MEDIUM
tags: ["configuration","cli","feature","environment","export"]
keywords: {"mcp":1,"export":0.9,"environment":0.8,"variable":0.8,"management":0.8}
concepts: {"data_management":0.9,"configuration":0.8,"cli_tools":0.8,"security":0.7,"file_system":0.7}
embedding: "j4CAkImAgICAgICTg4+NgIeAgIqBgICAgICFl46QkYCOgICRgYCAgICAgJSWlY6AhYCAkImAgICAgIaOlJqRgICAgIiSgICAgICSkZemjICCgICBk4CAgICAmZeRoYOAi4CAgYuAgICAgJWWh5eAgJGAgIiCgICAgICIjYCShIA="
related: [47,46,57,58,62]
searchIndex: "mcp export environment variable management database config item cli command markdown json file template security"
created: 2025-08-14T02:22:01.815Z
updated: 2025-08-14T03:04:37.267Z
---

# MCPアイテムのエクスポート機能と環境変数管理の実装完了

## Description

MCPデータベース内のアイテムをエクスポートする機能と、環境変数の設定方法を改善する

## Content

## 要件（修正版）
1. **MCPアイテムのエクスポート機能** - データベース内のアイテムを外部ファイル（JSON/Markdown等）にエクスポート ✅
2. **環境変数の管理方法を改善** - 設定の一元管理 ✅

## 実装完了

### 1. ConfigManager（環境変数管理）✅
- 環境変数の一元管理
- .envファイルのテンプレート生成
- 設定のエクスポート/インポート機能
- CLIコマンドでの環境変数管理
- セキュリティ: ファイル権限600、APIキーマスク

### 2. ExportManager（MCPアイテムエクスポート）✅
- SHIROKUMA_EXPORT_DIRで指定されたディレクトリに出力
- TYPEごとにサブディレクトリを作成
- ファイル名: `{ID}-{TITLE}.md`（TITLE は30文字制限、特殊文字を_に変換）
- Markdown形式でメタデータ、タグ、関連アイテムを含む完全なエクスポート

## CLIコマンド

### 環境変数管理
```bash
shirokuma-kb config init       # 初期化
shirokuma-kb config show       # 設定表示
shirokuma-kb config export     # 設定エクスポート
shirokuma-kb config import     # 設定インポート
shirokuma-kb config env        # 環境切り替え
shirokuma-kb config validate   # 検証
```

### MCPアイテムエクスポート
```bash
shirokuma-kb export [id]           # 単一または複数アイテムのエクスポート
shirokuma-kb export preview        # エクスポート対象のプレビュー
shirokuma-kb export stats          # エクスポート統計表示
```

オプション:
- `-t, --type <type>` - タイプでフィルタ
- `-s, --status <status...>` - ステータスでフィルタ
- `--tags <tags...>` - タグでフィルタ
- `-l, --limit <number>` - 件数制限
- `-d, --dir <directory>` - エクスポート先ディレクトリ指定

## テスト結果
- ConfigManager: 単体14個、統合7個全パス
- ExportManager: 実動作確認済み（統計表示、単一/複数エクスポート）

## エクスポート例
```
/home/webapp/shirokuma-v8/docs/export/
├── issue/
│   ├── 56-MCP.md
│   ├── 55-_MCP_API.md
│   └── 50-MCP_API_API.md
├── decision/
│   └── 57-_.md
└── handover/
    └── 58-ConfigManager_.md
```

## AI Summary

Implementation of MCP item export functionality and environment variable management system with CLI commands, security features, and comprehensive testing

## Keywords (Detailed)

- mcp (weight: 1.00)
- export (weight: 0.90)
- environment (weight: 0.80)
- variable (weight: 0.80)
- management (weight: 0.80)
- cli (weight: 0.70)
- database (weight: 0.70)
- item (weight: 0.70)
- config (weight: 0.70)
- json (weight: 0.60)

## Concepts

- data_management (confidence: 0.90)
- configuration (confidence: 0.80)
- cli_tools (confidence: 0.80)
- security (confidence: 0.70)
- file_system (confidence: 0.70)
- testing (confidence: 0.60)

---
*Exported from SHIROKUMA Knowledge Base*
