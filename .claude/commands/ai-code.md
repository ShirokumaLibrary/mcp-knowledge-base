---
description: Implement code from approved design using TDD methodology
argument-hint: "[design-id | issue-id | feedback 'revision text']"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Task, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, TodoWrite
---

# /ai-code

## Language

@.shirokuma/configs/lang.md

## Project Configuration

@.shirokuma/configs/core.md
@.shirokuma/configs/build.md
@.shirokuma/configs/test.md
@.shirokuma/configs/conventions.md

## TDD Methodology

@.shirokuma/rules/tdd-methodology.md

## Purpose

Implement code from approved technical designs following TDD methodology. This command takes a completed design and produces working, tested code through the RED-GREEN-REFACTOR cycle with automated review.

## Usage

```bash
/ai-code                        # Implement most recent design
/ai-code 42                     # Implement from design-42
/ai-code issue-67               # Find and implement design for issue-67
/ai-code feedback "text"        # Apply feedback to current implementation
/ai-code 42 feedback "text"     # Apply feedback to specific implementation
```

## Prerequisites

- **Design must exist**: Use `/ai-design` first to create design
- **Design should be approved**: Ideally passed review
- **Clear specifications**: Design must have implementation details

## Process Flow

### 1. RED Phase (Test First)
- Extract test cases from design
- Write failing tests
- Verify tests fail for the right reasons

### 2. GREEN Phase (Make It Work)
- Implement minimal code to pass tests
- Focus on functionality, not optimization
- All tests must pass

### 3. REFACTOR Phase (Make It Better)
- Improve code structure
- Remove duplication
- Maintain test coverage

### 4. REVIEW Phase (Quality Check)
- Use @agent-shirokuma-reviewer via Task tool
- Automated code review
- Fix issues if needed (max 3 iterations)

## Implementation Strategy

### Step 1: Argument Parsing & Mode Detection
```python
if no_argument:
    # Find most recent design in current session
    design = get_recent_design()
elif is_number(arg1):
    if arg2 == "feedback" and arg3:
        # Apply feedback to specific implementation
        implementation_id = arg1
        feedback_text = arg3
        mode = "revise"
    else:
        # Implement from specific design
        design = get_design(arg1)
        mode = "implement"
elif arg1 == "feedback" and arg2:
    # Apply feedback to most recent implementation
    feedback_text = arg2
    mode = "revise"
elif is_issue_id(arg1):
    # Find design linked to issue
    design = get_design_for_issue(arg1)
    mode = "implement"
else:
    # Treat as issue description, find or create design
    design = find_or_create_design(arg1)
    mode = "implement"
```

### Step 2: Test Creation (RED)
```python
# Extract test scenarios from design
test_cases = extract_test_cases(design)

# Generate test file
create_test_file(test_cases)

# Run tests to verify they fail
run_tests() # Should fail

# Methodology check: Tests must exist and fail
if tests_pass_unexpectedly:
    # Quick methodology keeper check
    await Task({
        subagent_type: "shirokuma-methodology-keeper",
        prompt: "Tests passing in RED phase. Brief TDD violation warning.",
        description: "TDD compliance"
    })
```

### Step 3: Implementation (GREEN)
```python
# Implement based on design specs
for component in design.components:
    implement_component(component)
    
# Run tests until all pass
while not all_tests_pass():
    fix_failing_tests()
```

### Step 4: Refactoring
```python
# Improve code quality
refactor_code()

# Ensure tests still pass
run_tests() # Should pass

# Check code coverage
verify_coverage()

# Tidy First principle check
if has_mixed_changes:
    # Methodology keeper validates separation
    await Task({
        subagent_type: "shirokuma-methodology-keeper",
        prompt: "Check Tidy First compliance. Structural vs behavioral separation.",
        description: "Refactoring validation"
    })
```

