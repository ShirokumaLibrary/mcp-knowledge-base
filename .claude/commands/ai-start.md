---
description: Start a work session following SHIROKUMA.md methodology
argument-hint: "[task description]"
allowed-tools: Task
---

# ai-start - Start AI Pair Programming Session

## Usage
```
/ai-start [task description]
```

Examples:
- `/ai-start` - Start session with default title
- `/ai-start Bug fix authentication module` - Start session with task description

## Task

**Note: Respond to the user in their language**

### Execute Session Start

Use the specialized session management agent to handle all session start operations.

```
Task: Use shirokuma-session-automator to start a new AI session
Purpose: Initialize work session with proper context restoration
Task Description: $ARGUMENTS
Operations Required:
  1. Restore previous context from current_state
  2. Check for active sessions
  3. Display prioritized open issues
  4. Create new session with user approval
  5. Update current_state with active session
  6. Update daily summary
  7. Initialize todo list for work planning
  8. Prepare memory bank for the session
```

### Expected Behavior

The session-automator agent will:
- Restore all necessary context from previous sessions
- Handle active session detection and resolution
- Present issues in a prioritized, organized manner
- Create work plan with TodoWrite for user approval
- Set up all required tracking and state management
- Ensure smooth handover for future sessions

### Error Handling

If the agent encounters any issues:
- Report the specific problem clearly
- Suggest manual alternatives if needed
- Ensure no data loss occurs

This command delegates all complex logic to the specialized agent, maintaining clean separation of concerns.