# TypeScript to YAML/Markdown Conversion Rules

## Conversion Patterns

### 1. MCP API Calls
**From TypeScript:**
```typescript
const items = await mcp.search_items({
  query: "pattern",
  types: ["issue", "knowledge"],
  limit: 10
});
```

**To YAML Description:**
```yaml
# Search for items matching pattern
- Tool: mcp__shirokuma-kb__search_items
  Parameters:
    query: "pattern"
    types: ["issue", "knowledge"]
    limit: 10
  Purpose: Find related items for context
```

### 2. Function Definitions
**From TypeScript:**
```typescript
async function analyzeSpec(id: number) {
  const spec = await mcp.get_item({ id });
  return validateSpec(spec);
}
```

**To Process Description:**
```markdown
## Spec Analysis Process
1. Retrieve spec by ID using mcp__shirokuma-kb__get_item
2. Validate spec structure and completeness
3. Return validation results
```

### 3. Interface Definitions
**From TypeScript:**
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

**To Structure Definition:**
```yaml
## Validation Result Structure
- isValid: Boolean indicating overall validity
- errors: List of validation errors
- warnings: List of validation warnings
```

### 4. Task Tool Calls
**From TypeScript:**
```typescript
await Task.tool('agent-name', {
  prompt: "Do something",
  context: data
});
```

**To Agent Invocation:**
```markdown
## Agent Invocation
- Agent: agent-name
- Purpose: Do something
- Context: Provide relevant data
```

### 5. Import Statements
**From TypeScript:**
```typescript
import { create_item, search_items } from '@mcp/api';
```

**To Tool References:**
```markdown
## Required Tools
- mcp__shirokuma-kb__create_item
- mcp__shirokuma-kb__search_items
```

### 6. Complex Logic
**From TypeScript:**
```typescript
const message = generateCommitMessage({
  changes: analyzedChanges,
  format: steering.gitWorkflow.format,
  types: steering.gitWorkflow.types,
  recentCommits: getRecentCommits(5)
});
```

**To Process Steps:**
```markdown
## Commit Message Generation
1. Analyze changes from git diff
2. Load commit format from steering document
3. Get valid commit types from configuration
4. Review recent commits for style consistency
5. Generate appropriate commit message
```

## General Guidelines

1. **Remove all code blocks** with ```typescript or ```javascript
2. **Convert logic to prose** - Describe what should happen, not how
3. **Use YAML for structured data** when appropriate
4. **Maintain clarity** - The intent must be clear without code
5. **Reference tools explicitly** - Use full MCP tool names
6. **Document processes** - Turn functions into step-by-step descriptions
7. **Keep examples minimal** - Show patterns, not implementations

## Special Cases

### Steering Loader References
- Keep references to steering documents
- Convert loading logic to descriptive text
- Maintain steering field paths

### Validation Logic
- Convert to checklist format
- Use bullet points for conditions
- Describe expected outcomes

### Error Handling
- Document error scenarios
- Describe recovery strategies
- List validation requirements

## Files Requiring Special Attention

1. **steering-loader.markdown** - Heavy MCP usage
2. **vibe/commit.md** - Multiple code examples
3. **spec.md** - Core workflow logic
4. **shirokuma-knowledge-curator.md** - Complex MCP operations

## Verification Checklist

After conversion, verify:
- [ ] No TypeScript/JavaScript code remains
- [ ] All processes are clearly described
- [ ] Tool usage is explicit
- [ ] Examples use YAML/Markdown only
- [ ] Intent is preserved
- [ ] Documentation is AI-readable