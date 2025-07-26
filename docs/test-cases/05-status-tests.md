# 5. Status Management Tests

This test suite verifies status functionality and filtering capabilities.

## 5.1 Status Management (Read-Only)

**Note**: Status creation, update, and deletion are disabled. Statuses can only be managed through database initialization.

- [ ] Verify status list: `mcp__shirokuma-knowledge-base__get_statuses()`  
      Expected: Markdown table contains default statuses with is_closed flags

- [ ] Attempt to create custom status (should fail): `mcp__shirokuma-knowledge-base__create_status(name: "Under Review")`  
      Expected: Error - tool not available

- [ ] Attempt to update status (should fail): `mcp__shirokuma-knowledge-base__update_status(id: 1, name: "New Name")`  
      Expected: Error - tool not available

- [ ] Attempt to delete status (should fail): `mcp__shirokuma-knowledge-base__delete_status(id: 1)`  
      Expected: Error - tool not available

## 5.2 Status Usage Tests

### Update issue status using status name
```
mcp__shirokuma-knowledge-base__update_item(
  type: "issues",
  id: 1,
  status: "Closed"
)
```
Expected: Success with status updated to "Closed"  
Note: Status updates now work correctly using status names

- [ ] Verify closed issue is excluded by default: `mcp__shirokuma-knowledge-base__get_items(type: "issues")`  
      Expected: Array with 3 issues (closed issue not shown)

- [ ] Verify closed issue appears with flag: `mcp__shirokuma-knowledge-base__get_items(type: "issues", includeClosedStatuses: true)`  
      Expected: Array with 4 issues (including the closed one)

### Test different closed statuses

- [ ] Update another issue to "Completed" status:
```
mcp__shirokuma-knowledge-base__update_item(
  type: "issues",
  id: 2,
  status: "Completed"
)
```
Expected: Success

- [ ] Verify both closed issues are excluded: `mcp__shirokuma-knowledge-base__get_items(type: "issues")`  
      Expected: Array with 2 issues (only Open and In Progress shown)

- [ ] Test "Cancelled" status:
```
mcp__shirokuma-knowledge-base__update_item(
  type: "issues",
  id: 3,
  status: "Cancelled"
)
```
Expected: Success

- [ ] Verify only one open issue remains: `mcp__shirokuma-knowledge-base__get_items(type: "issues")`  
      Expected: Array with 1 issue (only issue 4 with "Open" status)