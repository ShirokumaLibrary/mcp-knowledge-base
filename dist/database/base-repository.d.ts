/**
 * @ai-context Base repository pattern implementation
 * @ai-pattern Template method pattern for common database operations
 * @ai-critical All repositories extend this base class
 * @ai-dependencies Database wrapper, entity types, logger
 * @ai-assumption Entity has at least 'id' field
 */
import type { Database } from './base.js';
import type { Logger } from 'winston';
import type { DatabaseRow, QueryParameters } from './types/database-types.js';
/**
 * @ai-intent Base entity interface
 * @ai-pattern All domain entities implement this
 * @ai-critical ID can be string or number
 */
export interface BaseEntity {
    id: string | number;
    [key: string]: unknown;
}
/**
 * @ai-intent Repository base class
 * @ai-pattern Provides logger for all repositories
 * @ai-usage Extended by BaseRepository
 */
export declare abstract class RepositoryBase {
    protected abstract logger: Logger;
}
/**
 * @ai-intent Common query options
 * @ai-pattern Standardized filtering and pagination
 * @ai-usage Used by findAll methods
 */
export interface QueryOptions<T> {
    where?: Partial<T>;
    orderBy?: keyof T;
    order?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
}
/**
 * @ai-intent Abstract base repository with common operations
 * @ai-pattern Template method pattern for repositories
 * @ai-critical Subclasses must implement abstract methods
 * @ai-generic T for entity type, K for primary key type
 */
export declare abstract class BaseRepository<T extends BaseEntity, K extends string | number = number> {
    protected db: Database;
    protected tableName: string;
    protected logger: Logger;
    constructor(db: Database, tableName: string, loggerName: string);
    /**
     * @ai-intent Get next ID for entity creation
     * @ai-flow Delegates to database for sequence management
     * @ai-critical Must be called before INSERT
     * @ai-return Next available ID
     */
    protected getNextId(type: string): Promise<number>;
    /**
     * @ai-intent Map database row to domain entity
     * @ai-pattern Data mapper pattern
     * @ai-critical Subclasses must implement
     */
    protected abstract mapRowToEntity(row: DatabaseRow): T;
    /**
     * @ai-intent Map domain entity to database row
     * @ai-pattern Inverse data mapper
     * @ai-critical Subclasses must implement
     */
    protected abstract mapEntityToRow(entity: Partial<T>): DatabaseRow;
    /**
     * @ai-intent Generic find by ID implementation
     * @ai-flow 1. Build query -> 2. Execute -> 3. Map result
     * @ai-pattern Reusable across all repositories
     * @ai-return Entity or null if not found
     */
    protected findById(id: K): Promise<T | null>;
    /**
     * @ai-intent Generic find all with filtering
     * @ai-flow 1. Build WHERE -> 2. Add ORDER BY -> 3. Add LIMIT -> 4. Execute
     * @ai-pattern Flexible query builder
     * @ai-usage Common list operations
     */
    protected findAll(options?: QueryOptions<T>): Promise<T[]>;
    /**
     * @ai-intent Generic create implementation
     * @ai-flow 1. Map to row -> 2. INSERT -> 3. Return created entity
     * @ai-pattern Returns complete entity with generated ID
     * @ai-side-effects Creates new database record
     */
    protected create(data: Omit<T, 'id'>): Promise<T>;
    /**
     * @ai-intent Execute raw query with type safety
     * @ai-pattern Escape hatch for complex queries
     * @ai-usage When base methods aren't sufficient
     * @ai-generic R for result row type
     */
    protected executeQuery<R extends DatabaseRow = DatabaseRow>(query: string, params?: QueryParameters): Promise<R[]>;
    /**
     * @ai-intent Execute non-SELECT query
     * @ai-pattern For UPDATE/DELETE operations
     * @ai-return Run result with changes count
     */
    protected executeRun(query: string, params?: QueryParameters): Promise<{
        changes: number;
        lastID: number | bigint;
    }>;
    /**
     * @ai-intent Generic update implementation
     * @ai-flow 1. Check exists -> 2. Map data -> 3. UPDATE -> 4. Return updated
     * @ai-pattern Optimistic update with result verification
     * @ai-return Updated entity or null if not found
     */
    protected updateById(id: K, data: Partial<T>): Promise<T | null>;
    /**
     * @ai-intent Generic delete implementation
     * @ai-flow 1. Check exists -> 2. Execute DELETE -> 3. Return success
     * @ai-pattern Soft delete not implemented (uses hard delete)
     * @ai-side-effects Permanently removes record
     */
    protected deleteById(id: K): Promise<boolean>;
    /**
     * @ai-intent Count records matching criteria
     * @ai-pattern Efficient counting without loading data
     * @ai-usage For pagination metadata
     */
    protected count(where?: Partial<T>): Promise<number>;
    /**
     * @ai-intent Check if entity exists
     * @ai-pattern Efficient existence check
     * @ai-usage Before updates or validations
     */
    protected exists(id: K): Promise<boolean>;
    /**
     * @ai-intent Transaction helper
     * @ai-pattern Ensures atomic operations
     * @ai-usage For multi-step operations
     * @ai-side-effects Commits or rolls back entire transaction
     */
    protected transaction<R>(callback: (db: Database) => Promise<R>): Promise<R>;
}
