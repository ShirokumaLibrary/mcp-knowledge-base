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
- Error recovery: Maximum 2 retries per error type
- Clear completion after task success or iteration limit

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
1. Designer creates initial design
2. Automatic design review by Reviewer
3. If review finds issues AND iterations < 3:
   - Generate specific improvement suggestions
   - Designer automatically applies improvements
   - Increment iteration counter
   - Return to step 2
4. Stop after: design approved OR 3 iterations reached
5. Report outcome clearly to user
```

#### 2. Implementation Phase
```yaml
Implementation:
1. Programmer implements based on approved design
2. Tester creates comprehensive test suite (parallel)
3. Both work from the same design document
4. Automatic coordination without user input
```

#### 3. Code Review with Auto-Fix
```yaml
Review Loop (Bounded):
1. Reviewer examines implementation and tests
2. If issues found AND iterations < 3:
   - Generate specific fix instructions
   - Programmer/Tester automatically apply fixes
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
    A[Issue/Request] --> B[Designer]
    B --> C{decisions-XX}
    
    C --> D[Design Review Loop]
    D --> |Improvements| B
    D --> |Approved| E[Implementation]
    
    E --> F[Programmer]
    E --> G[Tester]
    
    F --> H{knowledge-XX}
    G --> I{test-results-XX}
    
    H --> J[Code Review Loop]
    I --> J
    
    J --> |Auto-Fix| F
    J --> |Auto-Fix| G
    J --> |Success| K[Complete]
```

All loops execute automatically without user intervention.

### Error Handling

The system handles all errors autonomously:

```yaml
Bounded Error Recovery (Max 2 retries per error):
1. Agent failure → Retry up to 2 times with different approach
2. Review rejection → Apply feedback, retry up to 2 times
3. Test failure → Fix implementation, retry up to 2 times
4. Design issues → Iterate with improvements (within 3-iteration limit)
5. After retry limit → Report status and stop gracefully

Error Resolution Strategy:
- Analyze error root cause
- Generate solution hypothesis
- Apply fix automatically (within retry limit)
- Verify fix worked
- Stop if retry limit reached

User Escalation (Last Resort):
- Clear problem description
- What was tried
- Specific help needed
- Suggested solutions for user to choose
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
3. Update issue status to 'Closed' (if applicable)
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

