# MCP Functional Test Cases for AI Validation

This document is designed for AI assistants (like Claude) to systematically validate all MCP server functions through the MCP protocol.
The tests should be executed sequentially, starting from an empty database state.

## Prerequisites
- MCP server (`shirokuma-knowledge-base`) is available in your session
- Data directory (`.shirokuma/data/`) should be empty for a clean test
- You have access to all MCP tools prefixed with `mcp__shirokuma-knowledge-base__`

## Test Execution Instructions
1. Execute each test case in order
2. Record the actual results
3. Note any unexpected behaviors or errors
4. Verify that responses match expected outcomes
5. For each test with content field, ensure multi-line content is preserved exactly as provided

## Test Procedures

### 1. Initial State Verification (0 Records)

#### 1.1 Get Lists of Various Items
```
Purpose: Verify no errors occur in empty state
Expected: Empty arrays are returned
```

- [ ] Issues list: `mcp__shirokuma-knowledge-base__get_items(type: "issue")`
      Expected: Empty array `[]`
- [ ] Plans list: `mcp__shirokuma-knowledge-base__get_items(type: "plan")`
      Expected: Empty array `[]`
- [ ] Documents list: `mcp__shirokuma-knowledge-base__get_items(type: "doc")`
      Expected: Empty array `[]`
- [ ] Knowledge list: `mcp__shirokuma-knowledge-base__get_items(type: "knowledge")`
      Expected: Empty array `[]`

#### 1.2 Session & Summary Verification
- [ ] Today's session list: `mcp__shirokuma-knowledge-base__get_sessions()`
      Expected: Empty array `[]`
- [ ] Get latest session: `mcp__shirokuma-knowledge-base__get_latest_session()`
      Expected: `null` or empty response
- [ ] Daily summary list: `mcp__shirokuma-knowledge-base__get_summaries()`
      Expected: Empty array `[]`

#### 1.3 Master Data Verification
- [ ] Status list: `mcp__shirokuma-knowledge-base__get_statuses()`
      Expected: Array containing default statuses:
      ```json
      [
        {"id": 1, "name": "Open"},
        {"id": 2, "name": "In Progress"},
        {"id": 3, "name": "Review"},
        {"id": 4, "name": "Completed"},
        {"id": 5, "name": "Closed"},
        {"id": 6, "name": "On Hold"}
      ]
      ```
- [ ] Tag list: `mcp__shirokuma-knowledge-base__get_tags()`
      Expected: Empty array `[]`

#### 1.4 Search Functionality Verification
- [ ] Tag search (non-existent tag): `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "test")`
      Expected: Empty result
- [ ] Tag pattern search: `mcp__shirokuma-knowledge-base__search_tags(pattern: "test")`
      Expected: Empty array `[]`
- [ ] Session search by tag: `mcp__shirokuma-knowledge-base__search_sessions_by_tag(tag: "test")`
      Expected: Empty array `[]`

### 2. Data Creation Tests

#### 2.1 Issue Creation
```
Create an Issue with multi-line content and verify that content field is required
```

- [ ] Basic Issue creation:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "issue",
    title: "Authentication System Bug Fix",
    content: "## Issue Details\nUsers cannot login with passwords containing special characters.\n\n### Reproduction Steps\n1. Enter username on login screen\n2. Include special characters in password\n3. Click login button\n4. Error is displayed\n\n### Expected Behavior\nUsers should be able to login with special character passwords\n\n### Impact\n- All users\n- All authentication-dependent features",
    priority: "high",
    status_id: 1,
    tags: ["bug", "authentication", "urgent"]
  )
  ```
  Expected: Success with returned object containing:
  - id: 1 (auto-generated)
  - All provided fields
  - created_at timestamp
  - status: "Open"

- [ ] Issue creation without content - Verify error occurs:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "issue",
    title: "Test Issue",
    priority: "medium"
  )
  ```
  Expected: Error with message indicating content is required for issues

#### 2.2 Plan Creation
```
Create a Plan with start_date and end_date
```

- [ ] Plan creation:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "plan",
    title: "Q1 2025 Development Roadmap",
    content: "## Goals\n- New feature implementation\n- Performance improvements\n- Security enhancements\n\n## Milestones\n1. Authentication system renewal (January)\n2. API optimization (February)\n3. UI renewal (March)",
    priority: "high",
    status_id: 1,
    start_date: "2025-01-01",
    end_date: "2025-03-31",
    tags: ["roadmap", "q1-2025", "planning"]
  )
  ```
  Expected: Success with all fields including dates

#### 2.3 Document Creation
```
Create a technical document
```

- [ ] Document creation:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "doc",
    title: "API Authentication Guide",
    content: "# API Authentication Guide\n\n## Overview\nThis document explains API authentication methods.\n\n## Authentication Methods\n### JWT Token\n- How to obtain tokens\n- Token refresh\n- Error handling\n\n### API Key\n- API key issuance\n- Usage\n- Security best practices",
    tags: ["documentation", "api", "authentication"]
  )
  ```
  Expected: Success with document created

