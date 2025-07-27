# API Documentation

## Overview

The Shirokuma MCP Knowledge Base provides a comprehensive API for managing issues, plans, documents, knowledge, work sessions, and daily summaries through the Model Context Protocol (MCP).

## Core Concepts

### Entity Types

The system supports the following base entity types:

- **Issues**: Bug reports and task tracking
- **Plans**: Project planning and management
- **Documents**: General documentation
- **Knowledge**: Knowledge base articles
- **Work Sessions**: Time-tracked work records
- **Daily Summaries**: Daily activity summaries

Custom types can be created based on these base types.

### Common Properties

All entities share these common properties:

```typescript
interface BaseEntity {
  id: number | string;
  title: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}
```

### Task-based Entities (Issues, Plans)

Task-based entities include additional properties:

```typescript
interface TaskEntity extends BaseEntity {
  content?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  status_id?: number;
  start_date?: string;
  end_date?: string;
  related_tasks?: string[];
  related_documents?: string[];
}
```

### Document-based Entities (Documents, Knowledge)

Document-based entities require content:

```typescript
interface DocumentEntity extends BaseEntity {
  content: string;
  description?: string;
  related_documents?: string[];
  related_tasks?: string[];
}
```

## MCP Tools

### Item Management

#### create_item
Create a new item of any type.

**Parameters:**
- `type` (string, required): Entity type
- `title` (string, required): Item title
- `content` (string, required for documents): Item content
- `description` (string): Item description
- `tags` (string[]): Tags for categorization
- `priority` (string): Priority level (high/medium/low)
- `status` (string): Status name
- `start_date` (string): Start date (YYYY-MM-DD)
- `end_date` (string): End date (YYYY-MM-DD)
- `related_tasks` (string[]): Related task references
- `related_documents` (string[]): Related document references

**Example:**
```json
{
  "type": "issues",
  "title": "Fix login bug",
  "content": "Users cannot login with special characters",
  "priority": "high",
  "tags": ["bug", "authentication"]
}
```

#### get_items
Retrieve items by type with optional filtering.

**Parameters:**
- `type` (string, required): Entity type
- `statusIds` (number[]): Filter by status IDs
- `includeClosedStatuses` (boolean): Include closed items

**Example:**
```json
{
  "type": "issues",
  "statusIds": [1, 2],
  "includeClosedStatuses": false
}
```

#### get_item_detail
Get detailed information for a specific item.

**Parameters:**
- `type` (string, required): Entity type
- `id` (number, required): Item ID

**Example:**
```json
{
  "type": "plans",
  "id": 42
}
```

#### update_item
Update an existing item.

**Parameters:**
- `type` (string, required): Entity type
- `id` (number, required): Item ID
- Other parameters same as create_item (all optional)

**Example:**
```json
{
  "type": "issues",
  "id": 123,
  "status": "In Progress",
  "priority": "medium"
}
```

#### delete_item
Delete an item.

**Parameters:**
- `type` (string, required): Entity type
- `id` (number, required): Item ID

**Example:**
```json
{
  "type": "docs",
  "id": 456
}
```

### Search Operations

#### search_items_by_tag
Search items by tag across types.

**Parameters:**
- `tag` (string, required): Tag to search for
- `types` (string[]): Types to search (omit for all)

**Example:**
```json
{
  "tag": "bug",
  "types": ["issues", "plans"]
}
```

#### search_all
Full-text search across all content.

**Parameters:**
- `query` (string, required): Search query

**Example:**
```json
{
  "query": "authentication error"
}
```

### Tag Management

#### get_tags
Get all available tags.

**Returns:** Array of tag objects with name and usage count.

#### create_tag
Create a new tag.

**Parameters:**
- `name` (string, required): Tag name

**Example:**
```json
{
  "name": "security"
}
```

#### delete_tag
Delete a tag.

**Parameters:**
- `name` (string, required): Tag name

**Example:**
```json
{
  "name": "deprecated"
}
```

#### search_tags
Search tags by pattern.

**Parameters:**
- `pattern` (string, required): Search pattern

**Example:**
```json
{
  "pattern": "auth*"
}
```

