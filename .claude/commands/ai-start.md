---
description: Start a work session following SHIROKUMA.md methodology
argument-hint: "[task description]"
allowed-tools: mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__update_item, mcp__shirokuma-knowledge-base__update_current_state, mcp__shirokuma-knowledge-base__get_item_detail, Bash(date:*)
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

**Important**: Since AI completely loses memory from previous sessions, we must carefully restore context.

### 1. Recover Previous Memory (Required)
Execute: mcp__shirokuma-knowledge-base__get_current_state()

**Display immediately**:
```
## Current State

[Display current_state content as is]

---
```

### 2. Check for Active Session
If current_state contains "## Active Session":
- Notify that an existing session exists
- Present options:
  1. Continue existing session
  2. End previous session and start new one (execute /ai-finish)
  3. Cancel

### 3. Display Open Issues
Execute: mcp__shirokuma-knowledge-base__get_items({ 
  type: "issues", 
  includeClosedStatuses: false 
})

**Display rules**:
- Show issues from "Next Priorities" in current_state first with ⭐ emoji
- Group by priority (High → Medium → Low)
- If >10 issues: Show all High + 3 each of Medium/Low

**Display format**:
```
## 📋 Priority Issues (from current_state):
⭐ 1. [high] Title (issues-XX)
⭐ 2. [high] Title (issues-YY)

## 📋 All Open Issues:
**High Priority:**
3. Title (issues-ZZ)

**Medium Priority:**
4. Title (issues-AA)

**Low Priority:**
5. Title (issues-BB)
```

### 4. Create New Session
Get current time: !`date +"%Y-%m-%d %H:%M:%S"`

Create session:
```javascript
mcp__shirokuma-knowledge-base__create_item({
  type: "sessions",
  title: Extract concise title from $ARGUMENTS || "[Work Session]",
  description: $ARGUMENTS || `[Work Started]: ${current_time}`,
  content: `Continuing from: ${Brief summary of previous work}` // AI memory aid
})
```

**Display immediately**:
```
✅ Session Started: [session-id]
📝 Title: [title]
📝 Description: [description]
```

### 5. Issue Selection Prompt
"Which issue would you like to work on? (Enter number or issue ID)"

### 6. Link Session to Issue
After user selection:
```javascript
mcp__shirokuma-knowledge-base__update_item({
  type: "sessions",
  id: [session-id],
  related_tasks: [`issues-${selected}`]
})
```

### 7. Update current_state (Add Active Session)
```javascript
const currentContent = // Current current_state content
const activeSessionSection = `
## Active Session
- Session ID: ${sessionId}
- Title: ${sessionTitle}
- Related Issue: issues-${selectedIssue}
- Start Time: ${startTime}
`

// Insert after "## Current Status"
mcp__shirokuma-knowledge-base__update_current_state({
  content: updatedContent,
  updated_by: "ai-start",
  related: [sessionId, `issues-${selectedIssue}`, todaysDailyId]
})
```

### 8. Update Daily (Cumulative)
Get date: !`date +"%Y-%m-%d"`

**Try to get daily directly by date ID**:
```javascript
try {
  const daily = await mcp__shirokuma-knowledge-base__get_item_detail({ 
    type: "dailies", 
    id: today  // Direct access using date as ID
  })
  
  // Daily exists - update it
  const sessionCount = daily.related_documents?.filter(d => d.startsWith('sessions-')).length + 1
  
  mcp__shirokuma-knowledge-base__update_item({
    type: "dailies",
    id: daily.id,
    content: daily.content + `\n\n## Session ${sessionCount}: ${sessionTitle}\n- Started: ${startTime}\n- Related: ${selectedIssue}`,
    related_documents: [...daily.related_documents, sessionId]
  })
} catch (error) {
  // Daily doesn't exist (404) - create new one
  mcp__shirokuma-knowledge-base__create_item({
    type: "dailies",
    date: today,
    title: `Work Log - ${today}`,
    content: `## Session 1: ${sessionTitle}\n- Started: ${startTime}\n- Related: ${selectedIssue}`,
    related_documents: [sessionId]
  })
}
```

### 9. Completion Message
```
## 🚀 Ready to Start!

Selected Issue: issues-${selectedIssue}
Session: ${sessionId}

You can now start working. Run /ai-finish when done.
```

## Key Principles (from SHIROKUMA.md)
- **Assume AI memory loss**: Always restore previous content from current_state
- **Minimal recording**: Record only essential information
- **Cumulative daily**: Update with each session
- **Clear context**: Always record "why" and "where from"