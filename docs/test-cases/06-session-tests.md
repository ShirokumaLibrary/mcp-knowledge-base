# 6. Session Management Tests

This test suite verifies work session creation, retrieval, and update functionality.

## 6.1 Work Session

### Create session (NEW: Use create_item)
```
mcp__shirokuma-knowledge-base__create_item(
  type: "sessions",
  title: "Authentication Bug Investigation and Fix",
  content: "## Work Done\n- Bug root cause investigation\n- Fixed escaping logic\n- Added unit tests\n\n## Next Steps\n- Code review\n- Integration testing",
  tags: ["bugfix", "authentication"]
)
```
Expected: Success with session ID in format YYYY-MM-DD-HH.MM.SS.sss

### Create session with related fields (NEW: Use create_item)
```
mcp__shirokuma-knowledge-base__create_item(
  type: "sessions",
  title: "Security Implementation Work",
  content: "## Work Done\n- Implemented JWT validation\n- Added rate limiting middleware\n- Updated documentation\n\n## Related Work\n- See related issues and documents for context",
  tags: ["security", "implementation"],
  related_tasks: ["issues-5", "plans-4"],
  related_documents: ["docs-5", "knowledge-5"]
)
```
Expected: Success with both related_tasks and related_documents arrays

- [ ] Get latest session (NEW: Use get_items): `mcp__shirokuma-knowledge-base__get_items(type: "sessions", limit: 1)`  
      Expected: Array with the session just created

### Update session (add content) (NEW: Use update_item)
```
mcp__shirokuma-knowledge-base__update_item(
  type: "sessions",
  id: "[retrieved session ID]",
  content: "## Work Done\n- Bug root cause investigation\n- Fixed escaping logic\n- Added unit tests\n- Code review completed\n\n## Completed\n- Merged fix to main branch"
)
```
Expected: Success with content preserved exactly as provided

### Update session with related fields (NEW: Use update_item)
```
mcp__shirokuma-knowledge-base__update_item(
  type: "sessions",
  id: "[second session ID]",
  related_tasks: ["issues-5", "plans-4", "plans-5"],
  related_documents: ["docs-1", "docs-5", "knowledge-3", "knowledge-5"]
)
```
Expected: Success with updated related_tasks and related_documents arrays

### Get sessions by date range (NEW: Use get_items)
```
mcp__shirokuma-knowledge-base__get_items(
  type: "sessions",
  start_date: "2025-07-25",
  end_date: "2025-07-25"
)
```
Expected: Array containing the created session

## 6.2 Multiple Sessions

### Create another session (NEW: Use create_item)
```
mcp__shirokuma-knowledge-base__create_item(
  type: "sessions",
  title: "Performance Optimization Research",
  content: "## Research\n- Analyzed slow queries\n- Identified bottlenecks\n- Proposed caching strategy",
  tags: ["performance", "research"]
)
```
Expected: Success with unique session ID

- [ ] Get today's sessions (NEW: Use get_items): `mcp__shirokuma-knowledge-base__get_items(type: "sessions")`  
      Expected: Array containing both sessions created today

- [ ] Search sessions by tag (NEW: Use search_items_by_tag): `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "authentication", types: ["sessions"])`  
      Expected: Result with tasks.sessions array containing only the first session

## 6.3 Past Data Migration

### Create session with custom datetime (NEW: Use create_item)
```
mcp__shirokuma-knowledge-base__create_item(
  type: "sessions",
  title: "Historical Session Import",
  content: "## Work Done\n- Legacy project migration\n- Database schema update\n- Data validation",
  tags: ["migration", "historical"],
  datetime: "2024-12-15T10:30:00.000Z"
)
```
Expected: Success with session created in past date directory (2024-12-15)

- [ ] Verify session date: Get session detail (NEW: Use get_item_detail) and check `start_date` field is "2024-12-15"
- [ ] Verify session in correct directory (NEW: Use get_items): `mcp__shirokuma-knowledge-base__get_items(type: "sessions", start_date: "2024-12-15", end_date: "2024-12-15")`  
      Expected: Array containing the historical session