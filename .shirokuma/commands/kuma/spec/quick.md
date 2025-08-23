---
description: Quick spec for 1-3 day features (requirements + tasks, skip design)
argument-hint: "'feature description'"
allowed-tools: Read, Write, Edit, MultiEdit, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, TodoWrite
---

# /kuma:spec:quick - Quick Spec Command

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Create lightweight specifications for small-to-medium features (1-3 days effort) that need requirements and tasks but can skip the formal design phase.

## Usage

```bash
/kuma:spec:quick "add user profile picture upload"
/kuma:spec:quick "implement CSV export for reports"
/kuma:spec:quick "add dark mode toggle"
```

## Template

```markdown
# [Feature Name] - Quick Spec

**Spec Type:** Quick Spec
**Estimated Effort:** [X days]
**Priority:** [High/Medium/Low]
**Created:** [YYYY-MM-DD]
**Status:** [Draft/Approved/In Progress/Complete]

## Overview

**What:** [One sentence describing what this feature does]
**Why:** [Brief justification - business value or user need]
**Success Metric:** [How you'll know this succeeded]

## Requirements

### User Story
**As a** [user type]
**I want** [capability]
**So that** [benefit/value]

### Acceptance Criteria
- [ ] [Specific, testable criterion]
- [ ] [Another criterion - happy path]
- [ ] [Edge case handling]
- [ ] [Performance/quality requirement]

### Constraints
- **Technical:** [Technical limitations]
- **Business:** [Business rules]
- **Timeline:** [Deadline constraints]

## Implementation Plan

### Prerequisites
- [ ] [Setup or dependencies]
- [ ] [Access permissions]

### Core Tasks
1. **[Task Name]** - [Description]
   - **Estimate:** [X hours]
   - **Details:** [Implementation notes]

2. **[Task Name]** - [Description]
   - **Estimate:** [X hours]
   - **Details:** [Implementation notes]

### Testing Tasks
- [ ] **Unit Tests:** [Coverage needed]
- [ ] **Integration Tests:** [What to test]
- [ ] **Manual Testing:** [Verification steps]

### Documentation Tasks
- [ ] **Code Comments:** [Areas needing docs]
- [ ] **README Updates:** [What to update]

## Technical Notes

### Files to Modify
- `[file/path]` - [Changes needed]

### Dependencies
- **Internal:** [Components this depends on]
- **External:** [Third-party services/libraries]

### Risks & Mitigation
- **Risk:** [Potential issue]
  **Mitigation:** [How to address]

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Feature deployed to staging
```

## MCP Storage

```yaml
# Quick Spec Storage Process
- Tool: mcp__shirokuma-kb__create_item
  Parameters:
    type: "spec_quick"
    title: "Quick Spec: [feature-name]"
    description: "Lightweight spec for 1-3 day feature"
    content: filled-markdown-template
    status: "Open"
    priority: "MEDIUM" (or specified priority)
    tags: ["spec", "quick", "feature", feature-name]
    related: [issue-id] (if exists)
  Purpose: Store lightweight specification

# Optional Task Creation
Task Integration:
  - Extract tasks from spec content
  - Convert to TodoWrite format
  - Create task list for immediate work
  
# Task Extraction Process
1. Parse implementation plan section
2. Extract core tasks with estimates
3. Add testing and documentation tasks
4. Create TodoWrite entries
5. Link tasks to spec for tracking
```

## When to Use

### Use Quick Spec for:
- Small features (1-3 days)
- API endpoint additions
- Database schema changes
- Component modifications
- Feature extensions
- Well-understood patterns

### Decision Criteria
```
Is effort 1-3 days?
  └─ Yes → Multiple components involved?
      └─ No → Use Quick Spec
      └─ Yes → New patterns/technology?
          └─ No → Use Quick Spec
          └─ Yes → Consider Full Spec
  └─ No → Use Micro Spec (<1 day) or Full Spec (>3 days)
```

## Example: User Profile Picture Upload

