/**
 * @ai-context Repository for workflow status management using base repository
 * @ai-pattern Extends BaseRepository for type-safe operations
 * @ai-critical Statuses are referenced by ID - deletion can break referential integrity
 * @ai-lifecycle Statuses created at DB init, custom ones added by users
 * @ai-assumption Default statuses (1-6) should not be deleted
 */
import type { Database } from '../database/base.js';
import { BaseRepository } from './base-repository.js';
import type { Status } from '../types/domain-types.js';
import type { DatabaseRow } from './types/database-types.js';
/**
 * @ai-intent Extended Status type with base entity fields
 * @ai-pattern Merges domain type with base requirements
 */
interface StatusEntity extends Status {
    id: number;
    created_at: string;
    updated_at: string;
}
export declare class StatusRepositoryV2 extends BaseRepository<StatusEntity, number> {
    constructor(db: Database);
    /**
     * @ai-intent Get next ID using SQLite AUTOINCREMENT
     * @ai-pattern SQLite handles ID generation
     * @ai-critical Returns 0 as placeholder - real ID from lastID
     */
    protected getNextId(): Promise<number>;
    /**
     * @ai-intent Map database row to Status entity
     * @ai-pattern Converts SQLite boolean representation
     * @ai-critical is_closed stored as 0/1 in database
     */
    protected mapRowToEntity(row: DatabaseRow): StatusEntity;
    /**
     * @ai-intent Map Status entity to database row
     * @ai-pattern Converts boolean to SQLite integer
     * @ai-critical Filters undefined values
     */
    protected mapEntityToRow(entity: Partial<StatusEntity>): DatabaseRow;
    /**
     * @ai-intent Retrieve all available workflow statuses
     * @ai-flow Uses base findAll with ordering
     * @ai-performance Cached by UI layer - called frequently
     * @ai-return Always returns array, empty if table not initialized
     */
    getAllStatuses(): Promise<Status[]>;
    /**
     * @ai-intent Legacy async method for backward compatibility
     * @ai-deprecated Use getAllStatuses() directly
     */
    getAllStatusesAsync(): Promise<Status[]>;
    /**
     * @ai-intent Get single status by ID
     * @ai-flow Delegates to base findById
     * @ai-return Status or null if not found
     */
    getStatus(id: number): Promise<Status | null>;
    /**
     * @ai-intent Create custom workflow status
     * @ai-flow Uses base insert with specific fields
     * @ai-side-effects Adds to statuses table
     * @ai-error-handling Throws on duplicate names
     */
    createStatus(name: string, is_closed?: boolean): Promise<Status>;
    /**
     * @ai-intent Update status properties
     * @ai-flow Custom implementation for partial updates
     * @ai-pattern Only updates provided fields
     * @ai-return true if updated, false if not found
     */
    updateStatus(id: number, name: string, is_closed?: boolean): Promise<boolean>;
    /**
     * @ai-intent Remove status definition
     * @ai-flow Delegates to base deleteById
     * @ai-critical Can break items using this status
     * @ai-return true if deleted, false if not found
     */
    deleteStatus(id: number): Promise<boolean>;
    /**
     * @ai-intent Check if status is in use
     * @ai-pattern Checks both issues and plans
     * @ai-usage Call before deletion to prevent breaks
     */
    isStatusInUse(id: number): Promise<boolean>;
}
export {};
