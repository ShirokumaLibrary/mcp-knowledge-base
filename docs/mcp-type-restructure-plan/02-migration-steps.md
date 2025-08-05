# MCP Type System 移行手順詳細

## 前提条件

- 現在の9タイプ構成から2タイプ構成（items + sessions）への移行
- 既存データの完全性を保証
- ダウンタイムを最小限に抑える

## Step 1: データ分析とマッピング

### 1.1 現状データの統計取得
```sql
-- 各タイプのアイテム数を確認
SELECT type, COUNT(*) as count 
FROM sequences 
GROUP BY type;

-- タグの使用状況を確認
SELECT name, COUNT(*) as usage_count 
FROM tags 
ORDER BY usage_count DESC;
```

### 1.2 タイプ→タグマッピング表
```yaml
issues → #task + 既存タグ
plans → #task #plan + 既存タグ
docs → #doc + 既存タグ
knowledge → #knowledge + 既存タグ
decisions → #decision + 既存タグ
features → #doc #feature + 既存タグ
state → #doc #state + 既存タグ
test_results → #test-result + 既存タグ

# sessionsとdailiesは特別扱い
sessions → sessions（変更なし）
dailies → sessions または items + #daily（要検討）
```

## Step 2: 移行スクリプトの作成

### 2.1 バックアップスクリプト
```javascript
// backup-mcp-data.js
import { FileIssueDatabase } from './dist/database.js';

async function backupAllData() {
  const db = new FileIssueDatabase('.database');
  await db.initialize();
  
  // 全タイプのデータをエクスポート
  const types = await db.getTypes();
  const backup = {};
  
  for (const type of types) {
    const items = await db.getItems({ type: type.name });
    backup[type.name] = items;
  }
  
  // JSONファイルとして保存
  fs.writeFileSync(
    `backup-${new Date().toISOString()}.json`,
    JSON.stringify(backup, null, 2)
  );
}
```

### 2.2 データ変換スクリプト
```javascript
// migrate-to-items.js
async function migrateToItems(db, oldType, primaryTag) {
  const items = await db.getItems({ type: oldType });
  
  for (const item of items) {
    // 新しいタグを追加
    const newTags = [primaryTag, ...item.tags];
    
    // itemsタイプとして再作成
    await db.createItem({
      type: 'items',
      title: item.title,
      content: item.content,
      status: item.status,
      priority: item.priority,
      tags: newTags,
      related: item.related,
      version: item.version
    });
    
    // 古いアイテムを削除（または無効化）
    await db.archiveItem(oldType, item.id);
  }
}
```

## Step 3: システムコンポーネントの更新

### 3.1 TypeHandlersの更新
```typescript
// 新しいタイプ定義
const ALLOWED_TYPES = ['items', 'sessions'];

// タイプ検証の簡素化
validateType(type: string): boolean {
  return ALLOWED_TYPES.includes(type);
}
```

### 3.2 検索ロジックの更新
```typescript
// タグベースの検索を強化
async searchItems(params: {
  type?: string;
  tags?: string[];
  status?: string;
  priority?: string;
}) {
  let query = 'SELECT * FROM items WHERE 1=1';
  
  if (params.tags?.length) {
    // タグでフィルタリング
    query += ' AND id IN (SELECT item_id FROM item_tags WHERE tag_name IN (?))';
  }
  // ...
}
```

## Step 4: エージェント更新

### 4.1 プロンプト更新テンプレート
```markdown
## MCPタイプ使用ルール（新版）

使用可能なタイプ：
- items: すべての通常アイテム
- sessions: AIセッション記録（作成は制限）

必須タグ（Primary Category - 1つ選択）：
- #task: やるべきこと
- #doc: 文書・ガイド
- #knowledge: 再利用可能な知見
- #decision: 技術決定
- #handover: 引き継ぎ
- #test-result: テスト結果

例：
await create_item({
  type: 'items',
  title: 'Fix authentication bug',
  tags: ['#task', '#bug', 'auth'],
  status: 'Open',
  priority: 'high'
});
```

### 4.2 各エージェントの更新対象
```yaml
更新が必要なエージェント:
- shirokuma-programmer
- shirokuma-tester
- shirokuma-reviewer
- shirokuma-designer
- shirokuma-researcher
- shirokuma-issue-manager
- shirokuma-knowledge-curator
- shirokuma-session-automator
- shirokuma-mcp-specialist
```

## Step 5: 段階的移行

### 5.1 テスト環境での検証
```bash
# テスト環境のセットアップ
export DATABASE_ROOT=.test-migration
cp -r .database .test-migration

# 移行スクリプトの実行
node migrate-to-items.js --dry-run
node migrate-to-items.js --test-env

# 動作確認
npm test
```

### 5.2 本番移行チェックリスト
- [ ] 完全バックアップ完了
- [ ] ロールバック手順確認
- [ ] メンテナンス告知
- [ ] 移行スクリプトのテスト完了
- [ ] エージェント更新準備完了
- [ ] モニタリング体制確立

## Step 6: 移行後の確認

### 6.1 データ整合性チェック
```javascript
// verify-migration.js
async function verifyMigration() {
  // 旧タイプのアイテム数と新itemsの数を比較
  // タグの付与状況を確認
  // 関連リンクの整合性チェック
  // セッションデータの完全性確認
}
```

### 6.2 パフォーマンステスト
- 検索速度の測定
- 大量データでの動作確認
- エージェント実行時間の比較

## ロールバック計画

### 緊急時の手順
1. 新システムの停止
2. バックアップからの復元
3. 旧システムの再起動
4. データ整合性の確認
5. 原因調査と対策

### ロールバックスクリプト
```bash
#!/bin/bash
# rollback-migration.sh

# 1. 現在のデータベースを退避
mv .database .database.failed

# 2. バックアップから復元
cp -r .database.backup .database

# 3. サービス再起動
npm run restart

# 4. 健全性チェック
npm run health-check
```

## 成功基準

1. **データ完全性**: 全アイテムが正しく移行
2. **機能維持**: 既存機能がすべて動作
3. **パフォーマンス**: 劣化なし
4. **エージェント動作**: 全エージェントが正常動作
5. **ユーザー影響**: 最小限のダウンタイム