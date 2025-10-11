---
id: 186
type: spec
title: "Spec: shirokuma-kb統合セットアップ機能"
status: Open
priority: MEDIUM
description: "パッケージ配布とプレースホルダベースの環境セットアップ機能の完全仕様"
tags: ["feature","spec","setup","packaging"]
related: [184]
keywords: {"shirokuma":1,"setup":1,"mcp":0.9,"integration":0.9,"package":0.9}
concepts: {"development environment setup":0.95,"configuration management":0.9,"package management":0.9,"automation":0.85,"template system":0.85}
createdAt: 2025-10-09T08:00:34.000Z
updatedAt: 2025-10-09T08:00:34.000Z
---

# [Spec] shirokuma-kb統合セットアップ機能

**Created**: 2025-10-09  
**Status**: Open  
**Priority**: MEDIUM  
**Phase**: Complete (Requirements + Design + Tasks)  
**Related Issues**: #184

---

## Phase 1: Requirements

### 導入

**背景:**
現在、コマンドやエージェント定義内で使用されているMCPツール名（`mcp__shirokuma-kb__*`）は、ユーザーの`.mcp.json`設定によって変わってしまう問題があります。この不整合により、配布されたコマンド/エージェント定義が正しく動作しない可能性があります。

**目的:**
`.shirokuma/agents`、`.shirokuma/commands`、`.mcp.json`、`.env`を含めた統合セットアップ機能を提供し、ユーザーが簡単に環境構築できるようにします。

### ユーザーストーリー

**As a** shirokuma-kbパッケージのユーザー  
**I want** 1つのコマンドで開発環境をセットアップできる  
**So that** プロジェクトですぐにAI駆動開発を始められる

**As a** shirokuma-kb開発者  
**I want** プレースホルダを使ってコマンド/エージェント定義を管理できる  
**So that** 環境に依存しない汎用的なファイルをGit管理できる

### EARS形式機能要件

**REQ-1: 基本セットアップ**
- WHEN ユーザーが`shirokuma-kb setup`を実行する
- THEN システムは以下を実行する:
  - `.shirokuma/agents/`と`.shirokuma/commands/`をプロジェクトにコピー（プレースホルダ版）
  - `.env`ファイルをテンプレートから生成
  - `.mcp.json`を作成または更新
  - `.claude/agents/`と`.claude/commands/`に置換済みファイルを生成
  - データディレクトリとエクスポートディレクトリを作成
  - データベースマイグレーションを実行

**REQ-2: プレースホルダ置換**
- WHEN システムが`.claude/`配下にファイルを生成する
- THEN `{{MCP_NAME}}`を`.mcp.json`で定義されたMCP名（デフォルト: `mcp__shirokuma-kb`）に置換する
- AND `{{WORKSPACE_FOLDER}}`をプロジェクトのルートパスに置換する

**REQ-3: 環境変数設定**
- WHEN `.env`ファイルが作成される
- THEN 以下の環境変数が設定される:
  - `SHIROKUMA_DATA_DIR=${workspaceFolder}/.shirokuma/data`
  - `SHIROKUMA_EXPORT_DIR=${workspaceFolder}/docs/export`

**REQ-4: MCP設定統合**
- WHEN `.mcp.json`が既に存在する
- THEN `shirokuma-kb`セクションを追加/更新し、他の設定は保持する
- WHEN `.mcp.json`が存在しない
- THEN テンプレートから新規作成する

**REQ-5: リビルド機能**
- WHEN ユーザーが`shirokuma-kb setup --rebuild`を実行する
- THEN `.shirokuma/`から`.claude/`を再生成する
- AND 既存の`.claude/`ファイルは上書きされる

**REQ-6: カスタムMCP名対応**
- WHEN ユーザーが`shirokuma-kb setup --mcp-name <name>`を実行する
- THEN 指定されたMCP名でプレースホルダを置換する
- AND `.mcp.json`にも指定された名前で登録する

