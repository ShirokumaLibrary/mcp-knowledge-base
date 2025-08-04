# API Reference

> Last Updated: 2025-08-03 (v0.7.8)

## Content Management

### Items API (All Content Types)

#### `get_items` - Retrieve items by type

**Parameters:**
- `type` (string, required) - Item type from `get_types` or built-in types ('sessions', 'dailies')
- `includeClosedStatuses` (boolean) - Include closed status items (tasks only, default: false)
- `statuses` (string[]) - Filter by specific status names (tasks only)
- `start_date` (string) - Filter from date YYYY-MM-DD (sessions/dailies: by date, others: by updated_at)
- `end_date` (string) - Filter until date YYYY-MM-DD
- `limit` (number) - Maximum items to return

**Examples:**

To get the latest session:
- type: "sessions"
- limit: 1

To get open issues:
- type: "issues"
- statuses: ["Open", "In Progress"]

To get this week's daily summaries:
- type: "dailies"
- start_date: "2025-07-29"
- end_date: "2025-08-03"
#### `get_item_detail` - Get full item details

**Parameters:**
- `type` (string, required) - Item type
- `id` (number, required) - Item ID

#### `create_item` - Create new item

**Common Parameters:**
- `type` (string, required) - Item type
- `title` (string, required) - Item title
- `description` (string) - Brief description
- `tags` (string[]) - Tag names
- `version` (string) - Version information (e.g., "0.7.8", "v1.2.0")

**Type-specific Parameters:**

**Tasks (issues, plans)**:
- `content` (string) - Detailed content
- `status` (string, required) - Status name
- `priority` (string, required) - Priority: high, medium, low
- `start_date` (string) - Start date YYYY-MM-DD
- `end_date` (string) - End date YYYY-MM-DD
- `related_tasks` (string[]) - Related task IDs (e.g., ["issues-1", "plans-2"])
- `related_documents` (string[]) - Related document IDs

**Documents (docs, knowledge)**:
- `content` (string, required) - Document content
- `priority` (string) - Optional priority
- `related_documents` (string[]) - Related document IDs
- `related_tasks` (string[]) - Related task IDs

**Sessions**:
- `content` (string) - Session notes
- `datetime` (string) - ISO 8601 datetime (default: now)
- `id` (string) - Custom session ID
- `category` (string) - Category: development, meeting, research, debugging

**Dailies**:
- `content` (string, required) - Daily summary
- `date` (string, required) - Date YYYY-MM-DD (one per day)

#### `update_item` - Update existing item

**Parameters:**
- `type` (string, required) - Item type
- `id` (number, required) - Item ID
- Plus any create_item parameters to update

#### `delete_item` - Delete item

**Parameters:**
- `type` (string, required) - Item type
- `id` (number, required) - Item ID

#### `search_items_by_tag` - Search by tag

**Parameters:**
- `tag` (string, required) - Tag name to search
- `types` (string[]) - Filter by types (omit for all)

### Code Search & Indexing

#### `index_codebase` - Index files for semantic search

**Parameters:**
- `exclude` (string[]) - Additional exclude patterns
- `force` (boolean) - Force re-index all files

**Example:**

For initial indexing:
- No parameters needed

For forced re-index with custom excludes:
- exclude: ["*.test.ts", "dist/**"]
- force: true

#### `search_code` - Semantic code search

**Parameters:**
- `query` (string, required) - Natural language or code snippet
- `fileTypes` (string[]) - Filter by extensions (e.g., ["ts", "js"])
- `limit` (number) - Max results (default: 10)

**Example:**

For natural language search:
- query: "authentication middleware"

For TypeScript-only search:
- query: "database connection"
- fileTypes: ["ts"]
- limit: 20

#### `get_related_files` - Find related files

**Parameters:**
- `file` (string, required) - Base file path
- `depth` (number) - Relation depth (default: 1)

#### `get_index_status` - Check index status

Returns indexing statistics and status.

### Search

#### `search_items` - Full-text search

**Parameters:**
- `query` (string, required) - Search query text
- `types` (string[]) - Filter by types
- `limit` (number) - Max results (default: 20, max: 100)
- `offset` (number) - Pagination offset (default: 0)

