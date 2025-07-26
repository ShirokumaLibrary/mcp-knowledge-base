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

### 3.1.1 Status Filtering Tests (Issues and Plans)

- [ ] Get Issues excluding closed statuses (default): `mcp__shirokuma-knowledge-base__get_items(type: "issues")`  
      Expected: Array containing only issues with open statuses
- [ ] Get Issues including closed statuses: `mcp__shirokuma-knowledge-base__get_items(type: "issues", includeClosedStatuses: true)`  
      Expected: Array containing all issues regardless of status
- [ ] Get Issues with specific status IDs: `mcp__shirokuma-knowledge-base__get_items(type: "issues", statusIds: [1, 2])`  
      Expected: Array containing only issues with status IDs 1 or 2
- [ ] Get Plans excluding closed statuses: `mcp__shirokuma-knowledge-base__get_items(type: "plans")`  
      Expected: Array containing only plans with open statuses
- [ ] Get Plans including closed statuses: `mcp__shirokuma-knowledge-base__get_items(type: "plans", includeClosedStatuses: true)`  
      Expected: Array containing all plans

## 3.2 Detail Retrieval Verification

- [ ] Get Issue detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issues", id: 1)`  
      Expected: Complete issue object with all fields
- [ ] Get Plan detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "plans", id: 1)`  
      Expected: Complete plan object with dates
- [ ] Get Document detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "docs", id: 1)`  
      Expected: Complete document object
- [ ] Get Knowledge detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "knowledge", id: 1)`  
      Expected: Complete knowledge object
- [ ] Get non-existent item: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issues", id: 9999)`  
      Expected: null or error

## 3.3 Data Update Verification

### Issue update (content change)
```
mcp__shirokuma-knowledge-base__update_item(
  type: "issues",
  id: 1,
  content: "## Issue Details (Updated)\nProblem is being resolved.\n\n### Root Cause\nPassword escaping issue identified\n\n### Solution\nImplemented proper escaping for special characters"
)
```
Expected: Success with updated content

### Plan update (add tags)
```
mcp__shirokuma-knowledge-base__update_item(
  type: "plans",
  id: 1,
  tags: ["roadmap", "q1-2025", "planning", "priority"]
)
```
Expected: Success with additional tag

### Partial update test (only title)
```
mcp__shirokuma-knowledge-base__update_item(
  type: "docs",
  id: 1,
  title: "API Authentication Guide v2"
)
```
Expected: Success with only title changed, other fields preserved

### Status update test
```
mcp__shirokuma-knowledge-base__update_item(
  type: "issues",
  id: 1,
  status: "In Progress"
)
```
Expected: Success with status changed to "In Progress"

### Summary update test
```
mcp__shirokuma-knowledge-base__update_item(
  type: "plans",
  id: 4,
  description: "Updated: Implement comprehensive rate limiting with monitoring capabilities"
)
```
Expected: Success with only description changed, other fields preserved

### Update both description and content
```
mcp__shirokuma-knowledge-base__update_item(
  type: "knowledge",
  id: 4,
  description: "Essential microservices patterns for scalable distributed systems",
  content: "## Microservices Design Patterns (Updated)\n\n### Core Patterns\n1. **API Gateway**\n2. **Service Discovery**\n3. **Circuit Breaker**\n4. **Bulkhead**\n\n### Data Patterns\n- Saga Pattern\n- Event Sourcing\n- CQRS\n\n### Deployment Patterns\n- Blue-Green Deployment\n- Canary Release\n- Feature Toggles"
)
```
Expected: Success with both description and content updated