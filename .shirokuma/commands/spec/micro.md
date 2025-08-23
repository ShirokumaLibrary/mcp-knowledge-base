---
description: Ultra-lightweight spec for changes under 1 day effort
argument-hint: "'brief change description'"
allowed-tools: Read, Write, Edit, MultiEdit, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item
---

# /kuma:spec:micro - Micro Spec Command

## Language

@.shirokuma/configs/lang.md

## Purpose

Create ultra-lightweight specifications for small changes (< 1 day effort) - bug fixes, copy changes, minor tweaks.

## Usage

```bash
/kuma:spec:micro "fix login button alignment"
/kuma:spec:micro "update welcome message text"
/kuma:spec:micro "change config timeout value"
```

## Template

```markdown
# [Brief Change Description]

**Type:** [Bug Fix/Copy Change/Config Update/Minor Feature]
**Effort:** [X hours]
**Date:** [YYYY-MM-DD]

## What
[One sentence describing the change]

## Why
[Brief justification - why is this needed?]

## How
- [Implementation step 1]
- [Implementation step 2]
- [Implementation step 3]

## Acceptance
[Simple pass/fail criteria - how do you know it worked?]

## Files
- `[file/path]` - [what changes]
```

## MCP Storage

Micro specs are automatically saved to shirokuma-kb:

```typescript
const microSpec = await mcp__shirokuma-kb__create_item({
  type: "spec_micro",
  title: `Micro: ${changeDescription}`,
  description: "Ultra-lightweight spec for small change",
  content: microSpecContent, // The markdown template filled out
  status: "Open",
  priority: "LOW", // Usually low priority for micro changes
  tags: ["spec", "micro", changeType.toLowerCase()],
  related: issueId ? [issueId] : []
});

console.log(`✅ Micro spec saved to shirokuma-kb with ID: ${microSpec.id}`);
console.log(`⏱️ Estimated effort: ${effort} hours`);
```

## When to Use

### Use Micro Spec for:
- Bug fixes
- Copy/text changes
- Configuration updates
- Minor UI tweaks
- Style adjustments
- Single-file changes
- Dependency updates
- Small refactoring

### Decision Tree
```
Is the change < 1 day effort?
  └─ Yes → Use Micro Spec
      └─ Is it a single file change?
          └─ Yes → Perfect for Micro Spec
          └─ No → Still OK if simple
  └─ No → Consider Quick Spec or Full Spec
```

## Examples

### Bug Fix Example
```markdown
# Fix Login Button Alignment

**Type:** Bug Fix
**Effort:** 2 hours
**Date:** 2025-01-21

## What
Fix login button that's misaligned on mobile devices

## Why
Button is partially cut off on screens smaller than 375px, preventing users from logging in

## How
- Update CSS media query in `login.css` to use `flex-direction: column`
- Adjust button margin from `10px` to `5px` for mobile
- Test on iPhone SE and Android small screens

## Acceptance
Login button is fully visible and clickable on all screen sizes 375px and above

## Files
- `styles/login.css` - Update mobile media query
```

### Copy Change Example
```markdown
# Update Welcome Message

**Type:** Copy Change
**Effort:** 30 minutes
**Date:** 2025-01-21

## What
Change homepage welcome message to reflect new product positioning

## Why
Marketing team updated messaging to emphasize "collaboration" over "productivity"

## How
- Replace "Boost your productivity" with "Enhance team collaboration"
- Update subheading from "Get more done" to "Work better together"
- Verify text fits in existing design layout

## Acceptance
Homepage displays new messaging and layout looks correct on desktop and mobile

## Files
- `components/homepage.tsx` - Update text content
- `locales/en.json` - Update translation strings
```

### Config Update Example
```markdown
# Increase API Timeout

**Type:** Config Update
**Effort:** 1 hour
**Date:** 2025-01-21

## What
Increase API timeout from 30s to 60s for large file uploads

## Why
Users uploading files >10MB are experiencing timeout errors

## How
- Update `API_TIMEOUT` in config.js from 30000 to 60000
- Update corresponding timeout in nginx.conf
- Test with 20MB file upload

## Acceptance
Files up to 50MB can be uploaded without timeout errors

## Files
- `config/api.js` - Update timeout value
- `nginx/nginx.conf` - Update proxy timeout
```

## MCP Storage

Store as simplified spec in MCP:

```typescript
{
  type: "spec",
  title: "Micro: [Brief Description]",
  description: "Micro spec for quick change",
  content: JSON.stringify({
    phase: "micro",
    specType: "Bug Fix",
    effort: "2 hours",
    what: "...",
    why: "...",
    how: [...],
    acceptance: "...",
    files: [...]
  }),
  status: "Open",
  priority: "LOW",
  tags: ["spec", "micro", type.toLowerCase()]
}
```

## Integration with Other Commands

- For 1-3 day features: Use `/kuma:spec:quick`
- For complex features: Use `/kuma:spec`
- To validate: Use `/kuma:spec:validate micro`
- To execute: Direct implementation (no task breakdown needed)

## References

- `.shirokuma/commands/spec/quick.md` - Quick Spec for larger changes
- `.claude/commands/kuma:spec.md` - Full Spec for complex features
- `.shirokuma/commands/spec/shared/spec-templates.markdown` - All templates