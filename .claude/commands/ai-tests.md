---
description: Run MCP functional tests for validation
allowed-tools: Task
argument-hint: "[test-number or phase]"
---

# ai-tests - Run MCP functional tests

## Usage
```
/ai-tests           # Run all tests (Phase 1 + Phase 2)
/ai-tests 1.01      # Run specific test
/ai-tests phase1    # Run Phase 1 tests only (1.01-1.15)
/ai-tests phase2    # Run Phase 2 tests only (2.01-2.02)
```

## Task

@.claude/agents/LANG.markdown

Coordinate MCP API functional test execution through the specialist agent.

### Test Orchestration

The system delegates test execution to the @agent-mcp-api-tester specialist agent.

Parse user arguments:
- No arguments → all tests (Phase 1 + Phase 2, default)
- Test number (e.g., "1.01") → specific test
- "phase1" → Phase 1 tests only (1.01-1.15)
- "phase2" → Phase 2 tests only (2.01-2.02)

### Specialist Agent

**mcp-api-tester** - MCP API test execution specialist
- Executes systematic functional tests
- Validates MCP server API behavior
- Uses test-knowledge-base instance exclusively
- Generates comprehensive test reports

The specialist autonomously handles:
- Test specification location
- Sequential test execution
- Failure handling and continuation
- Result compilation and reporting

### Workflow

1. Receive test request from user
2. Delegate execution to mcp-api-tester specialist
3. Display the comprehensive report returned by the specialist

### Expected Output

The specialist will provide:
- Test-by-test results (✅ passed / ❌ failed)
- Summary statistics (e.g., 17/17 tests passed for full run, 15/15 for phase1, 2/2 for phase2)
- Detailed failure reasons

### Important Note

If mcp-api-tester agent type is not registered, delegate to general-purpose agent with instructions to follow mcp-api-tester specifications.