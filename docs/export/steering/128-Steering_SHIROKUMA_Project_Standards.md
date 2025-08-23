---
id: 128
type: steering
title: "Steering: SHIROKUMA Project Standards"
status: Open
priority: HIGH
description: "SHIROKUMA Knowledge Baseプロジェクトの標準規約とアーキテクチャパターン"
aiSummary: "SHIROKUMA Knowledge Base project standards document covering TypeScript architecture, coding conventions, testing practices, and development methodologies including TDD and issue-driven development."
tags: ["architecture","steering","standards","project-standards","inclusion:always"]
keywords: {"shirokuma":1,"typescript":0.9,"architecture":0.9,"knowledge":0.9,"project":0.9}
concepts: {"software-development":0.9,"architecture":0.9,"database":0.8,"standards":0.8,"testing":0.7}
embedding: "kYSAl4CLgJiAgICLgJSWmoeAgJWAlICSgICElYCUlpOAhYCKgJSAhoCAgJeAi42GgpCAgYCVgICAgISOgJKCgIyVgIGAkoCEgICNg4CIgIaUkoCAgIiAkICAkoCAgImTk5WAg4CAgIeAgI+HgIKUiZWOgI+AgYCTgICGgYCLjJY="
createdAt: 2025-08-23T01:24:43.000Z
updatedAt: 2025-08-23T12:05:53.000Z
---

# SHIROKUMA Project Standards

## Version Information
- **Current Version**: v0.9.0
- **Last Updated**: 2025-08-23
- **Harmony Score**: 1.00/1.00

## 技術スタック
- **言語**: TypeScript (ES2022, strict mode)
- **ランタイム**: Node.js 18+
- **モジュール**: ESModule
- **ORM**: TypeORM (v0.3.20)
- **データベース**: SQLite
- **MCPサーバー**: @modelcontextprotocol/sdk

## コード品質
- **リンター**: ESLint + TypeScript ESLint
- **テストフレームワーク**: Vitest
- **カバレッジ目標**: 80%以上
- **型チェック**: strict mode必須

## アーキテクチャパターン
- **サービス層**: ビジネスロジックの分離
- **リポジトリパターン**: TypeORMによるデータアクセス
- **エラーハンドリング**: McpError使用
- **ロギング**: 構造化ログ（console.log禁止）

## 命名規則
- **ファイル**: kebab-case必須
- **クラス**: PascalCase
- **関数**: camelCase
- **定数**: UPPER_SNAKE_CASE
- **型**: PascalCase

## ディレクトリ構造
```
src/
├── cli/         # CLIコマンド
├── mcp/         # MCPサーバー
├── services/    # ビジネスロジック
├── entities/    # TypeORMエンティティ
├── repositories/ # データアクセス層
└── utils/       # ユーティリティ

.shirokuma/
├── commands/    # カスタムコマンド定義
│   ├── kuma/    # kumaコマンド群
│   └── shared/  # 共有リソース
├── data-prod/   # 本番データベース
└── data-dev/    # 開発データベース

.claude/
├── agents/      # エージェント定義
├── commands/    # コマンドシンボリックリンク
└── output-styles/ # 出力スタイル定義
```

## コマンド体系
- **基本形式**: `/kuma:*` に統一
- **サブコマンド**: `/kuma:spec:*`, `/kuma:vibe:*`
- **定義場所**: `.shirokuma/commands/kuma/`
- **言語ルール**: `.shirokuma/commands/shared/lang.markdown`参照

## 開発原則
1. **イシュー駆動開発**: コード変更前に必ずイシュー作成
2. **TDD**: テスト → 実装 → リファクタリング
3. **型安全性**: any禁止、明示的な型定義
4. **モジュール化**: 単一責任の原則
5. **仕様駆動開発**: 要件→設計→タスクの3フェーズ管理

## v0.9.0での主要変更
- コマンド体系の統一（/kuma:*）
- 言語ルールの集約化
- ディレクトリ構造の整理
- TypeScriptコードの完全除去（コマンド/エージェント定義）
- ハーモニースコア1.00達成