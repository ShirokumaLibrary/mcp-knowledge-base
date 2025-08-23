---
description: Spec-driven development mode for SHIROKUMA project with clear phase boundaries, workflow visualization, and user approval gates
---

# SHIROKUMA Spec-Driven Development Mode

## Language Settings

@.shirokuma/commands/shared/lang.markdown

## Core Purpose

Enforce three-phase spec process (Requirements → Design → Tasks) with explicit approval gates between phases. Prevent premature implementation while maintaining systematic workflow.

## 🎯 Mode Activation

Activate when: `/kuma:spec:*` commands are used

Show this immediately:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Spec-Driven Development Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Phase: [Requirements/Design/Tasks]
Document ID: #[number] ([type])

✅ Allowed Operations:
• Research & Analysis
• MCP document creation  
• Reference existing information
• Planning and design
• Specification writing

⛔ Restricted Operations:  
• File editing (except MCP)
• Code execution
• Git operations
• Implementation work

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📊 Workflow Visualization

Show where user is in the process:

```
Requirements → Design → Tasks → Implementation
    ▲
 You are here
```

## 📝 Requirements Phase Template

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Requirements Phase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Functional Requirements
[EARS format requirements]

## User Stories
[User perspective narratives]

## Acceptance Criteria
[Testable conditions]

## Edge Cases
[Boundary conditions and exceptions]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🏗️ Design Phase Template

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️ Design Phase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Research Findings
[Key discoveries and decisions]

## Architecture
[System structure and components]

## Data Models
[Entities and relationships]

## Error Handling
[Error scenarios and recovery]

## Testing Strategy
[Approach to validation]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔧 Tasks Phase Template

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Tasks Phase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Implementation Order
[Task hierarchy and dependencies]

## Task List
□ Task 1: [Description] (→ Req X.X)
□ Task 2: [Description] (→ Req Y.Y)
□ Task 3: [Description] (→ Req Z.Z)

## Dependencies
[Task interdependencies]

## Completion Criteria
[How to verify task completion]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ✨ Phase Completion - ALWAYS SHOW THIS

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Phase Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created Document: #[ID]
Document Type: [spec_requirements/spec_design/spec_tasks]
Current Phase: [Requirements/Design/Tasks]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Next Actions:

1. Approve & Continue
   → [Next phase command or implementation]

2. Refine Current Phase
   → `/kuma:spec:refine [ID]`

3. Return to Previous Phase
   → [Previous phase command with ID]

4. Start Implementation
   → `/kuma:go [ID]` (Only after Tasks phase)

5. Cancel
   → Abort specification

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please choose (1-5): _
```

**CRITICAL**: Wait for user to choose. Never auto-proceed.

## 🔄 Feedback Handling

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Processing Feedback
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feedback Received:
[User's feedback]

Impact Analysis:
• Current phase: [Changes needed]
• Previous phase: [Impacts]
• Future phase: [Considerations]

Recommended Action:
[Specific recommendation]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🚫 Implementation Prevention

If user tries to implement too early:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Implementation Restricted
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Currently in specification phase. Implementation not yet available.

Current Progress:
□ Requirements
□ Design
□ Tasks

Complete all phases before starting implementation.

Next Step: [Appropriate phase command]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📈 Quality Checklist

Show at end of each phase:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Quality Checklist
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Requirements Phase:
☑ Written in EARS format
☑ User stories complete
☑ Clear acceptance criteria
☑ Edge cases considered

Design Phase:
☑ Aligned with requirements
☑ Clear architecture
☑ Data models defined
☑ Error handling planned

Tasks Phase:
☑ Appropriate task granularity
☑ Clear dependencies
☑ Requirements traceability
☑ Test-driven structure

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🚀 Implementation Handoff

Only after all phases complete:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Ready for Implementation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Specification Complete:
• Requirements: #[ID]
• Design: #[ID]
• Tasks: #[ID]

Use the following command to start implementation:

→ `/kuma:go [ID]`

Exiting spec mode, transitioning to implementation mode.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Key Rules

1. **Never auto-proceed** - Wait for explicit user choice (1-5)
2. **Show phase location** - User always knows where they are
3. **Block premature implementation** - Spec must be complete
4. **Language compliance** - Follow lang.markdown rules
5. **Visual consistency** - Use ━ separators and emoji indicators

## Visual Elements

- Phase: 📋 🏗️ 🔧 ✨
- Status: ✅ ⛔ ⚠️ 🔄 🎯
- Progress: □ ☑ ■
- Separator: ━━━━━━━━━━━━━━━━

## Context Detection

- New spec → Start Requirements
- Existing spec → Show current phase
- Implementation attempt → Redirect to spec or `/kuma:go`