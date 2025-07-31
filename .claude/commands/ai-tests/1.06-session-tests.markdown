# Session Management Tests

Test work session operations.

## Test 6.1: Session Creation

### Create Morning Session
```
Tool: create_session
Parameters: {
  title: "Morning Development Session",
  content: "## Tasks Completed\n- Fixed authentication bug\n- Added unit tests\n- Updated documentation\n\n## Notes\n- Special character handling was tricky\n- Need to review edge cases",
  tags: ["development", "morning"],
  related_tasks: ["issues-1", "issues-2"]
}
Expected: Success with timestamp ID (YYYY-MM-DD-HH.MM.SS.sss)
```

### Create Session with Custom DateTime
```
Tool: create_session
Parameters: {
  title: "Yesterday's Review Session",
  content: "Reviewed pull requests and provided feedback",
  datetime: "2025-01-14T15:30:00",
  tags: ["review"]
}
Expected: Success with custom timestamp
```

## Test 6.2: Session Retrieval

### Get Today's Sessions
```
Tool: get_sessions
Expected: Array of today's sessions
```

### Get Sessions by Date Range
```
Tool: get_sessions
Parameters: {
  start_date: "2025-01-14",
  end_date: "2025-01-15"
}
Expected: Sessions within date range
```

### Get Latest Session
```
Tool: get_latest_session
Expected: Most recent session created
```

### Get Session Detail
```
Tool: get_session_detail
Parameters: {id: "<session-id-from-creation>"}
Expected: Full session object
```

## Test 6.3: Session Updates

### Update Session Content
```
Tool: update_session
Parameters: {
  id: "<session-id>",
  content: "## Tasks Completed\n- Fixed authentication bug\n- Added unit tests\n- Updated documentation\n- Added integration tests\n\n## Notes\n- All tests passing\n- Ready for deployment"
}
Expected: Updated session
```

### Add Tags to Session
```
Tool: update_session
Parameters: {
  id: "<session-id>",
  tags: ["development", "morning", "completed"]
}
Expected: Updated session with new tags
```

## Test 6.4: Session Search

### Search Sessions by Tag
```
Tool: search_sessions_by_tag
Parameters: {tag: "development"}
Expected: Sessions with "development" tag
```

### Search Sessions by Tag (Alternative)
```
Tool: search_items_by_tag
Parameters: {tag: "development", types: ["sessions"]}
Expected: Sessions with "development" tag
```