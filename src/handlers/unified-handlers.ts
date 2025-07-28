/**
 * @ai-context Unified handlers for all item types using single ItemRepository
 * @ai-pattern Handler layer with unified API
 * @ai-critical Replaces separate task/document handlers
 * @ai-dependencies ItemRepository for data access, schemas for validation
 */

import type { z } from 'zod';
import type { CallToolRequest, Tool } from '@modelcontextprotocol/sdk/types.js';
import { ItemRepository } from '../repositories/item-repository.js';
import { StatusRepository } from '../database/status-repository.js';
import { TypeRepository } from '../database/type-repository.js';
import type { FileIssueDatabase } from '../database.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { UnifiedItem } from '../types/unified-types.js';

// Import schemas
import {
  GetItemsParams,
  GetItemDetailParams,
  CreateItemParams,
  UpdateItemParams,
  DeleteItemParams,
  SearchItemsByTagParams
} from '../schemas/unified-schemas.js';

/**
 * @ai-intent Create unified handlers for item operations
 * @ai-pattern Factory function returns handler map
 * @ai-flow Initialize repository -> Create handlers -> Return tool definitions
 */
export function createUnifiedHandlers(fileDb: FileIssueDatabase) {
  // Get repositories from FileIssueDatabase
  const itemRepository = fileDb.getItemRepository();
  const typeRepository = new TypeRepository(fileDb);
  
  // @ai-note: TypeRepository needs to be initialized to get database connection
  (async () => {
    await typeRepository.init();
  })();

  /**
   * @ai-intent Get items by type with optional filtering
   * @ai-flow 1. Validate params -> 2. Check type -> 3. Search with filters -> 4. Return items
   */
  async function handleGetItems(params: z.infer<typeof GetItemsParams>): Promise<UnifiedItem[]> {
    const { type, statuses, includeClosedStatuses, start_date, end_date, limit } = params;
    
    // Special handling for get_latest_session equivalent
    if (type === 'sessions' && !start_date && !end_date && limit === 1) {
      // Get today's latest session
      const today = new Date().toISOString().split('T')[0];
      const sessions = await itemRepository.getItems(type, includeClosedStatuses, statuses, today, today, limit);
      return sessions;
    }

    return itemRepository.getItems(type, includeClosedStatuses, statuses, start_date, end_date, limit);
  }

  /**
   * @ai-intent Get single item by type and ID
   * @ai-flow 1. Validate params -> 2. Get item -> 3. Return or throw
   */
  async function handleGetItemDetail(params: z.infer<typeof GetItemDetailParams>): Promise<UnifiedItem> {
    const { type, id } = params;

    const item = await itemRepository.getItem(type, String(id));
    if (!item) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `${type} with ID ${id} not found`
      );
    }

    return item;
  }

  /**
   * @ai-intent Create new item of any type
   * @ai-flow 1. Validate params -> 2. Create item -> 3. Return created item
   */
  async function handleCreateItem(params: z.infer<typeof CreateItemParams>): Promise<UnifiedItem> {
    return itemRepository.createItem(params);
  }

  /**
   * @ai-intent Update existing item
   * @ai-flow 1. Validate params -> 2. Update item -> 3. Return updated or throw
   */
  async function handleUpdateItem(params: z.infer<typeof UpdateItemParams>): Promise<UnifiedItem> {
    const { type, id, ...updateData } = params;

    const updated = await itemRepository.updateItem({ type, id: String(id), ...updateData });
    if (!updated) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `${type} with ID ${id} not found`
      );
    }

    return updated;
  }

  /**
   * @ai-intent Delete item by type and ID
   * @ai-flow 1. Validate params -> 2. Delete item -> 3. Return success
   */
  async function handleDeleteItem(params: z.infer<typeof DeleteItemParams>): Promise<string> {
    const { type, id } = params;

    const deleted = await itemRepository.deleteItem(type, String(id));
    if (!deleted) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `${type} with ID ${id} not found`
      );
    }

    return `${type} ID ${id} deleted`;
  }

  /**
   * @ai-intent Search items by tag across types
   * @ai-flow 1. Validate params -> 2. Search with tag filter -> 3. Return items
   */
  async function handleSearchItemsByTag(params: z.infer<typeof SearchItemsByTagParams>): Promise<any> {
    const { tag, types } = params;

    const items = await itemRepository.searchItemsByTag(tag, types);

    // Transform to nested format for backward compatibility
    const result: any = {
      tasks: {},
      documents: {}
    };

    // Get all base_types at once for efficiency
    const uniqueTypes = [...new Set(items.map(item => item.type))];
    const typeInfos = await Promise.all(
      uniqueTypes.map(async (type) => {
        const baseType = await typeRepository.getBaseType(type);
        return { type, baseType: baseType || 'documents' };
      })
    );
    
    // Create a map for quick lookup
    const typeToBaseType = new Map(
      typeInfos.map(info => [info.type, info.baseType])
    );

    for (const item of items) {
      const baseType = typeToBaseType.get(item.type) || 'documents';
      
      // Special handling for sessions - they go under tasks for backward compatibility
      if (item.type === 'sessions') {
        if (!result.tasks[item.type]) {
          result.tasks[item.type] = [];
        }
        result.tasks[item.type].push(item);
      } else if (baseType === 'tasks') {
        if (!result.tasks[item.type]) {
          result.tasks[item.type] = [];
        }
        result.tasks[item.type].push(item);
      } else {
        // documents or any other base_type (including dailies)
        if (!result.documents[item.type]) {
          result.documents[item.type] = [];
        }
        result.documents[item.type].push(item);
      }
    }

    return result;
  }

  // Return handler map
  return {
    get_items: handleGetItems,
    get_item_detail: handleGetItemDetail,
    create_item: handleCreateItem,
    update_item: handleUpdateItem,
    delete_item: handleDeleteItem,
    search_items_by_tag: handleSearchItemsByTag
  };
}

