---
allowed-tools: Read, Write, MultiEdit, mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__update_current_state, mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__update_item
description: Adjust and align SHIROKUMA.md rules with ai-start/ai-finish commands
argument-hint: "[adjustment-type or issue-description]"
---

# ai-shirokuma - SHIROKUMA Rule Adjustment Command

## Usage
```
/ai-shirokuma [adjustment-type or issue-description]
```

Examples:
- `/ai-shirokuma` - General consistency check
- `/ai-shirokuma fix-memory-handling` - Fix specific issue
- `/ai-shirokuma update-workflow` - Update workflow patterns

## Task

Note: Respond to the user in their language.

### 1. Analyze Current Rules

Read and analyze the three core files:
- @SHIROKUMA.md - Main methodology document
- @.claude/commands/ai-start.md - Session start command
- @.claude/commands/ai-finish.md - Session end command

### 2. Identify Issues

Based on $ARGUMENTS or general analysis, check for:

1. **Consistency Issues**:
   - Mismatched workflows between SHIROKUMA.md and commands
   - Conflicting instructions or procedures
   - Outdated references or deprecated features

2. **Missing Elements**:
   - Features mentioned in one file but not others
   - Incomplete workflow descriptions
   - Missing error handling

3. **Redundancy**:
   - Duplicate instructions
   - Overlapping procedures
   - Unnecessary complexity

### 3. Propose Adjustments

Based on findings, propose specific changes:

```
## 🔍 [Analysis Results]

### [Consistency Status]
- ✅ [Aligned]: [What matches correctly]
- ⚠️ [Misaligned]: [What needs adjustment]
- ❌ [Missing]: [What's absent]

### [Recommended Changes]

#### SHIROKUMA.md
- [Change 1]: [Reason]
- [Change 2]: [Reason]

#### ai-start.md
- [Change 1]: [Reason]
- [Change 2]: [Reason]

#### ai-finish.md
- [Change 1]: [Reason]
- [Change 2]: [Reason]
```

### 4. Apply Adjustments (if approved)

If user approves changes:
1. Use MultiEdit to update files efficiently
2. Maintain version consistency
3. Preserve essential principles

### 5. Document Changes

Create decisions entry for significant adjustments:
```typescript
await create_item({
  type: "decisions",
  title: "[SHIROKUMA Rule Adjustment] - [Date]",
  content: `## [Decision]\n[What rule was changed/added]\n\n### [Reason]\n[Why this change was necessary]\n\n### [Impact]\n[How this affects the workflow]`,
  tags: ["shirokuma-rules", "methodology"]
})
```

### 6. Update current_state

Update project state to reflect methodology changes:
```typescript
await update_current_state({
  content: existing_content + "\n\n## [Methodology Update]\n- [Date]: [Summary of SHIROKUMA rule adjustments]",
  updated_by: "ai-shirokuma"
})
```

## Common Adjustment Scenarios

### Memory Management Issues
- AI not properly recovering context
- Session information lost
- current_state not being utilized

### Workflow Inefficiencies
- Redundant steps in ai-start/ai-finish
- Missing essential checkpoints
- Overly complex procedures

### Feature Additions
- New MCP capabilities
- Improved search functions
- Enhanced session tracking

### Bug Fixes
- Command execution errors
- Data consistency problems
- Integration issues

## Validation Checklist

After adjustments:
- [ ] All three files are consistent
- [ ] Workflows are complete and logical
- [ ] No conflicting instructions
- [ ] Essential principles preserved
- [ ] Commands execute without errors

## Output Format

```
## 🛠️ [SHIROKUMA Rule Adjustment Complete]

### [Files Updated]
- SHIROKUMA.md: [X changes]
- ai-start.md: [Y changes]
- ai-finish.md: [Z changes]

### [Key Improvements]
1. [Improvement 1]
2. [Improvement 2]

### [Next Steps]
- [Test the updated commands]
- [Monitor for issues]
- [Document any edge cases]

[Adjustment recorded in decisions: decisions-XX]
```