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

### 5. Generate daily summary content

Create a markdown summary with these sections (translate headers to user's language):
- Today's work sessions
- Completed tasks
- Tasks in progress
- Technical learnings
- Plans for tomorrow
- Notes (including work duration)

Structure:
```markdown
## [Today's Work Sessions]
- [List session titles]

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
```

### 6. Check for existing daily
Execute: mcp__shirokuma_knowledge_base__get_items({ 
  "type": "dailies", 
  "start_date": today, 
  "end_date": today 
})

### 7. Create or update daily
If exists: update_item, else: create_item
- type: "dailies"
- date: today
- title: "[Work Summary] - " + today (translate to user's language)
- content: generated content
- related_tasks: array of today's session and issue IDs
- tags: []

### 8. Get all open issues
Execute: mcp__shirokuma_knowledge_base__get_items({ 
  "type": "issues", 
  "includeClosedStatuses": false 
})

### 9. Update current state

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

### 10. Display completion message

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