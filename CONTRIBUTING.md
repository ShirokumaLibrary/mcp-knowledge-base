# Contributing to SHIROKUMA Knowledge Base

Thank you for considering contributing to SHIROKUMA Knowledge Base! This document provides guidelines for contributors.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- TypeScript 5.x
- npm or yarn
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/shirokuma-kb.git
cd shirokuma-kb

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Setup development environment
shirokuma-kb migrate
```

## Development Workflow

### 1. Issue-Driven Development

Every change should be tracked with an issue:

```bash
# Create an issue first
/kuma:issue "Add new feature X"

# Start working on the issue
/kuma:go 123
```

### 2. Test-Driven Development (TDD)

Follow the RED-GREEN-REFACTOR cycle:

1. **RED**: Write a failing test
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Improve code quality

```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.spec.ts
```

### 3. Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or tooling changes

**Examples**:
```bash
feat(mcp): add new search_suggest API endpoint
fix(setup): resolve placeholder replacement issue
docs(readme): update installation instructions
test(placeholder): add edge case tests for MCP name validation
```

## Template Development Guidelines

### Creating Agent Definitions

Agent definitions live in `.shirokuma/agents/` and use placeholders for portability.

**Template Structure** (`.shirokuma/agents/my-agent.md`):

```markdown
---
description: Brief description of agent purpose
allowed-tools: Read, Write, Edit, {{MCP_NAME}}__get_items, {{MCP_NAME}}__create_item
---

# Agent Name

## Purpose

Clear description of what this agent does.

## Usage

Example usage patterns.

## Tool Usage Examples

```yaml
# Example MCP tool usage
Tool: {{MCP_NAME}}__search_items
Parameters:
  query: "search term"
  types: ["issue"]
```
```

**Key Guidelines**:

1. **Always use placeholders for MCP tools**:
   - ✅ `{{MCP_NAME}}__get_items`
   - ❌ `mcp__shirokuma-kb__get_items`

2. **Test your templates**:
   ```bash
   # After editing .shirokuma/agents/
   shirokuma-kb setup --rebuild

   # Verify placeholders replaced
   grep -r '{{MCP_NAME}}' .claude/agents/ || echo "All good!"
   ```

3. **Use clear, descriptive names**:
   - File names: `kebab-case.md`
   - Agent names: Title Case
   - Tool names: lowercase with underscores

4. **Include usage examples**:
   - Show typical tool invocations
   - Document parameters clearly
   - Provide context about when to use

### Creating Command Definitions

Commands live in `.shirokuma/commands/` and follow similar patterns.

**Template Structure** (`.shirokuma/commands/kuma/my-command.md`):

```markdown
---
description: Brief description of command purpose
argument-hint: "'arg1' | arg2 <value>"
allowed-tools: Read, Write, {{MCP_NAME}}__create_item
---

# /kuma:my-command - Command Title

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Clear description of what this command does.

## Usage

```bash
/kuma:my-command arg1
/kuma:my-command arg2 value
```

## MCP Storage

```yaml
# Store result in shirokuma-kb
Tool: {{MCP_NAME}}__create_item
Parameters:
  type: "custom_type"
  title: "Title"
  content: "Content"
```
```

**Key Guidelines**:

1. **Use placeholders consistently**
2. **Document all arguments and options**
3. **Include MCP storage patterns**
4. **Provide usage examples**

### Testing Template Changes

Before submitting a PR with template changes:

```bash
# 1. Edit templates in .shirokuma/
vim .shirokuma/agents/my-agent.md

# 2. Rebuild .claude/ files
shirokuma-kb setup --rebuild

# 3. Verify no hardcoded references
grep -r 'mcp__shirokuma-kb__' .shirokuma/ && echo "❌ Found hardcoded!" || echo "✅ All good!"

# 4. Test with custom MCP name
mkdir -p /tmp/test-project
cd /tmp/test-project
shirokuma-kb setup --mcp-name test-kb

# 5. Verify custom name applied
grep -r 'mcp__test-kb__' .claude/agents/ | head -3
```

### Placeholder Reference

**Available Placeholders**:

| Placeholder | Description | Example Output |
|-------------|-------------|----------------|
| `{{MCP_NAME}}` | MCP tool prefix | `mcp__shirokuma-kb` (default)<br>`mcp__my-kb` (custom) |
| `{{WORKSPACE_FOLDER}}` | Project root path | `/home/user/my-project` |

**Future Placeholders** (not yet implemented):
- `{{PROJECT_NAME}}` - User's project name
- `{{DATA_DIR}}` - Data directory path
- `{{EXPORT_DIR}}` - Export directory path

## Code Style

### TypeScript Guidelines

- Use strict mode: `"strict": true`
- Prefer `interface` over `type` for object shapes
- Use `const` for immutable values
- Use descriptive variable names (no abbreviations)
- Add JSDoc comments for public APIs

### File Organization

```
src/
├── cli/              # CLI commands
├── mcp/              # MCP server implementation
├── setup/            # Setup utilities
│   ├── setup-command.ts
│   ├── placeholder-engine.ts
│   └── file-operations.ts
├── database/         # Database models and migrations
└── utils/            # Shared utilities

tests/
├── cli/              # CLI tests
├── mcp/              # MCP tests
└── setup/            # Setup tests

.shirokuma/
├── agents/           # Agent templates (with placeholders)
├── commands/         # Command templates (with placeholders)
└── templates/        # Configuration templates
```

### Naming Conventions

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces: `PascalCase` (no `I` prefix)
- Types: `PascalCase`

## Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feat/my-new-feature
   ```

2. **Make your changes**:
   - Follow coding standards
   - Add tests for new features
   - Update documentation

3. **Run checks**:
   ```bash
   npm run lint        # ESLint check
   npm test            # Run all tests
   npm run build       # Verify build works
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(scope): add new feature"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feat/my-new-feature
   # Create PR on GitHub
   ```

6. **PR Requirements**:
   - Clear description of changes
   - Link to related issue
   - Tests passing
   - Documentation updated
   - No linting errors

## Testing Guidelines

### Unit Tests

- Place tests next to source files: `*.spec.ts`
- Use Vitest framework
- Mock external dependencies
- Test edge cases and error handling

**Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { PlaceholderEngine } from './placeholder-engine.js';

describe('PlaceholderEngine', () => {
  it('should replace MCP_NAME placeholder', () => {
    const engine = new PlaceholderEngine('my-kb', '/project');
    const result = engine.replace('Tool: {{MCP_NAME}}__get_items');
    expect(result).toBe('Tool: mcp__my-kb__get_items');
  });
});
```

### Integration Tests

- Test complete workflows
- Use temporary test databases
- Clean up after tests
- Test MCP API interactions

## Documentation Guidelines

- Keep README.md up to date
- Document all new features
- Include usage examples
- Update API documentation
- Add inline comments for complex logic

## Code Review Checklist

Before submitting or reviewing:

- [ ] Code follows style guidelines
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No hardcoded MCP references in templates
- [ ] Placeholders used correctly
- [ ] Commit messages follow conventions
- [ ] No console.log left in code
- [ ] Error handling implemented
- [ ] Types properly defined

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/shirokuma-kb/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/shirokuma-kb/discussions)
- **Documentation**: [README.md](./README.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
