---
description: Ultra-lightweight spec for changes under 1 day effort
argument-hint: "'brief change description'"
allowed-tools: Read, Write, Edit, MultiEdit, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item
---

# /kuma:spec:micro - Micro Spec Command

## Language

@.shirokuma/commands/shared/lang.markdown

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

```yaml
# Save micro spec to shirokuma-kb
- Tool: mcp__shirokuma-kb__create_item
  Parameters:
    type: "spec_micro"
    title: "Micro: [changeDescription]"
    description: "Ultra-lightweight spec for small change"
    content: "[microSpecContent - filled markdown template]"
    status: "Open"
    priority: "LOW"  # Usually low priority for micro changes
    tags: ["spec", "micro", "[changeType.toLowerCase()]"]
    related: ["[issueId if exists]"]
  Purpose: Store micro spec for tracking and reference
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

## Storage Structure

Micro specs stored as simplified spec with structured content:

```yaml
# Micro Spec Storage Format
type: "spec"
title: "Micro: [Brief Description]"
description: "Micro spec for quick change"
content: |
  # Markdown content including:
  - phase: "micro"
  - specType: "[Bug Fix/Copy Change/Config Update/Minor Feature]"
  - effort: "[X hours]"
  - what: "[One sentence description]"
  - why: "[Brief justification]"
  - how: "[Implementation steps list]"
  - acceptance: "[Pass/fail criteria]"
  - files: "[File paths and changes]"
status: "Open"
priority: "LOW"
tags: ["spec", "micro", "[type.toLowerCase()]"]
```

## Integration with Other Commands

- For 1-3 day features: Use `/kuma:spec:quick`
- For complex features: Use `/kuma:spec`
- To validate: Use `/kuma:spec:validate micro`
- To execute: Direct implementation (no task breakdown needed)

## Next Steps After Spec Creation

After successfully creating a micro specification, display the following guidance:

```markdown
✅ Micro Spec #[spec-id] created successfully

## 次のステップ

マイクロ仕様が完成しました。小規模な変更のため、すぐに実装を開始できます:

**推奨ワークフロー:**
1. `/kuma:go [spec-id]` - 直接実装
   - 小規模な変更のため、直接実装が効率的
   - 仕様を参照しながら実装

2. `/kuma:vibe [spec-id]` - プロジェクトのvibesに基づく実装
   - ステアリング設定を適用したい場合
   - TDDやコーディング規約を自動適用

**Vibeコマンドとは:**
プロジェクトの「vibes」（開発方針、ステアリング設定）に基づいて、
適応的に開発ワークフローを調整するコマンド群です。

**注意:**
- マイクロ仕様は1日未満の小規模変更向けです
- 複雑な場合は `/kuma:spec:quick` または `/kuma:spec` の使用を検討してください
- 非常に軽微な変更の場合、仕様なしで直接実装も可能です

**主なVibeコマンド:**
- `/kuma:vibe` - プロジェクトのvibesに基づく適応的開発
- `/kuma:vibe:tdd` - テスト駆動開発（RED-GREEN-REFACTOR）
- `/kuma:vibe:code` - 仕様からの直接実装
- `/kuma:vibe:commit` - コンベンショナルコミット作成
```

## References

- `.shirokuma/commands/spec/quick.md` - Quick Spec for larger changes
- `.claude/commands/kuma:spec.md` - Full Spec for complex features
- `.shirokuma/commands/spec/shared/spec-templates.markdown` - All templates