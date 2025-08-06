# ai-go - Autonomous Development Orchestrator

## Usage
```
/ai-go [issue-id or instruction]
```

Examples:
- `/ai-go issues-123` - Autonomously work on issue until completion
- `/ai-go "implement authentication"` - Design and implement the feature
- `/ai-go "React state management"` - Research and document the topic

## Task

@.claude/agents/LANG.markdown

Execute development workflow autonomously, solving problems independently until completion. Only escalate to user when truly stuck.

### Core Philosophy: Autonomous Problem Solving

**Key Principles**:
1. **AI solves problems independently** - No user interaction unless absolutely necessary
2. **Continuous improvement loop** - Design → Review → Improve until optimal
3. **Self-healing workflow** - Automatically retry and fix issues
4. **User-controlled autonomy** - Bounded iteration with clear completion

### Iteration Limits for Bounded Autonomy

**MAX_ITERATIONS = 3 per phase**
- Design phase: Maximum 3 review-improve cycles
- Implementation phase: Maximum 3 review-fix cycles
- Error recovery: Maximum 2 retries per error type with checkpoint recovery
- Clear completion after task success or iteration limit
- Automatic checkpoint creation before each major phase
- Rollback capability on critical failures

### Pre-flight Check Phase

**Environment Health Verification** (Before Starting Work):
```yaml
Pre-flight Checks:
1. Build Status Check:
   - Run: npm run build
   - Threshold: 0 errors allowed
   - Action: If errors > threshold → Show issues and ask user to proceed/abort

2. Test Status Check:
   - Run: npm test
   - Record: Baseline failure count
   - Action: If failures > 5 → Warn user about existing issues

3. Lint Status Check:
   - Run: npm run lint:errors
   - Threshold: 10 errors (configurable)
   - Action: If errors > threshold → Suggest fixing first

4. Checkpoint Creation:
   - Git status capture
   - Create recovery checkpoint
   - Save session state to MCP
   
5. User Decision Point:
   - Show health report
   - If issues found → "Continue anyway? (y/n)"
   - User can abort to fix issues first
```

### Automatic Workflow Detection

The system automatically analyzes input and executes the complete workflow:

#### For Issues (e.g., `issues-123`):
1. **Fetch issue details** from MCP
2. **Analyze and plan** optimal approach
3. **Execute autonomous workflow**:
   - Research (if needed)
   - Design with built-in review cycles
   - Implementation
   - Code review
   - Testing
   - Automatic fixes for any issues found
4. **Continue until success** or truly unsolvable problem

#### For Instructions (e.g., `"implement authentication"`):
1. **Parse and understand** the request
2. **Create tracking issue** automatically
3. **Execute full workflow** with autonomous decision-making

### Autonomous Execution Flow

The system executes all tasks autonomously with built-in quality assurance:

#### 1. Design Phase with Auto-Review
```yaml
Design Loop (Bounded):
1. @agent-shirokuma-designer creates initial design
2. Automatic design review by @agent-shirokuma-reviewer
3. If review finds issues AND iterations < 3:
   - Generate specific improvement suggestions
   - @agent-shirokuma-designer automatically applies improvements
   - Increment iteration counter
   - Return to step 2
4. Stop after: design approved OR 3 iterations reached
5. Report outcome clearly to user
```

#### 2. Implementation Phase (Parallel Execution)
```yaml
Parallel Implementation with Synchronization:
1. Load shared design document (MCP decisions-XX)
2. Start parallel execution:
   
   Promise.allSettled([
     @agent-shirokuma-programmer: {
       - Load design from decisions-XX
       - Implement solution
       - Handle partial failures
       - Save progress to knowledge-XX
     },
     @agent-shirokuma-tester: {
       - Load same design document
       - Create comprehensive tests
       - Generate test scenarios
       - Save to test-results-XX
     }
   ])
   
3. Synchronization and Error Handling:
   - Both succeed → Continue to review
   - @agent-shirokuma-programmer fails, @agent-shirokuma-tester succeeds → Save tests, retry implementation
   - @agent-shirokuma-programmer succeeds, @agent-shirokuma-tester fails → Save code, generate basic tests
   - Both fail → Review design, consider rollback
   
4. Timeout: 30 minutes with AbortController
5. Progress tracking via MCP handovers
```

#### 3. Code Review with Auto-Fix
```yaml
Review Loop (Bounded):
1. @agent-shirokuma-reviewer examines implementation and tests
2. If issues found AND iterations < 3:
   - Generate specific fix instructions
   - @agent-shirokuma-programmer/@agent-shirokuma-tester automatically apply fixes
   - Increment iteration counter
   - Return to step 1
3. Stop after: quality met OR 3 iterations reached
4. Report final status to user
```

### Specialist Agents

The system coordinates these specialists autonomously:

1. **shirokuma-researcher** - Investigates technologies and best practices
2. **shirokuma-designer** - Creates and iterates on technical designs
3. **shirokuma-reviewer** - Reviews designs and code, suggests improvements
4. **shirokuma-programmer** - Implements solutions based on designs
5. **shirokuma-tester** - Creates comprehensive test suites

