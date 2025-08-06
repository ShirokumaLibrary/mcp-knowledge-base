import type { Database } from './base.js';
import { BaseRepository } from './base.js';

// Type definitions for database rows
export interface SearchRow {
  type: string;
  id: number;
  title: string;
  description?: string;
  content: string;
  priority: string;
  status_id: number;
  status_name?: string;
  start_date?: string;
  end_date?: string;
  tags: string;
  related_issues?: string;
  related_plans?: string;
  created_at: string;
  updated_at: string;
}

interface GroupedSearchResult {
  issues: SearchRow[];
  plans: SearchRow[];
  docs: SearchRow[];
  knowledge: SearchRow[];
}

/**
 * @ai-context Centralized search functionality across all content types
 * @ai-pattern Simple full-text search using SQLite FTS5
 * @ai-critical Performance-critical - searches must be fast for good UX
 * @ai-assumption SQLite items table is kept in sync with markdown files
 */
export class SearchRepository extends BaseRepository {
  constructor(db: Database) {
    super(db, 'SearchRepository');
  }

  /**
   * @ai-intent Full-text search across all content
   * @ai-flow Query items table with LIKE for simple text matching
   * @ai-performance Uses indexes on title/content columns
   */
  async searchContent(query: string): Promise<SearchRow[]> {
    const results = await this.db.allAsync(
      `SELECT type, id, title, description, content, tags, created_at, updated_at 
       FROM items 
       WHERE title LIKE ? OR content LIKE ? OR description LIKE ?
       ORDER BY created_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    return results.map((row: unknown) => {
      const searchRow = row as SearchRow;
      return {
        ...searchRow,
        content: searchRow.content ? searchRow.content.substring(0, 200) + '...' : '',
        tags: searchRow.tags ? JSON.parse(searchRow.tags) : []
      } as SearchRow;
    });
  }

  /**
   * @ai-intent Search all items by tag (legacy method)
   * @ai-flow Query items table for tag match
   * @ai-return Grouped results by type
   */
  async searchAllByTag(tag: string): Promise<GroupedSearchResult> {
    const results = await this.db.allAsync(
      `SELECT type, id, title, description, content, tags, priority, created_at, updated_at 
       FROM items 
       WHERE tags LIKE ?
       ORDER BY type, created_at DESC`,
      [`%"${tag}"%`]
    );

    // Group results by type
    const grouped: GroupedSearchResult = {
      issues: [],
      plans: [],
      docs: [],
      knowledge: []
    };

    for (const row of results as unknown[]) {
      const searchRow = row as SearchRow;
      const item: SearchRow = {
        ...searchRow,
        id: parseInt(String(searchRow.id)),
        title: String(searchRow.title),
        tags: searchRow.tags ? JSON.parse(String(searchRow.tags)) : []
      } as SearchRow;

      const type = String(searchRow.type) as keyof GroupedSearchResult;
      if (type in grouped) {
        grouped[type].push(item);
      }
    }

    return grouped;
  }
}