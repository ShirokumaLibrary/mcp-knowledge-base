---
id: 204
type: spec_quick
title: "Quick Spec: Reorganize shared/ into shared/ and config/ directories"
status: Open
priority: MEDIUM
description: "Split .shirokuma/commands/shared into fixed package files (shared/) and user-customizable configuration (config/)"
aiSummary: "Reorganization of .shirokuma/commands/shared/ directory into separate shared/ (fixed package files) and config/ (user-customizable) directories to prevent update conflicts, including migration of 9 files, updating 25+ command references, setup command modifications, and backward compatibility implementation."
tags: ["architecture","v0.9.1","spec","quick","refactor"]
related: [184,202,203]
keywords: {"directory":0.95,"config":0.9,"shared":0.9,"reorganize":0.9,"configuration":0.85}
concepts: {"file-system":0.95,"configuration-management":0.9,"package-management":0.85,"migration":0.8,"software-architecture":0.75}
embedding: "gICRmYCAiYCAgJaSgJKPgICAkJ+AgIGAgICdnoCMlICAgIiMgICBgICAjZ2AhJCAgICOgICAiICAgJ2TgICUgICAhYeAgJGAgICYkYCEjYCAgICQgICSgICAj5OAjISAgICCmICAi4CAgImVgJKAgICAi52AgJGAgICMlICPhYA="
createdAt: 2025-10-18T03:04:36.000Z
updatedAt: 2025-10-18T03:04:58.000Z
---

# Reorganize shared/ into shared/ and config/ - Quick Spec

**Spec Type:** Quick Spec
**Estimated Effort:** 2-3 days
**Priority:** Medium
**Created:** 2025-10-18
**Status:** Draft
**Related Issue:** #203

## Overview

**What:** Reorganize `.shirokuma/commands/shared/` directory into two separate directories: `shared/` (fixed package files) and `config/` (user-customizable configuration)

**Why:** 
- Clear separation of concerns between package-maintained files and user-customizable settings
- Prevent package updates from overwriting user customizations
- Improve user experience with explicit customization points

**Success Metric:** 
- Zero ambiguity about which files users can modify
- Safe package updates without config conflicts
- All 25+ command files correctly reference new paths

## Requirements

### User Story
**As a** shirokuma-kb user
**I want** clear separation between fixed package files and customizable configuration
**So that** I can safely customize my project settings without worrying about package updates overwriting my changes

### Acceptance Criteria
- [ ] Fixed files moved to `.shirokuma/commands/kuma/shared/` (7 files)
- [ ] Customizable files moved to `.shirokuma/commands/kuma/config/` (2 files)
- [ ] All 25+ command file references updated to new paths
- [ ] `shirokuma-kb setup` creates `config/` directory with default files
- [ ] Package updates preserve user `config/` files
- [ ] README.md documents the distinction clearly
- [ ] Backward compatibility maintained (old paths work with deprecation warning)
- [ ] Template-guide.md updated with new structure

### Constraints
- **Technical:** Must maintain backward compatibility for existing projects
- **Business:** Zero breaking changes for current users
- **Timeline:** Complete before v0.9.1 release

## Implementation Plan

### Prerequisites
- [ ] Backup current `.shirokuma/commands/shared/` directory
- [ ] Create migration test suite for validation

### Core Tasks

#### 1. **Directory Restructuring** - Create new structure
   - **Estimate:** 1 hour
   - **Details:**
     - Create `.shirokuma/commands/kuma/shared/` directory
     - Create `.shirokuma/commands/kuma/config/` directory
     - Move 7 fixed files to `shared/`:
       - `ears-format.markdown`
       - `spec-logic.md`
       - `spec-prompts.markdown`
       - `spec-templates.markdown`
       - `spec-vibe-rules.markdown`
       - `tdd-methodology.markdown`
       - `steering-loader.markdown`
     - Move 2 customizable files to `config/`:
       - `lang.markdown`
       - `mcp-rules.markdown`
     - Remove old `.shirokuma/commands/shared/` directory

#### 2. **Update Command File References** - Fix import paths
   - **Estimate:** 2-3 hours
   - **Details:**
     - Update 25+ command files with new paths:
       ```diff
       - @.shirokuma/commands/shared/lang.markdown
       + @.shirokuma/commands/kuma/config/lang.markdown
       
       - @.shirokuma/commands/shared/ears-format.markdown
       + @.shirokuma/commands/kuma/shared/ears-format.markdown
       ```
     - Create automated script for bulk path updates
     - Verify all references with grep search

#### 3. **Setup Command Integration** - Handle config/ directory
   - **Estimate:** 3-4 hours
   - **Details:**
     - Modify `src/setup/setup-command.ts`:
       - Copy `shared/` files to user projects (read-only)
       - Create `config/` directory if missing
       - Copy default `config/` templates with placeholders
       - Preserve existing user `config/` files on update
     - Add `--preserve-config` flag to setup command
     - Implement config file versioning system

#### 4. **Backward Compatibility Layer** - Support old paths
   - **Estimate:** 2 hours
   - **Details:**
     - Add deprecation warnings when old paths detected
     - Create symlinks or redirects for smooth migration
     - Document migration path in UPGRADING.md

