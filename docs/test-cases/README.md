# MCP Functional Test Cases for AI Validation

This document collection is designed for AI assistants (like Claude) to systematically validate all MCP server functions through the MCP protocol.

## Prerequisites
- MCP server (`shirokuma-knowledge-base`) is available in your session
- Data directory (`.shirokuma/data/`) should be empty for a clean test
  - **Note**: If the database is already initialized/empty, no additional cleanup is needed
  - **Note**: Files use plural naming convention (e.g., `issues-1.md`, `plans-1.md`, `docs-1.md`)
  - **Note**: Directory structure: `issues/`, `plans/`, `docs/`, `knowledge/`, `{custom-type}/`
  - **Note**: Database v0.2.0 uses unified `items` table with Single Table Inheritance
  - **Note**: All IDs are now TEXT type (numeric IDs stored as strings)
- You have access to all MCP tools prefixed with `mcp__shirokuma-knowledge-base__`

## Test Execution Instructions
1. Execute each test case in order
2. Record the actual results
3. Note any unexpected behaviors or errors
4. Verify that responses match expected outcomes
5. For each test with content field, ensure multi-line content is preserved exactly as provided

## Test Case Categories

### Core Functionality Tests
1. **[Initial State Verification](./01-initial-state.md)** - Verify empty database state
2. **[Data Creation Tests](./02-data-creation.md)** - Create issues, plans, documents, and knowledge
3. **[Data Retrieval & Update Tests](./03-data-operations.md)** - Read and update operations
4. **[Tag Functionality Tests](./04-tag-tests.md)** - Tag management and search
5. **[Status Management Tests](./05-status-tests.md)** - Status usage and filtering
6. **[Session Management Tests](./06-session-tests.md)** - Work session operations
7. **[Daily Summary Tests](./07-summary-tests.md)** - Daily summary management

### Advanced Tests
8. **[Comprehensive Verification](./08-verification.md)** - Data integrity and error handling
9. **[Data Deletion Tests](./09-deletion-tests.md)** - Delete operations and cascading
10. **[Edge Cases and Additional Tests](./10-edge-cases.md)** - Unicode, boundaries, and special cases
11. **[Type Management Tests](./11-type-management.md)** - Dynamic type system and custom types
12. **[Database Rebuild Tests](./12-rebuild-tests.md)** - Database reconstruction from markdown (MUST be run last)

## Test Execution Order

Tests should be executed in numerical order as later tests may depend on data created in earlier tests.

**IMPORTANT**: Database Rebuild Tests (test 12) MUST be executed last as it will reset the database and may affect subsequent tests.

## Success Criteria
- All CRUD operations work correctly without errors
- Error cases return meaningful error messages
- Data integrity is maintained across all operations
- Multi-line content is preserved exactly as provided (no unwanted formatting)
- Tags are automatically registered when items are created
- Session content is saved as-is without additional formatting
- All search functions return accurate results
- Date-based queries work correctly
- Default statuses with is_closed flags work correctly
- Status filtering for issues/plans works as expected (default excludes closed)
- Status modification tools are properly disabled
- Status names (not IDs) are stored in markdown files
- Status updates via update_item work correctly using status names
- Unicode and special characters are handled properly
- Custom types can be created with field definitions and validation
- Type inheritance (base_type: tasks or documents) works correctly
- Types with existing items cannot be deleted
- Default types can be deleted like any other type
- All items stored in unified `items` table with composite primary key (type, id)
- ID consistency maintained (all IDs as TEXT, numeric IDs as strings)
- Related items stored as JSON arrays in `related` field
- Tags stored as JSON arrays with normalized relationships in `item_tags` table
- Title length is limited to 500 characters
- Items cannot reference themselves in related fields
- Zero-width and invisible characters are automatically filtered from input

## AI Testing Guidelines
1. **Execute tests sequentially** - Later tests may depend on earlier data
2. **Record exact responses** - Note any deviations from expected results
3. **Test error conditions** - Confirm appropriate error messages
4. **Verify data persistence** - Re-query after creates/updates
5. **Check field preservation** - Ensure all fields remain unchanged unless explicitly updated
6. **Validate relationships** - Tags, statuses, and cross-references work correctly
7. **Document any issues** - Note unexpected behaviors for debugging

## Common Issues to Watch For
- Content field being modified or formatted unexpectedly
- Tags not being auto-registered
- Session IDs not following the expected format (YYYY-MM-DD-HH.MM.SS.sss)
- Date fields not accepting the YYYY-MM-DD format
- Search results missing expected items
- Error messages not being descriptive enough
- Unicode or special characters causing issues
- Empty arrays vs null returns
- Partial updates affecting unspecified fields
- ID type consistency (ensure all IDs returned as strings)
- Related items format ("type-id" format in arrays)
- Response format compatibility (some responses maintain backward compatibility)
- Custom type validation via sequences table lookup
- Title length limit (maximum 500 characters)
- Self-referencing items (items cannot reference themselves in related fields)
- Zero-width characters being filtered from strings

## Reporting Results
When reporting test results, include:
1. Test case executed
2. Actual MCP command used
3. Expected result
4. Actual result
5. Pass/Fail status
6. Any error messages or unexpected behaviors
7. Suggestions for fixes if issues are found