#### 2.4 Knowledge Creation
```
Create a knowledge base entry
```

- [ ] Knowledge creation:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "knowledge",
    title: "Error Handling Best Practices",
    content: "## Error Handling Principles\n\n### 1. Early Return\nReturn early when errors occur to avoid deep nesting\n\n### 2. Specific Error Messages\nProvide messages that help users understand the problem\n\n### 3. Logging\nLog all errors appropriately\n\n### 4. Retry Strategy\nImplement retry for temporary failures",
    tags: ["best-practices", "error-handling", "development"]
  )
  ```
  Expected: Success with knowledge entry created

### 3. Data Retrieval & Update Tests

#### 3.1 List Retrieval Verification
- [ ] Get Issues list: `mcp__shirokuma-knowledge-base__get_items(type: "issue")`
      Expected: Array containing the created issue with all fields
- [ ] Get Plans list: `mcp__shirokuma-knowledge-base__get_items(type: "plan")`
      Expected: Array containing the created plan
- [ ] Get Documents list: `mcp__shirokuma-knowledge-base__get_items(type: "doc")`
      Expected: Array containing the created document
- [ ] Get Knowledge list: `mcp__shirokuma-knowledge-base__get_items(type: "knowledge")`
      Expected: Array containing the created knowledge entry

#### 3.2 Detail Retrieval Verification
- [ ] Get Issue detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issue", id: 1)`
      Expected: Complete issue object with all fields
- [ ] Get Plan detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "plan", id: 1)`
      Expected: Complete plan object with dates
- [ ] Get Document detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "doc", id: 1)`
      Expected: Complete document object
- [ ] Get Knowledge detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "knowledge", id: 1)`
      Expected: Complete knowledge object
- [ ] Get non-existent item: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issue", id: 9999)`
      Expected: null or error

#### 3.3 Data Update Verification
- [ ] Issue update (content change):
  ```
  mcp__shirokuma-knowledge-base__update_item(
    type: "issue",
    id: 1,
    content: "## Issue Details (Updated)\nProblem is being resolved.\n\n### Root Cause\nPassword escaping issue identified\n\n### Solution\nImplemented proper escaping for special characters",
    status_id: 2
  )
  ```
  Expected: Success with updated content and status

- [ ] Plan update (add tags):
  ```
  mcp__shirokuma-knowledge-base__update_item(
    type: "plan",
    id: 1,
    tags: ["roadmap", "q1-2025", "planning", "priority"]
  )
  ```
  Expected: Success with additional tag

- [ ] Partial update test (only title):
  ```
  mcp__shirokuma-knowledge-base__update_item(
    type: "doc",
    id: 1,
    title: "API Authentication Guide v2"
  )
  ```
  Expected: Success with only title changed, other fields preserved

### 4. Tag Functionality Tests

#### 4.1 Tag Management
- [ ] Get tag list: `mcp__shirokuma-knowledge-base__get_tags()`
      Expected: Array containing all auto-registered tags from created items:
      ["bug", "authentication", "urgent", "roadmap", "q1-2025", "planning", "documentation", "api", "best-practices", "error-handling", "development", "priority"]
- [ ] Tag search: `mcp__shirokuma-knowledge-base__search_tags(pattern: "auth")`
      Expected: Array containing "authentication"
- [ ] Create new tag: `mcp__shirokuma-knowledge-base__create_tag(name: "feature")`
      Expected: Success confirmation
- [ ] Create duplicate tag: `mcp__shirokuma-knowledge-base__create_tag(name: "feature")`
      Expected: Error or no-op

#### 4.2 Search by Tag
- [ ] Single tag search: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "authentication")`
      Expected: Results containing both the issue and document with "authentication" tag
- [ ] Tag search with specific types: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "authentication", types: ["issue", "doc"])`
      Expected: Same results (issue and doc only, no plans or knowledge)
