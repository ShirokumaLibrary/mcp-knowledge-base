import { BaseRepository, Database } from './base.js';
import { Tag } from '../types/domain-types.js';

/**
 * @ai-context Repository for tag management across all content types
 * @ai-pattern Shared tagging system with auto-registration
 * @ai-critical Tags are auto-created when content is tagged - no orphan tags
 * @ai-lifecycle Tags created on-demand, never cascade deleted
 * @ai-assumption Tag names are case-sensitive and trimmed
 */
export class TagRepository extends BaseRepository {
  constructor(db: Database) {
    super(db, 'TagRepository');
  }

  async getTags(): Promise<Tag[]> {
    const rows = await this.db.allAsync(
      'SELECT name, created_at FROM tags ORDER BY name'
    );
    
    return rows.map((row: any) => ({
      name: row.name,
      createdAt: row.created_at
    }));
  }

  /**
   * @ai-intent Create single tag with duplicate checking
   * @ai-flow 1. Attempt insert -> 2. Handle unique constraint -> 3. Return name
   * @ai-error-handling Transforms SQLite errors to user-friendly messages
   * @ai-assumption Tag names are pre-validated (trimmed, non-empty)
   * @ai-why Explicit error messages help UI provide better feedback
   */
  async createTag(name: string): Promise<string> {
    try {
      await this.db.runAsync(
        'INSERT INTO tags (name) VALUES (?)', 
        [name]
      );
      return name;
    } catch (err: any) {
      // @ai-logic: UNIQUE constraint = tag already exists (not an error)
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        throw new Error(`Tag "${name}" already exists`);
      }
      throw new Error(`Failed to create tag "${name}": ${err.message}`);
    }
  }


  /**
   * @ai-intent Remove tag from system
   * @ai-flow 1. Delete by name -> 2. Return success status
   * @ai-critical Does NOT remove tag from existing content - only from tag list
   * @ai-assumption Caller handles removing tag references from content
   * @ai-why Tags use name as primary key, not numeric ID
   */
  async deleteTag(id: string): Promise<boolean> {
    const result = await this.db.runAsync(
      'DELETE FROM tags WHERE name = ?',
      [id]  // @ai-logic: 'id' parameter is actually tag name
    );
    
    return (result as any).changes! > 0;
  }

  async getTagsByPattern(pattern: string): Promise<Tag[]> {
    const rows = await this.db.allAsync(
      'SELECT name, created_at FROM tags WHERE name LIKE ? ORDER BY name',
      [`%${pattern}%`]
    );
    
    return rows.map((row: any) => ({
      name: row.name,
      createdAt: row.created_at
    }));
  }

  /**
   * @ai-intent Bulk create tags for content, ignoring existing ones
   * @ai-flow 1. Build batch insert -> 2. Execute with IGNORE -> 3. Log results
   * @ai-side-effects Creates missing tags in tags table
   * @ai-performance Single query for multiple tags vs N queries
   * @ai-critical Called before every content save - must be fast and reliable
   * @ai-why INSERT OR IGNORE makes operation idempotent
   */
  async ensureTagsExist(tags: string[]): Promise<void> {
    if (!tags || tags.length === 0) return;  // @ai-edge-case: Empty arrays handled gracefully
    
    // @ai-logic: Dynamic SQL but safe - tags array is from controlled input
    const placeholders = tags.map(() => '(?)').join(',');
    const query = `INSERT OR IGNORE INTO tags (name) VALUES ${placeholders}`;
    
    try {
      await this.db.runAsync(query, tags);
      this.logger.debug(`Ensured tags exist: ${tags.join(', ')}`);
    } catch (error) {
      this.logger.error('Error ensuring tags exist:', { error, tags });
      // @ai-error-recovery: Tag creation failure shouldn't block content creation
      throw new Error(`Failed to ensure tags exist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}