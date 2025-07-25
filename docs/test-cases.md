# MCP Functional Test Cases for AI Validation

This document is designed for AI assistants (like Claude) to systematically validate all MCP server functions through the MCP protocol.
The tests should be executed sequentially, starting from an empty database state.

## Prerequisites
- MCP server (`shirokuma-knowledge-base`) is available in your session
- Data directory (`.shirokuma/data/`) should be empty for a clean test
  - **Note**: If the database is already initialized/empty, no additional cleanup is needed
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
      Expected: Array containing default statuses with is_closed flags:
      ```json
      [
        {"id": 1, "name": "Open", "is_closed": false},
        {"id": 2, "name": "In Progress", "is_closed": false},
        {"id": 3, "name": "Review", "is_closed": false},
        {"id": 4, "name": "Completed", "is_closed": true},
        {"id": 5, "name": "Closed", "is_closed": true},
        {"id": 6, "name": "On Hold", "is_closed": false},
        {"id": 7, "name": "Cancelled", "is_closed": true}
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
Create multiple Issues with various configurations
```

- [ ] Issue 1 - Basic Issue with tags:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "issue",
    title: "Authentication System Bug Fix",
    content: "## Issue Details\nUsers cannot login with passwords containing special characters.\n\n### Reproduction Steps\n1. Enter username on login screen\n2. Include special characters in password\n3. Click login button\n4. Error is displayed\n\n### Expected Behavior\nUsers should be able to login with special character passwords\n\n### Impact\n- All users\n- All authentication-dependent features",
    priority: "high",
    status: "Open",
    tags: ["bug", "authentication", "urgent"]
  )
  ```
  Expected: Success with id: 1

- [ ] Issue 2 - Issue without tags:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "issue",
    title: "Performance Optimization Needed",
    content: "## Problem\nThe dashboard page takes too long to load (>5 seconds).\n\n### Analysis\n- Database queries are not optimized\n- No caching implemented\n- Large data sets being loaded unnecessarily",
    priority: "medium",
    status: "Open"
  )
  ```
  Expected: Success with id: 2, no tags

- [ ] Issue 3 - Issue with different status:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "issue",
    title: "Add Dark Mode Support",
    content: "## Feature Request\nUsers have requested dark mode support for better visibility in low-light conditions.\n\n### Requirements\n- Toggle switch in settings\n- Persistent preference storage\n- Smooth transition animations",
    priority: "low",
    status: "In Progress",
    tags: ["feature", "ui", "enhancement"]
  )
  ```
  Expected: Success with id: 3

- [ ] Issue creation without content - Verify error occurs:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "issue",
    title: "Test Issue",
    priority: "medium"
  )
  ```
  Expected: Error "Content is required for issues"

#### 2.2 Plan Creation
```
Create multiple Plans with various configurations
```

- [ ] Plan 1 - Plan with dates and tags:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "plan",
    title: "Q1 2025 Development Roadmap",
    content: "## Goals\n- New feature implementation\n- Performance improvements\n- Security enhancements\n\n## Milestones\n1. Authentication system renewal (January)\n2. API optimization (February)\n3. UI renewal (March)",
    priority: "high",
    status: "Open",
    start_date: "2025-01-01",
    end_date: "2025-03-31",
    tags: ["roadmap", "q1-2025", "planning"]
  )
  ```
  Expected: Success with id: 1

- [ ] Plan 2 - Plan without tags:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "plan",
    title: "Database Migration Project",
    content: "## Objective\nMigrate from PostgreSQL 12 to PostgreSQL 16\n\n## Tasks\n- Backup current database\n- Test migration in staging\n- Schedule maintenance window\n- Execute production migration",
    priority: "high",
    status: "Open",
    start_date: "2025-02-01",
    end_date: "2025-02-28"
  )
  ```
  Expected: Success with id: 2, no tags

- [ ] Plan 3 - Plan without dates:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "plan",
    title: "Technical Debt Reduction",
    content: "## Areas to Address\n- Refactor legacy authentication code\n- Update deprecated dependencies\n- Improve test coverage to 80%\n- Document internal APIs",
    priority: "medium",
    status: "Open",
    tags: ["technical-debt", "refactoring"]
  )
  ```
  Expected: Success with id: 3, null dates

#### 2.3 Document Creation
```
Create multiple Documents with various configurations
```

- [ ] Doc 1 - Document with tags:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "doc",
    title: "API Authentication Guide",
    content: "# API Authentication Guide\n\n## Overview\nThis document explains API authentication methods.\n\n## Authentication Methods\n### JWT Token\n- How to obtain tokens\n- Token refresh\n- Error handling\n\n### API Key\n- API key issuance\n- Usage\n- Security best practices",
    tags: ["documentation", "api", "authentication"]
  )
  ```
  Expected: Success with id: 1

