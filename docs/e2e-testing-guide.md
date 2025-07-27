# E2E Testing Guide

## Overview

End-to-end (E2E) tests validate the complete functionality of the MCP Knowledge Base system by testing through the actual MCP protocol interface.

## Current Implementation

### Test Structure

```
tests/e2e/
├── README.md         # Quick reference
├── custom-runner.ts  # Simple test runner implementation
└── old/             # Deprecated test files (for reference)
```

### Available Test Method

#### Custom Runner

The project includes a simple custom test runner that starts the MCP server and runs basic tests:

```bash
# Run the custom E2E test runner
npx tsx tests/e2e/custom-runner.ts
```

Features:
- Starts MCP server with test database
- Runs connection and basic operation tests
- Cleans up test data after completion
- No external dependencies beyond TypeScript

### Interactive Testing with MCP Inspector

For manual testing and debugging:

```bash
# Start the server with MCP Inspector
npx @modelcontextprotocol/inspector node dist/server.js
```

This opens a browser-based interface where you can:
- Manually call MCP tools
- Inspect requests and responses
- Debug tool implementations

## Running E2E Tests

### Prerequisites

1. Build the project:
   ```bash
   npm run build
   ```

2. Ensure the distribution files are up to date

### Running the Custom Runner

```bash
# Direct execution
npx tsx tests/e2e/custom-runner.ts

# With debug logging
LOG_LEVEL=debug npx tsx tests/e2e/custom-runner.ts
```

## Test Scenarios

The custom runner currently tests:

1. **Server Connection**
   - Server startup
   - Basic connectivity

2. **Basic CRUD Operations**
   - Create issue
   - Get issue details
   - Search by tag
   - Delete issue

3. **Performance Checks**
   - Operation response times
   - Batch operations

## Writing New E2E Tests

To add tests to the custom runner:

1. Open `tests/e2e/custom-runner.ts`
2. Add your test in the `runTests()` method:

```typescript
await runner.runTest('Your Test Name', async () => {
  // Your test implementation
  // Throw an error to fail the test
  if (!condition) {
    throw new Error('Test failed: reason');
  }
});
```

## Known Limitations

1. **MCP Client Implementation**: The current custom runner simulates MCP interactions rather than using a full MCP client
2. **Limited Test Coverage**: Only basic scenarios are tested
3. **No Jest Integration**: Due to ESM module resolution issues with the MCP SDK

## Future Improvements

Potential enhancements for E2E testing:

1. **Full MCP Client Integration**: Implement proper MCP client for protocol-compliant testing
2. **Comprehensive Test Suites**: Add tests for:
   - All entity types (plans, docs, knowledge)
   - Session management
   - Tag operations
   - Status filtering
   - Type management
3. **Performance Benchmarking**: Add detailed performance metrics
4. **CI/CD Integration**: Automate E2E tests in GitHub Actions

## Troubleshooting

### Server Startup Issues

If the server fails to start:
- Check if another process is using the MCP stdio interface
- Verify the build completed successfully
- Check server logs for initialization errors

### Test Failures

Enable debug logging:
```bash
LOG_LEVEL=debug npx tsx tests/e2e/custom-runner.ts
```

### Manual Debugging

Use MCP Inspector for interactive debugging:
```bash
npx @modelcontextprotocol/inspector node dist/server.js
```

## References

- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Custom Runner Implementation](../tests/e2e/custom-runner.ts)
- [E2E Test README](../tests/e2e/README.md)