**REQ-7: 検証機能**
- WHEN ユーザーが`shirokuma-kb verify-setup`を実行する
- THEN 以下を検証する:
  - MCP接続テスト
  - データベース接続確認
  - 環境変数の設定確認
  - マスターファイルと実行ファイルの存在確認
  - プレースホルダの置換状況確認

### 非機能要件

**NFR-1: パフォーマンス**
- セットアップコマンドは30秒以内に完了すること

**NFR-2: 互換性**
- Node.js 18以上で動作すること
- Windows、macOS、Linuxで動作すること

**NFR-3: 保守性**
- プレースホルダ形式は拡張可能であること
- テンプレートファイルは独立して管理されること

**NFR-4: エラーハンドリング**
- ファイル上書き時は確認プロンプトを表示すること
- エラー発生時は明確なメッセージを表示すること
- ロールバック機能を提供すること

### 受入基準

- [ ] `shirokuma-kb setup`で環境が正しくセットアップされる
- [ ] プレースホルダが正しく置換される
- [ ] `.env`と`.mcp.json`が適切に生成される
- [ ] `--rebuild`オプションで`.claude/`が再生成される
- [ ] `--mcp-name`オプションでカスタムMCP名が設定される
- [ ] `verify-setup`で全てのチェックが通る
- [ ] 既存ファイルがある場合、確認プロンプトが表示される

---

## Phase 2: Design

### アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│  CLI Command: shirokuma-kb setup                        │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│  SetupOrchestrator                                      │
│  - Coordinates setup process                            │
│  - Manages error handling and rollback                  │
└───┬───────────┬───────────┬──────────┬─────────────────┘
    │           │           │          │
    ▼           ▼           ▼          ▼
┌─────────┐ ┌──────────┐ ┌─────────┐ ┌────────────────┐
│Template │ │FileSystem│ │Placeholder│ │Validator      │
│Manager  │ │Manager   │ │Replacer   │ │               │
└─────────┘ └──────────┘ └─────────┘ └────────────────┘

Data Flow:
1. Package (.shirokuma/templates/) → User Project (.shirokuma/)
2. Template Processing → Placeholder Replacement
3. User Project (.shirokuma/) → Claude Code (.claude/)
4. Validation → Confirmation
```

### コンポーネント設計

#### 1. SetupOrchestrator

**目的:** セットアップ処理全体を調整し、エラーハンドリングとロールバックを管理

**主要メソッド:**
```typescript
class SetupOrchestrator {
  async execute(options: SetupOptions): Promise<SetupResult>
  async rollback(checkpoint: Checkpoint): Promise<void>
  private async createCheckpoint(): Promise<Checkpoint>
}
```

**責務:**
- セットアップフローの制御
- チェックポイント作成とロールバック
- エラー集約と報告
- 進捗表示

#### 2. TemplateManager

**目的:** テンプレートファイルの読み込みと提供

**主要メソッド:**
```typescript
class TemplateManager {
  async loadTemplate(name: string): Promise<string>
  async getTemplateList(): Promise<string[]>
  async validateTemplate(content: string): Promise<boolean>
}
```

**管理するテンプレート:**
- `.shirokuma/templates/.mcp.json` - MCP設定
- `.shirokuma/templates/.env` - 環境変数
- `.shirokuma/agents/**/*.md` - エージェント定義
- `.shirokuma/commands/**/*.md` - コマンド定義

#### 3. FileSystemManager

**目的:** ファイル操作（コピー、作成、削除）の管理

**主要メソッド:**
```typescript
class FileSystemManager {
  async copyDirectory(src: string, dest: string, options: CopyOptions): Promise<void>
  async createDirectory(path: string): Promise<void>
  async fileExists(path: string): Promise<boolean>
  async promptOverwrite(path: string): Promise<boolean>
}
```

**機能:**
- ディレクトリ再帰コピー
- 上書き確認プロンプト
- パーミッション設定
- シンボリックリンク処理

#### 4. PlaceholderReplacer

**目的:** プレースホルダの置換処理

**主要メソッド:**
```typescript
interface PlaceholderConfig {
  MCP_NAME: string;
  WORKSPACE_FOLDER: string;
}

