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

```typescript
// Generate human-readable Markdown content
const markdownContent = `# Tasks: ${featureName}

## Metadata
- **Version**: 1.0
- **Created**: ${new Date().toISOString()}
- **Status**: Ready
- **Phase**: Tasks
${relatedDesign ? `- **Design Spec**: #${relatedDesign}` : ''}

## Overview

### Implementation Strategy
${strategy}

### Testing Approach
${testingApproach} (Test-Driven Development)

### Deployment Strategy
${deploymentStrategy}

## Task Breakdown

${phases.map(phase => `
### Phase ${phase.number}: ${phase.name} [${phase.estimate}]

${phase.tasks.map(task => `
#### Task ${task.id}: ${task.title} [${task.estimatedHours}h]

**Description**: ${task.description}

**Subtasks**:
${task.subtasks.map(subtask => `- [ ] ${subtask}`).join('\n')}

**Requirements**: ${task.requirements.join(', ')}
**Dependencies**: ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}
**Acceptance Criteria**:
${task.acceptanceCriteria.map(criteria => `- [ ] ${criteria}`).join('\n')}
`).join('\n')}

**Phase Summary**:
- Tasks: ${phase.tasks.length}
- Total Effort: ${phase.totalHours}h
- Critical Path: ${phase.criticalPath.join(' → ')}
`).join('\n')}

## Summary

### Metrics
- **Total Tasks**: ${totalTasks}
- **Total Effort**: ${estimatedTotalHours} hours
- **Phases**: ${phases.length}
- **Completed**: ${completedTasks}/${totalTasks}

### Milestones
${milestones.map((milestone, i) => 
  `${i+1}. **${milestone.name}**: ${milestone.date} - ${milestone.deliverables.join(', ')}`
).join('\n')}

### Risk Assessment
${risks.map(risk => `
- **${risk.risk}**: ${risk.likelihood} likelihood
  - Impact: ${risk.impact}
  - Mitigation: ${risk.mitigation}
`).join('\n')}

### Dependencies
${dependencies.map(dep => 
  `- ${dep.external ? '[External]' : '[Internal]'} ${dep.name}: ${dep.description}`
).join('\n')}

## Execution Notes

### Prerequisites
${prerequisites.map(prereq => `- [ ] ${prereq}`).join('\n')}

### Testing Requirements
${testingRequirements.map(req => `- ${req}`).join('\n')}

### Documentation Requirements
${documentationRequirements.map(req => `- ${req}`).join('\n')}

## Task Checklist (For Copy/Paste)

\`\`\`markdown
${phases.flatMap(phase => 
  phase.tasks.map(task => `- [ ] ${task.id}: ${task.title} [${task.estimatedHours}h]`)
).join('\n')}
\`\`\`
`;

// Create or update tasks spec with Markdown content
const tasksSpec = await mcp__shirokuma-kb__create_item({
  type: "spec_tasks",
  title: `Tasks: ${featureName}`,
  description: "Tasks phase of spec-driven development",
  content: markdownContent, // Human-readable Markdown instead of JSON
  status: "Ready", // Ready for implementation
  priority: "HIGH",
  tags: ["spec", "tasks", "implementation"],
  related: relatedSpecs || []
});

console.log(`✅ Tasks spec saved to shirokuma-kb with ID: ${tasksSpec.id}`);
console.log(`📊 Total tasks: ${totalTasks} | Estimated hours: ${estimatedTotalHours}`);
return tasksSpec.id;
```

### Task Execution (TodoWrite Integration)

Load tasks into TodoWrite:

```typescript
// Retrieve spec from MCP
const spec = await mcp__shirokuma-kb__get_item({ id: specId });

// Parse tasks from Markdown format
const taskRegex = /- \[ \] (.+?): (.+?) \[(.+?)h\]/g;
const tasks = [];
let match;

while ((match = taskRegex.exec(spec.content)) !== null) {
  tasks.push({
    id: match[1],
    content: `${match[2]} (${match[3]}h)`,
    status: "pending"
  });
}

// Create TodoWrite entries
await TodoWrite({ todos: tasks });

// Update spec status to In Progress
await mcp__shirokuma-kb__update_item({
  id: specId,
  status: "In Progress"
});

console.log(`✅ Loaded ${tasks.length} tasks into TodoWrite`);
console.log(`✅ Spec #${specId} status updated to "In Progress"`);
```

### Task Refinement

For existing tasks:

```typescript
// 1. Retrieve spec from MCP
const spec = await mcp__shirokuma-kb__get_item({ id: specId });
const content = JSON.parse(spec.content);

// 2. Parse current tasks
const currentTasks = content.tasks;

// 3. Apply refinement based on feedback
const refinedTasks = refineTasks(currentTasks, userFeedback);

// 4. Update spec with refined tasks
const updatedSpec = await mcp__shirokuma-kb__update_item({
  id: specId,
  content: JSON.stringify({
    ...content,
    tasks: refinedTasks,
    version: incrementVersion(content.version),
    updatedAt: new Date().toISOString()
  })
});

console.log(`✅ Tasks refined and updated in spec #${specId}`);
console.log(`📝 Version updated: ${content.version} → ${incrementVersion(content.version)}`);
```

### Task Validation

Validation checklist:
- [ ] All design components have tasks
- [ ] Tasks are 2-4 hours each
- [ ] Dependencies are clear
- [ ] Test tasks included
- [ ] Requirements coverage complete
- [ ] Logical sequencing
- [ ] No circular dependencies
- [ ] Deployment tasks present

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