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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { FileIssueDatabase } from './database.js';
import { WorkSessionManager } from './session-manager.js';
import { getConfig } from './config.js';

import { ItemHandlers } from './handlers/item-handlers.js';
import { StatusHandlers } from './handlers/status-handlers.js';
import { TagHandlers } from './handlers/tag-handlers.js';
import { SessionHandlers } from './handlers/session-handlers.js';
import { SummaryHandlers } from './handlers/summary-handlers.js';
import { TypeHandlers } from './handlers/type-handlers.js';
import { toolDefinitions } from './tool-definitions.js';

/**
 * @ai-context Main server class orchestrating all MCP operations
 * @ai-pattern Facade pattern with specialized handlers for each domain
 * @ai-critical Central coordination point - errors here affect all functionality
 * @ai-dependencies Database for persistence, handlers for business logic
 * @ai-lifecycle Constructor initializes all dependencies synchronously
 */
class IssueTrackerServer {
  private server: Server;
  private db: FileIssueDatabase;
  private sessionManager: WorkSessionManager;

  // @ai-logic: Separate handlers for different tool categories
  private itemHandlers: ItemHandlers;
  private statusHandlers: StatusHandlers;
  private tagHandlers: TagHandlers;
  private sessionHandlers: SessionHandlers;
  private summaryHandlers: SummaryHandlers;
  private typeHandlers: TypeHandlers;

  constructor() {
    const config = getConfig();
    this.db = new FileIssueDatabase(config.database.path);
    this.sessionManager = new WorkSessionManager(
      config.database.sessionsPath,
      this.db
    );

    // @ai-logic: Handler initialization order doesn't matter - no dependencies
    this.itemHandlers = new ItemHandlers(this.db);
    this.statusHandlers = new StatusHandlers(this.db);
    this.tagHandlers = new TagHandlers(this.db);
    this.sessionHandlers = new SessionHandlers(this.sessionManager);
    this.summaryHandlers = new SummaryHandlers(this.sessionManager);
    this.typeHandlers = new TypeHandlers(this.db);
    this.server = new Server(
      {
        name: 'shirokuma-ai-project-management-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupToolHandlers();

    // @ai-critical: Global error handler prevents server crashes
    this.server.onerror = (error) => console.error('[MCP Error]', error);

    // @ai-lifecycle: Graceful shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      await this.server.close();
      this.db.close();  // @ai-logic: Close DB connection to flush writes
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // Set up tool listing and request handlers
    this.setupToolList();
    this.setupCallHandlers();
  }

  private setupToolList() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: toolDefinitions };
    });
  }

  /**
   * @ai-intent Register handler for tool execution requests
   * @ai-flow 1. Receive request -> 2. Route to handler -> 3. Catch errors -> 4. Return response
   * @ai-error-handling Preserves McpError, wraps others as InternalError
   * @ai-critical All tool calls go through here - must be bulletproof
   * @ai-why Centralized error handling ensures consistent error responses
   */
  private setupCallHandlers() {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        return await this.handleToolCall(request.params.name, request.params.arguments);
      } catch (error) {
        // @ai-logic: McpErrors are already properly formatted
        if (error instanceof McpError) {
          throw error;
        }

        // @ai-error-recovery: Convert unknown errors to MCP format
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, errorMessage);
      }
    });
  }

  private async handleToolCall(toolName: string, args: unknown): Promise<{ content: { type: 'text'; text: string }[] }> {
    switch (toolName) {
      // Item API handlers
      case 'get_items': return this.itemHandlers.handleGetItems(args);
      case 'get_item_detail': return this.itemHandlers.handleGetItemDetail(args);
      case 'create_item': return this.itemHandlers.handleCreateItem(args);
      case 'update_item': return this.itemHandlers.handleUpdateItem(args);
      case 'delete_item': return this.itemHandlers.handleDeleteItem(args);
      case 'search_items_by_tag': return this.itemHandlers.handleSearchItemsByTag(args);

      // Status handlers
      case 'get_statuses': return this.statusHandlers.handleGetStatuses();
      // case 'create_status': return this.statusHandlers.handleCreateStatus(args);  // Disabled
      // case 'update_status': return this.statusHandlers.handleUpdateStatus(args);  // Disabled
      // case 'delete_status': return this.statusHandlers.handleDeleteStatus(args);  // Disabled

      // Tag handlers
      case 'get_tags': return this.tagHandlers.handleGetTags();
      case 'create_tag': return this.tagHandlers.handleCreateTag(args);
      case 'delete_tag': return this.tagHandlers.handleDeleteTag(args);
      case 'search_tags': return this.tagHandlers.handleSearchTags(args);

      // Session handlers
      case 'get_sessions': return this.sessionHandlers.handleGetSessions(args);
      case 'get_session_detail': return this.sessionHandlers.handleGetSessionDetail(args);
      case 'get_latest_session': return this.sessionHandlers.handleGetLatestSession(args);
      case 'create_session': return this.sessionHandlers.handleCreateWorkSession(args);
      case 'update_session': return this.sessionHandlers.handleUpdateWorkSession(args);
      case 'search_sessions_by_tag': return this.sessionHandlers.handleSearchSessionsByTag(args);

      // Summary handlers
      case 'get_summaries': return this.summaryHandlers.handleGetDailySummaries(args);
      case 'get_summary_detail': return this.summaryHandlers.handleGetDailySummaryDetail(args);
      case 'create_summary': return this.summaryHandlers.handleCreateDailySummary(args);
      case 'update_summary': return this.summaryHandlers.handleUpdateDailySummary(args);

      // Type management handlers
      case 'create_type': return this.typeHandlers.handleCreateType(args);
      case 'get_types': return this.typeHandlers.handleGetTypes(args);
      case 'delete_type': return this.typeHandlers.handleDeleteType(args);

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
  }

  async run() {
    console.error('Starting Issue Tracker MCP Server...');
    console.error('Initializing database...');
    await this.db.initialize();
    await this.typeHandlers.init();
    console.error('Database initialized');

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Issue Tracker MCP Server running on stdio');
  }
}

const server = new IssueTrackerServer();
server.run().catch(console.error);