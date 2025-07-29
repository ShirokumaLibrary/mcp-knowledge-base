/**
 * @ai-context Full-text search handlers for MCP API
 * @ai-pattern Handler pattern for search operations
 * @ai-dependencies FullTextSearchRepository, ItemRepository
 */

import { z } from 'zod';
import type { FileIssueDatabase } from '../database/index.js';
import type { FullTextSearchRepository } from '../database/fulltext-search-repository.js';
import { createLogger } from '../utils/logger.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

const logger = createLogger('SearchHandlers');

// Schemas
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
  private searchRepo?: FullTextSearchRepository;
  private itemRepo?: ReturnType<FileIssueDatabase['getItemRepository']>;

  constructor(private db: FileIssueDatabase) {
    // Initialize repositories lazily to avoid database initialization issues
  }

  private getSearchRepo(): FullTextSearchRepository {
    if (!this.searchRepo) {
      this.searchRepo = this.db.getFullTextSearchRepository();
    }
    return this.searchRepo;
  }

  private getItemRepo(): ReturnType<FileIssueDatabase['getItemRepository']> {
    if (!this.itemRepo) {
      this.itemRepo = this.db.getItemRepository();
    }
    return this.itemRepo;
  }

  /**
   * @ai-intent Search items using full-text search
   * @ai-flow 1. Validate params -> 2. Execute search -> 3. Hydrate results
   * @ai-error-handling Returns empty array on search failure
   */
  async searchItems(params: unknown) {
    try {
      const validated = searchItemsSchema.parse(params);

      // Get search results
      const results = await this.getSearchRepo().search(validated.query, {
        types: validated.types,
        limit: validated.limit,
        offset: validated.offset
      });

      // Get total count for pagination
      const totalCount = await this.getSearchRepo().count(validated.query, {
        types: validated.types
      });

      // Hydrate full items
      const items = await Promise.all(
        results.map(async (result) => {
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
          } catch (error) {
            logger.warn(`Failed to load item ${result.type}:${result.id}`, error);
            return null;
          }
        })
      );

      // Filter out failed items
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
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`
        );
      }
      logger.error('Search failed:', error);
      throw new McpError(
        ErrorCode.InternalError,
        'Search operation failed'
      );
    }
  }

  /**
   * @ai-intent Get search suggestions for autocomplete
   * @ai-flow 1. Validate params -> 2. Get suggestions
   */
  async searchSuggest(params: unknown) {
    try {
      const validated = searchSuggestSchema.parse(params);

      const suggestions = await this.getSearchRepo().suggest(validated.query, {
        types: validated.types,
        limit: validated.limit
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ suggestions }, null, 2)
        }]
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`
        );
      }
      logger.error('Search suggest failed:', error);
      throw new McpError(
        ErrorCode.InternalError,
        'Search suggest operation failed'
      );
    }
  }
}