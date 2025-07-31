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

### 1. Show current state
Execute: mcp__shirokuma_knowledge_base__get_current_state()

Display the current state content (handover notes from previous session).

### 2. Display relevant issues
Based on current_state content, fetch and display issues intelligently:

Execute: mcp__shirokuma_knowledge_base__get_items({ 
  "type": "issues", 
  "includeClosedStatuses": false 
})

Then:
- If current_state mentions "Next priorities", display those issues first with emphasis
- Group by priority (High → Medium → Low) for better visibility
- If there are many issues (>10), consider showing only High priority by default

Display format:
```
📋 [Priority Issues] (from current_state):
⭐ 1. [high] title (issues-X)
⭐ 2. [high] title (issues-Y)

📋 [All Open Issues]:
High Priority:
3. title (issues-Z)

Medium Priority:
4. title (issues-A)
5. title (issues-B)

Low Priority:
6. title (issues-C)
```

Note: Adapt display based on number of issues and current_state guidance

### 3. Create work session
Get current time: !`date +"%Y-%m-%d %H:%M:%S JST"`

Execute: mcp__shirokuma_knowledge_base__create_item({
  type: "sessions",
  title: $ARGUMENTS || "[Work Session]",
  description: "[Work Started]: " + current_time,
  content: ""
})

Display:
```
✅ [Session Started]: [session-id]
📝 [Title]: [title]
```

### 4. Prompt for issue selection
Ask: "[Which issue would you like to work on? (Please provide the number or issue ID)]"

### 5. Update session with selected issue
When user selects an issue, execute:
mcp__shirokuma_knowledge_base__update_item({
  type: "sessions",
  id: [created-session-id],
  related: ["issues-X"]  // where X is the selected issue number
})

## Example Flow
```
> /ai-start Feature implementation

[Current state content displayed here - handover notes from previous session]

📋 [Open Issues]:
1. [high] Performance Optimization (issues-13)
2. [high] Add Advanced Search (issues-7)
3. [medium] Custom Field Feature (issues-20)

✅ [Session Started]: 2025-07-30-23.45.12.345
📝 [Title]: Feature implementation

[Which issue would you like to work on? (Please provide the number or issue ID)]
```