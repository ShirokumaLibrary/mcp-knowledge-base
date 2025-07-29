/**
 * @ai-context Repository helper functions
 * @ai-pattern Common repository operations
 * @ai-critical Shared logic for all repositories
 * @ai-why Eliminates duplicate code across repositories
 * @ai-assumption All repositories follow similar patterns
 */
import type { Database } from './base.js';
import type { Logger } from 'winston';
/**
 * @ai-intent Common repository operations
 * @ai-pattern Shared functionality
 */
export declare class RepositoryHelpers {
    /**
     * @ai-intent Get next ID from sequences table
     * @ai-pattern Centralized ID generation
     * @ai-critical Thread-safe with transactions
     */
    static getNextId(db: Database, type: string, logger?: Logger): Promise<number>;
    /**
     * @ai-intent Save tags for an entity
     * @ai-pattern Common tag relationship management
     * @ai-flow 1. Auto-register tags -> 2. Delete old -> 3. Insert new
     */
    static saveEntityTags(db: Database, entityType: string, entityId: number | string, tags: string[] | undefined, tableName: string, logger?: Logger): Promise<void>;
    /**
     * @ai-intent Auto-register tags
     * @ai-pattern Ensure tags exist before use
     * @ai-critical Uses INSERT OR IGNORE for concurrency
     */
    static autoRegisterTags(db: Database, tags: string[], logger?: Logger): Promise<void>;
    /**
     * @ai-intent Load tags for an entity
     * @ai-pattern Fetch tags from relationship table
     */
    static loadEntityTags(db: Database, entityType: string, entityId: number | string, tableName: string, logger?: Logger): Promise<string[]>;
    /**
     * @ai-intent Save related entities
     * @ai-pattern Common relationship management
     */
    static saveRelatedEntities(db: Database, sourceType: string, sourceId: number | string, relatedTasks: string[] | undefined, relatedDocuments: string[] | undefined, logger?: Logger): Promise<void>;
    /**
     * @ai-intent Load related entities
     * @ai-pattern Fetch relationships from tables
     */
    static loadRelatedEntities(db: Database, sourceType: string, sourceId: number | string, logger?: Logger): Promise<{
        related_tasks: string[];
        related_documents: string[];
    }>;
    /**
     * @ai-intent Build WHERE clause from filters
     * @ai-pattern Dynamic query building
     */
    static buildWhereClause(filters: Record<string, any>, paramValues: unknown[]): string;
    /**
     * @ai-intent Execute search query
     * @ai-pattern Common search implementation
     */
    static executeSearch<T>(db: Database, tableName: string, searchFields: string[], query: string, additionalFilters?: Record<string, any>, logger?: Logger): Promise<T[]>;
    /**
     * @ai-intent Check if entity exists
     * @ai-pattern Existence validation
     */
    static exists(db: Database, tableName: string, id: number | string, idField?: string): Promise<boolean>;
    /**
     * @ai-intent Get count with filters
     * @ai-pattern Count query helper
     */
    static getCount(db: Database, tableName: string, filters?: Record<string, unknown>): Promise<number>;
}