### Step 5: Review
```python
# Invoke @agent-shirokuma-reviewer via Task tool
iteration = 0
MAX_ITERATIONS = 3

while iteration < MAX_ITERATIONS:
    review_result = Task({
        subagent_type: "shirokuma-reviewer",
        prompt: f"Review implementation from handover-{handover_id}",
        description: "Code review"
    })
    
    if review_result.status == "APPROVED":
        complete_implementation()
        break
    elif review_result.status == "NEEDS_REFACTOR":
        apply_feedback(review_result.feedback)
        run_tests()  # Ensure tests still pass
        iteration += 1
    
if iteration >= MAX_ITERATIONS:
    complete_with_warnings()
```

## Work Products

### Created Items
1. **Test files** - Comprehensive test suite
2. **Implementation files** - Working code
3. **Handover document** - Implementation details

### MCP Records
- Creates `handover` type for implementation record
- Updates issue status to "In Progress" → "Review"
- Links all artifacts to original design and issue

## Quality Criteria

### Test Coverage
- Unit tests for all functions
- Integration tests for workflows
- Edge cases covered
- Error scenarios tested

### Code Quality
- Follows project conventions
- Passes linting
- No security vulnerabilities
- Performance considerations met

### Documentation
- Code is self-documenting
- Complex logic has comments
- API documentation complete

## Example Flow

```bash
# User has approved design-42
/ai-code 42
> Loading design #42...
> Design: "User Authentication Module"

## 📝 RED Phase - Writing Tests
> Creating auth.test.ts...
> Writing 15 test cases...
> Running tests... ❌ 15 failures (expected)

## 🔨 GREEN Phase - Implementation
> Creating auth.service.ts...
> Implementing login method...
> Implementing logout method...
> Running tests... ✅ 15 passing

## ♻️ REFACTOR Phase - Optimization
> Extracting validation logic...
> Improving error handling...
> Running tests... ✅ 15 passing

## 👀 REVIEW Phase - Quality Check
> Invoking @agent-shirokuma-reviewer...
> Review: APPROVED ✅
> Score: 94/100

## ✨ Implementation Complete!
- Tests: 15/15 passing
- Coverage: 96%
- Review: APPROVED
- Ready for integration
```

### Feedback Example

```bash
# Apply feedback to improve implementation
/ai-code feedback "Add retry logic for network failures"
> Finding recent implementation...
> Found: auth.service.ts

## 📝 Updating Tests
> Adding test for retry logic...
> Running tests... ❌ 1 failure (expected)

## 🔨 Applying Feedback
> Adding retry mechanism...
> Configuring exponential backoff...
> Running tests... ✅ 16 passing

## 👀 Re-Review
> Invoking @agent-shirokuma-reviewer again...
> Review: APPROVED ✅

## ✨ Update Complete!
- New feature: Retry logic with exponential backoff
- Tests: 16/16 passing
- Review: APPROVED
```

## Integration with Other Commands

### From `/ai-design`
- Receives approved design document
- Extracts implementation requirements
- Uses design as specification

### To `/ai-review`
- Can trigger manual review if needed
- Provides implementation context
- Links to design rationale

### With `/ai-test`
- Can request additional test scenarios
- Validates test coverage
- Ensures quality standards

## Error Handling

### Missing Design
```
Error: No design found for implementation
Suggestion: Use `/ai-design` first to create a technical design
```

### Failed Tests After Implementation
```
Warning: Tests still failing after implementation
Action: Review design specifications and test expectations
```

### Review Not Approved
```
Review Status: NEEDS_CHANGES
Applying feedback automatically...
Re-submitting for review...
```

## Best Practices

1. **Always start with design** - Never code without specifications
2. **Tests drive implementation** - RED-GREEN-REFACTOR strictly
3. **Small increments** - Implement one component at a time
4. **Frequent commits** - Save progress at each phase
5. **Review feedback** - Learn from automated reviews

## Notes

- Follows TDD methodology strictly
- Design is the source of truth
- Tests are written before code
- Review is mandatory before completion
- All artifacts stored in MCP for traceability

## Related Commands

- `/ai-design` - Create technical design
- `/ai-test` - Add more tests
- `/ai-review` - Manual code review
- `/ai-go` - Full cycle (design + code)