All agents work together seamlessly without user coordination.

### Autonomous Workflow Orchestration

The system orchestrates everything automatically:

```yaml
Autonomous Flow:
1. Analyze input and understand requirements
2. Check existing work to avoid duplication
3. Execute iterative development:
   
   Design Phase (Max 3 iterations):
   - Create design → Review → Improve → Stop at success or limit
   
   Implementation Phase (Max 3 iterations):
   - Implement + Test (parallel) → Review → Fix → Stop at success or limit
   
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
    A[Issue/Request] --> B[@agent-shirokuma-designer]
    B --> C{decisions-XX}
    
    C --> D[Design Review Loop]
    D --> |Improvements| B
    D --> |Approved| E[Implementation]
    
    E --> F[@agent-shirokuma-programmer]
    E --> G[@agent-shirokuma-tester]
    
    F --> H{knowledge-XX}
    G --> I{test-results-XX}
    
    H --> J[Code Review Loop]
    I --> J
    
    J --> |Auto-Fix| F
    J --> |Auto-Fix| G
    J --> |Success| K[Complete]
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
   - Enable resume with: /ai-go --resume [session-id]
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
# Simple usage - AI handles everything
/ai-go issues-123
# → AI analyzes, designs, reviews, improves, implements, tests, and completes autonomously

/ai-go "implement user authentication"
# → AI creates issue, researches best practices, iterates on design, implements with tests

/ai-go "fix the login button alignment"
# → AI identifies the issue, implements fix, verifies it works
```

**Remember**: The AI will work autonomously, iterating as many times as needed to achieve quality results. User intervention is only requested when absolutely necessary.


### Integration Points

- **issue-manager**: Tracks progress automatically
- **mcp-specialist**: Stores all artifacts and decisions
- **methodology-keeper**: Ensures quality standards
- **All agents**: Coordinate autonomously without user input

### Success Criteria

1. **Zero user interaction** during normal execution
2. **Automatic quality improvement** through iteration
3. **Self-healing workflows** that fix their own issues
4. **Complete documentation** of all decisions and changes
5. **Only escalate** when truly stuck

This command transforms AI from an assistant into an autonomous developer that takes ownership of tasks and delivers complete solutions.

## Implementation Guidelines

### Core Implementation Principles

1. **Autonomous by Default**
   - All decisions made by AI
   - No options or flags needed
   - Iterate until success

2. **Design Review Loop (Bounded)**
   ```
   iterations = 0
   while iterations < 3:
     design = create_design()
     feedback = review_design(design)
     if feedback.has_improvements:
       apply_improvements(feedback)
       iterations += 1
     else:
       break
   report_completion(design, iterations)
   ```

3. **Code Review Loop (Bounded)**
   ```
   iterations = 0
   while iterations < 3:
     code = implement_solution()
     tests = create_tests()  # Note: Shares iteration counter in parallel
     feedback = review_all(code, tests)
     if feedback.has_issues:
       apply_fixes(feedback)
       iterations += 1
     else:
       break
   report_completion(code, tests, iterations)
   ```

4. **Error Recovery**
   - Never give up on first failure
   - Try different approaches (max 2 retries)
   - Learn from each attempt
   - Stop gracefully after retry limit

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

When `/ai-go` is called without parameters:
```
Usage: /ai-go [issue-id or instruction]

Examples:
- /ai-go issues-123
- /ai-go "implement authentication"

To see available issues, use: /ai-issue
```

### Zero Configuration Philosophy

**No options. No flags. Just intelligence.**

The ai-go command automatically determines the best approach based on:
- Task type and complexity
- Current codebase state
- Historical patterns
- Risk assessment

Everything that was previously an option is now intelligently decided:

```yaml
Automatic Decisions:
1. Strategy Selection:
   - Bug fixes → Careful mode with comprehensive testing
   - New features → Balanced approach with design focus
   - Documentation → Fast mode with minimal overhead
   - Refactoring → Safe mode with extensive validation

2. Pre-flight Handling:
   - Few errors (<5) → Auto-fix and continue
   - Many errors → Fix critical ones first
   - Critical errors → Request user confirmation

3. Checkpoint Management:
   - Always creates safe checkpoints
   - Automatic rollback on failure
   - Smart recovery from interruptions

4. Session Continuity:
   - Detects interrupted tasks automatically
   - Resumes from last known good state
   - No manual session ID needed

5. Risk Assessment:
   - Security changes → Extra validation
   - Large changes (>20 files) → Phased approach
   - Breaking changes → User confirmation required
```

### How It Works

```typescript
// Internal logic (not user-visible)
function executeTask(input: string) {
  const task = analyzeTask(input);
  const strategy = determineOptimalStrategy(task);
  const risks = assessRisks(task);
  
  // All decisions made automatically
  if (hasInterruptedSession(task)) {
    resumeFromCheckpoint();
  }
  
  if (needsPreflightFix()) {
    autoFixCriticalIssues();
  }
  
  // Execute with optimal settings
  runWithStrategy(strategy);
}
```

**The AI handles everything. You just specify what you want done.**

