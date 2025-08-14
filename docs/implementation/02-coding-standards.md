# TypeScript コーディング規約

## 1. 概要

本ドキュメントでは、Shirokuma MCP Knowledge Base v0.8.0の開発における TypeScript コーディング規約を定義します。一貫したコードベースを維持し、可読性と保守性を向上させることを目的とします。

## 2. 基本原則

### 2.1 型安全性の重視

```typescript
// ✅ 良い例: 明示的な型定義
interface UserData {
  id: number;
  name: string;
  email?: string;
}

function processUser(user: UserData): Promise<string> {
  return Promise.resolve(`Processing ${user.name}`);
}

// ❌ 悪い例: any型の使用
function processData(data: any): any {
  return data.something;
}
```

### 2.2 明示的な戻り値型

```typescript
// ✅ 良い例: 戻り値型を明示
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ 非同期関数も明示
async function fetchUserData(id: number): Promise<UserData | null> {
  const response = await fetch(`/api/users/${id}`);
  return response.ok ? response.json() : null;
}

// ❌ 悪い例: 型推論に依存
function processItems(items) {
  return items.map(item => item.name);
}
```

## 3. ファイル命名規則

### 3.1 ファイル名

| ファイル種類 | 命名規則 | 例 |
|------------|---------|-----|
| TypeScriptファイル | kebab-case.ts | `user-service.ts` |
| テストファイル | kebab-case.test.ts | `user-service.test.ts` |
| 型定義ファイル | kebab-case.types.ts | `api-response.types.ts` |
| インデックスファイル | index.ts | `index.ts` |
| 設定ファイル | kebab-case.config.ts | `database.config.ts` |

### 3.2 ディレクトリ名

```
src/
├── domain/           # ドメインロジック
│   ├── entities/     # エンティティ
│   └── value-objects/ # 値オブジェクト
├── infrastructure/   # 技術的実装
│   ├── repositories/ # リポジトリ実装
│   └── database/     # DB関連
├── services/         # アプリケーションサービス
├── mcp/             # MCPサーバー実装
├── cli/             # CLIコマンド
└── utils/           # ユーティリティ
```

## 4. インポート・エクスポート規則

### 4.1 インポート順序

```typescript
// 1. Node.js built-in modules
import { readFile } from 'fs/promises';
import path from 'path';

// 2. Third-party libraries
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// 3. Internal modules (絶対パス)
import { ItemRepository } from '../infrastructure/repositories/item-repository.js';
import { Priority } from '../domain/value-objects/priority.js';

// 4. Relative imports
import './styles.css';
```

### 4.2 エクスポート規則

```typescript
// ✅ 良い例: 名前付きエクスポート
export class UserService {
  // implementation
}

export interface UserConfig {
  // definition
}

// ✅ デフォルトエクスポートは最後に
export default UserService;

// ❌ 悪い例: 混在したエクスポート
export default class UserService {
  // implementation
}
export const config = {};
```

## 5. 関数・メソッド規約

### 5.1 関数命名

```typescript
// ✅ 良い例: 動詞 + 名詞の組み合わせ
function getUserById(id: number): Promise<User | null> {}
function validateEmail(email: string): boolean {}
function createNewItem(data: CreateItemData): Item {}

// ✅ Boolean値を返す関数は is/has/can で始める
function isValidEmail(email: string): boolean {}
function hasPermission(user: User, permission: string): boolean {}
function canAccessResource(user: User, resource: Resource): boolean {}

// ❌ 悪い例: 曖昧な命名
function process(data: any): any {}
function handle(): void {}
```

### 5.2 引数の規約

```typescript
// ✅ 良い例: 3個以上の引数はオブジェクトにまとめる
interface CreateUserOptions {
  name: string;
  email: string;
  role?: string;
  isActive?: boolean;
}

function createUser(options: CreateUserOptions): User {
  // implementation
}

// ❌ 悪い例: 引数が多すぎる
function createUser(
  name: string, 
  email: string, 
  role: string, 
  isActive: boolean, 
  department: string
): User {}
```

### 5.3 戻り値の規約

```typescript
// ✅ 良い例: Result型パターン
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchUser(id: number): Promise<Result<User, string>> {
  try {
    const user = await userRepository.findById(id);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: 'Database error' };
  }
}
```

