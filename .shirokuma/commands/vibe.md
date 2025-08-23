---
description: Adaptive development workflow based on project vibes and best practices  
argument-hint: "'task description' | list subcommands"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, LS, Task, TodoWrite, WebFetch, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, mcp__shirokuma-kb__search_items, mcp__shirokuma-kb__get_related_items
---

# /kuma:vibe - Adaptive Development Command

## Language

Note: Language settings are configured in MCP steering documents

## Purpose

Adaptive development workflow based on Anthropic's best practices. Understands project "vibes" and leverages steering documents and specs for optimal development approach.

Evolution of `/kuma:code` and `/kuma:go` with more flexible, context-aware development support.

## Usage

```bash
/kuma:vibe 123                     # Work from item (auto-detect type)
/kuma:vibe "task description"      # Adaptive execution (creates issue)
/kuma:vibe                         # List available subcommands
```

## Subcommands

- `/kuma:vibe:code` - Smart implementation with steering compliance
- `/kuma:vibe:tdd` - Test-driven development workflow
- `/kuma:vibe:commit` - Intelligent commit creation
- `/kuma:vibe:visual` - Visual-driven UI development
- `/kuma:vibe:spec` - Execute from existing specs

## Core Philosophy: "Feel the Vibe"

Projects have their own unique "atmosphere":
- **Coding conventions**: kebab-case, TypeScript strict mode
- **Development methodology**: TDD, issue-driven development
- **Architecture**: Service layers, repository patterns
- **Team culture**: Commit formats, PR processes

The vibe command automatically understands and adapts to these.

## Default Adaptive Mode

### Working from Item ID
```bash
/kuma:vibe 123
```

**Process**:
1. **Load Item**: Get item by ID and detect type (issue/spec/task)
2. **Gather Context**: Load all related documents
3. **Vibe Check**: Auto-load steering documents
4. **Planning**: Determine optimal approach
5. **Execution**: Run appropriate workflow
6. **Update**: Record progress and decisions

### Direct Task (Creates Issue)
```bash
/kuma:vibe "implement user authentication"
```

**Process**:
1. **Create Issue**: Generate new issue for task
2. **Context Gathering**: Search related code, specs, issues
3. **Planning**: Create specs and determine approach
4. **Execution**: Run appropriate workflow
5. **Link Documents**: Connect all artifacts to issue

## Steering Integration

### Automatic Steering Loading

**Always Applied** (`inclusion:always` tag):
- Project Standards
- Git Workflow
- Testing Standards

**Context Applied** (`inclusion:filematch` tag):
- MCP API Design (`pattern:mcp/**`)
- Frontend Standards (`pattern:components/**`)

**Manual Reference** (`inclusion:manual` tag):
- Development Environment Setup

### Priority Handling

Controlled by MCP priority field:
1. HIGH: Mandatory compliance
2. MEDIUM: Recommended practices
3. LOW: Reference information

See @.shirokuma/commands/shared/steering-loader.markdown for implementation details.

## Implementation Strategy

### Phase 1: Context Understanding
1. **Load steering documents** - Apply project standards
2. **Search related specs** - Find existing requirements and designs
3. **Analyze project vibe** - Understand patterns and conventions
4. **Detect technology stack** - Identify languages and frameworks

### Phase 2: Adaptive Planning
1. **Classify task type** - Determine optimal approach
2. **Select workflow** - Choose between TDD, visual, spec-based, etc.
3. **Generate execution plan** - Break down into manageable tasks
4. **Apply steering** - Ensure compliance with standards

### Phase 3: Intelligent Execution
1. **Track progress** - Use TodoWrite for task management
2. **Generate code** - Apply patterns and conventions
3. **Verify quality** - Run tests and linting
4. **Document decisions** - Record in MCP for continuity

## Smart Features

### 1. Pattern Recognition
- Learn patterns from existing code
- Auto-apply naming conventions
- Follow architecture patterns

### 2. Context Preservation
- Maintain context between sessions
- Auto-record to MCP
- Quick resume on next work

### 3. Quality Assurance
- Pre-check ESLint errors
- Verify test coverage
- Ensure TypeScript type safety

### 4. Collaborative Intelligence
- Utilize subagents
- Parallel task execution
- Independent verification process

## Best Practices Integration

### Anthropic Recommendations

1. **Explore, Plan, Code, Commit**
   - Clear phase separation
   - Prevent coding without planning

2. **Subagent Utilization**
   - Verification subagents
   - Parallel investigations

3. **Permission Management**
   - Gradual permission expansion
   - Safety assurance

4. **Context Management**
   - Clear unnecessary information
   - Maintain focus

## Example Workflows

### Example 1: New Feature Implementation
```bash
/kuma:vibe 456
# Auto-detects: Issue #456 - Add user profile editing feature
```

**Execution Flow**:
1. Load item #456, detect as issue type
2. Get linked spec_requirements, spec_design, spec_tasks
3. Apply steering (Project Standards, Git Workflow)
4. Analyze existing user-related code
5. Implement following specs with TDD
6. Update issue with implementation notes
7. Create commit linked to issue

### Example 2: Bug Fix
```bash
/kuma:vibe 457
# Auto-detects: Issue #457 - Fix authentication timeout
```

**Execution Flow**:
1. Load item #457, detect as issue type
2. Get reproduction steps and investigation notes
3. Explore authentication code
4. Identify bug cause
5. Fix and create tests
6. Update issue with root cause and fix
7. Commit following PR process

### Example 3: Working from Spec
```bash
/kuma:vibe 458
# Auto-detects: Spec #458 - API endpoint design
```

**Execution Flow**:
1. Load item #458, detect as spec_design type
2. Get parent issue and related specs
3. Apply API steering documents
4. Implement according to design spec
5. Update parent issue with progress

## Integration Points

### MCP Knowledge Base
- Auto-save and search specs
- Manage steering documents
- Record work history
- Link related items

### TodoWrite
- Auto-decompose tasks
- Visualize progress
- Clear completion criteria

### Git Integration
- Auto-apply commit conventions
- Follow branch strategy
- PR creation support

## Error Handling

### Graceful Degradation
- Fallback when steering absent
- Adaptive response when spec undefined
- Safe interruption on error

### User Guidance
- Clear error messages
- Provide fix suggestions
- Show alternative approaches

## Performance Optimization

### Caching Strategy
- Cache steering documents
- Save pattern recognition results
- Optimize frequent searches

### Parallel Processing
- Execute independent tasks in parallel
- Utilize multi-agents
- Leverage async processing

