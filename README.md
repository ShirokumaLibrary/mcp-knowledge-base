# SHIROKUMA Knowledge Base

> AI-powered knowledge management system with persistent memory for Claude Code

An MCP (Model Context Protocol) server that gives Claude Code permanent memory and context management across sessions. Designed specifically for AI-assisted development with issue-driven workflows, spec-driven development, and TDD methodology built in.

## Overview

**SHIROKUMA Knowledge Base** provides Claude Code with:

- **Persistent Memory**: Context survives across sessions - Claude remembers what you were working on
- **Issue-Driven Development**: Every change tracked with the "why" behind it
- **23+ Custom Commands**: `/kuma:start`, `/kuma:issue`, `/kuma:spec`, `/kuma:vibe`, and more
- **7 Specialist Agents**: Dedicated AI agents for testing, reviewing, research, and more
- **Knowledge Management**: Searchable database of decisions, patterns, and learnings
- **Automated Setup**: One command to configure everything

**Target Audience**: Developers using [Claude Code](https://claude.ai/code) for complex projects who need persistent context and structured workflows.

## Quick Start

### Prerequisites

- Node.js 18 or higher
- Claude Code (Desktop or Web)
- npm or yarn

### Installation & Setup

**Option 1: Automated Setup (Recommended)**

```bash
# Install globally
npm install -g @shirokuma-library/mcp-knowledge-base

# Run setup wizard (creates all configs automatically)
cd your-project
shirokuma-kb setup

# This creates:
# - .shirokuma/ directory with agents and commands
# - .claude/ directory with environment-specific files
# - .mcp.json with MCP server configuration
# - .env with environment variables
# - Database with initial schema
```

**Option 2: Manual Setup** (see [Advanced Configuration](#advanced-configuration))

### Setup Command Options

```bash
# Basic setup
shirokuma-kb setup

# Force overwrite existing files
shirokuma-kb setup --force

# Custom MCP instance name
shirokuma-kb setup --mcp-name my-kb

# Rebuild .claude/ files after editing .shirokuma/
shirokuma-kb setup --rebuild
```

**When to use:**
- `--force`: Updating to new version, resetting configuration
- `--mcp-name`: Multiple MCP instances, custom naming preferences
- `--rebuild`: After editing agent/command definitions in `.shirokuma/`

### First Steps

```bash
# 1. Restart Claude Code after setup
# (Required for MCP server to initialize)

# 2. Start your first session
/kuma:start

# 3. Create your first issue
/kuma:issue "Setup project documentation"

# 4. Begin work
/kuma:go

# 5. When done, finish session
/kuma:finish
```

### Upgrading from v0.9.0

If you're currently using v0.9.0:

```bash
# 1. Backup your data
shirokuma-kb export --dir ./backup-$(date +%Y%m%d)

# 2. Update package
npm update -g @shirokuma-library/mcp-knowledge-base

# 3. Run new setup (will detect existing installation)
shirokuma-kb setup

# 4. Verify migration
shirokuma-kb verify-setup
```

**What's new in v0.9.1:**
- Automated setup command with project initialization
- Package distribution system (`.shirokuma/` → `.claude/`)
- Custom MCP name support with validation
- Rebuild functionality for easy customization
- Placeholder replacement for portable configurations

## Claude Code Integration (Primary Interface)

### Overview

**Claude Code is the primary way to use SHIROKUMA.** While the CLI is available for automation, 90% of users interact through Claude Code's natural language interface and custom commands.

**Key Benefits:**
- Natural language queries: "Show me all open issues"
- Guided workflows through custom commands
- Specialist agents for complex tasks
- Context-aware suggestions
- Automatic knowledge capture

### Custom Commands (23+)

Commands provide structured workflows accessible via `/kuma:` prefix:

#### Session Management
- `/kuma:start` - Begin work session with context restoration
- `/kuma:finish` - End session with state preservation

#### Issue Management
- `/kuma:issue` - List, create, search issues
- `/kuma:issue "description"` - Create new issue
- `/kuma:issue 123` - Show issue details
- `/kuma:go [issue-id]` - Work on specific issue

#### Spec-Driven Development
- `/kuma:spec "feature"` - Create complete specification
- `/kuma:spec:quick "feature"` - Quick spec (1-3 days)
- `/kuma:spec:micro "change"` - Micro spec (<1 day)
- `/kuma:spec:design <spec-id>` - Technical design phase
- `/kuma:spec:tasks <spec-id>` - Break down into tasks
- `/kuma:spec:refine <spec-id>` - Iterate on spec
- `/kuma:spec:validate <spec-id>` - Verify completeness
- `/kuma:spec:req "feature"` - Requirements only (EARS format)
- `/kuma:spec:steering` - Manage project configuration

#### Vibe-Driven Development
- `/kuma:vibe "task"` - Adaptive development workflow
- `/kuma:vibe:code "feature"` - Implementation with steering compliance
- `/kuma:vibe:tdd "feature"` - Test-driven development cycle
- `/kuma:vibe:visual "component"` - Visual-driven development from mockups
- `/kuma:vibe:commit` - Smart commit with conventions
- `/kuma:vibe:spec <spec-id>` - Execute from existing spec

#### Other Commands
- `/kuma:commit` - Create conventional commit
- `/kuma:update` - Import user-edited documents
- `/kuma:security-review` - Security analysis
- `/kuma:create-command <name>` - Create new command

### Specialist Agents

Invoke with `@agent-name` in Claude Code:

- `@agent-shirokuma-programmer` - Implementation and coding
- `@agent-shirokuma-tester` - Test creation and TDD
- `@agent-shirokuma-reviewer` - Code review and quality
- `@agent-shirokuma-designer` - Architecture and design
- `@agent-shirokuma-researcher` - Technical research
- `@agent-shirokuma-issue-manager` - Issue management
- `@agent-shirokuma-knowledge-curator` - Knowledge organization
- `@agent-shirokuma-methodology-keeper` - Process compliance
- `@agent-shirokuma-system-harmonizer` - System consistency
- `@agent-mcp-api-tester` - MCP API testing

### Workflow Examples

#### Example 1: Bug Fix

```
1. /kuma:start
   → Loads current context from MCP

2. /kuma:issue "Login button not working on mobile"
   → Creates issue #123

3. /kuma:go 123
   → Begins TDD cycle for issue

4. [Make changes with Claude's help]

5. /kuma:commit
   → Auto-generates commit message

6. /kuma:finish
   → Saves state for next session
```

#### Example 2: New Feature with Spec

```
1. /kuma:start

2. /kuma:spec "User authentication with OAuth"
   → Creates complete specification with requirements, design, and tasks

3. /kuma:vibe:spec <spec-id>
   → Execute implementation from spec

4. /kuma:commit
   → Commit changes

5. /kuma:finish
```

#### Example 3: Quick Task

```
1. /kuma:go "Update README with new API endpoints"
   → Creates issue automatically and starts work

2. [Claude updates README]

3. /kuma:vibe:commit
   → Creates commit following conventions

4. Done! (No formal session needed for quick tasks)
```

## Core Concepts

### Persistent AI Memory

**The Problem**: Claude loses all context when sessions end. You have to re-explain your project every time.

**The Solution**: SHIROKUMA externalizes Claude's memory to an MCP-accessible database. Every decision, pattern, and context is preserved.

**How it works**:
1. During work, Claude saves decisions, knowledge, and state to MCP
2. Next session starts with `/kuma:start` - context automatically restored
3. Claude remembers: current issues, recent decisions, project patterns, work history

### Issue-Driven Development

**Principle**: Every code change should have a documented "why".

**Workflow**:
```
Create Issue → Work on Issue → Document Decision → Close Issue
```

**Benefits**:
- Historical context preserved
- Easy handoffs between team members (or AI sessions)
- Searchable project history
- Automatic knowledge capture

### Knowledge Management

**Item Types**:

| Type | Purpose | Example |
|------|---------|---------|
| `issue` | Bugs, features, tasks | "Fix authentication bug" |
| `knowledge` | Reusable information | "React hooks best practices" |
| `decision` | Project-specific choices | "Use PostgreSQL for database" |
| `session` | Work session logs | "2025-10-12 development session" |
| `pattern` | Code patterns & templates | "Error handling pattern" |
| `handover` | Work transitions | "Feature X implementation complete" |
| `spec` | Feature specifications | "User authentication spec" |
| `steering` | Project configuration | "Language rules configuration" |

**Search Strategies**:
- **Keyword Search**: TF-IDF-based text matching
- **Concept Search**: High-level category similarity
- **Embedding Search**: Semantic vector similarity
- **Hybrid Search**: Weighted combination (best results)

### TDD Methodology

Built-in Test-Driven Development workflow:

```
RED → GREEN → REFACTOR
```

**Automatic Enforcement**:
1. RED: Write failing tests first
2. GREEN: Minimal implementation to pass
3. REVIEW: Automatic code review by @agent-shirokuma-reviewer
4. REFACTOR: Apply improvements (if needed)

**Quality Gates**:
- Build verification (zero errors)
- Test verification (no new failures)
- Lint check (max 10 errors, configurable)
- Code review (max 3 iterations)

## Understanding the System

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Claude Code User                   │
│          (Types: /kuma:start)                   │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│         .claude/commands/start.md               │
│     (Generated with mcp__shirokuma-kb__)        │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│           MCP Server (shirokuma-kb)             │
│         Tools: create_item, get_item, etc.      │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│    Database (.shirokuma/data/shirokuma.db)      │
└─────────────────────────────────────────────────┘
```

### Dual-Directory System

**Why two directories?**

SHIROKUMA uses a master-slave architecture for portability:

#### `.shirokuma/` (Master files - Git-tracked)
- **Purpose**: Customizable, portable templates
- **Contains**: Agent and command definitions with placeholders
- **Placeholders**: `{{MCP_NAME}}`, `{{WORKSPACE_FOLDER}}`
- **Editing**: Safe to edit - these are YOUR files
- **Git**: Commit these files (portable across projects)

#### `.claude/` (Generated files - Git-ignored)
- **Purpose**: Environment-specific runtime files
- **Generated from**: `.shirokuma/` files with placeholders replaced
- **Editing**: Never edit directly (regenerated on setup --rebuild)
- **Git**: Ignore these files (generated per environment)

**Example:**

```markdown
# .shirokuma/agents/custom-agent.md (you edit this)
allowed-tools:
  - {{MCP_NAME}}__create_item
  - {{MCP_NAME}}__get_item

# .claude/agents/custom-agent.md (auto-generated)
allowed-tools:
  - mcp__shirokuma-kb__create_item
  - mcp__shirokuma-kb__get_item
```

**Customization Workflow**:

```bash
# 1. Edit master files
vi .shirokuma/agents/custom-agent.md

# 2. Rebuild generated files
shirokuma-kb setup --rebuild

# 3. Restart Claude Code
# (Claude now uses updated definitions)
```

### When to Use What

#### Claude Code (Primary - 90% of use cases)
- Session management: `/kuma:start`, `/kuma:finish`
- Issue tracking: `/kuma:issue`
- Spec-driven development: `/kuma:spec:*`
- Code generation: `/kuma:vibe:*`
- Natural language queries: "Show me open issues"

**Best for**: Interactive development, AI-assisted workflows

#### CLI (Secondary - 10% of use cases)
- Automation scripts: `shirokuma-kb export --cron`
- CI/CD integration: `shirokuma-kb verify-setup`
- Batch operations: `shirokuma-kb update --status`
- Initial setup: `shirokuma-kb setup`

**Best for**: Scripting, automation, DevOps workflows

## CLI Usage (Secondary Interface)

### Basic Commands

```bash
# Create items
shirokuma-kb create -t issue -T "Bug in login" -d "Users cannot authenticate"
shirokuma-kb create -t knowledge -T "React Best Practices"

# List items
shirokuma-kb list                    # List all recent items
shirokuma-kb list --type issue       # List issues only
shirokuma-kb list --status Open      # List open items

# Search
shirokuma-kb search "authentication"
shirokuma-kb search "bug" --type issue

# Export data
shirokuma-kb export                  # Export all to ./exports
shirokuma-kb export --dir ./backup   # Export to specific directory

# Database management
shirokuma-kb migrate --seed          # Initial setup with seed data
shirokuma-kb migrate                 # Run migrations
shirokuma-kb migrate --reset --seed  # Reset and reseed database

# Verification
shirokuma-kb verify-setup            # Check configuration
```

### Environment Variables

```bash
# Data directory (default: ~/.shirokuma/data)
SHIROKUMA_DATA_DIR=/path/to/data

# Export directory for auto-export feature
SHIROKUMA_EXPORT_DIR=/path/to/exports

# AI processing timeout (milliseconds, default: 3000)
SHIROKUMA_AI_TIMEOUT=5000

# Database URL (advanced users)
DATABASE_URL=file:/path/to/database.db
```

### Scripting Examples

```bash
#!/bin/bash
# Daily backup script
shirokuma-kb export --dir ./backups/$(date +%Y-%m-%d)

# Weekly report
shirokuma-kb list --type issue --status Completed \
  --from $(date -d '7 days ago' +%Y-%m-%d)

# Automated cleanup
shirokuma-kb update --type issue --status Closed \
  --older-than 90d --set-status Archived
```

## Configuration

### Environment Variables

Set in `.env` file (created by `shirokuma-kb setup`):

```bash
# shirokuma-kb data directory
SHIROKUMA_DATA_DIR=${workspaceFolder}/.shirokuma/data

# Export directory (optional)
# When set, items are automatically exported to Markdown files
SHIROKUMA_EXPORT_DIR=${workspaceFolder}/docs/export
```

### MCP Configuration

Created by `shirokuma-kb setup` in `.mcp.json`:

```json
{
  "mcpServers": {
    "shirokuma-kb": {
      "command": "shirokuma-kb",
      "args": ["serve"],
      "env": {
        "SHIROKUMA_DATA_DIR": "${workspaceFolder}/.shirokuma/data",
        "SHIROKUMA_EXPORT_DIR": "${workspaceFolder}/docs/export"
      }
    }
  }
}
```

### Directory Structure

```
your-project/
├── .shirokuma/                    # Master files (Git-tracked)
│   ├── agents/                    # Agent definitions (with placeholders)
│   ├── commands/                  # Command definitions (with placeholders)
│   ├── data/                      # Database storage (Git-ignored)
│   │   └── shirokuma.db
│   └── templates/                 # Configuration templates
│       ├── .mcp.json
│       └── .env
├── .claude/                       # Generated files (Git-ignored)
│   ├── agents/                    # Replaced agent definitions
│   └── commands/                  # Replaced command definitions
├── docs/
│   └── export/                    # Auto-exported items (Git-tracked)
│       ├── issue/
│       ├── session/
│       └── .system/
├── .env                           # Environment variables (Git-ignored)
├── .mcp.json                      # MCP configuration (Git-tracked)
└── .gitignore                     # Git ignore rules
```

### Advanced Configuration

#### Multiple Environments

Run multiple instances with different data directories:

```bash
# Development instance
SHIROKUMA_DATA_DIR=~/.shirokuma/data-dev shirokuma-kb serve

# Production instance
SHIROKUMA_DATA_DIR=~/.shirokuma/data-prod shirokuma-kb serve
```

#### Custom MCP Names

Use custom MCP instance names:

```bash
# Setup with custom name
shirokuma-kb setup --mcp-name my-kb

# This changes:
# - {{MCP_NAME}} → mcp__my-kb
# - .mcp.json server name → "my-kb"
```

#### Manual Setup (Advanced)

If you prefer manual configuration:

```bash
# 1. Set data directory
export SHIROKUMA_DATA_DIR="$HOME/.shirokuma/data"
export SHIROKUMA_EXPORT_DIR="$HOME/.shirokuma/exports"

# 2. Initialize database
shirokuma-kb migrate --seed

# 3. Create .mcp.json manually (see example above)

# 4. Copy files from package
cp -r $(npm root -g)/@shirokuma-library/mcp-knowledge-base/.shirokuma .
```

### Auto-Export Feature

When `SHIROKUMA_EXPORT_DIR` is set, items are automatically exported:

```bash
# Enable auto-export
export SHIROKUMA_EXPORT_DIR=~/Documents/knowledge-base
shirokuma-kb serve

# Files are created/updated automatically:
# ~/Documents/knowledge-base/issue/123-Fix_authentication_bug.md
# ~/Documents/knowledge-base/knowledge/124-React_best_practices.md
```

## Status Workflow

| Status | Description | Closable |
|--------|-------------|----------|
| Open | New item | No |
| Specification | Gathering requirements | No |
| Ready | Ready to start | No |
| In Progress | Being worked on | No |
| Review | Under review | No |
| Testing | Being tested | No |
| Pending | Waiting on external factor | No |
| Completed | Done | Yes |
| Closed | Closed without completion | Yes |
| Canceled | No longer relevant | Yes |
| Rejected | Won't implement | Yes |

**Typical Flow**: Open → Ready → In Progress → Review → Testing → Completed

## Troubleshooting

**Quick Links:**
- [Setup fails with permission error](#permission-errors)
- [Claude Code can't find commands](#mcp-not-connecting)
- [Database migration fails](#database-issues)
- [Custom commands not working](#placeholder-issues)

### Common Issues

#### Database not found or missing statuses

```bash
# Initialize database with required seed data
shirokuma-kb migrate --seed
```

#### Permission denied {#permission-errors}

```bash
# Check data directory permissions
ls -la ~/.shirokuma/data
chmod 755 ~/.shirokuma/data
```

#### MCP not connecting {#mcp-not-connecting}

1. Restart Claude Code after configuration changes
2. Check logs: `shirokuma-kb serve --debug`
3. Verify paths are absolute in `.mcp.json`
4. Verify MCP server is in configuration:
   ```bash
   shirokuma-kb verify-setup
   ```

#### Placeholder issues {#placeholder-issues}

If commands show `{{MCP_NAME}}` instead of actual MCP name:

```bash
# Rebuild generated files
shirokuma-kb setup --rebuild

# Restart Claude Code
```

#### Database issues {#database-issues}

```bash
# Complete reset (WARNING: deletes all data)
shirokuma-kb migrate --reset --seed

# Backup before reset
shirokuma-kb export --dir ./backup-$(date +%Y%m%d)
shirokuma-kb migrate --reset --seed
shirokuma-kb import ./backup-*
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=shirokuma:*
shirokuma-kb serve

# Check verification
shirokuma-kb verify-setup
```

## Advanced Topics

### Package Distribution System

The automated setup system handles:

1. **File Distribution**: Copies master files from package to project
2. **Placeholder Replacement**: Replaces `{{MCP_NAME}}` and `{{WORKSPACE_FOLDER}}`
3. **Environment Configuration**: Creates `.env` and `.mcp.json`
4. **Database Initialization**: Runs migrations with seed data
5. **Verification**: Checks all components are working

**Technical Details**:
- Master files stored in package's `.shirokuma/` directory
- Placeholder engine processes all `.md` files recursively
- MCP config manager merges with existing `.mcp.json`
- File operations include backup and rollback capabilities

### Template Customization

All agent and command definitions use placeholders that adapt to your configuration:

**Available Placeholders**:
- `{{MCP_NAME}}` - MCP tool prefix (e.g., `mcp__shirokuma-kb`, `mcp__my-kb`)
- `{{WORKSPACE_FOLDER}}` - Project root path

**Usage Example** (in `.shirokuma/agents/*.md`):
```markdown
tools: {{MCP_NAME}}__get_items, {{MCP_NAME}}__create_item
```

**After `shirokuma-kb setup --mcp-name my-kb`** (in `.claude/agents/*.md`):
```markdown
tools: mcp__my-kb__get_items, mcp__my-kb__create_item
```

**Workflow**:
1. Edit master files in `.shirokuma/agents/` or `.shirokuma/commands/`
2. Use placeholders like `{{MCP_NAME}}__` for MCP tool references
3. Run `shirokuma-kb setup --rebuild` to regenerate `.claude/` files
4. Placeholders replaced based on your MCP configuration

**Benefits**:
- Share templates across projects with different MCP names
- Easy maintenance: Edit once in `.shirokuma/`, apply everywhere
- Version control: Commit `.shirokuma/`, ignore `.claude/` (generated files)
- Custom configurations: `--mcp-name` adapts templates automatically

### CI/CD Integration

```yaml
# .github/workflows/knowledge-export.yml
name: Export Knowledge Base
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install shirokuma-kb
        run: npm install -g @shirokuma-library/mcp-knowledge-base
      - name: Export data
        run: shirokuma-kb export --dir ./docs/export
      - name: Commit changes
        run: |
          git config user.name "Bot"
          git config user.email "bot@example.com"
          git add docs/export
          git commit -m "docs: daily knowledge base export"
          git push
```

### Batch Operations

```bash
# Update multiple items
shirokuma-kb update --type issue --status Open --set-status "In Progress"

# Export with filters
shirokuma-kb export --type issue --status Completed --from 2025-01-01

# Import previously exported data
shirokuma-kb import ./backup

# Import specific types
shirokuma-kb import ./backup --type issue,knowledge
```

## Version Information

- **Current Version**: 0.9.1
- **Database Schema**: v2
- **MCP Protocol**: 1.0
- **Node.js**: 18+ required

## Support & Resources

- **Documentation**: [GitHub Wiki](https://github.com/ShirokumaLibrary/mcp-knowledge-base/wiki)
- **Issues**: [GitHub Issues](https://github.com/ShirokumaLibrary/mcp-knowledge-base/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ShirokumaLibrary/mcp-knowledge-base/discussions)

## Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/ShirokumaLibrary/mcp-knowledge-base.git
cd mcp-knowledge-base

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run locally
npm run serve
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/setup/setup-command.test.ts

# Watch mode
npm run test:watch
```

### Guidelines

- Follow TDD: Write tests before implementation
- Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Update documentation with code changes
- Ensure all tests pass before submitting PR
- Run `npm run lint:errors` to check code quality

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Built with** ❄️ **by the SHIROKUMA Library team**