**Search includes:** title, description, content, and tags

#### `search_suggest` - Autocomplete suggestions

**Parameters:**
- `query` (string, required) - Partial query (min 2 chars)
- `types` (string[]) - Filter by types
- `limit` (number) - Max suggestions (default: 10, max: 20)

**Returns:** Titles and tags matching the query

### Tags
- `get_tags`: Retrieve all tags
- `create_tag`: Create new tag
- `delete_tag`: Delete tag
- `search_tags`: Search tags by pattern

### Statuses
- `get_statuses`: Retrieve all statuses (includes is_closed flag)
- ~~`create_status`~~: (Disabled) Status creation is managed through database initialization
- ~~`update_status`~~: (Disabled) Status updates are not supported
- ~~`delete_status`~~: (Disabled) Status deletion is not supported

### Types
- `get_types`: Retrieve all default and custom types (does NOT include sessions/dailies)
  - Optional: `include_definitions` (boolean) - Include full type definitions (default: false)
- `create_type`: Create new type
  - Required: `name` (string) - Type name (lowercase letters, numbers, underscores)
  - Optional: `base_type` (string) - Base type: 'tasks' or 'documents' (default: 'documents')
- `update_type`: Update type description
  - Required: `name` (string) - Name of the type to update
  - Required: `description` (string) - New description for the type
- `delete_type`: Delete custom or default type (only if no items exist, cannot delete sessions/dailies)
- `change_item_type`: Change item type to another type with same base_type
  - Required: `from_type` (string) - Current type of the item
  - Required: `from_id` (number) - Current ID of the item
  - Required: `to_type` (string) - New type (must have same base_type)
  - Creates new item with new ID and updates all references

## API Parameters

### Item Types
When using item-related commands, specify the type parameter. Available types can be discovered using `get_types`.

**Built-in types** (cannot be deleted, not shown in get_types):
- `sessions` - Work sessions with timestamp-based IDs (YYYY-MM-DD-HH.MM.SS.sss)
- `dailies` - Daily summaries with date-based IDs (YYYY-MM-DD), one per day limit

**Default types** (pre-configured at initialization, can be deleted):
- `issues` - Bug reports, feature requests, tasks
- `plans` - Project plans with timelines
- `docs` - Documentation
- `knowledge` - Knowledge base entries

**Custom types** (created via `create_type`):
- Any type you create (e.g., `decisions`, `meetings`, `research`)
- Inherit from either "tasks" (with status/priority) or "documents" (content-focused)

### Common Parameters
- `id` - Identifier for items:
  - Regular items: Numeric (e.g., "1", "2", "3")
  - Sessions: Timestamp format (YYYY-MM-DD-HH.MM.SS.sss)
  - Dailies: Date format (YYYY-MM-DD)
- `type` - Item type (use `get_types` for default/custom types, or 'sessions'/'dailies' for built-in types)
- `title` - Title of the item
- `content` - Main content (required for all item types)
- `tags` - Array of tag names
- `priority` - Priority level (high, medium, low) for issues/plans
- `status` - Status name for issues/plans (stored as name in markdown files)
- `related_tasks` - Array of task references (e.g., ["issues-1", "plans-2"]) for cross-referencing
- `related_documents` - Array of document references (e.g., ["docs-1", "knowledge-2"]) for cross-referencing

### Date Parameters
- `date` - Format: YYYY-MM-DD
- `start_date` - Start of date range (inclusive)
- `end_date` - End of date range (inclusive, includes entire day)

### Date Filtering in get_items
The `get_items` API now supports date range filtering with different behavior based on item type:
- **Sessions/Dailies**: Filters by the session/daily date (`start_date` field)
- **All other types**: Filters by last update time (`updated_at` field)

Examples:
```
# Get sessions from July 2025
get_items(type: 'sessions', start_date: '2025-07-01', end_date: '2025-07-31')

# Get latest session (replacement for get_latest_session)
get_items(type: 'sessions', limit: 1)

# Get today's sessions
get_items(type: 'sessions', start_date: '2025-07-28', end_date: '2025-07-28')

# Get recently updated documents (after July 20th)
get_items(type: 'docs', start_date: '2025-07-20')

# Get issues updated in a specific period
get_items(type: 'issues', start_date: '2025-07-01', end_date: '2025-07-15')

# Get dailies for a specific week
get_items(type: 'dailies', start_date: '2025-07-22', end_date: '2025-07-28')
```

