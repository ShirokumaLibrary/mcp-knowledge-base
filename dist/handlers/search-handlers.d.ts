/**
 * @ai-context Full-text search handlers for MCP API
 * @ai-pattern Handler pattern for search operations
 * @ai-dependencies FullTextSearchRepository, ItemRepository
 */
import type { FileIssueDatabase } from '../database/index.js';
export declare class SearchHandlers {
    private db;
    private searchRepo?;
    private itemRepo?;
    constructor(db: FileIssueDatabase);
    private getSearchRepo;
    private getItemRepo;
    /**
     * @ai-intent Search items using full-text search
     * @ai-flow 1. Validate params -> 2. Execute search -> 3. Hydrate results
     * @ai-error-handling Returns empty array on search failure
     */
    searchItems(params: unknown): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    /**
     * @ai-intent Get search suggestions for autocomplete
     * @ai-flow 1. Validate params -> 2. Get suggestions
     */
    searchSuggest(params: unknown): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
}
