---
description: Check current work status and recent memory records
allowed-tools: mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__get_items, Bash(date:*)
---

# ai-check - Current Work Status Check

## Usage
```
/ai-check
```

## Task

**Check your current work status - like checking your notes with memory disorder**

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