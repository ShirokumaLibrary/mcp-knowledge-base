# 12. Type Management Tests

This test suite validates the dynamic type system that allows creating custom document types.

**Note**: The dynamic type system allows creation of custom document types that extend the knowledge base. Types are discovered dynamically using `get_types` - there are no hardcoded enum constraints.

## Type Creation Tests

### TC12.1: Create Custom Type - Recipe
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "recipe"
}
```
**Expected Result**:
- Success message indicating type created
- Type registered in sequences table with base_type 'documents'
- Directory created at `documents/recipe/`

### TC12.2: Create Custom Type - Tutorial
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "tutorial"
}
```
**Expected Result**:
- Success message
- Type registered in sequences table
- Directory created at `documents/tutorial/`

### TC12.3: List All Types
**Command**: `mcp__shirokuma-knowledge-base__get_types`
```json
{}
```
**Expected Result**:
- Returns array including all types (issues, plans, docs, knowledge, recipe, tutorial)
- Each type shows name and base_type

## Item Creation with Custom Types

### TC12.5: Create Recipe Item
**Command**: `mcp__shirokuma-knowledge-base__create_item`
```json
{
  "type": "recipe",
  "title": "Chocolate Cake Recipe",
  "content": "## Ingredients\n- 2 cups flour\n- 1 cup sugar\n- 3/4 cup cocoa powder\n\n## Instructions\n1. Preheat oven to 350°F\n2. Mix dry ingredients\n3. Add wet ingredients\n4. Bake for 30 minutes",
  "tags": ["dessert", "baking"]
}
```
**Expected Result**:
- Success: Item created with type "recipe"
- File created at: `documents/recipe/recipe-1.md`
- ID: 1 (first item of this type)

### TC12.6: Create Another Recipe
**Command**: `mcp__shirokuma-knowledge-base__create_item`
```json
{
  "type": "recipe",
  "title": "Simple Pasta",
  "content": "## Quick Pasta Recipe\n- Boil water\n- Add pasta\n- Cook for 10 minutes\n- Add sauce",
  "tags": ["italian", "quick"]
}
```
**Expected Result**:
- Success: Item created
- File created at: `documents/recipe/recipe-2.md`
- ID: 2 (sequence continues)

### TC12.7: Retrieve Recipe Items
**Command**: `mcp__shirokuma-knowledge-base__get_items`
```json
{
  "type": "recipe"
}
```
**Expected Result**:
- Returns array with two recipe items
- Each item has correct type, title, and content

### TC12.8: Create Tutorial Item
**Command**: `mcp__shirokuma-knowledge-base__create_item`
```json
{
  "type": "tutorial",
  "title": "Git Basics Tutorial",
  "content": "## Getting Started with Git\n\n### Step 1: Install Git\n- Download from git-scm.com\n- Follow installation wizard\n\n### Step 2: Configure Git\n```bash\ngit config --global user.name \"Your Name\"\ngit config --global user.email \"your@email.com\"\n```",
  "tags": ["git", "version-control", "tutorial"]
}
```
**Expected Result**:
- Success: Item created with type "tutorial"
- File created at: `documents/tutorial/tutorial-1.md`
- ID: 1 (first item of this tutorial type)

## Error Cases

### TC12.9: Error - Create Duplicate Type
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "recipe"
}
```
**Expected Result**:
- Error: Type "recipe" already exists

### TC12.10: Error - Invalid Type Name
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "My-Type"
}
```
**Expected Result**:
- Error: Type name must start with a letter and contain only lowercase letters, numbers, and underscores

### TC12.11: Error - Create Built-in Type
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "issues"
}
```
**Expected Result**:
- Error: Type "issues" is a built-in type and cannot be created

## Type Deletion

### TC12.12: Delete Type Without Items
**Command**: `mcp__shirokuma-knowledge-base__delete_type`
```json
{
  "name": "tutorial"
}
```
**Expected Result**:
- Error: Cannot delete type with existing items (we created one tutorial above)

