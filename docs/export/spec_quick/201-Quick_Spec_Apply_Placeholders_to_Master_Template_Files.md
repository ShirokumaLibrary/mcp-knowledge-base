---
id: 201
type: spec_quick
title: "Quick Spec: Apply Placeholders to Master Template Files"
status: Open
priority: HIGH
description: "Apply {{MCP_NAME}} placeholders to all .shirokuma/agents and .shirokuma/commands files to complete Issue #184 implementation"
aiSummary: "Technical specification for replacing hardcoded MCP references with placeholders in template files to enable customizable instance names during setup"
tags: ["spec","setup","template","quick","placeholder"]
related: [184,200]
keywords: {"placeholder":1,"template":0.95,"mcp":0.9,"setup":0.9,"customization":0.85}
concepts: {"configuration":0.95,"automation":0.9,"template":0.9,"setup":0.85,"customization":0.85}
embedding: "j4CCnYCWl4CAgICCgJaAgJGAiKeAlo6AgICFi4CPgICLgICigJKDgICAgJKAhYCAg4CBkoCOgICAgIWRgICAgICAioeAgoeAgICQkoCFgICEgJKAgIWTgICAlo+AkICAjYCTiYCTl4CAgJKGgJaAgJGAi46AoJGAgICHgICSgIA="
createdAt: 2025-10-13T06:26:02.000Z
updatedAt: 2025-10-13T06:26:19.000Z
---

# Apply Placeholders to Master Template Files - Quick Spec

**Spec Type:** Quick Spec
**Estimated Effort:** 1-2 days
**Priority:** High
**Created:** 2025-10-13
**Status:** Draft
**Related Issues:** #184 (Completed), #200 (Open)

## Overview

**What:** Replace hardcoded `mcp__shirokuma-kb__*` references with `{{MCP_NAME}}__*` placeholders in all master template files

**Why:** Complete Issue #184 implementation so users can customize MCP instance names via `--mcp-name` option. Currently, PlaceholderEngine is implemented but master files still contain hardcoded references, making the setup command ineffective.

**Success Metric:** 
- Zero hardcoded `mcp__shirokuma-kb__*` references in `.shirokuma/agents/` and `.shirokuma/commands/`
- `shirokuma-kb setup --mcp-name test-kb` successfully generates `.claude/` files with `mcp__test-kb__*` references

## Requirements

### User Story
**As a** shirokuma-kb package maintainer
**I want** all master template files to use placeholders
**So that** users can customize MCP instance names and the setup command works as designed in Issue #184

### Acceptance Criteria
- [ ] All `.shirokuma/agents/*.md` files use `{{MCP_NAME}}__*` instead of `mcp__shirokuma-kb__*`
- [ ] All `.shirokuma/commands/**/*.md` files use `{{MCP_NAME}}__*` instead of `mcp__shirokuma-kb__*`
- [ ] No hardcoded `mcp__shirokuma-kb__*` references remain in master files
- [ ] Running `shirokuma-kb setup --mcp-name my-kb` creates `.claude/` files with `mcp__my-kb__*`
- [ ] Running `shirokuma-kb setup` (default) creates `.claude/` files with `mcp__shirokuma-kb__*`
- [ ] All existing functionality continues to work with default MCP name

### Constraints
- **Technical:** Must preserve exact formatting and structure of template files
- **Business:** Cannot break existing installations (backward compatibility)
- **Timeline:** High priority - blocking v0.9.1 full release

## Implementation Plan

### Prerequisites
- [ ] PlaceholderEngine already implemented (src/setup/placeholder-engine.ts)
- [ ] SetupCommand already integrated (src/setup/setup-command.ts)
- [ ] Verify no other hardcoded references outside .shirokuma/

### Core Tasks

#### 1. Create Placeholder Replacement Script
**Estimate:** 2 hours

Create a script to safely replace all hardcoded MCP references:
- Scan `.shirokuma/agents/` and `.shirokuma/commands/` recursively
- Find all instances of `mcp__shirokuma-kb__`
- Replace with `{{MCP_NAME}}__`
- Create backup before execution
- Log all changes made

