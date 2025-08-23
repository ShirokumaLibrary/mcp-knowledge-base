---
description: General-purpose task executor for non-design/coding work
argument-hint: "[issue-id | 'task description']"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Task, TodoWrite, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, mcp__shirokuma-kb__search_items
---

# /kuma:go - General Task Executor

## Usage
```
/kuma:go [issue-id or task description]
```

Examples:
- `/kuma:go 123` - Work on item #123 (auto-detect type)
- `/kuma:go "update dependencies"` - Update dependencies (creates issue)
- `/kuma:go "add tests for utils"` - Add tests (creates issue)
- `/kuma:go "fix eslint warnings"` - Fix warnings (creates issue)
- `/kuma:go "update README"` - Update docs (creates issue)

## Task

Note: Language settings are configured in MCP steering documents

Execute general maintenance and operational tasks that don't require formal design or new feature implementation. For new features or major changes, use `/kuma:design` followed by `/kuma:code`.

### Core Purpose: General Task Automation

**Task Categories**:
1. **Bug Fixes** - Small fixes that don't require design
2. **Refactoring** - Code improvements without behavior changes
3. **Documentation** - README, comments, docs updates
4. **Configuration** - Settings, environment, build configs
5. **Testing** - Adding or fixing tests
6. **Maintenance** - Dependencies, linting, formatting
7. **Operations** - Build, deploy, migration tasks

### Task Execution Workflow

**General Workflow**:
1. **Analysis Phase**: Understand the task requirements
2. **Planning Phase**: Create execution plan with TodoWrite
3. **Execution Phase**: Perform the task
4. **Validation Phase**: Verify task completion
5. **Cleanup Phase**: Update documentation/status

### Task Categories and Approaches

**Bug Fixes (Small)**:
```yaml
Approach:
  - Identify the issue
  - Write test to reproduce (if applicable)
  - Apply minimal fix
  - Verify existing tests pass
  → Single commit with clear message
```

**Refactoring**:
```yaml
Approach:
  - Identify improvement areas
  - Ensure tests exist
  - Make structural changes
  - Verify tests still pass
  → Separate commits for different refactoring types
```

**Documentation**:
```yaml
Approach:
  - Review existing docs
  - Identify gaps or outdated info
  - Update or create documentation
  - Add examples if helpful
  → Commit with "docs:" prefix
```

**Configuration**:
```yaml
Approach:
  - Review current settings
  - Apply necessary changes
  - Test configuration works
  - Update related documentation
  → Commit with "config:" prefix
```

### Execution Limits

**MAX_ATTEMPTS = 3 per task**
- Task execution: Maximum 3 attempts
- Error recovery: Maximum 2 retries per error
- Validation: Must pass before completion
- Clear completion message after success

### Pre-flight Check Phase

**Smart Environment Health Verification** (Before Starting Work):

Run pre-flight checks to ensure the development environment is ready.

For detailed pre-flight check procedures and test configurations, see:
→ See MCP steering document (type: steering, tag: testing) for pre-flight checks

The checks include build validation, lint validation, type checking, test suite execution, and environment validation. Specific checks depend on the project configuration.

### TodoWrite Integration

**Progress Tracking**: All workflow phases are tracked using TodoWrite for visibility:

- **TDD Workflow**: Pre-flight → Design → RED → GREEN → REVIEW → REFACTOR → Complete
- **Documentation Workflow**: Outline → Draft → Review → Polish
- **Research Workflow**: Investigation → Analysis → Synthesis → Documentation

Each phase updates todo status (pending → in_progress → completed) to show real-time progress.

### Automatic Task Detection

The system automatically analyzes input and selects the appropriate workflow:

#### Task Type Detection

