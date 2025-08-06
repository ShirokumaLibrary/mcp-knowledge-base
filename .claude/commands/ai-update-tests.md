---
allowed-tools: Read, Write, MultiEdit, Edit, Grep, Bash(npm test:*), mcp__shirokuma-knowledge-base__get_types, mcp__shirokuma-knowledge-base__get_item_detail, mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__index_codebase, mcp__shirokuma-knowledge-base__search_code, mcp__shirokuma-knowledge-base__get_index_status, Task
description: Update test code to match the latest implementation
---

# ai-update-tests - Update test code to match current implementation

## Usage
```
/ai-update-tests         # Update all failing tests
/ai-update-tests unit    # Update unit tests only
/ai-update-tests int     # Update integration tests only
```

## Task

@.claude/agents/LANG.markdown

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
- Use Task tool to delegate to shirokuma-tester agent
- Provide list of failing tests and error details
- Agent will update test code to match current implementation

**For API test validation**:
- Use Task tool to delegate to mcp-api-tester agent
- Request execution of specific test phases
- Agent will validate current API behavior against specifications

### 5. Validation

After updates:
1. Run all tests: `npm test`
2. Check coverage: `npm run test:coverage`
3. Verify no regressions
4. Document changes made

### Output Format

```
[Analysis Complete]
- Tests analyzed: X files
- Failures found: Y tests
- Updates made: Z changes

[Test Results]
✅ Unit tests: X/Y passing
✅ Integration tests: X/Y passing
✅ Coverage maintained: XX%

[Changes Summary]
- Field consolidation: X updates
- Response format: Y updates
- Error messages: Z updates
```

### Notes

- **API Test Specifications** are now managed by mcp-api-tester agent
  - Location: `.claude/agents/mcp-api-tester-tests/*.markdown`
  - Use `/ai-tests` command to execute them
  
- **Code Tests** remain in the codebase
  - Location: `src/**/*.test.ts`, `tests/**/*.test.ts`
  - This command focuses on updating these files

- **Backwards Compatibility**
  - Maintain support for both old and new field names where possible
  - Add deprecation warnings for old patterns