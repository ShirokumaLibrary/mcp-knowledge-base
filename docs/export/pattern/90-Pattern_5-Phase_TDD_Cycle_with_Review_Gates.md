---
id: 90
type: pattern
title: "Pattern: 5-Phase TDD Cycle with Review Gates"
status: Open
priority: HIGH
category: "Design Patterns"
tags: ["testing","refactoring","tdd","quality-assurance","kent-beck","pattern","review-gates"]
related: [13,14,15,28,70]
keywords: {"input":0.42,"review":0.38,"phase":0.34,"test":0.27,"tdd":0.23}
embedding: "iYCSgJuAgICYgICNgIuAgYOAlICRgICAnICGmICOgIeAgJCAhYCAgJuAlZiAioCUgYCGgI2AgICbgJ+OgIOAm4aAgICPgICAj4CZgoCAgJaLgIKAkYCAgIKAn4CAgoCKioCMgJKAgICAgJeJgICAjIuAk4CbgICAi4CIgoCEgIc="
createdAt: 2025-08-22T13:32:45.000Z
updatedAt: 2025-08-22T13:32:45.000Z
---

# Pattern: 5-Phase TDD Cycle with Review Gates

Complete TDD cycle pattern with review gates between phases to ensure quality at each step

## AI Summary

Pattern: 5-Phase TDD Cycle with Review Gates Complete TDD cycle pattern with review gates between phases to ensure quality at each step ## 5-Phase TDD Cycle Pattern

### Overview
A comprehensive TDD p

## 5-Phase TDD Cycle Pattern

### Overview
A comprehensive TDD pattern that adds review gates between traditional TDD phases for quality assurance.

### Phase Structure

```
RED → [Test Review Gate] → GREEN → [Code Review Gate] → REFACTOR
```

### Implementation Steps

#### Phase 1: RED (Test Creation)
```typescript
// Write comprehensive tests that fail
describe('Module Under Test', () => {
  it('should handle normal cases', () => {
    expect(someFunction('input')).toBe('expected');
  });
  
  it('should handle edge cases', () => {
    expect(someFunction('')).toBe('default');
  });
  
  it('should handle error cases', () => {
    expect(() => someFunction(null)).toThrow();
  });
});
```

#### Gate 1: Test Review
- Verify test coverage targets (>90%)
- Check test readability
- Ensure all scenarios covered
- APPROVED/REJECTED decision

#### Phase 2: GREEN (Minimal Implementation)
```typescript
// Implement just enough to pass tests
function someFunction(input: string): string {
  if (!input) throw new Error('Invalid input');
  if (input === '') return 'default';
  return 'expected';
}
```

#### Gate 2: Code Review
- Quality score assessment
- Security vulnerability check
- Performance considerations
- Maximum 3 iterations

#### Phase 3: REFACTOR (Quality Improvement)
```typescript
// Improve without changing behavior
function someFunction(input: string): string {
  validateInput(input);
  return processInput(input) || DEFAULT_VALUE;
}

function validateInput(input: string): void {
  if (!input) {
    throw new ValidationError('Input is required');
  }
}
```

### Key Principles

1. **Iteration Limits**
   - Max 3 review cycles per phase
   - Progress over perfection

2. **Automated Reviews**
   - Use tooling for objective metrics
   - Combine AI and human review

3. **Tidy First**
   - Separate structural from behavioral changes
   - Clear commit messages for each phase

### Benefits
- Higher code quality (65% → 85% improvement typical)
- Better test coverage (>95% achievable)
- Reduced defect rates
- Clear development progress

### When to Use
- Critical business logic
- Public API implementations
- Refactoring legacy code
- Teaching TDD to teams

### Anti-patterns to Avoid
- Skipping review gates
- Writing tests after code
- Over-engineering in GREEN phase
- Mixing refactoring with new features
