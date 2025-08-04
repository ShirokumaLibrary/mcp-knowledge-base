---
description: Remind AI of fundamental principles and project context
allowed-tools: Read, mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__search_items
---

# ai-remind - Return to Fundamentals

## Usage
```
/ai-remind [specific topic]
```

Examples:
- `/ai-remind` - Show all fundamental reminders
- `/ai-remind tdd` - Focus on TDD principles
- `/ai-remind memory` - Focus on memory management
- `/ai-remind rules` - Focus on project rules

## Task

@.claude/commands/LANG.markdown

**Like someone with memory disorder checking their fundamental notes**

### 1. Project Rules and Methodology
Read @~/CLAUDE.md using Read tool.
(CLAUDE.md includes SHIROKUMA.md automatically)

### 2. Memory Management Reminder
Execute `mcp__shirokuma-knowledge-base__get_item_detail`:
- type: "knowledge"
- id: 30

Display the actual content from knowledge-30.

### 3. Current Big Picture
Execute `mcp__shirokuma-knowledge-base__get_current_state`

Display summary:
```
## 📍 Current Project State
[First paragraph of current_state]

## 🎯 Active Focus
- Working on: [active issue if any]
- Open issues: [count by priority]
```

### 4. Recent Violations/Patterns
Check for recent items that might indicate rule violations:

Execute `mcp__shirokuma-knowledge-base__search_items`:
- query: "error OR failure OR mistake"
- limit: 5

If found, show:
```
## ⚠️ Recent Lessons
- [Brief summary of mistakes/learnings]
```

### 5. Contextual Reminder
Based on $ARGUMENTS or current context, emphasize relevant principles:

- If "tdd" → Emphasize Red-Green-Refactor cycle
- If "memory" → Emphasize immediate recording
- If "rules" → Emphasize 作業8条
- If working on complex task → Emphasize breaking down

### 6. Action Prompt
```
## 💡 Remember
- You forget everything after session
- Record immediately with /ai-remember
- Check state with /ai-check
- Follow the principles above

Not "I can't because of my limitations"
But "I can because I have MCP" 

What principle do you need to apply now?
```

## Design Principles
- **Dynamic Content** - Always read actual files for latest content
- **Reference Based** - Use @ to link to source files
- **Fundamental over Current** - Focus on unchanging principles
- **Brief but Complete** - Quick reminder, not full documentation
- **Actionable** - Connect principles to current work
- **Positive Framing** - Emphasize capabilities, not limitations

## Files Referenced
- @CLAUDE.md - Project rules (includes @SHIROKUMA.md)
- knowledge-30 - Memory management principles
- current_state - Project status