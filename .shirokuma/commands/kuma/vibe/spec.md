---
description: Execute development from existing spec document
argument-hint: "<spec-id> [phase]"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, TodoWrite, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__get_related_items
---

# /kuma:vibe:spec - Spec-Based Development

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Executes development tasks based on existing spec documents. Follows the requirements, design, and tasks defined in specs while applying steering documents for implementation details.

## Usage

```bash
/kuma:vibe:spec 123               # Execute from item (auto-detect type)
/kuma:vibe:spec 123 requirements  # Execute requirements phase only
/kuma:vibe:spec 123 design       # Execute design phase only
/kuma:vibe:spec 123 tasks        # Execute tasks phase only
```

## Spec Execution Process

### 1. Item Retrieval and Type Detection
- Load item by ID and detect type
- If issue: get all linked spec documents
- If spec: load directly with related specs
- Identify available phases (requirements, design, tasks)
- Load related implementation notes

### 2. Context Loading
- Parse spec content from issue
- Load related documents
- Apply steering documents
- Understand constraints

### 3. Phase Execution

#### Requirements Phase
- Validate requirements completeness
- Check feasibility
- Identify dependencies
- Create acceptance criteria

#### Design Phase
- Implement architecture decisions
- Follow design patterns
- Create module structure
- Define interfaces

#### Tasks Phase
- Load task breakdown
- Update TodoWrite
- Execute tasks sequentially
- Track progress

### 4. Quality Assurance
- Verify against requirements
- Check design compliance
- Run tests
- Validate steering adherence

## Spec Format Understanding

### Requirements Spec
```markdown
# Requirements: Feature Name

## Functional Requirements
- REQ-001: User shall be able to...
- REQ-002: System shall provide...

## Non-Functional Requirements
- Performance: < 200ms response
- Security: JWT authentication
- Scalability: 1000 concurrent users
```

### Design Spec
```markdown
# Design: Feature Name

## Architecture
- Service layer pattern
- Repository for data access
- Event-driven communication

## Components
- UserService: Business logic
- UserRepository: Data access
- UserController: API endpoints
```

### Tasks Spec
```markdown
# Tasks: Feature Name

## Implementation Tasks
1. [ ] Setup module structure
2. [ ] Implement data models
3. [ ] Create service layer
4. [ ] Add API endpoints
5. [ ] Write unit tests
6. [ ] Integration testing
7. [ ] Documentation
```

## TodoWrite Integration

**Automatic task list population:**
1. Parse tasks from spec document
2. Extract task descriptions and dependencies
3. Create TodoWrite entries with:
   - content: Task description from spec
   - status: 'pending' initially
   - activeForm: Progress message format
4. Update status as tasks are completed

## Steering Application

### Automatic Compliance
- Applies coding standards
- Follows architecture patterns
- Uses approved libraries
- Maintains naming conventions

### Context-Aware Implementation

**Steering application process:**
1. Load relevant steering documents based on:
   - Spec category
   - Target file paths
   - Project context
2. Detect existing project patterns:
   - Code style
   - Architecture patterns
   - Naming conventions
3. Generate implementation following:
   - Spec requirements
   - Steering guidelines
   - Project patterns

## Progress Tracking

### Status Updates
```markdown
## Spec Execution Progress

### Requirements ✓
- All requirements validated
- Dependencies identified
- Acceptance criteria defined

### Design 🔄
- Architecture implemented
- 3/5 components complete

### Tasks 📋
- 5/7 tasks complete
- 2 remaining: testing, documentation
```

### MCP Updates

**Progress tracking via MCP:**
- Tool: mcp__shirokuma-kb__update_item
- Updates:
  - status: Update to 'In Progress', 'Review', or 'Completed'
  - metadata.progress: Track phase completion
    - requirements: completed/in_progress/pending
    - design: completed/in_progress/pending
    - tasks: X/Y format for task count
- Frequency: Update after each significant milestone

## Error Handling

### Spec Issues
- **Missing Spec**: Prompt to create
- **Incomplete Spec**: Identify gaps
- **Conflicting Requirements**: Flag for review
- **Unclear Design**: Request clarification

### Implementation Issues
- **Steering Conflicts**: Resolve priorities
- **Technical Blockers**: Document and escalate
- **Test Failures**: Debug and fix
- **Performance Issues**: Optimize

## Best Practices

1. **Spec First**: Always have spec before coding
2. **Phase Separation**: Complete each phase fully
3. **Progress Updates**: Keep spec status current
4. **Steering Compliance**: Follow project standards
5. **Test Coverage**: Meet spec requirements

## Integration Points

### With Other Vibe Commands
- `/kuma:vibe:tdd` - For test implementation
- `/kuma:vibe:code` - For code generation
- `/kuma:vibe:commit` - For change commits

### With Spec Commands
- `/kuma:spec` - Create new specs
- `/kuma:spec:refine` - Update existing specs
- `/kuma:spec:validate` - Check spec quality

## References

- @.shirokuma/commands/shared/steering-loader.markdown