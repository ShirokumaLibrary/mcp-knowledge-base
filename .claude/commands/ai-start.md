---
description: Start a work session and display current issues
argument-hint: "[session description]"
allowed-tools: mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__update_item, Bash(date:*)
---

# ai-start - Start work session

## Usage
```
/ai-start [session description]
```

Examples:
- `/ai-start` - Creates session with default title "[Work Session]"
- `/ai-start Bug fixing for authentication module` - Creates session with description

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

Based on $ARGUMENTS:
- If no arguments: title = "[Work Session]", description = "[Work Started]: " + current_time
- If arguments provided: 
  - Extract concise title from arguments (main topic/action in 5-10 words)
  - Create detailed description explaining the work context and goals

Execute: mcp__shirokuma_knowledge_base__create_item({
  type: "sessions",
  title: extracted_title || "[Work Session]",
  description: detailed_description || $ARGUMENTS || "[Work Started]: " + current_time,
  content: ""
})

Display:
```
✅ [Session Started]: [session-id]
📝 [Title]: [title]
📝 [Description]: [description]
```

Note: When work scope becomes clear, update the session title to reflect the actual work:
- Use mcp__shirokuma_knowledge_base__update_item to update title
- Keep title concise (5-10 words) and descriptive

### 4. Prompt for issue selection
Ask: "[Which issue would you like to work on? (Please provide the number or issue ID)]"

### 5. Update session with selected issue
When user selects an issue, execute:
mcp__shirokuma_knowledge_base__update_item({
  type: "sessions",
  id: [created-session-id],
  related: ["issues-X"]  // where X is the selected issue number
})

### 6. Update or create today's daily
Get today's date: !`date +"%Y-%m-%d"`

Check for existing daily:
mcp__shirokuma_knowledge_base__get_items({ 
  "type": "dailies", 
  "start_date": today, 
  "end_date": today 
})

If daily does NOT exist:
Execute: mcp__shirokuma_knowledge_base__create_item({
  "type": "dailies",
  "date": today,
  "title": "[Work Summary] - " + today (translate to user's language),
  "content": "## [Today's Work Sessions]\n- " + session_title + " (sessions-" + session_id + ")\n\n## [Active Session]\n- sessions-" + session_id,
  "related_documents": ["sessions-" + session_id]
})

If daily EXISTS:
Execute: mcp__shirokuma_knowledge_base__get_item_detail({
  "type": "dailies",
  "id": today
})

Then update with new session:
mcp__shirokuma_knowledge_base__update_item({
  "type": "dailies",
  "id": today,
  "content": Add new session to existing content,
  "related_documents": Add new session ID to existing array
})

Important: When updating content, look for "## [Today's Work Sessions]" section and add the new session. Also update or add "## [Active Session]" section with the current session ID.

## Example Flow
```
> /ai-start Implementing user authentication feature with OAuth2

[Current state content displayed here - handover notes from previous session]

📋 [Open Issues]:
1. [high] Performance Optimization (issues-13)
2. [high] Add Advanced Search (issues-7)
3. [medium] Custom Field Feature (issues-20)

✅ [Session Started]: 2025-07-30-23.45.12.345
📝 [Description]: Implementing user authentication feature with OAuth2

[Which issue would you like to work on? (Please provide the number or issue ID)]
```