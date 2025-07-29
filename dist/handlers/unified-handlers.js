import { TypeRepository } from '../database/type-repository.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { GetItemsParams, GetItemDetailParams, CreateItemParams, UpdateItemParams, DeleteItemParams, SearchItemsByTagParams } from '../schemas/unified-schemas.js';
export function createUnifiedHandlers(fileDb) {
    const itemRepository = fileDb.getItemRepository();
    const typeRepository = new TypeRepository(fileDb);
    (async () => {
        await typeRepository.init();
    })();
    async function handleGetItems(params) {
        const { type, statuses, includeClosedStatuses, start_date, end_date, limit } = params;
        if (type === 'sessions' && !start_date && !end_date && limit === 1) {
            const today = new Date().toISOString().split('T')[0];
            const sessions = await itemRepository.getItems(type, includeClosedStatuses, statuses, today, today, limit);
            return sessions;
        }
        return itemRepository.getItems(type, includeClosedStatuses, statuses, start_date, end_date, limit);
    }
    async function handleGetItemDetail(params) {
        const { type, id } = params;
        const item = await itemRepository.getItem(type, String(id));
        if (!item) {
            throw new McpError(ErrorCode.InvalidRequest, `${type} with ID ${id} not found`);
        }
        return item;
    }
    async function handleCreateItem(params) {
        return itemRepository.createItem(params);
    }
    async function handleUpdateItem(params) {
        const { type, id, ...updateData } = params;
        const updated = await itemRepository.updateItem({ type, id: String(id), ...updateData });
        if (!updated) {
            throw new McpError(ErrorCode.InvalidRequest, `${type} with ID ${id} not found`);
        }
        return updated;
    }
    async function handleDeleteItem(params) {
        const { type, id } = params;
        const deleted = await itemRepository.deleteItem(type, String(id));
        if (!deleted) {
            throw new McpError(ErrorCode.InvalidRequest, `${type} with ID ${id} not found`);
        }
        return `${type} ID ${id} deleted`;
    }
    async function handleSearchItemsByTag(params) {
        const { tag, types } = params;
        const items = await itemRepository.searchItemsByTag(tag, types);
        const result = {
            tasks: {},
            documents: {}
        };
        const uniqueTypes = [...new Set(items.map(item => item.type))];
        const typeInfos = await Promise.all(uniqueTypes.map(async (type) => {
            const baseType = await typeRepository.getBaseType(type);
            return { type, baseType: baseType || 'documents' };
        }));
        const typeToBaseType = new Map(typeInfos.map(info => [info.type, info.baseType]));
        for (const item of items) {
            const baseType = typeToBaseType.get(item.type) || 'documents';
            if (item.type === 'sessions') {
                if (!result.tasks[item.type]) {
                    result.tasks[item.type] = [];
                }
                result.tasks[item.type].push(item);
            }
            else if (baseType === 'tasks') {
                if (!result.tasks[item.type]) {
                    result.tasks[item.type] = [];
                }
                result.tasks[item.type].push(item);
            }
            else {
                if (!result.documents[item.type]) {
                    result.documents[item.type] = [];
                }
                result.documents[item.type].push(item);
            }
        }
        return result;
    }
    return {
        get_items: handleGetItems,
        get_item_detail: handleGetItemDetail,
        create_item: handleCreateItem,
        update_item: handleUpdateItem,
        delete_item: handleDeleteItem,
        search_items_by_tag: handleSearchItemsByTag
    };
}
export const unifiedTools = [
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
                    description: 'Custom ID (for sessions, optional)',
                    pattern: '^[a-zA-Z0-9\\-_.]+$'
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
export async function handleUnifiedToolCall(name, args, handlers) {
    let result;
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
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ data: result }, null, 2)
            }
        ]
    };
}
