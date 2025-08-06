# /ai-issue

## Language

@.claude/agents/LANG.markdown

## Purpose

Simple and intuitive issue management for AI pair programming sessions.

## Usage

```bash
/ai-issue                    # List open issues
/ai-issue "bug description"  # Create new issue
/ai-issue 103                # Show issue details
/ai-issue 103 close          # Update issue status
/ai-issue search "keyword"   # Search issues
```

## Features

### 1. List Open Issues (no arguments)
Shows all open issues in a concise format:
- Issue number, title, priority
- Tags for quick context
- Creation date

### 2. Create New Issue (with description)
When provided with a text description:
- Creates a new issue automatically
- Sets priority based on keywords (bug=high, improvement=medium, etc.)
- Returns the new issue number

### 3. View Issue Details (with number)
Shows complete issue information:
- Full description and content
- Related tasks and documents
- Current status and priority
- History of updates

### 4. Update Issue Status (with number + action)
Supports simple status updates:
- `close` - Mark as Closed
- `reopen` - Mark as Open
- `progress` - Mark as In Progress

### 5. Search Issues (search + keyword)
Search across all issues:
- Searches in title, description, and content
- Shows matching issues with context
- Includes closed issues in results

## Implementation

This command consolidates the issue-related functionality from the deprecated /ai-remember and /ai-remind commands into a single, focused interface.

## Examples

```bash
# Morning routine
/ai-issue                           # What needs to be done?

# Found a bug
/ai-issue "Login fails with empty password"

# Check specific issue
/ai-issue 103

# Mark as done
/ai-issue 103 close

# Find related issues
/ai-issue search "login"
```

## Related Commands

- `/ai-start` - Begin work session and see context
- `/ai-go` - Execute work on selected issue
- `/ai-finish` - End session with handover

## Migration Notice

This command replaces the issue-related functionality previously spread across:
- `/ai-remember` (for creating issues)
- `/ai-remind` (for retrieving issues)
- `/ai-check` (for status checks)

For a simpler, more focused workflow.