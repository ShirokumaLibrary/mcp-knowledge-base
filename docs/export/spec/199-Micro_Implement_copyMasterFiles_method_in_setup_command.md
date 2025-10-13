---
id: 199
type: spec
title: "Micro: Implement copyMasterFiles method in setup command"
status: Completed
priority: HIGH
description: "Ultra-lightweight spec for implementing the missing copyMasterFiles method to copy agent and command templates during setup"
aiSummary: "Specification for adding .claude directory (agents, commands, output-styles) to npm package distribution by updating package.json files field and build scripts to copy templates for setup command"
tags: ["spec","micro","build","package-distribution"]
related: [184,197,198]
keywords: {"package":1,"distribution":0.95,"npm":0.9,"build":0.9,"directory":0.85}
concepts: {"packaging":0.95,"build-system":0.9,"configuration":0.85,"deployment":0.75,"tooling":0.7}
embedding: "gICAhoCHmICAgJeLk5GKgICAgI2AjoqAgICTiomMk4CAgICDgI+DgICAiJGBg5SAgICAgICJiICAgJCZgYCLgICAgIWAgpaAgICFo4qEgoCAgICOgICfgICAgKGUjICAgICAk4CFm4CAgISalZGAgICAgI+AjZyAgICQkpWOgYA="
createdAt: 2025-10-13T02:38:40.000Z
updatedAt: 2025-10-13T03:21:14.000Z
---

# Implement copyMasterFiles Method in Setup Command

**Type:** Feature Implementation
**Effort:** 2-3 hours
**Date:** 2025-10-13

## What
Implement the `copyMasterFiles` method in `setup-command.ts` to copy `.shirokuma/agents/` and `.shirokuma/commands/` from package to user project.

## Why
The method is currently a stub (line 151-159) with only a comment indicating it needs implementation. Without this, users cannot get agent and command templates when running `shirokuma-kb setup`.

## How

### 1. Update copyMasterFiles method in setup-command.ts (lines 151-159)

```typescript
private async copyMasterFiles(projectDir: string, force: boolean): Promise<void> {
  const targetDir = join(projectDir, '.shirokuma');
  
  // Ensure target directory exists
  await this.fileOps.ensureDir(targetDir);
  
  // Copy agents directory
  const sourceAgentsDir = join(this.packageRoot, '.shirokuma', 'agents');
  const targetAgentsDir = join(targetDir, 'agents');
  
  if (existsSync(sourceAgentsDir)) {
    await this.fileOps.copyDirectory(
      sourceAgentsDir,
      targetAgentsDir,
      { overwrite: force }
    );
  }
  
  // Copy commands directory
  const sourceCommandsDir = join(this.packageRoot, '.shirokuma', 'commands');
  const targetCommandsDir = join(targetDir, 'commands');
  
  if (existsSync(sourceCommandsDir)) {
    await this.fileOps.copyDirectory(
      sourceCommandsDir,
      targetCommandsDir,
      { overwrite: force }
    );
  }
}
```

### 2. Verify FileOperations class has copyDirectory method

Check `src/setup/file-operations.ts` for `copyDirectory` method:
- If exists: Use it
- If not exists: Implement it using `fs.cpSync` or recursive copy logic

### 3. Add import for existsSync if not already imported (line 2)

```typescript
import { existsSync } from 'fs';
```

### 4. Test the implementation

```bash
# Create test project directory
mkdir -p /tmp/test-setup && cd /tmp/test-setup

# Run setup command
shirokuma-kb setup .

# Verify directories were copied
ls -la .shirokuma/agents/
ls -la .shirokuma/commands/

# Verify .claude files were generated
ls -la .claude/agents/
ls -la .claude/commands/
```

## Acceptance

✅ After running `shirokuma-kb setup`:
  - `.shirokuma/agents/` directory exists in project with all template files
  - `.shirokuma/commands/` directory exists in project with all template files
  - Files match the package's template files
  - `.claude/agents/` and `.claude/commands/` are generated from templates

✅ Force option works correctly:
  - Without `--force`: Skips existing files
  - With `--force`: Overwrites existing files

✅ Error handling:
  - Gracefully handles missing source directories
  - Reports clear error messages

## Files

- `src/setup/setup-command.ts` (lines 151-159)
  - Implement copyMasterFiles method
  - Copy agents and commands directories from package to project
  
- `src/setup/file-operations.ts` (if needed)
  - Verify or implement copyDirectory method

## Notes

- This follows the same pattern as template file copying
- The `generateClaudeFiles` method (line 261-304) depends on these files being present
- After copying, the placeholder replacement happens automatically

## Related Issues

- Issue #197 (Completed) - Fixed .shirokuma directory in build output
- Issue #198 - Parent issue for this spec
- Issue #184 - Package Distribution System (depends on this fix)