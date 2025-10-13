---
id: 197
type: issue
title: ".shirokuma directory not included in build output - missing templates"
status: Completed
priority: CRITICAL
description: "Setup command fails because .shirokuma/templates directory is not copied to dist/ during build, causing \"Package templates directory not found\" error"
aiSummary: "Build process fails to copy .shirokuma template directory to dist output, breaking setup command for package distribution"
tags: ["critical","bug","setup","build","packaging"]
keywords: {"setup":0.95,"build":0.95,"template":0.9,"package":0.85,"directory":0.85}
concepts: {"build-system":0.95,"package-distribution":0.9,"configuration":0.85,"cli":0.8,"typescript":0.75}
embedding: "goCAhoCTl4CAgJWIkpiMgICAgI6Ai5eAgICSkYmRloCGgICEgIKGgICAiJKBhZeAjoCAgICAjICAgI+LgYCNgJGAgIWAh5uAgICFgoqFgoCMgICQgJGlgICAgICSkYCAhICAlYCUoICAgISGk5iAgIqAgJGAk5KAgICPgZSUgoA="
createdAt: 2025-10-13T02:04:24.000Z
updatedAt: 2025-10-13T02:11:12.000Z
---

## Problem

The `shirokuma-kb setup` command fails immediately with:

```
Setup failed: Package templates directory not found: /home/squeeze.linux/shirokuma-kb/dist/.shirokuma/templates
```

## Root Cause

The build process (`npm run build`) only compiles TypeScript files but does not copy the `.shirokuma/` directory to `dist/`. The setup command expects to find templates and master files in the package distribution, but they're missing.

## Expected Directory Structure

After build, the package should have:
```
dist/
├── src/
│   ├── cli/
│   ├── setup/
│   └── ...
└── .shirokuma/          # MISSING!
    ├── agents/          # Master agent definitions
    ├── commands/        # Master command definitions
    └── templates/       # Configuration templates
        ├── .mcp.json
        └── .env
```

## Files Affected

- `package.json` - May need to update `files` field
- `tsconfig.json` or build script - Need to copy non-TS files
- Build process - Need to ensure .shirokuma/ is included

## Required Changes

### Option 1: Update package.json files field
```json
{
  "files": [
    "dist/",
    ".shirokuma/agents/",
    ".shirokuma/commands/",
    ".shirokuma/templates/"
  ]
}
```

### Option 2: Add copy script to build process
```json
{
  "scripts": {
    "build": "tsc && npm run copy-assets",
    "copy-assets": "cp -r .shirokuma dist/"
  }
}
```

### Option 3: Use copyfiles package
```bash
npm install --save-dev copyfiles
```

```json
{
  "scripts": {
    "build": "tsc && copyfiles -u 1 '.shirokuma/**/*' dist/ && chmod +x dist/src/cli/index.js dist/src/mcp/server.js"
  }
}
```

## Impact

- **Severity**: Critical - setup command completely unusable
- **Affected**: 100% of users trying to use setup command
- **Workaround**: None - core feature broken

## Testing

After fix:
1. Run `npm run build`
2. Verify `dist/.shirokuma/` exists with subdirectories
3. Run `shirokuma-kb setup` in test directory
4. Verify setup completes successfully

## Related

- Issue #184 - Package Distribution System (requires these files)
- Issue #196 - Setup command registration (just completed)
- README.md - Documents setup as primary installation method