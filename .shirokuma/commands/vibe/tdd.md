---
description: Test-driven development workflow with RED-GREEN-REFACTOR cycle
argument-hint: "'feature description'"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, TodoWrite, Task
---

# /kuma:vibe:tdd - Test-Driven Development

## Language

Note: Language settings are configured in MCP steering documents

## Purpose

Implements strict TDD workflow following Kent Beck's RED-GREEN-REFACTOR cycle. Ensures test-first development with independent verification.

## Usage

```bash
/kuma:vibe:tdd "implement user validation"
/kuma:vibe:tdd "add email format check"
```

## TDD Cycle

### 1. RED Phase - Write Failing Test
Write a test that describes the desired behavior. The test must fail initially because the functionality doesn't exist yet.

### 2. Verify Test Fails
Run the test suite and confirm:
- Test actually fails
- Failure is for the expected reason
- Error message is clear

### 3. GREEN Phase - Minimal Implementation
Write just enough code to make the test pass:
- Simplest solution that works
- Don't add unnecessary features
- Focus only on passing the current test

### 4. Verify Test Passes
Run tests again to confirm:
- New test passes
- All existing tests still pass
- No unexpected side effects

### 5. REFACTOR Phase - Improve Code
With tests as safety net:
- Improve code structure
- Remove duplication
- Enhance readability
- Optimize performance
- Keep running tests to ensure nothing breaks

## Subagent Verification

Uses independent subagent to verify:
- Tests actually fail initially
- Implementation is minimal
- Tests pass after implementation
- Refactoring doesn't break tests

The verification subagent provides an independent check to ensure TDD principles are followed correctly.

## TodoWrite Integration

```markdown
## TDD Tasks
- [ ] Write failing test for feature X
- [ ] Run test and confirm failure
- [ ] Write minimal implementation
- [ ] Run test and confirm success
- [ ] Refactor for quality
- [ ] Run final test suite
```

## Best Practices

### Test First, Always
- Never write code without a failing test
- One test at a time
- Keep tests simple and focused

### Minimal Implementation
- Resist over-engineering
- Just enough to pass the test
- Save improvements for refactor phase

### Refactor Discipline
- Only refactor when tests are green
- Run tests after each change
- Keep refactoring small

## Common TDD Patterns

### Service/Module Testing
1. **RED**: Define expected behavior in test
2. **GREEN**: Create minimal implementation
3. **REFACTOR**: Add proper structure, dependency injection, error handling

### Utility Function Testing
1. **RED**: Test with simple case
2. **GREEN**: Hardcode or simple solution
3. **REFACTOR**: Generalize, handle edge cases

### API/Interface Testing
1. **RED**: Define contract test
2. **GREEN**: Stub implementation
3. **REFACTOR**: Add real logic, validation, error cases

### Data Structure Testing
1. **RED**: Test basic operations
2. **GREEN**: Simple data structure
3. **REFACTOR**: Optimize, add constraints

## Integration with Steering

Automatically applies testing standards:
- Uses Vitest as configured
- Follows test file naming conventions
- Meets coverage targets (80%+)
- Uses approved mocking patterns

## Error Handling

### Common Issues
- **Test doesn't fail initially**: Check test logic
- **Over-implementation**: Remove unnecessary code
- **Test too complex**: Split into smaller tests
- **Refactor breaks tests**: Revert and try smaller changes