- [ ] Search with non-existent tag: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "nonexistent")`
      Expected: Empty result

### 5. Status Management Tests

#### 5.1 Custom Status
- [ ] Create custom status: `mcp__shirokuma-knowledge-base__create_status(name: "Under Review")`
      Expected: Success with new status id (likely 4)
- [ ] Verify status list includes custom status: `mcp__shirokuma-knowledge-base__get_statuses()`
      Expected: Array now contains "Under Review"
- [ ] Update status name: `mcp__shirokuma-knowledge-base__update_status(id: 4, name: "Reviewing")`
      Expected: Success with name changed
- [ ] Use custom status in item:
  ```
  mcp__shirokuma-knowledge-base__update_item(
    type: "issue",
    id: 1,
    status_id: 4
  )
  ```
  Expected: Success, item now shows "Reviewing" status

### 6. Session Management Tests

#### 6.1 Work Session
- [ ] Create session:
  ```
  mcp__shirokuma-knowledge-base__create_session(
    title: "Authentication Bug Investigation and Fix",
    content: "## Work Done\n- Bug root cause investigation\n- Fixed escaping logic\n- Added unit tests\n\n## Next Steps\n- Code review\n- Integration testing",
    tags: ["bugfix", "authentication"],
    category: "development"
  )
  ```
  Expected: Success with session ID in format YYYYMMDD-HHMMSSsss

- [ ] Get latest session: `mcp__shirokuma-knowledge-base__get_latest_session()`
      Expected: The session just created

- [ ] Update session (add content):
  ```
  mcp__shirokuma-knowledge-base__update_session(
    id: "[retrieved session ID]",
    content: "## Work Done\n- Bug root cause investigation\n- Fixed escaping logic\n- Added unit tests\n- Code review completed\n\n## Completed\n- Merged fix to main branch"
  )
  ```
  Expected: Success with content preserved exactly as provided

- [ ] Get sessions by date range:
  ```
  mcp__shirokuma-knowledge-base__get_sessions(
    start_date: "2025-07-24",
    end_date: "2025-07-24"
  )
  ```
  Expected: Array containing the created session

### 7. Daily Summary Tests

#### 7.1 Summary Creation
- [ ] Create today's summary:
  ```
  mcp__shirokuma-knowledge-base__create_summary(
    date: "2025-07-24",
    title: "Authentication Bug Fix Completed",
    content: "## Today's Achievements\n- Fixed critical authentication system bug\n- Improved special character password handling\n- Test coverage increased to 85%\n\n## Tomorrow's Plan\n- Performance testing\n- Documentation updates",
    tags: ["milestone", "bugfix"]
  )
  ```
  Expected: Success

- [ ] Get summary detail: `mcp__shirokuma-knowledge-base__get_summary_detail(date: "2025-07-24")`
      Expected: Complete summary object

- [ ] Update summary:
  ```
  mcp__shirokuma-knowledge-base__update_summary(
    date: "2025-07-24",
    content: "## Today's Achievements\n- Fixed critical authentication system bug\n- Improved special character password handling\n- Test coverage increased to 85%\n- Completed code review\n\n## Tomorrow's Plan\n- Performance testing\n- Documentation updates\n- Deploy to staging"
  )
  ```
  Expected: Success with updated content

- [ ] Create duplicate summary for same date:
  ```
  mcp__shirokuma-knowledge-base__create_summary(
    date: "2025-07-24",
    title: "Another Summary",
    content: "Test"
  )
  ```
  Expected: Error (only one summary per day allowed)

### 8. Comprehensive Verification

#### 8.1 Data Integrity
- [ ] Verify tags are correctly registered for all created items
- [ ] Verify status IDs are correctly saved and displayed
- [ ] Verify date fields are saved in correct format
- [ ] Verify session IDs follow YYYYMMDD-HHMMSSsss format
- [ ] Verify content fields maintain exact formatting (no unwanted changes)

#### 8.2 Error Handling
- [ ] Detail retrieval with non-existent ID: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issue", id: 9999)`
      Expected: null or appropriate error
- [ ] Update non-existent item: `mcp__shirokuma-knowledge-base__update_item(type: "issue", id: 9999, title: "Test")`
      Expected: null or error
- [ ] Invalid date format: `mcp__shirokuma-knowledge-base__create_item(type: "plan", title: "Test", content: "Test", start_date: "2025/01/01")`
      Expected: Error about date format
- [ ] Invalid priority: `mcp__shirokuma-knowledge-base__create_item(type: "issue", title: "Test", content: "Test", priority: "invalid")`
      Expected: Error about invalid priority

### 9. Data Deletion Tests

#### 9.1 Individual Deletion
- [ ] Delete Issue: `mcp__shirokuma-knowledge-base__delete_item(type: "issue", id: 1)`
      Expected: Success
- [ ] Verify list after deletion: `mcp__shirokuma-knowledge-base__get_items(type: "issue")`
      Expected: Empty array
- [ ] Get detail of deleted item: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issue", id: 1)`
      Expected: null
- [ ] Delete already deleted item: `mcp__shirokuma-knowledge-base__delete_item(type: "issue", id: 1)`
      Expected: Error or no-op

