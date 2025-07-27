/**
 * @ai-context Performance monitoring and optimization utilities
 * @ai-pattern Performance measurement and caching strategies
 * @ai-critical Helps identify performance bottlenecks
 * @ai-why Essential for maintaining responsive system
 */
/**
 * @ai-intent Performance timer utility
 * @ai-pattern Measure execution time of operations
 */
export declare class PerformanceTimer {
    private name;
    private startTime;
    private marks;
    constructor(name: string);
    /**
     * @ai-intent Mark intermediate time
     * @ai-usage For multi-step operations
     */
    mark(label: string): void;
    /**
     * @ai-intent Get total elapsed time
     * @ai-return Duration in milliseconds
     */
    end(): number;
    /**
     * @ai-intent Get all marks
     * @ai-usage For detailed performance analysis
     */
    getMarks(): Map<string, number>;
}
/**
 * @ai-intent Simple in-memory cache
 * @ai-pattern LRU cache with TTL
 * @ai-critical Reduces database queries
 */
export declare class MemoryCache<T> {
    private maxSize;
    private ttl;
    private cache;
    private accessOrder;
    constructor(maxSize?: number, ttl?: number);
    /**
     * @ai-intent Get cached value
     * @ai-return Value or undefined if expired/missing
     */
    get(key: string): T | undefined;
    /**
     * @ai-intent Set cached value
     * @ai-side-effects May evict oldest entry
     */
    set(key: string, value: T, customTtl?: number): void;
    /**
     * @ai-intent Clear all cached entries
     * @ai-usage For cache invalidation
     */
    clear(): void;
    /**
     * @ai-intent Get cache statistics
     * @ai-usage For monitoring
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate?: number;
    };
    private removeFromOrder;
}
/**
 * @ai-intent Batch operation processor
 * @ai-pattern Batch multiple operations for efficiency
 * @ai-critical Reduces database round trips
 */
export declare class BatchProcessor<T, R> {
    private processBatch;
    private batchSize;
    private delay;
    private queue;
    private timer;
    constructor(processBatch: (items: T[]) => Promise<R[]>, batchSize?: number, delay?: number);
    /**
     * @ai-intent Add item to batch queue
     * @ai-flow Queues item and schedules batch processing
     */
    add(item: T): Promise<R>;
    /**
     * @ai-intent Process pending batch
     * @ai-side-effects Clears queue
     */
    private flush;
    /**
     * @ai-intent Schedule batch processing
     * @ai-pattern Debounced batch execution
     */
    private scheduleFlush;
}
/**
 * @ai-intent Performance decorator
 * @ai-pattern Method timing decorator
 * @ai-usage @measurePerformance
 */
export declare function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
/**
 * @ai-intent Create memoized function
 * @ai-pattern Cache function results
 * @ai-usage For expensive pure functions
 */
export declare function memoize<T extends (...args: any[]) => any>(fn: T, keyGenerator?: (...args: Parameters<T>) => string): T;
/**
 * @ai-intent Query result cache key generator
 * @ai-pattern Consistent cache keys for queries
 */
export declare function generateQueryCacheKey(table: string, params: Record<string, any>): string;
