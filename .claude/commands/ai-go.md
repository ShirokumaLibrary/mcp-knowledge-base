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

#### Task Type Detection and Workflow Selection

**Automatic Task Type Detection**:
```yaml
Task Type Analysis:
1. File Extension Detection:
   - .md, .txt, .mdx → Documentation workflow
   - .ts, .js, .py, .java → Code workflow (TDD)
   - .json, .yaml, .toml → Configuration workflow
   
2. Keyword Analysis (in issue/instruction):
   - "document", "README", "specification" → Documentation
   - "implement", "fix", "refactor", "bug" → Code (TDD)
   - "research", "investigate", "explore" → Research
   - "configure", "setup", "settings" → Configuration
   
3. MCP Issue Tag Analysis:
   - #documentation → Documentation workflow
   - #bug, #feature → Code workflow (TDD)
   - #research → Research workflow
   - #config → Configuration workflow

4. Confidence Scoring:
   - High (80%+): Proceed with detected workflow
   - Medium (60-79%): Confirm detection with user
   - Low (<60%): Default to TDD workflow
```

**Workflow Selection Logic**:
```yaml
if task_type == "documentation":
  execute DocumentationWorkflow:
    1. Design: Structure and outline creation
    2. Draft: Content writing by knowledge-curator
    3. Review: Content accuracy and clarity check
    4. Polish: Final improvements and formatting
    
elif task_type == "configuration":
  execute ConfigurationWorkflow:
    1. Analyze: Current configuration review
    2. Plan: Changes needed
    3. Apply: Make configuration changes
    4. Validate: Test configuration works
    
elif task_type == "research":
  execute ResearchWorkflow:
    1. Investigate: Gather information
    2. Analyze: Evaluate findings
    3. Synthesize: Create recommendations
    4. Document: Record in knowledge base
    
else:  # Default to code/TDD workflow
  execute TDDWorkflow  # Existing TDD cycle
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
   @agent-shirokuma-designer:
     - Analyze documentation requirements
     - Create structure and sections
     - Define key topics to cover
     - Save outline to decisions-XX

2. Draft Phase:
   @agent-shirokuma-knowledge-curator:
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
   @agent-shirokuma-knowledge-curator:
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

#### 1. Design Phase with Auto-Review (for Code/TDD Workflow)
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

#### 2. TDD Implementation Phase (Kent Beck Methodology with Review)
```yaml
Complete TDD Cycle - Red → Green → Review → Refactor (conditional):

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
     - Create handover with expected behavior (tester → reviewer)

3. TEST REVIEW Phase (Test Quality Assurance) - MAX 3 iterations:
   Task Tool Invocation (by main agent):
   ```yaml
   await Task({
     subagent_type: "shirokuma-reviewer",
     prompt: `Review the test quality from handover-XX.
       
       Required checks:
       1. Test coverage adequacy (edge cases, error conditions)
       2. Test clarity and maintainability
       3. Correct failure reasons (failing for the right reason)
       4. Test independence and isolation
       5. Proper test naming and structure
       
       Quality criteria:
       - Tests must be comprehensive
       - Tests must be readable and maintainable
       - Tests must follow TDD principles
       
       Create handover with:
       - Review findings
       - Coverage assessment
       - Decision: APPROVED or NEEDS_IMPROVEMENT
       
       Iteration: {current} of 3 maximum`,
     context: {
       phase: "TEST_REVIEW",
       handover_id: "handover-XX",
       iteration: current_iteration
     }
   })
   ```
   
   Test Review Decision Logic:
   - If test quality sufficient: → APPROVED → Proceed to GREEN Phase
   - If improvements needed AND iteration < 3: → NEEDS_IMPROVEMENT → Tester refines tests
   - If iteration == 3: → PROCEED_WITH_WARNINGS → Continue with current tests

4. GREEN Phase (Minimal Implementation):
   @agent-shirokuma-programmer:
     - Write ONLY code to make test pass
     - No extra features or optimizations
     - Focus: Make it work, not perfect
     - Verify all tests pass
     - Create handover for review (programmer → reviewer)

