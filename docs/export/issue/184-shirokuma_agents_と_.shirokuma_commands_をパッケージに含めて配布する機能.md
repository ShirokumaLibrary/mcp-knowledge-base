---
id: 184
type: issue
title: ".shirokuma/agents と .shirokuma/commands をパッケージに含めて配布する機能"
status: Open
priority: MEDIUM
description: "shirokuma-kbパッケージに .shirokuma/agents と .shirokuma/commands を含めて、使用中のプロジェクト内にコピーし、.claude 内にシンボリックリンクを作成するコマンドオプションを追加する"
aiSummary: "Feature to bundle and distribute .shirokuma/agents and .shirokuma/commands in shirokuma-kb package, with CLI command to copy them to user projects and create symbolic links in .claude directory"
tags: ["feature","setup","enhancement","packaging"]
keywords: {"package":1,"command":0.9,"shirokuma":0.9,"distribution":0.9,"agent":0.9}
concepts: {"package-management":0.9,"configuration":0.8,"deployment":0.8,"automation":0.7,"tooling":0.7}
embedding: "jICIgICZgICAgKCCk5OAlYaAgYCAnICAgICkjImNgI+LgICAgJaAgICAmZSBhICEhICAgICNgICAgJqTgYCAgICAgYCAiYCAgICHlYqEgIWCgImAgI6AgICAgJGTjYCPiYCQgICXgICAgIuHlJOAh46Aj4CAoYCAgICSgJWQgJE="
createdAt: 2025-10-09T00:58:33.000Z
updatedAt: 2025-10-09T01:23:22.000Z
---

## 背景

現在、コマンドやエージェント定義内で使用されている `mcp__shirokuma-kb__*` というMCPツール名は、ユーザーの `.mcp.json` 設定によって変わってしまう問題がある。

例:
- `.mcp.json` で `shirokuma-kb` と定義 → `mcp__shirokuma-kb__*`
- `.mcp.json` で `shirokuma` と定義 → `mcp__shirokuma__*`
- `.mcp.json` で `my-kb` と定義 → `mcp__my-kb__*`

この不整合により、配布されたコマンド/エージェント定義が正しく動作しない可能性がある。

## 解決策

`.shirokuma/agents`、`.shirokuma/commands`、`.mcp.json`、`.env` を含めた統合セットアップ機能を提供する。

**ファイル配置戦略:**
- `.shirokuma/` 内: **プレースホルダを含むマスターファイル** として保持（編集可能）
- `.claude/` 内: **置換済みコピー** を配置（Claude Codeが読み込む実体）

**重要な設計変更:**
- ユーザーは **1つのMCPインスタンスのみ** を使用（PROD/DEV分離は不要）
- 環境変数で `SHIROKUMA_DATA_DIR` と `SHIROKUMA_EXPORT_DIR` を設定

## 要件

### 1. パッケージに含めるファイル

- `.shirokuma/agents/*` - 全エージェント定義（プレースホルダ版）
- `.shirokuma/commands/*` - 全コマンド定義（プレースホルダ版）
- `.shirokuma/templates/.mcp.json` - MCP設定テンプレート
- `.shirokuma/templates/.env` - 環境変数テンプレート

### 2. プレースホルダ仕様

**マスターファイル（.shirokuma/内）:**
```markdown
# Example agent definition
allowed-tools: 
  - {{MCP_NAME}}__create_item
  - {{MCP_NAME}}__get_item
  - {{MCP_NAME}}__search_items
```

**置換後（.claude/内）:**
```markdown
# Example agent definition
allowed-tools: 
  - mcp__shirokuma-kb__create_item
  - mcp__shirokuma-kb__get_item
  - mcp__shirokuma-kb__search_items
```

**標準プレースホルダ:**
- `{{MCP_NAME}}` → `mcp__shirokuma-kb` (デフォルト)
- `{{WORKSPACE_FOLDER}}` → プロジェクトのルートパス

### 3. 環境変数テンプレート

**`.env` テンプレート:**
```bash
# shirokuma-kb データディレクトリ
SHIROKUMA_DATA_DIR=${workspaceFolder}/.shirokuma/data

# エクスポートディレクトリ（オプション）
# 設定すると、イシュー作成時に自動的にMarkdownファイルをエクスポート
SHIROKUMA_EXPORT_DIR=${workspaceFolder}/docs/export
```

