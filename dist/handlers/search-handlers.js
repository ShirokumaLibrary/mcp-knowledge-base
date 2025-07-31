import { z } from 'zod';
import { createLogger } from '../utils/logger.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
const logger = createLogger('SearchHandlers');
const searchItemsSchema = z.object({
    query: z.string().min(1, 'Query is required'),
    types: z.array(z.string()).optional(),
    limit: z.number().min(1).max(100).optional().default(20),
    offset: z.number().min(0).optional().default(0)
});
const searchSuggestSchema = z.object({
    query: z.string().min(1, 'Query is required'),
    types: z.array(z.string()).optional(),
    limit: z.number().min(1).max(20).optional().default(10)
});
export class SearchHandlers {
    db;
    searchRepo;
    itemRepo;
    constructor(db) {
        this.db = db;
    }
    getSearchRepo() {
        if (!this.searchRepo) {
            this.searchRepo = this.db.getFullTextSearchRepository();
        }
        return this.searchRepo;
    }
    getItemRepo() {
        if (!this.itemRepo) {
            this.itemRepo = this.db.getItemRepository();
        }
        return this.itemRepo;
    }
    async searchItems(params) {
        try {
            const validated = searchItemsSchema.parse(params);
            const results = await this.getSearchRepo().search(validated.query, {
                types: validated.types,
                limit: validated.limit,
                offset: validated.offset
            });
            const totalCount = await this.getSearchRepo().count(validated.query, {
                types: validated.types
            });
            const items = await Promise.all(results.map(async (result) => {
                try {
                    const item = await this.getItemRepo().getItem(result.type, result.id);
                    if (!item) {
                        logger.warn(`Item not found: ${result.type}:${result.id}`);
                        return null;
                    }
                    return {
                        ...item,
                        _search: {
                            snippet: result.snippet,
                            score: result.score
                        }
                    };
                }
                catch (error) {
                    logger.warn(`Failed to load item ${result.type}:${result.id}`, error);
                    return null;
                }
            }));
            const validItems = items.filter(item => item !== null);
            const result = {
                items: validItems,
                pagination: {
                    total: totalCount,
                    limit: validated.limit,
                    offset: validated.offset,
                    hasMore: validated.offset + validated.limit < totalCount
                }
            };
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(result)
                    }]
            };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
            }
            logger.error('Search failed:', error);
            throw new McpError(ErrorCode.InternalError, 'Search operation failed');
        }
    }
    async searchSuggest(params) {
        try {
            const validated = searchSuggestSchema.parse(params);
            const suggestions = await this.getSearchRepo().suggest(validated.query, {
                types: validated.types,
                limit: validated.limit
            });
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ suggestions })
                    }]
            };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
            }
            logger.error('Search suggest failed:', error);
            throw new McpError(ErrorCode.InternalError, 'Search suggest operation failed');
        }
    }
}
