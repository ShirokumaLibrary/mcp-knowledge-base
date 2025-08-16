---
id: 5
type: decision
title: "Unit Testing and Linter Setup Technical Design"
status: Open
priority: HIGH
aiSummary: "Unit Testing and Linter Setup Technical Design Technical design for implementing unit testing framework and ESLint configuration for TypeScript ESM project # Design: Unit Testing and Linter Setup\n\n## "
tags: ["testing","linting","vitest","eslint","typescript","esm","design"]
keywords: {"test":0.47,"eslint":0.3,"for":0.23,"typescript":0.23,"tests":0.21}
embedding: "gIOkgICAhoCAkIChgICAmYSAqICAgIeAgJOAooCAgJOJgaCAgICMgICNgJiAgICGi4CNgICAkYCAhICRgICAgIiGgICAgJaAgIqAhYCAgIOCj4WAgICWgICCgIiAgICAgJGYgICAjICAgICYgICAiIGMp4CAgIuAgIeAloCAgJQ="
related: [1,6,7,9,18]
searchIndex: "test eslint for typescript tests vitest with testing configuration database"
created: 2025-08-13T11:40:05.950Z
updated: 2025-08-13T11:40:05.950Z
---

# Unit Testing and Linter Setup Technical Design

## Description

Technical design for implementing unit testing framework and ESLint configuration for TypeScript ESM project

## Content

# Design: Unit Testing and Linter Setup

## Overview
This design document outlines the implementation of unit testing framework (Vitest) and linter configuration (ESLint) for the Shirokuma Knowledge Base project, a TypeScript ESM-based MCP server with Prisma and SQLite.

## Problem Statement
The project currently lacks:
1. Proper unit testing framework and configuration
2. ESLint installation and configuration  
3. Test runner scripts in package.json
4. Standardized testing patterns for the codebase

## Solution Overview
Implement Vitest as the primary testing framework with ESLint for code quality, designed specifically for TypeScript ESM environments with proper Prisma integration.

## Design Decisions

### Decision 1: Test Framework Selection
**Options Considered**:
- **Option A**: Jest with TypeScript preset
- **Option B**: Vitest (Vite-based testing)
- **Option C**: Node.js built-in test runner

**Choice**: Option B (Vitest)
**Rationale**: 
- Native ESM support without configuration complexity
- Fast execution with built-in TypeScript support
- Vite ecosystem compatibility
- Better performance than Jest for TypeScript ESM
- Active development and modern API design

**Confidence**: 0.9

### Decision 2: ESLint Configuration Approach
**Options Considered**:
- **Option A**: Flat config (eslint.config.js) - New ESLint 9+ format
- **Option B**: Legacy .eslintrc.js format
- **Option C**: Minimal configuration with TypeScript defaults

**Choice**: Option A (Flat config)
**Rationale**:
- Future-proof configuration format
- Better TypeScript integration
- Cleaner configuration structure
- Aligns with modern ESLint practices

**Confidence**: 0.8

### Decision 3: Test Database Strategy
**Options Considered**:
- **Option A**: In-memory SQLite for all tests
- **Option B**: Separate test database file
- **Option C**: Test database with automatic cleanup

**Choice**: Option A (In-memory SQLite)
**Rationale**:
- Faster test execution
- No filesystem dependencies
- Automatic cleanup between test runs
- Isolation between test suites

**Confidence**: 0.9

## Architecture

### Directory Structure
```
shirokuma-v8/
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── enhanced-ai.service.test.ts
│   │   │   └── ai/
│   │   │       ├── data-storage.test.ts
│   │   │       └── claude-interface.test.ts
│   │   ├── utils/
│   │   │   └── validation.test.ts
│   │   ├── mcp/
│   │   │   ├── handlers/
│   │   │   │   ├── crud-handlers.test.ts
│   │   │   │   └── search-handlers.test.ts
│   │   │   └── database/
│   │   │       └── database-init.test.ts
│   │   └── cli/
│   │       └── index.test.ts
│   ├── integration/
│   │   ├── mcp-server.test.ts
│   │   └── database/
│   │       └── prisma-operations.test.ts
│   ├── fixtures/
│   │   ├── test-data.ts
│   │   └── mock-prisma.ts
│   └── setup/
│       ├── test-setup.ts
│       └── database-setup.ts
├── eslint.config.js
├── vitest.config.ts
└── .env.test
```

### Configuration Files

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/test-setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/mcp/server.ts', // Main entry point
        'src/cli/index.ts'   // CLI entry point
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

#### eslint.config.js
```javascript
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // TypeScript specific
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      
      // General code quality
      'no-console': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Import rules
      'no-duplicate-imports': 'error',
      
      // Naming conventions
      'camelcase': 'warn'
    }
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      // Relaxed rules for tests
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.shirokuma/data/**']
  }
];
```

### Package Dependencies

#### New Dependencies to Add
```json
{
  "devDependencies": {
    "@eslint/js": "^9.15.0",
    "@typescript-eslint/eslint-plugin": "^8.15.0",
    "@typescript-eslint/parser": "^8.15.0",
    "@vitest/coverage-v8": "^2.1.8",
    "eslint": "^9.15.0",
    "vitest": "^2.1.8"
  }
}
```

