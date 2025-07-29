# Coding Standards

Shirokuma MCP Knowledge Baseのコーディング規約です。

## TypeScript

### 基本ルール

- **strictモード**: 常に有効
- **型定義**: 可能な限り明示的に
- **any型**: 使用禁止（やむを得ない場合は`@ai-any-deliberate`で理由を記載）
- **non-null assertion**: 避ける（必要な場合は型ガードを使用）

### 命名規則

```typescript
// インターフェース: PascalCase + Iプレフィックス
interface IRepository { }

// クラス: PascalCase
class ItemRepository { }

// 関数/メソッド: camelCase
function createItem() { }

// 定数: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// ファイル名: kebab-case
item-repository.ts
unified-handlers.ts
```

### 型定義

```typescript
// ✅ Good: 明示的な型定義
const items: Item[] = [];
function getItem(id: string): Item | null { }

// ❌ Bad: 暗黙的な型
const items = [];
function getItem(id) { }
```

### 非同期処理

```typescript
// ✅ Good: async/await
async function fetchData(): Promise<Data> {
  try {
    const result = await api.get('/data');
    return result.data;
  } catch (error) {
    logger.error('Failed to fetch data', error);
    throw error;
  }
}

// ❌ Bad: コールバック
function fetchData(callback) {
  api.get('/data', (err, result) => {
    if (err) callback(err);
    else callback(null, result.data);
  });
}
```

## コード構造

### インポート順序

```typescript
// 1. Node.js標準モジュール
import * as fs from 'fs';
import * as path from 'path';

// 2. 外部パッケージ
import { z } from 'zod';
import sqlite3 from 'sqlite3';

// 3. 内部モジュール（絶対パス）
import { Database } from '../database';
import { logger } from '../utils/logger';

// 4. 相対インポート
import { BaseRepository } from './base-repository';
import type { Item } from './types';
```

### クラス構造

```typescript
export class ItemRepository extends BaseRepository {
  // 1. 静的プロパティ
  private static readonly TABLE_NAME = 'items';
  
  // 2. インスタンスプロパティ
  private db: Database;
  
  // 3. コンストラクタ
  constructor(database: Database) {
    super();
    this.db = database;
  }
  
  // 4. パブリックメソッド
  async create(params: CreateParams): Promise<Item> {
    // 実装
  }
  
  // 5. プロテクテッドメソッド
  protected validateItem(item: unknown): Item {
    // 実装
  }
  
  // 6. プライベートメソッド
  private generateId(): string {
    // 実装
  }
}
```

## エラーハンドリング

### カスタムエラー

```typescript
// エラークラスの定義
export class NotFoundError extends Error {
  constructor(type: string, id: string) {
    super(`${type} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// 使用例
if (!item) {
  throw new NotFoundError('issue', id);
}
```

### エラー処理パターン

```typescript
// ✅ Good: 具体的なエラー処理
try {
  const result = await operation();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('Validation failed', { error });
    throw new McpError(ErrorCode.InvalidParams, error.message);
  }
  
  logger.error('Unexpected error', { error });
  throw new McpError(ErrorCode.InternalError, 'Operation failed');
}

// ❌ Bad: 汎用的なキャッチ
try {
  return await operation();
} catch (e) {
  throw e;
}
```

## セキュリティ

### 入力検証

```typescript
// ✅ Good: Zodスキーマで検証
const schema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9\-_.]+$/),
  title: z.string().min(1).max(200)
});

const validated = schema.parse(input);

// ❌ Bad: 手動検証
if (typeof input.id !== 'string') {
  throw new Error('Invalid id');
}
```

### パス処理

```typescript
// ✅ Good: パストラバーサル対策
function validatePath(input: string): string {
  if (input.includes('..') || path.isAbsolute(input)) {
    throw new Error('Invalid path');
  }
  return path.normalize(input);
}

// ❌ Bad: 無検証
const filePath = path.join(baseDir, userInput);
```

## パフォーマンス

### バッチ処理

```typescript
// ✅ Good: バッチ処理
async function processItems(items: Item[]): Promise<void> {
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await processBatch(batch);
  }
}

// ❌ Bad: 個別処理
for (const item of items) {
  await processItem(item);
}
```

### メモリ管理

```typescript
// ✅ Good: ストリーミング
import { createReadStream } from 'fs';

const stream = createReadStream(largePath);
stream.on('data', (chunk) => {
  processChunk(chunk);
});

// ❌ Bad: 全体読み込み
const content = await fs.readFile(largePath, 'utf-8');
processContent(content);
```

## テスト

### テスト構造

```typescript
describe('ItemRepository', () => {
  let repository: ItemRepository;
  let mockDb: MockDatabase;
  
  beforeEach(() => {
    mockDb = new MockDatabase();
    repository = new ItemRepository(mockDb);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('create', () => {
    it('should create a new item', async () => {
      // Arrange
      const params = { title: 'Test' };
      
      // Act
      const result = await repository.create(params);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Test');
    });
    
    it('should throw on invalid input', async () => {
      // Arrange
      const params = { title: '' };
      
      // Act & Assert
      await expect(repository.create(params))
        .rejects.toThrow('Title is required');
    });
  });
});
```

## ドキュメント

### JSDoc

```typescript
/**
 * アイテムを作成します
 * 
 * @param params - 作成パラメータ
 * @returns 作成されたアイテム
 * @throws {ValidationError} 入力が無効な場合
 * @throws {DatabaseError} データベースエラーが発生した場合
 * 
 * @example
 * ```typescript
 * const item = await repository.create({
 *   type: 'issues',
 *   title: 'バグ修正'
 * });
 * ```
 */
async function create(params: CreateParams): Promise<Item> {
  // 実装
}
```

### AIアノテーション

```typescript
/**
 * @ai-context プライマリデータアクセス層
 * @ai-pattern Repository pattern with dual storage
 * @ai-critical データ整合性を保証する必要あり
 */
export class ItemRepository {
  // 実装
}
```

## Git

### コミットメッセージ

```
<type>(<scope>): <subject>

<body>

<footer>
```

例：
```
feat(api): add bulk import functionality

- Support CSV and JSON formats
- Validate data before import
- Show progress during import

Closes #123
```

### ブランチ名

- `feature/add-bulk-import`
- `fix/memory-leak`
- `docs/update-api-reference`
- `refactor/simplify-validation`

## レビューチェックリスト

- [ ] TypeScriptのstrictモードでエラーがない
- [ ] ESLintエラーがない（警告は許容）
- [ ] すべてのパブリックAPIにJSDocがある
- [ ] テストカバレッジが80%以上
- [ ] セキュリティの考慮事項を確認
- [ ] パフォーマンスへの影響を評価
- [ ] 後方互換性を維持（破壊的変更の場合は明記）