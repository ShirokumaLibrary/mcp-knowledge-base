---
description: Generate complete specifications using Kiro-style spec-driven development
argument-hint: "'feature description' | list | show <spec-id> | execute <spec-id>"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Task, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, mcp__shirokuma-kb__list_items, TodoWrite
---

# /ai-spec - Main Spec Command

## Language

@.shirokuma/configs/lang.md

## Purpose

Entry point for Kiro-style spec-driven development. Generates complete specifications (Requirements → Design → Tasks) or delegates to phase-specific commands.

## Usage

```bash
/ai-spec "feature description"    # Generate complete spec (all 3 phases)
/ai-spec list                    # List all specs
/ai-spec show <spec-id>          # Show spec details
/ai-spec execute <spec-id>       # Load tasks into TodoWrite
```

For phase-specific operations, use:
- `/ai-spec:req` - Requirements phase only
- `/ai-spec:design` - Design phase only
- `/ai-spec:tasks` - Tasks phase only
- `/ai-spec:refine` - Refine existing specs

## Implementation

### Complete Spec Generation

When given a feature description, generates all three phases sequentially:

1. **Requirements Generation** (@.claude/commands/ai-spec/req.md)
2. **Design Generation** (@.claude/commands/ai-spec/design.md)
3. **Tasks Generation** (@.claude/commands/ai-spec/tasks.md)

Each phase automatically saves to shirokuma-kb and returns the item ID.

### MCP Integration

Specs are automatically stored in shirokuma-kb with Markdown content for human readability:

```typescript
// Generate human-readable Markdown content
const markdownContent = `# Spec: ${featureName}

## Metadata
- **Created**: ${new Date().toISOString()}
- **Status**: ${status}
- **Priority**: ${priority}
- **Phase**: ${phase}
- **Related Issues**: ${relatedIssues.map(id => `#${id}`).join(', ')}

## Phase 1: Requirements

### Introduction
${requirements.introduction}

### User Stories
${requirements.userStories.map(story => 
  `- As a ${story.role}, I want ${story.want} so that ${story.benefit}`
).join('\n')}

### Functional Requirements (EARS)
${requirements.functionalRequirements.map(req => 
  `- ${req.type} ${req.condition} THEN system SHALL ${req.behavior}`
).join('\n')}

### Non-Functional Requirements
${Object.entries(requirements.nonFunctional).map(([category, items]) => 
  `#### ${category}\n${items.map(item => `- ${item}`).join('\n')}`
).join('\n\n')}

### Acceptance Criteria
${requirements.acceptanceCriteria.map(criteria => 
  `- [ ] ${criteria}`
).join('\n')}

## Phase 2: Design

### Architecture Overview
${design.architecture.overview}

### Components
${design.components.map((comp, i) => 
  `${i+1}. **${comp.name}**\n   - Purpose: ${comp.purpose}\n   - Responsibilities: ${comp.responsibilities.join(', ')}`
).join('\n')}

### Data Models
${design.dataModels.map(model => 
  `#### ${model.name}\n${model.fields.map(f => `- ${f.name}: ${f.type} ${f.required ? '(required)' : ''}`).join('\n')}`
).join('\n\n')}

## Phase 3: Tasks

### Task Breakdown
${tasks.phases.map(phase => 
  `#### ${phase.name} [${phase.estimate}]\n${phase.tasks.map(task => 
    `- [ ] ${task.id}: ${task.title} [${task.estimate}]`
  ).join('\n')}`
).join('\n\n')}

### Summary
- **Total Tasks**: ${tasks.totalTasks}
- **Total Effort**: ${tasks.totalEffort}
- **Completed**: ${tasks.completedTasks}/${tasks.totalTasks}
`;

// Create new spec with Markdown content
const specItem = await mcp__shirokuma-kb__create_item({
  type: "spec",
  title: `[Feature]: ${featureName}`,
  description: "Spec-driven development documentation",
  content: markdownContent, // Human-readable Markdown instead of JSON
  status: "Open", // "In Progress", "Review", "Completed"
  priority: "HIGH",
  tags: ["spec", "feature", phase],
  related: [issue_ids]
});

// Return ID to user
console.log(`✅ Spec saved to shirokuma-kb with ID: ${specItem.id}`);
```

### List Specs

Retrieves all specs from MCP:

