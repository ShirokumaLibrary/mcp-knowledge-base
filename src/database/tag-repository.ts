import type { Database } from './base.js';
import { BaseRepository } from './base.js';
import type { Tag } from '../types/domain-types.js';

/**
 * @ai-context Repository for tag management across all content types
 * @ai-pattern Shared tagging system with auto-registration and ID-based relationships
 * @ai-critical Tags are auto-created when content is tagged - no orphan tags
 * @ai-lifecycle Tags created on-demand, never cascade deleted
 * @ai-assumption Tag names are case-sensitive and trimmed
 * @ai-database-schema tags table uses auto-increment ID with unique name constraint
 */
export class TagRepository extends BaseRepository {
  constructor(db: Database) {
    super(db, 'TagRepository');
  }

  async getTags(): Promise<Tag[]> {
    const rows = await this.db.allAsync(
      'SELECT id, name, created_at FROM tags ORDER BY name'
    );

    return rows.map((row: any) => ({
      name: row.name,
      createdAt: row.created_at
    }));
  }

  // Alias for backward compatibility
  async getAllTags(): Promise<Tag[]> {
    return this.getTags();
  }

  /**
   * @ai-intent Get tag by numeric ID
   * @ai-flow Query tags table by ID
   * @ai-return Tag object or null if not found
   */
  async getTagById(id: number): Promise<Tag | null> {
    const row = await this.db.getAsync(
      'SELECT id, name, created_at FROM tags WHERE id = ?',
      [id]
    );

    if (!row) {
      return null;
    }

    return {
      name: String(row.name),
      createdAt: row.created_at ? String(row.created_at) : undefined
    };
  }

  /**
   * @ai-intent Get tag ID by name
   * @ai-flow Query tags table by name
   * @ai-return Tag ID or null if not found
   */
  async getTagIdByName(name: string): Promise<number | null> {
    const row = await this.db.getAsync(
      'SELECT id FROM tags WHERE name = ?',
      [name.trim()]
    );

    return row ? Number(row.id) : null;
  }

  /**
   * @ai-intent Register multiple tags (alias for ensureTagsExist)
   * @ai-flow Ensure all tags exist in the database
   */
  async registerTags(tags: string[]): Promise<void> {
    return this.ensureTagsExist(tags);
  }


  /**
   * @ai-intent Get tag IDs for multiple tag names
   * @ai-flow 1. Ensure all tags exist -> 2. Query for IDs -> 3. Return mapping
   * @ai-performance Batch operation to minimize queries
   * @ai-return Map of tag name to ID
   */
  async getTagIds(names: string[]): Promise<Map<string, number>> {
    if (!names || names.length === 0) {
      return new Map();
    }

    // Ensure all tags exist first
    await this.ensureTagsExist(names);

    // Get all IDs in one query
    const placeholders = names.map(() => '?').join(',');
    const rows = await this.db.allAsync(
      `SELECT id, name FROM tags WHERE name IN (${placeholders})`,
      names
    );

    const idMap = new Map<string, number>();
    rows.forEach((row: any) => {
      idMap.set(row.name, row.id);
    });

    return idMap;
  }

  /**
   * @ai-intent Create single tag with duplicate checking
   * @ai-flow 1. Attempt insert -> 2. Handle unique constraint -> 3. Return name
   * @ai-error-handling Transforms SQLite errors to user-friendly messages
   * @ai-assumption Tag names are pre-validated (trimmed, non-empty)
   * @ai-why Explicit error messages help UI provide better feedback
   */
  async createTag(name: string): Promise<string> {
    // Trim the name first
    const trimmedName = name.trim();

    // Validate that the tag name is not empty or whitespace only
    if (trimmedName.length === 0) {
      throw new Error('Tag name cannot be empty or whitespace only');
    }

    // Use INSERT OR IGNORE to avoid AUTOINCREMENT increase
    const result = await this.db.runAsync(
      'INSERT OR IGNORE INTO tags (name) VALUES (?)',
      [trimmedName]
    );

    // Check if the tag was actually inserted
    if ((result as any).changes === 0) {
      // Tag already existed
      throw new Error(`Tag "${trimmedName}" already exists`);
    }

    return trimmedName;
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

  /**
   * @ai-intent Get or create tag ID by name
   * @ai-flow 1. Try to get existing tag -> 2. Create if not exists -> 3. Return ID
   * @ai-pattern Get-or-create pattern for idempotency
   * @ai-critical Used during tag relationships creation
   */
  async getOrCreateTagId(name: string): Promise<number> {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new Error('Tag name cannot be empty or whitespace only');
    }

    await this.ensureTagsExist([trimmedName]);
    const row = await this.db.getAsync(
      'SELECT id FROM tags WHERE name = ?',
      [trimmedName]
    ) as { id: number } | undefined;

    if (!row) {
      throw new Error(`Failed to get or create tag: ${trimmedName}`);
    }

    return row.id;
  }

