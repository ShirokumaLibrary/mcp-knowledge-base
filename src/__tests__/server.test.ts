/**
 * @ai-context Tests for MCP server entry point
 * @ai-pattern Integration tests for server initialization and request handling
 * @ai-critical Tests the main server process coordination
 * @ai-related-files
 *   - src/server.ts (implementation)
 *   - src/tool-definitions.ts (tool metadata)
 *   - All handler files (delegated operations)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { IssueTrackerServer } from '../server.js';
import { FileIssueDatabase } from '../database.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

// Mock the MCP SDK modules
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

// Mock the database
jest.mock('../database.js');

// Mock the session manager
jest.mock('../session-manager.js');

// Mock @xenova/transformers to avoid ESM issues
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue({
    data: new Float32Array(384).fill(0.1)
  })
}));

// Mock config
jest.mock('../config.js', () => ({
  config: {
    database: {
      path: '/tmp/test-db',
      sessionsPath: '/tmp/test-db/sessions',
      sqlitePath: '/tmp/test-db/search.db'
    }
  },
  getConfig: () => ({
    database: {
      path: '/tmp/test-db',
      sessionsPath: '/tmp/test-db/sessions',
      sqlitePath: '/tmp/test-db/search.db'
    }
  })
}));

// Mock the imported handlers  
jest.mock('../handlers/unified-handlers.js', () => ({
  createUnifiedHandlers: jest.fn(() => ({})),
  handleUnifiedToolCall: jest.fn()
}));

// Create mock handler instances
const mockStatusHandlers = {
  handleGetStatuses: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'statuses' }] })
};

jest.mock('../handlers/status-handlers.js', () => ({
  StatusHandlers: jest.fn().mockImplementation(() => mockStatusHandlers)
}));

const mockTagHandlers = {
  handleGetTags: jest.fn(),
  handleCreateTag: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'tag created' }] }),
  handleDeleteTag: jest.fn(),
  handleSearchTags: jest.fn()
};

jest.mock('../handlers/tag-handlers.js', () => ({
  TagHandlers: jest.fn().mockImplementation(() => mockTagHandlers)
}));

jest.mock('../handlers/session-handlers.js', () => ({
  SessionHandlers: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('../handlers/summary-handlers.js', () => ({
  SummaryHandlers: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('../handlers/type-handlers.js', () => ({
  TypeHandlers: jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    handleCreateType: jest.fn(),
    handleGetTypes: jest.fn(),
    handleUpdateType: jest.fn(),
    handleDeleteType: jest.fn()
  }))
}));

jest.mock('../handlers/search-handlers.js', () => ({
  SearchHandlers: jest.fn().mockImplementation(() => ({
    searchItems: jest.fn(),
    searchSuggest: jest.fn()
  }))
}));
jest.mock('../tool-definitions.js', () => ({
  toolDefinitions: [
    { name: 'get_items', description: 'Get items', inputSchema: {} },
    { name: 'create_tag', description: 'Create tag', inputSchema: {} }
  ]
}));

describe('IssueTrackerServer', () => {
  let server: any;
  let mockDb: jest.Mocked<FileIssueDatabase>;
  let mockServerInstance: any;
  let testDataDir: string;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup test directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'server-test-'));
    testDataDir = path.join(tempDir, '.shirokuma/data');
    
    // Create mock database
    mockDb = {
      initialize: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
      getDatabase: jest.fn().mockReturnValue({
        getAsync: jest.fn().mockResolvedValue({ value: '0.7.5' }),
        runAsync: jest.fn().mockResolvedValue(undefined)
      }),
      getAllStatuses: jest.fn().mockResolvedValue([
        { id: 1, name: 'Open', is_closed: false },
        { id: 2, name: 'Closed', is_closed: true }
      ]),
      getAllTags: jest.fn().mockResolvedValue([]),
      createTag: jest.fn().mockResolvedValue({ id: 1, name: 'test-tag' }),
      getItemRepository: jest.fn().mockReturnValue({}),
      getTagRepository: jest.fn().mockReturnValue({
        registerTags: jest.fn().mockResolvedValue(undefined)
      }),
      getTypeRepository: jest.fn().mockReturnValue({}),
      getFullTextSearchRepository: jest.fn().mockReturnValue({})
    } as any;
    
    (FileIssueDatabase as jest.MockedClass<typeof FileIssueDatabase>).mockImplementation(() => mockDb);
    
    // Create mock server instance
    mockServerInstance = {
      setRequestHandler: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      onerror: null
    };
    
    (Server as jest.MockedClass<typeof Server>).mockImplementation(() => mockServerInstance);
    
    // Create server instance (but don't run it)
    process.argv = ['node', 'server.js']; // Simulate CLI args
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(path.dirname(testDataDir), { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Remove all SIGINT listeners to prevent memory leak warning
    process.removeAllListeners('SIGINT');
  });

  describe('initialization', () => {
    it('should create server with correct configuration', () => {
      server = new IssueTrackerServer();
      
      expect(Server).toHaveBeenCalledWith(
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
    });

    it('should initialize database', () => {
      server = new IssueTrackerServer();
      
      expect(FileIssueDatabase).toHaveBeenCalledWith('/tmp/test-db');
    });

    it('should set up error handler', () => {
      server = new IssueTrackerServer();
      
      expect(mockServerInstance.onerror).toBeDefined();
      
      // Test error handler - it should silently handle errors
      const testError = new Error('Test error');
      expect(() => mockServerInstance.onerror(testError)).not.toThrow();
    });

    it('should register request handlers', () => {
      server = new IssueTrackerServer();
      
      // Should register ListToolsRequest and CallToolRequest handlers
      expect(mockServerInstance.setRequestHandler).toHaveBeenCalledTimes(2);
      
      const calls = mockServerInstance.setRequestHandler.mock.calls;
      expect(calls[0][0]).toHaveProperty('parse'); // ListToolsRequestSchema
      expect(calls[1][0]).toHaveProperty('parse'); // CallToolRequestSchema
    });
  });

  describe('tool listing', () => {
    it('should return tool definitions', async () => {
      server = new IssueTrackerServer();
      
      // Get the list tools handler
      const listToolsHandler = mockServerInstance.setRequestHandler.mock.calls[0][1];
      
      const result = await listToolsHandler({});
      
      expect(result).toHaveProperty('tools');
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);
      
      // Check that tools have required properties
      const firstTool = result.tools[0];
      expect(firstTool).toHaveProperty('name');
      expect(firstTool).toHaveProperty('description');
      expect(firstTool).toHaveProperty('inputSchema');
    });
  });

  describe('tool call handling', () => {
    let callToolHandler: any;

    beforeEach(async () => {
      server = new IssueTrackerServer();
      
      // Need to run the server to initialize unified handlers
      await server['run']();
      
      // Get the call tool handler
      callToolHandler = mockServerInstance.setRequestHandler.mock.calls[1][1];
    });

    it('should handle status operations', async () => {
      const request = {
        params: {
          name: 'get_statuses',
          arguments: {}
        }
      };
      
      const result = await callToolHandler(request);
      
      expect(result).toHaveProperty('content');
      expect(mockStatusHandlers.handleGetStatuses).toHaveBeenCalled();
    });

    it('should handle tag operations', async () => {
      const request = {
        params: {
          name: 'create_tag',
          arguments: { name: 'test-tag' }
        }
      };
      
      const result = await callToolHandler(request);
      
      expect(result).toHaveProperty('content');
      expect(mockTagHandlers.handleCreateTag).toHaveBeenCalledWith({ name: 'test-tag' });
    });

    it('should handle unknown tool names', async () => {
      const request = {
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      };
      
      await expect(callToolHandler(request)).rejects.toThrow(McpError);
      await expect(callToolHandler(request)).rejects.toThrow('Unknown tool: unknown_tool');
    });

    it('should preserve McpErrors', async () => {
      // Mock a handler to throw McpError
      mockTagHandlers.handleCreateTag.mockRejectedValue(
        new McpError(ErrorCode.InvalidRequest, 'Test error')
      );
      
      const request = {
        params: {
          name: 'create_tag',
          arguments: { name: 'test-tag' }
        }
      };
      
      await expect(callToolHandler(request)).rejects.toThrow(McpError);
      await expect(callToolHandler(request)).rejects.toThrow('Test error');
    });

    it('should wrap non-McpErrors', async () => {
      // Mock a handler to throw regular error
      mockTagHandlers.handleCreateTag.mockRejectedValue(new Error('Regular error'));
      
      const request = {
        params: {
          name: 'create_tag',
          arguments: { name: 'test-tag' }
        }
      };
      
      await expect(callToolHandler(request)).rejects.toThrow(McpError);
      const error = await callToolHandler(request).catch((e: any) => e);
      expect(error.code).toBe(ErrorCode.InternalError);
    });
  });

  describe('graceful shutdown', () => {
    it('should handle SIGINT properly', async () => {
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      
      server = new IssueTrackerServer();
      
      // Get the SIGINT handler
      const sigintListeners = process.listeners('SIGINT');
      const sigintHandler = sigintListeners[sigintListeners.length - 1] as Function;
      
      // Test SIGINT handling
      try {
        await sigintHandler();
      } catch (error: any) {
        expect(error.message).toBe('process.exit called');
      }
      
      expect(mockServerInstance.close).toHaveBeenCalled();
      expect(mockDb.close).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
      
      processExitSpy.mockRestore();
    });
  });

  describe('database initialization', () => {
    it('should initialize database before starting', async () => {
      server = new IssueTrackerServer();
      
      await server['run']();
      
      expect(mockDb.initialize).toHaveBeenCalled();
    });

    it('should handle database initialization errors', async () => {
      mockDb.initialize.mockRejectedValue(new Error('DB init failed'));
      
      server = new IssueTrackerServer();
      
      await expect(server['run']()).rejects.toThrow('DB init failed');
    });
  });

  describe('unified handlers', () => {
    let callToolHandler: any;
    let mockUnifiedHandlers: any;

    beforeEach(async () => {
      // Set up unified handlers mock
      mockUnifiedHandlers = {
        get_items: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'items' }] }),
        create_item: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'created' }] })
      };
      
      const { createUnifiedHandlers, handleUnifiedToolCall } = jest.requireMock('../handlers/unified-handlers.js');
      createUnifiedHandlers.mockReturnValue(mockUnifiedHandlers);
      handleUnifiedToolCall.mockImplementation((toolName: string, args: any, handlers: any) => {
        if (handlers[toolName]) {
          return handlers[toolName](args);
        }
        throw new Error('Unknown tool');
      });
      
      server = new IssueTrackerServer();
      await server['run']();
      
      // Get the call tool handler
      callToolHandler = mockServerInstance.setRequestHandler.mock.calls[1][1];
    });

    it('should handle unified get_items call', async () => {
      const request = {
        params: {
          name: 'get_items',
          arguments: { type: 'issues' }
        }
      };
      
      const result = await callToolHandler(request);
      
      expect(result).toHaveProperty('content');
      expect(mockUnifiedHandlers.get_items).toHaveBeenCalledWith({ type: 'issues' });
    });

    it('should handle unified create_item call', async () => {
      const request = {
        params: {
          name: 'create_item',
          arguments: { type: 'issues', title: 'Test', content: 'Test content' }
        }
      };
      
      const result = await callToolHandler(request);
      
      expect(result).toHaveProperty('content');
      expect(mockUnifiedHandlers.create_item).toHaveBeenCalledWith({ 
        type: 'issues', 
        title: 'Test', 
        content: 'Test content' 
      });
    });

    it('should throw error when unified handlers not initialized', async () => {
      // Create a new server without running it
      const newServer = new IssueTrackerServer();
      
      // Get handlers without initialization
      const handlers = mockServerInstance.setRequestHandler.mock.calls;
      const newCallToolHandler = handlers[handlers.length - 1][1];
      
      const request = {
        params: {
          name: 'get_items',
          arguments: { type: 'issues' }
        }
      };
      
      await expect(newCallToolHandler(request)).rejects.toThrow(McpError);
      await expect(newCallToolHandler(request)).rejects.toThrow('Server not fully initialized');
    });
  });

  describe('type handlers', () => {
    let callToolHandler: any;
    let mockTypeHandlers: any;

    beforeEach(async () => {
      server = new IssueTrackerServer();
      await server['run']();
      
      // Get the type handlers instance
      const { TypeHandlers } = jest.requireMock('../handlers/type-handlers.js');
      mockTypeHandlers = TypeHandlers.mock.results[0].value;
      
      // Get the call tool handler
      callToolHandler = mockServerInstance.setRequestHandler.mock.calls[1][1];
    });

    it('should handle type operations', async () => {
      mockTypeHandlers.handleGetTypes.mockResolvedValue({ 
        content: [{ type: 'text', text: 'types' }] 
      });
      
      const request = {
        params: {
          name: 'get_types',
          arguments: {}
        }
      };
      
      const result = await callToolHandler(request);
      
      expect(result).toHaveProperty('content');
      expect(mockTypeHandlers.handleGetTypes).toHaveBeenCalledWith({});
    });

    it('should initialize type handlers during run', async () => {
      expect(mockTypeHandlers.init).toHaveBeenCalled();
    });
  });

  describe('search handlers', () => {
    let callToolHandler: any;
    let mockSearchHandlers: any;

    beforeEach(async () => {
      server = new IssueTrackerServer();
      await server['run']();
      
      // Get the search handlers instance
      const { SearchHandlers } = jest.requireMock('../handlers/search-handlers.js');
      mockSearchHandlers = SearchHandlers.mock.results[0].value;
      
      // Get the call tool handler
      callToolHandler = mockServerInstance.setRequestHandler.mock.calls[1][1];
    });

    it('should handle search operations', async () => {
      mockSearchHandlers.searchItems.mockResolvedValue({ 
        content: [{ type: 'text', text: 'search results' }] 
      });
      
      const request = {
        params: {
          name: 'search_items',
          arguments: { query: 'test search' }
        }
      };
      
      const result = await callToolHandler(request);
      
      expect(result).toHaveProperty('content');
      expect(mockSearchHandlers.searchItems).toHaveBeenCalledWith({ query: 'test search' });
    });

    it('should handle search suggestions', async () => {
      mockSearchHandlers.searchSuggest.mockResolvedValue({ 
        content: [{ type: 'text', text: 'suggestions' }] 
      });
      
      const request = {
        params: {
          name: 'search_suggest',
          arguments: { query: 'test' }
        }
      };
      
      const result = await callToolHandler(request);
      
      expect(result).toHaveProperty('content');
      expect(mockSearchHandlers.searchSuggest).toHaveBeenCalledWith({ query: 'test' });
    });
  });

  describe('error handling edge cases', () => {
    it('should handle server error event', () => {
      server = new IssueTrackerServer();
      
      const testError = new Error('Server error');
      // Should handle error silently without throwing
      expect(() => mockServerInstance.onerror(testError)).not.toThrow();
    });

    it('should connect stdio transport on run', async () => {
      const mockTransport = {};
      (StdioServerTransport as jest.Mock).mockImplementation(() => mockTransport);
      
      server = new IssueTrackerServer();
      await server['run']();
      
      expect(StdioServerTransport).toHaveBeenCalled();
      expect(mockServerInstance.connect).toHaveBeenCalledWith(mockTransport);
    });
  });
});