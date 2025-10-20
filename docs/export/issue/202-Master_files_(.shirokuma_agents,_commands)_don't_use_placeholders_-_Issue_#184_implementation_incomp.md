---
id: 202
type: issue
title: "Master files (.shirokuma/agents, commands) don't use placeholders - Issue #184 implementation incomplete"
status: Completed
priority: HIGH
description: "The package distribution system (Issue #184) implemented placeholder replacement for user projects via apply-placeholders script, but the master files in `.shirokuma/agents/` and `.shirokuma/commands/` still contain `{{MCP_NAME}}` placeholders that should be actual MCP tool names like `mcp__shirokuma-kb-prod__`."
aiSummary: "Incomplete MCP placeholder replacement implementation - master files contain {{MCP_NAME}} templates instead of actual instance names like mcp__shirokuma-kb-prod__"
tags: ["bug","v0.9.1","distribution","placeholders"]
related: [184]
keywords: {"placeholder":1,"mcp":0.9,"replacement":0.9,"command":0.8,"agent":0.8}
concepts: {"configuration":0.9,"template":0.85,"distribution":0.85,"integration":0.75,"automation":0.7}
embedding: "gICCiYCTlICAgICCkICHgICAipWAo4yAgICFjIiAj4CAgIGagJuDgIKAgJSAgIWAgICBkoCNgICKgIWTgYCAgICAjIaAhoeAkYCRlYmAhICAgJaAgI2RgJGAl5GRgI6AgICWhYCblYCJgJOHkYCVgICAjYCAo4+AgYCIgJKAkYA="
createdAt: 2025-10-18T02:53:31.000Z
updatedAt: 2025-10-18T02:59:02.000Z
---

## Problem

Issue #184 introduced a placeholder replacement system for distributing `.shirokuma/` files to user projects. However, the **master files** used incorrect placeholder format.

### Root Cause

Templates used `{{MCP_NAME}}__get_items` format, but MCP tools require `mcp__` prefix:
- **Incorrect**: `{{MCP_NAME}}__get_items` → becomes `shirokuma-kb__get_items` ❌
- **Correct**: `mcp__{{MCP_NAME}}__get_items` → becomes `mcp__shirokuma-kb__get_items` ✅

### Impact

- Commands in user projects would have invalid MCP tool names
- `shirokuma-kb setup` would generate broken `.claude/` files
- Claude Code cannot invoke MCP operations

## Solution ✅

Replace placeholder format in all template files:
- **From**: `{{MCP_NAME}}__*` or hardcoded `mcp__shirokuma-kb__*`
- **To**: `mcp__{{MCP_NAME}}__*`

### Implementation Complete

**Changes Made** (30 files):

1. **Agent Templates** (7 files):
   - `.shirokuma/agents/shirokuma-issue-manager.md`
   - `.shirokuma/agents/shirokuma-knowledge-curator.md`
   - `.shirokuma/agents/shirokuma-mcp-specialist.md`
   - `.shirokuma/agents/shirokuma-methodology-keeper.md`
   - `.shirokuma/agents/shirokuma-researcher.md`
   - `.shirokuma/agents/shirokuma-reviewer.md`
   - `.shirokuma/agents/shirokuma-system-harmonizer.md`

2. **Command Templates** (22 files):
   - `.shirokuma/commands/kuma/*.md` (finish, go, issue, spec, vibe)
   - `.shirokuma/commands/kuma/spec/*.md` (check, design, micro, quick, refine, req, steering, tasks, validate, when)
   - `.shirokuma/commands/kuma/spec/docs/*.markdown` (README, workflow-examples)
   - `.shirokuma/commands/kuma/vibe/*.md` (code, commit, spec)
   - `.shirokuma/commands/shared/*.markdown` (mcp-rules, steering-loader)

3. **Documentation** (1 file):
   - `.shirokuma/docs/template-guide.md` - Already correctly documented

### Verification

```bash
# Correct format (121 references)
$ grep -r "mcp__{{MCP_NAME}}" .shirokuma/ | wc -l
121

# No incorrect formats
$ grep -r "{{MCP_NAME}}__" .shirokuma/ | grep -v "mcp__{{MCP_NAME}}" | wc -l
0
```

### Example Fix

**Before**:
```markdown
tools: mcp__shirokuma-kb__get_items
Tool: {{MCP_NAME}}__create_item
```

**After**:
```markdown
tools: mcp__{{MCP_NAME}}__get_items
Tool: mcp__{{MCP_NAME}}__create_item
```

**User Project (after `shirokuma-kb setup`)**:
```markdown
tools: mcp__shirokuma-kb__get_items
Tool: mcp__shirokuma-kb__create_item
```

### Template-Guide Documentation

The [template-guide.md](.shirokuma/docs/template-guide.md:51-74) now clearly explains:
- Master files use `mcp__{{MCP_NAME}}__` format
- Placeholders are replaced during `shirokuma-kb setup`
- User projects get actual MCP tool names

Ready for commit.