**Automatic Task Type Analysis**:
```yaml
Task Type Analysis:
1. Keyword Detection:
   - "update dependencies", "npm update" → Maintenance
   - "fix lint", "eslint" → Code Quality
   - "add tests", "test coverage" → Testing
   - "update README", "docs" → Documentation
   - "refactor", "cleanup" → Refactoring
   - "config", "settings" → Configuration
   - "migrate", "database" → Migration
   
2. Issue Tag Analysis:
   - #maintenance → Maintenance workflow
   - #refactoring → Refactoring workflow
   - #documentation → Documentation workflow
   - #testing → Test addition workflow
   - #bug (small) → Quick fix workflow
   
3. Scope Detection:
   - Large scope (>5 files) → Suggest using /kuma:design first
   - New feature detected → Redirect to /kuma:design
   - Small scope → Proceed with task
```

**Workflow Selection Logic**:
```yaml
if scope_too_large or is_new_feature:
  suggest: "This looks like it needs design. Use /kuma:design first"
  exit

elif task_type == "maintenance":
  execute MaintenanceWorkflow:
    1. Identify: What needs updating
    2. Execute: Run update commands
    3. Test: Verify nothing broke
    4. Document: Update lock files/docs
    
elif task_type == "refactoring":
  execute RefactoringWorkflow:
    1. Analyze: Current code structure
    2. Plan: Refactoring approach
    3. Execute: Make changes incrementally
    4. Validate: All tests pass
    
elif task_type == "documentation":
  execute DocumentationWorkflow:
    1. Review: Existing documentation
    2. Update: Make improvements
    3. Examples: Add if helpful
    4. Commit: Clear message
    
elif task_type == "testing":
  execute TestingWorkflow:
    1. Coverage: Identify gaps
    2. Write: Add test cases
    3. Run: Verify tests pass
    4. Report: Coverage improvement
    
else:
  execute GeneralTaskWorkflow
```

#### For Issues (e.g., `issues-123`):
1. **Fetch issue details** from MCP
2. **Detect task type** from issue tags, title, and description
3. **Select appropriate workflow** based on task type:
   - Documentation tasks → Documentation workflow
   - Code tasks → TDD workflow (Kent Beck methodology)
   - Research tasks → Research workflow
   - Configuration tasks → Configuration workflow
4. **Execute selected workflow** autonomously
5. **Continue until success** or truly unsolvable problem

#### For Instructions (e.g., `"implement authentication"`):
1. **Parse and understand** the request
2. **Detect task type** from keywords and context
3. **Create tracking issue** automatically with appropriate tags
4. **Execute appropriate workflow** with autonomous decision-making

### Autonomous Execution Flow

The system executes all tasks autonomously with built-in quality assurance:

#### Workflow-Specific Execution

##### Documentation Workflow (for .md, README, specs, docs)
```yaml
Documentation Creation Flow:
1. Outline Phase:
   Main agent:
     - Analyze documentation requirements
     - Create structure and sections
     - Define key topics to cover
     - Save outline to decisions-XX

2. Draft Phase:
   Main agent:
     - Write content based on outline
     - Include examples and explanations
     - Add appropriate formatting
     - Create knowledge-XX or docs-XX

3. Review Phase:
   @agent-shirokuma-reviewer:
     - Check content accuracy
     - Verify completeness
     - Assess clarity and readability
     - Create handover with feedback

4. Polish Phase (if needed):
   Main agent:
     - Apply review feedback
     - Improve formatting
     - Add missing sections
     - Finalize document
```

##### Configuration Workflow (for .json, .yaml, .toml)
```yaml
Configuration Update Flow:
1. Analysis: Review current configuration
2. Planning: Identify required changes
3. Implementation: Apply changes carefully
4. Validation: Test configuration works
```

##### Research Workflow (for investigations, explorations)
```yaml
Research Flow:
1. Investigation: Gather relevant information
2. Analysis: Evaluate findings and options
3. Synthesis: Create recommendations
4. Documentation: Record in knowledge base
```

#### Task Execution Examples

##### Bug Fix Workflow
```yaml
Small Bug Fix:
1. Identify the issue location
2. Write test to reproduce (if testable)
3. Apply minimal fix
4. Verify all tests pass
5. Commit with clear message
```

##### Refactoring Workflow
```yaml
Code Refactoring:
1. Identify code to refactor
2. Ensure tests exist
3. Make incremental changes
4. Verify tests after each change
5. Commit each logical change separately
```

