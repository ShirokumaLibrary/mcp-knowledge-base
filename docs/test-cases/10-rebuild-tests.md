# 10. Database Rebuild Tests

This test suite verifies database rebuild functionality from markdown files.

## 10.1 Manual Database Verification

**Note**: This requires command line access, not MCP. These tests verify that the rebuild process correctly reconstructs the database from markdown files.

### Pre-rebuild verification
- [ ] Note current item counts and IDs
- [ ] Note all tags in the system
- [ ] Note session and summary data

### Execute rebuild
- [ ] Execute `npm run rebuild-db` (if you have shell access)
- [ ] Monitor output for any errors or warnings

### Post-rebuild verification via MCP

#### Verify all data is restored
- [ ] Get issues: `mcp__shirokuma-knowledge-base__get_items(type: "issue", includeClosedStatuses: true)`  
      Expected: All issues are restored with correct data

- [ ] Get plans: `mcp__shirokuma-knowledge-base__get_items(type: "plan")`  
      Expected: All plans are restored

- [ ] Get documents: `mcp__shirokuma-knowledge-base__get_items(type: "doc")`  
      Expected: All documents are restored

- [ ] Get knowledge: `mcp__shirokuma-knowledge-base__get_items(type: "knowledge")`  
      Expected: All knowledge entries are restored

#### Verify statuses
- [ ] Get statuses: `mcp__shirokuma-knowledge-base__get_statuses()`  
      Expected: Default statuses are restored with correct is_closed flags

- [ ] Verify custom statuses: Check if any custom status names in markdown files are noted in rebuild output

#### Verify sessions and summaries
- [ ] Get sessions: `mcp__shirokuma-knowledge-base__get_sessions()`  
      Expected: All sessions are correctly restored

- [ ] Get summaries: `mcp__shirokuma-knowledge-base__get_summaries(start_date: "2025-07-24", end_date: "2025-07-26")`  
      Expected: All summaries are correctly restored

#### Verify tags
- [ ] Get tags: `mcp__shirokuma-knowledge-base__get_tags()`  
      Expected: All tags from markdown files are registered (except deleted ones)

#### Verify data integrity
- [ ] Check a specific issue detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issue", id: 4)`  
      Expected: All fields match pre-rebuild state

- [ ] Check status names: Verify issues show status names (not IDs)  
      Expected: Status field contains "Open", "Closed", etc.

### Sequence preservation
- [ ] Create new item after rebuild:
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issue",
  title: "Post-rebuild Test Issue",
  content: "Testing ID sequence after rebuild",
  priority: "low",
  status: "Open"
)
```
Expected: New issue gets ID 5 (not reusing deleted ID 1)

### Tag ID preservation
- [ ] Create new tag: `mcp__shirokuma-knowledge-base__create_tag(name: "post-rebuild-tag")`  
      Expected: Success with continuous tag ID (no gaps from rebuild)