- [ ] Doc 2 - Document without tags:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "doc",
    title: "System Architecture Overview",
    content: "# System Architecture\n\n## Components\n- Frontend: React + TypeScript\n- Backend: Node.js + Express\n- Database: PostgreSQL\n- Cache: Redis\n\n## Communication\n- REST API for client-server\n- WebSocket for real-time updates\n- Message Queue for background jobs"
  )
  ```
  Expected: Success with id: 2, no tags

- [ ] Doc 3 - Development guidelines:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "doc",
    title: "Development Guidelines",
    content: "# Development Guidelines\n\n## Code Style\n- Use ESLint configuration\n- Follow TypeScript strict mode\n- Write tests for all features\n\n## Git Workflow\n- Feature branches from main\n- PR reviews required\n- Squash merge policy",
    tags: ["guidelines", "development", "standards"]
  )
  ```
  Expected: Success with id: 3

#### 2.4 Knowledge Creation
```
Create multiple Knowledge entries with various configurations
```

- [ ] Knowledge 1 - Knowledge with tags:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "knowledge",
    title: "Error Handling Best Practices",
    content: "## Error Handling Principles\n\n### 1. Early Return\nReturn early when errors occur to avoid deep nesting\n\n### 2. Specific Error Messages\nProvide messages that help users understand the problem\n\n### 3. Logging\nLog all errors appropriately\n\n### 4. Retry Strategy\nImplement retry for temporary failures",
    tags: ["best-practices", "error-handling", "development"]
  )
  ```
  Expected: Success with id: 1

- [ ] Knowledge 2 - Knowledge without tags:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "knowledge",
    title: "Database Query Optimization",
    content: "## Query Optimization Techniques\n\n### Indexing Strategy\n- Create indexes on frequently queried columns\n- Use composite indexes for multi-column queries\n- Monitor index usage and remove unused ones\n\n### Query Patterns\n- Avoid SELECT *\n- Use EXPLAIN ANALYZE\n- Batch operations when possible"
  )
  ```
  Expected: Success with id: 2, no tags

- [ ] Knowledge 3 - Security practices:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "knowledge",
    title: "Security Checklist",
    content: "## Application Security\n\n### Authentication\n- Use bcrypt for password hashing\n- Implement rate limiting\n- Enable 2FA for sensitive accounts\n\n### Data Protection\n- Encrypt sensitive data at rest\n- Use HTTPS everywhere\n- Validate all inputs\n- Sanitize outputs",
    tags: ["security", "checklist", "best-practices"]
  )
  ```
  Expected: Success with id: 3

### 3. Data Retrieval & Update Tests

#### 3.1 List Retrieval Verification
- [ ] Get Issues list: `mcp__shirokuma-knowledge-base__get_items(type: "issue")`
      Expected: Array containing 3 issues (only non-closed ones)
- [ ] Get Plans list: `mcp__shirokuma-knowledge-base__get_items(type: "plan")`
      Expected: Array containing 3 plans
- [ ] Get Documents list: `mcp__shirokuma-knowledge-base__get_items(type: "doc")`
      Expected: Array containing 3 documents
- [ ] Get Knowledge list: `mcp__shirokuma-knowledge-base__get_items(type: "knowledge")`
      Expected: Array containing 3 knowledge entries

#### 3.1.1 Status Filtering Tests (Issues and Plans)
- [ ] Get Issues excluding closed statuses (default): `mcp__shirokuma-knowledge-base__get_items(type: "issue")`
      Expected: Array containing only issues with open statuses
- [ ] Get Issues including closed statuses: `mcp__shirokuma-knowledge-base__get_items(type: "issue", includeClosedStatuses: true)`
      Expected: Array containing all issues regardless of status
- [ ] Get Issues with specific status IDs: `mcp__shirokuma-knowledge-base__get_items(type: "issue", statusIds: [1, 2])`
      Expected: Array containing only issues with status IDs 1 or 2
- [ ] Get Plans excluding closed statuses: `mcp__shirokuma-knowledge-base__get_items(type: "plan")`
      Expected: Array containing only plans with open statuses
- [ ] Get Plans including closed statuses: `mcp__shirokuma-knowledge-base__get_items(type: "plan", includeClosedStatuses: true)`
      Expected: Array containing all plans

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
    content: "## Issue Details (Updated)\nProblem is being resolved.\n\n### Root Cause\nPassword escaping issue identified\n\n### Solution\nImplemented proper escaping for special characters"
  )
  ```
  Expected: Success with updated content

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

- [ ] Status update test:
  ```
  mcp__shirokuma-knowledge-base__update_item(
    type: "issue",
    id: 1,
    status: "In Progress"
  )
  ```
  Expected: Success with status changed to "In Progress"

