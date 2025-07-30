---
allowed-tools: mcp__test-knowledge-base__*, Bash(ls:*), Read
description: Run MCP functional tests for validation
---

## Context

- MCP server status: !`ls -la .shirokuma/data/ 2>/dev/null || echo "Data directory not found"`
- Database status: !`ls -la .shirokuma/data/search.db 2>/dev/null || echo "Database not found"`

## Your task

Execute systematic validation tests for all MCP server functions through the MCP protocol.

### Prerequisites
- MCP server (`shirokuma-knowledge-base`) is available in your session
- Data directory (`.shirokuma/data/`) should be empty for a clean test
- All MCP tools prefixed with `mcp__test-knowledge-base__` are available

### Test Execution Instructions
1. Execute each test case in order
2. Record the actual results
3. Note any unexpected behaviors or errors
4. Verify that responses match expected outcomes
5. For each test with content field, ensure multi-line content is preserved exactly as provided

### Test Case Categories

#### Core Functionality Tests
1. **Initial State Verification** - @.claude/commands/ai-tests/01-initial-state.md
2. **Data Creation Tests** - @.claude/commands/ai-tests/02-data-creation.md
3. **Data Retrieval & Update Tests** - @.claude/commands/ai-tests/03-data-operations.md
4. **Tag Functionality Tests** - @.claude/commands/ai-tests/04-tag-tests.md
5. **Status Management Tests** - @.claude/commands/ai-tests/05-status-tests.md
6. **Session Management Tests** - @.claude/commands/ai-tests/06-session-tests.md
7. **Daily Summary Tests** - @.claude/commands/ai-tests/07-summary-tests.md

#### Advanced Tests
8. **Comprehensive Verification** - @.claude/commands/ai-tests/08-verification.md
9. **Data Deletion Tests** - @.claude/commands/ai-tests/09-deletion-tests.md
10. **Edge Cases and Additional Tests** - @.claude/commands/ai-tests/10-edge-cases.md
11. **Type Management Tests** - @.claude/commands/ai-tests/11-type-management.md
12. **Database Rebuild Tests** - @.claude/commands/ai-tests/12-rebuild-tests.md (MUST be run last)

### Success Criteria
- All CRUD operations work correctly without errors
- Error cases return meaningful error messages
- Multi-line content is preserved exactly as provided
- Tags are automatically registered when items are created
- Status filtering works as expected (default excludes closed)
- Unicode and special characters are handled properly
- Custom types work with proper validation
- Related items stored as JSON arrays with "type-id" format

### Reporting Results
When reporting test results, include:
1. Test case executed
2. Actual MCP command used
3. Expected result
4. Actual result
5. Pass/Fail status
6. Any error messages or unexpected behaviors

Start with test #1 and proceed sequentially. Database Rebuild Tests MUST be executed last.