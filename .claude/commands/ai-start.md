---
description: Start a work session and display current issues
argument-hint: "[session title]"
allowed-tools: mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__update_item, Bash(date:*)
---

# ai-start - Start work session

## Usage
```
/ai-start [session title]
```

Examples:
- `/ai-start` - Creates session with default title
- `/ai-start Bug fixing` - Creates session with custom title

## Task

Note: Respond to the user in their language.

### 1. Display open issues
Execute: mcp__shirokuma_knowledge_base__get_items({ "type": "issues", "includeClosedStatuses": false })

Display format:
```
📋 [Open Issues]:
1. [priority] title (issues-id)
2. [priority] title (issues-id)
...
```

### 2. Create work session
Get current time: !`date +"%Y-%m-%d %H:%M:%S JST"`

Execute: mcp__shirokuma_knowledge_base__create_item({
  type: "sessions",
  title: $ARGUMENTS || "[Work Session]",
  description: "[Work Started]: " + current_time,
  category: "development",
  related_tasks: [],
  tags: []
})

Display:
```
✅ [Session Started]: [session-id]
📝 [Title]: [title]
```

### 3. Show current state
Execute: mcp__shirokuma_knowledge_base__get_current_state()

Display the current state content.

### 4. Prompt for issue selection
Ask: "[Which issue would you like to work on? (Please provide the number or issue ID)]"

### 5. Update session with selected issue
When user selects an issue, execute:
mcp__shirokuma_knowledge_base__update_item({
  type: "sessions",
  id: [created-session-id],
  related_tasks: [selected-issue-id]
})

## Example Flow
```
> /ai-start Feature implementation

📋 [Open Issues]:
1. [high] Performance Optimization (issues-13)
2. [high] Add Advanced Search (issues-7)
3. [medium] Custom Field Feature (issues-20)

✅ [Session Started]: 2025-07-30-23.45.12.345
📝 [Title]: Feature implementation

[Current state content displayed here]

[Which issue would you like to work on? (Please provide the number or issue ID)]
```