  async getTagsByPattern(pattern: string): Promise<Tag[]> {
    const rows = await this.db.allAsync(
      'SELECT id, name, created_at FROM tags WHERE name LIKE ? ORDER BY name',
      [`%${pattern}%`]
    );

    return rows.map((row: any) => ({
      name: row.name,
      createdAt: row.created_at
    }));
  }

  // Alias for backward compatibility
  async searchTagsByPattern(pattern: string): Promise<Tag[]> {
    return this.getTagsByPattern(pattern);
  }

  /**
   * @ai-intent Get tags for a specific entity using relationship table
   * @ai-flow JOIN tags with relationship table by entity ID
   * @ai-performance Single query with indexed JOIN
   * @ai-database-schema Uses entity-specific relationship tables (issue_tags, plan_tags, etc.)
   */
  async getEntityTags(entityType: string, entityId: number | string): Promise<string[]> {
    const tableName = `${entityType}_tags`;
    const idColumn = entityType === 'session' || entityType === 'summary' ?
      `${entityType}_${entityType === 'session' ? 'id' : 'date'}` :
      `${entityType}_id`;

    const rows = await this.db.allAsync(
      `SELECT t.name 
       FROM tags t 
       JOIN ${tableName} et ON t.id = et.tag_id 
       WHERE et.${idColumn} = ?
       ORDER BY t.name`,
      [entityId]
    );

    return rows.map((row: any) => row.name);
  }

  /**
   * @ai-intent Save tags for an entity using relationship table
   * @ai-flow 1. Get tag IDs -> 2. Delete old relationships -> 3. Insert new ones
   * @ai-side-effects Updates relationship table, may create new tags
   * @ai-transaction Should be called within a transaction for consistency
   */
  async saveEntityTags(entityType: string, entityId: number | string, tagNames: string[]): Promise<void> {
    if (!tagNames || tagNames.length === 0) {
      return;
    }

    const tableName = `${entityType}_tags`;
    const idColumn = entityType === 'session' || entityType === 'summary' ?
      `${entityType}_${entityType === 'session' ? 'id' : 'date'}` :
      `${entityType}_id`;

    // Get or create tag IDs
    const tagIdMap = await this.getTagIds(tagNames);

    // Delete existing relationships
    await this.db.runAsync(
      `DELETE FROM ${tableName} WHERE ${idColumn} = ?`,
      [entityId]
    );

    // Insert new relationships
    const values = Array.from(tagIdMap.values()).map(() => '(?, ?)').join(',');
    const params: any[] = [];
    tagIdMap.forEach(tagId => {
      params.push(entityId, tagId);
    });

    if (params.length > 0) {
      await this.db.runAsync(
        `INSERT INTO ${tableName} (${idColumn}, tag_id) VALUES ${values}`,
        params
      );
    }
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
    if (!tags || tags.length === 0) {
      return;
    }  // @ai-edge-case: Empty arrays handled gracefully

    // Trim and filter out empty tags
    const trimmedTags = tags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (trimmedTags.length === 0) {
      return;
    }

    // First, check which tags already exist to minimize INSERT attempts
    const placeholdersForSelect = trimmedTags.map(() => '?').join(',');
    const existingRows = await this.db.allAsync(
      `SELECT name FROM tags WHERE name IN (${placeholdersForSelect})`,
      trimmedTags
    );

    const existingNames = new Set(existingRows.map((row: any) => row.name));
    const newTags = trimmedTags.filter(tag => !existingNames.has(tag));

    if (newTags.length === 0) {
      this.logger.debug(`All tags already exist: ${trimmedTags.join(', ')}`);
      return;
    }

    // Only insert tags that don't exist
    const placeholders = newTags.map(() => '(?)').join(',');
    const query = `INSERT OR IGNORE INTO tags (name) VALUES ${placeholders}`;

    try {
      await this.db.runAsync(query, newTags);
      this.logger.debug(`Ensured tags exist: ${trimmedTags.join(', ')} (${newTags.length} new)`);
    } catch (error) {
      this.logger.error('Error ensuring tags exist:', { error, tags: trimmedTags });
      // @ai-error-recovery: Tag creation failure shouldn't block content creation
      throw new Error(`Failed to ensure tags exist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}