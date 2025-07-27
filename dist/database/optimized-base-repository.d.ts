/**
 * @ai-context Optimized base repository with caching and batching
 * @ai-pattern Performance-optimized repository pattern
 * @ai-critical Extends base repository with performance features
 * @ai-why Improves response times for frequent operations
 */
import type { BaseEntity, QueryOptions } from './base-repository.js';
import { BaseRepository } from './base-repository.js';
import type { Database } from './base.js';
/**
 * @ai-intent Optimized repository with caching
 * @ai-pattern Decorator pattern for performance
 * @ai-usage Extend this for cacheable entities
 */
export declare abstract class OptimizedBaseRepository<T extends BaseEntity, K extends string | number = number> extends BaseRepository<T, K> {
    private queryCache;
    private entityCache;
    constructor(db: Database, tableName: string, loggerName: string, cacheConfig?: {
        maxSize?: number;
        ttl?: number;
    });
    /**
     * @ai-intent Find by ID with caching
     * @ai-pattern Cache individual entities
     * @ai-performance Reduces DB queries for repeated access
     */
    protected findById(id: K): Promise<T | null>;
    /**
     * @ai-intent Find all with query caching
     * @ai-pattern Cache query results
     * @ai-performance Reduces repeated query execution
     */
    protected findAll(options?: QueryOptions<T>): Promise<T[]>;
    /**
     * @ai-intent Update with cache invalidation
     * @ai-pattern Invalidate affected caches
     * @ai-side-effects Clears related cache entries
     */
    protected updateById(id: K, data: Partial<T>): Promise<T | null>;
    /**
     * @ai-intent Delete with cache invalidation
     * @ai-pattern Remove from all caches
     * @ai-side-effects Clears cache entries
     */
    protected deleteById(id: K): Promise<boolean>;
    /**
     * @ai-intent Batch find by IDs
     * @ai-pattern Efficient bulk loading
     * @ai-performance Single query for multiple IDs
     */
    protected findByIds(ids: K[]): Promise<Map<K, T>>;
    /**
     * @ai-intent Warm up cache
     * @ai-pattern Preload frequently accessed data
     * @ai-usage Call during initialization
     */
    warmCache(options?: {
        limit?: number;
    }): Promise<void>;
    /**
     * @ai-intent Get cache statistics
     * @ai-usage For monitoring and debugging
     */
    getCacheStats(): {
        entityCache: {
            size: number;
            maxSize: number;
        };
        queryCache: {
            size: number;
            maxSize: number;
        };
    };
    /**
     * @ai-intent Clear all caches
     * @ai-usage For cache invalidation
     */
    clearCache(): void;
}
