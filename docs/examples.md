# Usage Examples

## Working with Items

### Creating Items

```javascript
// Create an issue
const issue = await mcp.create_item({
  type: "issue",
  title: "Fix login bug",
  description: "Users cannot login with special characters",
  priority: "high",
  tags: ["bug", "auth"]
});

// Create a document
const doc = await mcp.create_item({
  type: "doc",
  title: "API Documentation",
  content: "# API Guide\n\n## Endpoints...",
  tags: ["documentation", "api"]
});

// Create a knowledge entry
const knowledge = await mcp.create_item({
  type: "knowledge",
  title: "Best Practices for Error Handling",
  content: "## Error Handling Guidelines\n\n1. Always use try-catch...",
  tags: ["best-practices", "error-handling"]
});

// Create a plan
const plan = await mcp.create_item({
  type: "plan",
  title: "Q1 2025 Roadmap",
  description: "Major features for Q1",
  priority: "high",
  start_date: "2025-01-01",
  end_date: "2025-03-31",
  tags: ["roadmap", "q1-2025"]
});
```

### Retrieving Items

```javascript
// Get all issues
const issues = await mcp.get_items({ type: "issue" });

// Get all plans
const plans = await mcp.get_items({ type: "plan" });

// Get specific item details
const itemDetail = await mcp.get_item_detail({
  type: "issue",
  id: 123
});
```

### Updating Items

```javascript
// Update an issue
await mcp.update_item({
  type: "issue",
  id: 123,
  title: "Updated: Fix login bug",
  priority: "critical",
  status_id: 2
});

// Update document content
await mcp.update_item({
  type: "doc",
  id: 456,
  content: "# Updated API Guide\n\n## New endpoints..."
});
```

### Searching Items

```javascript
// Search across multiple types
const results = await mcp.search_items_by_tag({
  tag: "feature",
  types: ["issue", "plan"]  // Search only issues and plans
});

// Search all types
const allResults = await mcp.search_items_by_tag({
  tag: "important"
  // types omitted = search all types
});
```

## Working with Sessions

```javascript
// Create a new work session
const session = await mcp.create_session({
  title: "Implementing authentication",
  description: "Adding JWT authentication to API",
  content: "## Tasks completed\n- Set up JWT library\n- Created auth middleware",
  tags: ["auth", "backend"],
  category: "development"
});

// Get latest session to continue work
const latest = await mcp.get_latest_session();

// Update session with progress
await mcp.update_session({
  id: latest.data.id,
  content: latest.data.content + "\n- Added user validation\n- Updated tests"
});

// Search sessions by tag
const authSessions = await mcp.search_sessions_by_tag({
  tag: "auth"
});

// Get sessions for date range
const weekSessions = await mcp.get_sessions({
  start_date: "2025-07-20",
  end_date: "2025-07-24"
});
```

## Working with Daily Summaries

```javascript
// Create a daily summary
await mcp.create_summary({
  date: "2025-07-24",
  title: "Major refactoring completed",
  content: "## Achievements\n- Improved type safety\n- Fixed memory leaks\n- Refactored database layer",
  tags: ["milestone", "refactoring"]
});

// Get summaries for a date range
const summaries = await mcp.get_summaries({
  start_date: "2025-07-20",
  end_date: "2025-07-24"
});

// Update today's summary
await mcp.update_summary({
  date: "2025-07-24",
  content: summaries.data[0].content + "\n- Updated documentation"
});
```

## Tag Management

```javascript
// Create a tag
await mcp.create_tag({ 
  name: "feature"
});

// Get all tags
const tags = await mcp.get_tags();

// Search for tags by pattern
const testTags = await mcp.search_tags({ 
  pattern: "test" 
});
// Returns all tags containing "test"

// Delete a tag
await mcp.delete_tag({ 
  name: "obsolete-tag" 
});
```

## Status Management

```javascript
// Get all statuses
const statuses = await mcp.get_statuses();

// Create custom status
await mcp.create_status({ 
  name: "In Review" 
});

// Update status name
await mcp.update_status({
  id: 4,
  name: "Under Review"
});

// Delete status
await mcp.delete_status({ 
  id: 5 
});
```