##### Documentation Workflow
```yaml
Documentation Update:
1. Review existing documentation
2. Identify what needs updating
3. Make improvements
4. Add examples if helpful
5. Commit with "docs:" prefix
```

##### Maintenance Workflow
```yaml
Dependency Update:
1. Check for outdated packages
2. Update dependencies
3. Run tests to verify
4. Update lock files
5. Document any breaking changes
```

##### Testing Workflow
```yaml
Add Missing Tests:
1. Identify untested code
2. Write test cases
3. Ensure good coverage
4. Run all tests
5. Report coverage improvement
```

### Agent Role Distribution

The main agent handles most development tasks directly, invoking only the reviewer for quality assurance:

**Main Agent Responsibilities (Direct Execution)**:
- **Research** - Investigates technologies and best practices
- **Design** - Creates and iterates on technical designs
- **Testing** - Creates comprehensive test suites
- **Programming** - Implements solutions and applies review feedback

**Specialist Agent (Task Tool Invocation)**:
- **shirokuma-reviewer** - Reviews code quality and security (invoked via Task after GREEN)

**Critical: Reviewer Invocation Pattern**
```yaml
After GREEN Phase Completion:
  Tool: Task
  Parameters:
    - subagent_type: shirokuma-reviewer
    - prompt: |
        Review the implementation from [handover-id].
        Check: quality, security, performance, TDD compliance.
        Create handover with decision: APPROVED or NEEDS_REFACTOR.
    - context:
        phase: REVIEW
        iteration: [current-iteration]

Review Decision Handling:
  If status is NEEDS_REFACTOR and iteration < 3:
    - Main agent applies refactoring directly
    - Apply improvements from review
    - Return to review phase
  If status is APPROVED or iteration >= 3:
    - Complete the task
```

The main agent handles all development directly, only invoking the reviewer via Task tool for quality assurance.

### Autonomous Workflow Orchestration

The system orchestrates everything automatically:

```yaml
Autonomous Flow with Mandatory Review:
1. Analyze input and understand requirements
2. Check existing work to avoid duplication
3. Execute complete TDD cycle:
   
   Design Phase (Max 3 iterations):
   - Create design → Review → Improve → Stop at success or limit
   
   RED Phase:
   - Write failing tests → Verify they fail correctly
   
   GREEN Phase:
   - Minimal implementation → Tests pass → Create handover
   
   REVIEW Phase (MANDATORY after GREEN):
   - Invoke reviewer via Task tool
   - Check quality gates (80% quality, 0 security issues)
   - Get decision: APPROVED or NEEDS_REFACTOR
   
   REFACTOR Phase (Conditional, Max 3 iterations):
   - Only if NEEDS_REFACTOR
   - Apply reviewer suggestions
   - Return to REVIEW phase
   
4. Update all tracking automatically
5. Only escalate if truly stuck after multiple attempts
```

**Key Features**:
- No user interaction during execution
- Automatic retry with improvements
- Self-correcting based on review feedback
- Maximum 3 iterations per phase (design/implementation)
- Clear completion after task success or iteration limit

### Critical Changes Requiring User Approval

The following changes require explicit user confirmation:
1. **Database schema modifications** - Altering tables or migrations
2. **External API integrations** - Adding new third-party services
3. **Security-critical code** - Authentication, authorization, encryption
4. **Breaking changes** - API changes, data format modifications
5. **Destructive operations** - Data deletion, irreversible changes

### MCP Data Flow

```mermaid
graph TB
    A[Issue/Request] --> B[Main agent designs]
    B --> C{decisions-XX}
    
    C --> D[Design Review Loop]
    D --> |Improvements| B
    D --> |Approved| E[RED: Test Phase]
    
    E --> G[Main agent tests]
    G --> I{test_results-XX}
    I --> TR[TEST REVIEW Phase]
    TR --> TV[@agent-shirokuma-reviewer via Task]
    TV --> TD{Test Quality OK?}
    TD --> |Needs Improvement| G
    TD --> |Approved| F[GREEN: Implementation]
    
    F --> H[Main agent]
    H --> K{knowledge-XX}
    K --> |Tests Pass| L{handover-XX}
    
    L --> M[REVIEW: Quality Check]
    M --> N[@agent-shirokuma-reviewer via Task]
    N --> O{Review Decision}
    
    O --> |APPROVED| R[Complete]
    O --> |NEEDS_REFACTOR| P[REFACTOR Phase]
    O --> |Max Iterations| R
    
    P --> Q[Main agent]
    Q --> |Improvements Applied| M
    Q --> |Iteration < 3| L
```

