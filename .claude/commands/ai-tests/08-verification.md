# Comprehensive Verification

Verify data integrity and advanced features.

## Test 8.1: Data Integrity Checks

### Verify All Created Items Exist
```
Tool: get_items
Parameters: {type: "issues", includeClosedStatuses: true}
Expected: 5 issues total

Tool: get_items
Parameters: {type: "plans"}
Expected: At least 1 plan

Tool: get_items
Parameters: {type: "docs"}
Expected: At least 1 document

Tool: get_items
Parameters: {type: "knowledge"}
Expected: At least 1 knowledge item
```

### Verify Tag Persistence
```
Tool: get_tags
Expected: All tags still exist (except deleted "urgent")
```

### Verify Related Items
```
Tool: get_item_detail
Parameters: {type: "issues", id: 5}
Expected: Related items arrays properly populated
```

## Test 8.2: Search Functionality

### Full-text Search
```
Tool: search_items
Parameters: {query: "authentication"}
Expected: Items containing "authentication" in title or content
```

### Search with Type Filter
```
Tool: search_items
Parameters: {query: "bug", types: ["issues"]}
Expected: Only issues containing "bug"
```

### Search Suggestions
```
Tool: search_suggest
Parameters: {query: "auth"}
Expected: Suggestions starting with "auth"
```

## Test 8.3: Edge Cases

### Empty Search Query
```
Tool: search_items
Parameters: {query: ""}
Expected: Error about empty query
```

### Very Long Title (Over 500 chars)
```
Tool: create_item
Parameters: {
  type: "issues",
  title: "A".repeat(501),
  content: "Test content",
  priority: "low"
}
Expected: Error about title length
```

### Special Characters in Content
```
Tool: create_item
Parameters: {
  type: "docs",
  title: "Unicode Test Document",
  content: "# Unicode Test\n\n## Special Characters\n- Emoji: 😀 🎉 🚀\n- Japanese: こんにちは\n- Arabic: مرحبا\n- Math: ∑ ∏ ∫\n- Symbols: ™ © ®"
}
Expected: Success, content preserved exactly
```

## Test 8.4: Validation Tests

### Invalid Priority
```
Tool: create_item
Parameters: {
  type: "issues",
  title: "Test Issue",
  content: "Test",
  priority: "invalid"
}
Expected: Error about invalid priority
```

### Invalid Date Format
```
Tool: create_item
Parameters: {
  type: "plans",
  title: "Test Plan",
  content: "Test",
  start_date: "2025/01/01"
}
Expected: Error about date format
```

### Empty Arrays vs Null
```
Tool: create_item
Parameters: {
  type: "issues",
  title: "No Tags Issue",
  content: "Test without tags",
  priority: "low",
  tags: []
}
Expected: Success, tags stored as empty array or null
```