# テストガイド

## 1. 概要

本ドキュメントでは、Shirokuma MCP Knowledge Base v0.8.0におけるテスト戦略とVitestを使用した実装方法を説明します。品質の高いソフトウェアを確保するために、包括的なテスト戦略を採用します。

## 2. テスト戦略

### 2.1 テストピラミッド

```
        /\
       /E2E\     <- 少数（統合テスト）
      /______\
     /        \
    /Integration\ <- 中程度（統合テスト）
   /__________\
  /            \
 /    Unit      \ <- 多数（単体テスト）
/________________\
```

| テスト種類 | 割合 | 目的 | 実行速度 |
|-----------|------|------|----------|
| Unit Tests | 70% | 個別関数/クラスの動作検証 | 高速 |
| Integration Tests | 20% | コンポーネント間の連携検証 | 中速 |
| E2E Tests | 10% | エンドツーエンドのシナリオ検証 | 低速 |

### 2.2 テスト原則

1. **FIRST原則**
   - **Fast**: テストは高速に実行される
   - **Independent**: テスト間に依存関係がない
   - **Repeatable**: 同じ結果が再現可能
   - **Self-Validating**: パス/フェイルが明確
   - **Timely**: コード実装と同時期に作成

2. **AAA パターン**
   - **Arrange**: テストデータとモックの準備
   - **Act**: テスト対象の実行
   - **Assert**: 結果の検証

## 3. Vitest 設定

### 3.1 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.ts',
        'tests/setup.ts',
        'src/seed.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tests': resolve(__dirname, 'tests')
    }
  }
});
```

### 3.2 テストセットアップ (tests/setup.ts)

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// テスト用データベース
const TEST_DB_PATH = './data/test.db';
let prisma: PrismaClient;

beforeAll(async () => {
  // テスト用データベースの初期化
  try {
    await fs.unlink(TEST_DB_PATH);
  } catch {
    // ファイルが存在しない場合は無視
  }

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${TEST_DB_PATH}`
      }
    }
  });

  // スキーマの適用
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      status_id INTEGER NOT NULL DEFAULT 1,
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

beforeEach(async () => {
  // 各テスト前にデータをクリア
  await prisma.item.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  try {
    await fs.unlink(TEST_DB_PATH);
  } catch {
    // クリーンアップに失敗しても無視
  }
});

// グローバルなテストユーティリティ
declare global {
  var testPrisma: PrismaClient;
}

globalThis.testPrisma = prisma;
```

## 4. ユニットテスト

### 4.1 サービス層のテスト

```typescript
// tests/unit/services/item-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemService } from '@/services/item-service.js';
import { ItemRepository } from '@/infrastructure/repositories/item-repository.js';
import { ValidationError, NotFoundError } from '@/domain/errors.js';

// モックの作成
vi.mock('@/infrastructure/repositories/item-repository.js');

