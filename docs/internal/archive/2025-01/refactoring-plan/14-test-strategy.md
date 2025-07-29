# テスト戦略ドキュメント

## 概要
MCP Knowledge Baseプロジェクトの包括的なテスト戦略を定義し、品質保証のためのガイドラインを提供します。

## テストピラミッド

```
        /\
       /E2E\      (5%)
      /------\
     /統合テスト\ (25%)
    /----------\
   / ユニットテスト \ (70%)
  /--------------\
```

## テストレベル別戦略

### 1. ユニットテスト（70%）

#### 対象
- 個別の関数、クラス、メソッド
- ビジネスロジック
- ユーティリティ関数
- バリデーション

#### 原則
- 高速実行（各テスト < 50ms）
- 外部依存のモック化
- 単一責任のテスト
- AAA（Arrange-Act-Assert）パターン

#### 実装例
```typescript
// src/__tests__/unit/utils/markdown-utils.test.ts
describe('MarkdownUtils', () => {
  describe('parse', () => {
    it('should parse valid markdown with metadata', () => {
      // Arrange
      const markdown = `---
title: Test Title
tags: ["test", "unit"]
priority: high
---

# Content

This is the content.`;
      
      // Act
      const result = MarkdownUtils.parse(markdown);
      
      // Assert
      expect(result.metadata).toEqual({
        title: 'Test Title',
        tags: ['test', 'unit'],
        priority: 'high',
      });
      expect(result.content).toBe('# Content\n\nThis is the content.');
    });
    
    it('should handle markdown without metadata', () => {
      // Arrange
      const markdown = '# Just Content';
      
      // Act
      const result = MarkdownUtils.parse(markdown);
      
      // Assert
      expect(result.metadata).toEqual({});
      expect(result.content).toBe('# Just Content');
    });
    
    it('should handle empty input', () => {
      expect(MarkdownUtils.parse('')).toEqual({
        metadata: {},
        content: '',
      });
    });
  });
});
```

### 2. 統合テスト（25%）

#### 対象
- 複数コンポーネントの連携
- データベース操作
- ファイルシステム操作
- サービス間の統合

#### 原則
- 実際の依存関係を使用（一部）
- トランザクションロールバック
- テストデータの分離
- 並列実行可能

#### 実装例
```typescript
// src/__tests__/integration/task-workflow.test.ts
describe('Task Workflow Integration', () => {
  let container: TestContainer;
  let dataService: IDataService;
  let db: TestDatabase;
  
  beforeEach(async () => {
    container = new TestContainer();
    dataService = container.get<IDataService>(TYPES.DataService);
    db = container.get<TestDatabase>(TYPES.DatabaseConnection);
    
    await db.initialize();
    await db.beginTransaction();
  });
  
  afterEach(async () => {
    await db.rollback();
    await db.close();
  });
  
  describe('Task Creation with Dependencies', () => {
    it('should create task with tags and sync to database', async () => {
      // Arrange
      const taskData = {
        title: 'Integration Test Task',
        content: 'Test content',
        tags: ['integration', 'test', 'automated'],
        priority: 'high' as const,
      };
      
      // Act
      const task = await dataService.createTask('issues', taskData);
      
      // Assert
      // ファイルが作成されている
      const filePath = `/database/tasks/issues/issues-${task.id}.md`;
      const fileExists = await container.getMockFileSystem().exists(filePath);
      expect(fileExists).toBe(true);
      
      // データベースに同期されている
      const dbTask = await db.getAsync(
        'SELECT * FROM search_tasks WHERE type = ? AND id = ?',
        ['issues', task.id]
      );
      expect(dbTask).toBeDefined();
      expect(dbTask.title).toBe(taskData.title);
      
      // タグが登録されている
      const tags = await db.allAsync(
        `SELECT t.name FROM tags t
         JOIN task_tags tt ON t.id = tt.tag_id
         WHERE tt.task_type = ? AND tt.task_id = ?`,
        ['issues', task.id]
      );
      expect(tags.map(t => t.name)).toEqual(
        expect.arrayContaining(taskData.tags)
      );
    });
    
    it('should handle concurrent task creation', async () => {
      // Arrange
      const promises = Array(10).fill(0).map((_, i) => 
        dataService.createTask('issues', {
          title: `Concurrent Task ${i}`,
          content: 'Test',
        })
      );
      
      // Act & Assert
      const tasks = await Promise.all(promises);
      const ids = tasks.map(t => t.id);
      
      // IDの重複がない
      expect(new Set(ids).size).toBe(ids.length);
      
      // 全てのタスクがデータベースに存在
      for (const task of tasks) {
        const exists = await db.getAsync(
          'SELECT 1 FROM search_tasks WHERE type = ? AND id = ?',
          ['issues', task.id]
        );
        expect(exists).toBeDefined();
      }
    });
  });
});
```

