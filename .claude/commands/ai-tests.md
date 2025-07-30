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

#### Phase 1: Core Functionality Tests
1.01. **Initial State Verification** - @.claude/commands/ai-tests/1.01-initial-state.md
1.02. **Data Creation Tests** - @.claude/commands/ai-tests/1.02-data-creation.md
1.03. **Data Retrieval & Update Tests** - @.claude/commands/ai-tests/1.03-data-operations.md
1.04. **Tag Functionality Tests** - @.claude/commands/ai-tests/1.04-tag-tests.md
1.05. **Status Management Tests** - @.claude/commands/ai-tests/1.05-status-tests.md
1.06. **Session Management Tests** - @.claude/commands/ai-tests/1.06-session-tests.md
1.07. **Daily Summary Tests** - @.claude/commands/ai-tests/1.07-summary-tests.md
1.08. **Comprehensive Verification** - @.claude/commands/ai-tests/1.08-verification.md
1.09. **Data Deletion Tests** - @.claude/commands/ai-tests/1.09-deletion-tests.md
1.10. **Edge Cases and Additional Tests** - @.claude/commands/ai-tests/1.10-edge-cases.md
1.11. **Type Management Tests** - @.claude/commands/ai-tests/1.11-type-management.md
1.12. **Current State Management Tests** - @.claude/commands/ai-tests/1.12-current-state.md
1.13. **Item Type Change Tests** - @.claude/commands/ai-tests/1.13-type-change.md

#### Phase 2: Database Rebuild Tests
2.01. **Database Rebuild and SQLite Verification** - @.claude/commands/ai-tests/2.01-rebuild-tests.md (MUST be run last)
2.02. **Post-Rebuild API Verification** - @.claude/commands/ai-tests/2.02-post-rebuild-verification.md (Run after server restart)

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

Start with test 1.01 and proceed sequentially through Phase 1. Phase 2 consists of:
- Test 2.01: Database rebuild and SQLite-level verification
- Server restart (required)
- Test 2.02: Post-rebuild API verification through MCP protocol