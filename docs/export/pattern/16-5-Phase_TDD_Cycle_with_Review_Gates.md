---
id: 16
type: pattern
title: "5-Phase TDD Cycle with Review Gates"
status: Open
priority: MEDIUM
tags: ["testing","tdd","review","methodology","development","code_quality","red_green_refactor","best_practices"]
keywords: {"input":0.42,"review":0.38,"phase":0.34,"test":0.27,"tdd":0.23}
embedding: "gICRgJqAgICagICMgIqAgYCAk4CQgICAo4CGloCNgIeAgI+AhYCAgKSAlJeAioCTgICGgI2AgICigJ2NgIOAmoCAgICOgICAkoCYgoCAgJWAgIKAkICAgIKAnoCAgoCJgICLgJGAgICCgJaJgICAi4CAkoCZgICAkYCHgoCEgIY="
related: [14,13,15,28,29]
searchIndex: "input review phase test tdd quality code somefunction string gates"
created: 2025-08-13T12:18:26.388Z
updated: 2025-08-13T12:18:26.388Z
---

# 5-Phase TDD Cycle with Review Gates

## Description

Complete TDD cycle pattern with review gates between phases to ensure quality at each step

## Content

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

## AI Summary

5-Phase TDD Cycle with Review Gates Complete TDD cycle pattern with review gates between phases to ensure quality at each step ## 5-Phase TDD Cycle Pattern

### Overview
A comprehensive TDD pattern th

## Keywords (Detailed)

- input (weight: 0.42)
- review (weight: 0.38)
- phase (weight: 0.34)
- test (weight: 0.27)
- tdd (weight: 0.23)
- quality (weight: 0.19)
- code (weight: 0.19)
- somefunction (weight: 0.19)
- string (weight: 0.19)
- gates (weight: 0.15)

---
*Exported from SHIROKUMA Knowledge Base*
