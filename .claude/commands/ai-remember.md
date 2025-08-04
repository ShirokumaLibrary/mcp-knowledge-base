---
description: Quickly record discoveries, decisions, and issues during work
argument-hint: "<type>: <description>"
allowed-tools: mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__update_current_state, mcp__shirokuma-knowledge-base__get_current_state, Bash(date:*)
---

# ai-remember - Quick Memory Recording

## Usage
```
/ai-remember <content>
```

Examples:
- `/ai-remember decision: Use TDD for all new features`
- `/ai-remember issue: Authentication fails with 401 error`
- `/ai-remember learn: React hooks must be called in the same order`
- `/ai-remember Fixed the database connection bug by adding retry logic`

## Task

@.claude/commands/LANG.markdown

**Add to Memory Bank immediately - like someone with memory disorder taking notes!**

### 1. Parse Input
Analyze $ARGUMENTS to determine:
- Type (decision/issue/learn/note)
- Content
- Priority/urgency

**Type detection patterns**:
- Starts with "decision:" → decisions
- Starts with "issue:" or contains "error/bug/problem" → issues
- Starts with "learn:" or contains "understand/realized" → knowledge
- Default → Quick note in current_state

### 2. Create Appropriate Record

Get current time: !`date +"%Y-%m-%d %H:%M:%S"`

#### For Decisions:
Execute: `mcp__shirokuma-knowledge-base__create_item`
- type: "decisions"
- title: (extract from user input)
- content: (full content with context)
- priority: "high"
- status: "Open"
- tags: ["quick-record", "work-decision"]

#### For Issues:
Execute: `mcp__shirokuma-knowledge-base__create_item`
- type: "issues"
- title: (extract problem summary)
- content: (full description)
- priority: (determine from urgency: high/medium/low)
- status: "Open"
- tags: ["quick-record", "discovered-during-work"]

#### For Learning:
Execute: `mcp__shirokuma-knowledge-base__create_item`
- type: "knowledge"
- title: (extract key learning)
- content: (full explanation)
- tags: ["quick-record", "learned", (relevant topic tags)]

### 3. Update current_state
First execute: `mcp__shirokuma-knowledge-base__get_current_state`

Then add a "Quick Note" section to the content:
```
### Quick Note (timestamp)
- Brief summary of what was recorded
- Recorded as: [type]-[id]
```

Execute: `mcp__shirokuma-knowledge-base__update_current_state`
- content: (updated content with new section)
- updated_by: "ai-remember"
- related: (add new item ID to existing related array)

### 4. Confirmation & Memory Bank Update
Display:
```
✅ Added to Memory Bank: ${itemType}-${itemId}
📝 ${title}
🏷️ Tags: ${tags}
🔗 Updated: current_state

💡 Memory Bank Status:
- This session: ${sessionRecordCount} items recorded
- Quick tip: Use /ai-check to review your Memory Bank

Remember: Every small discovery matters!
```

## Key Principles
- **Speed over perfection** - Better to record roughly than forget
- **Auto-categorization** - Don't burden user with type selection
- **Always update current_state** - Maintain continuity
- **Memory Bank integration** - All records contribute to session memory
- **Encourage frequent use** - Positive reinforcement

## Memory Bank Pattern
Each /ai-remember call:
1. Adds item to appropriate MCP storage
2. Updates current_state with reference
3. Builds session Memory Bank for /ai-finish
4. Enables agent access via /ai-shirokuma

## Error Handling
If creation fails:
1. Try simpler format
2. At minimum, append to current_state
3. Never lose the information

Remember: Like taking notes with memory disorder, the act of recording is more important than perfect organization.