All loops execute automatically without user intervention.

### Quality Gates

**Mandatory Quality Checks** (Cannot Skip):
```yaml
Quality Gate Requirements:
1. Build Verification:
   - Must pass: npm run build
   - Zero errors allowed
   - Auto-fix attempts: 3
   
2. Test Verification:
   - Must pass: npm test
   - No new failures allowed
   - Coverage threshold: Configurable (default 80%)
   
3. Lint Check:
   - Must pass: npm run lint:errors
   - Maximum 10 errors (configurable)
   - Auto-fix with eslint --fix
   
4. Code Review:
   - Automatic review by @agent-shirokuma-reviewer
   - Maximum 3 fix iterations
   - Must address all critical issues

Gate Failure Handling:
- Attempt auto-fix (up to 3 times)
- If still failing → Rollback to checkpoint
- Report specific issues to user
- Never commit broken code
```

### Error Handling and Recovery

The system handles all errors with checkpoint-based recovery:

```yaml
Enhanced Error Recovery with Checkpoints:
1. Checkpoint Management:
   - Create before each phase
   - Save git state (stash or commit)
   - Record MCP session state
   - Enable rollback on failure

2. Recovery Strategy (Max 2 retries):
   - Agent failure → Rollback, retry with different approach
   - Review rejection → Apply feedback from checkpoint
   - Test failure → Fix from last good state
   - Design issues → Iterate within limits
   - Critical failure → Full rollback to initial checkpoint

3. Partial Success Handling:
   - Save successful components
   - Retry only failed parts
   - Combine results after recovery
   - Report partial completion if needed

4. Session Continuity:
   - Save work session to MCP
   - Automatically detect and resume interrupted work
   - Restore from checkpoint
   - Continue from last successful phase

User Escalation (After Recovery Attempts):
- Show checkpoint history
- Explain recovery attempts
- Offer rollback options
- Provide manual fix instructions
```

### Examples

```bash
# Maintenance tasks
/kuma:go "update dependencies"
# → Updates npm packages, runs tests, updates lock files

/kuma:go "fix eslint warnings"
# → Fixes linting issues, ensures code quality

/kuma:go "add tests for utils module"
# → Identifies untested code, writes test cases

# Documentation tasks
/kuma:go "update README with new API endpoints"
# → Updates documentation with latest changes

/kuma:go "add JSDoc comments to public methods"
# → Adds missing documentation

# Refactoring tasks
/kuma:go "refactor authentication module"
# → Improves code structure without changing behavior

# Configuration tasks
/kuma:go "update TypeScript config for stricter checks"
# → Updates tsconfig.json, fixes any new errors
```

### Complete Task Example

```bash
# Example: Update dependencies
/kuma:go "update all dependencies to latest versions"

# Execution flow:
1. Check current dependency versions
2. Identify outdated packages
3. Update package.json
4. Run npm install
5. Run tests to verify nothing broke
6. Fix any breaking changes
7. Update documentation if needed
8. Commit changes
```

**When to use /kuma:go vs other commands**:
- **Use /kuma:go for**: Maintenance, refactoring, testing, docs, config
- **Use /kuma:design for**: New features requiring design
- **Use /kuma:code for**: Implementing approved designs


### Integration Points

- **Main agent**: Handles all general tasks directly
- **shirokuma-reviewer**: May be invoked for code review if needed
- **/kuma:design**: Redirect users for new feature design
- **/kuma:code**: Redirect users for implementing designs

### Success Criteria

