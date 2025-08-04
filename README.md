# Shirokuma MCP Knowledge Base

**Model Context Protocol (MCP) server for comprehensive knowledge management with AI-optimized dual-storage architecture.**

📦 **npm**: [@shirokuma-library/mcp-knowledge-base](https://www.npmjs.com/package/@shirokuma-library/mcp-knowledge-base)  
🐙 **GitHub**: [ShirokumaLibrary/mcp-knowledge-base](https://github.com/ShirokumaLibrary/mcp-knowledge-base)  
🚀 **Current Version**: 0.7.8

## 🎯 Core Features

- **Dual Storage Architecture**: Markdown files for persistence + SQLite for search
- **AI-Optimized Design**: Structured for AI processing with high information density
- **Semantic Code Search**: Natural language search through your codebase
- **Unified Content Management**: Issues, plans, documents, knowledge, sessions, and daily summaries
- **Dynamic Type System**: Create custom content types to extend functionality
- **Version Tracking**: Track versions for all content items
- **Cross-Content Relations**: Link related items across different types

## 📦 Installation

### Global Installation (Recommended)

```bash
# Install globally
sudo npm install -g @shirokuma-library/mcp-knowledge-base

# Update to latest version
sudo npm update -g @shirokuma-library/mcp-knowledge-base

# Install specific version
sudo npm install -g @shirokuma-library/mcp-knowledge-base@0.7.8
```

### Local Installation

```bash
npm install @shirokuma-library/mcp-knowledge-base
```

## 🚀 Quick Start

### Command Line Interface

```bash
# Start MCP server (default: .database directory)
shirokuma-mcp-knowledge-base

# Use custom data directory
shirokuma-mcp-knowledge-base --data /path/to/data

# Rebuild database from markdown files
shirokuma-mcp-knowledge-base-rebuild

# Run with MCP Inspector for debugging
shirokuma-mcp-knowledge-base --inspect

# Show all options
shirokuma-mcp-knowledge-base --help
```

### MCP Client Configuration

#### Claude Desktop (Recommended)

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "shirokuma-knowledge-base": {
      "command": "shirokuma-mcp-knowledge-base",
      "args": ["--data", ".database"]
    }
  }
}
```

#### Environment Variables

```bash
# Optional: Custom database location
export DATABASE_ROOT="/path/to/data"

# Optional: Logging level
export LOG_LEVEL="info"  # debug, info, warn, error

# Optional: Response language (for Claude AI integration)
export SHIROKUMA_LANG="Japanese"  # English (default), Japanese
```

## 📊 Content Types

### Special Types (Built-in, Cannot be deleted)

| Type | Purpose | Key Features |
|------|---------|-------------|
| **sessions** | Work session logs | Timestamp-based ID (YYYY-MM-DD-HH.MM.SS.sss), progress tracking |
| **dailies** | Daily summaries | Date-based ID (YYYY-MM-DD), one per day limit |

### Default Types (Pre-configured, Can be deleted)

| Type | Purpose | Key Features |
|------|---------|-------------|
| **issues** | Bug tracking, tasks | Status, priority, version tracking |
| **plans** | Project planning | Timelines, milestones, dependencies |
| **docs** | Technical documentation | Structured content, cross-references |
| **knowledge** | How-to guides, best practices | Searchable knowledge base |

### Custom Types

You can create custom types to fit your workflow. For example, you might create:
- `decisions` - For architecture decision records
- `meetings` - For meeting notes
- `research` - For research findings

Each custom type inherits from either "tasks" (with status/priority) or "documents" (content-focused).

## 🔧 Available Tools

### Content Management
- **create_item** - Create issues, plans, docs, knowledge, sessions, or dailies
- **get_items** - Retrieve items with filtering by type, status, dates
- **update_item** - Update existing items
- **delete_item** - Delete items
- **search_items** - Full-text search across all content
- **search_items_by_tag** - Find items with specific tags

### Code Search
- **index_codebase** - Index your code for semantic search
- **search_code** - Search code using natural language
- **get_related_files** - Find files related to a specific file
- **get_index_status** - Check indexing status

### Organization
- **create_type** - Create custom content types
- **get_types** - List all available types
- **create_tag** - Create new tags
- **get_tags** - List all tags with usage counts

### State Management
- **get_current_state** - Retrieve persistent application state
- **update_current_state** - Save state for continuity between sessions

## 📚 Documentation

### For Users
- [API Reference](docs/user/api-reference.md) - Complete MCP tools reference
- [Quick Start](docs/user/quickstart.md) - Get started in 5 minutes
- [Usage Examples](docs/user/usage.md) - Common patterns and examples
- [Installation Guide](docs/user/installation.md) - Detailed setup instructions
- [FAQ](docs/user/faq.md) - Frequently asked questions

### For Developers
- [Architecture](docs/developer/architecture.md) - System design and implementation
- [Development Setup](docs/developer/setup.md) - Development environment setup
- [Testing Guide](docs/developer/testing-guide.md) - Test strategies and practices
- [Contributing](docs/developer/contributing.md) - Contribution guidelines
- [Type System](docs/developer/type-system.md) - Dynamic type system details

### 日本語ドキュメント
- [README](docs/ja/README.md) - プロジェクト概要
- [API リファレンス](docs/ja/user/api-reference.md) - API 完全ガイド
- [クイックスタート](docs/ja/user/quickstart.md) - 5分で始める
- [インストール](docs/ja/user/installation.md) - セットアップ手順

## 💻 Requirements

- Node.js 18 or higher
- npm or yarn
- SQLite3 (included via better-sqlite3)

## 🔨 Maintenance & Migration

### Database Rebuild

Rebuild the SQLite database from markdown files:

```bash
# Global command (v0.7.8+)
shirokuma-mcp-knowledge-base-rebuild

# Or via npm script
npm run rebuild-db
```

**When to rebuild:**
- After version updates with schema changes
- If search results seem incorrect
- Database corruption or sync issues

**What it preserves:**
- All markdown content files
- Custom types and statuses
- Tags and relationships
- File indexes (will re-index)

### Data Migration

For upgrading from older versions:

```bash
# Migrate to unified related field format
shirokuma-mcp-knowledge-base-migrate-related

# Skip backup creation
shirokuma-mcp-knowledge-base-migrate-related --no-backup
```


## 👩‍💻 For Developers

If you want to contribute or modify the code, see our [Developer Documentation](docs/developer/setup.md).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/developer/contributing.md) if you'd like to help improve this project.

## 📝 License

MIT License - Copyright (c) 2025 Shirokuma Library

## 🔗 Links

- 📦 [npm Package](https://www.npmjs.com/package/@shirokuma-library/mcp-knowledge-base)
- 🐛 [Issue Tracker](https://github.com/ShirokumaLibrary/mcp-knowledge-base/issues)
- 📖 [Changelog](CHANGELOG.md)
- 🗺️ [Roadmap](https://github.com/ShirokumaLibrary/mcp-knowledge-base/projects)

---

**Contact**: shirokuma@gadget.to