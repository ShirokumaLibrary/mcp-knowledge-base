---
id: 184
type: issue
title: ".shirokuma/agents と .shirokuma/commands をパッケージに含めて配布する機能"
status: Completed
priority: MEDIUM
description: "shirokuma-kbパッケージに .shirokuma/agents と .shirokuma/commands を含めて、使用中のプロジェクト内にコピーし、.claude 内にシンボリックリンクを作成するコマンドオプションを追加する"
aiSummary: "Feature to bundle and distribute .shirokuma/agents and .shirokuma/commands in shirokuma-kb package, with CLI command to copy them to user projects and create symbolic links in .claude directory"
tags: ["feature","setup","enhancement","packaging"]
related: [186,188,189,190,191,192,193,194,198,199,200,201]
keywords: {"package":1,"command":0.9,"shirokuma":0.9,"distribution":0.9,"agent":0.9}
concepts: {"package-management":0.9,"configuration":0.8,"deployment":0.8,"automation":0.7,"tooling":0.7}
embedding: "jICIgICZgICAgKCCk5OAlYaAgYCAnICAgICkjImNgI+LgICAgJaAgICAmZSBhICEhICAgICNgICAgJqTgYCAgICAgYCAiYCAgICHlYqEgIWCgImAgI6AgICAgJGTjYCPiYCQgICXgICAgIuHlJOAh46Aj4CAoYCAgICSgJWQgJE="
createdAt: 2025-10-09T00:58:33.000Z
updatedAt: 2025-10-13T07:28:58.000Z
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

## 実装状況（v0.9.1）

### Phase 1: 基本セットアップ ✅ COMPLETED

1. **プレースホルダエンジン** ✅
   - `src/setup/placeholder-engine.ts` 実装完了
   - `{{MCP_NAME}}` と `{{WORKSPACE_FOLDER}}` をサポート
   - 再帰的ディレクトリ処理
   - インクリメンタル更新対応

2. **セットアップコマンド** ✅
   - `src/setup/setup-command.ts` 実装完了
   - ファイルコピー機能
   - `.env` ファイル作成
   - `.mcp.json` 統合
   - プレースホルダ置換統合
   - マイグレーション実行

3. **CLI統合** ✅
   - `shirokuma-kb setup` コマンド登録
   - `--force` オプション（上書き）
   - `--mcp-name` オプション（カスタム名）
   - `--rebuild` オプション（再生成）

4. **マスターファイルへのプレースホルダ適用** ✅ (Issue #200)
   - 7個のエージェントファイルで89個の置換
   - 25個のコマンドファイルで76個の置換
   - 合計165個の置換完了
   - ハードコードされた参照: 0件

5. **ドキュメント整備** ✅
   - README.md にTemplate Customizationセクション追加
   - CONTRIBUTING.md 作成（貢献ガイドライン）
   - .shirokuma/docs/template-guide.md 作成（包括的ガイド）

### Phase 2: リビルド機能 ✅ COMPLETED

- `--rebuild` フラグ実装済み
- MCPコンフィグからMCP名を自動検出
- インクリメンタル更新（変更されたファイルのみ処理）
- 処理サマリー表示

### Phase 3: カスタマイズ対応 ✅ COMPLETED

- `--mcp-name` フラグ実装済み
- MCP名検証（フォーマット、長さ）
- カスタム名の動作確認済み（test-kb, my-kb等）

### Phase 4: 検証機能 🚧 PENDING

```bash
shirokuma-kb verify-setup
```

**チェック項目** (未実装):
- MCP接続テスト
- データベース接続確認
- 環境変数の設定確認
- マスターファイル（.shirokuma/）の存在確認
- 実行ファイル（.claude/）の存在確認
- プレースホルダの置換状況確認
- エクスポートディレクトリの存在確認

## 技術的考慮事項

### ファイル配置

```
shirokuma-kb/
├── .shirokuma/
│   ├── agents/              # パッケージに含める（プレースホルダ版）
│   ├── commands/            # パッケージに含める（プレースホルダ版）
│   ├── data/                # デフォルトデータディレクトリ
│   ├── docs/                # テンプレートガイド等
│   │   └── template-guide.md
│   └── templates/
│       ├── .mcp.json        # MCPテンプレート
│       └── .env             # 環境変数テンプレート
├── .claude/                 # Git管理外（生成物）
│   ├── agents/              # 置換済みコピー
│   └── commands/            # 置換済みコピー
├── docs/
│   └── export/              # エクスポートディレクトリ（SHIROKUMA_EXPORT_DIR）
├── .env                     # 環境変数設定（Git管理外）
├── CONTRIBUTING.md          # 貢献ガイドライン
└── src/
    ├── cli/
    │   ├── index.ts         # CLIエントリーポイント
    │   └── setup-cli.ts     # セットアップCLI
    └── setup/
        ├── setup-command.ts        # セットアップ実装
        ├── placeholder-engine.ts   # プレースホルダ置換
        ├── mcp-config-manager.ts   # MCP設定管理
        └── file-operations.ts      # ファイル操作
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

## 動作確認

### テスト1: デフォルトMCP名
```bash
shirokuma-kb setup
grep -r 'mcp__shirokuma-kb__' .claude/agents/ .claude/commands/
# → 正しく置換されている
```

### テスト2: カスタムMCP名
```bash
shirokuma-kb setup --mcp-name test-kb
grep -r 'mcp__test-kb__' .claude/agents/ .claude/commands/
# → 正しく置換されている
```

### テスト3: リビルド
```bash
# .shirokuma/ のファイルを編集後
shirokuma-kb setup --rebuild
# → .claude/ が再生成される
```

## 期待される効果（達成済み）

1. **統一された開発環境** ✅ - 全ユーザーが同じ基盤から開始
2. **簡単なセットアップ** ✅ - 1コマンドで環境構築完了
3. **シンプルな構成** ✅ - 1つのMCPインスタンスで十分
4. **自動エクスポート** ✅ - SHIROKUMA_EXPORT_DIR設定で自動的にドキュメント生成
5. **保守性の向上** ✅ - マスターファイル編集 + rebuild で即反映
6. **柔軟性** ✅ - カスタマイズが必要な場合にも対応
7. **Git管理の簡素化** ✅ - 生成物（.claude/）は管理不要

## 次のステップ

### v0.9.2 での追加機能候補

1. **verify-setup コマンド実装** (Phase 4)
   - MCP接続テスト
   - 環境検証
   - 問題診断

2. **追加プレースホルダ**
   - `{{PROJECT_NAME}}` - ユーザーのプロジェクト名
   - `{{DATA_DIR}}` - データディレクトリパス
   - `{{EXPORT_DIR}}` - エクスポートディレクトリパス

3. **テンプレートバリデーション**
   - プレースホルダの構文チェック
   - MCP tool名の検証
   - 必須フィールドの確認

## 完了日時

- **Phase 1-3**: 2025-10-13 16:30 JST
- **Phase 4**: 未実装（v0.9.2以降）

## 関連

- Issue #200: マスターファイルへのプレースホルダ適用（Completed）
- Spec #201: クイック仕様書（Issue #200の実装仕様）

**作成日時**: 2025-10-09 09:58  
**更新日時**: 2025-10-13 16:30  
**関連**: プロジェクトセットアップの改善、MCP設定の標準化、プレースホルダ置換、環境変数設定