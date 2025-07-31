---
description: Run MCP functional tests for validation
allowed-tools: mcp__test-knowledge-base__*, Bash(ls:*), Read
argument-hint: "[test-number or phase]"
---

# ai-tests - Run MCP functional tests

## Usage
```
/ai-tests                   # Run all tests
/ai-tests 1.01             # Run specific test
/ai-tests phase1           # Run Phase 1 tests
/ai-tests phase2           # Run Phase 2 tests
```

## Context
- MCP server status: !`ls -la .shirokuma/data/ 2>/dev/null || echo "Data directory not found"`
- Database status: !`ls -la .shirokuma/data/search.db 2>/dev/null || echo "Database not found"`

## Task

Note: Respond to the user in their language.

Execute systematic validation tests for MCP server functions through the MCP protocol.

### Prerequisites Check
1. Verify MCP server (`test-knowledge-base`) is available
2. Check data directory (`.shirokuma/data/`) - should be empty for clean test
3. Confirm all `mcp__test-knowledge-base__*` tools are available

### Test Execution

Parse arguments:
- No arguments: Run all Phase 1 tests
- Test number (e.g., "1.01"): Run specific test
- "phase1": Run tests 1.01-1.13
- "phase2": Run tests 2.01-2.02

#### Phase 1: Core Functionality Tests
1.01. **Initial State Verification** - @.claude/commands/ai-tests/1.01-initial-state.markdown
1.02. **Data Creation Tests** - @.claude/commands/ai-tests/1.02-data-creation.markdown
1.03. **Data Retrieval & Update Tests** - @.claude/commands/ai-tests/1.03-data-operations.markdown
1.04. **Tag Functionality Tests** - @.claude/commands/ai-tests/1.04-tag-tests.markdown
1.05. **Status Management Tests** - @.claude/commands/ai-tests/1.05-status-tests.markdown
1.06. **Session Management Tests** - @.claude/commands/ai-tests/1.06-session-tests.markdown
1.07. **Daily Summary Tests** - @.claude/commands/ai-tests/1.07-summary-tests.markdown
1.08. **Comprehensive Verification** - @.claude/commands/ai-tests/1.08-verification.markdown
1.09. **Data Deletion Tests** - @.claude/commands/ai-tests/1.09-deletion-tests.markdown
1.10. **Edge Cases and Additional Tests** - @.claude/commands/ai-tests/1.10-edge-cases.markdown
1.11. **Type Management Tests** - @.claude/commands/ai-tests/1.11-type-management.markdown
1.12. **Current State Management Tests** - @.claude/commands/ai-tests/1.12-current-state.markdown
1.13. **Item Type Change Tests** - @.claude/commands/ai-tests/1.13-type-change.markdown

#### Phase 2: Database Rebuild Tests
2.01. **Database Rebuild and SQLite Verification** - @.claude/commands/ai-tests/2.01-rebuild-tests.markdown
2.02. **Post-Rebuild API Verification** - @.claude/commands/ai-tests/2.02-post-rebuild-verification.markdown

### Test Process
For each test:
1. Display: "[Running Test X.XX]: [Test Name]"
2. Execute test steps
3. Record actual results
4. Compare with expected outcomes
5. Report: "✅ [Passed]" or "❌ [Failed]: reason"

### Success Criteria
- All CRUD operations work correctly
- Error cases return meaningful messages
- Multi-line content preserved exactly
- Tags auto-register on item creation
- Status filtering works (default excludes closed)
- Unicode/special characters handled properly
- Custom types validate correctly
- Related items stored as JSON arrays

### Result Reporting Format
```
📊 [Test Results Summary]
[Phase 1]: X/13 [tests passed]
[Phase 2]: X/2 [tests passed]

[Details]:
✅ 1.01 Initial State - [Passed]
❌ 1.02 Data Creation - [Failed]: specific error
...

[Overall Result]: [All tests passed] / [X tests failed]
```

### Error Handling
- If test fails, continue with next test
- Record all errors for final summary
- Note any blocking issues that prevent further tests

### Important Notes
- Phase 2 requires server restart between 2.01 and 2.02
- For content tests, verify multi-line preservation
- Test with clean data directory when possible