import { BaseRepository, Database } from './base.js';
import { Tag } from '../types/domain-types.js';
/**
 * @ai-context Repository for tag management across all content types
 * @ai-pattern Shared tagging system with auto-registration
 * @ai-critical Tags are auto-created when content is tagged - no orphan tags
 * @ai-lifecycle Tags created on-demand, never cascade deleted
 * @ai-assumption Tag names are case-sensitive and trimmed
 */
export declare class TagRepository extends BaseRepository {
    constructor(db: Database);
    getTags(): Promise<Tag[]>;
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
     * @ai-intent Bulk create tags for content, ignoring existing ones
     * @ai-flow 1. Build batch insert -> 2. Execute with IGNORE -> 3. Log results
     * @ai-side-effects Creates missing tags in tags table
     * @ai-performance Single query for multiple tags vs N queries
     * @ai-critical Called before every content save - must be fast and reliable
     * @ai-why INSERT OR IGNORE makes operation idempotent
     */
    ensureTagsExist(tags: string[]): Promise<void>;
}