**Implementation Notes:**
```typescript
// Script: scripts/apply-placeholders.ts
// Pattern: mcp__shirokuma-kb__ → {{MCP_NAME}}__
// Scope: .shirokuma/agents/**/*.md, .shirokuma/commands/**/*.md
```

#### 2. Execute Replacement on Agent Files
**Estimate:** 1 hour

Apply replacement to all agent definition files:
- `.shirokuma/agents/shirokuma-issue-manager.md`
- `.shirokuma/agents/shirokuma-knowledge-curator.md`
- `.shirokuma/agents/shirokuma-mcp-specialist.md`
- `.shirokuma/agents/shirokuma-methodology-keeper.md`
- `.shirokuma/agents/shirokuma-researcher.md`
- `.shirokuma/agents/shirokuma-reviewer.md`
- `.shirokuma/agents/shirokuma-system-harmonizer.md`
- All other agent files

**Affected Patterns:**
```markdown
# Before
tools: mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__create_item

# After
tools: {{MCP_NAME}}__get_items, {{MCP_NAME}}__create_item
```

#### 3. Execute Replacement on Command Files
**Estimate:** 1 hour

Apply replacement to all command definition files:
- Recursively process `.shirokuma/commands/`
- Handle all subdirectories
- Preserve directory structure
- Update all `.md` files

**Example Files:**
- `.shirokuma/commands/kuma:start.md`
- `.shirokuma/commands/kuma:issue.md`
- `.shirokuma/commands/spec/*.md`
- `.shirokuma/commands/vibe/*.md`
- `.shirokuma/commands/shared/*.md`

#### 4. Verify Placeholder Application
**Estimate:** 1 hour

Run verification checks:
```bash
# Check placeholders are present
grep -r "{{MCP_NAME}}" .shirokuma/agents/ .shirokuma/commands/

# Verify no hardcoded references remain
grep -r "mcp__shirokuma-kb__" .shirokuma/agents/ .shirokuma/commands/

# Should return no results (or only in documentation/comments)
```

#### 5. Test Setup Command with Custom MCP Name
**Estimate:** 2 hours

End-to-end testing:
```bash
# Test 1: Default MCP name
shirokuma-kb setup
grep -r "mcp__shirokuma-kb__" .claude/agents/ .claude/commands/

# Test 2: Custom MCP name
shirokuma-kb setup --mcp-name test-kb --force
grep -r "mcp__test-kb__" .claude/agents/ .claude/commands/

# Test 3: Another custom name
shirokuma-kb setup --mcp-name my-kb --force
grep -r "mcp__my-kb__" .claude/agents/ .claude/commands/

# Test 4: Rebuild functionality
shirokuma-kb setup --rebuild
```

#### 6. Update Documentation
**Estimate:** 2 hours

Document placeholder usage:
- **README.md**: Add section on template customization
- **CONTRIBUTING.md**: Guidelines for creating new templates
- **Template Guide**: Create `.shirokuma/docs/template-guide.md`

**Documentation Topics:**
- How placeholders work
- When to use `{{MCP_NAME}}` vs hardcoded values
- How to test template changes locally
- Placeholder reference (MCP_NAME, WORKSPACE_FOLDER)

### Testing Tasks

- [ ] **Unit Tests:** Test placeholder replacement logic
  - Verify regex patterns work correctly
  - Test edge cases (comments, code blocks, examples)
  - Ensure no over-replacement

- [ ] **Integration Tests:** Full setup workflow
  - Test default MCP name generation
  - Test custom MCP name generation
  - Test rebuild functionality
  - Verify all generated files are valid

- [ ] **Manual Testing:** Real-world scenarios
  - Install package in test project
  - Run setup with various MCP names
  - Verify Claude Code reads generated files correctly
  - Test agent and command execution

### Documentation Tasks

- [ ] **README.md:** Add "Template Customization" section
- [ ] **CONTRIBUTING.md:** Add template development guidelines
- [ ] **Template Guide:** Create comprehensive placeholder guide
- [ ] **Issue #184:** Update with completion notes
- [ ] **Issue #200:** Close with resolution summary

