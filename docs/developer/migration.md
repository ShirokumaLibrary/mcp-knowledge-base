# Migration Guide

Shirokuma MCP Knowledge Baseのバージョン間移行ガイドです。

## 移行の基本原則

1. **データの安全性**: 移行前に必ずバックアップを作成
2. **段階的移行**: 大規模な変更は段階的に実施
3. **ロールバック可能**: 問題発生時に元に戻せる設計
4. **自動化**: 可能な限りスクリプトで自動化

## バックアップ手順

### 完全バックアップ

```bash
# データディレクトリ全体をバックアップ
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .shirokuma/data/

# または特定のディレクトリのみ
cp -r .shirokuma/data/ .shirokuma/data.backup-$(date +%Y%m%d)
```

### データベースのみのバックアップ

```bash
# SQLiteデータベースをバックアップ
cp .shirokuma/data/search.db .shirokuma/data/search.db.backup
```

## バージョン別移行ガイド

### v0.3.x → v0.4.x

#### 主な変更点
- 統一リポジトリシステムへの移行
- TaskRepositoryとDocumentRepositoryの統合

#### 移行手順
```bash
# 1. バックアップを作成
tar -czf backup-v0.3.tar.gz .shirokuma/data/

# 2. 新バージョンをインストール
npm install

# 3. ビルド
npm run build

# 4. データベースを再構築（自動的に新形式に移行）
npm run rebuild-db
```

### v0.2.x → v0.3.x

#### 主な変更点
- セッションとデイリーサマリーが統一APIに統合
- 専用APIは非推奨に

#### 移行手順
既存のコードで専用APIを使用している場合：

```typescript
// 旧API
const sessions = await get_sessions({ limit: 10 });

// 新API
const sessions = await get_items({ type: 'sessions', limit: 10 });
```

### v0.1.x → v0.2.x

#### 主な変更点
- データベーススキーマの統一（Single Table Inheritance）
- ID型の変更（INTEGER → TEXT）

#### 移行手順
```bash
# 自動移行スクリプトを実行
npm run migrate:v0.2.0
```

### v0.0.x → v0.1.x

#### 主な変更点
- TypeScript strictモードの有効化
- any型の大幅削減

#### 移行手順
コードの変更は不要。ただし、カスタム拡張を作成している場合は型エラーを修正する必要があります。

## データ形式の移行

### YAMLからJSONへの移行（v0.0.6）

```bash
# 移行スクリプトを実行
npm run migrate:tags-to-json
```

移行前（YAML）:
```yaml
---
title: サンプルイシュー
tags:
  - bug
  - high-priority
---
```

移行後（JSON）:
```markdown
---json
{
  "title": "サンプルイシュー",
  "tags": ["bug", "high-priority"]
}
---
```

### ファイル名の複数形化（v0.0.8）

```bash
# 移行スクリプトを実行
npm run migrate:plural
```

変更内容：
- `issue-1.md` → `issues-1.md`
- `plan-1.md` → `plans-1.md`
- `doc-1.md` → `docs-1.md`

## スキーマ移行

### ステータスIDから名前への移行（v0.0.5）

移行前：
```json
{
  "status_id": 1
}
```

移行後：
```json
{
  "status": "Open"
}
```

自動移行：
```bash
npm run rebuild-db
```

### フィールド名の統一（v0.0.2）

- `description` → `content`（Issues, Plans）
- すべてのエンティティで`content`フィールドを使用

## カスタムタイプの移行

### 新しい型システムへの移行

旧システムでカスタムフィールドを使用していた場合：

```typescript
// 1. カスタムタイプを作成
await create_type({
  name: 'custom_issue',
  base_type: 'tasks',
  description: 'カスタムイシュー管理'
});

// 2. データを移行
const oldItems = await getOldCustomItems();
for (const item of oldItems) {
  await create_item({
    type: 'custom_issue',
    ...item
  });
}
```

## トラブルシューティング

### 移行失敗時の対処

#### 症状：データベースエラー

```bash
# データベースを削除して再構築
rm .shirokuma/data/search.db
npm run rebuild-db
```

#### 症状：ファイルが見つからない

```bash
# ファイル名を確認
ls -la .shirokuma/data/*/

# 必要に応じて手動でリネーム
mv .shirokuma/data/issue/issue-1.md .shirokuma/data/issues/issues-1.md
```

#### 症状：型エラー

```typescript
// 型定義を更新
import { Item } from './types/base-types';

// 新しい型に合わせてコードを修正
```

## 移行スクリプトの作成

### 基本テンプレート

```typescript
// src/migrations/migrate-to-vX.X.X.ts

import { Database } from '../database';
import * as fs from 'fs/promises';
import * as path from 'path';

async function migrate() {
  console.log('Starting migration to vX.X.X...');
  
  try {
    // 1. バックアップを作成
    await createBackup();
    
    // 2. データを読み込み
    const items = await loadItems();
    
    // 3. 変換処理
    const migrated = items.map(transformItem);
    
    // 4. 新形式で保存
    await saveItems(migrated);
    
    // 5. データベースを更新
    await updateDatabase();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    await rollback();
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}
```

## ベストプラクティス

### 1. 段階的な非推奨化

```typescript
/**
 * @deprecated Since v0.4.0. Use `get_items` instead.
 * Will be removed in v1.0.0.
 */
export async function get_issues(params: any) {
  console.warn('get_issues is deprecated. Use get_items instead.');
  return get_items({ ...params, type: 'issues' });
}
```

### 2. 移行の自動テスト

```typescript
describe('Migration v0.4.0', () => {
  test('should migrate task repository data', async () => {
    // 旧形式のデータを作成
    const oldData = createOldFormatData();
    
    // 移行を実行
    await runMigration();
    
    // 新形式で読み込めることを確認
    const newData = await loadNewFormat();
    expect(newData).toBeDefined();
  });
});
```

### 3. ロールバック機能

```typescript
async function rollback() {
  console.log('Rolling back migration...');
  
  // バックアップから復元
  await fs.rename(
    '.shirokuma/data.backup',
    '.shirokuma/data'
  );
  
  console.log('Rollback completed.');
}
```

## 移行チェックリスト

移行前：
- [ ] 現在のバージョンを確認
- [ ] CHANGELOGで変更内容を確認
- [ ] 完全バックアップを作成
- [ ] テスト環境で移行を検証

移行中：
- [ ] 移行スクリプトを実行
- [ ] エラーメッセージを確認
- [ ] データの整合性を確認

移行後：
- [ ] すべての機能が動作することを確認
- [ ] パフォーマンスの低下がないか確認
- [ ] 必要に応じてインデックスを再構築
- [ ] バックアップを安全な場所に保管