4. REVIEW Phase (Quality Assurance) - MAX 3 iterations:
   Task Tool Invocation (by main agent):
   ```yaml
   await Task({
     subagent_type: "shirokuma-reviewer",
     prompt: `Review the implementation from handover-XX.
       
       Required checks:
       1. Code quality assessment (maintainability, readability)
       2. Security vulnerability scan
       3. Performance analysis
       4. TDD compliance verification
       
       Quality gates:
       - Code quality score must be >= 80%
       - Security issues must be 0
       - All tests must pass
       
       Create handover with:
       - Review findings
       - Quality metrics
       - Decision: APPROVED or NEEDS_REFACTOR
       
       Iteration: {current} of 3 maximum`,
     context: {
       phase: "REVIEW",
       handover_id: "handover-XX",
       iteration: current_iteration,
       quality_threshold: 80
     }
   })
   ```
   
   Review Decision Logic:
   - If quality >= 80% AND security_issues == 0: → APPROVED → Complete
   - If issues found AND iteration < 3: → NEEDS_REFACTOR → Refactor Phase
   - If iteration == 3: → PARTIAL_SUCCESS → Complete with warnings

5. REFACTOR Phase (Conditional) - Only if review requires changes:
   Task Tool Invocation (when NEEDS_REFACTOR):
   ```yaml
   await Task({
     subagent_type: "shirokuma-programmer",
     prompt: `Apply improvements from review handover-XX.
       
       Priority order:
       1. Fix security vulnerabilities (critical)
       2. Improve code quality issues
       3. Optimize performance bottlenecks
       
       Requirements:
       - Keep all tests passing (GREEN state)
       - Follow "Tidy First" principle
       - Separate structural and behavioral changes
       
       Create handover when complete`,
     context: {
       phase: "REFACTOR",
       review_handover_id: "handover-XX",
       iteration: current_iteration
     }
   })
   ```
   
   After refactoring: Return to Review Phase (iteration + 1)

6. Verification:
   - Each phase must complete before next
   - Tests must pass after EVERY change
   - Quality gates enforced at review
   - Maximum 3 iterations for review-refactor cycle
```

#### 3. Review Phase with Task Tool (After GREEN)
```yaml
Review Phase Execution (Bounded to 3 iterations):

1. Main agent invokes reviewer via Task tool:
   Task({
     tool: "agent",
     subagent_type: "shirokuma-reviewer",
     prompt: "Review implementation and create handover with findings"
   })

2. @agent-shirokuma-reviewer performs:
   - Code quality assessment (score 0-100)
   - Security vulnerability scan (critical/high/medium/low)
   - Performance analysis (bottlenecks, memory leaks)
   - TDD compliance check (test coverage, quality)

3. Reviewer creates handover with decision:
   - APPROVED: Quality >= 80%, no security issues
   - NEEDS_REFACTOR: Issues found, improvements needed
   - PARTIAL_SUCCESS: Max iterations reached

4. Quality Gates (enforced):
   - Code quality score >= 80%
   - Security vulnerabilities = 0
   - Test coverage maintained
   - Performance acceptable

5. Iteration Control:
   - Maximum 3 review-refactor cycles
   - Each iteration tracked in handovers
   - Stop at approval or iteration limit
```

#### 4. Refactor Phase with Task Tool (Conditional)
```yaml
Refactor Phase Execution (Only when NEEDS_REFACTOR):

1. Main agent invokes programmer for fixes:
   Task({
     tool: "agent",
     subagent_type: "shirokuma-programmer",
     prompt: "Apply review feedback from handover-XX"
   })

2. @agent-shirokuma-programmer applies improvements:
   Priority 1: Security fixes (must fix all)
   Priority 2: Code quality improvements
   Priority 3: Performance optimizations

3. Tidy First Principle:
   - Commit 1: Structural changes (renaming, reorganizing)
   - Commit 2: Behavioral improvements (logic, optimization)
   - Never mix change types in same commit

4. Validation after refactoring:
   - All tests must still pass
   - No regression in functionality
   - Improvements documented in handover

5. Return to Review Phase:
   - Increment iteration counter
   - Create new handover for re-review
   - Continue until approved or max iterations
