/**
 * @ai-context Optimized base repository with caching and batching
 * @ai-pattern Performance-optimized repository pattern
 * @ai-critical Extends base repository with performance features
 * @ai-why Improves response times for frequent operations
 */

import type { BaseEntity, QueryOptions } from './base-repository.js';
import { BaseRepository } from './base-repository.js';
import { MemoryCache, PerformanceTimer, generateQueryCacheKey } from '../utils/performance-utils.js';
import type { DatabaseRow } from './types/database-types.js';
import type { Database } from './base.js';

/**
 * @ai-intent Optimized repository with caching
 * @ai-pattern Decorator pattern for performance
 * @ai-usage Extend this for cacheable entities
 */
export abstract class OptimizedBaseRepository<
  T extends BaseEntity,
  K extends string | number = number
> extends BaseRepository<T, K> {

  private queryCache: MemoryCache<T[]>;
  private entityCache: MemoryCache<T>;

  constructor(
    db: Database,
    tableName: string,
    loggerName: string,
    cacheConfig?: { maxSize?: number; ttl?: number }
  ) {
    super(db, tableName, loggerName);

    // Initialize caches
    this.queryCache = new MemoryCache<T[]>(
      cacheConfig?.maxSize || 50,
      cacheConfig?.ttl || 30000 // 30 seconds default
    );

    this.entityCache = new MemoryCache<T>(
      cacheConfig?.maxSize || 100,
      cacheConfig?.ttl || 60000 // 1 minute default
    );
  }

  /**
   * @ai-intent Find by ID with caching
   * @ai-pattern Cache individual entities
   * @ai-performance Reduces DB queries for repeated access
   */
  protected async findById(id: K): Promise<T | null> {
    const timer = new PerformanceTimer('findById');

    // Check cache first
    const cacheKey = `${this.tableName}:${id}`;
    const cached = this.entityCache.get(cacheKey);

    if (cached) {
      timer.mark('cache-hit');
      timer.end();
      return cached;
    }

    timer.mark('cache-miss');

    // Fetch from database
    const entity = await super.findById(id);

    if (entity) {
      this.entityCache.set(cacheKey, entity);
    }

    timer.end();
    return entity;
  }

  /**
   * @ai-intent Find all with query caching
   * @ai-pattern Cache query results
   * @ai-performance Reduces repeated query execution
   */
  protected async findAll(options?: QueryOptions<T>): Promise<T[]> {
    const timer = new PerformanceTimer('findAll');

    // Generate cache key
    const cacheKey = generateQueryCacheKey(this.tableName, options || {});
    const cached = this.queryCache.get(cacheKey);

    if (cached) {
      timer.mark('cache-hit');
      timer.end();
      return cached;
    }

    timer.mark('cache-miss');

    // Fetch from database
    const results = await super.findAll(options);

    // Cache results
    this.queryCache.set(cacheKey, results);

    // Also cache individual entities
    results.forEach(entity => {
      const entityKey = `${this.tableName}:${entity.id}`;
      this.entityCache.set(entityKey, entity);
    });

    timer.end();
    return results;
  }

  /**
   * @ai-intent Update with cache invalidation
   * @ai-pattern Invalidate affected caches
   * @ai-side-effects Clears related cache entries
   */
  protected async updateById(id: K, data: Partial<T>): Promise<T | null> {
    const result = await super.updateById(id, data);

    if (result) {
      // Invalidate entity cache
      const cacheKey = `${this.tableName}:${id}`;
      this.entityCache.set(cacheKey, result);

      // Invalidate query cache (conservative approach)
      this.queryCache.clear();
    }

    return result;
  }

  /**
   * @ai-intent Delete with cache invalidation
   * @ai-pattern Remove from all caches
   * @ai-side-effects Clears cache entries
   */
  protected async deleteById(id: K): Promise<boolean> {
    const result = await super.deleteById(id);

    if (result) {
      // Invalidate entity cache
      const cacheKey = `${this.tableName}:${id}`;
      this.entityCache.set(cacheKey, undefined as any);

      // Invalidate query cache
      this.queryCache.clear();
    }

    return result;
  }

  /**
   * @ai-intent Batch find by IDs
   * @ai-pattern Efficient bulk loading
   * @ai-performance Single query for multiple IDs
   */
  protected async findByIds(ids: K[]): Promise<Map<K, T>> {
    if (ids.length === 0) {
      return new Map();
    }

    const timer = new PerformanceTimer('findByIds');
    const results = new Map<K, T>();
    const missingIds: K[] = [];

    // Check cache for each ID
    timer.mark('cache-check');
    for (const id of ids) {
      const cacheKey = `${this.tableName}:${id}`;
      const cached = this.entityCache.get(cacheKey);

      if (cached) {
        results.set(id, cached);
      } else {
        missingIds.push(id);
      }
    }

    // Fetch missing from database
    if (missingIds.length > 0) {
      timer.mark('db-fetch');

      const placeholders = missingIds.map(() => '?').join(',');
      const query = `SELECT * FROM ${this.tableName} WHERE id IN (${placeholders})`;

      const rows = await this.executeQuery<DatabaseRow>(query, missingIds);

      for (const row of rows) {
        const entity = this.mapRowToEntity(row);
        const id = entity.id as K;

        results.set(id, entity);

        // Cache the entity
        const cacheKey = `${this.tableName}:${id}`;
        this.entityCache.set(cacheKey, entity);
      }
    }

    timer.end();
    return results;
  }

  /**
   * @ai-intent Warm up cache
   * @ai-pattern Preload frequently accessed data
   * @ai-usage Call during initialization
   */
  async warmCache(options?: { limit?: number }): Promise<void> {
    const timer = new PerformanceTimer('warmCache');

    try {
      const entities = await super.findAll({
        limit: options?.limit || 100,
        orderBy: 'updated_at' as keyof T,
        order: 'DESC'
      });

      // Cache individual entities
      entities.forEach(entity => {
        const cacheKey = `${this.tableName}:${entity.id}`;
        this.entityCache.set(cacheKey, entity);
      });

      this.logger.info(`Cache warmed with ${entities.length} entities`);
    } catch (error) {
      this.logger.error('Failed to warm cache', { error });
    }

    timer.end();
  }

  /**
   * @ai-intent Get cache statistics
   * @ai-usage For monitoring and debugging
   */
  getCacheStats(): {
    entityCache: { size: number; maxSize: number };
    queryCache: { size: number; maxSize: number };
    } {
    return {
      entityCache: this.entityCache.getStats(),
      queryCache: this.queryCache.getStats()
    };
  }

  /**
   * @ai-intent Clear all caches
   * @ai-usage For cache invalidation
   */
  clearCache(): void {
    this.entityCache.clear();
    this.queryCache.clear();
  }
}