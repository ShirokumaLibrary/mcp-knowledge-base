#!/usr/bin/env node
/**
 * @ai-context MCP server entry point for knowledge base management
 * @ai-pattern MCP server with handler delegation pattern
 * @ai-critical Main process - handles all client connections and requests
 * @ai-lifecycle Initialize -> Setup handlers -> Listen -> Handle requests -> Cleanup
 * @ai-assumption Single server instance per process, stdio transport only
 *
 * @ai-architecture-overview
 * This is the main entry point for the Shirokuma MCP Knowledge Base server.
 * The system uses a dual-storage architecture:
 * 1. Primary storage: Markdown files in directories (issues/, plans/, docs/, knowledge/, sessions/)
 * 2. Search index: SQLite database (search.db) for fast queries
 *
 * @ai-data-flow
 * 1. MCP Client (Claude) -> stdio -> server.ts -> handlers/* -> database/* -> repositories/*
 * 2. Repositories write markdown files and sync to SQLite for search
 * 3. All data modifications go through repositories to maintain consistency
 *
 * @ai-filesystem-structure
 * database/
 *   ├── issues/         # issue-{id}.md files
 *   ├── plans/          # plan-{id}.md files
 *   ├── docs/           # doc-{id}.md files
 *   ├── knowledge/      # knowledge-{id}.md files
 *   ├── sessions/       # YYYY-MM-DD/ directories containing:
 *   │                    #   - session-{timestamp}.md files
 *   │                    #   - daily-summary-YYYY-MM-DD.md (one per day)
 *   └── search.db       # SQLite database (search index + sequences table)
 *
 * @ai-error-handling
 * - All errors are caught and converted to MCP protocol errors
 * - Database initialization failures are fatal
 * - Handler errors return appropriate MCP error responses
 *
 * @ai-configuration
 * - Data directory: Configured via DATA_DIR env var or default './database'
 * - No other configuration needed - all state in filesystem
 */
export {};