```

### Specialist Agents and Task Tool Usage

The system coordinates these specialists autonomously using the Task tool:

1. **shirokuma-researcher** - Investigates technologies and best practices
2. **shirokuma-designer** - Creates and iterates on technical designs
3. **shirokuma-reviewer** - Reviews code quality and security (invoked via Task after GREEN)
4. **shirokuma-programmer** - Implements solutions and applies review feedback
5. **shirokuma-tester** - Creates comprehensive test suites

**Critical: Reviewer Invocation Pattern**
```typescript
// After GREEN phase completion, ALWAYS invoke reviewer:
const reviewResult = await Task({
  subagent_type: "shirokuma-reviewer",
  prompt: `Review the implementation from ${handoverId}.
    Check: quality, security, performance, TDD compliance.
    Create handover with decision: APPROVED or NEEDS_REFACTOR.`,
  context: { phase: "REVIEW", iteration: currentIteration }
});

// Handle review decision:
if (reviewResult.status === "NEEDS_REFACTOR" && iteration < 3) {
  // Invoke programmer for refactoring
  await Task({
    subagent_type: "shirokuma-programmer",
    prompt: `Apply improvements from review ${reviewHandoverId}`,
    context: { phase: "REFACTOR" }
  });
  // Return to review phase
}
```

All agents work together seamlessly through Task tool coordination.

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
    A[Issue/Request] --> B[@agent-shirokuma-designer]
    B --> C{decisions-XX}
    
    C --> D[Design Review Loop]
    D --> |Improvements| B
    D --> |Approved| E[RED: Test Phase]
    
    E --> G[@agent-shirokuma-tester]
    G --> I{test_results-XX}
    I --> TR[TEST REVIEW Phase]
    TR --> TV[@agent-shirokuma-reviewer via Task]
    TV --> TD{Test Quality OK?}
    TD --> |Needs Improvement| G
    TD --> |Approved| F[GREEN: Implementation]
    
    F --> H[@agent-shirokuma-programmer]
    H --> K{knowledge-XX}
    K --> |Tests Pass| L{handover-XX}
    
    L --> M[REVIEW: Quality Check]
    M --> N[@agent-shirokuma-reviewer via Task]
    N --> O{Review Decision}
    
    O --> |APPROVED| R[Complete]
    O --> |NEEDS_REFACTOR| P[REFACTOR Phase]
    O --> |Max Iterations| R
    
    P --> Q[@agent-shirokuma-programmer via Task]
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
# Simple usage - AI handles everything
/ai-go issues-123
# → AI analyzes, designs, reviews, improves, implements, tests, and completes autonomously

/ai-go "implement user authentication"
# → AI creates issue, researches best practices, iterates on design, implements with tests

/ai-go "fix the login button alignment"
# → AI identifies the issue, implements fix, verifies it works
```

### Complete TDD Example Flow with Review

```typescript
// Example: Adding user validation with full TDD cycle

// 1. RED Phase - Start with failing test (@agent-shirokuma-tester)
test('should reject invalid email', () => {
  const result = validateUser({ email: 'invalid' });
  expect(result.isValid).toBe(false);
});
// → Test fails: validateUser is not defined
// → Creates test_results-XX and handover to programmer

// 2. GREEN Phase - Minimal implementation (@agent-shirokuma-programmer)
function validateUser(user) {
  return { isValid: false }; // Simplest code to pass
}
// → Test passes
// → Creates knowledge-XX and handover to reviewer

// 3. REVIEW Phase - Quality check (main agent invokes via Task)
await Task({
  tool: "agent",
  subagent_type: "shirokuma-reviewer",
  prompt: "Review validateUser implementation from handover-XX"
});
// → Reviewer finds: no type safety, no actual validation
// → Creates handover with NEEDS_REFACTOR status

// 4. REFACTOR Phase - Apply improvements (@agent-shirokuma-programmer via Task)
await Task({
  tool: "agent",
  subagent_type: "shirokuma-programmer", 
  prompt: "Apply type safety and validation logic from review"
});
// Result after refactoring:
function validateUser(user: User): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return { isValid: emailRegex.test(user.email) };
}
// → Tests still pass, quality improved

// 5. RE-REVIEW Phase - Verify improvements
await Task({
  tool: "agent",
  subagent_type: "shirokuma-reviewer",
  prompt: "Re-review validateUser after refactoring"
});
// → Quality score: 85%, Security: OK
// → Status: APPROVED
// → Complete!
```

**Critical Points**:
- Main agent MUST invoke reviewer via Task after GREEN
- Refactor only happens if review finds issues
- Maximum 3 review-refactor iterations
- Quality gates enforced: 80% quality, 0 security issues


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