/**
 * @ai-intent Define unified tools for MCP
 * @ai-pattern Tool definitions with JSON schemas
 */
export const unifiedTools: Tool[] = [
  {
    name: 'get_items',
    description: 'Retrieve list of items by type. Tasks types support status filtering. Document types return all items.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of items to retrieve (use get_types to see available types)'
        },
        statusIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Filter by specific status IDs (tasks types only)'
        },
        includeClosedStatuses: {
          type: 'boolean',
          description: 'Include items with closed statuses (tasks types only, default: false)'
        },
        start_date: {
          type: 'string',
          description: 'Filter by start date (sessions/dailies) or updated_at (other types) from this date'
        },
        end_date: {
          type: 'string',
          description: 'Filter by start date (sessions/dailies) or updated_at (other types) until this date'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of items to return (useful for getting latest item)'
        }
      },
      required: ['type']
    }
  },
  {
    name: 'get_item_detail',
    description: 'Get detailed information for specified item.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of item (use get_types to see available types)'
        },
        id: {
          type: ['string', 'number'],
          description: 'Item ID'
        }
      },
      required: ['type', 'id']
    }
  },
  {
    name: 'create_item',
    description: 'Create new item.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of item to create (use get_types to see available types)'
        },
        title: {
          type: 'string',
          description: 'Item title (required)'
        },
        description: {
          type: 'string',
          description: 'Item description (optional for all types)'
        },
        content: {
          type: 'string',
          description: 'Item content (required for document types)'
        },
        priority: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Priority (for tasks types)'
        },
        status: {
          type: 'string',
          description: 'Status name (for tasks types)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tag names'
        },
        related_documents: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related document references (for all types, e.g. ["docs-1", "knowledge-2"])'
        },
        related_tasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related task references (for tasks types, e.g. ["issues-1", "plans-2"])'
        },
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (for tasks types)'
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (for tasks types)'
        },
        datetime: {
          type: 'string',
          description: 'ISO 8601 datetime (for sessions, optional for past data migration)'
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (for dailies)'
        },
        id: {
          type: 'string',
          description: 'Custom ID (for sessions, optional)'
        },
        category: {
          type: 'string',
          description: 'Category (for sessions, optional)'
        }
      },
      required: ['type', 'title']
    }
  },
  {
    name: 'update_item',
    description: 'Update existing item.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of item to update (use get_types to see available types)'
        },
        id: {
          type: ['string', 'number'],
          description: 'Item ID'
        },
        title: {
          type: 'string',
          description: 'New title'
        },
        description: {
          type: 'string',
          description: 'New description'
        },
        content: {
          type: 'string',
          description: 'New content (for document types)'
        },
        priority: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'New priority (for tasks types)'
        },
        status: {
          type: 'string',
          description: 'New status name (for tasks types)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New array of tag names'
        },
        related_documents: {
          type: 'array',
          items: { type: 'string' },
          description: 'New related document references (for all types, e.g. ["docs-1", "knowledge-2"])'
        },
        related_tasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'New related task references (for tasks types, e.g. ["issues-1", "plans-2"])'
        },
        start_date: {
          type: ['string', 'null'],
          description: 'New start date (for tasks types)'
        },
        end_date: {
          type: ['string', 'null'],
          description: 'New end date (for tasks types)'
        }
      },
      required: ['type', 'id']
    }
  },
  {
    name: 'delete_item',
    description: 'Delete item.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of item to delete (use get_types to see available types)'
        },
        id: {
          type: ['string', 'number'],
          description: 'Item ID'
        }
      },
      required: ['type', 'id']
    }
  },
  {
    name: 'search_items_by_tag',
    description: 'Search items by tag, optionally filtered by types.',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'Tag name to search for'
        },
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Types to search (omit to search all types, use get_types to see available types)'
        }
      },
      required: ['tag']
    }
  }
];

/**
 * @ai-intent Main handler function for MCP tool calls
 * @ai-flow 1. Parse request -> 2. Validate -> 3. Route to handler -> 4. Return result
 */
export async function handleUnifiedToolCall(
  name: string,
  args: any,
  handlers: ReturnType<typeof createUnifiedHandlers>
): Promise<{ content: { type: 'text'; text: string }[] }> {

  let result: any;

  // Route to appropriate handler
  switch (name) {
    case 'get_items':
      result = await handlers.get_items(GetItemsParams.parse(args));
      break;

    case 'get_item_detail':
      result = await handlers.get_item_detail(GetItemDetailParams.parse(args));
      break;

    case 'create_item':
      result = await handlers.create_item(CreateItemParams.parse(args));
      break;

    case 'update_item':
      result = await handlers.update_item(UpdateItemParams.parse(args));
      break;

    case 'delete_item':
      result = await handlers.delete_item(DeleteItemParams.parse(args));
      break;

    case 'search_items_by_tag':
      result = await handlers.search_items_by_tag(SearchItemsByTagParams.parse(args));
      break;

    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
  }

  // Format response for MCP protocol with backward compatibility
  // Wrap in { data: ... } for consistency with old handlers
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ data: result }, null, 2)
      }
    ]
  };
}