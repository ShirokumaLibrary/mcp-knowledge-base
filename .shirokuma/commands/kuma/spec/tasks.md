---
description: Break down design into actionable implementation tasks following TDD
argument-hint: "<spec-id> | refine <spec-id> | validate <spec-id> | execute <spec-id>"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, TodoWrite
---

# /kuma:spec:tasks - Tasks Phase Command

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Breaks down technical design into actionable implementation tasks. This is Phase 3 of the spec-driven development process.

## Usage

```bash
/kuma:spec:tasks <spec-id>           # Generate tasks from design
/kuma:spec:tasks refine <spec-id>    # Refine task breakdown
/kuma:spec:tasks validate <spec-id>  # Validate task completeness
/kuma:spec:tasks execute <spec-id>   # Load tasks into TodoWrite
```

## Implementation

**Type used**: `type: "spec_tasks"` - Task breakdown phase only (implementation tasks, test tasks, priorities)

### Task Generation Process

#### Step 1: Load Design
- Retrieve spec from MCP
- Parse design document
- Identify components to implement
- Extract dependencies

#### Step 2: Create Task Phases
Standard phases:
1. **Foundation and Setup** - Project structure, dependencies
2. **Core Business Logic** - Services, business rules
3. **API Layer** - Endpoints, validation
4. **User Interface** - Components, state management
5. **Integration and Testing** - E2E, performance
6. **Deployment** - Configuration, documentation

#### Step 3: Break Down Tasks
- Each task: 2-4 hours completion time
- Include specific files/functions
- Add testing requirements
- Reference requirements
- Define dependencies

### Generation Prompt

From @.shirokuma/commands/shared/spec-prompts.markdown:

```
Now that we have the design approved, please break it down into actionable coding tasks.

Design summary: [KEY_DESIGN_COMPONENTS_FROM_SPEC]

Create an implementation plan that:
- Follows test-driven development principles
- Builds incrementally with early validation
- Sequences tasks to minimize dependencies
- Includes specific file/component creation steps

Each task should:
- Reference specific requirements it addresses
- Be completable in 2-4 hours
- Include testing requirements
- Build on previous tasks

Generate tasks following this structure:
[Template from @.shirokuma/commands/shared/spec-templates.markdown#tasks-template-structure]
```

### MCP Storage

Tasks are automatically stored in shirokuma-kb as human-readable Markdown:

## Tasks Document Generation Process

1. **Content Structure Creation**
   - Generate comprehensive Markdown document with:
     - Metadata (version, creation date, status, phase, related design spec)
     - Overview (implementation strategy, testing approach, deployment strategy)
     - Task Breakdown (phases with detailed tasks, subtasks, requirements, dependencies, acceptance criteria)
     - Summary (metrics, milestones, risk assessment, dependencies)
     - Execution Notes (prerequisites, testing requirements, documentation requirements)
     - Task Checklist (copy/paste ready format)

2. **MCP Storage Operation**
```yaml
# Store tasks in shirokuma-kb
- Tool: mcp__shirokuma-kb__create_item
  Parameters:
    type: "spec_tasks"
    title: "Tasks: [featureName]"
    description: "Tasks phase of spec-driven development"
    content: "[Generated comprehensive Markdown document]"
    status: "Ready"  # Ready for implementation
    priority: "HIGH"
    tags: ["spec", "tasks", "implementation"]
    related: "[relatedSpecs if exists]"
  Purpose: Store task breakdown for execution and tracking
```

3. **Return Process**
   - Display confirmation message with spec ID
   - Show task count and estimated total hours
   - Return spec ID for linking and execution

### Task Execution (TodoWrite Integration)

Load tasks into TodoWrite:

## Task Execution Process

1. **Retrieve Spec from MCP**
```yaml
# Load tasks spec from shirokuma-kb
- Tool: mcp__shirokuma-kb__get_item
  Parameters:
    id: "[specId]"
  Purpose: Load task breakdown for execution
```

2. **Parse Tasks from Markdown**
   - Extract tasks using regex pattern: `/- \[ \] (.+?): (.+?) \[(.+?)h\]/g`
   - Build task objects with ID, content, and time estimate
   - Convert to TodoWrite format structure

