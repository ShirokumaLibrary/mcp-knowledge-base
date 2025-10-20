---
id: 203
type: issue
title: "Reorganize .shirokuma/commands/shared into fixed (shared) and customizable (config) directories"
status: Open
priority: MEDIUM
description: "Split .shirokuma/commands/shared into two directories: .shirokuma/commands/kuma/shared (fixed package files) and .shirokuma/commands/kuma/config (user-customizable project settings)"
aiSummary: "Reorganize .shirokuma/commands/shared into fixed (shared) and customizable (config) directories Split .shirokuma/commands/shared into two directories: .shirokuma/commands/kuma/shared (fixed package fi..."
tags: ["architecture","v0.9.1","distribution","refactor"]
related: [184,202]
keywords: {"markdown":0.59,"shared":0.42,"files":0.39,"config":0.37,"shirokuma":0.37}
embedding: "gICAgIGAgImAgICegICUpYCAgICAgICCgYCAnoCAlayAgICAg4CAiImAgJGAgJCjgICAgIiAgJWRgICKgICXkYCAgICKgICdkYCAgYCAlYiAgICAh4CAmYqAgIaAgI2PgICAgIKAgIyCgICWgICGiICAgICFgICWh4CAoYCAjpM="
createdAt: 2025-10-18T03:02:10.000Z
updatedAt: 2025-10-18T03:02:40.000Z
---

## Current State

### Directory Structure
```
.shirokuma/commands/
├── kuma/               # Command definitions
│   ├── start.md
│   ├── issue.md
│   └── ...
└── shared/             # Shared includes (9 files)
    ├── lang.markdown           # Language rules (25 references)
    ├── mcp-rules.markdown      # MCP usage guide
    ├── steering-loader.markdown
    ├── ears-format.markdown
    ├── spec-logic.md
    ├── spec-prompts.markdown
    ├── spec-templates.markdown
    ├── spec-vibe-rules.markdown
    └── tdd-methodology.markdown
```

### Current Usage Pattern

All command files reference shared files via:
```markdown
## Language
@.shirokuma/commands/shared/lang.markdown

## MCP Rules
@.shirokuma/commands/shared/mcp-rules.markdown
```

**25 command files** reference `lang.markdown` (used in every command)

## Problem

The current `shared/` directory mixes two different types of files:

1. **Fixed package files** - Should never change between projects
   - `ears-format.markdown` - EARS specification format (standard)
   - `spec-logic.md` - Spec workflow logic (standard)
   - `spec-prompts.markdown` - Standard prompts (standard)
   - `spec-templates.markdown` - Standard templates (standard)
   - `spec-vibe-rules.markdown` - Vibe workflow rules (standard)
   - `tdd-methodology.markdown` - TDD principles (standard)
   - `steering-loader.markdown` - Steering loading logic (standard)

2. **Project-customizable files** - Should adapt to each project
   - `lang.markdown` - Language preferences (project-specific)
   - `mcp-rules.markdown` - MCP configuration (project-specific)

### Issues

- **Unclear distinction** - Users don't know which files to customize
- **Distribution confusion** - Should fixed files be distributed as templates?
- **Update conflicts** - Package updates may overwrite user customizations
- **Documentation gap** - No clear guidance on customization

## Proposed Solution

### New Directory Structure

```
.shirokuma/commands/kuma/
├── shared/             # Fixed package files (read-only for users)
│   ├── ears-format.markdown
│   ├── spec-logic.md
│   ├── spec-prompts.markdown
│   ├── spec-templates.markdown
│   ├── spec-vibe-rules.markdown
│   ├── tdd-methodology.markdown
│   └── steering-loader.markdown
│
└── config/             # User-customizable configuration
    ├── lang.markdown           # Project language preferences
    └── mcp-rules.markdown      # Project MCP setup
```

### Benefits

1. **Clear separation** - Users know `config/` is for customization
2. **Safe updates** - Package updates only touch `shared/`, never `config/`
3. **Better documentation** - Clear distinction in README
4. **Template system** - `config/` files can have defaults with override capability

### Migration Plan

#### Phase 1: File Movement
1. Create `.shirokuma/commands/kuma/shared/`
2. Move 7 fixed files to `shared/`
3. Create `.shirokuma/commands/kuma/config/`
4. Move 2 customizable files to `config/`

#### Phase 2: Update References
Update all 25+ command files:
```diff
- @.shirokuma/commands/shared/lang.markdown
+ @.shirokuma/commands/kuma/config/lang.markdown

- @.shirokuma/commands/shared/ears-format.markdown
+ @.shirokuma/commands/kuma/shared/ears-format.markdown
```

#### Phase 3: Distribution Strategy
- **`shared/`** → Copy to user projects (read-only)
- **`config/`** → Create from templates with placeholders
- **Setup command** → Create `config/` on first run if missing

#### Phase 4: Documentation
- Update README.md with new structure
- Add CONFIGURATION.md explaining `config/` customization
- Update template-guide.md with new paths

## Investigation Needed

### Questions to Answer

1. **Setup Integration**
   - How should `shirokuma-kb setup` handle `config/` directory?
   - Should it create default `config/` files if missing?
   - What happens on updates - preserve user `config/`?

2. **File Classification**
   - Are there other files that should be in `config/`?
   - Should `mcp-rules.markdown` be partially fixed, partially configurable?

3. **Backward Compatibility**
   - Should old `@.shirokuma/commands/shared/` paths still work?
   - Migration path for existing user projects?

4. **Template Placeholders**
   - Should `config/lang.markdown` have placeholders?
   - Should `config/mcp-rules.markdown` use `{{MCP_NAME}}`?

### Research Tasks

- [ ] Analyze `shirokuma-kb setup` command implementation
- [ ] Review how other tools handle fixed vs. customizable files
- [ ] Check all `@.shirokuma/commands/shared/` references
- [ ] Determine which shared files could be project-specific
- [ ] Design template system for `config/` files

## Success Criteria

- ✅ Clear separation between fixed and customizable files
- ✅ Zero ambiguity about which files users can modify
- ✅ Safe package updates without overwriting user config
- ✅ Backward compatible migration path
- ✅ Comprehensive documentation

## Related Issues

- #184 - Package distribution system (context for this refactor)
- #202 - Placeholder format fix (related to template system)