### 3. E2Eテスト（5%）

#### 対象
- 完全なユーザーワークフロー
- APIエンドポイント
- 実際の環境に近い条件
- クリティカルパス

#### 原則
- 本番環境に近い設定
- 実際のデータベース使用
- 外部サービスのモック
- 重要なシナリオのみ

#### 実装例
```typescript
// src/__tests__/e2e/mcp-server.test.ts
describe('MCP Server E2E', () => {
  let server: TestMCPServer;
  let testDataCleaner: TestDataCleaner;
  
  beforeAll(async () => {
    server = new TestMCPServer({
      databasePath: './test-e2e.db',
      dataPath: './test-data',
    });
    
    testDataCleaner = new TestDataCleaner(server);
    await server.start();
  });
  
  afterAll(async () => {
    await testDataCleaner.cleanup();
    await server.stop();
  });
  
  describe('Complete Issue Lifecycle', () => {
    it('should handle issue from creation to closure', async () => {
      // 1. Issue作成
      const createResponse = await server.callTool('create_item', {
        type: 'issues',
        title: 'E2E Test: Critical Bug',
        content: 'Application crashes on startup',
        priority: 'high',
        tags: ['bug', 'critical', 'e2e-test'],
      });
      
      const issue = parseResponse(createResponse).data;
      expect(issue.id).toBeDefined();
      
      // 2. ステータス更新
      await server.callTool('update_item', {
        type: 'issues',
        id: issue.id,
        status: 'In Progress',
      });
      
      // 3. 関連プラン作成
      const planResponse = await server.callTool('create_item', {
        type: 'plans',
        title: 'Fix Critical Bug',
        content: 'Emergency fix plan',
        related_tasks: [`issues-${issue.id}`],
      });
      
      const plan = parseResponse(planResponse).data;
      
      // 4. ワークセッション記録
      const sessionResponse = await server.callTool('create_session', {
        title: 'Bug Fix Session',
        content: 'Fixed the critical bug',
        related_tasks: [`issues-${issue.id}`, `plans-${plan.id}`],
      });
      
      // 5. Issue完了
      await server.callTool('update_item', {
        type: 'issues',
        id: issue.id,
        status: 'Completed',
      });
      
      // 6. 検証
      const finalIssue = parseResponse(
        await server.callTool('get_item_detail', {
          type: 'issues',
          id: issue.id,
        })
      ).data;
      
      expect(finalIssue.status).toBe('Completed');
      
      // 7. タグ検索で確認
      const searchResponse = await server.callTool('search_items_by_tag', {
        tag: 'e2e-test',
      });
      
      const searchResults = parseResponse(searchResponse).data;
      expect(searchResults.issues).toContainEqual(
        expect.objectContaining({ id: issue.id })
      );
    });
  });
});
```

## テストカテゴリ別ガイドライン

### 1. バリデーションテスト

```typescript
describe('Validation', () => {
  describe('CreateItemSchema', () => {
    it('should validate required fields', () => {
      const valid = {
        type: 'issues',
        title: 'Valid Title',
      };
      
      expect(() => CreateItemSchema.parse(valid)).not.toThrow();
    });
    
    it('should reject invalid priority', () => {
      const invalid = {
        type: 'issues',
        title: 'Test',
        priority: 'urgent', // invalid
      };
      
      expect(() => CreateItemSchema.parse(invalid)).toThrow(ZodError);
    });
  });
});
```

