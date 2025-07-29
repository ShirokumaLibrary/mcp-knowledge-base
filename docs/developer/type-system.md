# Type System Documentation

Shirokuma MCP Knowledge Baseの型システムと動的型管理について説明します。

## 概要

本システムは、静的なTypeScript型と動的なコンテンツタイプの両方をサポートしています。

## TypeScript型定義

### 基本型構造

```typescript
// src/types/base-types.ts

/**
 * すべてのアイテムの基底型
 */
export interface BaseItem {
  type: string;
  id: string;
  title: string;
  description?: string;
  tags: string[];
  related_tasks?: string[];
  related_documents?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * タスク型（issues, plans）
 */
export interface TaskItem extends BaseItem {
  content: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * ドキュメント型（docs, knowledge）
 */
export interface DocumentItem extends BaseItem {
  content: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
}

/**
 * セッション型
 */
export interface SessionItem extends BaseItem {
  content?: string;
  start_date: string;
  start_time: string;
  category?: string;
}

/**
 * 統合型
 */
export type Item = TaskItem | DocumentItem | SessionItem;
```

### API型定義

```typescript
// src/types/api-types.ts

export interface CreateItemParams {
  type: string;
  title: string;
  content?: string;
  description?: string;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  start_date?: string;
  end_date?: string;
  related_tasks?: string[];
  related_documents?: string[];
  // セッション用
  datetime?: string;
  id?: string;
  category?: string;
  // デイリー用
  date?: string;
}

export interface UpdateItemParams {
  title?: string;
  content?: string;
  description?: string;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  start_date?: string;
  end_date?: string;
  related_tasks?: string[];
  related_documents?: string[];
}

export interface GetItemsParams {
  type: string;
  statuses?: string[];
  includeClosedStatuses?: boolean;
  start_date?: string;
  end_date?: string;
  limit?: number;
}
```

## 動的型システム

### 型の定義

動的型は`sequences`テーブルで管理されます：

```sql
CREATE TABLE sequences (
  type TEXT PRIMARY KEY,      -- 型名（例: 'recipe'）
  current_value INTEGER,      -- 現在のID値
  base_type TEXT,            -- 基底型（'tasks' or 'documents'）
  description TEXT           -- 型の説明
);
```

### ビルトイン型

```json
{
  "tasks": {
    "issues": { "base_type": "tasks", "description": "Issue tracking" },
    "plans": { "base_type": "tasks", "description": "Project planning" }
  },
  "documents": {
    "docs": { "base_type": "documents", "description": "Documentation" },
    "knowledge": { "base_type": "documents", "description": "Knowledge base" }
  },
  "special": {
    "sessions": { "description": "Work sessions" },
    "dailies": { "description": "Daily summaries" }
  }
}
```

### カスタム型の作成

```typescript
// 新しい型を作成
await typeHandler.createType({
  name: 'recipe',
  base_type: 'documents',  // documentsを継承
  description: 'Recipe management'
});

// 使用例
await itemHandler.createItem({
  type: 'recipe',
  title: 'チョコレートケーキ',
  content: '材料: ...',
  tags: ['デザート', '簡単']
});
```

## Zodスキーマ

### 入力検証

```typescript
// src/schemas/unified-schemas.ts

export const CreateItemSchema = z.object({
  type: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().max(50000).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.string().optional(),
  // ... その他のフィールド
});

// IDの検証（セキュリティ対策）
export const IdSchema = z.string()
  .refine((val) => {
    if (val.includes('..') || val.includes('/') || val.includes('\\')) {
      return false;
    }
    return /^[a-zA-Z0-9\-_.]+$/.test(val);
  }, {
    message: "Invalid ID format"
  });
```

### 型ガード

```typescript
// タスク型かどうかを判定
export function isTaskType(type: string): boolean {
  return ['issues', 'plans'].includes(type) || 
         getBaseType(type) === 'tasks';
}

// ドキュメント型かどうかを判定
export function isDocumentType(type: string): boolean {
  return ['docs', 'knowledge'].includes(type) || 
         getBaseType(type) === 'documents';
}

// 特殊型かどうかを判定
export function isSpecialType(type: string): boolean {
  return ['sessions', 'dailies'].includes(type);
}
```

## 型の拡張性

### 継承パターン

```typescript
// 基底型の振る舞いを継承
class CustomTypeHandler extends BaseHandler {
  async create(params: CreateItemParams) {
    const baseType = await this.getBaseType(params.type);
    
    if (baseType === 'tasks') {
      // タスク型として処理
      return this.createTaskItem(params);
    } else if (baseType === 'documents') {
      // ドキュメント型として処理
      return this.createDocumentItem(params);
    }
    
    throw new Error(`Unknown base type: ${baseType}`);
  }
}
```

### 型固有の処理

```typescript
// 型ごとの特殊処理
switch (item.type) {
  case 'sessions':
    return this.formatSession(item);
  case 'dailies':
    return this.formatDaily(item);
  default:
    if (isTaskType(item.type)) {
      return this.formatTask(item);
    } else if (isDocumentType(item.type)) {
      return this.formatDocument(item);
    }
}
```

## 型の一貫性

### 命名規則

- **型名**: 小文字、複数形（issues, plans, docs）
- **ファイル名**: `{type}-{id}.md`
- **ディレクトリ**: 型名と同じ
- **カスタム型**: 意味のある名前（recipe, meeting-notes）

### 型の検証

```typescript
// 型が存在するか確認
async function validateType(type: string): Promise<void> {
  const validTypes = await getValidTypes();
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid type: ${type}`);
  }
}

// 有効な型のリストを取得
async function getValidTypes(): Promise<string[]> {
  const builtinTypes = ['issues', 'plans', 'docs', 'knowledge', 'sessions', 'dailies'];
  const customTypes = await db.all('SELECT type FROM sequences WHERE type NOT IN (?, ?, ?, ?, ?, ?)', builtinTypes);
  return [...builtinTypes, ...customTypes.map(t => t.type)];
}
```

## 型マイグレーション

### 型の変更

```typescript
// 既存のアイテムの型を変更
async function migrateItemType(
  oldType: string, 
  newType: string,
  itemId: string
): Promise<void> {
  // 1. 新しいファイルパスに移動
  const oldPath = getFilePath(oldType, itemId);
  const newPath = getFilePath(newType, itemId);
  await fs.rename(oldPath, newPath);
  
  // 2. データベースを更新
  await db.run(
    'UPDATE items SET type = ? WHERE type = ? AND id = ?',
    [newType, oldType, itemId]
  );
}
```

### 型の削除

```typescript
async function deleteType(typeName: string): Promise<void> {
  // ビルトイン型は削除不可
  if (isBuiltinType(typeName)) {
    throw new Error('Cannot delete built-in type');
  }
  
  // アイテムが存在する場合は削除不可
  const count = await db.get(
    'SELECT COUNT(*) as count FROM items WHERE type = ?',
    [typeName]
  );
  
  if (count.count > 0) {
    throw new Error('Cannot delete type with existing items');
  }
  
  // 型を削除
  await db.run('DELETE FROM sequences WHERE type = ?', [typeName]);
}
```

## ベストプラクティス

1. **型の一貫性を保つ**: 同じ基底型を持つ型は同じフィールドを持つ
2. **型ガードを使用**: 実行時の型チェックで安全性を確保
3. **スキーマ検証**: Zodスキーマですべての入力を検証
4. **適切な継承**: カスタム型は適切な基底型を選択
5. **ドキュメント化**: 新しい型の目的と使用方法を記載