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

@.shirokuma/configs/lang.md

Execute development workflow autonomously, solving problems independently until completion. Only escalate to user when truly stuck.

### Core Philosophy: TDD & Tidy First (Kent Beck Methodology)

**Key Principles**:
1. **TDD Cycle (Red → Green → Refactor)** - Always start with failing tests, write minimal code to pass, then refactor
2. **Tidy First Separation** - Never mix structural changes with behavioral changes in same commit
3. **Problem Discovery First** - Identify root cause and multiple solutions before solving
4. **Minimal Implementation** - Write only the code needed to make tests pass
5. **Autonomous Execution** - AI handles the entire cycle without user intervention

### TDD Methodology (Kent Beck Approach)

**Red → Green → Refactor Cycle**:
1. **RED Phase**: Write the smallest possible failing test
   - Start with the simplest test case
   - Use meaningful test names (e.g., "shouldAuthenticateValidUser")
   - Ensure test fails for the right reason (not compilation/syntax errors)
   
2. **GREEN Phase**: Write minimal code to make test pass
   - Implement only what's needed to pass the test
   - Don't add extra functionality
   - Focus on making it work, not making it perfect
   
3. **REFACTOR Phase**: Improve code without changing behavior
   - Clean up duplication
   - Improve naming and structure
   - Ensure all tests still pass

### Tidy First Principle

**Separation of Changes**:
```yaml
Structural Changes (Tidy):
  - Rename variables/functions
  - Extract methods
  - Move code between files
  - Database migrations
  - Configuration updates
  → Commit separately, verify tests still pass

Behavioral Changes:
  - Add new features
  - Fix bugs
  - Change business logic
  - Modify API responses
  → Always preceded by failing test
```

**Rule**: If both are needed, ALWAYS do structural changes first in a separate commit.

### Problem Discovery Priority

**Before solving any problem**:
1. **Identify Root Cause** - Don't fix symptoms
2. **Generate Multiple Solutions** - At least 2-3 approaches
3. **Evaluate Trade-offs** - Consider impact and risks
4. **Choose Minimal Solution** - Start with simplest approach
5. **Validate with Tests** - Prove the problem exists and is fixed

### Iteration Limits for Bounded Autonomy

**MAX_ITERATIONS = 3 per phase**
- Design phase: Maximum 3 review-improve cycles
- Test phase: Tests must fail first (RED state verification)
- Implementation phase: Maximum 3 attempts to achieve GREEN state
- Refactor phase: Maximum 3 improvement cycles
- Error recovery: Maximum 2 retries per error type with checkpoint recovery
- Clear completion after task success or iteration limit
- Automatic checkpoint creation before each major phase
- Rollback capability on critical failures

### Pre-flight Check Phase

**Smart Environment Health Verification** (Before Starting Work):

The Pre-flight Check logic has been extracted to a reusable script for better maintainability:

```bash
# Execute pre-flight checks using the external script
# This script handles all validation: build, test, lint, and checkpoint creation
.shirokuma/scripts/preflight-check.sh

# Exit codes:
# 0 - All checks passed
# 1 - Build check failed
# 2 - Test check failed
# 3 - Lint check failed
# 4 - Checks skipped (markdown-only changes)
# 5 - Critical failure requiring user decision
# 6 - Configuration error
# 7 - Checkpoint creation failed

# The script automatically determines:
# - Whether to run full checks or skip for markdown-only changes
# - Whether to run checks in parallel for speed
# - The appropriate debug level based on context
# - Which checks are critical vs optional
```

**Pre-flight Check Features**:
1. **Smart Change Detection**: Automatically detects markdown-only changes and skips unnecessary checks
2. **Build Validation**: Ensures the project builds successfully (timeout: 180s)
3. **Test Validation**: Runs test suite and checks for failures (timeout: 300s)
4. **Lint Validation**: Checks for lint errors (timeout: 60s)
5. **Checkpoint Creation**: Creates a recovery checkpoint before proceeding
6. **Parallel Execution**: Optional parallel mode for faster checks
7. **Debug Mode**: Detailed output for troubleshooting

**User Decision Points**:
- If critical errors are found, the script will prompt for user confirmation
- Exit code 5 indicates user decision is required
- The script provides clear feedback about what failed and why

### Automatic Workflow Detection

The system automatically analyzes input and executes the complete workflow:

#### For Issues (e.g., `issues-123`):
1. **Fetch issue details** from MCP
2. **Analyze and plan** optimal approach
3. **Execute TDD workflow (Kent Beck methodology)**:
   - Problem discovery and root cause analysis
   - Design with multiple solution options
   - RED: Write failing tests first
   - GREEN: Minimal implementation to pass tests
   - REFACTOR: Tidy first, then improve
   - Code review with focus on separation of concerns
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

