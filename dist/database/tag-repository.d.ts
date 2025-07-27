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
export declare class TagRepository extends BaseRepository {
    constructor(db: Database);
    getTags(): Promise<Tag[]>;
    /**
     * @ai-intent Get tag by numeric ID
     * @ai-flow Query tags table by ID
     * @ai-return Tag object or null if not found
     */
    getTagById(id: number): Promise<Tag | null>;
    /**
     * @ai-intent Get or create tag, returning its ID
     * @ai-flow 1. Try to get existing tag -> 2. Create if not exists -> 3. Return ID
     * @ai-critical Used by repositories to get tag IDs for relationship tables
     * @ai-side-effects May create new tag in database
     */
    getOrCreateTagId(name: string): Promise<number>;
    /**
     * @ai-intent Get tag IDs for multiple tag names
     * @ai-flow 1. Ensure all tags exist -> 2. Query for IDs -> 3. Return mapping
     * @ai-performance Batch operation to minimize queries
     * @ai-return Map of tag name to ID
     */
    getTagIds(names: string[]): Promise<Map<string, number>>;
    /**
     * @ai-intent Create single tag with duplicate checking
     * @ai-flow 1. Attempt insert -> 2. Handle unique constraint -> 3. Return name
     * @ai-error-handling Transforms SQLite errors to user-friendly messages
     * @ai-assumption Tag names are pre-validated (trimmed, non-empty)
     * @ai-why Explicit error messages help UI provide better feedback
     */
    createTag(name: string): Promise<string>;
    /**
     * @ai-intent Remove tag from system
     * @ai-flow 1. Delete by name -> 2. Return success status
     * @ai-critical Does NOT remove tag from existing content - only from tag list
     * @ai-assumption Caller handles removing tag references from content
     * @ai-why Tags use name as primary key, not numeric ID
     */
    deleteTag(id: string): Promise<boolean>;
    getTagsByPattern(pattern: string): Promise<Tag[]>;
    /**
     * @ai-intent Get tags for a specific entity using relationship table
     * @ai-flow JOIN tags with relationship table by entity ID
     * @ai-performance Single query with indexed JOIN
     * @ai-database-schema Uses entity-specific relationship tables (issue_tags, plan_tags, etc.)
     */
    getEntityTags(entityType: string, entityId: number | string): Promise<string[]>;
    /**
     * @ai-intent Save tags for an entity using relationship table
     * @ai-flow 1. Get tag IDs -> 2. Delete old relationships -> 3. Insert new ones
     * @ai-side-effects Updates relationship table, may create new tags
     * @ai-transaction Should be called within a transaction for consistency
     */
    saveEntityTags(entityType: string, entityId: number | string, tagNames: string[]): Promise<void>;
    /**
     * @ai-intent Bulk create tags for content, ignoring existing ones
     * @ai-flow 1. Build batch insert -> 2. Execute with IGNORE -> 3. Log results
     * @ai-side-effects Creates missing tags in tags table
     * @ai-performance Single query for multiple tags vs N queries
     * @ai-critical Called before every content save - must be fast and reliable
     * @ai-why INSERT OR IGNORE makes operation idempotent
     */
    ensureTagsExist(tags: string[]): Promise<void>;
}