## 6. クラス設計規約

### 6.1 クラス構造

```typescript
// ✅ 良い例: 明確な責務分離
class ItemService {
  // 1. プロパティ
  private readonly repository: ItemRepository;
  private readonly validator: ItemValidator;

  // 2. コンストラクタ
  constructor(repository: ItemRepository, validator: ItemValidator) {
    this.repository = repository;
    this.validator = validator;
  }

  // 3. パブリックメソッド
  async createItem(data: CreateItemData): Promise<Item> {
    const validatedData = this.validateCreateData(data);
    return this.repository.create(validatedData);
  }

  // 4. プライベートメソッド
  private validateCreateData(data: CreateItemData): ValidatedItemData {
    return this.validator.validate(data);
  }
}
```

### 6.2 インターフェース設計

```typescript
// ✅ 良い例: 単一責務の原則
interface ItemRepository {
  findById(id: number): Promise<Item | null>;
  findByType(type: string): Promise<Item[]>;
  create(data: CreateItemData): Promise<Item>;
  update(id: number, data: UpdateItemData): Promise<Item>;
  delete(id: number): Promise<void>;
}

// ✅ 継承より合成を優先
interface ItemService {
  repository: ItemRepository;
  validator: ItemValidator;
  notifier: NotificationService;
}
```

## 7. エラーハンドリング規約

### 7.1 エラークラス設計

```typescript
// ✅ 良い例: カスタムエラークラス
class ValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class NotFoundError extends Error {
  public readonly code = 'NOT_FOUND';
  public readonly resource: string;

  constructor(resource: string, id: string | number) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}
```

### 7.2 エラーハンドリングパターン

```typescript
// ✅ 良い例: Result型を使用
async function processItem(id: number): Promise<Result<ProcessedItem, ProcessingError>> {
  try {
    const item = await itemRepository.findById(id);
    if (!item) {
      return { success: false, error: new NotFoundError('Item', id) };
    }

    const processed = await processor.process(item);
    return { success: true, data: processed };
  } catch (error) {
    return { 
      success: false, 
      error: new ProcessingError('Failed to process item', error) 
    };
  }
}
```

## 8. 型定義規約

### 8.1 型定義の分離

```typescript
// types/item.types.ts
export interface Item {
  id: number;
  type: string;
  title: string;
  description: string;
  content: string;
  status: Status;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemData {
  type: string;
  title: string;
  description: string;
  content: string;
  priority?: Priority;
}

export interface UpdateItemData {
  title?: string;
  description?: string;
  content?: string;
  priority?: Priority;
}
```

### 8.2 型ガードの実装

```typescript
// ✅ 良い例: 型ガード関数
function isItem(obj: unknown): obj is Item {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'title' in obj &&
    typeof (obj as Item).id === 'number' &&
    typeof (obj as Item).type === 'string' &&
    typeof (obj as Item).title === 'string'
  );
}

// 使用例
function processUnknownData(data: unknown): void {
  if (isItem(data)) {
    // この時点でdataはItem型として扱える
    console.log(`Processing item: ${data.title}`);
  }
}
```

## 9. 非同期処理規約

### 9.1 Promise vs async/await

```typescript
// ✅ 良い例: async/await を優先
async function fetchMultipleItems(ids: number[]): Promise<Item[]> {
  const results = await Promise.all(
    ids.map(async (id) => {
      const item = await itemRepository.findById(id);
      if (!item) {
        throw new NotFoundError('Item', id);
      }
      return item;
    })
  );
  return results;
}

// ❌ 悪い例: Promise chain
function fetchItems(ids: number[]): Promise<Item[]> {
  return Promise.all(
    ids.map(id => 
      itemRepository.findById(id)
        .then(item => {
          if (!item) {
            throw new Error(`Item ${id} not found`);
          }
          return item;
        })
    )
  );
}
```

### 9.2 エラーハンドリング

```typescript
// ✅ 良い例: 適切なエラー処理
async function safeItemOperation(id: number): Promise<Result<Item, string>> {
  try {
    const item = await itemRepository.findById(id);
    if (!item) {
      return { success: false, error: `Item ${id} not found` };
    }
    
    const processed = await processItem(item);
    return { success: true, data: processed };
  } catch (error) {
    console.error('Item operation failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

## 10. テスト関連規約

### 10.1 テストファイル構造

```typescript
// item-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemService } from '../item-service.js';
import { MockItemRepository } from '../../test-utils/mocks.js';

