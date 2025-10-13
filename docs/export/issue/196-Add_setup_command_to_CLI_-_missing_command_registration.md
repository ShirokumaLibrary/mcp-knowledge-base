---
id: 196
type: issue
title: "Add setup command to CLI - missing command registration"
status: Completed
priority: HIGH
description: "SetupCommand class exists but is not registered as a CLI command in src/cli/index.ts, causing 'unknown command' error"
aiSummary: "Issue report about missing CLI command registration for setup command in shirokuma-kb, causing 'unknown command' error. Requires adding SetupCommand to CLI index file."
tags: ["cli","bug","setup","command-registration"]
keywords: {"command":1,"setup":1,"cli":0.9,"registration":0.8,"implementation":0.7}
concepts: {"command line tools":0.9,"software engineering":0.8,"bug fixing":0.8,"error handling":0.7,"software configuration":0.7}
embedding: "lYCTgIGAjICDloCDgJuAgIqAj4CIgISCjIaAkICTgICTgIeAj4CAjJKMgJqAhoCAh4CNgI+AgpSQg4CYgICAgICAhICJgIqPiIKAm4CGgICDgICAjoCQlYCPgJaAk4CAj4CEgIaAjJKBnoCJgJuAgJeAjYCAgJCIiaKAgICWgIA="
createdAt: 2025-10-13T01:50:04.000Z
updatedAt: 2025-10-13T02:03:01.000Z
---

## Problem

The `shirokuma-kb setup` command fails with "unknown command 'setup'" error, even though the SetupCommand class is fully implemented.

```bash
$ shirokuma-kb setup
error: unknown command 'setup'
```

## Root Cause

The setup command is not registered in `src/cli/index.ts`. While the SetupCommand class exists in `src/setup/setup-command.ts`, it was never integrated into the CLI command structure.

## Files Affected

- `src/cli/index.ts` - Missing setup command registration
- `src/setup/setup-command.ts` - Implementation exists (Issue #184)

## Required Changes

Add setup command to CLI in `src/cli/index.ts`:

```typescript
// Import
import { SetupCommand } from '../setup/setup-command.js';

// Add command
program
  .command('setup')
  .description('Initialize shirokuma-kb in current project')
  .option('-f, --force', 'Overwrite existing files')
  .option('--mcp-name <name>', 'Custom MCP instance name', 'shirokuma-kb')
  .option('--rebuild', 'Rebuild .claude/ files from .shirokuma/')
  .action(async (options) => {
    try {
      const packageRoot = new URL('../../', import.meta.url).pathname;
      const projectDir = process.cwd();
      
      const setupCmd = new SetupCommand(packageRoot);
      await setupCmd.execute(projectDir, {
        force: options.force,
        mcpName: options.mcpName,
        rebuild: options.rebuild
      });
      
      console.log(chalk.green('✅ Setup completed successfully'));
    } catch (error) {
      console.error(chalk.red('Setup failed:'), error.message);
      process.exit(1);
    }
  });
```

## Impact

- **Severity**: High - main feature of v0.9.1 is unusable
- **Affected**: All users trying to use `shirokuma-kb setup`
- **Workaround**: None - command doesn't exist

## Testing

After fix:
1. Build: `npm run build`
2. Test setup command: `shirokuma-kb setup --help`
3. Test in test project: `shirokuma-kb setup`
4. Verify all options work: `--force`, `--mcp-name`, `--rebuild`

## Related

- Issue #184 - Package Distribution System (SetupCommand implementation)
- Issue #195 - Import path fix (just completed)
- README.md - Documents this command prominently