---
description: Smart commit creation with automatic convention compliance
argument-hint: "[message]"
allowed-tools: Bash, mcp__shirokuma-kb__search_items
---

# /kuma:vibe:commit - Smart Commit Creation

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Intelligent commit creation that automatically follows project conventions, analyzes changes, and generates appropriate commit messages.

## Usage

```bash
/kuma:vibe:commit                    # Auto-generate message
/kuma:vibe:commit "custom message"   # Use custom message with formatting
```

## Commit Process

### 1. Change Analysis
```bash
# Analyze staged and unstaged changes
git status
git diff --cached
git diff
```

### 2. Convention Detection
- Load Git Workflow steering
- Identify commit format
- Get valid types and scopes

### 3. Message Generation

**Process:**
1. Analyze changes from git diff
2. Load commit format from Git Workflow steering document
3. Get valid commit types from configuration
4. Review recent 5 commits for style consistency
5. Generate appropriate commit message based on:
   - Changed files and their patterns
   - Commit format from steering
   - Valid types and scopes
   - Recent commit style

### 4. Validation
- Check message format
- Verify type validity
- Ensure scope accuracy

### 5. Commit Creation

**IMPORTANT**: Never add AI signatures or Claude Code references to commit messages.

```bash
git commit -m "type(scope): description

- Detail 1
- Detail 2

Closes #issue"
```

**DO NOT INCLUDE**:
- 🤖 Generated with Claude Code
- Co-Authored-By: Claude
- Any AI-related signatures or attributions

## Steering Integration

Automatically applies Git Workflow Standards:

```yaml
# From steering document
Commit Format:
  types: [feat, fix, docs, style, refactor, test, chore]
  scopes: [mcp, cli, typeorm, ai, commands]
  rules:
    - Atomic commits required
    - Reference issues when applicable
    - NO AI signatures or Claude references
    - Use English for commit messages
    - NO "Generated with Claude Code" signatures
```

## Smart Features

### Change Classification

**Logic for determining commit type:**
- **feat**: New files with corresponding tests
- **test**: Only test files modified
- **fix**: Bug fixes identified in changes
- **docs**: Only documentation files changed
- **refactor**: Code structure changes without behavior modification
- **style**: Formatting changes only
- **chore**: Build, config, or dependency updates

### Scope Detection

**Automatic scope detection from file paths:**
- **mcp**: All files in src/mcp/ directory
- **cli**: All files in src/cli/ directory
- **typeorm**: Files containing 'entity' in path
- **commands**: Files in .shirokuma/commands/
- **agents**: Files in .claude/agents/
- **config**: Configuration file changes
- **Mixed changes**: Use most significant scope or omit

### Issue Linking

**Automatic issue detection:**
1. Check current branch name for issue pattern (e.g., issue-123, fix-456)
2. Search commit message for issue references
3. Check if working on tracked issue from MCP
4. Add appropriate closing reference:
   - `Closes #123` for features
   - `Fixes #456` for bugs
   - `Part of #789` for partial work

## Message Examples

### Feature Commit
```
feat(mcp): add user authentication API

- Implement JWT token generation
- Add login and logout endpoints
- Include refresh token mechanism

Closes #123
```

### Bug Fix
```
fix(cli): correct validation error handling

- Fix undefined error in validateType
- Add proper error messages
- Include stack trace in debug mode

Fixes #456
```

### Refactoring
```
refactor(services): extract repository pattern

- Move data access to repositories
- Simplify service layer logic
- Improve testability

Part of #789
```

## Quality Checks

### Pre-Commit
- Verify ESLint passes
- Check TypeScript compilation
- Run affected tests

### Message Validation
- Format compliance
- Type validity
- Scope accuracy
- Length limits

## Interactive Mode

When no message provided:
1. Show change summary
2. Suggest message
3. Allow editing
4. Confirm before commit

```markdown
## Commit Summary
Files changed: 5
Insertions: +120
Deletions: -45

## Suggested Message
feat(auth): implement user session management

## Edit? (y/n)
```

## Best Practices

1. **Atomic Commits**: One logical change per commit
2. **Clear Messages**: Describe what and why
3. **Issue References**: Link to tracking system
4. **No AI Signatures**: Remove automated signatures
5. **English Only**: Maintain consistency

## Error Recovery

### Common Issues
- **Lint Errors**: Fix before committing
- **Test Failures**: Resolve or exclude
- **Message Format**: Correct to match convention
- **Unstaged Changes**: Stage or stash