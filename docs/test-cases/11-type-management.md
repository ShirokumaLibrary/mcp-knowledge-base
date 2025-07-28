# 11. Type Management Tests

This test suite validates the dynamic type system that allows creating new document types.

**Note**: The dynamic type system allows creation of new document types that extend the knowledge base. Types are discovered dynamically using `get_types` - there are no hardcoded enum constraints.

## Type Creation Tests

### TC11.1: Create New Type - Recipe
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
- No description field (null/undefined)

### TC11.2: Create New Type with Description - Tutorial
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "tutorial",
  "description": "Step-by-step guides and how-to instructions for various topics"
}
```
**Expected Result**:
- Success message
- Type registered in sequences table with description
- Directory created at `documents/tutorial/`

### TC11.3: List All Types
**Command**: `mcp__shirokuma-knowledge-base__get_types`
```json
{}
```
**Expected Result**:
- Returns formatted text with sections:
  - Tasks section with issues, plans (showing descriptions)
  - Documents section with docs, knowledge, recipe, tutorial (showing descriptions)
  - Special Types section with sessions and dailies (with ID format info)
- Recipe has no description
- Tutorial shows its description
- Default types (issues, plans, docs, knowledge) show built-in descriptions

### TC11.4: List All Types with Definitions
**Command**: `mcp__shirokuma-knowledge-base__get_types`
```json
{
  "include_definitions": true
}
```
**Expected Result**:
- Same sections as TC11.3 plus:
- Type Definitions (JSON) section containing:
  - Array of all types including special types (sessions, dailies)
  - Each type object has: type, base_type, description, supported_fields
  - Recipe shows description as undefined/null
  - Tutorial shows its custom description
  - Sessions and dailies included with their descriptions

## Item Creation with New Types

### TC11.5: Create Recipe Item
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
- ID: "1" (first item of this type)

### TC11.6: Create Another Recipe
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
- ID: "2" (sequence continues)

### TC11.7: Retrieve Recipe Items
**Command**: `mcp__shirokuma-knowledge-base__get_items`
```json
{
  "type": "recipe"
}
```
**Expected Result**:
- Returns array with two recipe items
- Each item has correct type, title, and content

### TC11.8: Create Tutorial Item
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
- ID: "1" (first item of this tutorial type)

### TC11.9: Update Type Description
**Command**: `mcp__shirokuma-knowledge-base__update_type`
```json
{
  "name": "recipe",
  "description": "Cooking recipes with detailed ingredients, instructions, and tips"
}
```
**Expected Result**:
- Success: Type "recipe" description updated successfully
- Description field updated in sequences table
- Type name remains unchanged (name changes prohibited)

### TC11.10: Get Types After Update
**Command**: `mcp__shirokuma-knowledge-base__get_types`
```json
{
  "include_definitions": true
}
```
**Expected Result**:
- Recipe type shows updated description
- All other type information remains the same

## Error Cases

### TC11.11: Error - Create Duplicate Type
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "recipe"
}
```
**Expected Result**:
- Error: Type "recipe" already exists

### TC11.12: Error - Invalid Type Name
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "My-Type"
}
```
**Expected Result**:
- Error: Type name must start with a letter and contain only lowercase letters, numbers, and underscores

### TC11.13: Error - Create Existing Type
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "issues"
}
```
**Expected Result**:
- Error: Type "issues" already exists

### TC11.14: Error - Create Sessions Type
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "sessions"
}
```
**Expected Result**:
- Error: Type "sessions" already exists
- Note: Sessions use timestamp-based IDs, not sequential IDs

### TC11.15: Error - Create Dailies Type
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "dailies"
}
```
**Expected Result**:
- Error: Type "dailies" already exists
- Note: Dailies use date-based IDs (YYYY-MM-DD), not sequential IDs

### TC11.16: Error - Update Non-existent Type
**Command**: `mcp__shirokuma-knowledge-base__update_type`
```json
{
  "name": "nonexistent",
  "description": "This type does not exist"
}
```
**Expected Result**:
- Error: Type "nonexistent" does not exist

