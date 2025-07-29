import { BaseRepository } from './base.js';
/**
 * @ai-context Centralized search functionality across all content types
 * @ai-pattern Simple full-text search using SQLite FTS5
 * @ai-critical Performance-critical - searches must be fast for good UX
 * @ai-assumption SQLite items table is kept in sync with markdown files
 */
export class SearchRepository extends BaseRepository {
    constructor(db) {
        super(db, 'SearchRepository');
    }
    /**
     * @ai-intent Full-text search across all content
     * @ai-flow Query items table with LIKE for simple text matching
     * @ai-performance Uses indexes on title/content columns
     */
    async searchContent(query) {
        const results = await this.db.allAsync(`SELECT type, id, title, description, content, tags, created_at, updated_at 
       FROM items 
       WHERE title LIKE ? OR content LIKE ? OR description LIKE ?
       ORDER BY created_at DESC`, [`%${query}%`, `%${query}%`, `%${query}%`]);
        return results.map((row) => {
            const searchRow = row;
            return {
                ...searchRow,
                content: searchRow.content ? searchRow.content.substring(0, 200) + '...' : '',
                tags: searchRow.tags ? JSON.parse(searchRow.tags) : []
            };
        });
    }
    /**
     * @ai-intent Search all items by tag (legacy method)
     * @ai-flow Query items table for tag match
     * @ai-return Grouped results by type
     */
    async searchAllByTag(tag) {
        const results = await this.db.allAsync(`SELECT type, id, title, description, content, tags, priority, created_at, updated_at 
       FROM items 
       WHERE tags LIKE ?
       ORDER BY type, created_at DESC`, [`%"${tag}"%`]);
        // Group results by type
        const grouped = {
            issues: [],
            plans: [],
            docs: [],
            knowledge: []
        };
        for (const row of results) {
            const searchRow = row;
            const item = {
                ...searchRow,
                id: parseInt(String(searchRow.id)),
                title: String(searchRow.title),
                tags: searchRow.tags ? JSON.parse(String(searchRow.tags)) : []
            };
            const type = String(searchRow.type);
            if (type in grouped) {
                grouped[type].push(item);
            }
        }
        return grouped;
    }
}
//# sourceMappingURL=search-repository.js.map