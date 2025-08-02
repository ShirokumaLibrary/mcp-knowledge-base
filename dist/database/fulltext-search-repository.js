import { createLogger } from '../utils/logger.js';
import { parseSearchQuery, toFTS5Query, hasFieldSpecificSearch } from '../utils/search-query-parser.js';
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
        const trimmedQuery = query.trim();
        let ftsQuery;
        if (!trimmedQuery) {
            throw new Error('Search query cannot be empty');
        }
        const parsed = parseSearchQuery(trimmedQuery);
        ftsQuery = toFTS5Query(parsed);
        if (!ftsQuery) {
            throw new Error('Invalid search query');
        }
        let typeFilter = '';
        let params = [ftsQuery, limit, offset];
        if (options?.types && options.types.length > 0) {
            const placeholders = options.types.map(() => '?').join(',');
            typeFilter = `AND items.type IN (${placeholders})`;
            params = [ftsQuery, ...options.types, limit, offset];
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
        const trimmedQuery = query.trim();
        let ftsQuery;
        if (!trimmedQuery) {
            return [];
        }
        const parsed = parseSearchQuery(trimmedQuery);
        function addPrefixToRightmostTerm(expr) {
            if (expr.type === 'term') {
                if (!expr.value.endsWith('*')) {
                    return { ...expr, value: expr.value + '*' };
                }
                return expr;
            }
            else if (expr.type === 'boolean') {
                return {
                    ...expr,
                    right: addPrefixToRightmostTerm(expr.right)
                };
            }
            return expr;
        }
        const modifiedExpression = addPrefixToRightmostTerm(parsed.expression);
        const modifiedParsed = { ...parsed, expression: modifiedExpression };
        ftsQuery = toFTS5Query(modifiedParsed);
        let typeFilter = '';
        let params = [ftsQuery, limit];
        if (options?.types && options.types.length > 0) {
            const placeholders = options.types.map(() => '?').join(',');
            typeFilter = `AND items.type IN (${placeholders})`;
            params = [ftsQuery, ...options.types, limit];
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
        const trimmedQuery = query.trim();
        let ftsQuery;
        if (!trimmedQuery) {
            throw new Error('Search query cannot be empty');
        }
        if (hasFieldSpecificSearch(trimmedQuery)) {
            const parsed = parseSearchQuery(trimmedQuery);
            ftsQuery = toFTS5Query(parsed);
        }
        else {
            const words = trimmedQuery.split(/\s+/).filter(word => word.length > 0);
            if (words.length === 1) {
                ftsQuery = words[0];
            }
            else {
                ftsQuery = words.map(word => {
                    return word.replace(/['"]/g, '');
                }).join(' AND ');
            }
        }
        let typeFilter = '';
        let params = [ftsQuery];
        if (options?.types && options.types.length > 0) {
            const placeholders = options.types.map(() => '?').join(',');
            typeFilter = `AND items.type IN (${placeholders})`;
            params = [ftsQuery, ...options.types];
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
