# 3. Data Retrieval & Update Tests

This test suite verifies that data can be correctly retrieved and updated after creation.

## 3.1 List Retrieval Verification

- [ ] Get Issues list: `mcp__shirokuma-knowledge-base__get_items(type: "issues")`  
      Expected: Array containing 4 issues (only non-closed ones)
- [ ] Get Plans list: `mcp__shirokuma-knowledge-base__get_items(type: "plans")`  
      Expected: Array containing 4 plans
- [ ] Get Documents list: `mcp__shirokuma-knowledge-base__get_items(type: "docs")`  
      Expected: Array containing 4 documents
- [ ] Get Knowledge list: `mcp__shirokuma-knowledge-base__get_items(type: "knowledge")`  
      Expected: Array containing 4 knowledge entries

### 3.1.1 Date Range Filtering Tests

- [ ] Get sessions from specific month: `mcp__shirokuma-knowledge-base__get_items(type: "sessions", start_date: "2025-07-01", end_date: "2025-07-31")`  
      Expected: Array containing only sessions from July 2025
- [ ] Get recently updated documents: `mcp__shirokuma-knowledge-base__get_items(type: "docs", start_date: "2025-07-20")`  
      Expected: Array containing documents updated after July 20th
- [ ] Get issues updated in specific period: `mcp__shirokuma-knowledge-base__get_items(type: "issues", start_date: "2025-07-01", end_date: "2025-07-15")`  
      Expected: Array containing issues updated between July 1st and 15th
- [ ] Combine date and status filters: `mcp__shirokuma-knowledge-base__get_items(type: "issues", start_date: "2025-07-01", includeClosedStatuses: false)`  
      Expected: Array containing open issues updated after July 1st

### 3.1.2 Status Filtering Tests (Issues and Plans)

- [ ] Get Issues excluding closed statuses (default): `mcp__shirokuma-knowledge-base__get_items(type: "issues")`  
      Expected: Array containing only issues with open statuses
- [ ] Get Issues including closed statuses: `mcp__shirokuma-knowledge-base__get_items(type: "issues", includeClosedStatuses: true)`  
      Expected: Array containing all issues regardless of status
- [ ] Get Issues with specific statuses: `mcp__shirokuma-knowledge-base__get_items(type: "issues", statuses: ["Open", "In Progress"])`  
      Expected: Array containing only issues with status "Open" or "In Progress"
- [ ] Get Plans excluding closed statuses: `mcp__shirokuma-knowledge-base__get_items(type: "plans")`  
      Expected: Array containing only plans with open statuses
- [ ] Get Plans including closed statuses: `mcp__shirokuma-knowledge-base__get_items(type: "plans", includeClosedStatuses: true)`  
      Expected: Array containing all plans

## 3.2 Detail Retrieval Verification

- [ ] Get Issue detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issues", id: "1")`  
      Expected: Complete issue object with all fields (id as string "1")
- [ ] Get Plan detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "plans", id: "1")`  
      Expected: Complete plan object with dates (id as string "1")
- [ ] Get Document detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "docs", id: "1")`  
      Expected: Complete document object (id as string "1")
- [ ] Get Knowledge detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "knowledge", id: "1")`  
      Expected: Complete knowledge object (id as string "1")
- [ ] Get non-existent item: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issues", id: "9999")`  
      Expected: null or error

## 3.3 Data Update Verification

### Issue update (content change)
```
mcp__shirokuma-knowledge-base__update_item(
  type: "issues",
  id: "1",
  content: "## Issue Details (Updated)\nProblem is being resolved.\n\n### Root Cause\nPassword escaping issue identified\n\n### Solution\nImplemented proper escaping for special characters"
)
```
Expected: Success with updated content

### Plan update (add tags)
```
mcp__shirokuma-knowledge-base__update_item(
  type: "plans",
  id: "1",
  tags: ["roadmap", "q1-2025", "planning", "priority"]
)
```
Expected: Success with additional tag

### Partial update test (only title)
```
mcp__shirokuma-knowledge-base__update_item(
  type: "docs",
  id: "1",
  title: "API Authentication Guide v2"
)
```
Expected: Success with only title changed, other fields preserved

### Status update test
```
mcp__shirokuma-knowledge-base__update_item(
  type: "issues",
  id: "1",
  status: "In Progress"
)
```
Expected: Success with status changed to "In Progress"

### Summary update test
```
mcp__shirokuma-knowledge-base__update_item(
  type: "plans",
  id: "4",
  description: "Updated: Implement comprehensive rate limiting with monitoring capabilities"
)
```
Expected: Success with only description changed, other fields preserved

