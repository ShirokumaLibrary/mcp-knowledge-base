---
description: Check current work status and recent memory records
argument-hint: "[deep|validate]"
allowed-tools: mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__search_items_by_tag, mcp__shirokuma-knowledge-base__search_items, Bash(date:*), Task
---

# ai-check - Current Work Status Check

## Usage
```
/ai-check          # Basic status check
/ai-check deep     # Deep analysis with mcp-specialist
/ai-check validate # Check items needing validation
```

## Task

@.claude/agents/LANG.markdown

**Check your current work status - like checking your notes with memory disorder**

Parse arguments: $ARGUMENTS
- If "deep": Use shirokuma-mcp-specialist for advanced analysis
- If "validate": Check items needing validation
- Otherwise: Perform standard check

If $ARGUMENTS === "deep":
  Task: Use shirokuma-mcp-specialist for deep analysis
  Purpose: Comprehensive relationship mapping and pattern detection
  Details:
    - Analyze item relationships across all types
    - Detect patterns in recent work
    - Identify orphaned or disconnected items
    - Create visualization of work structure
    - Suggest optimizations and connections
    - Generate detailed insights report
  After agent completes, continue with standard check below.

If $ARGUMENTS === "validate":
  ## 🔍 Validation Check
  
  # Search for items with validation_needed tag
  Execute: `mcp__shirokuma-knowledge-base__search_items_by_tag`
  - tag: "validation_needed"
  
  # Also search for items missing validated tag
  Execute in parallel:
  - Search decisions without "validated" tag from last 30 days
  - Search knowledge items with technical keywords without "validated" tag
  
  Display:
  ```
  ## 🔍 Items Needing Validation
  
  ### Decisions requiring validation: [count]
  - [age] days: [title] (decisions-XX)
    Keywords: [technical keywords found]
    
  ### Knowledge items to verify: [count]  
  - [age] days: [title] (knowledge-XX)
    Topic: [main technical area]
  
  ### Validation Tips:
  - Use WebSearch to check current best practices
  - Update items with validation results
  - Add "validated" tag when complete
  - Consider re-validation after 30 days
  
  Quick validate: /ai-remember decision: validate [item-id]
  ```
  
  If no items need validation:
  ```
  ✅ All items are validated or non-technical!
  ```
  
  End after validation check (skip standard check).

### 1. Get Current State
Execute: `mcp__shirokuma-knowledge-base__get_current_state()`

Display summary:
```
## 📍 Current State
[Show first 10 lines of current_state]
...
```

### 2. Check Active Session
Get current time: !`date +"%Y-%m-%d %H:%M:%S"`

Search for active session in current_state.
If found, calculate elapsed time.

```
## ⏱️ Active Session
- Session: [session-id]
- Started: [time] ([elapsed] ago)
- Working on: [issue-id]
```

### 3. Recent Records (Memory Bank Check)
Get current datetime and calculate 1 hour ago.

**Check Memory Bank records**:

Calculate one hour ago in ISO datetime format.

Execute these in parallel:
- `mcp__shirokuma-knowledge-base__get_items` with type: "decisions", start_date: (one hour ago)
- `mcp__shirokuma-knowledge-base__get_items` with type: "issues", start_date: (one hour ago)
- `mcp__shirokuma-knowledge-base__get_items` with type: "knowledge", start_date: (one hour ago)
- `mcp__shirokuma-knowledge-base__get_items` with type: "sessions", limit: 1

These results form your Memory Bank - what you've recorded.

Display:
```
## 📝 Memory Bank Status (Last Hour)

**Decisions Recorded:** [count]
- [time]: [title] (decisions-XX)
- [time]: [title] (decisions-YY)
(show first 3)

**Issues Tracked:** [count]
- [time]: [title] (issues-XX)
(show first 3)

**Knowledge Captured:** [count]
- [time]: [title] (knowledge-XX)
(show first 3)

💡 Total Memory Bank Items: [sum of all counts]
```

### 4. Memory Checklist
Based on elapsed time and recent records, display:

```
## ✅ Memory Checklist

⚠️ Have you recorded:
- [ ] Any decisions made?
- [ ] Problems encountered?
- [ ] Things learned?
- [ ] Progress on current issue?

💡 Quick record: /ai-remember [your note]
```

If no records in last 30 minutes:
```
⚠️ No records in 30+ minutes! 
Remember: Like someone with memory disorder, record frequently!
```

### 5. Next Actions & Commands
```
## 🚀 What's Next?

**Quick Actions:**
- /ai-remember [note] - Record a discovery NOW
- /ai-shirokuma [task] - Need help from agents?
- /ai-finish - Ready to end session?

**Memory Bank Tip:**
Your Memory Bank has [total items count] items.
[If < 5 items: "⚠️ Consider recording more discoveries!"]
[If >= 5 items: "✅ Good recording frequency!"]
```