#### 5. **Documentation Updates** - Guide users
   - **Estimate:** 2 hours
   - **Details:**
     - Update [README.md](../../README.md) with new structure
     - Create CONFIGURATION.md explaining `config/` customization
     - Update [template-guide.md](.shirokuma/docs/template-guide.md) with new paths
     - Add migration guide for existing projects

### Testing Tasks
- [ ] **Unit Tests:** Directory creation, file movement logic
- [ ] **Integration Tests:** Full setup workflow with new structure
- [ ] **Migration Tests:** Upgrade existing projects safely
- [ ] **Manual Testing:** 
  - Fresh install with `shirokuma-kb setup`
  - Update existing project with `shirokuma-kb setup --rebuild`
  - Verify config preservation on update

### Documentation Tasks
- [ ] **README.md:** Add "Customization" section
- [ ] **CONFIGURATION.md:** New file explaining config/ usage
- [ ] **template-guide.md:** Update with new directory structure
- [ ] **UPGRADING.md:** Migration guide for v0.9.1

## Technical Notes

### Files to Modify

**New Directories:**
- `.shirokuma/commands/kuma/shared/` (create)
- `.shirokuma/commands/kuma/config/` (create)

**Command Files to Update (25+):**
- `.shirokuma/commands/kuma/*.md` (all files)
- `.shirokuma/commands/kuma/spec/*.md` (all files)
- `.shirokuma/commands/kuma/vibe/*.md` (all files)

**Setup Command:**
- `src/setup/setup-command.ts` - Add config/ handling
- `src/setup/file-operations.ts` - Config preservation logic
- `src/setup/placeholder-engine.ts` - Config template processing

**Documentation:**
- `README.md` - New customization section
- `CONFIGURATION.md` - New file
- `.shirokuma/docs/template-guide.md` - Updated paths
- `UPGRADING.md` - Migration guide

### Dependencies
- **Internal:** 
  - Setup command system
  - Placeholder replacement system (Issue #202)
  - Package distribution system (Issue #184)
- **External:** None

### Risks & Mitigation

**Risk 1:** Breaking existing user projects
- **Mitigation:** 
  - Backward compatibility layer
  - Deprecation warnings before removal
  - Clear migration documentation
  - Test on real projects before release

**Risk 2:** Config files not preserved on update
- **Mitigation:**
  - Implement version-aware config handling
  - Add `--preserve-config` flag
  - Backup user config before update
  - Clear warning messages

**Risk 3:** Path updates incomplete (missing references)
- **Mitigation:**
  - Automated grep-based verification
  - Comprehensive test suite
  - Manual review of all command files

**Risk 4:** Setup command complexity increases
- **Mitigation:**
  - Modular code structure
  - Clear separation of concerns
  - Comprehensive unit tests

## Definition of Done
- [ ] All 9 files moved to correct directories
- [ ] All 25+ command references updated
- [ ] Setup command creates config/ with defaults
- [ ] Package updates preserve user config/
- [ ] Backward compatibility maintained
- [ ] All tests passing (unit, integration, migration)
- [ ] Documentation complete and accurate
- [ ] Reviewed and approved
- [ ] Deployed to staging for validation

## Migration Script Example

```typescript
// scripts/migrate-shared-to-config.ts
import { rename, copyFile } from 'fs/promises';
import { join } from 'path';

const SHARED_FILES = [
  'ears-format.markdown',
  'spec-logic.md',
  'spec-prompts.markdown',
  'spec-templates.markdown',
  'spec-vibe-rules.markdown',
  'tdd-methodology.markdown',
  'steering-loader.markdown'
];

const CONFIG_FILES = [
  'lang.markdown',
  'mcp-rules.markdown'
];

async function migrate() {
  const oldShared = '.shirokuma/commands/shared';
  const newShared = '.shirokuma/commands/kuma/shared';
  const newConfig = '.shirokuma/commands/kuma/config';
  
  // Move fixed files to shared/
  for (const file of SHARED_FILES) {
    await rename(
      join(oldShared, file),
      join(newShared, file)
    );
  }
  
  // Move customizable files to config/
  for (const file of CONFIG_FILES) {
    await rename(
      join(oldShared, file),
      join(newConfig, file)
    );
  }
}
```

## Reference Update Script Example

```bash
#!/bin/bash
# scripts/update-command-references.sh

# Update lang.markdown references
find .shirokuma/commands/kuma -type f \( -name "*.md" -o -name "*.markdown" \) \
  -exec sed -i 's|@\.shirokuma/commands/shared/lang\.markdown|@.shirokuma/commands/kuma/config/lang.markdown|g' {} \;

# Update mcp-rules.markdown references
find .shirokuma/commands/kuma -type f \( -name "*.md" -o -name "*.markdown" \) \
  -exec sed -i 's|@\.shirokuma/commands/shared/mcp-rules\.markdown|@.shirokuma/commands/kuma/config/mcp-rules.markdown|g' {} \;

# Update all other shared file references
for file in ears-format spec-logic spec-prompts spec-templates spec-vibe-rules tdd-methodology steering-loader; do
  find .shirokuma/commands/kuma -type f \( -name "*.md" -o -name "*.markdown" \) \
    -exec sed -i "s|@\.shirokuma/commands/shared/${file}|@.shirokuma/commands/kuma/shared/${file}|g" {} \;
done
```