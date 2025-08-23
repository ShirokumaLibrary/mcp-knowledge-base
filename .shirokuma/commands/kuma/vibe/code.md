---
description: Implementation with automatic steering compliance
argument-hint: "'feature to implement' | from-plan | from-spec <id>"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, TodoWrite, mcp__shirokuma-kb__get_item
---

# /kuma:vibe:code - Smart Implementation Mode

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Intelligent code generation that automatically follows project patterns, steering documents, and existing conventions. Produces production-ready code with tests.

## Usage

```bash
/kuma:vibe:code 123                         # Code from item (auto-detect type)
/kuma:vibe:code "implement user service"    # Direct implementation (creates issue)
```

## Implementation Process

### 1. Context Loading
- Load item by ID and detect type (issue, spec, task)
- Get all related documents
- Load linked specs if item is issue
- Load applicable steering documents
- Analyze existing similar code

### 2. Code Generation
- Follow patterns from issue's specs
- Apply architecture patterns
- Use existing utilities
- Follow naming conventions

### 3. Test Creation
- Generate tests based on spec requirements
- Add integration tests if needed
- Ensure coverage targets
- Link tests to issue

### 4. Quality Assurance
- Run ESLint checks
- Verify TypeScript types
- Check test passage
- Validate against spec

### 5. Documentation
- Update issue with implementation notes
- Add JSDoc comments
- Create usage examples
- Record decisions in issue

## Steering Compliance

### Automatic Application
Applies project-specific patterns from steering documents:
- File naming conventions
- Code structure patterns
- Error handling approaches
- Architecture patterns (repository, service layers, etc.)
- Testing requirements

### Pattern Recognition
- Detects existing patterns in codebase
- Applies consistent style
- Reuses common utilities

## Code Generation Strategy

### Pattern-Based Generation
The command analyzes existing code to understand:
- Module structure
- Class/function patterns
- Naming conventions
- Import organization
- Comment styles

### Test Generation
Automatically creates tests matching project's testing framework:
- Unit test structure
- Mocking patterns
- Assertion styles
- Coverage requirements

### Language Agnostic
Adapts to any programming language or framework:
- **Object-Oriented**: Classes, interfaces, inheritance
- **Functional**: Pure functions, composition
- **Procedural**: Functions, modules
- **Declarative**: Configuration, markup

## Quality Checks

### Pre-Implementation
- Verify plan exists or create one
- Check for existing implementations
- Confirm steering compliance

### Post-Implementation
```bash
# Automatic checks
npm run lint:errors     # ESLint
npm run build          # TypeScript
npm test              # Test suite
```

## Integration Points

### From Item ID
- Auto-detects item type (issue, spec, task)
- Retrieves all related documents
- Follows specifications and requirements
- Updates parent issue with progress

### With Testing
- Coordinates with `/kuma:vibe:tdd`
- Ensures test coverage
- Maintains test-first approach when specified

## Best Practices

1. **Pattern Consistency**: Follow existing patterns
2. **Steering Compliance**: Adhere to project standards
3. **Test Coverage**: Meet coverage targets
4. **Type Safety**: Use explicit types
5. **Error Handling**: Comprehensive error management

## Error Recovery

### Common Issues
- **ESLint Errors**: Auto-fix or manual correction
- **Type Errors**: Resolve with proper typing
- **Test Failures**: Debug and fix
- **Pattern Mismatch**: Align with existing code