describe('ItemService', () => {
  let service: ItemService;
  let mockRepository: MockItemRepository;

  beforeEach(() => {
    mockRepository = new MockItemRepository();
    service = new ItemService(mockRepository);
  });

  describe('createItem', () => {
    it('should create an item successfully', async () => {
      // Given
      const createData = {
        type: 'task',
        title: 'Test Task',
        description: 'Test Description',
        content: 'Test Content'
      };

      // When
      const result = await service.createItem(createData);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Task');
        expect(mockRepository.create).toHaveBeenCalledWith(createData);
      }
    });
  });
});
```

## 11. ドキュメント規約

### 11.1 JSDoc コメント

```typescript
/**
 * User management service providing CRUD operations
 * 
 * @example
 * ```typescript
 * const service = new UserService(repository);
 * const user = await service.createUser({ name: 'John', email: 'john@example.com' });
 * ```
 */
class UserService {
  /**
   * Creates a new user with the provided data
   * 
   * @param data - User creation data
   * @returns Promise resolving to the created user
   * @throws {ValidationError} When user data is invalid
   * @throws {ConflictError} When user already exists
   */
  async createUser(data: CreateUserData): Promise<User> {
    // implementation
  }
}
```

## 12. パフォーマンス規約

### 12.1 型定義の最適化

```typescript
// ✅ 良い例: 必要な部分のみを型定義
type UserBasicInfo = Pick<User, 'id' | 'name' | 'email'>;
type UserUpdateFields = Partial<Pick<User, 'name' | 'email' | 'role'>>;

// ✅ ユニオン型の最適化
type Status = 'pending' | 'completed' | 'failed';
type Priority = 'low' | 'medium' | 'high' | 'critical';

// ❌ 悪い例: 過度に複雑な型
type ComplexType = {
  [K in keyof User]: User[K] extends string 
    ? `prefix_${User[K]}` 
    : User[K] extends number 
    ? `num_${User[K]}` 
    : User[K];
};
```

## 13. セキュリティ規約

### 13.1 入力値検証

```typescript
import { z } from 'zod';

// ✅ 良い例: Zodスキーマを使用した検証
const CreateItemSchema = z.object({
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  content: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

function validateCreateItemData(data: unknown): CreateItemData {
  return CreateItemSchema.parse(data);
}
```

### 13.2 SQLインジェクション対策

```typescript
// ✅ 良い例: Prismaを使用（自動的にエスケープされる）
async function findItemsByTitle(title: string): Promise<Item[]> {
  return prisma.item.findMany({
    where: {
      title: {
        contains: title // 自動的にエスケープされる
      }
    }
  });
}

// ❌ 悪い例: 生のSQL（使用しない）
async function unsafeFindItems(title: string): Promise<Item[]> {
  // SQLインジェクションの脆弱性
  const query = `SELECT * FROM items WHERE title LIKE '%${title}%'`;
  return db.raw(query);
}
```

## 14. ツール設定

### 14.1 ESLint ルール詳細

```json
{
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/strict-boolean-expressions": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### 14.2 Prettier 設定詳細

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.md",
      "options": {
        "printWidth": 80,
        "proseWrap": "always"
      }
    }
  ]
}
```

## 15. 継続的改善

### 15.1 コードレビューチェックリスト

- [ ] 型安全性が確保されているか
- [ ] 適切な命名規則が使用されているか
- [ ] エラーハンドリングが実装されているか
- [ ] テストが十分にカバーされているか
- [ ] パフォーマンスへの配慮があるか
- [ ] セキュリティ上の問題がないか
- [ ] ドキュメントが適切に記述されているか

### 15.2 品質メトリクス

```bash
# 型チェック
npm run type-check

# リンターチェック
npm run lint

# テストカバレッジ
npm run test:coverage

# 循環依存チェック
npx madge --circular --extensions ts src/
```

## 16. 次のステップ

コーディング規約を理解したら、次は[テストガイド](./03-testing-guide.md)を確認して、品質の高いテストコードを作成する方法を学んでください。