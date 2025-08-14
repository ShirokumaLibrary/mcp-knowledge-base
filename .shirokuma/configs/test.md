# Testing Configuration

## Pre-flight Checks

Before starting work, run these checks to ensure the development environment is ready:

### 1. Build Validation
Verify the project builds without errors:
```bash
npm run build
```

### 2. Lint Validation  
Check for code quality issues:
```bash
npm run lint:errors  # Show only errors
npm run lint        # Show all issues
```

### 3. Type Checking
Verify TypeScript types are correct:
```bash
npm run type-check  # or npx tsc --noEmit
```

### 4. Test Suite
Run automated tests (if configured):
```bash
npm test
```
*Note: Configure test script in package.json as needed*

### 5. Database Validation
For projects using databases:
```bash
# Check database exists
ls -la .shirokuma/data/

# Run migrations if needed
shirokuma-kb migrate
```

### 6. Environment Validation
Verify required tools and dependencies:
```bash
# Node.js version
node -v

# Package dependencies
npm ls --depth=0

# Prisma client (if using Prisma)
npx prisma generate
```

## Manual Testing

### CLI Testing
```bash
# Create test item
shirokuma-kb create -t test_type -T "Test Title" -d "Test Description"

# List items
shirokuma-kb list

# Get specific item
shirokuma-kb get 1

# Search items
shirokuma-kb search "keyword"
```

### MCP Server Testing
```bash
# Start MCP server
npm run serve

# Test with MCP client (e.g., Claude Desktop)
# Use tools: create_item, get_item, update_item, search_items
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm run lint:errors
      - run: npm test
```

## Test Organization

### Test File Structure
```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for services
├── e2e/           # End-to-end tests
└── fixtures/      # Test data and mocks
```

### Test Naming Convention
- Test files: `*.test.ts` or `*.spec.ts`
- Test descriptions: Clear, behavior-focused
- Example: `should create item with valid data`

## Common Test Scenarios

### 1. CRUD Operations
- Create with valid/invalid data
- Read existing/non-existing items
- Update with partial/complete data
- Delete with cascade effects

### 2. Search and Filter
- Keyword search accuracy
- Filter combinations
- Pagination behavior
- Empty result handling

### 3. Error Handling
- Invalid input validation
- Database connection errors
- Timeout handling
- Graceful degradation

### 4. Performance
- Response time under load
- Memory usage patterns
- Database query optimization
- Concurrent request handling

## Debugging Tests

### Verbose Output
```bash
# Run with debug information
DEBUG=* npm test

# Run specific test file
npm test -- path/to/test.spec.ts

# Run tests in watch mode
npm test -- --watch
```

### Common Issues
1. **Database not found**: Run `shirokuma-kb migrate`
2. **Prisma client outdated**: Run `npx prisma generate`
3. **Type errors**: Run `npm run type-check` for details
4. **Lint errors**: Run `npm run lint:errors` for details

## Quality Gates

Before committing code, ensure:
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build succeeds
- [ ] Documentation updated