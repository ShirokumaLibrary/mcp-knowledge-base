# Data Retrieval & Update Tests

Test read and update operations on created data.

## Test 3.1: Get Item Details

### Get Issue Details
```
Tool: get_item_detail
Parameters: {type: "issues", id: 1}
Expected: Full issue object with all fields
```

### Get Plan Details
```
Tool: get_item_detail
Parameters: {type: "plans", id: 1}
Expected: Full plan object with start_date and end_date
```

### Get Non-existent Item
```
Tool: get_item_detail
Parameters: {type: "issues", id: 999}
Expected: Error "issues with ID 999 not found"
```

## Test 3.2: List Items with Filters

### List Open Issues
```
Tool: get_items
Parameters: {type: "issues", status: "Open"}
Expected: Array of issues with status "Open"
```

### List High Priority Issues
```
Tool: get_items
Parameters: {type: "issues", priority: "high"}
Expected: Array of high priority issues
```

### List with Date Range
```
Tool: get_items
Parameters: {
  type: "plans",
  start_date: "2025-01-01",
  end_date: "2025-12-31"
}
Expected: Plans within date range
```

## Test 3.3: Update Operations

### Update Issue Status
```
Tool: update_item
Parameters: {
  type: "issues",
  id: 1,
  status: "In Progress"
}
Expected: Updated issue with new status
```

### Update Issue Priority and Tags
```
Tool: update_item
Parameters: {
  type: "issues",
  id: 2,
  priority: "high",
  tags: ["performance", "critical", "backend"]
}
Expected: Updated issue with new priority and tags
```

### Partial Update (Description Only)
```
Tool: update_item
Parameters: {
  type: "issues",
  id: 3,
  description: "Dark mode feature request from multiple users"
}
Expected: Updated issue with new description, other fields unchanged
```

### Update with Invalid Status
```
Tool: update_item
Parameters: {
  type: "issues",
  id: 1,
  status: "InvalidStatus"
}
Expected: Error "Unknown status: 'InvalidStatus'"
```

## Test 3.4: Related Fields Update

### Add Related Items
```
Tool: update_item
Parameters: {
  type: "issues",
  id: 2,
  related_tasks: ["issues-1", "issues-3"],
  related_documents: ["docs-1"]
}
Expected: Updated issue with related items
```

### Self-reference Test
```
Tool: update_item
Parameters: {
  type: "issues",
  id: 1,
  related_tasks: ["issues-1"]
}
Expected: Error about self-reference
```