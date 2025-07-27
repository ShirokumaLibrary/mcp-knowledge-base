# E2E Testing Guide

## Overview

End-to-end (E2E) tests validate the complete functionality of the MCP Knowledge Base system by testing through the actual MCP protocol interface.

## Test Structure

### Test Suites

1. **CRUD Operations** (`crud-operations.e2e.test.ts`)
   - Complete lifecycle testing for all entity types
   - Cross-type operations
   - Batch operations

2. **Search Functionality** (`search-functionality.e2e.test.ts`)
   - Full-text search
   - Tag-based search
   - Advanced search features

3. **Performance** (`performance.e2e.test.ts`)
   - Response time benchmarks
   - Load testing
   - Memory usage monitoring

4. **Security** (`security.e2e.test.ts`)
   - Input validation
   - SQL injection prevention
   - XSS prevention
   - Error handling

5. **Workflows** (`workflow.e2e.test.ts`)
   - Project management workflow
   - Knowledge management workflow
   - Tag organization workflow

## Running E2E Tests

> **Update**: We now have multiple solutions for E2E testing, including the MCP-specific test framework `mcp-jest`.

### Prerequisites

1. Build the project:
   ```bash
   npm run build
   ```

2. Ensure no MCP server is running on the default port

### Testing Options

#### Option 1: Using mcp-jest (Recommended)

```bash
# Install mcp-jest
npm install --save-dev mcp-jest

# Run tests
npm run test:e2e:mcp-jest
```

#### Option 2: Using MCP Inspector

```bash
# Interactive testing
npx @modelcontextprotocol/inspector node dist/server.js
```

#### Option 3: Custom Test Runner

```bash
# Run custom E2E tests
npm run test:e2e:custom
```

### Known Issues and Solutions

- **ESM Module Resolution**: The MCP SDK has known issues with Jest ESM module resolution
- **Solution**: Use `mcp-jest` or custom test runners as documented in [E2E Testing Solutions](../docs.ja/e2e-testing-solutions.md)

Or using the test runner directly:

```bash
npx tsx tests/e2e/run-e2e-tests.ts
```

### Run Individual Test Suite

```bash
npx jest tests/e2e/crud-operations.e2e.test.ts
```

### Run with Debugging

```bash
SHOW_TEST_LOGS=true npm run test:e2e
```

## Test Environment

### Setup

Each test suite:
1. Creates a temporary test database
2. Starts an MCP server instance
3. Connects an MCP client
4. Runs test scenarios
5. Cleans up all resources

### Test Utilities

**Setup Functions**:
```typescript
// Setup test environment
const context = await setupE2ETest();

// Call MCP tool
const result = await callTool(context.client, 'tool_name', { params });

// Run test scenario
await runScenario('Scenario Name', [
  {
    name: 'Step name',
    action: async () => { /* test action */ },
    assertions: (result) => { /* assertions */ }
  }
]);
```

**Performance Testing**:
```typescript
const { result, duration } = await measurePerformance(
  async () => { /* operation */ },
  'Operation Name'
);
```

## Performance Targets

### Response Times

- **Create**: < 100ms
- **Read**: < 50ms
- **Update**: < 100ms
- **Delete**: < 50ms
- **List**: < 200ms
- **Search**: < 500ms

### Load Testing

- Handle 10 concurrent operations
- Support 100+ items per type
- No memory leaks during extended operation

## Writing E2E Tests

### Best Practices

1. **Use Descriptive Names**
   ```typescript
   it('should perform complete issue lifecycle', async () => {
   ```

2. **Clean Up After Tests**
   ```typescript
   afterAll(async () => {
     await context.cleanup();
   });
   ```

3. **Use Test Fixtures**
   ```typescript
   const testIssue = {
     title: 'Test Issue',
     content: 'Test content',
     priority: 'high'
   };
   ```

4. **Test Real Workflows**
   ```typescript
   await runScenario('Project Management', [
     { name: 'Create project', ... },
     { name: 'Add tasks', ... },
     { name: 'Update status', ... }
   ]);
   ```

5. **Validate Edge Cases**
   - Empty inputs
   - Invalid data
   - Large datasets
   - Concurrent operations

### Example Test

```typescript
describe('E2E: Feature Name', () => {
  let context: E2ETestContext;
  
  beforeAll(async () => {
    context = await setupE2ETest();
  });
  
  afterAll(async () => {
    await context.cleanup();
  });
  
  it('should test specific feature', async () => {
    await runScenario('Feature Test', [
      {
        name: 'Setup test data',
        action: async () => {
          return await callTool(context.client, 'create_item', {
            type: 'issues',
            title: 'Test',
            content: 'Content'
          });
        },
        assertions: (result) => {
          expect(result.id).toBeDefined();
        }
      }
    ]);
  });
});
```

## Troubleshooting

### Common Issues

1. **Server Startup Timeout**
   - Check if port is already in use
   - Increase timeout in `setupE2ETest()`
   - Check server logs for errors

2. **Test Failures**
   - Run with `SHOW_TEST_LOGS=true`
   - Check temporary test database
   - Verify MCP server is building correctly

3. **Memory Issues**
   - Run tests individually
   - Check for cleanup in afterAll hooks
   - Monitor with `--detectOpenHandles`

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=debug SHOW_TEST_LOGS=true npm run test:e2e
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run E2E Tests
  run: |
    npm ci
    npm run build
    npm run test:e2e
  env:
    CI: true
```

### Test Reports

E2E tests generate JSON reports in `test-results/e2e/`:
- Test summary
- Individual suite results
- Performance metrics
- Environment information

## Maintenance

### Adding New Tests

1. Create test file in `tests/e2e/`
2. Add to `testSuites` in `run-e2e-tests.ts`
3. Follow existing patterns
4. Update documentation

### Updating Tests

When API changes:
1. Update test fixtures
2. Modify tool calls
3. Adjust assertions
4. Run full suite

### Performance Monitoring

Regular tasks:
- Review test reports
- Update performance targets
- Optimize slow tests
- Add new scenarios