### Status Management

#### get_statuses
Get all available statuses.

**Returns:** Array of status objects with ID, name, description, and is_closed flag.

### Work Sessions

#### get_sessions
Get work sessions within date range.

**Parameters:**
- `start_date` (string): Start date (YYYY-MM-DD)
- `end_date` (string): End date (YYYY-MM-DD)

**Example:**
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

#### get_session_detail
Get detailed information for a session.

**Parameters:**
- `id` (string, required): Session ID

**Example:**
```json
{
  "id": "2024-01-15-10.30.45.123"
}
```

#### get_latest_session
Get the most recent work session for today.

**Returns:** Latest session object or null.

#### create_session
Create a new work session.

**Parameters:**
- `title` (string, required): Session title
- `content` (string): Session content
- `tags` (string[]): Tags
- `related_tasks` (string[]): Related task references
- `related_documents` (string[]): Related document references
- `datetime` (string): ISO 8601 datetime (for migration)

**Example:**
```json
{
  "title": "Code review session",
  "content": "Reviewed authentication module",
  "tags": ["review", "security"]
}
```

#### update_session
Update an existing session.

**Parameters:**
- `id` (string, required): Session ID
- Other parameters same as create_session (all optional)

### Daily Summaries

#### get_summaries
Get daily summaries within date range.

**Parameters:**
- `start_date` (string): Start date (YYYY-MM-DD)
- `end_date` (string): End date (YYYY-MM-DD)

**Example:**
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-01-07"
}
```

#### get_summary_detail
Get detailed information for a daily summary.

**Parameters:**
- `date` (string, required): Date (YYYY-MM-DD)

**Example:**
```json
{
  "date": "2024-01-15"
}
```

#### create_summary
Create daily summary.

**Parameters:**
- `date` (string, required): Date (YYYY-MM-DD)
- `title` (string, required): Summary title
- `content` (string, required): Summary content
- `tags` (string[]): Tags
- `related_tasks` (string[]): Related task references
- `related_documents` (string[]): Related document references

**Example:**
```json
{
  "date": "2024-01-15",
  "title": "Daily Progress",
  "content": "Completed authentication module",
  "tags": ["progress", "development"]
}
```

#### update_summary
Update existing daily summary.

**Parameters:**
- `date` (string, required): Date (YYYY-MM-DD)
- Other parameters same as create_summary (all optional)

### Type Management

#### get_types
Get all available content types.

**Parameters:**
- `include_definitions` (boolean): Include full type definitions

**Returns:** Types grouped by base_type (tasks, documents).

#### create_type
Create a new custom content type.

**Parameters:**
- `name` (string, required): Type name (lowercase, underscores)
- `base_type` (string): Base type (tasks/documents)

**Example:**
```json
{
  "name": "features",
  "base_type": "tasks"
}
```

#### delete_type
Delete a custom content type.

**Parameters:**
- `name` (string, required): Type name

**Example:**
```json
{
  "name": "features"
}
```

## Error Handling

All API errors follow a consistent format:

```typescript
interface McpError {
  code: string;
  message: string;
  details?: any;
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input parameters
- `NOT_FOUND`: Resource not found
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Unexpected server error

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Default: 60 requests per minute per client
- Configurable per deployment
- Returns 429 status when limit exceeded

## Best Practices

1. **Use Tags Effectively**
   - Create a consistent tagging taxonomy
   - Use hierarchical tags (e.g., "frontend", "frontend-react")
   - Limit tag length to improve searchability

2. **Manage References**
   - Use the format `{type}-{id}` for references
   - Examples: `issues-123`, `plans-45`, `docs-67`
   - Validate references exist before creating relationships

3. **Handle Dates Properly**
   - Always use ISO 8601 format (YYYY-MM-DD)
   - Consider timezone implications
   - Use date ranges for filtering

4. **Optimize Searches**
   - Use specific type filters when possible
   - Leverage tag searches for categorization
   - Implement pagination for large result sets

5. **Error Recovery**
   - Implement retry logic for transient errors
   - Log errors for debugging
   - Provide user-friendly error messages