3. **Create TodoWrite Entries**
```yaml
# Load tasks into TodoWrite for execution
- Tool: TodoWrite
  Parameters:
    todos: "[parsed task array with id, content, status]"
  Purpose: Make tasks actionable in development workflow
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
   - Confirm spec status update to "In Progress"

### Task Refinement

For existing tasks:

## Task Refinement Process

1. **Retrieve Current Spec**
```yaml
# Load existing tasks spec
- Tool: mcp__shirokuma-kb__get_item
  Parameters:
    id: "[specId]"
  Purpose: Get current tasks for refinement
```

2. **Parse and Refine Tasks**
   - Extract current task structure from Markdown content
   - Apply user feedback to task breakdown
   - Adjust task sizing, dependencies, and sequencing
   - Update estimates and acceptance criteria

3. **Update Spec with Refined Tasks**
```yaml
# Save refined tasks
- Tool: mcp__shirokuma-kb__update_item
  Parameters:
    id: "[specId]"
    content: "[Updated Markdown with refined tasks, incremented version, updated timestamp]"
  Purpose: Store improved task breakdown
```

4. **Confirmation Process**
   - Display confirmation message with spec ID
   - Show version increment (e.g., "1.0 → 1.1")

### Task Validation

## Task Validation Checklist

**Coverage Validation:**
- [ ] All design components have tasks
- [ ] Tasks are 2-4 hours each
- [ ] Dependencies are clear
- [ ] Test tasks included
- [ ] Requirements coverage complete
- [ ] Logical sequencing
- [ ] No circular dependencies
- [ ] Deployment tasks present

**Quality Assessment:**
- Verify task atomicity and measurability
- Check TDD compliance (test-first approach)
- Validate dependency relationships
- Confirm realistic time estimates
- Ensure proper phase sequencing

## Examples

### Generate Tasks from Design
```
User: /kuma:spec:tasks 101
Assistant:
1. Retrieves design from spec #101
2. Analyzes components and interfaces
3. Creates 6-phase implementation plan
4. Breaks down into specific tasks
5. Adds testing and deployment
6. Updates spec with tasks phase
7. Returns: "✅ Tasks saved to shirokuma-kb with ID: 101"
           "📊 Total tasks: 15 | Estimated hours: 48"
```

### Execute Tasks
```
User: /kuma:spec:tasks execute 101
Assistant:
1. Retrieves tasks from spec #101
2. Flattens all phases into task list
3. Creates TodoWrite entries
4. Groups by phase for clarity
5. Tracks completion status
```

### Refine Tasks
```
User: /kuma:spec:tasks refine 101
Assistant:
1. Retrieves tasks from spec #101
2. Identifies issues (too large, missing tests)
3. Breaks down or adds tasks
4. Resequences if needed
5. Updates spec
```

## Task Guidelines

### Task Characteristics
- **Atomic**: Single, focused objective
- **Measurable**: Clear completion criteria
- **Timeboxed**: 2-4 hours maximum
- **Testable**: Includes verification
- **Traceable**: Links to requirements

### Task Sequencing Rules
1. Infrastructure before features
2. Data models before business logic
3. Backend before frontend
4. Core before edge cases
5. Unit tests before integration
6. Documentation with implementation

### TDD Approach
For each component:
1. Write failing test
2. Implement minimum code
3. Make test pass
4. Refactor
5. Add more tests

## Integration with Development

### Working with Tasks
1. Load tasks into TodoWrite
2. Work through phases sequentially
3. Mark tasks complete as finished
4. Update spec progress
5. Handle blocked tasks

### Progress Tracking
- Update spec with completed count
- Track actual vs estimated hours
- Document blockers
- Note design changes needed

## References

- `.shirokuma/commands/spec/shared/spec-templates.markdown` - Tasks template structure
- `.shirokuma/commands/spec/shared/spec-prompts.markdown` - Task generation prompts
- `.shirokuma/commands/spec/design.md` - Previous phase: Design
- `.shirokuma/commands/spec/refine.md` - Refinement operations