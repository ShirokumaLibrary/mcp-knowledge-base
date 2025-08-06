#!/usr/bin/env node

// @ai-critical: Set MCP production mode before any imports
// @ai-why: Prevents any logging output that would break MCP JSON protocol
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
  process.env.MCP_MODE = 'production';
  process.env.NODE_ENV = 'production';
  process.env.LOG_LEVEL = 'silent';
}

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
import { getConfig } from './config.js';

import { createUnifiedHandlers, handleUnifiedToolCall } from './handlers/unified-handlers.js';
import { StatusHandlers } from './handlers/status-handlers.js';
import { guardStdio } from './utils/stdio-guard.js';
import { TagHandlers } from './handlers/tag-handlers.js';
import { TypeHandlers } from './handlers/type-handlers.js';
import { SearchHandlers } from './handlers/search-handlers.js';
import { CurrentStateHandlers } from './handlers/current-state-handlers.js';
import { ChangeTypeHandlers } from './handlers/change-type-handlers.js';
import { FileIndexHandlers, fileIndexSchemas } from './handlers/file-index-handlers.js';
import { toolDefinitions } from './tool-definitions.js';
import { checkDatabaseVersion, VersionMismatchError } from './utils/db-version-utils.js';
import { createLogger } from './utils/logger.js';
import type winston from 'winston';

/**
 * @ai-context Main server class orchestrating all MCP operations
 * @ai-pattern Facade pattern with specialized handlers for each domain
 * @ai-critical Central coordination point - errors here affect all functionality
 * @ai-dependencies Database for persistence, handlers for business logic
 * @ai-lifecycle Constructor initializes all dependencies synchronously
 */
export class IssueTrackerServer {
  private server: Server;
  private db: FileIssueDatabase;

  // @ai-logic: Separate handlers for different tool categories
  private unifiedHandlers?: ReturnType<typeof createUnifiedHandlers>;
  private statusHandlers: StatusHandlers;
  private tagHandlers: TagHandlers;
  private typeHandlers: TypeHandlers;
  private searchHandlers: SearchHandlers;
  private currentStateHandlers: CurrentStateHandlers;
  private versionError: VersionMismatchError | null = null;
  private changeTypeHandlers: ChangeTypeHandlers;
  private fileIndexHandlers: FileIndexHandlers;

  /**
   * Check if there's a version mismatch error and throw it
   * This is called before processing any API request
   */
  private checkVersionError(): void {
    if (this.versionError) {
      throw new McpError(
        ErrorCode.InternalError,
        `Database version mismatch: ${this.versionError.message}. ` +
        'Please update your database or application to matching versions.'
      );
    }
  }

