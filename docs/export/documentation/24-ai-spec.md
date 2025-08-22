# AI-Spec コマンドシステム 使用ガイド

## Metadata

- **ID**: 24
- **Type**: documentation
- **Status ID**: 13
- **Priority**: HIGH
- **Created**: Fri Aug 22 2025 22:32:41 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:41 GMT+0900 (Japan Standard Time)

## Description

Spec駆動開発を実現するai-specコマンドシステムの包括的な使用方法ドキュメント

## Content

# AI-Spec コマンドシステム 使用ガイド

## 概要
Spec駆動開発（SDD）を実現する包括的なコマンドセット。要件定義から設計、タスク分解まで全フェーズをサポート。

## コマンド体系

### メインコマンド
- `/ai-spec` - 完全な3フェーズSpec生成
- `/ai-spec:req` - 要件定義（EARS形式）
- `/ai-spec:design` - 設計フェーズ
- `/ai-spec:tasks` - タスク分解

### 軽量Spec
- `/ai-spec:micro` - 超軽量（<1日）
- `/ai-spec:quick` - クイック（1-3日）

### 検証・品質
- `/ai-spec:check` - 包括的チェック
- `/ai-spec:validate` - EARS形式検証
- `/ai-spec:when` - 使用判断ガイド

### プロジェクト設定
- `/ai-spec:steering` - ステアリング管理

## 使用フロー

1. **規模判断**: `/ai-spec:when "機能説明"`
2. **Spec生成**: 適切なコマンド選択
3. **検証**: `/ai-spec:check` / `validate`
4. **改善**: `/ai-spec:refine`
5. **実行**: `/ai-spec:execute`

## EARS形式
- WHEN: イベント駆動要件
- IF: 条件付き要件
- WHILE: 継続的動作
- WHERE: コンテキスト依存
- UNLESS: 例外条件

## MCP統合
全Specは自動的にtype:"spec"でshirokuma-kbに保存。検索・フィルタリング・関連付け可能。

## ベストプラクティス
- 作業量に応じた適切なSpec選択
- ステアリングドキュメントでプロジェクト標準定義
- 各フェーズ後の検証実施
- EARSフォーマットの厳密な適用
