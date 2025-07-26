# 8. Comprehensive Verification

This test suite performs comprehensive checks on data integrity and error handling.

## 8.1 Data Integrity

### Verify tags are correctly registered
- [ ] Get all tags: `mcp__shirokuma-knowledge-base__get_tags()`  
      Expected: All tags from created items are present, including those added during updates

### Verify status names are correctly saved and displayed
- [ ] Get issue detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issues", id: 1)`  
      Expected: Status field shows "Closed" (not status ID)

### Verify date fields are saved in correct format
- [ ] Get plan detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "plans", id: 1)`  
      Expected: start_date and end_date in YYYY-MM-DD format

### Verify session IDs follow correct format
- [ ] Get latest session: `mcp__shirokuma-knowledge-base__get_latest_session()`  
      Expected: Session ID matches YYYYMMDD-HHMMSSsss format

### Verify content fields maintain exact formatting
- [ ] Get knowledge detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "knowledge", id: 4)`  
      Expected: Content matches exactly what was updated, including markdown formatting

### Verify description fields are preserved
- [ ] Get doc detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "docs", id: 4)`  
      Expected: Description field contains the stored description text

- [ ] Get plan detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "plans", id: 4)`  
      Expected: Description field contains the updated description

## 8.2 Error Handling

### Detail retrieval with non-existent ID
`mcp__shirokuma-knowledge-base__get_item_detail(type: "issues", id: 9999)`  
Expected: Error message about item not found

### Update non-existent item
`mcp__shirokuma-knowledge-base__update_item(type: "issues", id: 9999, title: "Test")`  
Expected: Error message about item not found

### Invalid date format
`mcp__shirokuma-knowledge-base__create_item(type: "plans", title: "Test", content: "Test", start_date: "2025/01/01")`  
Expected: Error about date format (must be YYYY-MM-DD)

### Invalid priority
`mcp__shirokuma-knowledge-base__create_item(type: "issues", title: "Test", content: "Test", priority: "invalid")`  
Expected: Error about invalid priority (must be high/medium/low)

### Invalid status name
`mcp__shirokuma-knowledge-base__update_item(type: "issues", id: 4, status: "InvalidStatus")`  
Expected: Error about invalid status name

### Missing required fields
`mcp__shirokuma-knowledge-base__create_item(type: "issues", title: "Test")`  
Expected: Error about missing content field

### Invalid type parameter
`mcp__shirokuma-knowledge-base__create_item(type: "invalid", title: "Test", content: "Test")`  
Expected: Error about invalid type