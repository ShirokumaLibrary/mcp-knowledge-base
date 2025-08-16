---
description: Simple and intuitive issue management for AI pair programming
argument-hint: "[issue-id | 'issue description' | search 'keyword' | export]"
allowed-tools: mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, mcp__shirokuma-kb__search_items, mcp__shirokuma-kb__list_items
---

# /ai-issue

## Language

@.shirokuma/configs/lang.md

## Purpose

Simple and intuitive issue management for AI pair programming sessions.
**This command ONLY manages issues - it never executes work or starts tasks.**

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
When provided with a CLEAR issue description:
- Text must be either quoted OR contain obvious issue keywords (bug, error, problem, feature, etc.)
- Ambiguous text triggers confirmation dialog
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

### Argument Parsing Rules

**CRITICAL**: Parse arguments in this EXACT order to avoid misinterpretation:

1. **No arguments** → List open issues
2. **Numeric only (e.g., "42")** → Show issue details  
3. **Numeric + action (e.g., "42 close")** → Update issue status
4. **"search" + keyword** → Search issues
5. **"export"** → Export issues (special case)
6. **Text starting with quotes or clear issue keywords** → Create new issue
7. **Ambiguous text** → **ALWAYS ASK before proceeding**

**STRICT RULES**:
- This command ONLY manages issues, NEVER executes work
- If text could be interpreted as a work request, STOP and clarify
- Never use Task or agent tools from this command
- Issue creation requires explicit confirmation for ambiguous requests

**When text is ambiguous**, respond with:
```
Your input: "[user text]"

What would you like to do?
1. Create a new issue with this description
2. Search for existing issues about this
3. Cancel (use /ai-go if you want to start working)

Please choose 1, 2, or 3.
```

## Examples

```bash
# Morning routine
/ai-issue                           # What needs to be done?

# Found a bug (with quotes = clear intent)
/ai-issue "Login fails with empty password"

# Found a bug (with keywords = clear intent)  
/ai-issue bug: login fails with empty password

# Check specific issue
/ai-issue 103

# Mark as done
/ai-issue 103 close

# Find related issues
/ai-issue search "login"

# Ambiguous input (will trigger confirmation)
/ai-issue fix the authentication system  # → Asks what you want to do
```

## Related Commands

- `/ai-start` - Begin work session and see context
- `/ai-go` - Execute work on selected issue
- `/ai-finish` - End session with handover