# テストガイド

## 概要

Shirokuma MCPナレッジベースは、コードの品質と信頼性を確保するために包括的なテスト戦略を採用しています。

## テスト構造

```
tests/
├── unit/                  # ユニットテスト
│   └── src/              # ソースコードと並行した構造
├── integration/          # 統合テスト
│   ├── mcp-server.test.ts
│   └── database.test.ts
├── e2e/                  # エンドツーエンドテスト
│   ├── crud-operations.e2e.test.ts
│   ├── search-functionality.e2e.test.ts
│   └── workflow.e2e.test.ts
└── mocks/                # モックとフィクスチャ
    ├── entities.ts
    └── handlers.ts
```

## テストレベル

### 1. ユニットテスト

個々のコンポーネントを分離してテスト。

**対象:**
- リポジトリメソッド
- ユーティリティ関数
- バリデーションロジック
- エラーハンドリング

**例:**
```typescript
describe('IssueRepository', () => {
  let repository: IssueRepository;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = createMockDatabase();
    repository = new IssueRepository(mockDb);
  });

  describe('create', () => {
    it('有効なデータで新しいイシューを作成する', async () => {
      const data = {
        title: 'テストイシュー',
        content: 'テスト内容',
        priority: 'high' as const
      };

      const result = await repository.create(data);

      expect(result).toMatchObject({
        id: expect.any(Number),
        title: data.title,
        content: data.content,
        priority: data.priority
      });
    });

    it('無効なデータでエラーをスローする', async () => {
      const invalidData = { title: '' };

      await expect(repository.create(invalidData))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

### 2. 統合テスト

複数のコンポーネント間の相互作用をテスト。

**対象:**
- データベース操作
- MCPサーバー統合
- ハンドラーとリポジトリの連携

**例:**
```typescript
describe('MCPサーバー統合', () => {
  let server: TestMCPServer;
  let client: TestMCPClient;

  beforeAll(async () => {
    server = await TestMCPServer.start();
    client = await TestMCPClient.connect(server);
  });

  afterAll(async () => {
    await client.disconnect();
    await server.stop();
  });

  it('create_itemツールを通じてアイテムを作成する', async () => {
    const result = await client.callTool('create_item', {
      type: 'issues',
      title: '統合テストイシュー',
      content: 'MCPを通じて作成'
    });

    expect(result).toHaveProperty('id');
    expect(result.title).toBe('統合テストイシュー');
  });
});
```

### 3. E2Eテスト

完全なユーザーワークフローをテスト。

**対象:**
- 完全なCRUDライフサイクル
- 検索機能
- パフォーマンス
- セキュリティ

**例:**
```typescript
describe('E2E: プロジェクト管理ワークフロー', () => {
  let context: E2ETestContext;

  beforeAll(async () => {
    context = await setupE2ETest();
  });

  afterAll(async () => {
    await context.cleanup();
  });

  it('完全なプロジェクトワークフローをサポートする', async () => {
    await runScenario('プロジェクト管理', [
      {
        name: 'プロジェクトプランを作成',
        action: async () => {
          return await callTool(context.client, 'create_item', {
            type: 'plans',
            title: 'E2Eテストプロジェクト',
            content: '完全なプロジェクト管理ワークフローテスト'
          });
        },
        assertions: (result) => {
          expect(result.id).toBeDefined();
        }
      },
      // 追加のステップ...
    ]);
  });
});
```

## テスト戦略

### テスト駆動開発（TDD）

1. **Red**: 失敗するテストを書く
2. **Green**: テストを通す最小限のコードを書く
3. **Refactor**: コードを改善

### テストピラミッド

```
       /\
      /E2E\      少数の高レベルテスト
     /------\
    /統合    \    中程度の統合テスト
   /----------\
  /ユニット     \  多数の高速ユニットテスト
 /--------------\
