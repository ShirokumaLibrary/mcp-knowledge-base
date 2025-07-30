# MCP Functional Test Cases

This directory contains test cases for validating the MCP server. For AI-assisted testing, use the `/ai-test` command instead, which provides an interactive testing experience with all test details.

## Quick Start

To run the complete test suite:
```
/ai-test
```

## Test Categories

1. **Initial State Verification** - Verify empty database state
2. **Data Creation Tests** - Create various item types
3. **Data Operations** - Read and update operations
4. **Tag Tests** - Tag management and search
5. **Status Tests** - Status filtering and usage
6. **Session Tests** - Work session operations
7. **Summary Tests** - Daily summary management
8. **Verification** - Data integrity checks
9. **Deletion Tests** - Delete operations
10. **Edge Cases** - Unicode and boundaries
11. **Type Management** - Dynamic type system
12. **Rebuild Tests** - Database reconstruction (run last)

## Individual Test Files

Each numbered file (01-*.md through 12-*.md) contains detailed test cases for manual execution if needed.

## Success Criteria

- All CRUD operations work correctly
- Error messages are meaningful
- Multi-line content preserved exactly
- Tags auto-registered
- Status filtering works properly
- Unicode handled correctly
- Custom types validated

For detailed test execution, use the `/ai-test` command.