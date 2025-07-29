import { createLogger } from '../utils/logger.js';
export class FullTextSearchRepository {
    db;
    logger = createLogger('FullTextSearchRepository');
    constructor(db) {
        this.db = db;
    }
    async search(query, options) {
        const defaultLimit = 20;
        const maxLimit = 1000;
        const limit = Math.min(Math.max(1, options?.limit || defaultLimit), maxLimit);
        const offset = Math.max(0, options?.offset || 0);
        const escapedQuery = query.replace(/['"]/g, '');
        let typeFilter = '';
        let params = [`"${escapedQuery}"`, limit, offset];
        if (options?.types && options.types.length > 0) {
            const placeholders = options.types.map(() => '?').join(',');
            typeFilter = `AND items.type IN (${placeholders})`;
            params = [`"${escapedQuery}"`, ...options.types, limit, offset];
        }
        const sql = `
      SELECT 
        items.type as type,
        items.id as id,
        items.title as title,
        snippet(items_fts, 3, '<mark>', '</mark>', '...', 50) as snippet,
        bm25(items_fts) as score
      FROM items_fts
      JOIN items ON items.rowid = items_fts.rowid
      WHERE items_fts MATCH ? ${typeFilter}
      ORDER BY score, items.id
      LIMIT ? OFFSET ?
    `;
        try {
            const rows = await this.db.allAsync(sql, params);
            return rows.map(row => ({
                type: String(row.type),
                id: String(row.id),
                title: String(row.title),
                snippet: String(row.snippet),
                score: Math.abs(Number(row.score) || 0)
            }));
        }
        catch (error) {
            this.logger.error('Full-text search failed:', error);
            throw error;
        }
    }
    async suggest(query, options) {
        const defaultLimit = 10;
        const maxLimit = 100;
        const limit = Math.min(Math.max(1, options?.limit || defaultLimit), maxLimit);
        const escapedQuery = query.replace(/['"]/g, '');
        let typeFilter = '';
        let params = [`"${escapedQuery}"*`, limit];
        if (options?.types && options.types.length > 0) {
            const placeholders = options.types.map(() => '?').join(',');
            typeFilter = `AND items.type IN (${placeholders})`;
            params = [`"${escapedQuery}"*`, ...options.types, limit];
        }
        const sql = `
      SELECT DISTINCT items.title
      FROM items_fts
      JOIN items ON items.rowid = items_fts.rowid
      WHERE items_fts MATCH ? ${typeFilter}
      ORDER BY bm25(items_fts)
      LIMIT ?
    `;
        try {
            const rows = await this.db.allAsync(sql, params);
            return rows.map(row => row.title);
        }
        catch (error) {
            this.logger.error('Search suggestion failed:', error);
            return [];
        }
    }
    async count(query, options) {
        const escapedQuery = query.replace(/['"]/g, '');
        let typeFilter = '';
        let params = [`"${escapedQuery}"`];
        if (options?.types && options.types.length > 0) {
            const placeholders = options.types.map(() => '?').join(',');
            typeFilter = `AND items.type IN (${placeholders})`;
            params = [`"${escapedQuery}"`, ...options.types];
        }
        const sql = `
      SELECT COUNT(*) as count
      FROM items_fts
      JOIN items ON items.rowid = items_fts.rowid
      WHERE items_fts MATCH ? ${typeFilter}
    `;
        try {
            const result = await this.db.getAsync(sql, params);
            return result?.count || 0;
        }
        catch (error) {
            this.logger.error('Search count failed:', error);
            return 0;
        }
    }
}
