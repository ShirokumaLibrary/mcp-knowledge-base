---
description: Start a work session and display current issues
argument-hint: "[session description]"
allowed-tools: mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__update_item, mcp__shirokuma-knowledge-base__update_current_state, Bash(date:*)
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

<ultrathink>
This is the improved version of ai-start command. I need to:
1. Check for existing state (either state item or current_state)
2. Check for any active sessions to avoid duplicates
3. Display open issues organized by priority
4. Create a new work session and link it to selected issue
5. Update state and daily records accordingly
</ultrathink>

### 1. Show current state
Try to get structured state first:
Execute: mcp__shirokuma_knowledge_base__get_item_detail({
  type: "state",
  id: "current"
})

If state item exists:
- Display the content
- Note the related items for reference

If state item doesn't exist (404 error):
- Fall back to: mcp__shirokuma_knowledge_base__get_current_state()

IMPORTANT: Display the current state content IMMEDIATELY after execution.
Format:
```
## Current State

[Display the content from state item or current_state]

---
```

### 2. Check for active session

<ultrathink>
I need to check if there's already an active session to prevent session conflicts.
If found, I should offer options to the user rather than creating duplicate sessions.
</ultrathink>

If current_state contains "## アクティブセッション" or "## Active Session":
- Inform user there's already an active session
- Ask if they want to:
  1. Continue the existing session
  2. End the previous session and start a new one
  3. Cancel

If user chooses to end previous session:
- Call /ai-finish first, then proceed with new session

### 3. Display relevant issues
Execute: mcp__shirokuma_knowledge_base__get_items({ 
  "type": "issues", 
  "includeClosedStatuses": false 
})

IMPORTANT: Display issues IMMEDIATELY after fetching, following these rules:
- If current_state mentions "次の優先事項" or "Next priorities", display those issues first with ⭐ emoji
- Group all issues by priority (High → Medium → Low)
- Number issues sequentially for easy reference
- If >10 issues, show all High priority + first 3 of Medium/Low

Required display format:
```
## 📋 Priority Issues (from current_state):
⭐ 1. [high] title (issues-X)
⭐ 2. [high] title (issues-Y)

## 📋 All Open Issues:
**High Priority:**
3. title (issues-Z)
4. title (issues-W)

**Medium Priority:**
5. title (issues-A)
6. title (issues-B)

**Low Priority:**
7. title (issues-C)
```

### 4. Create work session
Get current time: !`date +"%Y-%m-%d %H:%M:%S"`

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

IMPORTANT: Display session creation result IMMEDIATELY:
```
✅ Session Started: [session-id]
📝 Title: [title]
📝 Description: [description]
```

### 5. Prompt for issue selection
IMPORTANT: Ask this question IMMEDIATELY after displaying session info:
"Which issue would you like to work on? (Please provide the number or issue ID)"

### 6. Update session with selected issue
When user selects an issue, execute:
mcp__shirokuma_knowledge_base__update_item({
  type: "sessions",
  id: [created-session-id],
  related_tasks: ["issues-X"]  // where X is the selected issue number
})

### 7. Update state with active session
If using state item:
Execute: mcp__shirokuma_knowledge_base__update_item({
  type: "state",
  id: "current",
  content: [updated content with active session section added],
  related_documents: [...existing_documents, session-id, daily-id],
  related_tasks: [...existing_tasks, selected-issue]
})

If using current_state:
Execute: mcp__shirokuma_knowledge_base__update_current_state({
  content: [updated current state with active session section added]
})

The active session section should be added after "## 現在の状況" or "## Current Status":
```
## アクティブセッション
- セッションID: [session-id]
- タイトル: [session-title]
- 関連イシュー: [selected-issue]
- 開始時刻: [start-time]
```

### 8. Update or create today's daily
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
  "title": "Work Summary - " + today,
  "content": "## Today's Work Sessions\n- " + session_title + " (sessions-" + session_id + ")\n\n## Active Session\n- sessions-" + session_id,
  "related_documents": ["sessions-" + session_id]
})

If daily EXISTS:
Update with new session:
mcp__shirokuma_knowledge_base__update_item({
  "type": "dailies",
  "id": [daily-id],
  "content": [updated content with new session added],
  "related_documents": [existing array + new session ID]
})

### 9. Update current_state with daily reference
Update current_state to include today's daily reference:
```
## 本日のデイリー
- デイリーID: dailies-[today]
- 作業セッション: [count]件
```

## Example Flow
```
> /ai-start Implementing user authentication feature with OAuth2

## Current State
プロジェクト: Shirokuma MCP Knowledge Base
最終更新: 2025-07-31 22:49

## 現在の状況
- オープンイシュー: 15件
  - High: 3件
  - Medium: 8件  
  - Low: 4件

## 次の優先事項
- issues-26: get_items response optimization
- issues-13: Performance optimization
- issues-7: Advanced search feature

[... rest of current state content ...]

---

## 📋 Priority Issues (from current_state):
⭐ 1. [high] get_items response optimization (issues-26)
⭐ 2. [high] Performance optimization (issues-13)
⭐ 3. [high] Advanced search feature (issues-7)

## 📋 All Open Issues:
**High Priority:**
4. Import/Export functionality (issues-6)

**Medium Priority:**
5. Custom Field Feature (issues-20)
[... more issues ...]

✅ Session Started: 2025-07-31-23.45.12.345
📝 Title: Implementing user authentication
📝 Description: Implementing user authentication feature with OAuth2

Which issue would you like to work on? (Please provide the number or issue ID)
```