#### Updated Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "lint:errors": "eslint src tests --ext .ts --quiet",
    "type-check": "tsc --noEmit",
    "quality-check": "npm run type-check && npm run lint:errors && npm run test:run"
  }
}
```

## Implementation Plan

### Phase 1: Core Setup (Must Have)
- [ ] Install Vitest and ESLint dependencies
- [ ] Create vitest.config.ts configuration
- [ ] Create eslint.config.js configuration  
- [ ] Update package.json scripts
- [ ] Create test setup files

### Phase 2: Test Infrastructure (Should Have)
- [ ] Create test database setup utilities
- [ ] Implement Prisma client mocking helpers
- [ ] Create test data fixtures
- [ ] Set up coverage reporting configuration

### Phase 3: Sample Tests (Nice to Have)
- [ ] Write unit tests for validation utilities
- [ ] Create tests for AI services
- [ ] Implement MCP handler tests
- [ ] Add integration tests for database operations

## Testing Strategy

### Unit Tests
- **Target**: Individual functions and classes in isolation
- **Scope**: Utils, services, handlers (without database)
- **Mocking**: Prisma client, external APIs
- **Coverage**: Aim for 80%+ on business logic

### Integration Tests  
- **Target**: Database operations and MCP tool interactions
- **Scope**: Full request/response cycles
- **Database**: In-memory SQLite with test data
- **Coverage**: Critical user flows

### Test Patterns
```typescript
// Example unit test structure
describe('ValidationUtils', () => {
  describe('validateType', () => {
    it('should accept valid type formats', () => {
      expect(validateType('valid_type')).toBe(true);
      expect(validateType('type123')).toBe(true);
    });
    
    it('should reject invalid type formats', () => {
      expect(validateType('Invalid-Type')).toBe(false);
      expect(validateType('type with spaces')).toBe(false);
    });
  });
});

// Example integration test structure
describe('CrudHandlers Integration', () => {
  let testDb: PrismaClient;
  
  beforeEach(async () => {
    testDb = new PrismaClient({
      datasources: { db: { url: 'file::memory:?cache=shared' } }
    });
    await testDb.$executeRaw`PRAGMA journal_mode = WAL;`;
  });
  
  afterEach(async () => {
    await testDb.$disconnect();
  });
  
  it('should create item with AI enrichment', async () => {
    // Test implementation
  });
});
```

## Security Considerations

### Test Environment Isolation
- Use separate in-memory database for tests
- Mock external API calls to prevent data leakage
- Avoid using production environment variables in tests

### Code Quality Gates
- ESLint rules prevent common security vulnerabilities
- TypeScript strict mode catches type-related bugs
- Coverage requirements ensure critical paths are tested

## Performance Considerations

### Test Execution Speed
- In-memory SQLite provides fast database operations
- Vitest's concurrent execution improves test suite runtime
- Coverage collection adds ~20% overhead but worth the insight

### CI/CD Integration
- Fast feedback loop with quality-check script
- Parallel linting and testing where possible
- Fail fast on critical errors

## Migration and Rollback

### Implementation Order
1. Install dependencies
2. Add configuration files
3. Update package.json scripts
4. Create test infrastructure
5. Write initial test suites

### Rollback Strategy
- Remove devDependencies if issues arise
- Revert package.json scripts to current state
- Delete configuration files
- No production code changes required

## Success Criteria

### Must Achieve
- [ ] `npm test` executes successfully
- [ ] `npm run lint:errors` shows no errors
- [ ] All existing functionality remains working
- [ ] Type checking passes without warnings

### Should Achieve  
- [ ] Basic test coverage for critical utilities
- [ ] ESLint catches common code quality issues
- [ ] Test setup works with Prisma operations
- [ ] Documentation updated with testing guidelines

### Nice to Have
- [ ] 80%+ test coverage on business logic
- [ ] Integration tests for MCP operations
- [ ] Automated quality gates in CI/CD
- [ ] Test utilities for future development

## Dependencies and Constraints

### Technical Dependencies
- Node.js 18+ (ESM support required)
- TypeScript 5.9+ (for modern syntax support)
- Prisma 6.13+ (for database operations in tests)

### Resource Constraints
- Development dependency size increase (~50MB)
- Test execution time budget: <30s for full suite
- Coverage collection adds build time

### Project Constraints
- Must not break existing functionality
- Must maintain TypeScript ESM compatibility
- Must integrate with current build pipeline
- Must follow project coding conventions

## Additional Notes

### ESLint Rules Rationale
- `no-explicit-any`: Enforces proper typing
- `no-unused-vars`: Prevents dead code
- `no-console`: Encourages proper logging patterns
- Relaxed rules in tests for flexibility

### Vitest Choice Benefits
- Built-in TypeScript support without babel
- Native ESM handling
- Vite's fast HMR for test development
- Modern testing API with good developer experience

### Future Enhancements
- Add visual regression tests if UI components added
- Consider snapshot testing for API responses
- Implement property-based testing for validation functions
- Add mutation testing for quality validation

## AI Summary

Unit Testing and Linter Setup Technical Design Technical design for implementing unit testing framework and ESLint configuration for TypeScript ESM project # Design: Unit Testing and Linter Setup

## 

## Keywords (Detailed)

- test (weight: 0.47)
- eslint (weight: 0.30)
- for (weight: 0.23)
- typescript (weight: 0.23)
- tests (weight: 0.21)
- vitest (weight: 0.16)
- with (weight: 0.15)
- database (weight: 0.14)
- testing (weight: 0.14)
- configuration (weight: 0.14)

