/**
 * @ai-context Performance monitoring and optimization utilities
 * @ai-pattern Performance measurement and caching strategies
 * @ai-critical Helps identify performance bottlenecks
 * @ai-why Essential for maintaining responsive system
 */
import { performance } from 'perf_hooks';
import { createLogger } from './logger.js';
const logger = createLogger('PerformanceUtils');
/**
 * @ai-intent Performance timer utility
 * @ai-pattern Measure execution time of operations
 */
export class PerformanceTimer {
    name;
    startTime;
    marks = new Map();
    constructor(name) {
        this.name = name;
        this.startTime = performance.now();
    }
    /**
     * @ai-intent Mark intermediate time
     * @ai-usage For multi-step operations
     */
    mark(label) {
        const elapsed = performance.now() - this.startTime;
        this.marks.set(label, elapsed);
        if (process.env.PERF_DEBUG === 'true') {
            logger.debug(`[${this.name}] ${label}: ${elapsed.toFixed(2)}ms`);
        }
    }
    /**
     * @ai-intent Get total elapsed time
     * @ai-return Duration in milliseconds
     */
    end() {
        const duration = performance.now() - this.startTime;
        if (process.env.PERF_DEBUG === 'true') {
            logger.debug(`[${this.name}] Total: ${duration.toFixed(2)}ms`);
        }
        return duration;
    }
    /**
     * @ai-intent Get all marks
     * @ai-usage For detailed performance analysis
     */
    getMarks() {
        return new Map(this.marks);
    }
}
/**
 * @ai-intent Simple in-memory cache
 * @ai-pattern LRU cache with TTL
 * @ai-critical Reduces database queries
 */
export class MemoryCache {
    maxSize;
    ttl;
    cache = new Map();
    accessOrder = [];
    constructor(maxSize = 100, ttl = 60000 // 1 minute default
    ) {
        this.maxSize = maxSize;
        this.ttl = ttl;
    }
    /**
     * @ai-intent Get cached value
     * @ai-return Value or undefined if expired/missing
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            this.removeFromOrder(key);
            return undefined;
        }
        // Update access order
        this.removeFromOrder(key);
        this.accessOrder.push(key);
        return entry.value;
    }
    /**
     * @ai-intent Set cached value
     * @ai-side-effects May evict oldest entry
     */
    set(key, value, customTtl) {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const oldest = this.accessOrder.shift();
            if (oldest) {
                this.cache.delete(oldest);
            }
        }
        this.cache.set(key, {
            value,
            expires: Date.now() + (customTtl || this.ttl)
        });
        // Update access order
        this.removeFromOrder(key);
        this.accessOrder.push(key);
    }
    /**
     * @ai-intent Clear all cached entries
     * @ai-usage For cache invalidation
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }
    /**
     * @ai-intent Get cache statistics
     * @ai-usage For monitoring
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }
    removeFromOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }
}
/**
 * @ai-intent Batch operation processor
 * @ai-pattern Batch multiple operations for efficiency
 * @ai-critical Reduces database round trips
 */
export class BatchProcessor {
    processBatch;
    batchSize;
    delay;
    queue = [];
    timer = null;
    constructor(processBatch, batchSize = 10, delay = 50) {
        this.processBatch = processBatch;
        this.batchSize = batchSize;
        this.delay = delay;
    }
    /**
     * @ai-intent Add item to batch queue
     * @ai-flow Queues item and schedules batch processing
     */
    async add(item) {
        return new Promise((resolve, reject) => {
            this.queue.push({ item, resolve, reject });
            if (this.queue.length >= this.batchSize) {
                this.flush();
            }
            else {
                this.scheduleFlush();
            }
        });
    }
    /**
     * @ai-intent Process pending batch
     * @ai-side-effects Clears queue
     */
    async flush() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.queue.length === 0) {
            return;
        }
        const batch = this.queue.splice(0, this.batchSize);
        const items = batch.map(b => b.item);
        try {
            const results = await this.processBatch(items);
            batch.forEach((b, i) => {
                b.resolve(results[i]);
            });
        }
        catch (error) {
            batch.forEach(b => {
                b.reject(error);
            });
        }
        // Process remaining items
        if (this.queue.length > 0) {
            this.scheduleFlush();
        }
    }
    /**
     * @ai-intent Schedule batch processing
     * @ai-pattern Debounced batch execution
     */
    scheduleFlush() {
        if (this.timer) {
            return;
        }
        this.timer = setTimeout(() => {
            this.flush();
        }, this.delay);
    }
}
/**
 * @ai-intent Performance decorator
 * @ai-pattern Method timing decorator
 * @ai-usage @measurePerformance
 */
export function measurePerformance(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        const timer = new PerformanceTimer(`${target.constructor.name}.${propertyKey}`);
        try {
            const result = await originalMethod.apply(this, args);
            const duration = timer.end();
            if (duration > 100) {
                logger.warn('Slow operation detected', {
                    method: `${target.constructor.name}.${propertyKey}`,
                    duration: `${duration.toFixed(2)}ms`
                });
            }
            return result;
        }
        catch (error) {
            timer.end();
            throw error;
        }
    };
    return descriptor;
}
/**
 * @ai-intent Create memoized function
 * @ai-pattern Cache function results
 * @ai-usage For expensive pure functions
 */
export function memoize(fn, keyGenerator) {
    const cache = new MemoryCache();
    return ((...args) => {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
        const cached = cache.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    });
}
/**
 * @ai-intent Query result cache key generator
 * @ai-pattern Consistent cache keys for queries
 */
export function generateQueryCacheKey(table, params) {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join(',');
    return `${table}:${sortedParams}`;
}
//# sourceMappingURL=performance-utils.js.map