1. **Task completion** without unnecessary complexity
2. **Clear scope** - knows when to redirect to /kuma:design or /kuma:code
3. **Quality maintenance** - ensures tests pass, linting clean
4. **Documentation** - updates docs when relevant
5. **User clarity** - clear about what was done

This command handles routine development tasks that don't require formal design or new feature implementation.

## Implementation Guidelines

### Core Implementation Principles

1. **Task-Focused Execution**
   - Complete specific task given
   - Don't expand scope unnecessarily
   - Redirect to appropriate command if needed

2. **Quality Maintenance**
   ```
   # For any code changes:
   1. Make the change
   2. Run tests to verify
   3. Fix any linting issues
   4. Commit with clear message
   ```

3. **Refactoring Approach**
   ```
   # When refactoring:
   1. Ensure tests exist first
   2. Make incremental changes
   3. Verify tests after each change
   4. Keep commits atomic
   ```

4. **Bug Fix Approach**
   ```
   # When fixing small bugs:
   1. Identify the issue
   2. Write test if possible
   3. Apply minimal fix
   4. Verify all tests pass
   ```

5. **Error Recovery**
   - Try to fix issues encountered
   - Maximum 2 retry attempts
   - Report clearly if blocked

### Task Completion Behavior

**After completing the specified task:**
1. Display clear completion message
2. Show what was accomplished
3. Update issue status to 'Review' (requires user approval for closure)
4. STOP - Do not continue to other tasks
5. Wait for new user instructions

**Completion Message Format:**
```
✅ Task Complete: [issue-id or description]

Accomplished:
- [List of completed items]

Status: Task successfully completed in [X] iterations
```

### Handling No Parameters

When `/kuma:go` is called without parameters:
```
Usage: /kuma:go [issue-id or task description]

Examples for general tasks:
- /kuma:go "update dependencies"
- /kuma:go "fix eslint warnings"
- /kuma:go "add missing tests"
- /kuma:go "update README"

For new features: use /kuma:design
For implementing designs: use /kuma:code
To see available issues: use /kuma:issue
```

### Zero Configuration Philosophy

**No options. No flags. Just intelligence.**

The /kuma:go command automatically determines the best approach based on:
- Task type and complexity
- Current codebase state
- Historical patterns
- Risk assessment

Everything that was previously an option is now intelligently decided:

```yaml
Automatic Decisions:
1. Task Type Detection:
   - Maintenance tasks → Direct execution
   - New features → Redirect to /kuma:design
   - Large refactoring → Suggest breaking down
   - Documentation → Fast execution

2. Quality Checks:
   - Always run tests after changes
   - Fix linting issues automatically
   - Verify build succeeds

3. Scope Management:
   - Small tasks → Execute directly
   - Large scope → Suggest using /kuma:design
   - Multiple tasks → Focus on one at a time

4. Error Handling:
   - Test failures → Attempt to fix
   - Lint errors → Auto-fix with eslint
   - Build errors → Diagnose and fix
```

### Task Routing Logic

```yaml
Task Routing Logic:
  1. Analyze Input:
     - Parse and understand task requirements
     - Determine task type and scope
  
  2. Route Based on Type:
     If new feature or needs design:
       - Suggest: "This needs design. Use /kuma:design first"
       - Exit workflow
     
     If has approved design:
       - Suggest: "Use /kuma:code to implement this design"
       - Exit workflow
     
     Otherwise:
       - Execute general task directly
       - Follow appropriate workflow for task type
```

## When to Use This Command

**✅ Use /kuma:go for:**
- Updating dependencies
- Fixing linting/formatting issues
- Adding missing tests
- Small bug fixes (no design needed)
- Refactoring existing code
- Updating documentation
- Configuration changes
- Build/deployment tasks

**❌ Don't use /kuma:go for:**
- New features (use `/kuma:design`)
- Implementing designs (use `/kuma:code`)
- Large architectural changes (use `/kuma:design`)
- Complex bug fixes requiring design (use `/kuma:design`)

## Summary

The `/kuma:go` command is your general-purpose task executor for routine development work that doesn't require formal design or new feature implementation. It intelligently routes you to the appropriate specialized commands when needed.