### 4. Tag Functionality Tests

#### 4.1 Tag Management
- [ ] Get tag list: `mcp__shirokuma-knowledge-base__get_tags()`
      Expected: Array containing all auto-registered tags from created items:
      ["bug", "authentication", "urgent", "feature", "ui", "enhancement", "roadmap", "q1-2025", "planning", "technical-debt", "refactoring", "documentation", "api", "guidelines", "development", "standards", "best-practices", "error-handling", "security", "checklist"]
- [ ] Tag search: `mcp__shirokuma-knowledge-base__search_tags(pattern: "auth")`
      Expected: Array containing "authentication"
- [ ] Create new tag: `mcp__shirokuma-knowledge-base__create_tag(name: "feature")`
      Expected: Success confirmation
- [ ] Create duplicate tag: `mcp__shirokuma-knowledge-base__create_tag(name: "feature")`
      Expected: Error or no-op

#### 4.2 Search by Tag
- [ ] Single tag search: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "authentication")`
      Expected: Results containing Issue 1 and Doc 1 (both have "authentication" tag)
- [ ] Tag search with specific types: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "authentication", types: ["issue", "doc"])`
      Expected: Same results (Issue 1 and Doc 1)
- [ ] Search for "development" tag: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "development")`
      Expected: Results containing Doc 3 and Knowledge 1 (both have "development" tag)
- [ ] Search with non-existent tag: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "nonexistent")`
      Expected: Empty result

### 5. Status Management Tests

#### 5.1 Status Management (Read-Only)
Note: Status creation, update, and deletion are disabled. Statuses can only be managed through database initialization.

- [ ] Verify status list: `mcp__shirokuma-knowledge-base__get_statuses()`
      Expected: Array contains default statuses with is_closed flags
- [ ] Attempt to create custom status (should fail): `mcp__shirokuma-knowledge-base__create_status(name: "Under Review")`
      Expected: Error - tool not available
- [ ] Attempt to update status (should fail): `mcp__shirokuma-knowledge-base__update_status(id: 1, name: "New Name")`
      Expected: Error - tool not available
- [ ] Attempt to delete status (should fail): `mcp__shirokuma-knowledge-base__delete_status(id: 1)`
      Expected: Error - tool not available

#### 5.2 Status Usage Tests
- [ ] Update issue status using status name:
  ```
  mcp__shirokuma-knowledge-base__update_item(
    type: "issue",
    id: 1,
    status: "Closed"
  )
  ```
  Expected: Success with status updated to "Closed"
  Note: Status updates now work correctly using status names
- [ ] Verify closed issue is excluded by default: `mcp__shirokuma-knowledge-base__get_items(type: "issue")`
      Expected: Array with 2 issues (closed issue not shown)
- [ ] Verify closed issue appears with flag: `mcp__shirokuma-knowledge-base__get_items(type: "issue", includeClosedStatuses: true)`
      Expected: Array with 3 issues (including the closed one)

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
      Expected: Array with 2 remaining issues (id: 2, 3)
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
- [ ] Attempt to delete status (should fail): `mcp__shirokuma-knowledge-base__delete_status(id: 7)`
      Expected: Error - tool not available

### 10. Database Rebuild Tests

#### 10.1 Manual Database Verification
Note: This requires command line access, not MCP
- [ ] Execute `npm run rebuild-db` (if you have shell access)
- [ ] Verify all data is restored via MCP queries
- [ ] Verify default statuses are restored with correct is_closed flags
- [ ] Verify sessions and summaries are correctly restored
- [ ] Verify status names (not IDs) are preserved in markdown files

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

#### 11.5 Status Filtering Edge Cases
- [ ] Create issue with "Cancelled" status and verify default filtering:
  ```
  mcp__shirokuma-knowledge-base__create_item(
    type: "issue",
    title: "Cancelled Feature",
    content: "This feature was cancelled",
    status: "Cancelled"
  )
  ```
  Then: `mcp__shirokuma-knowledge-base__get_items(type: "issue")`
  Expected: Issue not shown (cancelled is closed)
- [ ] Test filtering with empty statusIds array: `mcp__shirokuma-knowledge-base__get_items(type: "issue", statusIds: [])`
  Expected: Empty result (no status IDs match)
- [ ] Test filtering with invalid status ID: `mcp__shirokuma-knowledge-base__get_items(type: "issue", statusIds: [999])`
  Expected: Empty result

#### 11.6 Search Edge Cases
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
- Default statuses with is_closed flags work correctly
- Status filtering for issues/plans works as expected (default excludes closed)
- Status modification tools are properly disabled
- Status names (not IDs) are stored in markdown files
- Status updates via update_item work correctly using status names
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