## Type Deletion

### TC11.17: Delete Type Without Items
**Command**: `mcp__shirokuma-knowledge-base__delete_type`
```json
{
  "name": "tutorial"
}
```
**Expected Result**:
- Error: Cannot delete type with existing items (we created one tutorial above)

### TC11.18: Delete Type with Items
**Command**: `mcp__shirokuma-knowledge-base__delete_type`
```json
{
  "name": "recipe"
}
```
**Expected Result**:
- Error: Cannot delete type "recipe" because documents of this type exist

### TC11.19: Delete Default Type
**Command**: `mcp__shirokuma-knowledge-base__delete_type`
```json
{
  "name": "issues"
}
```
**Expected Result**:
- Success: Type "issues" deleted (default types can be deleted like any other type)

### TC11.20: Error - Delete Non-existent Type
**Command**: `mcp__shirokuma-knowledge-base__delete_type`
```json
{
  "name": "nonexistent"
}
```
**Expected Result**:
- Error: Type "nonexistent" not found

## Dynamic Type Usage

### TC11.21: Use Dynamic Types in Tools
**Note**: All item-related tools now accept dynamic type values. The `type` parameter no longer has enum constraints.

**Command**: `mcp__shirokuma-knowledge-base__get_item_detail`
```json
{
  "type": "recipe",
  "id": "1"
}
```
**Expected Result**:
- Returns the chocolate cake recipe created earlier
- Demonstrates that new types work seamlessly with all tools

### TC11.22: Search with Dynamic Types
**Command**: `mcp__shirokuma-knowledge-base__search_items_by_tag`
```json
{
  "tag": "baking",
  "types": ["recipe", "tutorial"]
}
```
**Expected Result**:
- Returns items tagged with "baking" from specified new types
- Shows that type arrays also accept dynamic values

## Task Type Creation

### TC11.23: Create New Task Type with Description
**Command**: `mcp__shirokuma-knowledge-base__create_type`
```json
{
  "name": "bugs",
  "base_type": "tasks",
  "description": "Bug reports and defect tracking with severity and reproduction steps"
}
```
**Expected Result**:
- Success message indicating type created with base_type "tasks"
- Type registered in sequences table with base_type 'tasks' and description
- Directory created at `tasks/bugs/`

### TC11.24: Create Items with New Task Type
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

### TC11.25: Test Status Filtering with New Task Type
**Command**: `mcp__shirokuma-knowledge-base__update_item`
```json
{
  "type": "bugs",
  "id": "1",
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
1. ✓ New type creation with name only (defaults to documents)
2. ✓ New type creation with explicit base_type (tasks or documents)
3. ✓ New type creation with optional description field
4. ✓ Type listing shows all types with descriptions
5. ✓ Type listing includes Special Types section (sessions, dailies)
6. ✓ Type listing with include_definitions shows JSON details
7. ✓ Creating and retrieving items with new types
8. ✓ Type deletion with safety checks
9. ✓ Error handling for invalid operations
10. ✓ All types can be deleted (no special protection)
11. ✓ File naming convention for new types
12. ✓ Separate ID sequences for each type
13. ✓ Task types support status filtering
14. ✓ Task types have priority and status fields
15. ✓ Sessions and dailies are registered in sequences table with descriptions

## Notes
- New types are stored in the sequences table with specified base_type ('tasks' or 'documents') and optional description
- Task types get their own directory under `tasks/`
- Document types get their own directory under `documents/`
- File naming follows the pattern: `{type}-{id}.md`
- Default types: `issues-{id}.md`, `plans-{id}.md`, `docs-{id}.md`, `knowledge-{id}.md`
- Special types: `sessions` (timestamp-based IDs), `dailies` (date-based IDs)
- All type parameters in tools accept dynamic values - use `get_types` to discover available types
- The type system is fully extensible without code changes
- Task types support status, priority, and date fields
- Document types require content field
- Sessions have optional content field (can be created empty and updated later)
- Dailies require content field
- Type descriptions help users understand the purpose and usage of each type