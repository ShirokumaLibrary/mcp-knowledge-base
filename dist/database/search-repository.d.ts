import type { Database } from './base.js';
import { BaseRepository } from './base.js';
/**
 * @ai-context Centralized search functionality across all content types
 * @ai-pattern Simple full-text search using SQLite FTS5
 * @ai-critical Performance-critical - searches must be fast for good UX
 * @ai-assumption SQLite items table is kept in sync with markdown files
 */
export declare class SearchRepository extends BaseRepository {
    constructor(db: Database);
    /**
     * @ai-intent Full-text search across all content
     * @ai-flow Query items table with LIKE for simple text matching
     * @ai-performance Uses indexes on title/content columns
     */
    searchContent(query: string): Promise<any[]>;
    /**
     * @ai-intent Search all items by tag (legacy method)
     * @ai-flow Query items table for tag match
     * @ai-return Grouped results by type
     */
    searchAllByTag(tag: string): Promise<any>;
}
