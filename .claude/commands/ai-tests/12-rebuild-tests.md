# Database Rebuild Tests

Test database reconstruction from markdown files. **MUST BE RUN LAST**.

## Test 12.1: Pre-Rebuild Verification

### Record Current State
```
Tool: get_items
Parameters: {type: "issues", includeClosedStatuses: true}
Note: Record count and IDs

Tool: get_tags
Note: Record all tags

Tool: get_types
Note: Record custom types
```

## Test 12.2: Execute Rebuild

### Run Rebuild Command
```
Bash: MCP_DATABASE_PATH=.shirokuma/data npm run rebuild-db
Expected: 
- "Starting database rebuild..."
- "Database rebuilt successfully"
- Count of items processed
```

## Test 12.3: Post-Rebuild Verification

### Verify Issues Restored
```
Tool: get_items
Parameters: {type: "issues", includeClosedStatuses: true}
Expected: Same count as pre-rebuild
```

### Verify Tags Restored
```
Tool: get_tags
Expected: All tags from markdown files
Note: Deleted tags should not reappear
```

### Verify Custom Types
```
Tool: get_types
Expected: Custom types preserved
```

### Verify Content Integrity
```
Tool: get_item_detail
Parameters: {type: "issues", id: 1}
Expected: 
- Multi-line content preserved
- Unicode characters intact
- All fields match original
```

### Verify Sessions
```
Tool: get_sessions
Expected: All sessions restored with correct timestamps
```

### Verify Summaries
```
Tool: get_summaries
Expected: All daily summaries restored
```

## Test 12.4: Sequence Verification

### Check ID Sequences
```
Tool: create_item
Parameters: {
  type: "issues",
  title: "Post-Rebuild Issue",
  content: "Testing ID sequence",
  priority: "low"
}
Expected: Next sequential ID (not duplicate)
```

### Verify Special Type Sequences
```
Note: Sessions and dailies should maintain sequence value of 0
```

## Test 12.5: Search Index Verification

### Full-text Search
```
Tool: search_items
Parameters: {query: "authentication"}
Expected: Same results as before rebuild
```

### Tag Search
```
Tool: search_items_by_tag
Parameters: {tag: "bug"}
Expected: Same items as before rebuild
```

## Important Notes

- Rebuild reads all markdown files and recreates database
- Deleted items are not restored (only exists in DB)
- Tag associations are rebuilt from markdown
- Search indexes are recreated
- Custom types must exist in sequences table
- Sessions use timestamp IDs (not sequential)
- Dailies use date IDs (not sequential)