# .shirokuma/configs - Configuration Files Guide

This directory contains project-specific configuration files that define how the SHIROKUMA project operates.

## File Structure and Purpose

### 📝 lang.md - Language Settings
**Purpose**: Define language usage rules for the project
**Content**:
- Chat response language (Japanese/English)
- Code comment language
- Documentation language
- Error message language

### 🏗️ core.md - Core Project Configuration
**Purpose**: Define fundamental project settings
**Content**:
- Project name and version
- Project overview and description
- Technology stack details
- Directory structure
- Data models and schemas
- AI features configuration
- Development principles

### 🔨 build.md - Build Configuration
**Purpose**: Define build and compilation settings
**Content**:
- Build commands
- TypeScript configuration
- ESLint configuration
- Build output structure
- Dependencies list
- Pre-build checklist
- Troubleshooting guides

### 🧪 test.md - Testing Configuration
**Purpose**: Define testing strategies and commands
**Content**:
- Pre-flight checks
- Test commands
- Manual testing procedures
- Continuous integration settings
- Test organization structure
- Common test scenarios
- Debugging strategies
- Quality gates

### 📐 conventions.md - Coding Conventions
**Purpose**: Define code style and standards
**Content**:
- File naming rules (kebab-case requirement)
- Code style settings (indentation, quotes, line length)
- TypeScript conventions
- Database conventions
- Error handling patterns
- Comment conventions
- Git commit conventions
- Module conventions

## Usage by AI Agents

These configuration files are referenced by:
- **Commands**: `/ai-code`, `/ai-design`, `/ai-go`
- **Agents**: All shirokuma-* agents
- **Purpose**: Ensure consistent behavior across all AI operations

## Maintenance

### Who Updates These Files
- **shirokuma-methodology-keeper**: Validates and suggests improvements
- **shirokuma-system-harmonizer**: Ensures consistency across configs
- **Human maintainers**: Make final decisions on config changes

### When to Update
- When project structure changes
- When new tools or dependencies are added
- When coding standards evolve
- When build/test processes change

## Important Notes

1. **These are project-specific**: Different from generic rules in `.shirokuma/rules/`
2. **Version controlled**: Changes should be tracked in Git
3. **AI reference**: All AI agents should reference these for project context
4. **Single source of truth**: Avoid duplicating this information elsewhere

## Config vs Rules

### `.shirokuma/configs/` (Project-specific)
- **Purpose**: Settings for THIS specific project
- **Update Policy**: Can be freely modified for project needs
- **Ownership**: Project team
- **Examples**: 
  - `configs/lang.md`: "This project uses Japanese for chat"
  - `configs/build.md`: "This project uses npm run build"

### `.shirokuma/rules/` (Universal)
- **Purpose**: Methodology for ALL SHIROKUMA projects
- **Update Policy**: ⚠️ DO NOT MODIFY - Shared across all users
- **Ownership**: SHIROKUMA methodology maintainers
- **Examples**:
  - `rules/mcp-rules.md`: "How to use MCP in any project"
  - `rules/tdd-methodology.md`: "Universal TDD principles"

## ⚠️ IMPORTANT: Never Update Rules

The `.shirokuma/rules/` directory contains universal methodology that is:
1. **Shared across all SHIROKUMA users**
2. **Version controlled separately**
3. **Updated only by methodology maintainers**
4. **Should be treated as read-only**

If you need project-specific variations:
- Add them to `.shirokuma/configs/`
- Reference the base rule and document the variation
- Never modify the original rule files