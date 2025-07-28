/**
 * @ai-context Unified handlers for all item types using single ItemRepository
 * @ai-pattern Handler layer with unified API
 * @ai-critical Replaces separate task/document handlers
 * @ai-dependencies ItemRepository for data access, schemas for validation
 */
import type { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FileIssueDatabase } from '../database.js';
import type { UnifiedItem } from '../types/unified-types.js';
import { GetItemsParams, GetItemDetailParams, CreateItemParams, UpdateItemParams, DeleteItemParams, SearchItemsByTagParams } from '../schemas/unified-schemas.js';
/**
 * @ai-intent Create unified handlers for item operations
 * @ai-pattern Factory function returns handler map
 * @ai-flow Initialize repository -> Create handlers -> Return tool definitions
 */
export declare function createUnifiedHandlers(fileDb: FileIssueDatabase): {
    get_items: (params: z.infer<typeof GetItemsParams>) => Promise<UnifiedItem[]>;
    get_item_detail: (params: z.infer<typeof GetItemDetailParams>) => Promise<UnifiedItem>;
    create_item: (params: z.infer<typeof CreateItemParams>) => Promise<UnifiedItem>;
    update_item: (params: z.infer<typeof UpdateItemParams>) => Promise<UnifiedItem>;
    delete_item: (params: z.infer<typeof DeleteItemParams>) => Promise<string>;
    search_items_by_tag: (params: z.infer<typeof SearchItemsByTagParams>) => Promise<any>;
};
/**
 * @ai-intent Define unified tools for MCP
 * @ai-pattern Tool definitions with JSON schemas
 */
export declare const unifiedTools: Tool[];
/**
 * @ai-intent Main handler function for MCP tool calls
 * @ai-flow 1. Parse request -> 2. Validate -> 3. Route to handler -> 4. Return result
 */
export declare function handleUnifiedToolCall(name: string, args: any, handlers: ReturnType<typeof createUnifiedHandlers>): Promise<{
    content: {
        type: 'text';
        text: string;
    }[];
}>;
