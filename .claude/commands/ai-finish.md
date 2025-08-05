---
description: End work session following SHIROKUMA.md methodology
allowed-tools: mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__get_item_detail, mcp__shirokuma-knowledge-base__update_item, mcp__shirokuma-knowledge-base__update_current_state, mcp__shirokuma-knowledge-base__search_items, Bash
---

# ai-finish - End AI Pair Programming Session

## Usage
```
/ai-finish
```

## Purpose
End work session and leave comprehensive records for the next AI session.

## Task

@.claude/agents/LANG.markdown

### Session End Procedure

This command properly closes the current AI session with complete handover and context preservation.

#### 1. Session Validation

- Parse current_state using `mcp__shirokuma-knowledge-base__get_current_state()`
- Look for "## Active Session" section
- **If no active session**: Notify user and exit gracefully
- **If exists**: Extract session ID from "**Session ID**: sessions-XXXX" line
- Get session details using `mcp__shirokuma-knowledge-base__get_item_detail` with extracted session ID

#### 2. Memory Bank Collection

Gather all items created/updated during session:
- Search for items created after session start time using `mcp__shirokuma-knowledge-base__search_items`
- Include decisions, issues, knowledge items
- Compile comprehensive list with references

#### 3. Todo Review

Review todo completion status:
- Display current todo list
- Ask user to confirm completed items
- For incomplete items, ask for notes/reasons
- Update todo statuses accordingly

#### 4. Work Summary Generation

Create comprehensive summary including:
- Session duration calculation
- List of completed todos
- Created/updated items with references
- Key decisions made
- Technical achievements

Format example:
```markdown
## 📊 Session Summary
Duration: X hours Y minutes

### Completed Tasks:
- ✓ [Task description] (issues-XX)

### Created/Updated:
- issues-YY: [Title]
- knowledge-ZZ: [Title]

### Incomplete Tasks:
- ⏸ [Task] - [Reason/Note]

### Next Session:
- Continue with [specific items]
- Consider [recommendations]
```

#### 5. Session Update

Update session item with `mcp__shirokuma-knowledge-base__update_item`:
- Add end time to description
- Update content with summary of achievements
- Add all related item references
- Include final todo status

#### 6. State Handover

Update current_state using `mcp__shirokuma-knowledge-base__update_current_state` to ensure clean handover:
- **Remove** "## Active Session" section completely
- **Add session summary** to "## Recent Context" section:
  ```markdown
  ## Recent Context
  ### Last Session ([session-id])
  - Duration: X hours Y minutes
  - Completed: [brief summary]
  - Working on: [issue-id]
  ```
- **Update "## Next Priorities"** based on incomplete todos
- Include any blockers or considerations for next AI

#### 7. Final Display

Show user a complete summary as formatted in step 4.

### Best Practices

1. **Complete Documentation**
   - Ensure all work is properly documented
   - Clear next steps identified
   - State ready for next session

2. **User Confirmation**
   - Get user confirmation on todo completion
   - Allow notes for incomplete items
   - Ensure nothing is lost

3. **Error Recovery**
   - Handle missing session gracefully
   - Provide manual alternatives if needed
   - Never lose work data

### MCP Permissions

As the main agent executing this command, you have permissions to:
- **Update**: sessions, current_state  
- **Read**: all types
- **Create**: knowledge, handovers (if needed)

Note: Follow the tag rules in @.claude/agents/MCP_RULES.markdown