class PlaceholderReplacer {
  replace(content: string, config: PlaceholderConfig): string
  extractPlaceholders(content: string): string[]
  validatePlaceholders(content: string): boolean
}
```

**置換ルール:**
- `{{MCP_NAME}}` → MCP設定から取得（デフォルト: `mcp__shirokuma-kb`）
- `{{WORKSPACE_FOLDER}}` → プロジェクトルートパス
- 正規表現: `/\{\{([A-Z_]+)\}\}/g`

#### 5. McpConfigManager

**目的:** `.mcp.json`の読み書きと統合

**主要メソッド:**
```typescript
class McpConfigManager {
  async load(path: string): Promise<McpConfig | null>
  async merge(existing: McpConfig, template: McpConfig): Promise<McpConfig>
  async save(config: McpConfig, path: string): Promise<void>
  getMcpName(config: McpConfig): string
}
```

**統合戦略:**
- 既存設定を保持しつつ`shirokuma-kb`セクションを追加/更新
- 環境変数も併せて設定
- JSON形式の整形保持

#### 6. Validator

**目的:** セットアップ後の検証

**主要メソッド:**
```typescript
class Validator {
  async validateSetup(projectPath: string): Promise<ValidationResult>
  async testMcpConnection(): Promise<boolean>
  async testDatabaseConnection(): Promise<boolean>
  async validatePlaceholderReplacement(filePath: string): Promise<boolean>
}
```

**検証項目:**
- MCP接続テスト（`shirokuma-kb stats`）
- データベース接続確認
- ファイル存在確認
- プレースホルダ残存チェック
- 環境変数設定確認

### データモデル

#### SetupOptions
```typescript
interface SetupOptions {
  force?: boolean;           // 上書き確認をスキップ
  rebuild?: boolean;         // .claude/のみ再生成
  mcpName?: string;          // カスタムMCP名
  dataDir?: string;          // カスタムデータディレクトリ
  exportDir?: string;        // カスタムエクスポートディレクトリ
}
```

#### SetupResult
```typescript
interface SetupResult {
  success: boolean;
  filesCreated: string[];
  filesUpdated: string[];
  errors: Error[];
  warnings: string[];
}
```

#### PlaceholderConfig
```typescript
interface PlaceholderConfig {
  MCP_NAME: string;          // e.g., "mcp__shirokuma-kb"
  WORKSPACE_FOLDER: string;  // e.g., "/home/user/project"
}
```

### エラーハンドリング戦略

#### 1. チェックポイントシステム

各主要ステップ前にチェックポイントを作成:
```typescript
interface Checkpoint {
  timestamp: Date;
  filesModified: string[];
  filesCreated: string[];
  originalContent: Map<string, string>;
}
```

#### 2. ロールバック処理

エラー発生時:
1. 最後のチェックポイントを取得
2. 作成したファイルを削除
3. 変更したファイルを元に戻す
4. ユーザーにロールバック完了を通知

#### 3. エラーカテゴリ

- **ファイルシステムエラー**: パーミッション、ディスク容量
- **設定エラー**: 不正な`.mcp.json`、環境変数
- **ネットワークエラー**: MCP接続失敗
- **検証エラー**: プレースホルダ未置換、不完全なセットアップ

### セキュリティ考慮事項

1. **パス検証**: パストラバーサル攻撃を防ぐ
2. **ファイル権限**: 適切なパーミッション設定（644/755）
3. **環境変数**: 機密情報の安全な取り扱い
4. **入力検証**: MCP名などのユーザー入力を検証

---

## Phase 3: Tasks

### Phase 1: 基盤整備（2日）

- [ ] **Task 1.1**: プロジェクト構造準備 [3h]
  - **What**: テンプレートディレクトリとファイル構造を作成
  - **Dependencies**: なし
  - **Testing**: テンプレートファイルが正しく読み込めることを確認

- [ ] **Task 1.2**: PlaceholderReplacerクラス実装 [4h]
  - **What**: プレースホルダ置換ロジックを実装
  - **Dependencies**: Task 1.1
  - **Testing**: 正規表現マッチングと置換処理の単体テスト

- [ ] **Task 1.3**: 既存ファイルのプレースホルダ化 [5h]
  - **What**: `.shirokuma/agents/`と`.shirokuma/commands/`内の全ファイルをプレースホルダ化
  - **Dependencies**: Task 1.2
  - **Testing**: 手動レビューで全MCP名がプレースホルダになっていることを確認

### Phase 2: コア機能実装（3日）

- [ ] **Task 2.1**: TemplateManagerクラス実装 [3h]
  - **What**: テンプレート管理機能を実装
  - **Dependencies**: Task 1.1
  - **Testing**: 各テンプレートが正しく読み込まれることを確認

- [ ] **Task 2.2**: FileSystemManagerクラス実装 [4h]
  - **What**: ファイルシステム操作を実装
  - **Dependencies**: なし
  - **Testing**: ファイルコピー、上書き確認の動作確認

- [ ] **Task 2.3**: McpConfigManagerクラス実装 [4h]
  - **What**: MCP設定ファイル管理を実装
  - **Dependencies**: Task 2.1
  - **Testing**: マージロジックが既存設定を保持することを確認

- [ ] **Task 2.4**: SetupOrchestratorクラス実装 [6h]
  - **What**: セットアップフロー全体の調整を実装
  - **Dependencies**: Task 2.1, 2.2, 2.3, Task 1.2
  - **Testing**: 正常系・異常系のE2Eテスト

- [ ] **Task 2.5**: CLI setup コマンド実装 [3h]
  - **What**: `shirokuma-kb setup`コマンドを実装
  - **Dependencies**: Task 2.4
  - **Testing**: 各オプションでコマンドが正しく動作することを確認

### Phase 3: 追加機能（1.5日）

- [ ] **Task 3.1**: リビルド機能実装 [3h]
  - **What**: `shirokuma-kb setup --rebuild`オプションを実装
  - **Dependencies**: Task 2.5
  - **Testing**: `.shirokuma/`の変更が`.claude/`に反映されることを確認

- [ ] **Task 3.2**: Validatorクラス実装 [4h]
  - **What**: セットアップ検証機能を実装
  - **Dependencies**: Task 2.4
  - **Testing**: 各検証項目が正しくチェックされることを確認

- [ ] **Task 3.3**: CLI verify-setup コマンド実装 [2h]
  - **What**: `shirokuma-kb verify-setup`コマンドを実装
  - **Dependencies**: Task 3.2
  - **Testing**: セットアップ後に検証が通ることを確認

### Phase 4: ドキュメントとパッケージング（1日）

- [ ] **Task 4.1**: package.json更新 [2h]
  - **What**: パッケージ設定を更新
  - **Dependencies**: Task 1.3
  - **Testing**: `npm pack`でパッケージ内容を確認

- [ ] **Task 4.2**: README更新 [3h]
  - **What**: セットアップ手順のドキュメント作成
  - **Dependencies**: Task 3.3
  - **Testing**: ドキュメントに従ってセットアップできることを確認

- [ ] **Task 4.3**: E2Eテスト作成 [3h]
  - **What**: エンドツーエンドテストを作成
  - **Dependencies**: Task 3.3
  - **Testing**: すべてのE2Eテストがpassすることを確認

### タスクサマリー

**総推定時間**: 7.5日（60時間）

**Phase別内訳**:
- Phase 1 (基盤整備): 12時間
- Phase 2 (コア機能): 20時間
- Phase 3 (追加機能): 9時間
- Phase 4 (ドキュメント): 8時間

**依存関係**:
- Phase 1 → Phase 2 → Phase 3 → Phase 4（順次実行）
- Phase 2内は一部並列実行可能

**リスク**:
- プレースホルダ化の手動作業が時間超過する可能性（Task 1.3）
- E2Eテストで予期しないエッジケース発見の可能性（Task 4.3）