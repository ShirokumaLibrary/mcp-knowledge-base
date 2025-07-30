# Data Deletion Tests

Test deletion operations and cascading effects.

## Test 9.1: Item Deletion

### Delete an Issue
```
Tool: delete_item
Parameters: {type: "issues", id: 4}
Expected: Success message
```

### Verify Deletion
```
Tool: get_item_detail
Parameters: {type: "issues", id: 4}
Expected: Error "issues with ID 4 not found"
```

### Delete Non-existent Item
```
Tool: delete_item
Parameters: {type: "issues", id: 999}
Expected: Error "issues with ID 999 not found"
```

## Test 9.2: Related Items After Deletion

### Check Related Items Still Reference Deleted Item
```
Tool: get_item_detail
Parameters: {type: "issues", id: 5}
Expected: Still contains "issues-4" in related_tasks (orphaned reference)
```

## Test 9.3: Tag Deletion Effects

### Delete a Tag Used by Multiple Items
```
Tool: delete_tag
Parameters: {name: "api"}
Expected: Success
```

### Verify Tag Removed from Items
```
Tool: get_item_detail
Parameters: {type: "issues", id: 5}
Expected: Item without "api" tag

Tool: get_item_detail
Parameters: {type: "docs", id: 1}
Expected: Document without "api" tag
```

## Test 9.4: Session Deletion

### Delete a Session
```
Tool: delete_item
Parameters: {type: "sessions", id: "<session-id>"}
Expected: Success or appropriate error
```

## Test 9.5: Summary Deletion

### Delete a Daily Summary
```
Tool: delete_item
Parameters: {type: "dailies", id: "2025-01-14"}
Expected: Success
```

### Verify Summary Deleted
```
Tool: get_summary_detail
Parameters: {date: "2025-01-14"}
Expected: Error or null response
```

## Test 9.6: Cascading Effects

### Check Total Item Count
```
Tool: get_items
Parameters: {type: "issues", includeClosedStatuses: true}
Expected: 4 issues (one deleted)
```

### Check Tag List After Deletions
```
Tool: get_tags
Expected: Updated tag list without deleted tags
```