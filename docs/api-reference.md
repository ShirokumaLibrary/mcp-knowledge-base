# API Reference

## Content Management

### Items (Issues, Plans, Documents, Knowledge)
- `get_items`: Get items by type
  - Type parameter accepts any value returned by `get_types`
  - For issues/plans: Default excludes closed statuses
  - Optional: `includeClosedStatuses` (boolean) - Include items with closed statuses
  - Optional: `statusIds` (array) - Filter by specific status IDs
- `get_item_detail`: Get detailed information for specified item
- `create_item`: Create new item of any type
- `update_item`: Update existing item
- `delete_item`: Delete item
- `search_items_by_tag`: Search items by tag (with optional type filter)

### Work Sessions
- `get_sessions`: Get work sessions (optional date range)
- `get_session_detail`: Get detailed information for specified session
- `get_latest_session`: Get the latest work session for today
- `create_session`: Create new work session
- `update_session`: Update existing work session
- `search_sessions_by_tag`: Search work sessions by tag

### Daily Summaries
- `get_summaries`: Get daily summaries (optional date range)
- `get_summary_detail`: Get detailed information for specified date
- `create_summary`: Create new daily summary
- `update_summary`: Update existing daily summary

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
- `create_type`: Create new custom type
  - Required: `name` (string) - Type name (lowercase letters, numbers, underscores)
  - Optional: `base_type` (string) - Base type: 'tasks' or 'documents' (default: 'documents')
- `delete_type`: Delete custom type (only if no items exist)

## API Parameters

### Item Types
When using item-related commands, specify the type parameter. Available types can be discovered using `get_types`.

Default types (provided at initialization):
- `issues` - Bug reports, feature requests, tasks
- `plans` - Project plans with timelines
- `docs` - Documentation
- `knowledge` - Knowledge base entries

Custom types:
- Any type created via `create_type` (e.g., `recipe`, `tutorial`, `blog_post`)
- Custom types are stored under `documents/{type}/`

### Common Parameters
- `id` - Numeric identifier for items
- `type` - Item type (use `get_types` to see available types)
- `title` - Title of the item
- `content` - Main content (required for all item types)
- `tags` - Array of tag names
- `priority` - Priority level (high, medium, low) for issues/plans
- `status` - Status name for issues/plans (stored as name in markdown files)

### Date Parameters
- `date` - Format: YYYY-MM-DD
- `start_date` - Start of date range
- `end_date` - End of date range

### Search Parameters
- `tag` - Tag name to search for
- `pattern` - Search pattern for tags
- `types` - Array of item types to search (optional, accepts any valid type)

## File Naming Conventions

### Default Types (Plural)
- Issues: `issues/issues-{id}.md`
- Plans: `plans/plans-{id}.md`
- Docs: `documents/docs/docs-{id}.md`
- Knowledge: `documents/knowledge/knowledge-{id}.md`

### Custom Types (Singular)
- Pattern: `documents/{type}/{type}-{id}.md`
- Example: `documents/recipe/recipe-1.md`