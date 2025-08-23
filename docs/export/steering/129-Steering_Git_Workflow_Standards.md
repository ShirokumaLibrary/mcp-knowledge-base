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
updatedAt: 2025-08-23T01:32:29.000Z
---

# Git Workflow Standards

## ブランチ戦略
- **main**: 本番リリース
- **v0.9.0**: TypeORM移行作業ブランチ
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
- **typeorm**: TypeORM移行関連
- **ai**: AI機能関連
- **commands**: カスタムコマンド関連

## コミット規則
1. **アトミックコミット**: 1コミット1機能
2. **明確なメッセージ**: 変更内容を具体的に記述
3. **イシュー参照**: 関連イシュー番号を含める
4. **AI署名禁止**: Claude署名を含めない
5. **日本語禁止**: コミットメッセージは英語

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