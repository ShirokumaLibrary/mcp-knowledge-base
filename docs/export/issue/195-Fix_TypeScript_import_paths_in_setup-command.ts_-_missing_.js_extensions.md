---
id: 195
type: issue
title: "Fix TypeScript import paths in setup-command.ts - missing .js extensions"
status: Completed
priority: HIGH
description: "Build fails due to missing explicit file extensions in ES Module imports when using node16/nodenext module resolution"
aiSummary: "TypeScript build error requiring explicit .js file extensions in ES Module imports when using node16/nodenext module resolution in setup-command.ts"
tags: ["typescript","bug","setup","build-error"]
keywords: {"typescript":1,"import":0.9,"module":0.9,"build":0.8,"es module":0.8}
concepts: {"build system":0.9,"module system":0.9,"typescript":0.9,"configuration":0.7,"error handling":0.7}
embedding: "gIyDgJiDgICDgICbgICKgoCTjICUi4CAi4CArYCAkoCAkZOAnoWAgJGAgKyAgJOGgIiSgJ+NgICPgICYgICLjoCPiICWkYCAh4CAhICAgpGAhoGAkY2AgICAgIWAgICMgICGgJWFgICBgICIgICAhICDgICZgICAiYCAhoCAgYo="
createdAt: 2025-10-13T00:52:55.000Z
updatedAt: 2025-10-13T01:11:24.000Z
---

## Problem

Build command fails with TypeScript errors in `src/setup/setup-command.ts`:

```
src/setup/setup-command.ts:4:34 - error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './mcp-config-manager.js'?

4 import { McpConfigManager } from './mcp-config-manager';
                                   ~~~~~~~~~~~~~~~~~~~~~~

src/setup/setup-command.ts:5:32 - error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './file-operations.js'?

5 import { FileOperations } from './file-operations';
                                 ~~~~~~~~~~~~~~~~~~~

src/setup/setup-command.ts:6:35 - error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './placeholder-engine.js'?

6 import { PlaceholderEngine } from './placeholder-engine';
                                    ~~~~~~~~~~~~~~~~~~~~~~
```

## Root Cause

When using TypeScript with `"type": "module"` in package.json and `moduleResolution: "node16"` or `"nodenext"`, ES Module imports require explicit `.js` extensions (even though the source files are `.ts`).

## Files Affected

- `src/setup/setup-command.ts` - Lines 4, 5, 6

## Required Changes

Update three import statements to include `.js` extensions:

**Before:**
```typescript
import { McpConfigManager } from './mcp-config-manager';
import { FileOperations } from './file-operations';
import { PlaceholderEngine } from './placeholder-engine';
```

**After:**
```typescript
import { McpConfigManager } from './mcp-config-manager.js';
import { FileOperations } from './file-operations.js';
import { PlaceholderEngine } from './placeholder-engine.js';
```

## Impact

- **Severity**: High - blocks builds
- **Affected Functionality**: Setup command (Issue #184)
- **Workaround**: None - build cannot complete

## Testing

After fix:
1. Run `npm run build` - should complete without errors
2. Run `npm test` - all tests should pass
3. Test setup command: `shirokuma-kb setup --help`

## Related

- Issue #184 - Package Distribution System (implemented feature using these files)
- TypeScript ES Module documentation