describe('ItemService', () => {
  let itemService: ItemService;
  let mockItemRepository: vi.Mocked<ItemRepository>;

  beforeEach(() => {
    // モックのリセット
    vi.clearAllMocks();
    
    // モックインスタンスの作成
    mockItemRepository = {
      findById: vi.fn(),
      findByType: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as vi.Mocked<ItemRepository>;

    itemService = new ItemService(mockItemRepository);
  });

  describe('createItem', () => {
    it('should create an item successfully', async () => {
      // Arrange
      const createData = {
        type: 'task',
        title: 'Test Task',
        description: 'Test Description',
        content: 'Test Content',
        priority: 'medium' as const
      };

      const expectedItem = {
        id: 1,
        ...createData,
        statusId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockItemRepository.create.mockResolvedValue(expectedItem);

      // Act
      const result = await itemService.createItem(createData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(expectedItem);
        expect(mockItemRepository.create).toHaveBeenCalledWith(createData);
        expect(mockItemRepository.create).toHaveBeenCalledTimes(1);
      }
    });

    it('should return error for invalid data', async () => {
      // Arrange
      const invalidData = {
        type: '',
        title: '',
        description: 'Valid description',
        content: 'Valid content'
      };

      // Act
      const result = await itemService.createItem(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('title');
      }
      expect(mockItemRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getItemById', () => {
    it('should return item when found', async () => {
      // Arrange
      const itemId = 1;
      const expectedItem = {
        id: itemId,
        type: 'task',
        title: 'Test Task',
        description: 'Test Description',
        content: 'Test Content',
        statusId: 1,
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockItemRepository.findById.mockResolvedValue(expectedItem);

      // Act
      const result = await itemService.getItemById(itemId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(expectedItem);
      }
      expect(mockItemRepository.findById).toHaveBeenCalledWith(itemId);
    });

    it('should return error when item not found', async () => {
      // Arrange
      const itemId = 999;
      mockItemRepository.findById.mockResolvedValue(null);

      // Act
      const result = await itemService.getItemById(itemId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain('999');
      }
    });
  });
});
```

### 4.2 ドメインエンティティのテスト

```typescript
// tests/unit/domain/entities/item.test.ts
import { describe, it, expect } from 'vitest';
import { Item } from '@/domain/entities/item.js';
import { Priority } from '@/domain/value-objects/priority.js';
import { ValidationError } from '@/domain/errors.js';

describe('Item Entity', () => {
  describe('constructor', () => {
    it('should create item with valid data', () => {
      // Arrange
      const itemData = {
        id: 1,
        type: 'task',
        title: 'Test Task',
        description: 'Test Description',
        content: 'Test Content',
        statusId: 1,
        priority: Priority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const item = new Item(itemData);

      // Assert
      expect(item.id).toBe(1);
      expect(item.title).toBe('Test Task');
      expect(item.priority).toBe(Priority.MEDIUM);
    });

    it('should throw error for invalid title', () => {
      // Arrange
      const itemData = {
        id: 1,
        type: 'task',
        title: '', // 無効なタイトル
        description: 'Test Description',
        content: 'Test Content',
        statusId: 1,
        priority: Priority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act & Assert
      expect(() => new Item(itemData)).toThrow(ValidationError);
    });
  });

  describe('updateTitle', () => {
    it('should update title successfully', () => {
      // Arrange
      const item = createValidItem();
      const newTitle = 'Updated Title';

      // Act
      item.updateTitle(newTitle);

      // Assert
      expect(item.title).toBe(newTitle);
      expect(item.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for empty title', () => {
      // Arrange
      const item = createValidItem();

      // Act & Assert
      expect(() => item.updateTitle('')).toThrow(ValidationError);
    });
  });
});

// テストヘルパー関数
function createValidItem(): Item {
  return new Item({
    id: 1,
    type: 'task',
    title: 'Test Task',
    description: 'Test Description',
    content: 'Test Content',
    statusId: 1,
    priority: Priority.MEDIUM,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
```

## 5. 統合テスト

### 5.1 リポジトリ統合テスト

```typescript
// tests/integration/repositories/item-repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ItemRepository } from '@/infrastructure/repositories/item-repository.js';
import { Priority } from '@/domain/value-objects/priority.js';

describe('ItemRepository Integration', () => {
  let repository: ItemRepository;

  beforeEach(async () => {
    repository = new ItemRepository(globalThis.testPrisma);
  });

  describe('create', () => {
    it('should create and return item', async () => {
      // Arrange
      const createData = {
        type: 'task',
        title: 'Integration Test Task',
        description: 'Integration Test Description',
        content: 'Integration Test Content',
        priority: Priority.HIGH
      };

      // Act
      const createdItem = await repository.create(createData);

      // Assert
      expect(createdItem.id).toBeGreaterThan(0);
      expect(createdItem.type).toBe(createData.type);
      expect(createdItem.title).toBe(createData.title);
      expect(createdItem.priority).toBe(createData.priority);
      expect(createdItem.createdAt).toBeInstanceOf(Date);
      expect(createdItem.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('should find existing item', async () => {
      // Arrange
      const createData = {
        type: 'task',
        title: 'Find Test Task',
        description: 'Find Test Description',
        content: 'Find Test Content',
        priority: Priority.MEDIUM
      };
      const createdItem = await repository.create(createData);

      // Act
      const foundItem = await repository.findById(createdItem.id);

      // Assert
      expect(foundItem).not.toBeNull();
      expect(foundItem!.id).toBe(createdItem.id);
      expect(foundItem!.title).toBe(createData.title);
    });

    it('should return null for non-existing item', async () => {
      // Act
      const foundItem = await repository.findById(999);

      // Assert
      expect(foundItem).toBeNull();
    });
  });

  describe('findByType', () => {
    it('should find items by type', async () => {
      // Arrange
      await repository.create({
        type: 'task',
        title: 'Task 1',
        description: 'Description 1',
        content: 'Content 1',
        priority: Priority.LOW
      });
      await repository.create({
        type: 'task',
        title: 'Task 2',
        description: 'Description 2',
        content: 'Content 2',
        priority: Priority.HIGH
      });
      await repository.create({
        type: 'issue',
        title: 'Issue 1',
        description: 'Description 3',
        content: 'Content 3',
        priority: Priority.MEDIUM
      });

      // Act
      const tasks = await repository.findByType('task');

      // Assert
      expect(tasks).toHaveLength(2);
      expect(tasks[0]!.type).toBe('task');
      expect(tasks[1]!.type).toBe('task');
    });
  });
});
```

### 5.2 MCP ツール統合テスト

```typescript
// tests/integration/mcp/tools/item-tools.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ItemTools } from '@/mcp/tools/item-tools.js';
import { ItemService } from '@/services/item-service.js';
import { ItemRepository } from '@/infrastructure/repositories/item-repository.js';

describe('ItemTools Integration', () => {
  let itemTools: ItemTools;
  let itemService: ItemService;

  beforeEach(() => {
    const repository = new ItemRepository(globalThis.testPrisma);
    itemService = new ItemService(repository);
    itemTools = new ItemTools(itemService);
  });

  describe('createItem', () => {
    it('should create item via MCP tool', async () => {
      // Arrange
      const toolArgs = {
        type: 'task',
        title: 'MCP Test Task',
        description: 'MCP Test Description',
        content: 'MCP Test Content',
        priority: 'high'
      };

      // Act
      const result = await itemTools.createItem(toolArgs);

      // Assert
      expect(result.isError).toBe(false);
      expect(result.content[0]!.type).toBe('text');
      
      const response = JSON.parse(result.content[0]!.text);
      expect(response.success).toBe(true);
      expect(response.data.title).toBe('MCP Test Task');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const toolArgs = {
        type: '',
        title: '',
        description: 'Valid description',
        content: 'Valid content'
      };

      // Act
      const result = await itemTools.createItem(toolArgs);

      // Assert
      expect(result.isError).toBe(true);
      expect(result.content[0]!.type).toBe('text');
      
      const response = JSON.parse(result.content[0]!.text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('validation');
    });
  });
});
```

## 6. E2Eテスト

### 6.1 CLIコマンドのE2Eテスト

```typescript
// tests/e2e/cli/item-commands.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

describe('CLI E2E Tests', () => {
  const testDbPath = './data/e2e-test.db';

  beforeAll(async () => {
    // テスト用データベースの準備
    process.env.DATABASE_URL = `file:${testDbPath}`;
    await setupTestDatabase();
  });

  afterAll(async () => {
    // テストデータベースのクリーンアップ
    try {
      await fs.unlink(testDbPath);
    } catch {
      // ファイルが存在しない場合は無視
    }
  });

  it('should create item via CLI', async () => {
    // Arrange
    const args = [
      'node', 'dist/index.js',
      'create',
      '--type', 'task',
      '--title', 'E2E Test Task',
      '--description', 'E2E Test Description',
      '--content', 'E2E Test Content'
    ];

    // Act
    const result = await runCliCommand(args);

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('successfully created');
    expect(result.stdout).toContain('E2E Test Task');
  });

  it('should list items via CLI', async () => {
    // Arrange - 事前にアイテムを作成
    await runCliCommand([
      'node', 'dist/index.js',
      'create',
      '--type', 'task',
      '--title', 'List Test Task',
      '--description', 'List Test Description',
      '--content', 'List Test Content'
    ]);

    // Act
    const result = await runCliCommand([
      'node', 'dist/index.js',
      'list',
      '--type', 'task'
    ]);

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('List Test Task');
  });

  it('should handle invalid commands gracefully', async () => {
    // Act
    const result = await runCliCommand([
      'node', 'dist/index.js',
      'invalid-command'
    ]);

    // Assert
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('unknown command');
  });
});

// ヘルパー関数
async function runCliCommand(args: string[]): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const child = spawn(args[0]!, args.slice(1), {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout!.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr!.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code || 0,
        stdout,
        stderr
      });
    });
  });
}

async function setupTestDatabase(): Promise<void> {
  // テスト用データベースのセットアップロジック
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${testDbPath}`
      }
    }
  });

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      status_id INTEGER NOT NULL DEFAULT 1,
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$disconnect();
}
```

## 7. モッキング戦略

### 7.1 依存関係のモック

```typescript
// tests/mocks/item-repository.mock.ts
import { vi } from 'vitest';
import type { ItemRepository } from '@/infrastructure/repositories/item-repository.js';
import type { Item, CreateItemData, UpdateItemData } from '@/domain/entities/item.js';

export class MockItemRepository implements ItemRepository {
  private items: Map<number, Item> = new Map();
  private nextId = 1;

  findById = vi.fn(async (id: number): Promise<Item | null> => {
    return this.items.get(id) || null;
  });

  findByType = vi.fn(async (type: string): Promise<Item[]> => {
    return Array.from(this.items.values())
      .filter(item => item.type === type);
  });

  create = vi.fn(async (data: CreateItemData): Promise<Item> => {
    const item: Item = {
      id: this.nextId++,
      ...data,
      statusId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.items.set(item.id, item);
    return item;
  });

  update = vi.fn(async (id: number, data: UpdateItemData): Promise<Item> => {
    const existingItem = this.items.get(id);
    if (!existingItem) {
      throw new Error(`Item with id ${id} not found`);
    }

    const updatedItem: Item = {
      ...existingItem,
      ...data,
      updatedAt: new Date()
    };
    this.items.set(id, updatedItem);
    return updatedItem;
  });

  delete = vi.fn(async (id: number): Promise<void> => {
    this.items.delete(id);
  });

  // テスト用のヘルパーメソッド
  reset(): void {
    this.items.clear();
    this.nextId = 1;
    vi.clearAllMocks();
  }

  getStoredItems(): Item[] {
    return Array.from(this.items.values());
  }
}
```

### 7.2 外部サービスのモック

```typescript
// tests/mocks/external-api.mock.ts
import { vi, beforeEach } from 'vitest';

// 外部APIのモック
export const mockExternalApi = {
  searchItems: vi.fn(),
  validateData: vi.fn(),
  sendNotification: vi.fn()
};

// Fetch APIのモック
global.fetch = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  
  // デフォルトのモック実装
  (fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
    text: async () => 'OK'
  });
});
```

## 8. テストデータ管理

### 8.1 ファクトリー関数

```typescript
// tests/factories/item.factory.ts
import { faker } from '@faker-js/faker';
import type { CreateItemData, Item } from '@/domain/entities/item.js';
import { Priority } from '@/domain/value-objects/priority.js';

export class ItemFactory {
  static createItemData(overrides?: Partial<CreateItemData>): CreateItemData {
    return {
      type: faker.helpers.arrayElement(['task', 'issue', 'pattern', 'decision']),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      content: faker.lorem.paragraphs(3),
      priority: faker.helpers.enumValue(Priority),
      ...overrides
    };
  }

  static createItem(overrides?: Partial<Item>): Item {
    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      type: faker.helpers.arrayElement(['task', 'issue', 'pattern', 'decision']),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      content: faker.lorem.paragraphs(3),
      statusId: 1,
      priority: faker.helpers.enumValue(Priority),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createMultipleItems(count: number, overrides?: Partial<Item>): Item[] {
    return Array.from({ length: count }, () => this.createItem(overrides));
  }
}

// 使用例
const testItem = ItemFactory.createItem({ type: 'task', priority: Priority.HIGH });
const testItems = ItemFactory.createMultipleItems(5, { type: 'issue' });
```

### 8.2 テストフィクスチャ

```typescript
// tests/fixtures/items.fixture.ts
import type { Item } from '@/domain/entities/item.js';
import { Priority } from '@/domain/value-objects/priority.js';

export const itemFixtures = {
  basicTask: {
    id: 1,
    type: 'task',
    title: 'Basic Task',
    description: 'A basic task for testing',
    content: 'This is the content of a basic task',
    statusId: 1,
    priority: Priority.MEDIUM,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  } as Item,

  urgentIssue: {
    id: 2,
    type: 'issue',
    title: 'Urgent Issue',
    description: 'An urgent issue that needs immediate attention',
    content: 'This issue requires urgent attention and resolution',
    statusId: 1,
    priority: Priority.CRITICAL,
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z')
  } as Item,

  completedPattern: {
    id: 3,
    type: 'pattern',
    title: 'Design Pattern',
    description: 'A completed design pattern documentation',
    content: 'This pattern describes how to implement...',
    statusId: 2, // Completed status
    priority: Priority.LOW,
    createdAt: new Date('2024-01-03T00:00:00Z'),
    updatedAt: new Date('2024-01-03T00:00:00Z')
  } as Item
};
```

## 9. パフォーマンステスト

### 9.1 ベンチマークテスト

```typescript
// tests/performance/item-service.bench.ts
import { bench, describe } from 'vitest';
import { ItemService } from '@/services/item-service.js';
import { MockItemRepository } from '@tests/mocks/item-repository.mock.js';
import { ItemFactory } from '@tests/factories/item.factory.js';

describe('ItemService Performance', () => {
  const mockRepository = new MockItemRepository();
  const itemService = new ItemService(mockRepository);

  bench('create single item', async () => {
    const itemData = ItemFactory.createItemData();
    await itemService.createItem(itemData);
  });

  bench('create 100 items', async () => {
    const promises = Array.from({ length: 100 }, async () => {
      const itemData = ItemFactory.createItemData();
      return itemService.createItem(itemData);
    });
    await Promise.all(promises);
  });

  bench('find items by type', async () => {
    // 事前に1000個のアイテムを作成
    for (let i = 0; i < 1000; i++) {
      await mockRepository.create(ItemFactory.createItemData({ type: 'task' }));
    }
    
    await itemService.getItemsByType('task');
  });
});
```

## 10. テスト実行とCI/CD

### 10.1 テストスクリプト (package.json)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "vitest run tests/e2e",
    "test:performance": "vitest bench",
    "test:ci": "vitest run --coverage --reporter=junit --outputFile=./coverage/junit.xml"
  }
}
```

### 10.2 GitHub Actions 設定

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build project
      run: npm run build
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/coverage-final.json
```

## 11. テスト品質の監視

### 11.1 カバレッジ目標

```typescript
// vitest.config.ts (カバレッジ設定)
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/services/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/domain/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    }
  }
});
```

### 11.2 テスト品質チェック

```bash
# テスト品質確認コマンド
npm run test:coverage -- --reporter=text-summary
npm run test:performance
npx vitest run --reporter=verbose

# ミューテーションテスト（オプション）
npx stryker run
```

## 12. デバッグとトラブルシューティング

### 12.1 テストデバッグ設定

```typescript
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Vitest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--threads=false"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Single Test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${relativeFile}", "--threads=false"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 12.2 よくある問題と解決策

**問題**: テストが不安定（フレーキー）
```typescript
// 解決策: 適切な待機とクリーンアップ
beforeEach(async () => {
  await cleanupDatabase();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});
```

**問題**: 非同期テストのタイムアウト
```typescript
// 解決策: タイムアウトの調整
it('should handle long operation', async () => {
  // 長時間の処理をテスト
  const result = await longRunningOperation();
  expect(result).toBeDefined();
}, 30000); // 30秒のタイムアウト
```

**問題**: メモリリーク
```typescript
// 解決策: 適切なリソース管理
afterAll(async () => {
  await database.close();
  await server.close();
  // その他のリソースクリーンアップ
});
```

## 13. ベストプラクティス

### 13.1 テスト命名規則

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should throw ValidationError for invalid email', () => {});
    it('should throw ConflictError for duplicate email', () => {});
  });

  describe('when user is not authenticated', () => {
    it('should throw AuthenticationError', () => {});
  });
});
```

### 13.2 テストの独立性確保

```typescript
// ✅ 良い例: 各テストが独立
describe('ItemService', () => {
  let service: ItemService;
  let mockRepo: MockItemRepository;

  beforeEach(() => {
    mockRepo = new MockItemRepository();
    service = new ItemService(mockRepo);
  });

  it('test 1', () => {
    // テスト1の実装
  });

  it('test 2', () => {
    // テスト2の実装（テスト1に依存しない）
  });
});
```

### 13.3 可読性の高いアサーション

```typescript
// ✅ 良い例: 意図が明確なアサーション
expect(result.success).toBe(true);
expect(result.data).toMatchObject({
  type: 'task',
  title: 'Test Task'
});
expect(mockRepository.create).toHaveBeenCalledWith(
  expect.objectContaining({
    type: 'task',
    title: 'Test Task'
  })
);

// ❌ 悪い例: 曖昧なアサーション
expect(result).toBeTruthy();
expect(mockRepository.create).toHaveBeenCalled();
```

## 14. 次のステップ

テストガイドを理解したら、次は[デプロイメントガイド](./04-deployment-guide.md)を確認して、アプリケーションのデプロイメント方法を学んでください。