# Shirokuma MCP Knowledge Base

> ⚠️ **Project Under Development**  
> This project is under active development and specifications/APIs may change significantly without notice.

**Model Context Protocol (MCP) server for comprehensive knowledge management including issues, plans, documents, and work sessions.**

## Core Design Philosophy

**⚠️ All information stored in this system is structured for AI processing, not human readability.**
- Minimal redundant descriptions
- Structure-first data with high information density
- Design optimized for efficient AI reference and search

## Installation

### Global Installation (Recommended)

```bash
npm install -g @shirokuma-library/mcp-knowledge-base
```

### Local Installation

```bash
npm install @shirokuma-library/mcp-knowledge-base
```

### Updating

To update the global installation to the latest version:

```bash
npm update -g @shirokuma-library/mcp-knowledge-base
```

Or to install a specific version:

```bash
npm install -g @shirokuma-library/mcp-knowledge-base@0.5.1
```

## Usage

### Command Line Interface

After global installation:

```bash
# Start MCP server
shirokuma-mcp-knowledge-base

# Show help
shirokuma-mcp-knowledge-base --help

# Use custom data directory
shirokuma-mcp-knowledge-base --data /path/to/data

# Rebuild database from markdown files
shirokuma-mcp-knowledge-base --rebuild

# Run with MCP inspector
shirokuma-mcp-knowledge-base --inspect
```

### As MCP Server

Configure in your MCP client settings:

```json
{
  "mcpServers": {
    "shirokuma-kb": {
      "command": "shirokuma-mcp-knowledge-base"
    }
  }
}
```

With custom data directory:

```json
{
  "mcpServers": {
    "shirokuma-kb": {
      "command": "shirokuma-mcp-knowledge-base",
      "args": ["--data", "/path/to/your/data"]
    }
  }
}
```

## Overview

This MCP server provides a unified knowledge base system that manages Issues, Plans, Documents, Knowledge entries, and Work Sessions for development projects.

- **Unified Knowledge Base**: Manage all content types in one place
- **Tag-based Organization**: Flexible tagging system across all content types
- **Markdown Storage**: Human-readable files with metadata
- **Cross-content Search**: Find related information across different content types

## Features

- **Issue Management**: Track bugs, features, and tasks with priority and status
- **Plan Management**: Manage project plans with date ranges and milestones
- **Document Management**: Store and organize project documentation
- **Knowledge Management**: Capture and share team knowledge
- **Work Sessions**: Record daily work activities and progress
- **Daily Summaries**: Create summaries of daily achievements
- **Tag System**: Organize and search content across all types
- **Status Management**: Customizable workflow statuses
- **Unified Content Field**: All entity types use consistent `content` field for multi-line text
- **Dynamic Type System**: Create custom document types to extend the knowledge base
- **Plural File Naming**: Consistent plural naming convention for all entity files

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

### 📚 For Users
- [Quick Start Guide](docs/user/quickstart.md) - Get started quickly
- [Installation Guide](docs/user/installation.md) - Detailed setup instructions
- [Usage Guide](docs/user/usage.md) - How to use all features
- [API Reference](docs/user/api-reference.md) - Complete tool reference
- [FAQ](docs/user/faq.md) - Frequently asked questions

### 🛠️ For Developers
- [Architecture](docs/developer/architecture.md) - System design and structure
- [Development Setup](docs/developer/setup.md) - Setting up development environment
- [Contributing Guide](docs/developer/contributing.md) - How to contribute
- [Testing Guide](docs/developer/testing-guide.md) - Running and writing tests

### 🇯🇵 日本語ドキュメント
- [クイックスタート](docs/ja/user/quickstart.md)
- [インストールガイド](docs/ja/user/installation.md)
- [使い方ガイド](docs/ja/user/usage.md)
- [FAQ](docs/ja/user/faq.md)

For complete documentation index, see [docs/README.md](docs/README.md)

## Requirements

- Node.js 18+

## Quick Start

1. **Add to your project's `.mcp.json`:**
   ```json
   {
     "mcpServers": {
       "shirokuma-knowledge-base": {
         "command": "node",
         "args": ["/path/to/shirokuma-knowledge-base/dist/server.js"],
         "cwd": "/path/to/shirokuma-knowledge-base"
       }
     }
   }
   ```

2. **Start using with Claude Code**
   - The server will be automatically available in your Claude Code session
   - All tools will be accessible through the Claude interface

## Database Maintenance

### Rebuilding the Database

If the SQLite search database becomes corrupted, out of sync, or when updating to a new version with database schema changes:

```bash
npm run rebuild-db
```

> ⚠️ **Important**: When updating to a new version, it's recommended to run `rebuild-db` as the database schema may have changed.

This command will:
- Back up the existing database (if present)
- Create a fresh SQLite database with the latest schema
- Scan all markdown files in the data directory
- Restore all data including custom statuses
- Rebuild search indexes for all content types

The rebuild process preserves:
- All issues, plans, documents, and knowledge entries
- Work sessions and daily summaries
- Custom status definitions (beyond the default ones)
- All tags and relationships

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests including E2E
npm run test:all

# Check test coverage
npm run test:coverage

# Debug with MCP Inspector (opens browser)
npm run inspect
```

### Test Coverage Status
- **Overall Coverage**: 79.3%
- **Functions Coverage**: 80.33% ✅
- **Total Tests**: 952 (all passing)
- **Test Suites**: 50

See [tests/e2e/README.md](tests/e2e/README.md) for detailed E2E testing documentation.

## Documentation

### User Documentation
- [API Reference](docs/user/api-reference.md) - Complete API documentation for MCP tools
- [User Guide](docs/user/usage-guide.md) - Getting started and basic usage
- [Configuration Guide](docs/user/configuration.md) - Environment variables and settings

### 日本語ドキュメント
- [日本語版 README](docs/ja/README.md) - プロジェクト概要
- [ユーザーガイド](docs/ja/user-guide.md) - 基本的な使い方
- [設定ガイド](docs/ja/configuration.md) - 環境変数と設定



## License

MIT License

Copyright (c) 2025 Shirokuma Library

Contact: shirokuma@gadget.to