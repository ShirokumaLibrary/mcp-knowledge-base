---
id: 62
type: issue
title: "エクスポート機能にカレントステート（current_state）を含める"
description: "ExportManagerでMCPアイテムをエクスポートする際、システムの現在状態（current_state）も一緒にエクスポートする機能が未実装"
status: Review
priority: MEDIUM
aiSummary: "Implementation of current state export functionality in ExportManager, including system state backup, CLI commands, directory structure, security enhancements, and comprehensive testing for MCP items export system."
tags: ["feature","export","current-state","enhancement"]
keywords: {"export":1,"current":0.9,"state":0.9,"mcp":0.8,"system":0.8}
concepts: {"data_management":0.9,"system_administration":0.8,"software_architecture":0.7,"file_management":0.7,"security":0.6}
related: [56,63,64,67,85,99]
created: 2025-08-14T03:49:51.809Z
updated: 2025-08-14T04:38:22.275Z
---

## 問題

現在のExportManager実装では、通常のアイテム（issue, knowledge, decision等）はエクスポートできるが、システムの現在状態を保持する`current_state`タイプのアイテムがエクスポートされない。

## 必要性

- カレントステートは次回のAIセッション開始時に重要な情報源
- バックアップやマイグレーション時にも必要
- プロジェクトの完全な状態を保存するために不可欠

## 実装内容

### 1. ExportManagerの拡張
- `exportCurrentState()`メソッド追加 - SystemStateテーブルから最新状態を取得
- `formatSystemStateAsMarkdown()`メソッド追加 - Front Matter形式でフォーマット
- `exportItems()`に`includeState`オプション追加

### 2. CLIコマンドの拡張
- `shirokuma-kb export state` - current_stateのみエクスポート
- `shirokuma-kb export all` - 全アイテムとcurrent_stateをエクスポート
- `--include-state`オプション追加

### 3. ディレクトリ構造
- **改善版**: `.system/current_state/{id}.md`形式で保存
- `latest.md`として最新版へのコピーも作成
- 履歴管理が可能な構造に

### 4. セキュリティ強化
- パストラバーサル攻撃対策（ディレクトリパス検証）
- JSON解析エラーのログ出力
- 型安全性の向上（any型の削減）

### 5. 定数化と改善
- ファイル名の最大長を100文字に拡張
- システムディレクトリとファイル名を定数化
- エラーハンドリングの改善

## 技術的詳細

- 出力先: `SHIROKUMA_EXPORT_DIR/.system/current_state/{id}.md`
- 最新版: `SHIROKUMA_EXPORT_DIR/.system/current_state/latest.md`
- Front Matterに`metrics`、`context`、`relatedItems`、`tags`、`metadata`を含める
- 最新のSystemStateレコードのみエクスポート

## テスト

- 単体テスト実装済み（5テストケース全てパス）
- 統合テスト確認済み
- コードレビュー実施済み、指摘事項修正完了