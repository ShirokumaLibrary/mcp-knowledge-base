---
id: 78
type: issue
title: "PrismaからTypeORMへの移行（v0.9.0）"
status: Open
priority: HIGH
description: "CLIツールのグローバル配布を考慮し、PrismaからTypeORMへ移行する。これによりグローバルインストール時の問題を根本的に解決し、より柔軟な設定管理を実現する。"
aiSummary: "Migration plan from Prisma to TypeORM for v0.9.0 to solve global CLI distribution issues and improve configuration flexibility. Includes phased implementation, risk mitigation, and timeline for complete transition."
tags: ["architecture","refactoring","typeorm","v0.9.0","migration"]
related: [96,97,105,107,108,109,111,114,115,116,117]
keywords: {"prisma":1,"typeorm":1,"migration":0.9,"orm":0.9,"cli":0.8}
concepts: {"database migration":0.9,"software architecture":0.8,"development tools":0.8,"system refactoring":0.8,"project management":0.7}
embedding: "n4CTgICAgICAgICBjY6AiZiAkYCBgICAgICAhYaNgIKYgIiAiICAgICAgICAg4CAk4CPgI6AgICAgICAgYWAhYqAhoCNgICAgICAhoeQgIyhgICAh4CAgICAgIuNlICHtYCCgIGAgICAgICMjp+AjbSAjICFgICAgICAh46cgI4="
createdAt: 2025-08-22T13:32:44.000Z
updatedAt: 2025-08-22T13:32:44.000Z
---

## 背景

現在のPrisma実装では以下の課題がある：
1. グローバルインストール時のスキーマファイルパス解決が複雑
2. Prisma CLIへの実行時依存
3. `prisma generate`が必要で配布が複雑

TypeORMは最初からCLIツールとしての利用を考慮した設計になっており、これらの問題を解決できる。

## 移行計画

### フェーズ1: TypeORM環境構築
- [ ] TypeORMと関連パッケージのインストール
- [ ] SQLite用のTypeORM設定
- [ ] データソース設定の作成

### フェーズ2: エンティティ定義
- [ ] Prismaスキーマから TypeORMエンティティへの変換
  - Item エンティティ
  - Status エンティティ
  - Tag エンティティ
  - Keyword エンティティ
  - Concept エンティティ
  - SystemState エンティティ
  - リレーション定義

### フェーズ3: マイグレーション移行
- [ ] 既存のPrismaマイグレーションをTypeORMマイグレーションに変換
- [ ] 初期マイグレーションの作成
- [ ] シード機能の実装

### フェーズ4: サービス層の更新
- [ ] Prisma ClientからTypeORM Repositoryへの置き換え
- [ ] CRUD操作の更新
- [ ] 検索機能の更新
- [ ] AI統合部分の調整

### フェーズ5: CLIコマンドの更新
- [ ] initコマンドの簡素化
- [ ] migrateコマンドの更新
- [ ] グローバルインストール対応の改善

### フェーズ6: テストと検証
- [ ] 単体テストの更新
- [ ] 統合テストの実施
- [ ] パフォーマンス比較
- [ ] 後方互換性の確認

## 期待される改善点

1. **グローバルインストール対応**
   - 設定を動的に解決可能
   - スキーマファイルの場所に依存しない

2. **配布の簡素化**
   - TypeORM CLIが不要（エンティティをコードに埋め込み）
   - generateステップが不要

3. **柔軟な設定管理**
   - 実行時にデータベースパスを決定
   - 環境に応じた設定の切り替えが容易

4. **開発体験の向上**
   - Active Recordパターンも選択可能
   - より直感的なクエリビルダー

## リスクと対策

### リスク
- 既存データとの互換性
- 学習コスト
- 一時的な機能停止

### 対策
- 段階的な移行（v0.8.xで並行稼働）
- 既存データのマイグレーションツール作成
- 詳細なドキュメント作成

## バージョニング

- v0.8.x: Prisma版（現行、メンテナンスモード）
- v0.9.0: TypeORM版（新規開発）
- v1.0.0: TypeORM版（安定版）

## タイムライン

- フェーズ1-2: 1日
- フェーズ3-4: 2日
- フェーズ5-6: 1日
- 合計: 約4日の作業

## 成功基準

- [ ] グローバルインストールで問題なく動作
- [ ] 既存機能がすべて動作
- [ ] パフォーマンスが同等以上
- [ ] 設定がより簡潔になる