### TC12.13: Delete Type with Items
**Command**: `mcp__shirokuma-knowledge-base__delete_type`
```json
{
  "name": "recipe"
}
```
**Expected Result**:
- Error: Cannot delete type "recipe" because documents of this type exist

### TC12.14: Delete Default Type
**Command**: `mcp__shirokuma-knowledge-base__delete_type`
```json
{
  "name": "issues"
}
```
**Expected Result**:
- Success: Type "issues" deleted (default types can be deleted like any other type)

### TC12.15: Error - Delete Non-existent Type
**Command**: `mcp__shirokuma-knowledge-base__delete_type`
```json
{
  "name": "nonexistent"
}
```
**Expected Result**:
- Error: Type "nonexistent" not found

## Dynamic Type Usage

### TC12.16: Use Dynamic Types in Tools
**Note**: All item-related tools now accept dynamic type values. The `type` parameter no longer has enum constraints.

**Command**: `mcp__shirokuma-knowledge-base__get_item_detail`
```json
{
  "type": "recipe",
  "id": 1
}
```
**Expected Result**:
- Returns the chocolate cake recipe created earlier
- Demonstrates that custom types work seamlessly with all tools

### TC12.17: Search with Dynamic Types
**Command**: `mcp__shirokuma-knowledge-base__search_items_by_tag`
```json
{
  "tag": "baking",
  "types": ["recipe", "tutorial"]
}
```
**Expected Result**:
- Returns items tagged with "baking" from specified custom types
- Shows that type arrays also accept dynamic values

## Task Type Creation

### TC12.18: Create Custom Task Type
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "bugs",
  "base_type": "tasks"
}
```
**Expected Result**:
- Success message indicating type created with base_type "tasks"
- Type registered in sequences table with base_type 'tasks'
- Directory created at `tasks/bugs/`

### TC12.19: Create Items with Custom Task Type
**Command**: `mcp__shirokuma-knowledge-base__create_item`
```json
{
  "type": "bugs",
  "title": "Login Button Not Working",
  "content": "The login button is unresponsive on mobile devices",
  "priority": "high",
  "status": "Open",
  "tags": ["mobile", "ui", "critical"]
}
```
**Expected Result**:
- Success: Item created with type "bugs"
- File created at: `tasks/bugs/bugs-1.md`
- Item has status and priority fields

### TC12.20: Test Status Filtering with Custom Task Type
**Command**: `mcp__shirokuma-knowledge-base__update_item`
```json
{
  "type": "bugs",
  "id": 1,
  "status": "Closed"
}
```
**Expected Result**:
- Success: Status updated to "Closed"

**Command**: `mcp__shirokuma-knowledge-base__get_items`
```json
{
  "type": "bugs"
}
```
**Expected Result**:
- Empty array (closed items excluded by default)

**Command**: `mcp__shirokuma-knowledge-base__get_items`
```json
{
  "type": "bugs",
  "includeClosedStatuses": true
}
```
**Expected Result**:
- Array with the closed bug item

## Summary
These tests validate:
1. ✓ Custom type creation with name only (defaults to documents)
2. ✓ Custom type creation with explicit base_type (tasks or documents)
3. ✓ Type listing shows all types
4. ✓ Creating and retrieving items with custom types
5. ✓ Type deletion with safety checks
6. ✓ Error handling for invalid operations
7. ✓ All types can be deleted (no special protection)
8. ✓ File naming convention for custom types
9. ✓ Separate ID sequences for each type
10. ✓ Task types support status filtering
11. ✓ Task types have priority and status fields

## Notes
- Custom types are stored in the sequences table with specified base_type ('tasks' or 'documents')
- Task types get their own directory under `tasks/`
- Document types get their own directory under `documents/`
- File naming follows the pattern: `{type}-{id}.md`
- Default types: `issues-{id}.md`, `plans-{id}.md`, `docs-{id}.md`, `knowledge-{id}.md`
- All type parameters in tools accept dynamic values - use `get_types` to discover available types
- The type system is fully extensible without code changes
- Task types support status, priority, and date fields
- Document types require content field