/**
 * @ai-context Full-text search repository using FTS5
 * @ai-pattern Repository pattern for search functionality
 * @ai-dependencies Database, ItemRepository for result hydration
 */
import type { Database } from './base.js';
export interface SearchResult {
    type: string;
    id: string;
    title: string;
    snippet: string;
    score: number;
}
export declare class FullTextSearchRepository {
    private db;
    private logger;
    constructor(db: Database);
    /**
     * @ai-intent Search items by query across title, description, and content
     * @ai-flow 1. Build FTS5 query -> 2. Execute search -> 3. Format results
     * @ai-performance Uses FTS5 index for fast searching
     */
    search(query: string, options?: {
        types?: string[];
        limit?: number;
        offset?: number;
    }): Promise<SearchResult[]>;
    /**
     * @ai-intent Get search suggestions based on partial query
     * @ai-flow 1. Build prefix query -> 2. Get unique titles -> 3. Return suggestions
     */
    suggest(query: string, options?: {
        types?: string[];
        limit?: number;
    }): Promise<string[]>;
    /**
     * @ai-intent Count total search results
     * @ai-flow 1. Build count query -> 2. Execute -> 3. Return count
     */
    count(query: string, options?: {
        types?: string[];
    }): Promise<number>;
}
