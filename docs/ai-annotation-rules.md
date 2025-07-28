# AI Development Annotation Rules

## Purpose

These annotation rules are designed to make code more understandable and maintainable for AI-assisted development. The annotations provide context, explain intent, and highlight important patterns that might not be obvious from the code structure alone.

## Core Principles

1. **Intent Over Implementation**: Focus on WHY, not just WHAT
2. **Context is King**: Provide domain knowledge and business logic context
3. **Pattern Recognition**: Highlight design patterns and architectural decisions
4. **Edge Case Documentation**: Explicitly mark boundary conditions and error handling
5. **AI Hints**: Provide hints for AI to understand complex logic flows
6. **Cross-References**: Help AI understand relationships when it can't see the whole codebase

## Annotation Format

### 1. Class-Level Annotations

```typescript
/**
 * @ai-context Primary data access layer for issue management
 * @ai-pattern Repository pattern with dual storage (Markdown + SQLite)
 * @ai-critical Maintains data consistency between file system and database
 * @ai-dependencies StatusRepository (for status lookups), TagRepository (for tag management)
 */
export class IssueRepository extends BaseRepository {
  // ...
}
```

### 2. Method-Level Annotations

```typescript
/**
 * @ai-intent Synchronizes issue data from markdown to SQLite for fast searching
 * @ai-flow 1. Validate issue data -> 2. Prepare SQL parameters -> 3. Execute upsert
 * @ai-error-handling Throws DatabaseError on SQL failures
 * @ai-side-effects Updates search_issues table in SQLite
 */
async syncIssueToSQLite(issue: Issue): Promise<void> {
  // ...
}
```

### 3. Complex Logic Annotations

```typescript
// @ai-logic: Custom status restoration during rebuild
// @ai-why: User-defined statuses must persist across database rebuilds
// @ai-edge-case: Handles ID conflicts with AUTOINCREMENT
if (!defaultStatuses.includes(statusName)) {
  // ...
}
```

### 4. Error Handling Annotations

```typescript
try {
  // ...
} catch (error) {
  // @ai-error-type: FileSystemError, DatabaseError
  // @ai-recovery: Log error and return safe default
  // @ai-impact: Non-critical - operation continues with degraded functionality
}
```

## Annotation Tags Reference

### Structural Tags
- `@ai-context`: High-level purpose and domain context
- `@ai-pattern`: Design pattern or architectural pattern used
- `@ai-dependencies`: Critical dependencies and their purposes
- `@ai-lifecycle`: Object lifecycle and state management info
- `@ai-architecture-decision`: Marks important architectural choices
- `@ai-redundant`: Indicates intentional data redundancy

### Behavioral Tags
- `@ai-intent`: Primary purpose of the method/function
- `@ai-flow`: Step-by-step logic flow for complex operations
- `@ai-side-effects`: Database writes, file I/O, external API calls
- `@ai-async`: Asynchronous behavior and promise handling

### Quality Tags
- `@ai-critical`: Mission-critical code that must not fail
- `@ai-performance`: Performance considerations and optimizations
- `@ai-security`: Security implications and validations
- `@ai-test-focus`: Areas requiring thorough testing

### Logic Tags
- `@ai-logic`: Explains complex business logic
- `@ai-why`: Rationale for non-obvious decisions
- `@ai-edge-case`: Boundary conditions and special cases
- `@ai-assumption`: Assumptions made by the code
- `@ai-validation`: Data validation and constraints
- `@ai-trade-off`: Trade-offs between different approaches
- `@ai-alternative`: Alternative implementations considered

### Error Tags
- `@ai-error-type`: Types of errors that can occur
- `@ai-error-handling`: How errors are handled
- `@ai-recovery`: Recovery strategies for failures
- `@ai-impact`: Impact of failures on system functionality
- `@ai-bug`: Known issues or bugs
- `@ai-fix`: Bug fixes with explanation
- `@ai-debt`: Technical debt markers

### Testing Tags
- `@ai-skip`: Test is intentionally skipped
- `@ai-reason`: Reason why test is skipped or special handling
- `@ai-todo`: Future improvements or missing functionality
- `@ai-note`: Additional context or warnings

### Cross-Reference Tags (New)
- `@ai-related-files`: Lists related files that should be considered together
- `@ai-filesystem`: Describes file system structure and paths
- `@ai-compare-with`: References similar patterns in other parts
- `@ai-data-flow`: Describes how data flows through the system
- `@ai-integration-point`: Marks where this code integrates with others
- `@ai-database-schema`: References database table structure
- `@ai-contrast`: Highlights differences with other implementations
- `@ai-data-source`: Identifies primary data source (file vs database)

