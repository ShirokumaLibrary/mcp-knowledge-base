# Template Development Guide

This guide explains how to create and maintain agent and command templates for SHIROKUMA Knowledge Base.

## Table of Contents

1. [Overview](#overview)
2. [Placeholder System](#placeholder-system)
3. [Agent Templates](#agent-templates)
4. [Command Templates](#command-templates)
5. [Testing Templates](#testing-templates)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)

## Overview

Templates are the foundation of SHIROKUMA Knowledge Base's portability. They use placeholders that adapt to different project configurations automatically.

### Template Locations

```
.shirokuma/
├── agents/          # Agent definition templates
│   ├── shirokuma-issue-manager.md
│   ├── shirokuma-reviewer.md
│   └── ...
└── commands/        # Command definition templates
    ├── kuma/
    │   ├── start.md
    │   ├── issue.md
    │   └── ...
    └── shared/
        ├── lang.markdown
        └── mcp-rules.markdown
```

### Build Process

```
.shirokuma/          -->  Placeholder Engine  -->  .claude/
(Master Templates)        (Replacement)            (Runtime Files)
```

1. **Edit**: Modify templates in `.shirokuma/`
2. **Rebuild**: Run `shirokuma-kb setup --rebuild`
3. **Apply**: Placeholders replaced based on config
4. **Use**: Claude Code reads `.claude/` files

## Placeholder System

### Master Files vs. User Projects

**IMPORTANT**: The shirokuma-kb repository uses a two-tier placeholder system:

#### Master Files (This Repository)
- **Location**: `.shirokuma/agents/`, `.shirokuma/commands/`
- **MCP Reference**: `mcp__{{MCP_NAME}}` (actual instance name)
- **Why**: These files are used directly by Claude Code in this project
- **Example**: `mcp__{{MCP_NAME}}__get_items`

#### User Project Files (After Distribution)
- **Location**: User's `.claude/agents/`, `.claude/commands/`
- **MCP Reference**: Customizable via `shirokuma-kb setup --mcp-name`
- **Why**: Users may have different MCP instance names
- **Example**: `mcp__my-kb__get_items` (after setup with `--mcp-name my-kb`)

**The Workflow**:
```
Master Files                    User Project Files
(.shirokuma/)                   (.claude/)
    ↓                               ↓
mcp__{{MCP_NAME}}  →   mcp__{{USER_MCP_NAME}}__
(Actual instance)              (Replaced during setup)
```

### Available Placeholders

| Placeholder | Description | Default | Example Custom |
|-------------|-------------|---------|----------------|
| `mcp__{{MCP_NAME}}` | MCP tool prefix | `mcp__shirokuma-kb` | `mcp__my-kb` |
| `{{WORKSPACE_FOLDER}}` | Project root | `/path/to/project` | `/home/user/app` |

### Usage Rules

**DO**:
- ✅ Use `mcp__{{MCP_NAME}}__get_items`
- ✅ Use `mcp__{{MCP_NAME}}__create_item`
- ✅ Use `{{WORKSPACE_FOLDER}}/.shirokuma/data`

**DON'T**:
- ❌ Hardcode `mcp__shirokuma-kb__get_items`
- ❌ Hardcode `/home/user/project/data`
- ❌ Mix placeholders and hardcoded values

### Replacement Examples

**Before** (`.shirokuma/agents/my-agent.md`):
```markdown
tools: mcp__{{MCP_NAME}}__get_items, mcp__{{MCP_NAME}}__create_item

Tool: mcp__{{MCP_NAME}}__search_items
Parameters:
  query: "test"
```

**After `shirokuma-kb setup --mcp-name my-kb`** (`.claude/agents/my-agent.md`):
```markdown
tools: mcp__my-kb__get_items, mcp__my-kb__create_item

Tool: mcp__my-kb__search_items
Parameters:
  query: "test"
```

## Agent Templates

### Agent Structure

```markdown
---
description: One-line agent purpose
allowed-tools: Read, Write, mcp__{{MCP_NAME}}__get_items, mcp__{{MCP_NAME}}__create_item
---

# Agent Name

## Purpose

Detailed description of agent's role and responsibilities.

## When to Use

Scenarios where this agent should be invoked.

## Tool Usage

### MCP Operations

```yaml
# Example MCP tool usage
Tool: mcp__{{MCP_NAME}}__create_item
Parameters:
  type: "issue"
  title: "Issue title"
  content: "Issue content"
```

### File Operations

```yaml
# Example file operation
Tool: Read
Parameters:
  file_path: "/path/to/file.ts"
```

## Examples

### Example 1: Basic Usage

Description of example...

### Example 2: Advanced Usage

Description of advanced example...

## Best Practices

- List relevant best practices
- Include tips and tricks
```

### Agent Template Checklist

When creating an agent template:

- [ ] Use `mcp__{{MCP_NAME}}` for all MCP tool references
- [ ] Include clear purpose statement
- [ ] Document all allowed tools
- [ ] Provide usage examples
- [ ] Add YAML snippets for tool invocations
- [ ] Test with `--rebuild` command

### Agent Examples

#### Minimal Agent

```markdown
---
description: Simple data retrieval agent
allowed-tools: Read, mcp__{{MCP_NAME}}__get_items
---

# Data Fetcher

## Purpose

Retrieves data from knowledge base.

## Tool Usage

```yaml
Tool: mcp__{{MCP_NAME}}__get_items
Parameters:
  type: "issue"
  limit: 10
```
```

#### Complex Agent

```markdown
---
description: Full-featured code review agent
allowed-tools: Read, Grep, mcp__{{MCP_NAME}}__get_items, mcp__{{MCP_NAME}}__create_item, mcp__{{MCP_NAME}}__search_items
---

# Code Reviewer

## Purpose

Performs comprehensive code reviews with knowledge base integration.

## When to Use

- After completing implementation
- Before creating pull requests
- For security audits

## Tool Usage

### Search Related Issues

```yaml
Tool: mcp__{{MCP_NAME}}__search_items
Parameters:
  query: "code review patterns"
  types: ["knowledge", "pattern"]
```

### Record Review Results

```yaml
Tool: mcp__{{MCP_NAME}}__create_item
Parameters:
  type: "review"
  title: "Code review: [component]"
  content: "[review findings]"
  tags: ["review", "quality"]
```
```

## Command Templates

### Command Structure

```markdown
---
description: Brief command description
argument-hint: "'arg1' | arg2 <value>"
allowed-tools: Read, Write, mcp__{{MCP_NAME}}__get_items, mcp__{{MCP_NAME}}__create_item, TodoWrite
---

# /kuma:command-name - Command Title

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Detailed command description.

## Usage

```bash
/kuma:command-name arg1
/kuma:command-name arg2 value
```

## Arguments

- `arg1` - Description of first argument
- `arg2 <value>` - Description of second argument with value

## Workflow

1. **Step 1**: Description of first step
2. **Step 2**: Description of second step
3. **Step 3**: Description of final step

## MCP Storage

```yaml
# Store command results
Tool: mcp__{{MCP_NAME}}__create_item
Parameters:
  type: "command_result"
  title: "Result title"
  content: "[output]"
  tags: ["command", "automated"]
```

## Examples

### Example 1: Basic Usage

```bash
/kuma:command-name simple-arg
```

Output description...

### Example 2: Advanced Usage

```bash
/kuma:command-name complex-arg --option
```

Output description...
```

### Command Template Checklist

When creating a command template:

- [ ] Use `mcp__{{MCP_NAME}}` for all MCP tool references
- [ ] Include `@.shirokuma/commands/shared/lang.markdown`
- [ ] Document all arguments clearly
- [ ] Provide usage examples
- [ ] Explain MCP storage strategy
- [ ] Show expected outputs
- [ ] Test with various arguments

## Testing Templates

### Manual Testing

```bash
# 1. Edit template in .shirokuma/
vim .shirokuma/agents/my-agent.md

# 2. Verify no hardcoded references
grep -r 'mcp__shirokuma-kb__' .shirokuma/agents/my-agent.md
# Should return nothing

# 3. Rebuild .claude/ files
shirokuma-kb setup --rebuild

# 4. Verify placeholders replaced
grep -r 'mcp__{{MCP_NAME}}' .claude/agents/my-agent.md
# Should return nothing

# 5. Check replacement worked
grep -r 'mcp__shirokuma-kb__' .claude/agents/my-agent.md | head -3
# Should show replaced MCP tool names
```

### Testing with Custom MCP Name

```bash
# Create test project
mkdir -p /tmp/template-test
cd /tmp/template-test

# Setup with custom name
shirokuma-kb setup --mcp-name test-kb

# Verify custom name applied
grep -r 'mcp__test-kb__' .claude/agents/ | wc -l
# Should be > 0

# Verify no unreplaced placeholders
grep -r 'mcp__{{MCP_NAME}}' .claude/agents/
# Should return nothing
```

### Automated Testing

Add to your test suite:

```typescript
import { describe, it, expect } from 'vitest';
import { PlaceholderEngine } from '../src/setup/placeholder-engine.js';

describe('Template Placeholders', () => {
  it('should replace MCP_NAME in agent tools', () => {
    const engine = new PlaceholderEngine('test-kb', '/test');
    const template = 'tools: mcp__{{MCP_NAME}}__get_items';
    const result = engine.replace(template);
    expect(result).toBe('tools: mcp__test-kb__get_items');
  });

  it('should not leave unreplaced placeholders', () => {
    const engine = new PlaceholderEngine('custom', '/proj');
    const template = 'Tool: mcp__{{MCP_NAME}}__create_item';
    const result = engine.replace(template);
    expect(result).not.toContain('mcp__{{MCP_NAME}}');
  });
});
```

## Best Practices

### 1. Always Use Placeholders

**Good**:
```markdown
Tool: mcp__{{MCP_NAME}}__get_items
```

**Bad**:
```markdown
Tool: mcp__shirokuma-kb__get_items
```

### 2. Consistent Formatting

**Good**:
```markdown
## MCP Operations

### Get Items
Tool: mcp__{{MCP_NAME}}__get_items

### Create Item
Tool: mcp__{{MCP_NAME}}__create_item
```

**Bad**:
```markdown
## MCP Operations
Get items: mcp__{{MCP_NAME}}__get_items
Create item: mcp__{{MCP_NAME}}__create_item
```

### 3. Clear Documentation

**Good**:
```markdown
## Parameters

- `type` (string, required): Item type (e.g., "issue", "spec")
- `limit` (number, optional): Maximum results (default: 20)
```

**Bad**:
```markdown
## Parameters

type, limit
```

### 4. Practical Examples

**Good**:
```yaml
# Search for authentication issues
Tool: mcp__{{MCP_NAME}}__search_items
Parameters:
  query: "authentication security"
  types: ["issue", "knowledge"]
  limit: 10
```

**Bad**:
```yaml
Tool: mcp__{{MCP_NAME}}__search_items
```

### 5. Error Handling

**Good**:
```markdown
## Error Handling

If the MCP tool returns an error:
1. Check MCP server is running
2. Verify item type exists
3. Check required parameters provided
```

**Bad**:
```markdown
(No error handling documentation)
```

## Common Patterns

### Pattern 1: Basic Item Creation

```yaml
Tool: mcp__{{MCP_NAME}}__create_item
Parameters:
  type: "[item-type]"
  title: "[item-title]"
  description: "[brief-description]"
  content: "[detailed-content]"
  status: "Open"
  priority: "MEDIUM"
  tags: ["tag1", "tag2"]
```

### Pattern 2: Search and Filter

```yaml
# Search by query
Tool: mcp__{{MCP_NAME}}__search_items
Parameters:
  query: "[search-terms]"
  types: ["[type1]", "[type2]"]
  limit: 20

# Filter by type and status
Tool: mcp__{{MCP_NAME}}__list_items
Parameters:
  type: "[item-type]"
  status: "[status-name]"
  limit: 50
```

### Pattern 3: Related Items

```yaml
# Get related items
Tool: mcp__{{MCP_NAME}}__get_related_items
Parameters:
  id: [item-id]
  strategy: "hybrid"
  weights:
    keywords: 0.4
    embedding: 0.6
  depth: 2
```

### Pattern 4: State Management

```yaml
# Update current state
Tool: mcp__{{MCP_NAME}}__update_current_state
Parameters:
  content: "[state-description]"
  tags: ["session", "active"]
  metadata:
    lastUpdated: "[timestamp]"
    updatedBy: "[agent-name]"
```

## Troubleshooting

### Issue: Placeholders Not Replaced

**Problem**: `.claude/` files still contain `mcp__{{MCP_NAME}}`

**Solution**:
```bash
shirokuma-kb setup --rebuild --force
```

### Issue: Wrong MCP Name Applied

**Problem**: `.claude/` files have unexpected MCP name

**Solution**:
1. Check `.mcp.json` for actual MCP server name
2. Use `--mcp-name` explicitly:
   ```bash
   shirokuma-kb setup --mcp-name correct-name --force
   ```

### Issue: Template Changes Not Reflected

**Problem**: Edited `.shirokuma/` but `.claude/` unchanged

**Solution**:
```bash
# Always rebuild after editing templates
shirokuma-kb setup --rebuild
```

### Issue: Hardcoded References Found

**Problem**: `grep` finds hardcoded MCP references

**Solution**:
```bash
# Run the replacement script
npx tsx scripts/apply-placeholders.ts --backup
```

## Version Control

### .gitignore Recommendations

```gitignore
# Generated files - do not commit
.claude/agents/
.claude/commands/

# Environment-specific
.env
.mcp.json

# Data directory
.shirokuma/data/
.shirokuma/backup-*/

# Optional: Export directory
docs/export/
```

### What to Commit

- ✅ `.shirokuma/agents/` (templates with placeholders)
- ✅ `.shirokuma/commands/` (templates with placeholders)
- ✅ `.shirokuma/templates/` (config templates)
- ❌ `.claude/` (generated files)
- ❌ `.env` (environment-specific)
- ❌ `.shirokuma/data/` (user data)

## Future Enhancements

Planned placeholder additions:

- `{{PROJECT_NAME}}` - User's project name
- `{{DATA_DIR}}` - Resolved data directory path
- `{{EXPORT_DIR}}` - Resolved export directory path
- `{{VERSION}}` - Package version
- `{{TIMESTAMP}}` - Current timestamp

These will be added in future versions without breaking existing templates.

## Getting Help

- **Documentation**: [README.md](../../README.md)
- **Contributing**: [CONTRIBUTING.md](../../CONTRIBUTING.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/shirokuma-kb/issues)

## License

Template development follows the project's MIT License.
