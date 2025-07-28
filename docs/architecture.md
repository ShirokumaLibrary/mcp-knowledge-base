# Architecture & Implementation Details

## System Overview

Shirokuma MCP Knowledge Base is a Model Context Protocol (MCP) server that provides comprehensive knowledge management capabilities. The system uses a dual-storage architecture with Markdown files as the primary storage and SQLite for fast searching and indexing.

### Key Features
- **Unified Content Management**: Issues, Plans, Documents, and Knowledge entries
- **Work Session Tracking**: Daily work activities and summaries
- **Tag-based Organization**: Cross-content type tagging and search
- **Custom Workflow**: Configurable status system for Issues and Plans
- **Consistent Field Naming**: All entity types use `content` field for multi-line text

## Recent Improvements (2025-07-24)

### 1. Unified Field Naming (v0.0.2)
- Replaced `description` with `content` field across all entity types
- Made `content` field required for Issues and Plans
- Improved consistency for multi-line content support

### 2. Centralized Configuration (v0.0.3)
- Changed default data directory from `database` to `.shirokuma/data`
- Centralized all path configurations in `src/config.ts`
- Added environment variable support for path customization

### 3. Enhanced Type Safety
- Strong typing for all handlers and API responses
- Comprehensive type definitions in domain and handler types
- Zod schema validation for all inputs

### 4. Repository Pattern Implementation
- Separate repositories for each entity type
- Clear separation between storage and business logic
- Consistent CRUD interfaces across all repositories

## Code Organization

```
src/
├── server.ts                # MCP server entry point
├── config.ts                # Centralized configuration
├── session-manager.ts       # Work session management
├── database/
│   ├── index.ts            # Main database facade
│   ├── base.ts             # Base repository class
│   ├── issue-repository.ts # Issue-specific storage
│   ├── plan-repository.ts  # Plan-specific storage
│   ├── doc-repository.ts   # Document storage
│   ├── knowledge-repository.ts # Knowledge base storage
│   ├── status-repository.ts    # Status management
│   └── tag-repository.ts       # Tag management
├── handlers/                # MCP request handlers
│   ├── unified-handlers.ts  # CRUD operations for all items
│   ├── status-handlers.ts   # Status management
│   ├── tag-handlers.ts      # Tag operations
│   ├── session-handlers.ts  # Work session handling
│   └── summary-handlers.ts  # Daily summary handling
├── repositories/            # Session-specific repositories
│   └── session-repository.ts
├── schemas/                 # Zod validation schemas
│   └── unified-schemas.ts   # Unified validation schemas
├── types/                   # TypeScript type definitions
│   ├── domain-types.ts      # Core domain models
│   ├── handler-types.ts     # Handler interfaces
│   └── session-types.ts     # Session-specific types
├── formatters/              # Content formatters
│   └── session-markdown-formatter.ts
├── services/                # Business logic services
│   └── session-search-service.ts
└── utils/                   # Utility functions
    ├── errors.ts           # Custom error classes
    ├── logger.ts           # Logging configuration
    └── markdown-parser.ts  # Markdown/YAML parsing
```

## Database Architecture

### Unified Database Schema (v0.2.0)

As of 2025-01-27, the database has been unified using a Single Table Inheritance pattern:

#### Main Tables

1. **items** - Unified content table
   - Primary Key: (type, id) 
   - Stores all content types: issues, plans, docs, knowledge, sessions, summaries
   - All IDs stored as TEXT for consistency
   - JSON arrays for tags and related items

2. **item_tags** - Unified tag relationships
   - Replaces separate task_tags, document_tags, session_tags, summary_tags tables
   - Links any item type to tags

3. **related_items** - Unified relationships 
   - Replaces related_tasks, related_documents tables
   - Bidirectional relationships between any item types
   - All relationships stored with TEXT IDs

4. **tags** - Master tag table
   - Auto-registration on item creation/update
   - Usage count tracking

5. **statuses** - Workflow states
   - Used by all item types (not just tasks)
   - is_closed flag for filtering

6. **sequences** - ID generation
   - Tracks next ID for each type
   - Supports dynamic type creation

### Storage System
- **Markdown Files**: Primary storage for all content (issues, plans, documents, knowledge, sessions)
- **SQLite**: Unified database for search, relationships, and metadata
- **ItemRepository**: Central data access layer handling all item types

### Directory Structure
```
.shirokuma/data/     # Default data directory (configurable via MCP_DATABASE_PATH)
├── issues/          # Issue management
│   └── issue-*.md   # Individual issue files
├── plans/           # Plan management
│   └── plan-*.md    # Individual plan files
├── docs/            # Document management
│   └── doc-*.md     # Individual document files
├── knowledge/       # Knowledge management
│   └── knowledge-*.md    # Individual knowledge files
├── sessions/        # Work session recording
│   └── YYYY-MM-DD/  # Date-based directories
│       ├── session-YYYY-MM-DD-HH.MM.SS.sss.md  # Session records (with Front Matter)
│       └── daily-summary-YYYY-MM-DD.md   # Daily summaries
└── search.db        # SQLite high-speed search database (includes tag management)
```

