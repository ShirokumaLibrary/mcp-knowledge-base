# ai-config - Generate Project Configuration

## Usage
```
/ai-config [action]
```

Actions:
- `/ai-config generate` - Analyze project and generate configuration
- `/ai-config update` - Update existing configuration
- `/ai-config validate` - Validate current configuration

## Task

@.shirokuma/configs/lang.md

### Purpose

This command analyzes the current project structure and generates or updates the configuration files in `.shirokuma/configs/` directory, which contains comprehensive project-specific settings and patterns for all AI agents.

### Workflow

#### Generate Configuration
```yaml
1. Analyze project structure
2. Detect technology stack
3. Identify conventions and patterns
4. Find MCP instance if exists
5. Generate configuration files:
   - .shirokuma/configs/lang.md (language settings)
   - .shirokuma/configs/core.md (project overview)
   - .shirokuma/configs/build.md (build configuration)
   - .shirokuma/configs/test.md (test configuration)
   - .shirokuma/configs/conventions.md (coding standards)
```

#### Update Configuration
```yaml
1. Read existing configuration files from .shirokuma/configs/
2. Re-analyze project
3. Merge new findings
4. Preserve manual customizations
5. Update individual configuration files
```

#### Validate Configuration
```yaml
1. Check configuration exists
   - Verify .shirokuma/configs/ directory exists
   - Check all 5 config files are present
   - Validate markdown syntax
   - Ensure required sections present

2. Verify all referenced files
   - Files referenced in core.md exist
   - Build commands in build.md are valid
   - Test commands in test.md work

3. Validate MCP connections
   - Test MCP prefix format
   - Verify tool list completeness
   - Check MCP server accessibility

4. Test commands if possible
   - Run build_command with --dry-run or --help
   - Check if test_command executable exists
   - Verify lint_command availability
   - Confirm package manager presence

5. Report validation results
   - List all found issues
   - Suggest fixes for problems
   - Indicate confidence level
   - Mark TODO items needing attention
```

**Validation Output Example**:
```markdown
## Configuration Validation Report

### ✅ Valid
- Project configuration file exists
- YAML syntax is correct
- All referenced files found

### ⚠️ Warnings
- build_command not tested (no --dry-run option)
- MCP server not running (cannot verify tools)

### ❌ Issues
- TODO: test_command needs to be configured
- File not found: docs/architecture.md

### Recommendations
1. Update test_command in conventions section
2. Start MCP server to verify tool list
3. Create missing documentation files
```

### Agent Selection

The command uses the specialized config-investigator agent to perform deep project analysis.

```
Task: Use config-investigator to analyze project and generate configuration
Purpose: Create project-specific settings for AI agents
Operations:
  1. Scan project structure
  2. Detect languages and frameworks
  3. Find build/test commands
  4. Identify naming conventions
  5. Detect MCP configurations
  6. Generate comprehensive config
```

### Configuration File Structure

The configuration is split across multiple focused files:

#### .shirokuma/configs/lang.md
```markdown
## Language Usage Rules

### Chat Response
- Japanese for all user interactions
### Code Comments
- English for inline comments
### Documentation
- Technical docs in English
- User guides in Japanese
```

#### .shirokuma/configs/core.md
```markdown
# Project Core Configuration

## Project Overview
- Name: [Project Name]
- Version: [Version]
- Description: [Description]

## Technology Stack
- Language: [Language]
- Runtime: [Runtime]
- Database: [Database]
- Frameworks: [List]

## Directory Structure
[Project structure details]

## Data Models
[Core data schemas]
```

#### .shirokuma/configs/build.md
```markdown
# Build Configuration

## Build Commands
- build: [command]
- dev: [command]

## TypeScript Configuration
[tsconfig.json details]

## Dependencies
[Key dependencies]
```

#### .shirokuma/configs/test.md
```markdown
# Testing Configuration

## Test Commands
- test: [command]
- test:coverage: [command]

## Pre-flight Checks
[Validation steps]

## Quality Gates
[Coverage requirements]
```

#### .shirokuma/configs/conventions.md
```markdown
# Coding Conventions

## File Naming
- Pattern: kebab-case

## Code Style
- Indent: 2 spaces
- Quotes: single

## Git Conventions
[Commit message format]
```

### Error Handling

- If no project detected, create minimal config
- If MCP not found, omit MCP section
- If commands not found, use placeholders
- Always create valid YAML structure

### Success Indicators

- All 5 configuration files created/updated in .shirokuma/configs/
- All project specifics captured
- Valid markdown syntax
- Agent compatibility verified

This command ensures all AI agents have accurate project context for optimal performance.

### Template Usage

1. Run `/ai-config generate` to auto-detect your project settings
2. Configuration files will be created in `.shirokuma/configs/`
3. Review and customize each file as needed
4. Run `/ai-config validate` to check configuration

### Configuration File Locations

```
.shirokuma/
├── configs/            # ✅ PROJECT-SPECIFIC (modifiable)
│   ├── README.md       # Guide for config files
│   ├── lang.md         # Language settings
│   ├── core.md         # Project overview
│   ├── build.md        # Build configuration
│   ├── test.md         # Test configuration
│   └── conventions.md  # Coding standards
│
└── rules/              # ⚠️ UNIVERSAL (read-only, DO NOT MODIFY)
    ├── mcp-rules.md    # MCP methodology
    └── tdd-methodology.md # TDD principles
```

## ⚠️ Critical Warning

**NEVER modify files in `.shirokuma/rules/`** - These are:
- Shared across all SHIROKUMA users
- Updated only by methodology maintainers
- Should be treated as read-only reference

This command ONLY manages `.shirokuma/configs/` files. The AI agents will reference both configs (project-specific) and rules (universal methodology).