### Search Parameters
- `tag` - Tag name to search for
- `pattern` - Search pattern for tags
- `types` - Array of item types to search (optional, accepts any valid type)

### Application State (Critical for AI Continuity)

The current_state is a special persistent storage that maintains context between AI sessions. Since AI instances have no memory after a conversation ends, this state is crucial for continuity.

#### `get_current_state` - Get persistent state

**Purpose:** Retrieve the saved state from previous AI sessions to restore context.

**Returns:**

Returned data structure:
- content: Markdown-formatted content with project state
- metadata:
  - updated_at: Update timestamp (ISO 8601)
  - updated_by: Who updated (e.g., "ai-start", "ai-finish", "ai-session-123")
  - tags: Array of tags for categorization
  - related: Array of related item IDs (e.g., ["sessions-123", "issues-45"])

**When to use:**
- Always at the start of a new AI session
- When resuming work on a project
- To check project status or blockers

#### `update_current_state` - Update state

**Purpose:** Save current context for the next AI session.

**Parameters:**
- `content` (string, required) - Markdown content including:
  - Current project status
  - Active issues and their state
  - Next steps or blockers
  - Important decisions made
  - Any context the next AI needs
- `updated_by` (string) - Who/what is updating (e.g., "ai-start", "ai-finish", "manual")
- `tags` (string[]) - Tags like ["milestone", "blocked", "v0.7.8"]
- `related` (string[]) - Related items like ["sessions-2025-08-03-10.30.00.123", "issues-45"]

**When to use:**
- At the end of every AI session (critical!)
- After completing major milestones
- When encountering blockers
- Before switching to a different task

**Example state content:**
```
# Project: Shirokuma MCP Knowledge Base
Version: v0.7.8
Last Updated: 2025-08-03 15:45 JST

## Current Status
Working on authentication module refactoring.

## Progress Today
- ✅ Fixed OAuth2 callback issue (issues-45)
- ✅ Updated documentation
- 🔄 Integration tests in progress

## Active Issues
- issues-46: Session timeout bug (In Progress)
- issues-47: Rate limiting implementation (Open)

## Blockers
- Waiting for OAuth provider API key renewal

## Next Steps
1. Complete integration tests for auth module
2. Start on issues-46 (session timeout)
3. Review PR feedback

## Important Context
- Using new async pattern discussed in sessions-2025-08-03-10.30.00.123
- Decision to use Redis for session storage (see docs-15)
```

## Data Storage

### File Structure

```
.database/
├── current_state.md      # Application state
├── .shirokuma.db        # SQLite database
├── .index/              # Code search index
├── issues/              # Task items
│   └── issues-{id}.md
├── plans/
│   └── plans-{id}.md
├── docs/                # Documents
│   └── docs-{id}.md
├── knowledge/
│   └── knowledge-{id}.md
├── sessions/            # Work logs
│   └── YYYY-MM-DD-HH.MM.SS.sss.md
├── dailies/             # Daily summaries
│   └── YYYY-MM-DD.md
└── {custom-type}/       # Custom types
    └── {type}-{id}.md
```

### Markdown Front Matter

```yaml
---
id: "123"
type: "issues"
title: "Fix authentication bug"
description: "Users cannot login"
status: "Open"
priority: "high"
version: "0.7.8"
tags: ["bug", "auth"]
related_tasks: ["issues-124"]
related_documents: ["docs-5"]
created_at: "2025-08-03T10:00:00Z"
updated_at: "2025-08-03T10:30:00Z"
---

# Content in Markdown
```

## Environment Variables

- `DATABASE_ROOT` - Data directory path (default: `.database`)
- `LOG_LEVEL` - Logging level: debug, info, warn, error (default: `info`)
- `NODE_ENV` - Environment: development, test, production
- `MCP_DATABASE_PATH` - Override database location for testing