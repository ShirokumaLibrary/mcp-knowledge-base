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
updatedAt: 2025-08-23T01:32:09.000Z
---

# SHIROKUMA Project Standards

## 技術スタック
- **言語**: TypeScript (ES2022, strict mode)
- **ランタイム**: Node.js 18+
- **モジュール**: ESModule
- **ORM**: TypeORM (v0.9.0移行中)
- **データベース**: SQLite
- **MCPサーバー**: @modelcontextprotocol/sdk

## コード品質
- **リンター**: ESLint + TypeScript ESLint
- **テストフレームワーク**: Vitest
- **カバレッジ目標**: 80%以上
- **型チェック**: strict mode必須

## アーキテクチャパターン
- **サービス層**: ビジネスロジックの分離
- **リポジトリパターン**: データアクセス層の抽象化
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
```

## 開発原則
1. **イシュー駆動開発**: コード変更前に必ずイシュー作成
2. **TDD**: テスト → 実装 → リファクタリング
3. **型安全性**: any禁止、明示的な型定義
4. **モジュール化**: 単一責任の原則