# API Reference

## Content Management

### Unified Items API (All Types: Issues, Plans, Documents, Knowledge, Sessions, Dailies)
- `get_items`: Get items by type
  - Type parameter accepts any value returned by `get_types` (including 'sessions' and 'dailies')
  - For tasks types: Default excludes closed statuses
  - Optional: `includeClosedStatuses` (boolean) - Include items with closed statuses
  - Optional: `statuses` (array) - Filter by specific status names
  - Optional: `start_date` (string) - Filter from this date (YYYY-MM-DD)
  - Optional: `end_date` (string) - Filter until this date (YYYY-MM-DD)
  - Optional: `limit` (number) - Maximum number of items to return
  - **Special usage**: For sessions, use `limit: 1` to get latest session
- `get_item_detail`: Get detailed information for specified item
- `create_item`: Create new item of any type
  - For sessions: Optional `datetime` (ISO 8601) for past data migration
  - For sessions: Optional `id` (string) for custom session ID
  - For sessions: Optional `category` (string) for categorization
  - For dailies: Optional `date` (YYYY-MM-DD) - defaults to today
- `update_item`: Update existing item
- `delete_item`: Delete item
- `search_items_by_tag`: Search items by tag (with optional type filter)

### Work Sessions (DEPRECATED - Use Unified Items API)
- ~~`get_sessions`~~: Use `get_items` with `type: 'sessions'`
- ~~`get_session_detail`~~: Use `get_item_detail` with `type: 'sessions'`
- ~~`get_latest_session`~~: Use `get_items` with `type: 'sessions', limit: 1`
- ~~`create_session`~~: Use `create_item` with `type: 'sessions'`
- ~~`update_session`~~: Use `update_item` with `type: 'sessions'`
- ~~`search_sessions_by_tag`~~: Use `search_items_by_tag` with `types: ['sessions']`

### Daily Summaries (DEPRECATED - Use Unified Items API)
- ~~`get_summaries`~~: Use `get_items` with `type: 'dailies'`
- ~~`get_summary_detail`~~: Use `get_item_detail` with `type: 'dailies'`
- ~~`create_summary`~~: Use `create_item` with `type: 'dailies'`
- ~~`update_summary`~~: Use `update_item` with `type: 'dailies'`

### Search
- `search_items`: Full-text search across all items
  - Required: `query` (string) - Search query text
  - Optional: `types` (array) - Filter by specific types
  - Optional: `limit` (number) - Maximum results (default: 20, max: 100)
  - Optional: `offset` (number) - Pagination offset (default: 0)
- `search_suggest`: Get search suggestions for autocomplete
  - Required: `query` (string) - Partial search query
  - Optional: `types` (array) - Filter suggestions by types
  - Optional: `limit` (number) - Maximum suggestions (default: 10, max: 20)

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
- `get_types`: Retrieve all available types
  - Optional: `include_definitions` (boolean) - Include full type definitions (default: false)
- `create_type`: Create new type
  - Required: `name` (string) - Type name (lowercase letters, numbers, underscores)
  - Optional: `base_type` (string) - Base type: 'tasks' or 'documents' (default: 'documents')
- `delete_type`: Delete type (only if no items exist)

## API Parameters

### Item Types
When using item-related commands, specify the type parameter. Available types can be discovered using `get_types`.

Default types (provided at initialization):
- `issues` - Bug reports, feature requests, tasks
- `plans` - Project plans with timelines
- `docs` - Documentation
- `knowledge` - Knowledge base entries

Special types (not in get_types):
- `sessions` - Work sessions with timestamp-based IDs
- `dailies` - Daily summaries with date-based IDs

Additional types:
- Any type created via `create_type` (e.g., `recipe`, `tutorial`, `blog_post`)
- New types are stored under `documents/{type}/` or `tasks/{type}/` based on their base_type

### Common Parameters
- `id` - Identifier for items:
  - Regular items: Numeric (e.g., "1", "2", "3")
  - Sessions: Timestamp format (YYYY-MM-DD-HH.MM.SS.sss)
  - Dailies: Date format (YYYY-MM-DD)
- `type` - Item type (use `get_types` for regular types, or 'sessions'/'dailies' for special types)
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

## File Naming Conventions

### Default Types (Plural)
- Issues: `issues/issues-{id}.md`
- Plans: `plans/plans-{id}.md`
- Docs: `docs/docs-{id}.md`
- Knowledge: `knowledge/knowledge-{id}.md`

### Additional Types
- Pattern: `{type}/{type}-{id}.md`
- Example: `recipe/recipe-1.md`, `guideline/guideline-1.md`