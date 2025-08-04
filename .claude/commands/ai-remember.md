---
description: Quickly record discoveries, decisions, and issues during work
argument-hint: "<type>: <description>"
allowed-tools: mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__update_current_state, mcp__shirokuma-knowledge-base__get_current_state, Bash(date:*), Task, WebSearch
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

@.claude/agents/LANG.markdown

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
# Check if this is a technical decision that needs validation
If content contains technical keywords (API, protocol, implementation, architecture, etc.):
  Ask user: "This appears to be a technical decision. Would you like to validate it with web search? (y/n)"
  
  If user confirms:
    # Perform web search validation
    Extract key technical terms from content
    Execute WebSearch with query: "[technical terms] best practices 2025"
    
    # Create decision with validation
    Execute: `mcp__shirokuma-knowledge-base__create_item`
    - type: "decisions"
    - title: (extract from user input)
    - content: |
        ## Decision: [title]
        
        ### Context
        [original content]
        
        ### External Validation
        - Search Date: [current date]
        - Query: [search query used]
        - Key Findings:
          [summarize relevant findings]
        - Sources:
          [list main URLs]
        
        ### Final Decision
        [decision considering validation]
    - priority: "high"
    - status: "Open"
    - tags: ["quick-record", "work-decision", "validated", "validation_needed"]
  
  Else:
    # Create without validation but mark for later
    Execute: `mcp__shirokuma-knowledge-base__create_item`
    - type: "decisions"
    - title: (extract from user input)
    - content: (full content with context)
    - priority: "high"
    - status: "Open"
    - tags: ["quick-record", "work-decision", "validation_needed"]
    
Else:
  # Non-technical decisions don't need validation
  Execute: `mcp__shirokuma-knowledge-base__create_item`
  - type: "decisions"
  - title: (extract from user input)
  - content: (full content with context)
  - priority: "high"
  - status: "Open"
  - tags: ["quick-record", "work-decision"]

#### For Issues:
# For complex issues (>50 chars), use specialized agent
If content length > 50 characters or contains multiple sentences:
  Task: Use shirokuma-issue-manager to create and manage issue
  Purpose: Create issue with duplicate checking and proper linking
  Details: 
    - Title: (extract problem summary)
    - Description: (full description)
    - Check for duplicates before creating
    - Set appropriate priority based on urgency
    - Link to current work context
    - Add tags: ["quick-record", "discovered-during-work"]
Else:
  # Simple issues can be created directly for speed
  Execute: `mcp__shirokuma-knowledge-base__create_item`
  - type: "issues"
  - title: (extract problem summary)
  - content: (full description)
  - priority: (determine from urgency: high/medium/low)
  - status: "Open"
  - tags: ["quick-record", "discovered-during-work"]

#### For Learning:
# For substantial knowledge (>50 chars), use specialized agent
If content length > 50 characters or contains technical details:
  Task: Use shirokuma-knowledge-curator to organize knowledge
  Purpose: Properly classify and organize technical knowledge
  Details:
    - Title: (extract key learning)
    - Content: (full explanation)
    - Check for similar existing knowledge
    - Classify appropriately (generic vs project-specific)
    - Add relevant topic tags
    - Link to related knowledge items
    - Base tags: ["quick-record", "learned"]
Else:
  # Quick learnings can be created directly
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

${if validated}
🔍 Validation: External sources checked
${elif validation_needed}
⚠️ Validation: Marked for future validation
${endif}

💡 Memory Bank Status:
- This session: ${sessionRecordCount} items recorded
- Quick tip: Use /ai-check to review your Memory Bank
${if has_validation_needed_items}
- Pending validations: ${validation_needed_count} items
${endif}

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