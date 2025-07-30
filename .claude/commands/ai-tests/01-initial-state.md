# Initial State Verification

This test verifies that the system starts in a clean state with no data and handles empty state queries gracefully.

## Test 1.1: Get Lists of Various Items

```
Tool: get_items
Parameters: {type: "issues"}
Expected: []

Tool: get_items
Parameters: {type: "plans"}
Expected: []

Tool: get_items
Parameters: {type: "docs"}
Expected: []

Tool: get_items
Parameters: {type: "knowledge"}
Expected: []
```

## Test 1.2: Session & Summary Verification

```
Tool: get_sessions
Expected: []

Tool: get_latest_session
Expected: null or empty response

Tool: get_summaries
Expected: []
```

## Test 1.3: Master Data Verification

```
Tool: get_statuses
Expected: Table with 7 default statuses showing is_closed flags

Tool: get_tags
Expected: []
```

## Test 1.4: Search Functionality Verification

```
Tool: search_items_by_tag
Parameters: {tag: "test"}
Expected: Empty result

Tool: search_tags
Parameters: {pattern: "test"}
Expected: []

Tool: search_sessions_by_tag
Parameters: {tag: "test"}
Expected: []
```