## Best Practices

1. **Keep annotations concise** - One line when possible, max 3 lines
2. **Use consistent terminology** - Maintain a project glossary
3. **Update annotations with code** - Treat as part of the code, not documentation
4. **Focus on non-obvious aspects** - Don't annotate self-explanatory code
5. **Link related concepts** - Reference other classes/methods when relevant

### When to Use Cross-Reference Tags

Use cross-reference tags when:
- A component has strong dependencies on other files
- Data flows through multiple layers of the architecture
- Similar patterns exist in other parts of the codebase
- Understanding requires knowledge of file system structure
- Database schema affects the implementation
- Integration points connect different subsystems

Example scenarios:
- Repository implementations that create specific file structures
- Handlers that delegate to multiple services
- Tests that mirror production code patterns
- Utilities used across multiple domains

## Examples by Component Type

### Repository Classes
```typescript
/**
 * @ai-context Manages issue lifecycle from creation to deletion
 * @ai-pattern Repository pattern with file-based primary storage
 * @ai-critical Data consistency between markdown files and SQLite
 * @ai-related-files
 *   - src/types/domain-types.ts (Issue interface)
 *   - src/handlers/unified-handlers.ts (uses this repository)
 *   - src/database/base.ts (parent class)
 * @ai-filesystem Creates files in {dataDir}/issues/issue-{id}.md
 */
```

### Service Classes
```typescript
/**
 * @ai-context Business logic layer for issue processing
 * @ai-pattern Service layer pattern with transaction support
 * @ai-dependencies Multiple repositories for cross-entity operations
 * @ai-data-flow
 *   1. Handler receives MCP request
 *   2. Service validates and processes
 *   3. Repository persists to file + SQLite
 * @ai-integration-point Called by IssueHandlers for all issue operations
 */
```

### Utility Functions
```typescript
/**
 * @ai-intent Parse markdown with YAML frontmatter
 * @ai-edge-case Handles missing frontmatter gracefully
 * @ai-return {metadata, content} tuple, never null
 * @ai-compare-with generateMarkdown() for reverse operation
 * @ai-database-schema Results stored in search_* tables
 */
```

### Error Handlers
```typescript
/**
 * @ai-context Global error boundary for MCP protocol
 * @ai-pattern Chain of responsibility for error handling
 * @ai-critical Must always return valid MCP response
 * @ai-bug Missing await on async operations
 * @ai-fix Added await keywords to prevent race conditions
 */
```

### Test Annotations
```typescript
/**
 * @ai-skip Environment-dependent test
 * @ai-reason File permission changes behave differently across OS/environments
 * @ai-todo Consider integration test suite for platform-specific behaviors
 */
it.skip('should handle read permission errors gracefully', async () => {
  // test implementation
});

/**
 * @ai-skip Complex error scenario
 * @ai-reason Tests error recovery from malformed YAML/Markdown
 * @ai-todo Implement robust parser error handling first
 * @ai-note Current implementation may crash on invalid YAML
 */
it.skip('should handle corrupted markdown files', async () => {
  // test implementation
});
```

### Cross-Reference Example
```typescript
/**
 * @ai-intent Test concurrent async operations
 * @ai-related-files
 *   - src/database/knowledge-repository.ts (implementation being tested)
 *   - src/utils/markdown-parser.ts (parsing logic)
 *   - src/database/tag-repository.ts (tag auto-registration)
 * @ai-data-flow
 *   1. Create knowledge -> Parse markdown -> Write file
 *   2. Sync to SQLite -> Register tags
 * @ai-filesystem Files stored in {testDataDir}/knowledge/
 * @ai-compare-with Similar tests in doc-repository.test.ts
 */
test('should handle concurrent knowledge operations', async () => {
  // test implementation
});
```

## Integration Guidelines

1. **New Code**: Apply annotations during initial development
2. **Existing Code**: Add annotations when modifying or debugging
3. **Code Reviews**: Verify annotation accuracy and completeness
4. **Refactoring**: Update annotations to reflect changes

## Tools and Automation

1. **Linting**: Custom ESLint rules to enforce annotation standards
2. **Generation**: Scripts to generate annotation reports
3. **Validation**: Pre-commit hooks to check annotation quality
4. **IDE Support**: Snippets and templates for common patterns