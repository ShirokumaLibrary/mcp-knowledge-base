# SHIROKUMA Knowledge Base - Core Configuration

**Last Updated**: 2025-08-05

## Project Overview

SHIROKUMA is a comprehensive knowledge management system built as an MCP (Model Context Protocol) server. It features a unique dual-storage architecture combining Markdown files for primary storage with SQLite for search capabilities.

### Key Characteristics
- **Architecture**: Dual-storage (Markdown + SQLite with FTS5)
- **Language**: TypeScript (ES2022, ESM)
- **Size**: ~3,500 lines of source code, ~72 compiled files
- **Type System**: Currently 9 types, future migration to 2 types planned
- **Integration**: Designed for Claude Code through MCP protocol

## Project Configuration

```yaml
# Project Configuration for Claude Code Agents
# This embedded YAML contains all project-specific settings

project:
  name: "SHIROKUMA"
  description: "Shirokuma MCP Server for comprehensive knowledge management including issues, plans, documents, and work sessions"
  version: "0.7.9"
  language_env: "SHIROKUMA_LANG"
  type: "mcp_server"
  main_entry: "dist/server.js"
  bin_entry: "dist/cli.js"

references:
  methodology_file: "SHIROKUMA.md"
  project_instructions: "CLAUDE.md"
  detailed_configuration: ".shirokuma/configs/"
  example_files:
    - "SHIROKUMA.md.example"
    - "CLAUDE.md.example"
  translations:
    ja: "SHIROKUMA.md.ja.example"

tech_stack:
  language: "TypeScript"
  runtime: "Node.js"
  package_manager: "npm"
  module_type: "ESModule"  # package.json has "type": "module"
  frameworks:
    - "MCP (Model Context Protocol)"
    - "Jest"
    - "ESLint"
  databases:
    - "SQLite"
    - "Markdown files"

quality_standards:
  review_threshold: 85
  test_coverage_target: 80
  max_complexity: 10
  
development_principles:
  - "Issue-Driven Development"
  - "TDD (Test-Driven Development)"
  - "Clean Code"
  - "SOLID Principles"
  - "Documentation First"
  - "Continuous Improvement"
  - "Security by Design"
  - "Performance Awareness"
  - "MCP Protocol Compliance"
  - "Dual Storage Architecture"
```

## Active System Components

### Available Agents (12 total, 2 deprecated)

| Agent | Purpose | Status |
|-------|---------|--------|
| **shirokuma-issue-manager** | Issue tracking and management | Active |
| **shirokuma-knowledge-curator** | Knowledge systematization | Active |
| **shirokuma-mcp-specialist** | MCP operations expert | Active |
| **shirokuma-methodology-keeper** | Development methodology guardian | Active |
| **shirokuma-programmer** | Code generation and modification | Active |
| **shirokuma-tester** | Test creation and execution | Active |
| **shirokuma-reviewer** | Code review specialist | Active |
| **shirokuma-researcher** | Technical research | Active |
| **shirokuma-designer** | Architecture and design | Active |
| **shirokuma-system-harmonizer** | System consistency checker | Active |
| **shirokuma-daily-reporter** | Daily summary generation | DEPRECATED |
| **shirokuma-session-automator** | Session automation | DEPRECATED |

### Available Commands

| Command | Purpose | Execution Mode |
|---------|---------|----------------|
| **/ai-start** | Initialize work session, restore context | Direct (main agent) |
| **/ai-finish** | End session, save progress | Direct (main agent) |
| **/ai-remember** | Record decisions with validation | Direct (main agent) |
| **/ai-go** | Execute work with appropriate agent | Delegated to agents |

### Content Type System

#### Current 9-Type System
1. **issues** - Bug reports and tasks (priority, status)
2. **plans** - Project plans with timelines
3. **docs** - Technical documentation
4. **knowledge** - Knowledge base articles
5. **sessions** - Work session logs (timestamp IDs)
6. **dailies** - Daily summaries (date IDs) [DEPRECATED]
7. **decisions** - Design decisions
8. **features** - Feature specifications
9. **test_results** - Test execution results
10. **handovers** - Inter-agent communication

#### Future 2-Type System (Planned)
- **items** - All content with type field
- **sessions** - Work sessions only

## Project Structure

