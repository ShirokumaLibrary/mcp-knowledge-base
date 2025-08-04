---
description: End work session following SHIROKUMA.md methodology
allowed-tools: Task
---

# ai-finish - End AI Pair Programming Session

## Usage
```
/ai-finish
```

## Purpose
End work session and leave comprehensive records for the next AI session.

## Task

@.claude/agents/LANG.markdown

### Execute Session End

Use the specialized session management agent to handle all session closure operations.

```
Task: Use shirokuma-session-automator to properly close the current AI session
Purpose: Ensure complete handover and context preservation for next session
Operations Required:
  1. Retrieve active session from current_state
  2. Compile comprehensive work summary
  3. Review and update todo completion status
  4. Update session with end time and achievements
  5. Delegate daily summary update to shirokuma-daily-reporter:
     - Aggregate all today's sessions
     - Calculate total work time
     - Highlight key achievements
     - Create progress visualization
     - Update or create daily summary
  6. Prepare handover notes in current_state
  7. Remove active session marker
  8. Display final summary to user
```

### Expected Behavior

The session-automator agent will:
- Generate complete summary of all work done
- Handle todo review with completion status
- Update all necessary records (session, daily, current_state)
- Ensure no context is lost for next AI
- Provide clear handover documentation
- Display meaningful closure summary to user

### Special Handling

The agent should handle these cases gracefully:
- No active session found
- Incomplete todos requiring notes
- Daily summary creation if needed
- Error recovery without data loss

### Success Criteria

A successful session closure includes:
- All work properly documented
- Clear next steps identified
- State ready for next session
- User receives comprehensive summary

This command delegates all complex logic to the specialized agent, maintaining clean separation of concerns.