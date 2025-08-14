#!/usr/bin/env node
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { initializeDatabase } from './database/database-init.js';
import { MCPToolDefinitions } from './tools/tool-definitions.js';
import { CRUDHandlers } from './handlers/crud-handlers.js';
import { SearchHandlers } from './handlers/search-handlers.js';
import { RelationHandlers } from './handlers/relation-handlers.js';
import { SystemHandlers } from './handlers/system-handlers.js';

import os from 'os';
import path from 'path';

// Auto-configure SHIROKUMA_DATABASE_URL from SHIROKUMA_DATA_DIR if not set
if (!process.env.SHIROKUMA_DATABASE_URL) {
  const defaultDataDir = path.join(os.homedir(), '.shirokuma', 'data');
  const dataDir = process.env.SHIROKUMA_DATA_DIR || defaultDataDir;
  const resolvedDir = dataDir.replace(/^~/, os.homedir());
  const dbPath = `file:${resolvedDir}/shirokuma.db`;
  
  process.env.SHIROKUMA_DATABASE_URL = dbPath;
  console.log(`📁 Auto-configured SHIROKUMA_DATABASE_URL from SHIROKUMA_DATA_DIR: ${dbPath}`);
}

// Initialize services
const prisma = new PrismaClient();
const server = new Server(
  {
    name: 'shirokuma-knowledge-base',
    version: '0.8.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Initialize handlers
const crudHandlers = new CRUDHandlers(prisma);
const searchHandlers = new SearchHandlers(prisma);
const relationHandlers = new RelationHandlers(prisma);
const systemHandlers = new SystemHandlers(prisma);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: MCPToolDefinitions
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
    // CRUD operations
    case 'create_item':
      return await crudHandlers.createItem(args);
    case 'get_item':
      return await crudHandlers.getItem(args);
    case 'update_item':
      return await crudHandlers.updateItem(args);
    case 'delete_item':
      return await crudHandlers.deleteItem(args);

      // Search operations
    case 'search_items':
      return await searchHandlers.searchItems(args);
    case 'list_items':
      return await searchHandlers.listItems(args);
    case 'get_stats':
      return await searchHandlers.getStats();
    case 'get_tags':
      return await searchHandlers.getTags();

      // Relation operations
    case 'get_related_items':
      return await relationHandlers.getRelatedItems(args);
    case 'add_relations':
      return await relationHandlers.addRelations(args);

      // System operations
    case 'get_current_state':
      return await systemHandlers.getCurrentState();
    case 'update_current_state':
      return await systemHandlers.updateCurrentState(args);

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    // Provide specific error messages for AI to understand
    let errorMessage = 'Failed to execute tool';

    const errorObj = error as { code?: string; message?: string };

    if (errorObj.code === 'P2002') {
      errorMessage = 'Duplicate entry: An item with these unique values already exists';
    } else if (errorObj.code === 'P2025') {
      errorMessage = 'Record not found: The requested item or relation does not exist';
    } else if (errorObj.code === 'P2003') {
      errorMessage = 'Foreign key constraint failed: Referenced item does not exist';
    } else if (errorObj.message?.includes('Claude CLI error')) {
      errorMessage = 'AI enrichment failed: Claude service is unavailable. Try again or check Claude CLI configuration';
    } else if (errorObj.message?.includes('JSON')) {
      errorMessage = 'AI response parsing failed: Claude returned invalid JSON. This is temporary, please retry';
    } else if (errorObj.message?.includes('timeout')) {
      errorMessage = 'Request timeout: The operation took too long. Consider breaking down into smaller operations';
    } else if (errorObj.message) {
      errorMessage = `Operation failed: ${errorObj.message}`;
    }

    console.error('Tool execution error:', error);
    throw new McpError(ErrorCode.InternalError, errorMessage);
  }
});

// Start the server
async function main() {
  try {
    // Initialize database first
    await initializeDatabase(prisma);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Shirokuma MCP Server started');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export main function for CLI usage
export { main as startServer };

// Only start the server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}