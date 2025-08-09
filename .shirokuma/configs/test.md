# SHIROKUMA Knowledge Base - Test Configuration

## Testing Framework

### Test Stack
- **Framework**: Jest v29.7.0
- **TypeScript Support**: ts-jest
- **Coverage Tool**: Jest built-in coverage
- **Assertion Library**: Jest matchers
- **Mocking**: Jest mocks

### Test Commands
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:e2e           # End-to-end tests
npm run test:coverage      # Generate coverage report
```

## Test Structure

### Directory Organization
```
src/
├── __tests__/              # Unit tests (17 files)
│   ├── handlers/          # Handler tests
│   ├── services/          # Service tests
│   ├── utils/             # Utility tests
│   └── database/          # Database tests
tests/
├── integration/           # Integration tests (11 files)
│   ├── api/              # API integration tests
│   ├── database/         # Database integration tests
│   └── storage/          # Storage integration tests
└── e2e/                   # End-to-end tests
    ├── scenarios/        # Test scenarios
    └── custom-runner.ts  # E2E test runner
```

### Test File Naming
- Unit tests: `*.test.ts` (colocated with source)
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

## Testing Patterns

### Standard Test Structure

```typescript
// Standard test structure
describe('ItemService', () => {
  let service: ItemService;
  let db: Database;
  
  beforeEach(async () => {
    db = await createTestDatabase();
    service = new ItemService(db);
  });
  
  afterEach(async () => {
    await db.close();
  });
  
  describe('getItems', () => {
    it('should return items of specified type', async () => {
      // Arrange
      await createTestItem(db, { type: 'issues' });
      
      // Act
      const result = await service.getItems({ type: 'issues' });
      
      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('issues');
    });
  });
});
```

### AAA Pattern
All tests follow the Arrange-Act-Assert pattern:
1. **Arrange**: Set up test data and conditions
2. **Act**: Execute the function being tested
3. **Assert**: Verify the results

## Mock Patterns

### Database Mock

```typescript
// Database mock for testing
export function createMockDatabase(): MockDatabase {
  const data = new Map<string, any>();
  
  return {
    async get(query: string, params: any[]): Promise<any> {
      // Mock implementation
    },
    async all(query: string, params: any[]): Promise<any[]> {
      // Mock implementation
    },
    async run(query: string, params: any[]): Promise<void> {
      // Mock implementation
    }
  };
}
```

### Service Mock

```typescript
// Service mock pattern
jest.mock('../services/item-service');

const mockItemService = {
  getItems: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  createItem: jest.fn().mockResolvedValue({ id: 'test-id' }),
  updateItem: jest.fn().mockResolvedValue({ success: true }),
  deleteItem: jest.fn().mockResolvedValue({ success: true })
};
```

### MCP Handler Mock

```typescript
// MCP handler mock
export function createMockMCPRequest(params: any): MCPRequest {
  return {
    method: 'tools/call',
    params: {
      name: 'test_tool',
      arguments: params
    }
  };
}
```

## Test Data Factories

### Item Factory

```typescript
export function createTestItem(overrides?: Partial<Item>): Item {
  return {
    id: 'test-' + Date.now(),
    type: 'issues',
    title: 'Test Item',
    content: 'Test content',
    status: 'Open',
    priority: 'medium',
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}
```

### Bulk Data Generation

```typescript
export function generateTestItems(count: number, type: string): Item[] {
  return Array.from({ length: count }, (_, i) => 
    createTestItem({
      id: `${type}-${i}`,
      type,
      title: `${type} Item ${i}`
    })
  );
}
```

## Integration Testing

### Database Integration

```typescript
describe('Database Integration', () => {
  let db: Database;
  
  beforeAll(async () => {
    db = await createTestDatabase({ 
      inMemory: true,
      seed: true 
    });
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  it('should handle concurrent operations', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      db.run('INSERT INTO items VALUES (?)', [i])
    );
    
    await expect(Promise.all(operations)).resolves.not.toThrow();
  });
});
```

### API Integration

```typescript
describe('MCP API Integration', () => {
  let server: MCPServer;
  
  beforeAll(async () => {
    server = await startTestServer();
  });
  
  afterAll(async () => {
    await server.close();
  });
  
  it('should handle tool calls', async () => {
    const response = await server.handleRequest({
      method: 'tools/call',
      params: {
        name: 'get_items',
        arguments: { type: 'issues' }
      }
    });
    
    expect(response).toHaveProperty('data.items');
  });
});
```

## Coverage Configuration

### Jest Coverage Settings

```json
{
  "collectCoverage": true,
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.d.ts",
    "!src/types/**",
    "!src/__mocks__/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ]
}
```

### Coverage Targets
- **Overall**: 80% minimum
- **Critical Paths**: 95% minimum
- **Utilities**: 90% minimum
- **Handlers**: 85% minimum

## E2E Testing

### E2E Test Runner

```typescript
// tests/e2e/custom-runner.ts
export async function runE2ETests() {
  const server = await startServer();
  const client = await connectClient();
  
  try {
    await runScenarios(client);
    console.log('✅ All E2E tests passed');
  } catch (error) {
    console.error('❌ E2E tests failed:', error);
    process.exit(1);
  } finally {
    await client.disconnect();
    await server.stop();
  }
}
```

### E2E Scenarios

```typescript
export const scenarios = [
  {
    name: 'Create and retrieve item',
    steps: [
      { action: 'create_item', params: { type: 'issues', title: 'Test' } },
      { action: 'get_items', params: { type: 'issues' } },
      { assertion: 'items.length', expected: 1 }
    ]
  },
  {
    name: 'Update and search',
    steps: [
      { action: 'update_item', params: { id: 'test-1', status: 'Closed' } },
      { action: 'search_items', params: { query: 'status:Closed' } },
      { assertion: 'results.length', expected: 1 }
    ]
  }
];
```

## Performance Testing

### Load Testing

```typescript
describe('Performance Tests', () => {
  it('should handle 1000 concurrent reads', async () => {
    const startTime = Date.now();
    const operations = Array.from({ length: 1000 }, () =>
      service.getItems({ type: 'issues' })
    );
    
    await Promise.all(operations);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
});
```

### Memory Testing

```typescript
it('should not leak memory', async () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  for (let i = 0; i < 100; i++) {
    await service.createItem(createTestItem());
    await service.deleteItem(`test-${i}`);
  }
  
  global.gc(); // Force garbage collection
  const finalMemory = process.memoryUsage().heapUsed;
  
  expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024); // 10MB max
});
```

## Test Utilities

### Custom Matchers

```typescript
expect.extend({
  toBeValidItem(received) {
    const pass = 
      received.id && 
      received.type && 
      received.title &&
      received.created_at;
    
    return {
      pass,
      message: () => `Expected ${received} to be a valid item`
    };
  }
});
```

### Test Helpers

```typescript
export const testHelpers = {
  waitFor: async (condition: () => boolean, timeout = 5000) => {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!condition()) {
      throw new Error('Timeout waiting for condition');
    }
  },
  
  cleanupTestData: async (db: Database) => {
    await db.run('DELETE FROM items WHERE id LIKE "test-%"');
    await db.run('DELETE FROM relationships WHERE from_id LIKE "test-%"');
  }
};
```

## CI/CD Test Configuration

### GitHub Actions

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
    - run: npm ci
    - run: npm run lint:errors
    - run: npm test
    - run: npm run test:coverage
    - uses: codecov/codecov-action@v3
```

### Pre-push Hook

```bash
#!/bin/sh
npm run lint:errors || exit 1
npm test || exit 1
echo "✅ All tests passed"
```