```
/home/webapp/mcp/
├── src/                          # Source code (~3,500 lines)
│   ├── __tests__/               # Unit tests (17 files)
│   ├── config/                  # Configuration management
│   ├── database/                # Database layer (7 repositories)
│   ├── handlers/                # MCP handlers (11 handlers)
│   ├── types/                   # TypeScript definitions (10 files)
│   ├── utils/                   # Utilities (10 files)
│   ├── security/                # Security features (4 files)
│   ├── services/                # Business logic
│   ├── formatters/              # Data formatters
│   ├── indexing/                # Semantic code search
│   ├── schemas/                 # Zod validation schemas
│   └── server.ts                # MCP server entry
├── tests/                       # Integration & E2E tests
│   ├── integration/             # Integration tests (11 files)
│   └── e2e/                     # End-to-end tests
├── docs/                        # Documentation
│   └── mcp-type-restructure-plan/  # Type migration plan
├── .claude/                     # Claude Code configuration
│   ├── agents/                  # AI agents (12 active)
│   └── commands/                # Custom commands (4)
├── .shirokuma/                  # Project configuration (NEW)
│   └── configs/                 # Split configuration files
├── dist/                        # Build output (~72 files)
└── .database/                   # Data storage
    ├── items/                   # Markdown content files
    └── shirokuma.db            # SQLite search index
```

### Key Libraries
- **@modelcontextprotocol/sdk**: ^1.0.2 - MCP framework
- **better-sqlite3**: ^11.5.0 - SQLite database
- **zod**: ^3.23.8 - Schema validation
- **@xenova/transformers**: ^2.17.2 - Semantic search
- **winston**: ^3.17.0 - Logging
- **jest**: ^29.7.0 - Testing with ts-jest

## Design Philosophy

### Layered Architecture
1. **MCP Protocol Layer** - Handles all MCP communication
2. **Handler Layer** - 11 specialized handlers for different operations
3. **Repository Layer** - 7 repositories for data access abstraction
4. **Storage Layer** - Dual storage with Markdown + SQLite

### Key Design Patterns
- **Strategy Pattern**: Type-specific processing logic
- **Repository Pattern**: Clean data access abstraction
- **Handler Pattern**: Modular request processing
- **Dual Storage**: Markdown for content, SQLite for search

### Design Principles
- **Separation of Concerns**: Each layer has clear responsibilities
- **Type Safety**: Extensive use of TypeScript generics and Zod validation
- **Performance**: FTS5 for search, semantic indexing for code
- **Extensibility**: Easy to add new types and handlers
- **Testability**: Comprehensive mocking support

## Environment Configuration

### Environment Variables

```typescript
// Environment configuration with defaults
export const config = {
  // Database configuration
  databaseRoot: process.env.DATABASE_ROOT || '.database',
  databasePath: process.env.MCP_DATABASE_PATH || '.database/shirokuma.db',
  
  // Server configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Feature flags
  enableCodeIndexing: process.env.ENABLE_CODE_INDEXING === 'true',
  enableAutoBackup: process.env.ENABLE_AUTO_BACKUP === 'true',
  
  // Performance tuning
  maxConcurrentOperations: parseInt(process.env.MAX_CONCURRENT_OPS || '10'),
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  cacheTTL: parseInt(process.env.CACHE_TTL || '300')
};
```

## Future Roadmap

### Type System Migration (Planned)
- **Current**: 9 specialized types (issues, plans, docs, etc.)
- **Future**: 2 universal types (items + sessions)
- **Migration Plan**: Available in `/docs/mcp-type-restructure-plan/`
- **Benefits**: Simplified maintenance, flexible categorization via tags

### Planned Features
1. **Real-time Sync**: File watcher for instant updates
2. **Advanced Search**: Graph-based relationship queries
3. **Performance**: Caching layer for frequent queries
4. **Security**: Enhanced rate limiting and access control
5. **Integration**: Direct Git integration for version control

### Deprecated Features
- **dailies type**: Use sessions for work tracking (type still exists but will be removed)
- **session-automator agent**: Functionality integrated into /ai-start and /ai-finish commands
- **daily-reporter agent**: No longer needed with session-based tracking
- **Note**: Deprecated agents have been removed from the codebase (recoverable via git history)

## Special Features

### Semantic Code Search
- Uses `@xenova/transformers` for AI-powered code search
- Natural language queries to find relevant code
- Builds embeddings index for entire codebase
- Commands: `index_codebase`, `search_code`, `get_related_files`

### Dynamic Type System
- Create custom content types at runtime
- Each type inherits from base type (tasks or documents)
- Automatic UI and validation generation
- Commands: `create_type`, `update_type`, `delete_type`

### Cross-Reference Management
- Automatic bidirectional link updates
- Type change propagation across references
- Relationship integrity maintenance
- Commands: `change_item_type` with automatic reference updates

### Multi-Language Support
- `SHIROKUMA_LANG` environment variable
- Supports any language (日本語, English, etc.)
- Language preference cascades: User request > ENV > Default (English)