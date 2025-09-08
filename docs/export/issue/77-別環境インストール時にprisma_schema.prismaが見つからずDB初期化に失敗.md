---
id: 77
type: issue
title: "別環境インストール時にprisma/schema.prismaが見つからずDB初期化に失敗"
status: Completed
priority: HIGH
description: "別環境でインストールして利用する際、prisma/schema.prismaファイルが見つからないエラーが発生し、データベースの初期化ができない問題"
aiSummary: "別環境インストール時にprisma/schema.prismaが見つからずDB初期化に失敗 別環境でインストールして利用する際、prisma/schema.prismaファイルが見つからないエラーが発生し、データベースの初期化ができない問題 ## 問題の詳細\n\n別環境でパッケージをインストールして利用しようとした際、以下のエラーが発生する：\n- `prisma/schema.prisma` ファイ"
tags: ["prisma","bug","database","npm","installation","deployment"]
related: [96,98,99,76,104]
keywords: {"prisma":1,"schema":1,"postinstall":1,"npm":0.74,"package":0.74}
embedding: "h4CAgICAgIGTgZOjgICAkICAgICAgICAjYSQl4CEgIOFgICAgICAiIOAh4uAjoCAkYCAgICAgJGAgI6KgJSAiYiAgICAgICThYWElYCQgJaVgICAgICAjY+JgKKAhoCMm4CAgICAgIOIiYStgICAmJSAgICAgICKkYWNpICEgJo="
createdAt: 2025-08-22T13:32:44.000Z
updatedAt: 2025-08-22T13:32:44.000Z
---

## 問題の詳細

別環境でパッケージをインストールして利用しようとした際、以下のエラーが発生する：
- `prisma/schema.prisma` ファイルが見つからない
- データベースの初期化（マイグレーション）が実行できない

## 実装した解決策

### 1. Prismaスキーマパスの明示的指定（短期対策）
```javascript
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
execSync(`npx prisma migrate deploy --schema="${schemaPath}"`);
```

### 2. SQLite直接実行による初期化（根本解決）

新しい`init`コマンドを実装し、Prisma CLIに依存しない初期化を可能にした：

```bash
# Prisma CLI不要で初期化
shirokuma-kb init

# カスタムディレクトリ指定
shirokuma-kb init --data-dir ~/my-data

# リセットして再初期化
shirokuma-kb init --reset --seed
```

#### 実装内容

1. **better-sqlite3を使用した直接SQL実行**
   - Prismaで生成されたSQLファイルを直接実行
   - 外部CLIツールへの依存を排除

2. **マイグレーション管理**
   - `prisma/migrations`ディレクトリのSQLファイルを順番に実行
   - `_prisma_migrations`テーブルで適用済みマイグレーションを管理

3. **初期データのシード**
   - デフォルトステータスの作成
   - システム状態の初期化

## メリット

1. **依存関係の削減**
   - Prisma CLIが不要（実行時）
   - npxコマンドへの依存なし

2. **パフォーマンス向上**
   - 外部プロセス起動が不要
   - SQLite APIを直接使用

3. **エラーハンドリング改善**
   - より詳細なエラーメッセージ
   - スキーマファイル不在の明確な通知

4. **グローバルインストール対応**
   - パス解決の問題を根本的に解決
   - どこからでも実行可能

## テスト結果

- ローカル環境での初期化：✅
- カスタムディレクトリでの初期化：✅
- リセット機能：✅
- シード機能：✅
- マイグレーション適用：✅

## 互換性

- 既存の`migrate`コマンドは維持（後方互換性）
- 新規ユーザーは`init`コマンドを推奨
- 両方のコマンドで同じデータベース形式を使用