## Technical Notes

### Files to Modify

**Master Template Files (7+ agents, 20+ commands):**
```
.shirokuma/
├── agents/
│   ├── shirokuma-issue-manager.md
│   ├── shirokuma-knowledge-curator.md
│   ├── shirokuma-mcp-specialist.md
│   ├── shirokuma-methodology-keeper.md
│   ├── shirokuma-researcher.md
│   ├── shirokuma-reviewer.md
│   ├── shirokuma-system-harmonizer.md
│   └── ... (other agents)
└── commands/
    ├── kuma:start.md
    ├── kuma:issue.md
    ├── spec/
    │   ├── quick.md
    │   ├── micro.md
    │   └── ... (other spec commands)
    ├── vibe/
    │   ├── code.md
    │   ├── tdd.md
    │   └── ... (other vibe commands)
    └── shared/
        └── mcp-rules.markdown
```

**Documentation Files:**
- `README.md` - Add template customization section
- `CONTRIBUTING.md` - Add template guidelines
- `.shirokuma/docs/template-guide.md` - New file

**Script Files:**
- `scripts/apply-placeholders.ts` - New replacement script

### Dependencies

**Internal:**
- PlaceholderEngine (src/setup/placeholder-engine.ts) - Already implemented ✅
- SetupCommand (src/setup/setup-command.ts) - Already implemented ✅
- FileOperations (src/setup/file-operations.ts) - Existing utility

**External:**
- No new external dependencies required
- Uses standard Node.js `fs`, `path` modules

### Risks & Mitigation

**Risk 1: Accidental Over-Replacement**
- **Description:** Replacing valid documentation examples or comments
- **Mitigation:** 
  - Create backup before replacement
  - Use precise regex: `mcp__shirokuma-kb__` (with double underscore)
  - Manual review of changes before commit
  - Test on copy first

**Risk 2: Breaking Existing Installations**
- **Description:** Users with existing `.shirokuma/` files may break
- **Mitigation:**
  - This only affects new installations and `--rebuild`
  - Document migration in changelog
  - Provide `shirokuma-kb setup --rebuild` to update

**Risk 3: Missing Some References**
- **Description:** References in unexpected locations
- **Mitigation:**
  - Comprehensive grep before and after
  - Test with multiple MCP names
  - Code review checklist

**Risk 4: Template Syntax Errors**
- **Description:** Malformed placeholders after replacement
- **Mitigation:**
  - Validate placeholder syntax: `{{MCP_NAME}}`
  - Test generated files load correctly
  - Automated validation script

## Definition of Done

- [ ] All hardcoded `mcp__shirokuma-kb__*` replaced with `{{MCP_NAME}}__*` in master files
- [ ] Verification scripts confirm zero hardcoded references
- [ ] `shirokuma-kb setup --mcp-name test-kb` generates correct `.claude/` files
- [ ] All integration tests passing
- [ ] Documentation updated (README, CONTRIBUTING, Template Guide)
- [ ] Code reviewed and approved
- [ ] Changes committed with conventional commit message
- [ ] Issue #200 closed
- [ ] Issue #184 updated with completion notes

## Additional Notes

### Placeholder Reference

Currently defined placeholders (from Issue #184):
- `{{MCP_NAME}}` - MCP tool prefix (e.g., `mcp__shirokuma-kb`)
- `{{WORKSPACE_FOLDER}}` - Project root path

**Usage Examples:**
```markdown
# Agent Definition
tools: {{MCP_NAME}}__get_items, {{MCP_NAME}}__create_item

# Command Definition
Tool: {{MCP_NAME}}__search_items
Parameters:
  query: "search term"
```

### Future Enhancements

Potential future placeholders (not in this spec):
- `{{PROJECT_NAME}}` - User's project name
- `{{DATA_DIR}}` - Data directory path
- `{{EXPORT_DIR}}` - Export directory path

These can be added later if needed without breaking existing templates.