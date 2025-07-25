# 11. Edge Cases and Additional Tests

This test suite covers edge cases, boundary conditions, and special scenarios.

## 11.1 Special Characters and Unicode

### Create item with Japanese content
```
mcp__shirokuma-knowledge-base__create_item(
  type: "knowledge",
  title: "日本語テスト",
  content: "## 概要\nこれは日本語のコンテンツです。\n\n### 詳細\n- 項目1\n- 項目2\n- 特殊文字: !@#$%^&*()_+{}[]|\\:;<>?,./",
  tags: ["日本語", "テスト"]
)
```
Expected: Success with proper Unicode handling

### Create item with emoji
```
mcp__shirokuma-knowledge-base__create_item(
  type: "doc",
  title: "Emoji Test 🚀",
  content: "## Testing Emojis 😀\n\n- ✅ Task completed\n- 🐛 Bug fixed\n- 📚 Documentation",
  tags: ["emoji", "test"]
)
```
Expected: Success with emojis preserved

## 11.2 Boundary Testing

- [ ] Create item with very long content (test with 100+ lines)
- [ ] Create item with empty tags array: `tags: []`
- [ ] Create item with single tag: `tags: ["single"]`
- [ ] Very long title (200+ characters)

### Content with code blocks
```
mcp__shirokuma-knowledge-base__create_item(
  type: "knowledge",
  title: "Code Example",
  content: "## Code Sample\n\n```python\ndef hello():\n    print('Hello')\n```\n\n```javascript\nconst test = () => {\n  console.log('test');\n};\n```",
  tags: ["code"]
)
```
Expected: Success with code blocks preserved

## 11.3 Concurrent Operations

- [ ] Create multiple items rapidly in succession (5+ items)
- [ ] Update the same item multiple times quickly
- [ ] Create sessions with millisecond precision

## 11.4 Date Handling

- [ ] Create plan with same start and end date
- [ ] Create plan with past dates
- [ ] Get sessions for wide date range: `start_date: "2020-01-01", end_date: "2030-12-31"`
- [ ] Get summaries for future dates

## 11.5 Status Filtering Edge Cases

### Create issue with "Cancelled" status
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

## 11.6 Search Edge Cases

- [ ] Search with empty pattern: `mcp__shirokuma-knowledge-base__search_tags(pattern: "")`
- [ ] Search with special regex characters: `mcp__shirokuma-knowledge-base__search_tags(pattern: ".*")`
- [ ] Case sensitivity test: search for "API" vs "api"

## 11.7 Type Parameter Tests

### Test invalid type parameter
```
mcp__shirokuma-knowledge-base__create_item(
  type: "invalid_type",
  title: "Test",
  content: "Test content"
)
```
Expected: Error about invalid type

### Test type parameter case sensitivity
```
mcp__shirokuma-knowledge-base__create_item(
  type: "ISSUE",
  title: "Test",
  content: "Test content"
)
```
Expected: Error (type must be lowercase)

### Test document type alias
```
mcp__shirokuma-knowledge-base__get_items(type: "document")
```
Expected: Error or empty result (should use "doc" or "knowledge")

### Test type parameter with subtype (doc)
```
mcp__shirokuma-knowledge-base__get_item_detail(
  type: "document",
  subtype: "doc",
  id: 1
)
```
Expected: Document details if using unified document type

### Test type parameter with subtype (knowledge)
```
mcp__shirokuma-knowledge-base__get_item_detail(
  type: "document",
  subtype: "knowledge", 
  id: 1
)
```
Expected: Knowledge details if using unified document type

### Test missing type parameter
```
mcp__shirokuma-knowledge-base__create_item(
  title: "Test",
  content: "Test content"
)
```
Expected: Error about missing required parameter

### Test type filtering in search
```
mcp__shirokuma-knowledge-base__search_items_by_tag(
  tag: "api",
  types: ["issue", "doc", "invalid"]
)
```
Expected: Results only for valid types (issue, doc), ignoring "invalid"