### 2. エラーハンドリングテスト

```typescript
describe('Error Handling', () => {
  it('should handle database connection failure', async () => {
    // Arrange
    const mockDb = {
      getAsync: jest.fn().mockRejectedValue(
        new Error('SQLITE_BUSY: database is locked')
      ),
    };
    
    const repository = new TaskRepository(mockDb);
    
    // Act & Assert
    await expect(repository.getTask('issues', 1))
      .rejects.toThrow(DatabaseConnectionError);
  });
  
  it('should retry on transient errors', async () => {
    // Arrange
    let attempts = 0;
    const mockOperation = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new DatabaseConnectionError('Connection lost');
      }
      return { id: 1, title: 'Success' };
    });
    
    // Act
    const result = await RetryHandler.withRetry(mockOperation, {
      maxAttempts: 3,
      initialDelay: 10,
    });
    
    // Assert
    expect(result.title).toBe('Success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });
});
```

### 3. パフォーマンステスト

```typescript
describe('Performance', () => {
  it('should handle large datasets efficiently', async () => {
    // Arrange
    const items = Array(1000).fill(0).map((_, i) => ({
      type: 'issues',
      title: `Performance Test ${i}`,
    }));
    
    // Act
    const start = performance.now();
    await Promise.all(items.map(item => 
      dataService.createItem(item.type, item)
    ));
    const duration = performance.now() - start;
    
    // Assert
    expect(duration).toBeLessThan(10000); // 10秒以内
    expect(duration / items.length).toBeLessThan(10); // 1件あたり10ms以内
  });
});
```

## テストデータ管理

### 1. テストフィクスチャ

```typescript
// src/__tests__/fixtures/index.ts
export class TestFixtures {
  static task(overrides?: Partial<Task>): Task {
    return {
      id: 1,
      title: 'Test Task',
      content: 'Test content',
      priority: 'medium',
      status: 'Open',
      status_id: 1,
      tags: ['test'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides,
    };
  }
  
  static createTaskDto(overrides?: Partial<CreateTaskDto>): CreateTaskDto {
    return {
      title: 'Test Task',
      content: 'Test content',
      ...overrides,
    };
  }
}
```

### 2. テストビルダー

```typescript
// src/__tests__/builders/index.ts
export class TestDataBuilder {
  private data: any = {};
  
  static aTask(): TaskBuilder {
    return new TaskBuilder();
  }
  
  static aSession(): SessionBuilder {
    return new SessionBuilder();
  }
}

export class TaskBuilder {
  private task: Partial<Task> = {
    id: 1,
    title: 'Default Title',
    priority: 'medium',
  };
  
  withHighPriority(): this {
    this.task.priority = 'high';
    return this;
  }
  
  withTags(...tags: string[]): this {
    this.task.tags = tags;
    return this;
  }
  
  build(): Task {
    return this.task as Task;
  }
}
```

## テスト実行戦略

### 1. 継続的インテグレーション

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Unit Tests
        run: npm run test:unit
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Integration Tests
        run: npm run test:integration
        
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run E2E Tests
        run: npm run test:e2e
```

### 2. ローカル開発

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk ./node_modules/.bin/jest --runInBand"
  }
}
```

## カバレッジ目標

### 全体目標
- 総合カバレッジ: 80%以上
- クリティカルパス: 95%以上

### ファイル別目標
| カテゴリ | カバレッジ目標 |
|---------|--------------|
| ハンドラー | 90% |
| リポジトリ | 85% |
| ユーティリティ | 95% |
| サービス | 80% |
| エラー処理 | 100% |

## テストのベストプラクティス

### 1. 命名規則
- `describe`: 対象のクラス/関数名
- `it`: "should" で始まる期待される動作

### 2. テストの独立性
- 各テストは独立して実行可能
- 順序依存なし
- 共有状態なし

### 3. 可読性
- AAA パターンの徹底
- 明確なアサーション
- 適切なコメント

### 4. 保守性
- DRY原則の適用
- ヘルパー関数の活用
- テストユーティリティの共通化