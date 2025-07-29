# 9. Data Deletion Tests

This test suite verifies deletion functionality and its effects on related data.

## 9.1 Individual Deletion

### Delete Issue
- [ ] Delete Issue: `mcp__shirokuma-knowledge-base__delete_item(type: "issues", id: "1")`  
      Expected: Success

- [ ] Verify list after deletion: `mcp__shirokuma-knowledge-base__get_items(type: "issues", includeClosedStatuses: true)`  
      Expected: Array with 3 remaining issues (id: "2", "3", "4")

- [ ] Get detail of deleted item: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issues", id: "1")`  
      Expected: Error about item not found

- [ ] Delete already deleted item: `mcp__shirokuma-knowledge-base__delete_item(type: "issues", id: "1")`  
      Expected: Error about item not found

### Delete Plan
- [ ] Delete Plan: `mcp__shirokuma-knowledge-base__delete_item(type: "plans", id: "2")`  
      Expected: Success

- [ ] Verify deletion: `mcp__shirokuma-knowledge-base__get_item_detail(type: "plans", id: "2")`  
      Expected: Error about item not found

### Delete Document
- [ ] Delete Document: `mcp__shirokuma-knowledge-base__delete_item(type: "docs", id: "3")`  
      Expected: Success

### Delete Knowledge
- [ ] Delete Knowledge: `mcp__shirokuma-knowledge-base__delete_item(type: "knowledge", id: "2")`  
      Expected: Success

## 9.2 Related Data Verification

### Verify tags remain after deletion
- [ ] Get tags: `mcp__shirokuma-knowledge-base__get_tags()`  
      Expected: All tags still exist (tags are not deleted when items are deleted)

### Verify no cascade to other items
- [ ] Get remaining issues: `mcp__shirokuma-knowledge-base__get_items(type: "issues", includeClosedStatuses: true)`  
      Expected: Issues 2, 3, and 4 still exist

- [ ] Get remaining plans: `mcp__shirokuma-knowledge-base__get_items(type: "plans")`  
      Expected: Plans 1, 3, and 4 still exist

### Tag deletion
- [ ] Delete tag: `mcp__shirokuma-knowledge-base__delete_tag(name: "test-tag")`  
      Expected: Success

- [ ] Verify tag deletion: `mcp__shirokuma-knowledge-base__get_tags()`  
      Expected: "test-tag" no longer in list

- [ ] Delete non-existent tag: `mcp__shirokuma-knowledge-base__delete_tag(name: "non-existent-tag")`  
      Expected: Success or no error (idempotent)

### Items with deleted tags
- [ ] Search by deleted tag: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "test-tag")`  
      Expected: Empty result

Note: Deleting a tag does not remove it from existing items' tag arrays. The tag reference remains in the markdown files but is no longer in the tags table.