```markdown
# User Profile Picture Upload - Quick Spec

**Spec Type:** Quick Spec
**Estimated Effort:** 2 days
**Priority:** Medium
**Created:** 2025-01-21
**Status:** Approved

## Overview

**What:** Allow users to upload and display profile pictures
**Why:** Users want personalized profiles and team recognition
**Success Metric:** 50% of users upload picture within 30 days

## Requirements

### User Story
**As a** registered user
**I want** to upload a profile picture
**So that** my profile is personalized and recognizable

### Acceptance Criteria
- [ ] User can click "Upload Photo" in settings
- [ ] System accepts JPG, PNG, GIF up to 5MB
- [ ] Image auto-resized to 200x200px
- [ ] Picture displays in nav bar and profile
- [ ] User can remove picture (return to default)
- [ ] Error messages for invalid files

### Constraints
- **Technical:** Must use existing S3 bucket
- **Business:** GDPR compliant image storage
- **Timeline:** Deploy by end of sprint

## Implementation Plan

### Prerequisites
- [ ] S3 bucket permissions configured
- [ ] Image processing library installed

### Core Tasks
1. **Backend API Endpoint** - Upload handler
   - **Estimate:** 4 hours
   - **Details:** Multipart form, validation, S3 upload

2. **Frontend Upload Component** - UI interface
   - **Estimate:** 3 hours
   - **Details:** File picker, preview, progress

3. **Image Processing** - Resize and optimize
   - **Estimate:** 2 hours
   - **Details:** Sharp library, 200x200 crop

4. **Profile Display Update** - Show picture
   - **Estimate:** 2 hours
   - **Details:** Update nav, profile, fallback

### Testing Tasks
- [ ] **Unit Tests:** Upload validation, resizing
- [ ] **Integration Tests:** Full upload flow
- [ ] **Manual Testing:** Various file types/sizes

### Documentation Tasks
- [ ] **API Docs:** Upload endpoint spec
- [ ] **User Guide:** How to upload picture

## Technical Notes

### Files to Modify
- `api/users/upload.js` - New endpoint
- `components/ProfilePicture.jsx` - New component
- `pages/settings/profile.jsx` - Add upload button
- `services/imageProcessor.js` - New service

### Dependencies
- **Internal:** User auth service
- **External:** AWS S3, Sharp library

### Risks & Mitigation
- **Risk:** Large files slow upload
  **Mitigation:** Client-side validation, progress indicator

## Definition of Done
- [ ] Users can upload/remove pictures
- [ ] Images properly resized and stored
- [ ] All file types validated
- [ ] Error handling works
- [ ] Tests passing
- [ ] Deployed to staging
```

## Storage Structure

```yaml
# Quick Spec Data Structure
Quick Spec Fields:
  type: "spec_quick"
  title: "Quick: [Feature Name]"
  description: "Quick spec for medium feature"
  content: markdown-template-content
  status: "Open"
  priority: "MEDIUM"
  tags: ["spec", "quick", "feature"]

# Content Organization
Spec Content Sections:
  - Phase: "quick"
  - Estimated Effort: "[X] days"
  - Overview: what/why/success metric
  - Requirements: user story, acceptance criteria, constraints
  - Implementation Plan: prerequisites, core tasks, testing, docs
  - Technical Notes: files, dependencies, risks
  - Definition of Done: completion checklist
```

## TodoWrite Integration

```yaml
# Task Conversion Process
- Tool: TodoWrite
  Parameters:
    todos: list-of-task-objects
  Purpose: Create actionable task list

# Task Format
Task Structure:
  content: "Task description with estimate"
  status: "pending"
  activeForm: "Present continuous form"

# Example Task Conversion
From Spec Tasks:
  - Backend API Endpoint (4h) → pending
  - Frontend Upload Component (3h) → pending  
  - Image Processing (2h) → pending
  - Profile Display Update (2h) → pending
  - Unit Tests → pending
  - Integration Tests → pending

# Integration Benefits
- Immediate actionable tasks
- Progress tracking
- Time estimation visibility
- Clear work breakdown
```

## References

- `.shirokuma/commands/spec/micro.md` - For smaller changes
- `.claude/commands/kuma:spec.md` - For complex features
- `.shirokuma/commands/spec/shared/spec-templates.markdown` - Templates