#### 9.2 Related Data Verification
- [ ] Verify tags remain after deletion: `mcp__shirokuma-knowledge-base__get_tags()`
      Expected: Tags still exist
- [ ] Verify no impact on other items: `mcp__shirokuma-knowledge-base__get_items(type: "plan")`
      Expected: Plan still exists
- [ ] Delete tag: `mcp__shirokuma-knowledge-base__delete_tag(name: "feature")`
      Expected: Success
- [ ] Delete status: `mcp__shirokuma-knowledge-base__delete_status(id: 4)`
      Expected: Success or error if in use

### 10. Database Rebuild Tests

#### 10.1 Manual Database Verification
Note: This requires command line access, not MCP
- [ ] Execute `npm run rebuild-db` (if you have shell access)
- [ ] Verify all data is restored via MCP queries
- [ ] Verify custom statuses are preserved
- [ ] Verify sessions and summaries are correctly restored

### 11. Edge Cases and Additional Tests

#### 11.1 Special Characters and Unicode
- [ ] Create item with Japanese content:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "knowledge",
    title: "日本語テスト",
    content: "## 概要\nこれは日本語のコンテンツです。\n\n### 詳細\n- 項目1\n- 項目2\n- 特殊文字: !@#$%^&*()_+{}[]|\\:;<>?,./",
    tags: ["日本語", "テスト"]
  )
  ```
  Expected: Success with proper Unicode handling

- [ ] Create item with emoji:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "doc",
    title: "Emoji Test 🚀",
    content: "## Testing Emojis 😀\n\n- ✅ Task completed\n- 🐛 Bug fixed\n- 📚 Documentation",
    tags: ["emoji", "test"]
  )
  ```
  Expected: Success with emojis preserved

#### 11.2 Boundary Testing
- [ ] Create item with very long content (test with 100+ lines)
- [ ] Create item with empty tags array: `tags: []`
- [ ] Create item with single tag: `tags: ["single"]`
- [ ] Very long title (200+ characters)
- [ ] Content with code blocks:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "knowledge",
    title: "Code Example",
    content: "## Code Sample\n\n```python\ndef hello():\n    print('Hello')\n```\n\n```javascript\nconst test = () => {\n  console.log('test');\n};\n```",
    tags: ["code"]
  )
  ```

#### 11.3 Concurrent Operations
- [ ] Create multiple items rapidly in succession (5+ items)
- [ ] Update the same item multiple times quickly
- [ ] Create sessions with millisecond precision

#### 11.4 Date Handling
- [ ] Create plan with same start and end date
- [ ] Create plan with past dates
- [ ] Get sessions for wide date range: `start_date: "2020-01-01", end_date: "2030-12-31"`
- [ ] Get summaries for future dates

#### 11.5 Search Edge Cases
- [ ] Search with empty pattern: `mcp__shirokuma-knowledge-base__search_tags(pattern: "")`
- [ ] Search with special regex characters: `mcp__shirokuma-knowledge-base__search_tags(pattern: ".*")`
- [ ] Case sensitivity test: search for "API" vs "api"

## Verification Points

### Success Criteria
- All CRUD operations work correctly without errors
- Error cases return meaningful error messages
- Data integrity is maintained across all operations
- Multi-line content is preserved exactly as provided (no unwanted formatting)
- Tags are automatically registered when items are created
- Session content is saved as-is without additional formatting
- All search functions return accurate results
- Date-based queries work correctly
- Custom statuses persist through database operations
- Unicode and special characters are handled properly

### AI Testing Guidelines
1. **Execute tests sequentially** - Later tests may depend on earlier data
2. **Record exact responses** - Note any deviations from expected results
3. **Test error conditions** - Confirm appropriate error messages
4. **Verify data persistence** - Re-query after creates/updates
5. **Check field preservation** - Ensure all fields remain unchanged unless explicitly updated
6. **Validate relationships** - Tags, statuses, and cross-references work correctly
7. **Document any issues** - Note unexpected behaviors for debugging

### Common Issues to Watch For
- Content field being modified or formatted unexpectedly
- Tags not being auto-registered
- Session IDs not following the expected format (YYYYMMDD-HHMMSSsss)
- Date fields not accepting the YYYY-MM-DD format
- Search results missing expected items
- Error messages not being descriptive enough
- Unicode or special characters causing issues
- Empty arrays vs null returns
- Partial updates affecting unspecified fields

### Reporting Results
When reporting test results, include:
1. Test case executed
2. Actual MCP command used
3. Expected result
4. Actual result
5. Pass/Fail status
6. Any error messages or unexpected behaviors
7. Suggestions for fixes if issues are found