```

### カバレッジ目標

- **ユニットテスト**: 90%以上
- **統合テスト**: 80%以上
- **E2Eテスト**: 主要ワークフロー

## モックとスタブ

### モックファクトリー

```typescript
// tests/mocks/entities.ts
export function createMockIssue(overrides?: Partial<Issue>): Issue {
  return {
    id: faker.datatype.number(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
    priority: faker.helpers.arrayElement(['high', 'medium', 'low']),
    status: 'Open',
    tags: [faker.lorem.word()],
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides
  };
}
```

### データベースモック

```typescript
export function createMockDatabase(): jest.Mocked<Database> {
  return {
    runAsync: jest.fn().mockResolvedValue({ lastID: 1, changes: 1 }),
    getAsync: jest.fn().mockResolvedValue(undefined),
    allAsync: jest.fn().mockResolvedValue([]),
    close: jest.fn(),
    // その他のメソッド...
  } as any;
}
```

## テストユーティリティ

### テストヘルパー

```typescript
// tests/helpers/database.ts
export async function withTestDatabase<T>(
  fn: (db: Database) => Promise<T>
): Promise<T> {
  const db = await createTestDatabase();
  try {
    return await fn(db);
  } finally {
    await cleanupTestDatabase(db);
  }
}
```

### カスタムマッチャー

```typescript
// tests/matchers/entity-matchers.ts
expect.extend({
  toBeValidEntity(received: any) {
    const pass = 
      received.id != null &&
      received.title != null &&
      received.created_at != null;

    return {
      pass,
      message: () => 
        pass 
          ? `expected ${received} not to be a valid entity`
          : `expected ${received} to be a valid entity`
    };
  }
});
```

## ベストプラクティス

### 1. テストの記述

- **明確なテスト名**: 何をテストしているか説明
- **AAA パターン**: Arrange, Act, Assert
- **一つのテストに一つのアサーション**（可能な限り）
- **独立したテスト**: 他のテストに依存しない

### 2. テストデータ

- **リアルなデータ**: 本番環境に近いデータを使用
- **エッジケース**: 境界値と異常値をテスト
- **データのクリーンアップ**: 各テスト後にクリーン

### 3. モッキング

- **必要最小限**: 必要なものだけモック
- **実際の動作を反映**: モックは実際の実装を模倣
- **検証可能**: モックの呼び出しを検証

### 4. パフォーマンス

- **高速なユニットテスト**: ミリ秒単位
- **並列実行**: 独立したテストは並列で
- **選択的実行**: 変更に関連するテストのみ

## テストの実行

### 全テストスイート

```bash
npm run test:all
```

### 特定のテストタイプ

```bash
# ユニットテストのみ
npm run test:unit

# 統合テストのみ
npm run test:integration

# E2Eテストのみ
npm run test:e2e
```

### ウォッチモード

```bash
npm test -- --watch
```

### カバレッジレポート

```bash
npm test -- --coverage
```

### デバッグ

```bash
# デバッグログを有効化
LOG_LEVEL=debug npm test

# 特定のテストファイル
npm test -- src/database/__tests__/issue-repository.test.ts

# 特定のテストスイート
npm test -- --testNamePattern="IssueRepository"
```

## CI/CD統合

### GitHub Actions設定

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test:all
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
```

## トラブルシューティング

### 一般的な問題

1. **テストタイムアウト**
   - タイムアウトを増やす: `jest.setTimeout(10000)`
   - 非同期操作を確認
   - モックが正しく設定されているか確認

2. **フレイキーテスト**
   - タイミング依存を削除
   - 適切なwaitを使用
   - テスト間の依存関係を削除

3. **メモリリーク**
   - リソースのクリーンアップ
   - イベントリスナーの削除
   - データベース接続のクローズ

### デバッグテクニック

1. **console.logの代わりにデバッガを使用**
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand
   ```

2. **単一テストの実行**
   ```bash
   npm test -- --testNamePattern="特定のテスト名"
   ```

3. **スナップショットの更新**
   ```bash
   npm test -- -u
   ```