### 4. MCPインスタンス設定の標準化

**推奨される標準MCP設定:**
```json
{
  "mcpServers": {
    "shirokuma-kb": {
      "command": "shirokuma-kb",
      "args": ["serve"],
      "env": {
        "SHIROKUMA_DATA_DIR": "${workspaceFolder}/.shirokuma/data",
        "SHIROKUMA_EXPORT_DIR": "${workspaceFolder}/docs/export"
      }
    }
  }
}
```

### 5. セットアップコマンド機能

```bash
shirokuma-kb setup                    # 対話的セットアップ
shirokuma-kb setup --force            # 既存ファイルを上書き
shirokuma-kb setup --mcp-name <name>  # カスタムMCP名を指定
shirokuma-kb setup --rebuild          # .claudeを再生成（.shiroKumaから）
```

**処理フロー:**

1. **プロジェクト構造の確認**
   - `.shirokuma/` ディレクトリの有無
   - `.mcp.json` の有無と内容確認
   - `.env` の有無

2. **マスターファイルのコピー（.shirokuma/）**
   - `.shirokuma/agents/` → プロジェクト配下にコピー（プレースホルダのまま）
   - `.shirokuma/commands/` → プロジェクト配下にコピー（プレースホルダのまま）
   - 既存ファイルがある場合は確認プロンプト（--forceで上書き）

3. **環境変数ファイルの作成**
   - `.env` が存在しない場合、テンプレートからコピー
   - 既存の場合はスキップ（または確認プロンプト）
   - プロジェクトパスを自動設定

4. **MCP設定の統合**
   - 既存の `.mcp.json` がある場合:
     - `shirokuma-kb` セクションを追加/更新
     - 環境変数設定も追加
     - 他の設定は保持
   - `.mcp.json` がない場合:
     - テンプレートから新規作成

5. **置換済みファイルの生成（.claude/）**
   - `.shirokuma/agents/` を読み込み
   - プレースホルダを `.mcp.json` の設定に基づいて置換
   - `.claude/agents/` に出力
   - 同様に `.shirokuma/commands/` → `.claude/commands/`
   
   **重要:** シンボリックリンクではなく、**実ファイルのコピー**を配置

6. **ディレクトリ作成**
   - `.shirokuma/data/` を作成（存在しない場合）
   - `docs/export/` を作成（SHIROKUMA_EXPORT_DIRが設定されている場合）

7. **初期化とマイグレーション**
   - `shirokuma-kb migrate` を実行

### 6. ファイル更新の運用フロー

**開発者がコマンド/エージェントを編集する場合:**

1. `.shirokuma/agents/*.md` または `.shirokuma/commands/**/*.md` を編集（プレースホルダ使用）
2. `shirokuma-kb setup --rebuild` を実行
3. `.claude/` 配下が自動的に再生成される

**利点:**
- マスターファイル（.shirokuma/）は汎用的で再利用可能
- 実行ファイル（.claude/）は環境に合わせて最適化
- Git管理は `.shirokuma/` のみでOK（`.claude/` は生成物）

### 7. MCP名のカスタマイズ対応

ユーザーが異なるMCP名を使いたい場合:

```bash
shirokuma-kb setup --mcp-name my-kb
```

この場合:
- `{{MCP_NAME}}` → `mcp__my-kb`
- `.mcp.json` にも対応する名前で登録

### 8. 検証機能

セットアップ後の検証:

```bash
shirokuma-kb verify-setup
```

**チェック項目:**
- MCP接続テスト
- データベース接続確認
- 環境変数の設定確認
- マスターファイル（.shirokuma/）の存在確認
- 実行ファイル（.claude/）の存在確認
- プレースホルダの置換状況確認
- エクスポートディレクトリの存在確認

## 実装の優先順位

1. **Phase 1**: 基本セットアップ（ファイルコピー、.env作成、MCP設定、プレースホルダ置換）
2. **Phase 2**: リビルド機能（--rebuild）
3. **Phase 3**: カスタマイズ対応（カスタムMCP名）
4. **Phase 4**: 検証機能

## 技術的考慮事項

### ファイル配置

