# TDD & Tidy First Methodology (Kent Beck)

## Core Principles

### 1. TDD Cycle: Red → Green → Refactor

**RED Phase (Test First)**
- Write the smallest possible failing test
- Start with the simplest test case
- Use meaningful test names that describe behavior (e.g., "shouldAuthenticateValidUser")
- Ensure test fails for the right reason (not compilation/syntax errors)
- Test failure message should be clear and informative

**GREEN Phase (Minimal Implementation)**
- Write ONLY the code needed to make the test pass
- Don't add extra functionality or features
- Focus on making it work, not making it perfect
- No premature optimization
- Simplest solution that could possibly work

**REFACTOR Phase (Improve Without Breaking)**
- Clean up duplication
- Improve naming and structure
- Extract methods/functions
- Reorganize code for clarity
- Ensure all tests still pass after every change

### 2. Tidy First Principle

**Separation of Changes - NEVER mix these in the same commit:**

**Structural Changes (Tidy):**
- Rename variables/functions/classes
- Extract methods or classes
- Move code between files
- Reorganize file structure
- Update configuration
- Database schema refactoring
- Formatting and whitespace changes
→ Commit with prefix: "refactor:" or "tidy:"
→ Tests must continue passing unchanged

**Behavioral Changes:**
- Add new features
- Fix bugs
- Change business logic
- Modify API responses
- Alter validation rules
- Update calculations
→ Always preceded by a failing test
→ Commit with prefix: "feat:" or "fix:"

**Rule**: If both types are needed, ALWAYS do structural changes first in a separate commit.

### 3. Problem Discovery Priority

**Before solving any problem:**

1. **Identify Root Cause**
   - Don't fix symptoms
   - Ask "why" five times
   - Understand the real problem

2. **Generate Multiple Solutions**
   - Create at least 2-3 different approaches
   - Consider trade-offs of each
   - Think about long-term implications

3. **Evaluate Impact**
   - Consider effects on other parts of the system
   - Assess performance implications
   - Review security considerations

4. **Choose Minimal Solution**
   - Start with the simplest approach
   - Can always add complexity later
   - YAGNI (You Aren't Gonna Need It)

5. **Validate with Tests**
   - Prove the problem exists (failing test)
   - Prove the solution works (passing test)
   - Ensure no regression

### 4. Bug Fix TDD Approach

When fixing bugs, follow Kent Beck's specific approach:

```
1. Write an API-level test that exposes the bug
   - This ensures the bug is visible at the user level
   
2. Write a minimal unit test that reproduces the issue
   - This pinpoints the exact problem location
   
3. Fix the bug with minimal changes
   - Change only what's necessary
   
4. Verify both tests pass
   - Ensures bug is fixed at all levels
   
5. Refactor if needed (separate commit)
   - Clean up any technical debt introduced
```

### 5. Test Quality Guidelines

**Good Tests Are:**
- **Fast** - Run quickly to encourage frequent execution
- **Independent** - Don't depend on other tests
- **Repeatable** - Same result every time
- **Self-Validating** - Clear pass/fail result
- **Timely** - Written just before the code

**Test Naming:**
- Describe what the code SHOULD do
- Use business language when possible
- Be specific about the scenario
- Examples:
  - ✅ `shouldReturnErrorWhenEmailIsInvalid`
  - ✅ `shouldCalculateTaxForInternationalOrders`
  - ❌ `testEmail`
  - ❌ `test1`

### 6. Commit Message Guidelines

Following Tidy First principles in commits:

```
# Structural changes
refactor: extract validation logic to separate module
tidy: rename UserManager to UserService
refactor: move auth utils to shared directory

# Behavioral changes (with test)
feat: add email validation to registration
fix: correct tax calculation for international orders
feat: implement password reset flow

# Never mix:
❌ feat: add validation and refactor user service
❌ fix: bug fix and code cleanup
```

## Implementation Checklist

### For Every Feature:
- [ ] Write failing test first (RED)
- [ ] Implement minimal code (GREEN)
- [ ] All tests pass
- [ ] Refactor if needed (separate commit)
- [ ] Tests still pass after refactoring

### For Every Bug:
- [ ] Write test that reproduces the bug
- [ ] Test fails (proving bug exists)
- [ ] Fix with minimal change
- [ ] Test passes (proving bug fixed)
- [ ] No other tests broken

### For Every Refactoring:
- [ ] All tests pass before starting
- [ ] Make structural changes only
- [ ] No behavior changes
- [ ] All tests still pass
- [ ] Commit separately from features/fixes

## Common Anti-Patterns to Avoid

1. **Writing code before tests** - Violates TDD
2. **Writing multiple tests at once** - Lose focus on current problem
3. **Implementing more than needed** - YAGNI violation
4. **Mixing refactoring with features** - Violates Tidy First
5. **Skipping the refactor phase** - Accumulates technical debt
6. **Writing tests after code** - Not TDD, just testing
7. **Big bang refactoring** - High risk, hard to review

## Benefits of This Approach

- **Confidence**: Tests prove code works
- **Design**: Tests drive better design
- **Documentation**: Tests document behavior
- **Refactoring Safety**: Can change with confidence
- **Debugging**: Tests pinpoint problems
- **Collaboration**: Clear commits and history
- **Maintenance**: Easier to modify and extend

## References

- Kent Beck: "Test-Driven Development: By Example" (2002)
- Kent Beck: "Tidy First?: A Personal Exercise in Empirical Software Design" (2023)
- Martin Fowler: "Refactoring: Improving the Design of Existing Code"
- Robert C. Martin: "Clean Code: A Handbook of Agile Software Craftsmanship"