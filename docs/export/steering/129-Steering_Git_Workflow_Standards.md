---
id: 129
type: steering
title: "Steering: Git Workflow Standards"
status: Open
priority: HIGH
description: "SHIROKUMA Knowledge Baseのgit運用ルールとコミット規約"
aiSummary: "Git workflow standards and commit conventions for SHIROKUMA Knowledge Base project management"
tags: ["workflow","commit","steering","git","inclusion:always"]
keywords: {"git":1,"workflow":1,"commit":0.9,"shirokuma":0.8,"standard":0.8}
concepts: {"version-control":0.9,"software-development":0.8,"project-management":0.7,"collaboration":0.7,"quality-assurance":0.6}
embedding: "gIKDgICAgICDlICAgICPpICAgICAgYCAgJCAgICAla6AhIeAgIeAgIOGgICAgJemgIuSgICMgICAgICAgICTnoCPloCAiYCAhoOAgICAjZmAjZSAgI2AgI2AgICAgJeVgI+WgICLgICPhYCAgICXi4CKjYCAhYCAio+AgICAipw="
createdAt: 2025-08-23T01:25:17.000Z
updatedAt: 2025-08-23T12:06:32.000Z
---

# Git Workflow Standards

## Version Information
- **Current Version**: v0.9.0
- **Last Updated**: 2025-08-23

## ブランチ戦略
- **main**: 本番リリース
- **v0.9.0**: 現在のリリースブランチ
- **feature/[issue-number]-[description]**: 機能開発
- **bugfix/[issue-number]-[description]**: バグ修正
- **hotfix/[critical-issue]**: 緊急修正

## コミットメッセージ規約
### フォーマット
```
type(scope): description
```

### タイプ
- **feat**: 新機能追加
- **fix**: バグ修正
- **docs**: ドキュメント変更
- **style**: コードスタイル修正
- **refactor**: リファクタリング
- **test**: テスト追加・修正
- **chore**: メンテナンス作業
- **perf**: パフォーマンス改善
- **ci**: CI/CD設定変更
- **build**: ビルド関連変更
- **revert**: コミット取り消し

### スコープ例
- **mcp**: MCPサーバー関連
- **cli**: CLIコマンド関連
- **typeorm**: TypeORMデータベース関連
- **ai**: AI機能関連
- **commands**: カスタムコマンド関連
- **agents**: エージェント関連
- **lang**: 言語設定関連

## コミット規則
1. **アトミックコミット**: 1コミット1機能
2. **明確なメッセージ**: 変更内容を具体的に記述
3. **イシュー参照**: 関連イシュー番号を含める
4. **AI署名禁止**: Claude署名を含めない
5. **言語**: コミットメッセージは英語

## 開発規約
1. **ファイル名**: 英語、kebab-case
2. **ブランチ名**: 英語、kebab-case推奨
3. **PR/Issueタイトル**: 英語で記述
4. **データベーステーブル/カラム名**: 英語、snake_case
5. **APIエンドポイント**: 英語で記述
6. **TODO/FIXMEコメント**: 英語で記述

## PRプロセス
1. **イシューベース**: 必ず関連イシューを作成
2. **テスト必須**: テストがパスすること
3. **ESLintパス**: lint:errorsがクリーン
4. **ビルド成功**: npm run buildが成功
5. **レビュー**: 最低1名のレビュー

## マージ戦略
- **Squash and merge**: 機能開発
- **Merge commit**: リリースブランチ
- **Rebase禁止**: 履歴の書き換え禁止

## v0.9.0での変更点
- TypeORMを継続使用（Prisma廃止）
- 言語ルールの明確化（英語統一）
- コマンド/エージェント関連スコープ追加