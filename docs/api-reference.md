# API Reference

## Content Management

### Items (Issues, Plans, Documents, Knowledge)
- `get_items`: Get items by type (issue, plan, doc, knowledge)
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
- `get_statuses`: Retrieve all statuses
- `create_status`: Create new status
- `update_status`: Update existing status
- `delete_status`: Delete status

## API Parameters

### Item Types
When using item-related commands, specify the type:
- `issue` - Bug reports, feature requests, tasks
- `plan` - Project plans with timelines
- `doc` - Documentation
- `knowledge` - Knowledge base entries

### Common Parameters
- `id` - Numeric identifier for items
- `type` - Item type (see above)
- `title` - Title of the item
- `description` - Detailed description (for issues/plans)
- `content` - Main content (for docs/knowledge)
- `tags` - Array of tag names
- `priority` - Priority level (high, medium, low)
- `status_id` - Status identifier

### Date Parameters
- `date` - Format: YYYY-MM-DD
- `start_date` - Start of date range
- `end_date` - End of date range

### Search Parameters
- `tag` - Tag name to search for
- `pattern` - Search pattern for tags
- `types` - Array of item types to search (optional)