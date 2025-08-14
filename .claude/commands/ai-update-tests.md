---
allowed-tools: Read, Write, MultiEdit, Edit, Grep, Bash(npm test:*), mcp__shirokuma-knowledge-base__get_types, mcp__shirokuma-knowledge-base__get_item_detail, mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__index_codebase, mcp__shirokuma-knowledge-base__search_code, mcp__shirokuma-knowledge-base__get_index_status
description: Update test code to match the latest implementation
---

# ai-update-tests - Update test code to match current implementation

## Usage
```
/ai-update-tests         # Update all failing tests
/ai-update-tests unit    # Update unit tests only
/ai-update-tests int     # Update integration tests only
```

## Scope and Responsibility

@.shirokuma/configs/lang.md

**This command is responsible for test code updates ONLY:**
- ✅ Analyzes failing tests and identifies required updates
- ✅ Updates test expectations to match current implementation
- ✅ Fixes deprecated patterns and field names
- ✅ Updates test files to use correct assertions and mock data
- ❌ Does NOT execute tests after updates (use `/ai-tests` for execution)
- ❌ Does NOT design test strategies (use `/ai-test-strategy` for planning)
- ❌ Does NOT validate MCP API behavior (handled by mcp-api-tester agent)

## Task

Analyze the current system implementation and update test code files to match the latest API behavior.

### 1. Preparation

#### A. Index Status Check
```
[Checking]: Index status with get_index_status
[Updating]: If needed, run index_codebase to refresh
```

#### B. Test Discovery
- Identify test files: `src/**/*.test.ts`, `tests/**/*.test.ts`
- Run tests to find failures: `npm test`
- Categorize failures by type (unit vs integration)

### 2. Analysis Approach

For failing tests:
1. **Identify Root Cause**
   - API response format changes
   - Field name changes (e.g., `related_tasks` → `related`)
   - Validation rule updates
   - Error message format changes

2. **Use Semantic Search**
   - Search for failing method implementations in TypeScript files
   - Find deprecated field patterns like "related_tasks" or "related_documents"
   - Locate test assertions that need updating (e.g., "expect.*toBe.*created")
   - Use mcp__shirokuma-knowledge-base__search_code for semantic search

3. **Verify Against Implementation**
   - Compare test expectations with actual code
   - Check for deprecated patterns
   - Identify missing test coverage

### 3. Update Strategy

#### For Test Code Files (src/**/*.test.ts)

1. **Automated Fixes**
   - Field consolidation: `related_tasks` + `related_documents` → `related`
   - Response format updates: plain text → JSON
   - Error message updates for AI-friendly format

2. **Manual Review Required**
   - New validation rules
   - Breaking API changes
   - Complex business logic changes

3. **Common Patterns to Update**
   - **Field consolidation**: Change separate `related_tasks` and `related_documents` to unified `related` field
   - **Response format**: Update plain text responses to JSON format with message and id
   - **Error messages**: Update to AI-friendly format with clear instructions
   - **Validation rules**: Adjust for new required/optional parameters

### 4. Delegation to Specialists

**For comprehensive test updates**:
- Delegate complex test refactoring to @agent-shirokuma-tester
- Provide list of failing tests and error details
- Agent will update test code to match current implementation

**Note**: MCP API validation is handled by @agent-mcp-api-tester separately

### 5. Validation

After updates:
1. Run specific test files to verify changes: `npm test -- <file>`
2. Check for TypeScript errors: `npm run type-check`
3. Document changes made in update summary

### Output Format

```
## Test Update Summary

### Files Updated
- [ ] src/core/manager.test.ts (X changes)
- [ ] tests/integration/api.test.ts (Y changes)
- [ ] src/utils/validation.test.ts (Z changes)

### Changes Applied
1. **Field Consolidation**: X occurrences
   - related_tasks → related
   - related_documents → related

2. **Response Format**: Y updates
   - Plain text → JSON format
   - Added message field

3. **Error Messages**: Z updates
   - Updated to AI-friendly format

### Test Code Update Results
- Total files modified: X
- Total changes applied: Y
- TypeScript errors resolved: Z

### Next Steps
- Run `/ai-tests` to execute updated tests
- Review any remaining failures
- Consider test coverage improvements

Note: This command updates test code only. For execution:
- Unit/integration tests: Use `/ai-tests` command
- MCP API tests: Use @agent-mcp-api-tester directly
```

### Notes

- **Test Code Location**: `src/**/*.test.ts`, `tests/**/*.test.ts`
- **Focus Area**: Update existing test code only
- **Test Execution**: Use `/ai-tests` command after updates
- **Backwards Compatibility**: Maintain support for both old and new field names where possible
- **Deprecation Warnings**: Add warnings for old patterns when appropriate