```
shirokuma-kb/
├── .shirokuma/
│   ├── agents/              # パッケージに含める（プレースホルダ版）
│   ├── commands/            # パッケージに含める（プレースホルダ版）
│   ├── data/                # デフォルトデータディレクトリ
│   └── templates/
│       ├── .mcp.json        # MCPテンプレート
│       └── .env             # 環境変数テンプレート
├── .claude/                 # Git管理外（生成物）
│   ├── agents/              # 置換済みコピー
│   └── commands/            # 置換済みコピー
├── docs/
│   └── export/              # エクスポートディレクトリ（SHIROKUMA_EXPORT_DIR）
├── .env                     # 環境変数設定（Git管理外）
└── src/
    └── cli/
        └── setup.ts         # セットアップコマンド実装
```

### .gitignore の追加

```gitignore
# Generated files from .shirokuma/
.claude/agents/
.claude/commands/

# Data directory
.shirokuma/data/

# Environment variables
.env

# Export directory (optional, project-specific)
# docs/export/
```

### package.json の調整

```json
{
  "files": [
    "dist",
    ".shirokuma/agents",
    ".shirokuma/commands",
    ".shirokuma/templates"
  ]
}
```

### プレースホルダ置換ロジック

```typescript
interface PlaceholderConfig {
  MCP_NAME: string;           // e.g., "mcp__shirokuma-kb"
  WORKSPACE_FOLDER: string;   // Project root path
}

function replacePlaceholders(content: string, config: PlaceholderConfig): string {
  return content
    .replace(/\{\{MCP_NAME\}\}/g, config.MCP_NAME)
    .replace(/\{\{WORKSPACE_FOLDER\}\}/g, config.WORKSPACE_FOLDER);
}
```

## 環境変数の詳細

### SHIROKUMA_DATA_DIR
- **目的**: データベースファイルの保存場所を指定
- **デフォルト**: `.shirokuma/data`
- **使用例**: 
  ```bash
  SHIROKUMA_DATA_DIR=.shirokuma/data-dev  # 開発環境
  SHIROKUMA_DATA_DIR=.shirokuma/data      # 本番環境
  ```

### SHIROKUMA_EXPORT_DIR
- **目的**: イシュー・仕様などを自動エクスポートする場所を指定
- **デフォルト**: 未設定（エクスポート無効）
- **設定すると**: イシュー作成時に自動的にMarkdownファイルを出力
- **使用例**:
  ```bash
  SHIROKUMA_EXPORT_DIR=docs/export        # ドキュメントとしてGit管理
  SHIROKUMA_EXPORT_DIR=/tmp/kb-export     # 一時的なエクスポート
  ```

## データディレクトリの切り替え（開発者向け）

開発者が開発環境と本番環境を分けたい場合は、環境変数で対応:

### 方法1: .env ファイル（推奨）

```bash
# .env
SHIROKUMA_DATA_DIR=.shirokuma/data
SHIROKUMA_EXPORT_DIR=docs/export
```

### 方法2: プロファイル別MCP設定（上級者向け）

```json
{
  "mcpServers": {
    "shirokuma-kb": {
      "command": "shirokuma-kb",
      "args": ["serve"],
      "env": {
        "SHIROKUMA_DATA_DIR": "${workspaceFolder}/.shirokuma/data-dev",
        "SHIROKUMA_EXPORT_DIR": "${workspaceFolder}/docs/export-dev"
      }
    }
  }
}
```

必要に応じて `.mcp.json` を手動で編集。

## 期待される効果

1. **統一された開発環境** - 全ユーザーが同じ基盤から開始
2. **簡単なセットアップ** - 1コマンドで環境構築完了
3. **シンプルな構成** - 1つのMCPインスタンスで十分
4. **自動エクスポート** - SHIROKUMA_EXPORT_DIR設定で自動的にドキュメント生成
5. **保守性の向上** - マスターファイル編集 + rebuild で即反映
6. **柔軟性** - カスタマイズが必要な場合にも対応
7. **Git管理の簡素化** - 生成物（.claude/）は管理不要

**作成日時**: 2025-10-09 09:58  
**更新日時**: 2025-10-09 11:20  
**関連**: プロジェクトセットアップの改善、MCP設定の標準化、プレースホルダ置換、環境変数設定