### Update both description and content
```
mcp__shirokuma-knowledge-base__update_item(
  type: "knowledge",
  id: "4",
  description: "Essential microservices patterns for scalable distributed systems",
  content: "## Microservices Design Patterns (Updated)\n\n### Core Patterns\n1. **API Gateway**\n2. **Service Discovery**\n3. **Circuit Breaker**\n4. **Bulkhead**\n\n### Data Patterns\n- Saga Pattern\n- Event Sourcing\n- CQRS\n\n### Deployment Patterns\n- Blue-Green Deployment\n- Canary Release\n- Feature Toggles"
)
```
Expected: Success with both description and content updated

## Related Tasks and Documents Testing

**Note**: The `related_tasks` and `related_documents` features are fully implemented and tested. Unit tests have been added to verify functionality at both the repository and MCP handler levels.

### Create task with related tasks
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issues",
  title: "Implement authentication module",
  content: "Build OAuth2/JWT authentication system",
  priority: "high",
  status: "Open",
  related_tasks: ["issues-1", "plans-1"]
)
```
Expected: Success with related_tasks array preserved (new item gets string id)

### Update related tasks
```
mcp__shirokuma-knowledge-base__update_item(
  type: "issues",
  id: "5",  // Assuming this is the ID from previous create
  related_tasks: ["issues-1", "plans-1", "issues-2"]
)
```
Expected: Success with updated related_tasks array

### Clear related tasks
```
mcp__shirokuma-knowledge-base__update_item(
  type: "issues", 
  id: "5",
  related_tasks: []
)
```
Expected: Success with empty related_tasks array

### Create plan with related tasks
```
mcp__shirokuma-knowledge-base__create_item(
  type: "plans",
  title: "Q1 Security Improvements",
  content: "Security enhancement roadmap",
  priority: "high",
  status: "In Progress",
  start_date: "2025-01-01",
  end_date: "2025-03-31",
  related_tasks: ["issues-5", "issues-1"]
)
```
Expected: Success with related_tasks linking to issues

### Invalid related task reference
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issues",
  title: "Test invalid reference",
  content: "Testing invalid task reference",
  related_tasks: ["invalid-format", "nonexistent-999"]
)
```
Expected: Success (invalid references are stored as-is, validation is lenient)

### Verify related tasks in retrieval
```
mcp__shirokuma-knowledge-base__get_item_detail(
  type: "issues",
  id: "5"
)
```
Expected: Response includes related_tasks array exactly as stored (id field is string)

### Create document with related tasks and documents
```
mcp__shirokuma-knowledge-base__create_item(
  type: "docs",
  title: "Integration Guide",
  content: "Guide for integrating authentication with API",
  tags: ["integration", "guide"],
  related_tasks: ["issues-5", "plans-5"],
  related_documents: ["docs-1", "knowledge-5"]
)
```
Expected: Success with both related_tasks and related_documents arrays

### Update document with related documents
```
mcp__shirokuma-knowledge-base__update_item(
  type: "docs",
  id: "6",  // Assuming this is the ID from previous create
  related_documents: ["knowledge-1", "knowledge-3", "docs-2"]
)
```
Expected: Success with updated related_documents array

### Create session with related fields
```
mcp__shirokuma-knowledge-base__create_session(
  title: "Working on authentication feature",
  content: "Implemented JWT validation and rate limiting",
  tags: ["development", "authentication"],
  related_tasks: ["issues-5", "plans-4"],
  related_documents: ["docs-5", "knowledge-5"]
)
```
Expected: Success with both related_tasks and related_documents arrays

### Create daily summary with related fields
```
mcp__shirokuma-knowledge-base__create_summary(
  date: "2025-01-26",
  title: "Security Implementation Progress",
  content: "Completed JWT implementation and started on rate limiting",
  tags: ["daily", "progress"],
  related_tasks: ["issues-5", "plans-4", "plans-5"],
  related_documents: ["docs-5", "knowledge-5"]
)
```
Expected: Success with both related_tasks and related_documents arrays

## 3.4 Related Fields Validation

### 3.4.1 Empty String Validation

- [ ] Create item with empty string in related_tasks: 
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issues", 
  title: "Test", 
  content: "Content", 
  related_tasks: ["issues-1", "", "plans-1"]
)
```
Expected: Error - Related items cannot contain empty strings

- [ ] Update item with empty string in related_documents: 
```
mcp__shirokuma-knowledge-base__update_item(
  type: "docs", 
  id: "1", 
  related_documents: ["docs-2", "", "knowledge-1"]
)
```
Expected: Error - Related items cannot contain empty strings

### 3.4.2 Duplicate Items Handling

- [ ] Create item with duplicate related_tasks: 
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issues", 
  title: "Test", 
  content: "Content", 
  related_tasks: ["issues-1", "issues-1", "issues-2"]
)
```
Expected: Success with duplicates removed (related_tasks: ["issues-1", "issues-2"])

- [ ] Update item with duplicate related items: 
```
mcp__shirokuma-knowledge-base__update_item(
  type: "plans", 
  id: "1", 
  related_tasks: ["issues-1", "issues-2", "issues-1"]
)
```
Expected: Success with duplicates removed (related_tasks: ["issues-1", "issues-2"])
