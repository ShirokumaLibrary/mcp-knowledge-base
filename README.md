# SHIROKUMA Knowledge Base

AI-powered knowledge management system with MCP (Model Context Protocol) server for persistent memory and context management.

> **📌 Important**: This package is designed specifically for use with [Claude Code](https://claude.ai/code). It provides MCP server functionality that Claude Code uses internally through custom commands (`/kuma:*`) and specialized agents. While the CLI is available for direct use, the primary interface is through Claude Code's AI-driven commands.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install globally (recommended)
npm install -g @shirokuma-library/mcp-knowledge-base

# Or with specific version
npm install -g @shirokuma-library/mcp-knowledge-base@0.9.0
```

### Initial Setup

#### 1. Initialize Database

```bash
# Set data directory (required for persistent storage)
export SHIROKUMA_DATA_DIR="$HOME/.shirokuma/data"

# Optional: Set export directory for auto-export feature
export SHIROKUMA_EXPORT_DIR="$HOME/.shirokuma/exports"

# Create data directory and initialize database with seed data
shirokuma-kb migrate --seed

# This creates:
# - $SHIROKUMA_DATA_DIR/shirokuma.db
# - Initial schema with status definitions
# - Required seed data (statuses, etc.)

# Note: First time setup requires --seed flag
# Subsequent migrations can use just: shirokuma-kb migrate
```

#### 2. Configure MCP (for Claude Code)

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "shirokuma-kb": {
      "command": "shirokuma-kb",
      "args": ["serve"],
      "env": {
        "SHIROKUMA_DATA_DIR": "/home/user/.shirokuma/data",
        "SHIROKUMA_EXPORT_DIR": "/home/user/project/docs/export"
      }
    }
  }
}
```

**Note**: Use absolute paths in the configuration. Relative paths may cause issues.

#### 3. Start Using

```bash
# Start MCP server
shirokuma-kb serve

# Or use CLI directly
shirokuma-kb create -t issue -T "My first issue"
shirokuma-kb list --type issue
```

## 📖 Basic Usage

### CLI Commands

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
shirokuma-kb migrate                 # Run migrations (after initial setup)
shirokuma-kb migrate --reset --seed  # Reset and reseed database
```

### Environment Variables

Set environment variables directly or in `.mcp.json`:

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

## 🔧 Configuration

### Directory Structure

```
~/.shirokuma/
├── data/                 # Database files
│   └── shirokuma.db     # SQLite database
└── exports/             # Exported markdown files (optional)
```

### Multiple Environments

You can run multiple instances with different data directories:

```bash
# Development instance
SHIROKUMA_DATA_DIR=~/.shirokuma/data-dev shirokuma-kb serve

# Production instance
SHIROKUMA_DATA_DIR=~/.shirokuma/data-prod shirokuma-kb serve
```

## 📚 Item Types

| Type | Purpose | Example |
|------|---------|---------|
| `issue` | Bugs, tasks, features | "Fix authentication bug" |
| `knowledge` | Reusable information | "Docker setup guide" |
| `decision` | Project decisions | "Use PostgreSQL for database" |
| `session` | Work session logs | "2025-01-29 development session" |
| `pattern` | Code patterns | "Error handling pattern" |
| `handover` | Work transitions | "Feature X implementation complete" |

## 🎯 Status Workflow

| Status | Description | Closable |
|--------|-------------|----------|
| Open | New item | No |
| Ready | Ready to start | No |
| In Progress | Being worked on | No |
| Review | Under review | No |
| Testing | Being tested | No |
| Completed | Done | Yes |
| Closed | Closed | Yes |

## 🔍 Advanced Features

### Auto-Export

When `SHIROKUMA_EXPORT_DIR` is set, items are automatically exported to markdown files:

```bash
# Enable auto-export
export SHIROKUMA_EXPORT_DIR=~/Documents/knowledge-base
shirokuma-kb serve

# Files are created/updated automatically:
# ~/Documents/knowledge-base/issue/123-Fix_authentication_bug.md
# ~/Documents/knowledge-base/knowledge/124-React_best_practices.md
```

### Import from Export

```bash
# Import previously exported data
shirokuma-kb import ./backup

# Import specific types
shirokuma-kb import ./backup --type issue,knowledge
```

### Batch Operations

```bash
# Update multiple items
shirokuma-kb update --type issue --status Open --set-status "In Progress"

# Export with filters
shirokuma-kb export --type issue --status Completed --from 2025-01-01
```

## 🛠️ Troubleshooting

### Common Issues

**Database not found or missing statuses**
```bash
# Initialize database with required seed data
shirokuma-kb migrate --seed
```

**Permission denied**
```bash
# Check data directory permissions
ls -la ~/.shirokuma/data
chmod 755 ~/.shirokuma/data
```

**MCP not connecting**
1. Restart Claude Desktop after configuration changes
2. Check logs: `shirokuma-kb serve --debug`
3. Verify paths are absolute in configuration

### Reset Database

```bash
# Complete reset (WARNING: deletes all data)
shirokuma-kb migrate --reset --seed

# Backup before reset
shirokuma-kb export --dir ./backup-$(date +%Y%m%d)
shirokuma-kb migrate --reset --seed
shirokuma-kb import ./backup-*
```

## 📝 Examples

### Creating a Bug Report
```bash
shirokuma-kb create \
  -t issue \
  -T "Login fails with valid credentials" \
  -d "Users report authentication errors despite correct password" \
  --priority HIGH \
  --tags "bug,authentication,urgent"
```

### Documenting Knowledge
```bash
shirokuma-kb create \
  -t knowledge \
  -T "Setting up Docker for development" \
  -d "Step-by-step guide for Docker setup..." \
  --category "DevOps" \
  --tags "docker,setup,development"
```

### Work Session Tracking
```bash
# Start session
shirokuma-kb create \
  -t session \
  -T "Feature development - User authentication" \
  --status "In Progress"

# Update progress
shirokuma-kb update <id> \
  -d "Completed login component, starting on registration" \
  --status "In Progress"
```

## 🔗 Integration

### With Claude Code (Primary Usage)

Once configured, Claude Code can interact with the knowledge base through natural language:

- "Create an issue about the login bug"
- "Show me all open issues"
- "Search for Docker knowledge"
- "Update issue #123 to In Progress"

Claude Code also provides specialized custom commands and agents for advanced workflows. See the project documentation for details.

### With Scripts

```bash
#!/bin/bash
# Daily backup script
shirokuma-kb export --dir ./backups/$(date +%Y-%m-%d)

# Weekly report
shirokuma-kb list --type issue --status Completed --from $(date -d '7 days ago' +%Y-%m-%d)
```

## 📦 Version Information

- Current Version: 0.9.0
- Database Schema: v2
- MCP Protocol: 1.0

## 🆘 Support

- Report issues: [GitHub Issues](https://github.com/YourOrg/shirokuma-knowledge-base/issues)
- Documentation: [Wiki](https://github.com/YourOrg/shirokuma-knowledge-base/wiki)

## 📄 License

MIT License - See LICENSE file for details