---
allowed-tools: Read, Write, MultiEdit, Edit, Grep, Bash(npm test:*), mcp__shirokuma-knowledge-base__get_types, mcp__shirokuma-knowledge-base__get_item_detail, mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__index_codebase, mcp__shirokuma-knowledge-base__search_code, mcp__shirokuma-knowledge-base__get_index_status
description: テストコードやテストコマンドを最新の仕様に合わせて更新
---

# ai-update-tests - Update tests to match current implementation

## Usage
```
/ai-update-tests
```

## Task

Note: Respond to the user in their language.

<ultrathink>
Before updating tests, I need to:
1. Check if codebase index is up-to-date for efficient searching
2. Understand what test files exist and their current state
3. Run the tests to see what's failing
4. Compare test expectations with actual API behavior
5. Identify both test specification files (.claude/commands/ai-tests/*.markdown) and actual test code files (src/**/*.test.ts)
6. Update both types of files to match current implementation
</ultrathink>

Analyze the current system implementation and update both test specifications AND test code files to match:

### 1. Discover Current Specifications

#### A. Index Preparation
```
[Checking]: Index status with get_index_status
[Updating]: If needed, run index_codebase to refresh
```

#### B. Discovery Process
- Execute actual API calls to understand current behavior
- Use semantic search to find related test files and implementations
- Compare with existing test expectations
- Identify discrepancies between tests and reality

### 2. Analysis Approach
```
[Discovering]: Current API behavior
[Comparing]: Test expectations vs actual responses
[Identifying]: Outdated patterns and deprecated features
```

### 3. Update Strategy
- **Schema-driven**: Extract actual response schemas from live API
- **Example-driven**: Use real API responses as test fixtures
- **Error-driven**: Run tests and fix failures based on actual errors
- **Documentation-driven**: Update based on current tool definitions
- **Search-driven**: Use semantic search to find related code and tests
  - `search_code({ query: "test assertion [feature]", fileTypes: ["ts"] })`
  - `search_code({ query: "[API method] implementation", fileTypes: ["ts"] })`

### 4. Key Areas to Check
- API response formats (structure, field names, data types)
- Required vs optional parameters
- Error message formats
- Validation rules
- Default values
- Edge case behaviors

### 5. Update Process

<ultrathink>
The update process should cover both test specifications and actual test code:
- Test specifications: .claude/commands/ai-tests/*.markdown files
- Test code: src/**/*.test.ts files
Both need to be synchronized with the current implementation
</ultrathink>

#### A. Test Specification Files (.claude/commands/ai-tests/*.markdown)
1. Update markdown test descriptions to match current API behavior
2. Fix expected request/response formats in documentation
3. Update example scenarios and edge cases

#### B. Test Code Files (src/**/*.test.ts)
1. Run current tests to identify failures: `npm test`
2. For each failing test:
   - Use semantic search to find the implementation: `search_code({ query: "[failing method]", fileTypes: ["ts"] })`
   - Call actual APIs to get expected behavior
   - Update test assertions to match actual responses
   - Fix mock data and fixtures
   - Update error expectations
3. Search for outdated patterns using semantic search:
   - `search_code({ query: "related_tasks OR related_documents", fileTypes: ["ts"] })` → Find field consolidation needs
   - `search_code({ query: "expect.*toBe.*created", fileTypes: ["test.ts"] })` → Find response format changes
   - `search_code({ query: "throw.*Error OR reject", fileTypes: ["ts"] })` → Find error handling patterns
4. Ensure backwards compatibility where needed
5. Add tests for new features discovered

#### C. Common Updates Needed
- Response format changes (e.g., plain text → JSON)
- Field consolidations (e.g., `related_tasks` + `related_documents` → `related`)
- New required/optional parameters
- Updated error message formats
- Schema validation changes

### 6. Validation
```
[Testing]: Run updated tests
[Verifying]: All tests pass with current implementation
[Documenting]: Changes made and reasons
```

### Output Format

<ultrathink>
The output should clearly show what files were updated and why, distinguishing between test specifications and test code
</ultrathink>

```
[Analysis Started]
- Index status: [up-to-date/outdated - X files indexed]
- Test specification files found: X
- Test code files found: Y
- Current test failures: Z

[Test Specifications Updated] (.claude/commands/ai-tests/*.markdown)
- File: [filename] - [specific updates to documentation]
- Reason: [why the change was needed]

[Test Code Updated] (src/**/*.test.ts)
- File: [filename] - [specific code changes]
- Changed: [old assertion] → [new assertion]
- Reason: [API behavior change detected]

[Validation Complete]
- All tests passing: ✓/✗
- Test specifications aligned: ✓/✗
- Coverage maintained: ✓/✗
```

### Examples of Common Fixes

<ultrathink>
I should provide concrete examples of the types of changes that might be needed
</ultrathink>

1. **Response Format Change**
   ```typescript
   // Before: Plain text response
   expect(result).toBe('Item created');
   
   // After: JSON response
   expect(result).toEqual({ message: 'Item created', id: expect.any(Number) });
   ```

2. **Field Consolidation**
   ```typescript
   // Before: Separate fields
   expect(item.related_tasks).toEqual(['issues-1']);
   expect(item.related_documents).toEqual(['docs-1']);
   
   // After: Unified field
   expect(item.related).toEqual(['issues-1', 'docs-1']);
   ```

3. **Error Message Updates**
   ```typescript
   // Before: Generic error
   expect(error.message).toBe('Invalid request');
   
   // After: AI-friendly error with instructions
   expect(error.message).toContain('do not exist');
   expect(error.message).toContain('Please create these items first');
   ```

This command ensures both test documentation and test code stay synchronized with the evolving API implementation.