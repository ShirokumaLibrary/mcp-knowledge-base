# Usage Guide

> Last Updated: 2025-08-03 (v0.7.8)

This guide provides practical examples for using the Shirokuma MCP Knowledge Base.

## Core Concepts

### Content Types

Shirokuma uses a unified API for all content types:

- **Built-in** (`sessions`, `dailies`) - Cannot be deleted, special ID formats, not shown in `get_types`
- **Default Tasks** (`issues`, `plans`) - Pre-configured with status/priority, can be deleted
- **Default Documents** (`docs`, `knowledge`) - Pre-configured for content, can be deleted
- **Custom** - Create your own types with `create_type`, inherit from tasks or documents

### Creating Items

**Creating an issue with version tracking:**

Use the `create_item` tool with these parameters:
- type: "issues" (note: plural form)
- title: "Fix login bug"
- content: "Users cannot login with special characters"
- status: "Open" (required for task types)
- priority: "high"
- version: "0.7.8"
- tags: ["bug", "auth"]

**Creating documentation:**

- type: "docs"
- title: "API Documentation"
- content: Your markdown content
- tags: ["documentation", "api"]

**Creating a knowledge entry:**

- type: "knowledge"
- title: "Best Practices for Error Handling"
- content: Guidelines in markdown format
- tags: ["best-practices", "error-handling"]

**Creating a plan:**

- type: "plans" (note: plural form)
- title: "Q1 2025 Roadmap"
- content: "Major features for Q1"
- status: "Open" (required)
- priority: "high"
- start_date: "2025-01-01"
- end_date: "2025-03-31"
- tags: ["roadmap", "q1-2025"]

### Retrieving Items

**To get all issues:**

Use `get_items` with:
- type: "issues"

**To get open issues only:**

- type: "issues"
- statuses: ["Open", "In Progress"]

**To get specific item details:**

Use `get_item_detail` with:
- type: "issues"
- id: 123

### Updating Items

**To update an issue:**

Use `update_item` with:
- type: "issues"
- id: 123
- title: "Updated: Fix login bug" (optional)
- priority: "critical" (optional)
- status: "In Progress" (use status name, not ID)

**To update document content:**

- type: "docs"
- id: 456
- content: Your updated markdown content

### Searching Items

**To search across multiple types:**

Use `search_items_by_tag` with:
- tag: "feature"
- types: ["issues", "plans"] (note: plural forms)

**To search all types:**

- tag: "important"
- types: (omit to search all)

## Working with Sessions

**Creating a new work session:**

Use `create_item` with:
- type: "sessions"
- title: "Implementing authentication"
- content: Progress notes in markdown format
- tags: ["auth", "backend"]
- category: "development" (optional)

**Getting the latest session:**

Use `get_items` with:
- type: "sessions"
- limit: 1

**Updating session with progress:**

Use `update_item` with:
- type: "sessions"
- id: The session ID (e.g., "2025-08-03-10.30.00.123")
- content: Updated progress notes

**Searching sessions by tag:**

Use `search_items_by_tag` with:
- tag: "auth"
- types: ["sessions"]

**Getting sessions for a date range:**

Use `get_items` with:
- type: "sessions"
- start_date: "2025-07-20"
- end_date: "2025-07-24"

## Working with Daily Summaries

**Creating a daily summary:**

Use `create_item` with:
- type: "dailies"
- date: "2025-07-24" (required, one per day)
- title: "Major refactoring completed"
- content: Summary in markdown format
- tags: ["milestone", "refactoring"]

**Getting summaries for a date range:**

Use `get_items` with:
- type: "dailies"
- start_date: "2025-07-20"
- end_date: "2025-07-24"

**Updating today's summary:**

Use `update_item` with:
- type: "dailies"
- id: The date (e.g., "2025-07-24")
- content: Updated summary content

## Tag Management

**Creating a tag:**

Use `create_tag` with:
- name: "feature"

**Getting all tags:**

Run `get_tags` to see all available tags with usage counts.

**Searching for tags by pattern:**

Use `search_tags` with:
- pattern: "test" (returns all tags containing "test")

**Deleting a tag:**

Use `delete_tag` with:
- name: "obsolete-tag"

## Status Management

**Getting all statuses:**

Run `get_statuses` to see available statuses with their `is_closed` status.

**Note:** Status creation, update, and deletion are disabled. Statuses are managed through database initialization.

Default statuses:
- Open (is_closed: false)
- In Progress (is_closed: false) 
- Closed (is_closed: true)
- On Hold (is_closed: false)
- Resolved (is_closed: true)

## Type Management

**Getting all available types:**

Run `get_types` to see default and custom types (not sessions/dailies).

**Creating a custom type:**

Use `create_type` with:
- name: "recipe" (lowercase, no spaces)
- base_type: "documents" or "tasks"
- description: "Cooking recipes and instructions"

**Updating type description:**

Use `update_type` with:
- name: "recipe"
- description: "Detailed cooking recipes with ingredients and steps"

**Changing item type:**

Use `change_item_type` to move items between types (same base_type only):
- from_type: "docs"
- from_id: 123
- to_type: "knowledge"

This creates a new item with a new ID and updates all references.

**Deleting a custom type:**

Use `delete_type` with:
- name: "recipe" (only works if no items exist)

## Application State (Essential for AI Continuity)

**Why is this critical?**

When an AI conversation ends, all context is lost. The current_state is your lifeline for continuity - it's how the next AI knows what was happening.

**Starting a new session:**

Always check the current state first:
1. Use `get_current_state` to see what was happening
2. Review active issues and blockers
3. Continue from where the last session left off

**During your work:**

Update the state when:
- You complete a major task
- You encounter a blocker
- You make an important decision
- You discover something the next AI needs to know

**Ending your session:**

**CRITICAL**: Always update the state before ending:

Use `update_current_state` with:
- content: A comprehensive summary including:
  - What you worked on
  - What you completed
  - Any blockers or issues
  - Next steps for the next AI
  - Important context or decisions
- updated_by: "ai-finish" (or your session identifier)
- tags: ["session-end", "v0.7.8", etc.]
- related: IDs of items you worked on

**Example workflow:**

Start of session:
1. `get_current_state` - See previous context
2. `get_items({ type: "issues", statuses: ["Open", "In Progress"] })` - Check active work
3. `create_item({ type: "sessions", ... })` - Start work session

End of session:
1. `update_item({ type: "sessions", ... })` - Update your session
2. `update_current_state({ content: "...", updated_by: "ai-finish" })` - Save context
3. `create_item({ type: "dailies", ... })` - Create daily summary if needed

## Error Handling

**All MCP operations may return errors.**


Common errors:
- `Item not found` - Invalid ID or type
- `Validation failed` - Missing required fields
- `Type mismatch` - Can't change between different base types
- `Duplicate entry` - Daily summary already exists for date