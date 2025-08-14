---
allowed-tools: [Bash, Read, Grep]
description: Run project test suite and validate code quality
classification: L2_FRAMEWORK
version: 1.0.0
---

## Language
@.shirokuma/configs/lang.md

## CURRENT CONTEXT

GIT STATUS:
```
!git status --porcelain
```

RECENT CHANGES:
```
!git diff --stat HEAD~1
```

## OBJECTIVE

Execute comprehensive test suites to validate code quality, ensure functionality meets requirements, and maintain high reliability standards across the codebase through automated testing.

## Purpose
Execute project test suite, validate code quality, and ensure all tests pass before commits or deployments. This command adapts to the project's testing framework and configuration.

## CRITICAL INSTRUCTIONS

1. **FRAMEWORK DETECTION**: Automatically identify and use the project's test runner (Jest, Vitest, Mocha, etc.)
2. **COMPLETE EXECUTION**: Run all tests to completion, even if some fail
3. **CLEAR REPORTING**: Present results with actionable failure information
4. **COVERAGE AWARENESS**: Report coverage metrics when available
5. **ENVIRONMENT VALIDATION**: Ensure test environment is properly configured before execution

## EXCLUSION RULES

### DO NOT:
1. **Skip failing tests** - All failures must be reported and addressed
2. **Modify test files** - Tests should validate current code, not be adjusted to pass
3. **Ignore flaky tests** - Intermittent failures indicate real problems
4. **Run in production** - Never execute tests against production data/systems
5. **Hide error details** - Full stack traces and error messages must be shown

## Usage
```
/ai-tests              # Run full test suite
/ai-tests unit         # Run unit tests only
/ai-tests integration  # Run integration tests only
/ai-tests coverage     # Run tests with coverage report
```

## METHODOLOGY

### Phase 1: Preparation

1. **Identify testing framework**
   - Check package.json for test scripts
   - Identify test runner (Jest, Mocha, Vitest, etc.)
   - Locate test configuration files

2. **Analyze test structure**
   ```bash
   # Find test files
   find . -name "*.test.*" -o -name "*.spec.*" | head -20
   
   # Check test scripts
   grep -E '"test|spec"' package.json
   ```

3. **Review recent test history**
   ```bash
   # Check last test run from git history
   git log --grep="test" --oneline -5
   ```

### Phase 2: Execution

1. **Run pre-test checks**
   - Ensure dependencies are installed
   - Check for test configuration
   - Verify test database/environment if needed

2. **Execute test suite**
   - Use project-specific test command from configuration
   - Capture and analyze output
   - Handle different test types based on arguments

3. **Process test results**
   - Parse test output for failures
   - Identify failing test files
   - Extract error messages and stack traces

### Phase 3: Output

1. **Display test summary**
   - Total tests run
   - Passed/Failed/Skipped counts
   - Execution time
   - Coverage metrics (if available)

2. **Handle failures**
   - List failing tests with clear descriptions
   - Show relevant error messages
   - Suggest debugging steps
   - Reference related code files

3. **Provide recommendations**
   - For failed tests: debugging approach
   - For passed tests: next steps (commit, deploy)
   - Coverage improvements if applicable

## OUTPUT FORMAT

### Minimum Requirements (MUST have)
- Test suite name and runner
- Total test count with pass/fail/skip breakdown
- Execution time
- List of all failing tests with error messages
- Exit code status

### Recommended Structure (SHOULD follow)
```
🧪 Running Test Suite (Jest v29.5.0)

Test Results:
  ✅ Passed: 245
  ❌ Failed: 3
  ⏭️ Skipped: 2
  📈 Total: 250

⏱️ Execution Time: 12.3s

❌ Failed Tests:

1. UserService › should validate email format
   File: src/services/user.test.ts:45
   Error: Expected 'invalid@' to be rejected
   
2. API › POST /users › should create new user
   File: tests/api/users.test.ts:89
   Error: Connection refused to test database
   
3. Utils › formatDate › should handle timezone
   File: src/utils/date.test.ts:23
   Error: Expected 'UTC' but got 'PST'

📊 Coverage Report:
  Statements: 78.5% (1570/2000)
  Branches: 65.2% (300/460)
  Functions: 82.1% (460/560)
  Lines: 77.9% (1480/1900)

🔴 Test suite FAILED

📝 Next Steps:
  1. Fix failing tests before committing
  2. Run 'npm test -- --watch' for faster debugging
  3. Check test database connection settings
```

## Project Configuration
@.shirokuma/configs/test.md
@.shirokuma/configs/conventions.md

## Test Categories

### Unit Tests
- Test individual functions/methods
- Mock external dependencies
- Fast execution
- High code coverage

### Integration Tests
- Test component interactions
- Use real dependencies when possible
- Moderate execution time
- System behavior validation

### End-to-End Tests
- Test complete user workflows
- Full system validation
- Slower execution
- Critical path coverage

## Best Practices

1. **Test before commit**: Always ensure tests pass before committing code
2. **Fix immediately**: Address failing tests before proceeding with other work
3. **Maintain coverage**: Keep test coverage above project threshold
4. **Clear test names**: Write descriptive test names that explain the scenario
5. **Isolate failures**: Run specific failing tests to debug efficiently