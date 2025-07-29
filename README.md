# Shirokuma MCP Knowledge Base

> ⚠️ **Project Under Development**  
> This project is under active development and specifications/APIs may change significantly without notice.

**Model Context Protocol (MCP) server for comprehensive knowledge management including issues, plans, documents, and work sessions.**

## Core Design Philosophy

**⚠️ All information stored in this system is structured for AI processing, not human readability.**
- Minimal redundant descriptions
- Structure-first data with high information density
- Design optimized for efficient AI reference and search

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

### English Documentation
- [API Reference](docs/API.md) - Complete API documentation
- [Examples](docs/examples.md) - Usage examples and code snippets
- [Architecture](docs/architecture.md) - System design and implementation details
- [Development](docs/development.md) - Development setup and guidelines
- [Contributing](docs/CONTRIBUTING.md) - Contribution guidelines
- [Changelog](CHANGELOG.md) - Version history and changes
- [Upgrade Guide](docs/UPGRADE.md) - Migration instructions
- [Security Guide](docs/security-guide.md) - Security best practices
- [Performance Guide](docs/performance-optimization.md) - Performance tuning
- [Testing Guide](docs/testing-guide.md) - Testing strategies
- [E2E Testing](docs/e2e-testing-guide.md) - End-to-end testing guide

### 日本語ドキュメント
- [README](docs.ja/README.md) - プロジェクト概要
- [APIリファレンス](docs.ja/API.md) - 完全なAPIドキュメント
- [アーキテクチャ](docs.ja/architecture.md) - システム設計と実装の詳細
- [開発ガイド](docs.ja/development.md) - 開発セットアップとガイドライン
- [貢献ガイド](docs.ja/CONTRIBUTING.md) - 貢献のためのガイドライン
- [アップグレードガイド](docs.ja/UPGRADE.md) - マイグレーション手順
- [セキュリティガイド](docs.ja/security-guide.md) - セキュリティのベストプラクティス
- [パフォーマンスガイド](docs.ja/performance-optimization.md) - パフォーマンスチューニング
- [テストガイド](docs.ja/testing-guide.md) - テスト戦略
- [E2Eテストガイド](docs.ja/e2e-testing-guide.md) - エンドツーエンドテストガイド



## License

MIT License

Copyright (c) 2025 Shirokuma Library

Contact: shirokuma@gadget.to