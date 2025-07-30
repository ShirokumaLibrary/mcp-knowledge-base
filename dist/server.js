#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { FileIssueDatabase } from './database.js';
import { SessionManager } from './session-manager.js';
import { getConfig } from './config.js';
import { createUnifiedHandlers, handleUnifiedToolCall } from './handlers/unified-handlers.js';
import { StatusHandlers } from './handlers/status-handlers.js';
import { TagHandlers } from './handlers/tag-handlers.js';
import { SessionHandlers } from './handlers/session-handlers.js';
import { SummaryHandlers } from './handlers/summary-handlers.js';
import { TypeHandlers } from './handlers/type-handlers.js';
import { SearchHandlers } from './handlers/search-handlers.js';
import { CurrentStateHandlers } from './handlers/current-state-handlers.js';
import { ChangeTypeHandlers } from './handlers/change-type-handlers.js';
import { toolDefinitions } from './tool-definitions.js';
export class IssueTrackerServer {
    server;
    db;
    sessionManager;
    unifiedHandlers;
    statusHandlers;
    tagHandlers;
    sessionHandlers;
    summaryHandlers;
    typeHandlers;
    searchHandlers;
    currentStateHandlers;
    changeTypeHandlers;
    constructor() {
        const config = getConfig();
        this.db = new FileIssueDatabase(config.database.path);
        this.sessionManager = new SessionManager(config.database.sessionsPath, this.db);
        this.statusHandlers = new StatusHandlers(this.db);
        this.tagHandlers = new TagHandlers(this.db);
        this.sessionHandlers = new SessionHandlers(this.sessionManager);
        this.summaryHandlers = new SummaryHandlers(this.sessionManager);
        this.typeHandlers = new TypeHandlers(this.db);
        this.searchHandlers = new SearchHandlers(this.db);
        this.currentStateHandlers = new CurrentStateHandlers(config.database.path);
        this.changeTypeHandlers = new ChangeTypeHandlers(this.db);
        this.server = new Server({
            name: 'shirokuma-ai-project-management-server',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {}
            }
        });
        this.setupToolHandlers();
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            this.db.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.setupToolList();
        this.setupCallHandlers();
    }
    setupToolList() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return { tools: toolDefinitions };
        });
    }
    setupCallHandlers() {
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                return await this.handleToolCall(request.params.name, request.params.arguments);
            }
            catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new McpError(ErrorCode.InternalError, errorMessage);
            }
        });
    }
    async handleToolCall(toolName, args) {
        switch (toolName) {
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
            case 'get_statuses': return this.statusHandlers.handleGetStatuses();
            case 'get_tags': return this.tagHandlers.handleGetTags();
            case 'create_tag': return this.tagHandlers.handleCreateTag(args);
            case 'delete_tag': return this.tagHandlers.handleDeleteTag(args);
            case 'search_tags': return this.tagHandlers.handleSearchTags(args);
            case 'create_type': return this.typeHandlers.handleCreateType(args);
            case 'get_types': return this.typeHandlers.handleGetTypes(args);
            case 'update_type': return this.typeHandlers.handleUpdateType(args);
            case 'delete_type': return this.typeHandlers.handleDeleteType(args);
            case 'search_items': return this.searchHandlers.searchItems(args);
            case 'search_suggest': return this.searchHandlers.searchSuggest(args);
            case 'get_current_state': return this.currentStateHandlers.handleGetCurrentState();
            case 'update_current_state': return this.currentStateHandlers.handleUpdateCurrentState(args);
            case 'change_item_type': return this.changeTypeHandlers.handleChangeItemType(args);
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
        this.unifiedHandlers = createUnifiedHandlers(this.db);
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Issue Tracker MCP Server running on stdio');
    }
}
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
    const server = new IssueTrackerServer();
    server.run().catch(console.error);
}
