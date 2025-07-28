import type { Database } from './base.js';
import { BaseRepository } from './base.js';

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
  async searchContent(query: string): Promise<any[]> {
    const results = await this.db.allAsync(
      `SELECT type, id, title, description, content, tags, created_at, updated_at 
       FROM items 
       WHERE title LIKE ? OR content LIKE ? OR description LIKE ?
       ORDER BY created_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    return results.map((row: any) => ({
      type: row.type,
      id: row.id,
      title: row.title,
      description: row.description,
      content: row.content ? row.content.substring(0, 200) + '...' : '',
      tags: row.tags ? JSON.parse(row.tags) : [],
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * @ai-intent Search all items by tag (legacy method)
   * @ai-flow Query items table for tag match
   * @ai-return Grouped results by type
   */
  async searchAllByTag(tag: string): Promise<any> {
    const results = await this.db.allAsync(
      `SELECT type, id, title, description, content, tags, priority, created_at, updated_at 
       FROM items 
       WHERE tags LIKE ?
       ORDER BY type, created_at DESC`,
      [`%"${tag}"%`]
    );

    // Group results by type
    const grouped: any = {
      issues: [],
      plans: [],
      docs: [],
      knowledge: []
    };

    for (const row of results as any[]) {
      const item = {
        id: parseInt(String(row.id)),
        title: String(row.title),
        description: row.description,
        content: row.content,
        priority: row.priority,
        tags: row.tags ? JSON.parse(String(row.tags)) : [],
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      const type = String(row.type);
      if (grouped[type]) {
        grouped[type].push(item);
      }
    }

    return grouped;
  }
}