# E2E Tests

This directory contains end-to-end tests for the Shirokuma MCP Knowledge Base server.

## Available Test Runners

### 1. Custom Runner (Recommended)
```bash
npm run test:e2e:custom
```
- Simple, standalone test runner
- No external dependencies beyond TypeScript
- Simulates MCP client interactions
- Provides clear test output

### 2. Debug with MCP Inspector
```bash
npm run inspect
```
- Opens browser-based MCP Inspector UI
- Manual testing and exploration
- For debugging only, not for automated E2E tests

## CI/CD Integration

E2E tests are automatically run in GitHub Actions:
- Custom runner tests run on all Node.js versions

## Test Structure

```
tests/e2e/
├── README.md                    # This file
├── custom-runner.ts             # E2E test runner implementation
└── old/                        # Deprecated test files (for reference)
```

## Writing E2E Tests

### Custom Runner Pattern
```typescript
await runner.runTest('Test Name', async () => {
  // Test implementation
  // Throw error on failure
});
```

## Known Issues

1. **Timing Issues**: MCP server startup can take time. Tests include appropriate delays and retry logic.

## Debugging

1. **Enable Verbose Logging**:
   ```bash
   LOG_LEVEL=debug npm run test:e2e:custom
   ```

2. **Use MCP Inspector**:
   ```bash
   npm run test:e2e:inspect
   ```
   Then navigate to the provided URL to interact with the server manually.

3. **Check Server Logs**:
   Server output is redirected to stderr. Check the console for startup messages and errors.