Note: 
- Status definitions are stored in the SQLite database, not in JSON files
- All paths can be customized via environment variables
- `MCP_DATABASE_PATH`: Override the base data directory
- `MCP_SQLITE_PATH`: Override the SQLite database location

### Storage Features
- **Front Matter**: YAML-formatted metadata for all content types
- **Markdown Content**: Body content stored after frontmatter separator (---)
- **SQLite Database**: Search indexes, tag management, and status definitions
- **Automatic Sync**: All create/update operations sync to SQLite automatically
- **ID Generation**: Sequential IDs managed by SQLite sequences table

### Data Model

#### Common Fields (All Types)
- `id`: Unique numeric identifier
- `title`: Required title field
- `tags`: Array of tag names (auto-registered)
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp (optional)

#### Type-Specific Fields

**Issues & Plans**:
- `content`: Required multi-line content
- `priority`: high, medium, or low
- `status_id`: Reference to status table
- `start_date` & `end_date`: (Plans only) YYYY-MM-DD format

**Documents & Knowledge**:
- `content`: Required multi-line content

**Work Sessions**:
- `id`: YYYY-MM-DD-HH.MM.SS.sss format
- `content`: Optional session details
- `category`: Optional categorization
- `date`: YYYY-MM-DD format
- `datetime`: Optional ISO 8601 datetime for past data migration

**Daily Summaries**:
- `date`: Primary key (YYYY-MM-DD format)
- `content`: Required summary content

## MCP Protocol Implementation

### Tool Definitions
All tools are defined with:
- Input validation using Zod schemas
- Consistent error handling
- Type-safe responses
- Unified API for all item types

### Handler Architecture
```
MCP Client → server.ts → UnifiedHandlers → ItemRepository → File/SQLite
```

### Repository Architecture (v0.2.0)
- **ItemRepository**: Single repository handling all item types
  - Type validation via sequences table
  - Dynamic type support
  - Unified CRUD operations
  - Single Table Inheritance pattern
- **Replaced repositories**: TaskRepository, DocumentRepository (now handled by ItemRepository)

### Error Handling
- MCP protocol errors (McpError) for client communication
- Internal error types for debugging
- Graceful fallbacks for file operations

## Testing Strategy

- Comprehensive test coverage
- Unit tests for each repository
- Integration tests for cross-repository operations
- Session management tests
- Automated testing with Jest and ts-jest

### Test Categories
- **Repository Tests**: CRUD operations, error handling, concurrent operations
- **Database Integration**: Cross-repository operations, tag management
- **Session Management**: Work session creation, updates, daily summaries
- **Search Operations**: SQLite queries, tag searches, full-text search

## Security Measures

- Input validation using Zod schemas
- SQL injection protection (parameterized queries)
- Type safety enforcement (TypeScript strict mode)
- Path traversal protection
- Secure error handling (no sensitive data leakage)

## Design Patterns

### Repository Pattern
Each entity type has its own repository:
- Encapsulates data access logic
- Provides consistent CRUD interfaces
- Handles both file I/O and SQLite operations
- Extends `BaseRepository` for common functionality

### Facade Pattern
The database layer uses facades for simplified access:
- `FileIssueDatabase` acts as the main facade
- Delegates to specific repositories
- Provides unified interface for handlers

### Handler Pattern
Separate handlers for different tool categories:
- `UnifiedHandlers`: CRUD operations for all item types
- `StatusHandlers`: Workflow status management
- `TagHandlers`: Tag operations and searches
- `SessionHandlers`: Work session tracking
- `SummaryHandlers`: Daily summary management

### Service Layer Pattern
- `SessionSearchService`: Encapsulates search logic
- `WorkSessionManager`: Orchestrates session operations
- Clear separation of concerns

## Configuration Management

### Environment Variables
- `MCP_DATABASE_PATH`: Base data directory (default: `.shirokuma/data`)
- `MCP_SQLITE_PATH`: SQLite database path
- `MCP_LOG_LEVEL`: Logging verbosity
- `MCP_LOGGING_ENABLED`: Enable/disable logging

### Path Resolution
All paths centralized in `config.ts`:
```typescript
{
  database: {
    path: '.shirokuma/data',
    sqlitePath: '.shirokuma/data/search.db',
    issuesPath: '.shirokuma/data/issues',
    plansPath: '.shirokuma/data/plans',
    docsPath: '.shirokuma/data/docs',
    knowledgePath: '.shirokuma/data/knowledge',
    sessionsPath: '.shirokuma/data/sessions'
  }
}
```