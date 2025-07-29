/**
 * @ai-context Repository for tag management using base repository
 * @ai-pattern Extends BaseRepository with tag-specific operations
 * @ai-critical Tags use name as primary key, not numeric ID
 * @ai-lifecycle Tags auto-created when referenced by entities
 * @ai-assumption Tag names are case-sensitive and unique
 */
import type { Database } from '../database/base.js';
import { BaseRepository } from './base-repository.js';
import type { Tag } from '../types/domain-types.js';
import type { DatabaseRow } from './types/database-types.js';
/**
 * @ai-intent Extended Tag type with base entity fields
 * @ai-pattern Uses string ID (tag name)
 */
interface TagEntity extends Tag {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}
/**
 * @ai-intent Tag with usage count for UI display
 * @ai-pattern Extended with statistics
 */
interface TagWithCount extends Tag {
    count: number;
}
export declare class TagRepositoryV2 extends BaseRepository<TagEntity, string> {
    constructor(db: Database);
    /**
     * @ai-intent Get next ID - not applicable for tags
     * @ai-pattern Tags use name as ID
     * @ai-critical Should not be called
     */
    protected getNextId(_type: string): Promise<number>;
    /**
     * @ai-intent Map database row to Tag entity
     * @ai-pattern Simple mapping as fields match
     */
    protected mapRowToEntity(row: DatabaseRow): TagEntity;
    /**
     * @ai-intent Map Tag entity to database row
     * @ai-pattern Handles name as primary key
     */
    protected mapEntityToRow(entity: Partial<TagEntity>): DatabaseRow;
    /**
     * @ai-intent Override findById to use name
     * @ai-pattern Tags use name as primary key
     */
    protected findById(name: string): Promise<TagEntity | null>;
    /**
     * @ai-intent Get all tags with usage counts
     * @ai-flow 1. Count usage across tables -> 2. Return with statistics
     * @ai-performance Uses SQL aggregation for efficiency
     * @ai-return Array of tags with usage counts
     */
    getTags(): Promise<TagWithCount[]>;
    /**
     * @ai-intent Create new tag
     * @ai-flow Custom insert for name as primary key
     * @ai-validation Tag name must be unique
     * @ai-side-effects Creates tag in tags table only
     */
    createTag(name: string): Promise<Tag>;
    /**
     * @ai-intent Delete tag by name
     * @ai-flow Override to use name as ID
     * @ai-side-effects Removes from tags and all relationship tables
     * @ai-return true if deleted, false if not found
     */
    deleteTag(name: string): Promise<boolean>;
    /**
     * @ai-intent Search tags by name pattern
     * @ai-flow Uses LIKE for substring matching
     * @ai-pattern Case-insensitive search
     * @ai-return Matching tags with counts
     */
    getTagsByPattern(pattern: string): Promise<TagWithCount[]>;
    /**
     * @ai-intent Ensure tags exist before foreign key reference
     * @ai-flow Insert missing tags with IGNORE for existing
     * @ai-critical Called before entity operations
     * @ai-side-effects Creates missing tags
     */
    ensureTagsExist(tagNames: string[]): Promise<void>;
    /**
     * @ai-intent Save entity-tag relationships
     * @ai-flow 1. Delete existing -> 2. Insert new relationships
     * @ai-pattern Complete replacement strategy
     * @ai-side-effects Updates relationship tables
     */
    saveEntityTags(entityType: 'issue' | 'plan' | 'knowledge' | 'doc' | 'session' | 'summary', entityId: string | number, tagNames: string[]): Promise<void>;
    /**
     * @ai-intent Get DELETE query for entity type
     * @ai-pattern Entity-specific relationship tables
     */
    private getDeleteQuery;
    /**
     * @ai-intent Get INSERT query for entity type
     * @ai-pattern Entity-specific relationship tables
     */
    private getInsertQuery;
    /**
     * @ai-intent Auto-register tags for an entity
     * @ai-flow Wrapper around ensureTagsExist
     * @ai-usage Called by entity repositories on create/update
     */
    autoRegisterTags(tags?: string[]): Promise<void>;
}
export {};
