/**
 * @ai-context Full-text search repository using FTS5
 * @ai-pattern Repository pattern for search functionality
 * @ai-dependencies Database, ItemRepository for result hydration
 */

import type { Database } from './base.js';
import { createLogger } from '../utils/logger.js';
import { parseSearchQuery, toFTS5Query, hasFieldSpecificSearch, type QueryExpression } from '../utils/search-query-parser.js';

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  snippet: string;
  score: number;
}

export class FullTextSearchRepository {
  private logger = createLogger('FullTextSearchRepository');

  constructor(private db: Database) {}

  /**
   * @ai-intent Search items by query across title, description, and content
   * @ai-flow 1. Build FTS5 query -> 2. Execute search -> 3. Format results
   * @ai-performance Uses FTS5 index for fast searching
   */
  async search(
    query: string,
    options?: {
      types?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<SearchResult[]> {
    // @ai-validation: Ensure limit is positive and within reasonable bounds
    const defaultLimit = 20;
    const maxLimit = 1000;
    const limit = Math.min(
      Math.max(1, options?.limit || defaultLimit),
      maxLimit
    );

    // @ai-validation: Ensure offset is non-negative
    const offset = Math.max(0, options?.offset || 0);

    // Build FTS5 query with support for field-specific searches
    const trimmedQuery = query.trim();
    let ftsQuery: string;
    
    if (!trimmedQuery) {
      throw new Error('Search query cannot be empty');
    }
    
    // Always use the advanced parser for consistent behavior
    // The parser now handles simple queries, field-specific searches, and boolean operators
    const parsed = parseSearchQuery(trimmedQuery);
    ftsQuery = toFTS5Query(parsed);
    
    // If the FTS query is empty after parsing, throw an error
    if (!ftsQuery) {
      throw new Error('Invalid search query');
    }

    // Build type filter
    let typeFilter = '';
    // @ai-any-deliberate: SQLite params array - mixed types (string, number) for query parameters

    let params: (string | number)[] = [ftsQuery, limit, offset];

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
      // @ai-any-deliberate: Database query result - dynamic row structure from SQLite

      // @ai-any-deliberate: Database query result - dynamic row structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = await this.db.allAsync(sql, params) as any[];

      return rows.map(row => ({
        type: String(row.type),
        id: String(row.id),
        title: String(row.title),
        snippet: String(row.snippet),
        score: Math.abs(Number(row.score) || 0) // BM25 returns negative scores
      }));
    } catch (error) {
      this.logger.error('Full-text search failed:', error);
      throw error;
    }
  }

  /**
   * @ai-intent Get search suggestions based on partial query
   * @ai-flow 1. Build prefix query -> 2. Get unique titles -> 3. Return suggestions
   */
  async suggest(
    query: string,
    options?: {
      types?: string[];
      limit?: number;
    }
  ): Promise<string[]> {
    // @ai-validation: Ensure limit is positive and within reasonable bounds
    const defaultLimit = 10;
    const maxLimit = 100; // Smaller max for suggestions
    const limit = Math.min(
      Math.max(1, options?.limit || defaultLimit),
      maxLimit
    );

    // Build prefix query for FTS5
    const trimmedQuery = query.trim();
    let ftsQuery: string;
    
    if (!trimmedQuery) {
      return []; // Return empty suggestions for empty query
    }
    
    // For suggestions, we need to add prefix matching to the last term
    const parsed = parseSearchQuery(trimmedQuery);
    
    // Function to add prefix matching to the rightmost term in an expression
    function addPrefixToRightmostTerm(expr: QueryExpression): QueryExpression {
      if (expr.type === 'term') {
        // For a simple term, add prefix matching if it doesn't already have it
        if (!expr.value.endsWith('*')) {
          return { ...expr, value: expr.value + '*' };
        }
        return expr;
      } else if (expr.type === 'boolean') {
        // For boolean expressions, modify the rightmost term
        return {
          ...expr,
          right: addPrefixToRightmostTerm(expr.right)
        };
      }
      return expr;
    }
    
    // Modify the parsed expression to add prefix matching
    const modifiedExpression = addPrefixToRightmostTerm(parsed.expression);
    const modifiedParsed = { ...parsed, expression: modifiedExpression };
    
    ftsQuery = toFTS5Query(modifiedParsed);

    // Build type filter
    let typeFilter = '';
    // @ai-any-deliberate: SQLite params array - mixed types for query parameters

    let params: (string | number)[] = [ftsQuery, limit];

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
      const rows = await this.db.allAsync(sql, params) as { title: string }[];
      return rows.map(row => row.title);
    } catch (error) {
      this.logger.error('Search suggestion failed:', error);
      return [];
    }
  }

  /**
   * @ai-intent Count total search results
   * @ai-flow 1. Build count query -> 2. Execute -> 3. Return count
   */
  async count(
    query: string,
    options?: {
      types?: string[];
    }
  ): Promise<number> {
    // Build FTS5 query with support for field-specific searches (same logic as search method)
    const trimmedQuery = query.trim();
    let ftsQuery: string;
    
    if (!trimmedQuery) {
      throw new Error('Search query cannot be empty');
    }
    
    // Check if query contains field-specific searches
    if (hasFieldSpecificSearch(trimmedQuery)) {
      // Use advanced parser for field-specific searches
      const parsed = parseSearchQuery(trimmedQuery);
      ftsQuery = toFTS5Query(parsed);
    } else {
      // Backward compatibility: simple AND search for multiple words
      const words = trimmedQuery.split(/\s+/).filter(word => word.length > 0);
      
      if (words.length === 1) {
        // Single word: use as-is
        ftsQuery = words[0];
      } else {
        // Multiple words: AND search (all words must appear)
        ftsQuery = words.map(word => {
          // Escape special characters for each word
          return word.replace(/['"]/g, '');
        }).join(' AND ');
      }
    }

    // Build type filter
    let typeFilter = '';
    let params: (string | number)[] = [ftsQuery];

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
      const result = await this.db.getAsync(sql, params) as { count: number } | undefined;
      return result?.count || 0;
    } catch (error) {
      this.logger.error('Search count failed:', error);
      return 0;
    }
  }
}