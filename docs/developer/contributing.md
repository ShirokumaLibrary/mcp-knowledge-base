# Contributing to Shirokuma MCP Knowledge Base

Thank you for your interest in contributing to the Shirokuma MCP Knowledge Base! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher
- Git
- Basic knowledge of TypeScript and MCP

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/shirokuma-mcp-knowledge-base.git
   cd shirokuma-mcp-knowledge-base
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## Development Process

### Branch Strategy

- `main` - stable release branch
- `develop` - development branch
- `feature/*` - feature branches
- `bugfix/*` - bug fix branches
- `hotfix/*` - urgent fixes for production

### Workflow

1. Create a feature branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Write/update tests for your changes

4. Ensure all tests pass:
   ```bash
   npm run test:all
   ```

5. Commit your changes with clear messages

6. Push to your fork and create a pull request

## Coding Standards

### TypeScript Guidelines

1. **Type Safety**
   - Avoid using `any` type
   - Use proper type definitions
   - Leverage TypeScript's type inference

2. **Naming Conventions**
   - Use camelCase for variables and functions
   - Use PascalCase for types and classes
   - Use UPPER_SNAKE_CASE for constants

3. **File Organization**
   ```
   src/
   ├── handlers/      # MCP tool handlers
   ├── database/      # Data access layer
   ├── schemas/       # Zod schemas
   ├── types/         # TypeScript types
   ├── utils/         # Utility functions
   └── security/      # Security utilities
   ```

### Code Style

1. **Functions**
   - Keep functions small and focused
   - Use descriptive names
   - Add JSDoc comments for public APIs

   ```typescript
   /**
    * Creates a new issue in the system
    * @param data Issue creation data
    * @returns Created issue with generated ID
    */
   async function createIssue(data: CreateIssueInput): Promise<Issue> {
     // Implementation
   }
   ```

2. **Error Handling**
   - Use custom error classes
   - Provide meaningful error messages
   - Include context in errors

   ```typescript
   throw new ValidationError('Invalid issue data', { 
     field: 'title', 
     value: data.title 
   });
   ```

3. **Async/Await**
   - Always use async/await over callbacks
   - Handle promise rejections properly
   - Use try-catch for error handling

### AI Annotations

Use AI annotations to provide context:

- `@ai-context` - General context about the code
- `@ai-pattern` - Design pattern being used
- `@ai-critical` - Critical implementation details
- `@ai-flow` - Data flow description
- `@ai-why` - Reasoning behind decisions

Example:
```typescript
/**
 * @ai-context Repository for managing issues
 * @ai-pattern Repository pattern with caching
 * @ai-critical Maintains referential integrity
 */
export class IssueRepository extends BaseRepository<Issue> {
  // Implementation
}
```

## Testing

### Test Structure

- Unit tests: `src/**/*.test.ts`
- Integration tests: `tests/integration/*.test.ts`
- E2E tests: `tests/e2e/*.e2e.test.ts`

### Writing Tests

1. **Unit Tests**
   ```typescript
   describe('IssueRepository', () => {
     it('should create issue with valid data', async () => {
       const issue = await repository.create({
         title: 'Test Issue',
         content: 'Test content'
       });
       
       expect(issue.id).toBeDefined();
       expect(issue.title).toBe('Test Issue');
     });
   });
   ```

2. **Integration Tests**
   - Test complete workflows
   - Use real database connections
   - Clean up test data

3. **E2E Tests**
   - Test through MCP protocol
   - Validate complete scenarios
   - Check performance metrics

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm test -- --coverage
```

## Submitting Changes

### Pull Request Process

1. **Before Submitting**
   - Ensure all tests pass
   - Run linter: `npm run lint`
   - Update documentation if needed
   - Add entry to CHANGELOG.md

2. **PR Description**
   - Clearly describe the changes
   - Reference related issues
   - Include screenshots if UI changes
   - List breaking changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] E2E tests pass

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings
   ```

### Code Review

- Address all review comments
- Be open to feedback
- Explain reasoning when needed
- Update PR based on feedback

## Reporting Issues

### Bug Reports

Include:
- Clear description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Error messages/logs

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternative solutions
- Impact on existing features

### Security Issues

- Do NOT create public issues
- Email security concerns to: shirokuma@gadget.to
- Include detailed description
- Wait for response before disclosure

## Development Tips

### Debugging

1. Use the logger instead of console.log:
   ```typescript
   import { createLogger } from './utils/logger.js';
   const logger = createLogger('MyModule');
   logger.debug('Debug message', { data });
   ```

2. Enable debug logging:
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

### Performance

1. Use caching for expensive operations
2. Batch database operations
3. Monitor with performance utilities
4. Profile before optimizing

### Common Issues

1. **Build Errors**
   - Clean and rebuild: `rm -rf dist && npm run build`
   - Check TypeScript version compatibility

2. **Test Failures**
   - Ensure clean test database
   - Check for timing issues
   - Verify mock data

3. **MCP Connection Issues**
   - Check server is running
   - Verify port availability
   - Review MCP configuration

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [MCP Documentation](https://modelcontextprotocol.io/docs)
- [Project Architecture](./architecture.md)
- [API Reference](./API.md)

## Questions?

- Check existing issues first
- Join discussions in issues
- Contact maintainers if needed

Thank you for contributing to Shirokuma MCP Knowledge Base!