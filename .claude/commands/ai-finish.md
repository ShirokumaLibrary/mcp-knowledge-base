---
description: End work session and create daily summary
allowed-tools: mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__update_item, mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__update_current_state, Bash(date:*)
---

# ai-finish - End work session

## Usage
```
/ai-finish
```

## Purpose
End the work session, record today's work content, and save handover information to current_state for the next session.

## Session and Daily Management
- **Sessions**: Individual work periods with timestamps (sessions-YYYY-MM-DD-HH.MM.SS.sss)
  - Created with /ai-start command
  - Records work start time, title, and description
  - Can be linked to issues via related field
  
- **Dailies**: Aggregated summary of all work done in a day (dailies-YYYY-MM-DD)
  - Created/updated with /ai-finish command
  - Consolidates all sessions from the day
  - Links to sessions via related_documents field
  - Links to issues via related_tasks field
  - Provides overview of completed tasks, learnings, and plans

## Task

Note: Respond to the user in their language.

### 1. Get today's date
Execute: !`date +"%Y-%m-%d"`

### 2. Retrieve today's sessions
Execute: mcp__shirokuma_knowledge_base__get_items({ 
  "type": "sessions", 
  "start_date": today, 
  "end_date": today 
})

### 3. Retrieve today's issues
Execute: mcp__shirokuma_knowledge_base__get_items({ 
  "type": "issues", 
  "start_date": today, 
  "includeClosedStatuses": true 
})

### 4. Classify issues by status
- Completed: status === "Closed"
- In Progress: status === "In Progress"  
- Open: status === "Open"

### 5. Get existing daily and extract active session

Execute: mcp__shirokuma_knowledge_base__get_item_detail({
  "type": "dailies",
  "id": today
})

Parse the content to find:
- "## [Active Session]" section to get the current session ID
- Existing session list from "## [Today's Work Sessions]"
- Any existing content that should be preserved

### 6. Get active session details

If active session ID found:
Execute: mcp__shirokuma_knowledge_base__get_item_detail({
  "type": "sessions",
  "id": active_session_id
})

Update session with completion notes if needed.

### 7. Generate daily summary content

Update the existing daily content:
- Remove "## [Active Session]" section (session is complete)
- Update "## [Today's Work Sessions]" with all sessions
- Add/update other sections based on today's work

Structure:
```markdown
## [Today's Work Sessions]
- [Session title] (sessions-YYYY-MM-DD-HH.MM.SS.sss)
- **[Session title] (sessions-YYYY-MM-DD-HH.MM.SS.sss)** ← Mark completed session

## [Completed Tasks]
- issues-ID: title (for Closed issues)

## [Tasks in Progress]
- issues-ID: title (for In Progress issues)

## [Technical Learnings]
- [Technical learnings from today]

## [Plans for Tomorrow]
- [Plans for tomorrow]

## [Notes]
- [Work Duration]: first_session_time - current_time

## [Session Details]
### [Session title] (sessions-ID)
- [Session description and key accomplishments]
```

Important: 
- Remove "## [Active Session]" section as work is complete
- Preserve existing session information
- Add completion details for the active session

### 8. Update daily summary

Since daily should already exist (created/updated in ai-start):
Execute: mcp__shirokuma_knowledge_base__update_item({
  "type": "dailies",
  "id": today,
  "content": updated content from step 7,
  "related_tasks": merge existing and new issue IDs (remove duplicates),
  "related_documents": merge existing and new session IDs (remove duplicates)
})

Note: Daily should exist because ai-start creates/updates it. If not found, create it with full content.

Important relationship management:
- related_tasks: For tracking issues (issues-X, plans-X)
- related_documents: For tracking sessions (sessions-YYYY-MM-DD-HH.MM.SS.sss)
- Keep sessions and issues in separate fields for clear organization

### 9. Get all open issues
Execute: mcp__shirokuma_knowledge_base__get_items({ 
  "type": "issues", 
  "includeClosedStatuses": false 
})

### 10. Update current state

Generate current state content (translate to user's language):

Content structure:
- Project name and last update timestamp
- Current status (open issues by priority)
- Today's completions and in-progress count
- Next priorities (up to 3 high priority issues)
- Recent updates
- Handover notes for next session

Template:
```markdown
[Project]: [Project Name]
[Last Updated]: current_datetime

## [Current Status]
- [Open Issues]: X
  - High: Y
  - Medium: Z
- [Completed Today]: N
- [In Progress]: M

## [Next Priorities]
- [List up to 3 High priority issues]

## [Recent Updates]
- [today]: [X issues completed]

## [Handover Notes for Next Session]
- [Issues or notes discovered today]
- [Items to check first tomorrow]
- [Status of ongoing work]
```

### 11. Display completion message

Display in user's language:
- Work session completed
- Daily summary created (with completed issue count)
- Current state updated (with open issue count and priorities set)
- Closing message

Example format:
```
✅ [Work session completed]

## [Daily summary created]
- [Today's work recorded]
- [Completed issues]: X

## [Current state updated]
- [Open issues]: Y (High:A, Medium:B, Low:C)
- [Next priorities set]

[Thank you for your work!]
```

## Example Flow
```
> /ai-finish

📊 [Aggregating today's work...]

✅ [Work session completed]

## [Daily summary created]
- [Today's work recorded]
- [Completed issues]: 2

## [Current state updated]
- [Open issues]: 14 (High:3, Medium:7, Low:4)
- [Next priorities set]

[Thank you for your work!]
```