#### 2. TDD Implementation Phase (Kent Beck Methodology)
```yaml
TDD Cycle - Red → Green → Refactor:

1. Problem Discovery Phase:
   @agent-shirokuma-designer:
     - Identify root cause (not just symptoms)
     - Generate 2-3 solution approaches
     - Document trade-offs in decisions-XX
     - Choose minimal viable solution

2. RED Phase (Test-First):
   @agent-shirokuma-tester:
     - Write smallest possible failing test
     - Use descriptive test names (behavior-focused)
     - Verify test fails for the RIGHT reason
     - Save test specifications to test_results-XX
     - Create handover with expected behavior

3. GREEN Phase (Minimal Implementation):
   @agent-shirokuma-programmer:
     - Write ONLY code to make test pass
     - No extra features or optimizations
     - Focus: Make it work, not perfect
     - Verify all tests pass
     - Create handover for refactoring

4. REFACTOR Phase (Tidy First):
   Step 1 - Structural Changes (if needed):
     - Rename for clarity
     - Extract duplicate code
     - Reorganize file structure
     - Commit separately with "refactor:" prefix
   
   Step 2 - Improvements:
     - Optimize performance
     - Improve code quality
     - Add documentation
     - Ensure tests still pass

5. Verification:
   - Each phase must complete before next
   - Tests must pass after EVERY change
   - Structural and behavioral changes NEVER mixed
```

#### 3. Review and Refactor Phase (REFACTOR)
```yaml
Review and Refactor Loop (Bounded):
1. @agent-shirokuma-reviewer examines implementation and tests:
   - Code quality assessment
   - Design conformance check
   - Security vulnerability scan
   - Performance analysis

2. Refactor Phase (if improvements needed AND iterations < 3):
   @agent-shirokuma-programmer:
     - Apply reviewer's improvement suggestions
     - Refactor without breaking tests
     - Verify tests still pass using project's test command
     - Ensure tests remain in GREEN state
     - Update implementation in knowledge-XX
   
3. Quality Gates:
   - All tests must continue passing
   - Code quality score > 80%
   - No security vulnerabilities
   - Performance benchmarks met

4. Stop after: quality achieved OR 3 iterations reached
5. Report final status and metrics to user
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
# Simple usage - AI handles everything
/ai-go issues-123
# → AI analyzes, designs, reviews, improves, implements, tests, and completes autonomously

/ai-go "implement user authentication"
# → AI creates issue, researches best practices, iterates on design, implements with tests

/ai-go "fix the login button alignment"
# → AI identifies the issue, implements fix, verifies it works
```

### TDD Example Flow (Kent Beck Style)

```typescript
// Example: Adding user validation

// 1. RED Phase - Start with failing test
test('should reject invalid email', () => {
  const result = validateUser({ email: 'invalid' });
  expect(result.isValid).toBe(false);
});
// → Test fails: validateUser is not defined

// 2. GREEN Phase - Minimal implementation
function validateUser(user) {
  return { isValid: false }; // Simplest code to pass
}
// → Test passes

// 3. REFACTOR Phase - Improve without breaking
// First commit (structural):
function validateUser(user: User): ValidationResult {
  return { isValid: false };
}

// Second commit (behavioral):
function validateUser(user: User): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return { isValid: emailRegex.test(user.email) };
}
// → All tests still pass
```

**Remember**: The AI will follow TDD strictly - no code without tests, no mixing of change types.


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

3. **TDD Loop (Kent Beck Style)**
   ```
   iterations = 0
   while iterations < 3:
     # RED: Test first
     test = write_failing_test()
     verify_test_fails_correctly(test)
     
     # GREEN: Minimal implementation
     code = write_minimal_code_to_pass(test)
     verify_all_tests_pass()
     
     # REFACTOR: Tidy first
     if needs_refactoring():
       structural_changes = tidy_code()  # Separate commit
       behavioral_improvements = optimize()  # Separate commit
       verify_all_tests_still_pass()
     
     iterations += 1
   report_completion(test, code, iterations)
   ```

4. **Bug Fix TDD Approach (Kent Beck Method)**
   ```
   # When fixing bugs:
   1. Write API-level test that exposes the bug
   2. Write minimal unit test that reproduces issue
   3. Fix the bug (minimal change)
   4. Verify both tests pass
   5. Refactor if needed (separate commit)
   ```

5. **Error Recovery**
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

