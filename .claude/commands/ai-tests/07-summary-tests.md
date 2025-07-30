# Daily Summary Tests

Test daily summary management.

## Test 7.1: Summary Creation

### Create Today's Summary
```
Tool: create_summary
Parameters: {
  title: "Daily Development Progress",
  content: "## Today's Achievements\n- Fixed critical authentication bug\n- Implemented dark mode UI\n- Updated API documentation\n\n## Challenges\n- Memory leak investigation ongoing\n- Performance optimization complex\n\n## Tomorrow's Plan\n- Complete memory leak fix\n- Start user testing\n- Review pull requests",
  tags: ["daily", "summary", "development"]
}
Expected: Success with today's date as ID
```

### Create Duplicate Summary (Should Fail)
```
Tool: create_summary
Parameters: {
  title: "Another Summary",
  content: "Duplicate content"
}
Expected: Error "Daily summary already exists for date"
```

### Create Past Date Summary
```
Tool: create_summary
Parameters: {
  date: "2025-01-14",
  title: "Yesterday's Summary",
  content: "## Completed\n- Planning session\n- Code reviews\n\n## Notes\n- Team meeting productive",
  tags: ["daily", "summary"]
}
Expected: Success with specified date as ID
```

## Test 7.2: Summary Retrieval

### Get All Summaries
```
Tool: get_summaries
Expected: Array of all daily summaries
```

### Get Summaries by Date Range
```
Tool: get_summaries
Parameters: {
  start_date: "2025-01-14",
  end_date: "2025-01-15"
}
Expected: Summaries within date range
```

### Get Summary Detail
```
Tool: get_summary_detail
Parameters: {date: "2025-01-15"}
Expected: Full summary object for specified date
```

### Get Non-existent Summary
```
Tool: get_summary_detail
Parameters: {date: "2025-01-01"}
Expected: Error or null response
```

## Test 7.3: Summary Updates

### Update Summary Content
```
Tool: update_summary
Parameters: {
  date: "2025-01-15",
  content: "## Today's Achievements\n- Fixed critical authentication bug\n- Implemented dark mode UI\n- Updated API documentation\n- Added comprehensive tests\n\n## Challenges\n- Memory leak investigation ongoing\n- Performance optimization complex\n\n## Tomorrow's Plan\n- Complete memory leak fix\n- Start user testing\n- Review pull requests\n- Deploy to staging"
}
Expected: Updated summary
```

### Update Summary Tags
```
Tool: update_summary
Parameters: {
  date: "2025-01-15",
  tags: ["daily", "summary", "development", "productive"]
}
Expected: Updated summary with new tags
```