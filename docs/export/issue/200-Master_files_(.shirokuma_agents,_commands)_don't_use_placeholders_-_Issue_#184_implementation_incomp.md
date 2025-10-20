---
id: 200
type: issue
title: "Master files (.shirokuma/agents, commands) don't use placeholders - Issue #184 implementation incomplete"
status: Completed
priority: HIGH
description: "Issue #184で定義されたプレースホルダ置換機能は実装されているが、実際のマスターファイル（.shirokuma/agents, .shirokuma/commands）にはハードコードされた `mcp__shirokuma-kb__*` が残っており、プレースホルダ `{{MCP_NAME}}` が使われていない。このため、setup commandが正しく動作しない。"
aiSummary: "Setup command lacks MCP name substitution capability. Template files copied without placeholder replacement, requiring manual editing. Needs template substitution patterns and configuration management solutions."
tags: ["mcp","configuration","setup","template"]
related: [184,201]
keywords: {"mcp":0.95,"setup":0.95,"template":0.95,"substitution":0.95,"agent":0.9}
concepts: {"configuration":0.9,"templating":0.9,"automation":0.85,"setup":0.85,"customization":0.8}
embedding: "gICChoCIm4CAgICCjaOAgICAh4+AkI2AgICEioaUgICAgICSgJKDgICAgJGAhICAgICBjYCLiICAgISQgYKAgICAiYSAgpaAgICOkYeQgICAgJCAgIChgICAk46OoYCAgICQhICGnoCAgJCGj6WAgICAioCAj56AgICGgI+kgIA="
createdAt: 2025-10-13T06:12:58.000Z
updatedAt: 2025-10-13T07:28:58.000Z
---

## 問題の詳細

Issue #184で詳細に仕様化されたプレースホルダ置換機能：
- ✅ PlaceholderEngine 実装済み（src/setup/placeholder-engine.ts）
- ✅ SetupCommand に統合済み（src/setup/setup-command.ts）
- ✅ `--mcp-name` オプション対応済み

**しかし、実際のマスターファイルはプレースホルダを使っていない：**

```bash
# 現状（問題）
grep -r "mcp__shirokuma-kb" .shirokuma/agents/ .shirokuma/commands/
# → 大量のハードコードされた参照が見つかる

# あるべき姿
grep -r "{{MCP_NAME}}" .shirokuma/agents/ .shirokuma/commands/
# → プレースホルダが使われているべき
```

## 解決内容

### 実装完了

1. **プレースホルダ置換スクリプト作成** ✅
   - `scripts/apply-placeholders.ts` を作成
   - 安全なバックアップ機能付き
   - Dry-run モード対応

2. **マスターファイルへのプレースホルダ適用** ✅
   - 7個のエージェントファイル: 89個の置換
   - 25個のコマンドファイル: 76個の置換
   - 合計: 165個の置換を実行

3. **検証完了** ✅
   - ハードコードされた参照: 0件
   - プレースホルダ配置: 84箇所
   - すべてのファイルで正しく置換

4. **動作確認** ✅
   - カスタムMCP名（`test-kb`）で動作確認
   - デフォルトMCP名（`shirokuma-kb`）で動作確認
   - プレースホルダが正しく置換されることを確認

5. **ドキュメント整備** ✅
   - README.md にTemplate Customizationセクション追加
   - CONTRIBUTING.md に完全な貢献ガイド作成
   - .shirokuma/docs/template-guide.md に包括的なガイド作成

### 技術的成果

**プレースホルダ置換スクリプト**:
- 再帰的ディレクトリ処理
- 自動バックアップ機能
- Dry-runモード
- 詳細なログ出力
- エラーハンドリング

**検証結果**:
```bash
# プレースホルダ確認
grep -r '{{MCP_NAME}}' .shirokuma/agents/ .shirokuma/commands/
# → 84箇所でプレースホルダ使用

# ハードコード確認
grep -r 'mcp__shirokuma-kb__' .shirokuma/agents/ .shirokuma/commands/
# → 0件（完全にクリーン）
```

**動作確認結果**:
```bash
# カスタム名でテスト
shirokuma-kb setup --mcp-name test-kb
grep -r 'mcp__test-kb__' .claude/agents/
# → 正しく置換されている

# デフォルト名でテスト
shirokuma-kb setup
grep -r 'mcp__shirokuma-kb__' .claude/agents/
# → 正しく置換されている
```

## 影響

### ユーザーへの影響
- ✅ カスタムMCP名が完全にサポート
- ✅ `--mcp-name` オプションが正常に機能
- ✅ テンプレートの移植性向上
- ✅ プロジェクト間でのテンプレート共有が容易

### 開発者への影響
- ✅ テンプレート開発ガイドラインの明確化
- ✅ プレースホルダ使用の標準化
- ✅ 新しいエージェント/コマンド作成が容易
- ✅ メンテナンスコストの削減

## 関連

- Issue #184: プレースホルダ仕様の定義と実装（Completed）
- Spec #201: クイック仕様書（このイシューの実装仕様）

## 完了日時

2025-10-13 16:30 JST