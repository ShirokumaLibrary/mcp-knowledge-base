---
description: Generate complete specifications using Kiro-style spec-driven development
argument-hint: "'feature description' | list | show <spec-id> | execute <spec-id>"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Task, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, mcp__shirokuma-kb__list_items, TodoWrite
---

# /kuma:spec - Main Spec Command

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Entry point for Kiro-style spec-driven development. Generates complete specifications (Requirements → Design → Tasks) or delegates to phase-specific commands.

## Usage

```bash
/kuma:spec 123                     # Generate specs for item (auto-detect)
/kuma:spec "feature description"    # Generate complete spec (creates issue)
/kuma:spec list                    # List all specs
/kuma:spec show 456                # Show spec details
/kuma:spec execute 123             # Execute specs from item
```

For phase-specific operations:
- `/kuma:spec:req 123` - Requirements phase
- `/kuma:spec:design 123` - Design phase
- `/kuma:spec:tasks 123` - Tasks phase
- `/kuma:spec:refine 123` - Refine existing specs

## Implementation

### Steering Integration

Automatically loads and applies steering documents:

```yaml
# Load applicable steering documents
- Tool: loadSteeringDocuments
  Parameters:
    tags: ['inclusion:always']
    currentFile: "[context.workingDirectory]"
  Purpose: Apply project-specific configuration and standards
```

See @.shirokuma/commands/shared/steering-loader.markdown for details.

### Complete Spec Generation

When given a feature description, generates all three phases sequentially:

1. **Requirements Generation** (@.shirokuma/commands/spec/req.md)
   - Applies project standards from steering
   - Incorporates architectural constraints
2. **Design Generation** (@.shirokuma/commands/spec/design.md)
   - Uses steering patterns and conventions
   - Follows established architecture
3. **Tasks Generation** (@.shirokuma/commands/spec/tasks.md)
   - Includes testing requirements from steering
   - Adds git workflow tasks

Each phase automatically saves to shirokuma-kb and returns the item ID.

### MCP Integration

Specs are automatically stored in shirokuma-kb with Markdown content for human readability.

**Type used**: `type: "spec"` - Complete specification including all three phases (requirements, design, tasks)

## Complete Spec Generation Process

1. **Content Structure Creation**
   - Generate comprehensive Markdown document with:
     - Metadata (creation date, status, priority, phase, related issues)
     - Phase 1: Requirements (introduction, user stories, EARS functional requirements, non-functional requirements, acceptance criteria)
     - Phase 2: Design (architecture overview, components, data models)
     - Phase 3: Tasks (task breakdown by phases, summary with metrics)

2. **MCP Storage Operation**
```yaml
# Store complete spec in shirokuma-kb
- Tool: mcp__shirokuma-kb__create_item
  Parameters:
    type: "spec"
    title: "[Feature]: [featureName]"
    description: "Spec-driven development documentation"
    content: "[Generated comprehensive Markdown document with all three phases]"
    status: "Open"  # Can be "In Progress", "Review", "Completed"
    priority: "HIGH"
    tags: ["spec", "feature", "[phase]"]
    related: ["[issue_ids]"]
  Purpose: Store complete specification for development workflow
```

3. **Return Process**
   - Display confirmation message with spec ID

### List Specs

## Spec Listing Process

1. **Retrieve All Specs**
```yaml
# Get all specs from shirokuma-kb
- Tool: mcp__shirokuma-kb__list_items
  Parameters:
    type: "spec"
    sortBy: "created"
    sortOrder: "desc"
  Purpose: Get all specs for overview display
```

2. **Group Specs by Status**
   - Filter specs into categories:
     - Active Specs (status = "In Progress")
     - Pending Specs (status = "Open")
     - Completed Specs (status = "Completed")

Display format:
```
## 📋 Specifications

### Active Specs (In Progress)
1. [#101] User Authentication - Phase: Design
2. [#102] Data Export - Phase: Tasks

### Pending Specs (Open)
3. [#103] Payment Integration - Phase: Requirements

### Completed Specs
4. [#100] Profile Management - Completed 2025-01-15
```

### Show Spec Details

## Spec Display Process

1. **Retrieve Specific Spec**
```yaml
# Get spec details from shirokuma-kb
- Tool: mcp__shirokuma-kb__get_item
  Parameters:
    id: "[specId]"
  Purpose: Load specific spec for detailed view
```

2. **Display Spec Information**
   - Show spec header with ID, title, status, priority
   - Display creation and update timestamps
   - Present human-readable Markdown content directly

3. **Handle Legacy Format Compatibility**
   - Detect JSON format specs (content starts with '{')
   - Display migration warning for legacy specs
   - Show summarized view for JSON specs:
     - Requirements Phase (user stories count, acceptance criteria count)
     - Design Phase (components count, data models count)
     - Tasks Phase (total tasks, completed tasks)

### Execute Spec

## Spec Execution Process

1. **Retrieve Spec from MCP**
```yaml
# Load spec from shirokuma-kb
- Tool: mcp__shirokuma-kb__get_item
  Parameters:
    id: "[specId]"
  Purpose: Load spec for task execution
```

2. **Extract Tasks from Content**
   - **Markdown Format (Default):**
     - Parse tasks using regex: `/- \[ \] (.+?): (.+?) \[(.+?)\]/g`
     - Build task objects with ID, title, estimate, status
     - Validate that Phase 3: Tasks section exists
   
   - **Legacy JSON Format:**
     - Parse JSON content structure
     - Extract tasks from phases array
     - Convert to TodoWrite format
     - Validate tasks phase exists

3. **Create TodoWrite Entries**
```yaml
# Load tasks into TodoWrite
- Tool: TodoWrite
  Parameters:
    tasks: "[todoTasks array with parsed task objects]"
  Purpose: Make spec tasks actionable in workflow
```

4. **Update Spec Status**
```yaml
# Mark spec as in progress
- Tool: mcp__shirokuma-kb__update_item
  Parameters:
    id: "[specId]"
    status: "In Progress"
  Purpose: Track spec execution state
```

5. **Confirmation Process**
   - Display count of loaded tasks
   - Confirm spec status update

## Examples

### Generate Complete Spec
```
User: /kuma:spec "Add user authentication with email/password"
Assistant:
1. Generates requirements using EARS format
2. Creates technical design based on requirements
3. Produces task breakdown from design
4. Stores complete spec in MCP
5. Returns: "✅ Spec saved to shirokuma-kb with ID: 105"
```

### List All Specs
```
User: /kuma:spec list
Assistant:
Shows all specs organized by status with phase information
```

### Execute Spec Tasks
```
User: /kuma:spec execute 101
Assistant:
1. Loads all tasks from spec #101
2. Creates TodoWrite entries
3. Groups by phase
4. Updates spec status
```

## Error Handling

- If feature description is unclear, ask for clarification
- If MCP is unavailable, provide fallback display
- If spec is incomplete, suggest using phase-specific commands
- If tasks already in TodoWrite, warn about duplicates

## Related Commands

- `.shirokuma/commands/spec/req.md` - Requirements phase
- `.shirokuma/commands/spec/design.md` - Design phase
- `.shirokuma/commands/spec/tasks.md` - Tasks phase
- `.shirokuma/commands/spec/refine.md` - Refinement operations

## References

- `.shirokuma/commands/spec/shared/ears-format.markdown` - EARS format reference
- `.shirokuma/commands/spec/shared/spec-templates.markdown` - Document templates
- `.shirokuma/commands/spec/shared/spec-prompts.markdown` - Generation prompts