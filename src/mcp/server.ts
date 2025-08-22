#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { AppDataSource } from '../data-source.js';
import { ItemRepository } from '../repositories/ItemRepository.js';
import { SystemStateRepository } from '../repositories/SystemStateRepository.js';
import { Item } from '../entities/Item.js';
import { Status } from '../entities/Status.js';
import { Tag } from '../entities/Tag.js';
import { ItemTag } from '../entities/ItemTag.js';
import { ItemRelation } from '../entities/ItemRelation.js';

const server = new Server(
  {
    name: 'shirokuma-knowledge-base',
    version: '0.9.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let itemRepo: ItemRepository;
let stateRepo: SystemStateRepository;

// Initialize database connection
async function initializeDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.error('Database initialized');
  }
  itemRepo = new ItemRepository();
  stateRepo = new SystemStateRepository();
}

// Tool definitions
const TOOLS = [
  {
    name: 'create_item',
    description: 'Create a new item',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Item type (lowercase, numbers, underscores only)' },
        title: { type: 'string', description: 'Item title' },
        description: { type: 'string', description: 'Item description' },
        content: { type: 'string', description: 'Detailed content' },
        status: { type: 'string', description: 'Status name', default: 'Open' },
        priority: { 
          type: 'string', 
          enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'],
          default: 'MEDIUM'
        },
        category: { type: 'string', description: 'Category' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
        related: { type: 'array', items: { type: 'number' }, description: 'Related item IDs' },
      },
      required: ['type', 'title'],
    },
  },
  {
    name: 'get_item',
    description: 'Get an item by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Item ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_item',
    description: 'Update an existing item',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Item ID' },
        type: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        content: { type: 'string' },
        status: { type: 'string' },
        priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'] },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        related: { type: 'array', items: { type: 'number' } },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_item',
    description: 'Delete an item',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Item ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_items',
    description: 'List items with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        status: { type: 'string' },
        limit: { type: 'number', default: 20, maximum: 100 },
        offset: { type: 'number', default: 0 },
      },
    },
  },
  {
    name: 'search_items',
    description: 'Search items by query',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        types: { type: 'array', items: { type: 'string' } },
        limit: { type: 'number', default: 20, maximum: 100 },
        offset: { type: 'number', default: 0 },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_current_state',
    description: 'Get current system state',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_current_state',
    description: 'Update current system state',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'State content in Markdown' },
        tags: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'object' },
      },
      required: ['content'],
    },
  },
  {
    name: 'get_stats',
    description: 'Get system statistics',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await initializeDatabase();
  
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_item': {
        if (!args) {
          throw new McpError(ErrorCode.InvalidParams, 'Arguments required');
        }
        // Get or create status
        let statusId = 1; // Default to first status
        if (args.status && typeof args.status === 'string') {
          const statusRepo = AppDataSource.getRepository(Status);
          let status = await statusRepo.findOne({ where: { name: args.status as string } });
          if (!status) {
            // Create status if it doesn't exist
            status = await statusRepo.save({ 
              name: args.status as string,
              isClosable: false,
              sortOrder: 0 
            });
          }
          statusId = status.id;
        }

        // Create item
        const item = await itemRepo.create({
          type: args.type ? String(args.type) : 'issue',
          title: args.title ? String(args.title) : 'Untitled',
          description: args.description ? String(args.description) : '',
          content: args.content ? String(args.content) : '',
          statusId,
          priority: args.priority ? String(args.priority) : 'MEDIUM',
          category: args.category ? String(args.category) : undefined,
        });

        // Handle tags
        if (args.tags && Array.isArray(args.tags) && args.tags.length > 0) {
          const tagRepo = AppDataSource.getRepository(Tag);
          const itemTagRepo = AppDataSource.getRepository(ItemTag);
          
          for (const tagName of args.tags as string[]) {
            let tag = await tagRepo.findOne({ where: { name: tagName } });
            if (!tag) {
              tag = await tagRepo.save({ name: tagName });
            }
            await itemTagRepo.save({ itemId: item.id, tagId: tag.id });
          }
        }

        // Handle relations
        if (args.related && Array.isArray(args.related) && args.related.length > 0) {
          const relationRepo = AppDataSource.getRepository(ItemRelation);
          for (const targetId of args.related as number[]) {
            await relationRepo.save({ sourceId: item.id, targetId });
            await relationRepo.save({ sourceId: targetId, targetId: item.id });
          }
        }

        // Remove embedding from response
        const { embedding, ...itemWithoutEmbedding } = item;
        return {
          content: [{ type: 'text', text: JSON.stringify(itemWithoutEmbedding, null, 2) }],
        };
      }

      case 'get_item': {
        if (!args || typeof args.id !== 'number') {
          throw new McpError(ErrorCode.InvalidParams, 'Valid item ID required');
        }
        const item = await itemRepo.findById(args.id);
        if (!item) {
          throw new McpError(ErrorCode.InvalidParams, `Item ${args.id} not found`);
        }

        // Get tags
        const itemTagRepo = AppDataSource.getRepository(ItemTag);
        const tagRepo = AppDataSource.getRepository(Tag);
        const itemTags = await itemTagRepo.find({ where: { itemId: item.id } });
        const tags = [];
        for (const it of itemTags) {
          const tag = await tagRepo.findOne({ where: { id: it.tagId } });
          if (tag) tags.push(tag.name);
        }

        // Get relations
        const relationRepo = AppDataSource.getRepository(ItemRelation);
        const relations = await relationRepo.find({ where: { sourceId: item.id } });
        const related = relations.map(r => r.targetId);

        // Remove embedding but keep content for single item retrieval
        const { embedding, ...itemWithoutEmbedding } = item;
        const result = {
          ...itemWithoutEmbedding,
          tags,
          related,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'update_item': {
        if (!args || typeof args.id !== 'number') {
          throw new McpError(ErrorCode.InvalidParams, 'Valid item ID required');
        }
        const existing = await itemRepo.findById(args.id);
        if (!existing) {
          throw new McpError(ErrorCode.InvalidParams, `Item ${args.id} not found`);
        }

        // Handle status update
        if (args.status && typeof args.status === 'string') {
          const statusRepo = AppDataSource.getRepository(Status);
          let status = await statusRepo.findOne({ where: { name: args.status as string } });
          if (!status) {
            status = await statusRepo.save({ 
              name: args.status as string,
              isClosable: false,
              sortOrder: 0 
            });
          }
          (args as any).statusId = status.id;
          delete args.status;
        }

        // Update item (excluding tags and related)
        const { tags, related, ...updateData } = args;
        const updated = await itemRepo.update(args.id, updateData);

        // Update tags if provided
        if (tags !== undefined) {
          const itemTagRepo = AppDataSource.getRepository(ItemTag);
          const tagRepo = AppDataSource.getRepository(Tag);
          
          // Remove existing tags
          await itemTagRepo.delete({ itemId: args.id });
          
          // Add new tags
          for (const tagName of tags as string[]) {
            let tag = await tagRepo.findOne({ where: { name: tagName } });
            if (!tag) {
              tag = await tagRepo.save({ name: tagName });
            }
            await itemTagRepo.save({ itemId: args.id, tagId: tag.id });
          }
        }

        // Update relations if provided
        if (related !== undefined) {
          const relationRepo = AppDataSource.getRepository(ItemRelation);
          
          // Remove existing relations
          await relationRepo.delete({ sourceId: args.id });
          
          // Add new relations (bidirectional)
          for (const targetId of related as number[]) {
            await relationRepo.save({ sourceId: args.id, targetId });
            await relationRepo.save({ sourceId: targetId, targetId: args.id });
          }
        }

        // Remove embedding from response
        if (updated) {
          const { embedding, ...updatedWithoutEmbedding } = updated;
          return {
            content: [{ type: 'text', text: JSON.stringify(updatedWithoutEmbedding, null, 2) }],
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
        };
      }

      case 'delete_item': {
        if (!args || typeof args.id !== 'number') {
          throw new McpError(ErrorCode.InvalidParams, 'Valid item ID required');
        }
        const success = await itemRepo.delete(args.id);
        return {
          content: [{ type: 'text', text: success ? 'Item deleted' : 'Item not found' }],
        };
      }

      case 'list_items': {
        const safeArgs = args || {};
        const items = await itemRepo.findAll({
          type: safeArgs.type ? String(safeArgs.type) : undefined,
          status: safeArgs.status ? String(safeArgs.status) : undefined,
          limit: typeof safeArgs.limit === 'number' ? safeArgs.limit : 20,
          offset: typeof safeArgs.offset === 'number' ? safeArgs.offset : 0,
        });

        // Remove content and embedding from list results
        const sanitized = items.map(item => {
          const { content, embedding, ...rest } = item;
          return rest;
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(sanitized, null, 2) }],
        };
      }

      case 'search_items': {
        if (!args || typeof args.query !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Search query required');
        }
        const items = await itemRepo.search(args.query);
        
        // Filter by types if provided
        let filtered = items;
        if (args.types && Array.isArray(args.types) && args.types.length > 0) {
          const types = args.types as string[];
          filtered = items.filter(item => types.includes(item.type));
        }

        // Apply pagination
        const start = typeof args.offset === 'number' ? args.offset : 0;
        const limit = typeof args.limit === 'number' ? args.limit : 20;
        const paginated = filtered.slice(start, start + limit);

        // Remove content and embedding from search results
        const sanitized = paginated.map(item => {
          const { content, embedding, ...rest } = item;
          return rest;
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(sanitized, null, 2) }],
        };
      }

      case 'get_current_state': {
        const state = await stateRepo.getCurrent();
        if (!state) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ message: 'No current state' }, null, 2) }],
          };
        }

        const result = {
          ...state,
          tags: state.tags ? JSON.parse(state.tags) : [],
          metadata: state.metadata ? JSON.parse(state.metadata) : {},
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'update_current_state': {
        if (!args || typeof args.content !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Content required');
        }
        const newState = await stateRepo.create({
          content: args.content,
          tags: args.tags ? JSON.stringify(args.tags) : '[]',
          metadata: args.metadata ? JSON.stringify(args.metadata) : undefined,
          version: '0.9.0',
          isActive: true,
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(newState, null, 2) }],
        };
      }

      case 'get_stats': {
        const itemCount = await itemRepo.count();
        const statusRepo = AppDataSource.getRepository(Status);
        const tagRepo = AppDataSource.getRepository(Tag);
        
        const statusCount = await statusRepo.count();
        const tagCount = await tagRepo.count();

        const stats = {
          items: itemCount,
          statuses: statusCount,
          tags: tagCount,
          version: '0.9.0',
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Start server
export async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server started (TypeORM version)');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}