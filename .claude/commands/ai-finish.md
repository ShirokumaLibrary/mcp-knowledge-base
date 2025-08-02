---
description: End work session following SHIROKUMA.md methodology
allowed-tools: mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__update_item, mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__update_current_state, mcp__shirokuma-knowledge-base__get_item_detail, Bash(date:*)
---

# ai-finish - End AI Pair Programming Session

## Usage
```
/ai-finish
```

## Purpose
End work session and leave records for next AI to understand.

**Note: Respond to the user in their language**

## Task

**Important**: Since next AI remembers nothing, ensure all necessary information is recorded.

### 1. Check Current State
Execute: mcp__shirokuma-knowledge-base__get_current_state()

Extract active session info:
- Session ID
- Related issues
- Start time

If no active session:
```
⚠️ No active session found.
Session may have already ended or /ai-start was not executed.
```

### 2. Get Session Details
Execute: mcp__shirokuma-knowledge-base__get_item_detail({
  type: "sessions",
  id: activeSessionId
})

### 3. Record Session Completion
Ask user:
"Please briefly describe what was completed in this session (for next AI's reference):"

Update session:
```javascript
mcp__shirokuma-knowledge-base__update_item({
  type: "sessions",
  id: activeSessionId,
  content: `## Completed\n${userInput}\n\n## Technical Decisions\n- ${important decisions}\n\n## Next Steps\n- ${where to resume}`
})
```

### 4. Aggregate Today's Work Status
Current time: !`date +"%Y-%m-%d %H:%M:%S"`
Today's date: !`date +"%Y-%m-%d"`

Today's session list:
```javascript
mcp__shirokuma-knowledge-base__get_items({ 
  type: "sessions", 
  start_date: today, 
  end_date: today 
})
```

Check completed issues:
```javascript
mcp__shirokuma-knowledge-base__get_items({ 
  type: "issues",
  statuses: ["Closed"],
  start_date: today,
  end_date: today,
  includeClosedStatuses: true
})
```

### 5. Update Daily (Cumulative)
**Get daily directly by date ID**:
```javascript
try {
  const daily = await mcp__shirokuma-knowledge-base__get_item_detail({
    type: "dailies",
    id: today  // Direct access using date as ID
  })
```

  Update daily content (reflect session status):
  ```javascript
  // Mark relevant session as completed
  const updatedContent = daily.content.replace(
    `## Session ${sessionNumber}: ${sessionTitle}`,
    `## Session ${sessionNumber}: ${sessionTitle} ✅ Completed`
  )
  
  // Add work duration
  const duration = calculateDuration(startTime, currentTime)
  const finalContent = updatedContent + `\n\n## Work Duration\n- Total work time: ${duration}`
  
  mcp__shirokuma-knowledge-base__update_item({
    type: "dailies",
    id: daily.id,
    content: finalContent,
    related_tasks: [...completedIssueIds]
  })
  ```
} catch (error) {
  // Daily doesn't exist (rare case - ai-start should have created it)
  console.warn("Daily not found for today. This shouldn't normally happen.")
}
```

### 5.5 Record New Features (If Implemented)
If new functionality was implemented:
```javascript
// Search existing features to confirm it's new
const existingFeatures = await mcp__shirokuma-knowledge-base__search_items({ 
  query: "feature keywords", 
  types: ["features"] 
})

// If truly new, create features entry
if (notDuplicate) {
  mcp__shirokuma-knowledge-base__create_item({
    type: "features",
    title: "New Feature Name",
    description: "Brief description",
    content: `## API Specification
[Tool definition or API details]

## Usage Examples
[Code examples]

## Status
- Status: Implemented
- Version: vX.X.X
- Related Issues: issues-XX`,
    tags: ["category", "vX.X.X"],
    related_documents: ["issues-XX"]
  })
}
```

### 6. Update current_state (Required for Next AI)
Re-aggregate open issues:
```javascript
const openIssues = await mcp__shirokuma-knowledge-base__get_items({ 
  type: "issues", 
  includeClosedStatuses: false 
})
```

Identify next priorities (top 3 from High priority)

Update content:
```javascript
mcp__shirokuma-knowledge-base__update_current_state({
  content: `Project: Shirokuma MCP Knowledge Base
Last Updated: ${currentDateTime}

## Current Status
- Open Issues: ${openIssues.length}
  - High: ${highCount}
  - Medium: ${mediumCount}  
  - Low: ${lowCount}
- Completed Today: ${completedToday}

## Today's Daily
- Daily ID: dailies-${today}
- Work Sessions: ${sessionCount}
- Completed Tasks: ${completedCount}

## Next Priorities
${topPriorityIssues.map(i => `- ${i.id}: ${i.title}`).join('\n')}

## Recent Updates
- ${today}: ${sessionCompletionSummary}
${previousUpdates}

## Handover for Next Session
- ${importantPointsFromCompletion}
- ${incompleteTasks}
- ${technicalNotes}`,
  updated_by: "ai-finish",
  related: [dailyId, ...nextPriorityIssueIds]
})
```

### 7. Display Completion Summary
```
✅ Session Completed

## Today's Achievements
- Session: ${sessionTitle}
- Work Duration: ${duration}
- Completed: ${completionSummary}

## Updated Status
- Open Issues: ${openCount}
- Next priorities have been set

## How to Start Next Time
Start a new session with /ai-start.
Previous state will be restored from current_state.

Great work! 🎉
```

## Key Principles (from SHIROKUMA.md)

### Required Records (for Next AI)
1. **Where We Are**: Current feature/phase
2. **What's Next**: Specific next action  
3. **Important Notes**: Technical constraints or key decisions only

### Things to Avoid
- ❌ Overly detailed session records
- ❌ Recording all dialogue content
- ❌ Recording temporary trial and error

### Purpose of Recording
- ✅ Minimum info for next AI to continue work
- ✅ Preserve important technical decisions
- ✅ Visualize progress