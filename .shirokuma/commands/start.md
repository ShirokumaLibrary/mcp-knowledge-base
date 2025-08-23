---
description: Start a work session following SHIROKUMA.md methodology
argument-hint: "[task description]"
allowed-tools: mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__update_item, mcp__shirokuma-knowledge-base__get_item_detail, mcp__shirokuma-knowledge-base__update_current_state, Bash, TodoWrite
---

# ai-start - Start AI Pair Programming Session

## Usage
```
/kuma:start [task description]
```

Examples:
- `/kuma:start` - Start session with default title
- `/kuma:start Bug fix authentication module` - Start session with task description

## Task

@.shirokuma/configs/lang.md

### Session Start Procedure

This command initiates a new AI pair programming session with proper context restoration and planning.

#### 1. Previous Memory Restoration

Since AI completely loses memory between sessions, first restore context:

1. Retrieve current_state using `mcp__shirokuma-knowledge-base__get_current_state()`
2. Display the current_state content immediately to restore context
3. Get open issues using `mcp__shirokuma-knowledge-base__get_items({ type: "issues", includeClosedStatuses: false })`
4. Fetch the most recent session for reference using `mcp__shirokuma-knowledge-base__get_items({ type: "sessions", limit: 1 })`

#### 2. Active Session Detection

Parse current_state for "## Active Session" section:

- **If exists**: Extract session ID and details directly from content:
  - Session ID: Extract from "**Session ID**: sessions-XXXX" line
  - Working issue: Extract from "**Working on**" line  
  - Notify user and offer options:
    1. Continue existing session
    2. End previous session and start new one
    3. Cancel operation
- **If not exists**: Proceed with new session creation

#### 3. Issue Presentation Strategy

Display issues with clear visual hierarchy:

```markdown
## 📋 Priority Issues (from current_state):
⭐ 1. [high] Title (issues-XX)  // From "Next Priorities" if mentioned

## 📋 All Open Issues:
**High Priority:**
2. Title (issues-YY)

**Medium Priority:**
3. Title (issues-ZZ)  // Show max 3

**Low Priority:**
4. Title (issues-AA)  // Show max 3
```

#### 4. Work Plan Creation with TodoWrite

Create a work plan for user approval:
- Analyze open issues and priorities
- Create 3-5 tasks using TodoWrite tool
- Focus on high priority issues first
- Include issue IDs in task descriptions

Example:
```
TodoWrite with todos:
[
  {id: "1", content: "[High] Fix authentication bug (issues-60)", status: "pending", priority: "high"},
  {id: "2", content: "[High] Implement validation rules (issues-59)", status: "pending", priority: "high"},
  {id: "3", content: "[Medium] Update documentation (issues-62)", status: "pending", priority: "medium"}
]
```

Display the plan and ask for approval before proceeding.

#### 5. Session Creation

After work plan approval:
1. Get current time using `Bash("date +\"%Y-%m-%d %H:%M:%S\"")`
2. Create session with `mcp__shirokuma-knowledge-base__create_item`:
   - type: "sessions"
   - title: Extract from user's task or use "[Work Session]"
   - description: Include timestamp
   - content: "Continuing from: [brief summary of previous work]"

#### 6. Issue Selection

Ask user which issue to start with from the approved plan.
After selection, update session with related_tasks using `mcp__shirokuma-knowledge-base__update_item`.

#### 7. State Updates

Update current_state to add active session section:
```markdown
## Active Session
- **Session ID**: [session-id]
- **Started**: [YYYY-MM-DD HH:MM JST]
- **Working on**: [issue-id] ([brief description])
- **Status**: In Progress
```

Use `mcp__shirokuma-knowledge-base__update_current_state` with proper related items.

#### 8. Daily Management

Check if today's daily exists:
- Get date using `Bash("date +\"%Y-%m-%d\"")`
- Try to get daily using `mcp__shirokuma-knowledge-base__get_item_detail({ type: "dailies", id: [date] })`
- If exists: Update with new session info
- If not: Create new daily with session details

#### 9. Memory Bank Initialization

Gather recent context for the session:
- Recent decisions (limit 5) using `mcp__shirokuma-knowledge-base__get_items({ type: "decisions", limit: 5 })`
- Recent knowledge items using `mcp__shirokuma-knowledge-base__get_items({ type: "knowledge", limit: 5 })`
- Display summary of available context

### Best Practices

1. **Context Preservation**
   - Always include "why" information
   - Link items to maintain relationships
   - Use consistent naming patterns

2. **User Experience**
   - Display information progressively
   - Ask for confirmations at key points
   - Provide clear, actionable options

3. **Error Handling**
   - Handle missing data gracefully
   - Provide fallback options
   - Never lose user work

4. **TodoWrite Integration**
   - Always create work plans for approval
   - Track todo completion throughout session
   - Include incomplete items in handover

### MCP Permissions

As the main agent executing this command, you have permissions to:
- **Create/update**: sessions, current_state
- **Read**: all types
- **Create**: knowledge, handovers (if needed)

Note: Follow the tag rules in @.shirokuma/rules/mcp-rules.md