```typescript
const specs = await mcp__shirokuma-kb__list_items({
  type: "spec",
  sortBy: "created",
  sortOrder: "desc"
});

// Group by status
const activeSpecs = specs.items.filter(s => s.status === "In Progress");
const pendingSpecs = specs.items.filter(s => s.status === "Open");
const completedSpecs = specs.items.filter(s => s.status === "Completed");
```

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

Retrieves and displays a specific spec:

```typescript
const spec = await mcp__shirokuma-kb__get_item({ id: specId });

console.log(`## Spec #${spec.id}: ${spec.title}`);
console.log(`Status: ${spec.status} | Priority: ${spec.priority}`);
console.log(`Created: ${spec.createdAt} | Updated: ${spec.updatedAt}`);
console.log("\n---\n");

// Display the human-readable Markdown content directly
console.log(spec.content);

// For backward compatibility, handle JSON specs if they exist
if (spec.content.startsWith('{')) {
  const content = JSON.parse(spec.content);
  console.log("\n⚠️ Note: This spec uses legacy JSON format. Consider migrating to Markdown format.");
  
  // Display summary for JSON specs
  if (content.requirements) {
    console.log("\n### Requirements Phase");
    console.log(`- User Stories: ${content.requirements.userStories?.length || 0}`);
    console.log(`- Acceptance Criteria: ${content.requirements.acceptanceCriteria?.length || 0}`);
  }
  if (content.design) {
    console.log("\n### Design Phase");
    console.log(`- Components: ${content.design.components?.length || 0}`);
    console.log(`- Data Models: ${content.design.dataModels?.length || 0}`);
  }
  if (content.tasks) {
    console.log("\n### Tasks Phase");
    console.log(`- Total Tasks: ${content.tasks.totalTasks}`);
    console.log(`- Completed: ${content.tasks.completedTasks}`);
  }
}
```

### Execute Spec

Loads tasks from a spec into TodoWrite:

```typescript
// 1. Retrieve spec from MCP
const spec = await mcp__shirokuma-kb__get_item({ id: specId });

// 2. Extract tasks from content
let todoTasks = [];

// Handle Markdown format (new default)
if (!spec.content.startsWith('{')) {
  // Parse tasks from Markdown format
  const taskRegex = /- \[ \] (.+?): (.+?) \[(.+?)\]/g;
  let match;
  let taskId = 1;
  
  while ((match = taskRegex.exec(spec.content)) !== null) {
    todoTasks.push({
      id: match[1] || `TASK-${taskId++}`,
      title: match[2],
      estimate: match[3],
      status: 'todo'
    });
  }
  
  if (todoTasks.length === 0) {
    throw new Error("No tasks found in spec. Ensure Phase 3: Tasks section exists");
  }
} 
// Handle legacy JSON format
else {
  const content = JSON.parse(spec.content);
  
  if (!content.tasks) {
    throw new Error("Spec has no tasks phase. Run /ai-spec:tasks first");
  }
  
  todoTasks = content.tasks.phases.flatMap(phase => 
    phase.tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      phase: phase.name,
      status: task.status || 'todo'
    }))
  );
}

// 3. Create TodoWrite entries
await TodoWrite({ tasks: todoTasks });

// 4. Update spec status to "In Progress"
await mcp__shirokuma-kb__update_item({
  id: specId,
  status: "In Progress"
});

console.log(`✅ Loaded ${todoTasks.length} tasks from spec #${specId} into TodoWrite`);
console.log(`✅ Spec status updated to "In Progress"`);
```

## Examples

### Generate Complete Spec
```
User: /ai-spec "Add user authentication with email/password"
Assistant:
1. Generates requirements using EARS format
2. Creates technical design based on requirements
3. Produces task breakdown from design
4. Stores complete spec in MCP
5. Returns: "✅ Spec saved to shirokuma-kb with ID: 105"
```

### List All Specs
```
User: /ai-spec list
Assistant:
Shows all specs organized by status with phase information
```

### Execute Spec Tasks
```
User: /ai-spec execute 101
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

- `.claude/commands/ai-spec/req.md` - Requirements phase
- `.claude/commands/ai-spec/design.md` - Design phase
- `.claude/commands/ai-spec/tasks.md` - Tasks phase
- `.claude/commands/ai-spec/refine.md` - Refinement operations

## References

- `.claude/commands/ai-spec/shared/ears-format.markdown` - EARS format reference
- `.claude/commands/ai-spec/shared/spec-templates.markdown` - Document templates
- `.claude/commands/ai-spec/shared/spec-prompts.markdown` - Generation prompts