  constructor() {
    const config = getConfig();
    this.db = new FileIssueDatabase(config.database.path);

    // @ai-logic: Handler initialization order doesn't matter - no dependencies
    // unified handlers will be initialized after database is ready
    this.statusHandlers = new StatusHandlers(this.db);
    this.tagHandlers = new TagHandlers(this.db);
    // Session and Summary handlers are created inline as needed
    this.typeHandlers = new TypeHandlers(this.db);
    this.searchHandlers = new SearchHandlers(this.db);
    // CurrentStateHandlers will get TagRepository after DB is initialized
    this.currentStateHandlers = new CurrentStateHandlers(config.database.path);
    this.changeTypeHandlers = new ChangeTypeHandlers(this.db);
    this.fileIndexHandlers = new FileIndexHandlers(this.db);
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
    this.server.onerror = (error) => {
      // Silently handle errors to avoid stdio pollution
      // TODO: Write to log file instead
    };

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
    // Check for version mismatch before processing any request
    this.checkVersionError();

    switch (toolName) {
      // Unified item handlers
      case 'get_items':
      case 'get_item_detail':
      case 'create_item':
      case 'update_item':
      case 'delete_item':
      case 'search_items_by_tag':
        if (!this.unifiedHandlers) {
          throw new McpError(ErrorCode.InternalError, 'Server not fully initialized');
        }
        return handleUnifiedToolCall(toolName, args, this.unifiedHandlers);

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

        // Session handlers (DEPRECATED - use unified handlers)
        // case 'get_sessions': return this.sessionHandlers.handleGetSessions(args);
        // case 'get_session_detail': return this.sessionHandlers.handleGetSessionDetail(args);
        // case 'get_latest_session': return this.sessionHandlers.handleGetLatestSession(args);
        // case 'create_session': return this.sessionHandlers.handleCreateSession(args);
        // case 'update_session': return this.sessionHandlers.handleUpdateSession(args);
        // case 'search_sessions_by_tag': return this.sessionHandlers.handleSearchSessionsByTag(args);

        // Summary handlers (DEPRECATED - use unified handlers)
        // case 'get_summaries': return this.summaryHandlers.handleGetDailySummaries(args);
        // case 'get_summary_detail': return this.summaryHandlers.handleGetDailyDetail(args);
        // case 'create_summary': return this.summaryHandlers.handleCreateDaily(args);
        // case 'update_summary': return this.summaryHandlers.handleUpdateDaily(args);

      // Type management handlers
      case 'create_type': return this.typeHandlers.handleCreateType(args);
      case 'get_types': return this.typeHandlers.handleGetTypes(args);
      case 'update_type': return this.typeHandlers.handleUpdateType(args);
      case 'delete_type': return this.typeHandlers.handleDeleteType(args);

      // Full-text search handlers
      case 'search_items': return this.searchHandlers.searchItems(args);
      case 'search_suggest': return this.searchHandlers.searchSuggest(args);

      // Current state handlers
      case 'get_current_state': return this.currentStateHandlers.handleGetCurrentState();
      case 'update_current_state': return this.currentStateHandlers.handleUpdateCurrentState(args);

      // Type change handler
      case 'change_item_type': return this.changeTypeHandlers.handleChangeItemType(args);

      // File indexing handlers
      case 'index_codebase': {
        const validated = fileIndexSchemas.index_codebase.parse(args);
        return await this.fileIndexHandlers.createHandlers().index_codebase(validated);
      }
      case 'search_code': {
        const validated = fileIndexSchemas.search_code.parse(args);
        return await this.fileIndexHandlers.createHandlers().search_code(validated);
      }
      case 'get_related_files': {
        const validated = fileIndexSchemas.get_related_files.parse(args);
        return await this.fileIndexHandlers.createHandlers().get_related_files(validated);
      }
      case 'get_index_status': {
        return await this.fileIndexHandlers.createHandlers().get_index_status();
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
  }

  async run() {
    await this.db.initialize();

    // Check database version compatibility
    try {
      // Create a silent logger for MCP environment
      const logger = createLogger('VersionCheck');
      // Disable all logging in MCP mode
      const noop = (): winston.Logger => logger;
      logger.debug = noop;
      logger.info = noop;
      logger.warn = noop;
      logger.error = noop;

      await checkDatabaseVersion(this.db.getDatabase(), logger);
    } catch (error) {
      if (error instanceof VersionMismatchError) {
        // Store the error to be returned on API calls
        this.versionError = error;
        // In test environment, throw the error immediately
        if (process.env.NODE_ENV === 'test') {
          throw error;
        }
        // Continue initialization but remember the error
      } else {
        throw error;
      }
    }

    await this.typeHandlers.init();

    // Initialize unified handlers after database is ready
    this.unifiedHandlers = createUnifiedHandlers(this.db);

    // Re-initialize CurrentStateHandlers with TagRepository and validation
    const tagRepo = this.db.getTagRepository();
    const itemRepo = this.db.getItemRepository();

    // Create validation function for related items
    const validateRelatedItems = async (items: string[]): Promise<string[]> => {
      const validItems: string[] = [];
      for (const itemId of items) {
        // Parse type and id from format like "issues-123"
        const match = itemId.match(/^(\w+)-(.+)$/);
        if (match) {
          const [, type, id] = match;
          try {
            const item = await itemRepo.getItem(type, id);
            if (item) {
              validItems.push(itemId);
            }
          } catch {
            // Skip invalid items
          }
        }
      }
      return validItems;
    };

    this.currentStateHandlers = new CurrentStateHandlers(
      getConfig().database.path,
      tagRepo,
      validateRelatedItems
    );

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Only run if this is the main module (not imported for testing)
// Check if module is being run directly or imported
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  // @ai-critical: Disable console logging for MCP server
  // MCP uses stdio for communication, any console output breaks the protocol
  process.env.NODE_ENV = 'production';
  process.env.LOG_LEVEL = 'silent';

  // @ai-critical: Disable SQLite trace output
  // SQLite can output trace information that breaks MCP protocol
  process.env.SQLITE_TRACE = '';
  process.env.SQLITE_PROFILE = '';
  process.env.DEBUG = '';

  // @ai-critical: Guard stdio from any pollution
  guardStdio();

  const server = new IssueTrackerServer();
  server.run().catch((error) => {
    // Silently handle errors to avoid stdio pollution
    // TODO: Write to log file instead
    process.exit(1);
  });
}