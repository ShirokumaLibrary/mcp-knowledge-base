/**
 * @ai-context Full-text search repository using FTS5
 * @ai-pattern Repository pattern for search functionality
 * @ai-dependencies Database, ItemRepository for result hydration
 */

import type { Database } from './base.js';
import type { UnifiedItem } from '../types/unified-types.js';
import { createLogger } from '../utils/logger.js';

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

    // Escape special characters for FTS5
    const escapedQuery = query.replace(/['"]/g, '');

    // Build type filter
    let typeFilter = '';
    let params: any[] = [`"${escapedQuery}"`, limit, offset];

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
    const escapedQuery = query.replace(/['"]/g, '');

    // Build type filter
    let typeFilter = '';
    let params: any[] = [`"${escapedQuery}"*`, limit];

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
    // Escape special characters for FTS5
    const escapedQuery = query.replace(/['"]/g, '');

    // Build type filter
    let typeFilter = '';
    let params: any[] = [`"${escapedQuery}"`];

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
      const result = await this.db.getAsync(sql, params) as { count: number } | undefined;
      return result?.count || 0;
    } catch (error) {
      this.logger.error('Search count failed:', error);
      return 0;
    }
  }
}