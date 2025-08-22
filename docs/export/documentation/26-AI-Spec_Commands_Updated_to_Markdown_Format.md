---
id: 26
type: documentation
title: "AI-Spec Commands Updated to Markdown Format"
status: Completed
priority: HIGH
tags: ["documentation","ai-spec","markdown","update","human-readable"]
related: [111,6,7,9,17,53,54,56,60,63,85,94,99]
keywords: {"spec":0.9,"ai":0.9,"markdown":0.9,"specification":0.8,"json":0.8}
concepts: {"documentation":0.9,"specification":0.9,"software development":0.8,"data format":0.8,"automation":0.7}
embedding: "gICHmYCAgICpgIiYgICAi4CAgYiAgICAnoSBmYCAgJSAgIGAgICAgJmOgJaAgICUgICIiYCAgICOk4CcgICAjICAgo2AgICAiZCBlYCAgIKAgIqbgICAgI6GiZCAgICAgICQoYCAgICOgJCQgICAgICAj5mAgICAoYKQk4CAgIE="
createdAt: 2025-08-22T13:32:42.000Z
updatedAt: 2025-08-22T13:32:42.000Z
---

# AI-Spec Commands Updated to Markdown Format

Documentation of updates to ai-spec commands for human-readable Markdown storage

## AI Summary

Documentation of updates to AI specification commands that converts storage format from JSON to human-readable Markdown, improving readability and editability while maintaining backward compatibility

# AI-Spec Commands Markdown Format Update

## Summary
All ai-spec command files have been updated to save specifications as human-readable Markdown format instead of JSON strings. This makes specs easier for humans to review, edit, and understand.

## Changes Made

### 1. /ai-spec (Main Command)
**File**: `.claude/commands/ai-spec.md`
- Changed MCP storage from `JSON.stringify()` to Markdown template literals
- Updated "Show Spec Details" to display Markdown content directly
- Modified "Execute Spec" to parse tasks from Markdown format
- Added backward compatibility for existing JSON specs

### 2. /ai-spec:req (Requirements)
**File**: `.claude/commands/ai-spec/req.md`
- Converted requirements storage to structured Markdown format
- Includes sections for User Stories, EARS requirements, NFRs, edge cases
- Human-readable format with clear headers and formatting
- Removed leftover JSON code fragments

### 3. /ai-spec:design (Design)
**File**: `.claude/commands/ai-spec/design.md`
- Converted design storage to comprehensive Markdown format
- Includes architecture, components, data models, API design sections
- Clear formatting for technology stack, security, performance
- Cleaned up duplicate JSON code

### 4. /ai-spec:tasks (Tasks)
**File**: `.claude/commands/ai-spec/tasks.md`
- Converted tasks storage to actionable Markdown checklist format
- Includes task breakdown by phases with estimates
- Added copy/paste ready checklist section
- Updated TodoWrite integration to parse from Markdown

### 5. /ai-spec:micro
**File**: `.claude/commands/ai-spec/micro.md`
- Already using Markdown format (no changes needed)
- Serves as good example of lightweight Markdown spec

### 6. /ai-spec:quick
**File**: `.claude/commands/ai-spec/quick.md`
- Already using Markdown format (no changes needed)
- Template-based approach works well

### 7. /ai-spec:when (Analysis)
**File**: `.claude/commands/ai-spec/when.md`
- Converted analysis results to detailed Markdown report format
- Includes scoring breakdown, decision factors, recommendations
- Clear visual presentation with symbols (✅, ⚠️, ❌)

### 8. /ai-spec:check (Validation)
**File**: `.claude/commands/ai-spec/check.md`
- Converted validation reports to comprehensive Markdown format
- Includes detailed scoring, findings, compliance summary
- Clear decision output (APPROVED/NEEDS REVISION)
- Validation history tracking

## Benefits of Markdown Format

### Human Readability
- Specs can be read directly without parsing JSON
- Clear section headers and formatting
- Easy to review in any text editor or MCP viewer

### Editability
- Simple to modify and update specs
- No JSON syntax to worry about
- Natural language formatting

### Version Control
- Better diffs in git
- Easy to track changes over time
- Clear history of modifications

### Compatibility
- Works with any Markdown viewer
- Can be exported/printed easily
- Supports rich formatting (bold, lists, code blocks)

## Backward Compatibility

All commands include checks for existing JSON specs:
```javascript
// Handle both formats
if (spec.content.startsWith('{')) {
  // Legacy JSON format
  const content = JSON.parse(spec.content);
  // Process JSON...
} else {
  // New Markdown format
  // Process Markdown directly...
}
```

## Example Markdown Spec Format

```markdown
# Spec: Feature Name

## Metadata
- **Created**: 2025-08-21
- **Status**: Specification
- **Priority**: HIGH
- **Related Issues**: #98

## Phase 1: Requirements

### User Stories
- As a user, I want...

### Functional Requirements (EARS)
- WHEN event THEN system SHALL behavior

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Phase 2: Design

### Architecture Overview
Description of architecture...

### Components
1. Component A
2. Component B

## Phase 3: Tasks

### Phase 1: Setup [4h]
- [ ] Task 1.1: Initialize [2h]
- [ ] Task 1.2: Configure [2h]
```

## Migration Path

For existing JSON specs:
1. Commands automatically detect format
2. Display warning for legacy format
3. Continue to work with both formats
4. Gradual migration as specs are updated

## Testing Recommendations

1. Create new spec with each command to verify Markdown output
2. Test loading existing JSON specs for backward compatibility
3. Verify TodoWrite integration with task parsing
4. Check spec display formatting

## Related Files
- `.claude/commands/ai-spec.md`
- `.claude/commands/ai-spec/req.md`
- `.claude/commands/ai-spec/design.md`
- `.claude/commands/ai-spec/tasks.md`
- `.claude/commands/ai-spec/when.md`
- `.claude/commands/ai-spec/check.md`
- `.claude/commands/ai-spec/micro.md`
- `.claude/commands/ai-spec/quick.md`
