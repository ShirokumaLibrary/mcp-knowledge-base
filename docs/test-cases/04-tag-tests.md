# 4. Tag Functionality Tests

This test suite verifies tag management and tag-based search functionality.

## 4.1 Tag Management

- [ ] Get tag list: `mcp__shirokuma-knowledge-base__get_tags()`  
      Expected: Array containing all auto-registered tags from created items:  
      ["bug", "authentication", "urgent", "feature", "ui", "enhancement", "roadmap", "q1-2025", "planning", "technical-debt", "refactoring", "documentation", "api", "guidelines", "development", "standards", "best-practices", "error-handling", "security", "checklist", "architecture", "microservices", "patterns", "priority", "ci-cd", "devops", "automation", "memory", "performance", "infrastructure"]

- [ ] Tag search: `mcp__shirokuma-knowledge-base__search_tags(pattern: "auth")`  
      Expected: Array containing "authentication", "automation"

- [ ] Create new tag: `mcp__shirokuma-knowledge-base__create_tag(name: "test-tag")`  
      Expected: Success confirmation

- [ ] Create duplicate tag: `mcp__shirokuma-knowledge-base__create_tag(name: "test-tag")`  
      Expected: Error "Tag already exists"

## 4.2 Search by Tag

- [ ] Single tag search: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "authentication")`  
      Expected: Results containing Issue 1 and Doc 1 (both have "authentication" tag)

- [ ] Tag search with specific types: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "authentication", types: ["issue", "doc"])`  
      Expected: Same results (Issue 1 and Doc 1)

- [ ] Search for "development" tag: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "development")`  
      Expected: Results containing Doc 3 and Knowledge 1 (both have "development" tag)

- [ ] Search with non-existent tag: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "nonexistent")`  
      Expected: Empty result

- [ ] Search for "api" tag across all types: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "api")`  
      Expected: Results containing Doc 1 and Plan 4

- [ ] Search with type filtering: `mcp__shirokuma-knowledge-base__search_items_by_tag(tag: "security", types: ["plan", "knowledge"])`  
      Expected: Results containing Plan 4 and Knowledge 3