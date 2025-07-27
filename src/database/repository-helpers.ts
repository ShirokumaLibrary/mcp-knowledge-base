/**
 * @ai-context Repository helper functions
 * @ai-pattern Common repository operations
 * @ai-critical Shared logic for all repositories
 * @ai-why Eliminates duplicate code across repositories
 * @ai-assumption All repositories follow similar patterns
 */

import type { Database } from './base.js';
import { Tag } from '../types/domain-types.js';
import { ValidationUtils } from '../utils/validation-utils.js';
import { DataConverters } from '../utils/transform-utils.js';
import { DatabaseError } from '../errors/custom-errors.js';
import type { Logger } from 'winston';

/**
 * @ai-intent Common repository operations
 * @ai-pattern Shared functionality
 */
export class RepositoryHelpers {
  /**
   * @ai-intent Get next ID from sequences table
   * @ai-pattern Centralized ID generation
   * @ai-critical Thread-safe with transactions
   */
  static async getNextId(
    db: Database,
    type: string,
    logger?: Logger
  ): Promise<number> {
    try {
      // @ai-logic: Start transaction for atomicity
      await db.runAsync('BEGIN IMMEDIATE');

      // @ai-logic: Get current sequence value
      const row = await db.getAsync(
        'SELECT next_id FROM sequences WHERE type = ?',
        [type]
      ) as { next_id: number } | undefined;

      if (!row) {
        // @ai-logic: Insert new sequence if not exists
        await db.runAsync(
          'INSERT INTO sequences (type, next_id) VALUES (?, 1)',
          [type]
        );
        await db.runAsync('COMMIT');
        return 1;
      }

      const nextId = row.next_id;

      // @ai-logic: Increment sequence
      await db.runAsync(
        'UPDATE sequences SET next_id = next_id + 1 WHERE type = ?',
        [type]
      );

      await db.runAsync('COMMIT');

      logger?.debug(`Generated ID ${nextId} for type ${type}`);
      return nextId;

    } catch (error) {
      await db.runAsync('ROLLBACK');
      logger?.error(`Failed to get next ID for ${type}`, { error });
      throw new DatabaseError(`Failed to generate ID for ${type}`, { error, type });
    }
  }

  /**
   * @ai-intent Save tags for an entity
   * @ai-pattern Common tag relationship management
   * @ai-flow 1. Auto-register tags -> 2. Delete old -> 3. Insert new
   */
  static async saveEntityTags(
    db: Database,
    entityType: string,
    entityId: number | string,
    tags: string[] | undefined,
    tableName: string,
    logger?: Logger
  ): Promise<void> {
    try {
      const cleanedTags = ValidationUtils.cleanTags(tags);

      // @ai-logic: Auto-register tags if needed
      if (cleanedTags.length > 0) {
        await this.autoRegisterTags(db, cleanedTags, logger);
      }

      // @ai-logic: Delete existing relationships
      const deleteQuery = `DELETE FROM ${tableName} WHERE ${entityType}_id = ?`;
      await db.runAsync(deleteQuery, [entityId]);

      // @ai-logic: Insert new relationships
      if (cleanedTags.length > 0) {
        const insertQuery = `INSERT INTO ${tableName} (${entityType}_id, tag_name) VALUES (?, ?)`;

        for (const tag of cleanedTags) {
          await db.runAsync(insertQuery, [entityId, tag]);
        }
      }

      logger?.debug(`Saved ${cleanedTags.length} tags for ${entityType} ${entityId}`);

    } catch (error) {
      logger?.error(`Failed to save tags for ${entityType} ${entityId}`, { error });
      throw new DatabaseError('Failed to save tags', { error, entityType, entityId });
    }
  }

  /**
   * @ai-intent Auto-register tags
   * @ai-pattern Ensure tags exist before use
   * @ai-critical Uses INSERT OR IGNORE for concurrency
   */
  static async autoRegisterTags(
    db: Database,
    tags: string[],
    logger?: Logger
  ): Promise<void> {
    if (!tags || tags.length === 0) {
      return;
    }

    const now = new Date().toISOString();

    try {
      for (const tag of tags) {
        await db.runAsync(
          'INSERT OR IGNORE INTO tags (name, created_at, updated_at) VALUES (?, ?, ?)',
          [tag, now, now]
        );
      }

      logger?.debug(`Auto-registered ${tags.length} tags`);

    } catch (error) {
      logger?.error('Failed to auto-register tags', { error, tags });
      throw new DatabaseError('Failed to auto-register tags', { error, tags });
    }
  }

  /**
   * @ai-intent Load tags for an entity
   * @ai-pattern Fetch tags from relationship table
   */
  static async loadEntityTags(
    db: Database,
    entityType: string,
    entityId: number | string,
    tableName: string,
    logger?: Logger
  ): Promise<string[]> {
    try {
      const query = `SELECT tag_name FROM ${tableName} WHERE ${entityType}_id = ? ORDER BY tag_name`;
      const rows = await db.allAsync(query, [entityId]) as Array<{ tag_name: string }>;

      return rows.map(row => row.tag_name);

    } catch (error) {
      logger?.error(`Failed to load tags for ${entityType} ${entityId}`, { error });
      return []; // @ai-logic: Return empty array on error
    }
  }

  /**
   * @ai-intent Save related entities
   * @ai-pattern Common relationship management
   */
  static async saveRelatedEntities(
    db: Database,
    sourceType: string,
    sourceId: number | string,
    relatedTasks: string[] | undefined,
    relatedDocuments: string[] | undefined,
    logger?: Logger
  ): Promise<void> {
    try {
      // @ai-logic: Delete existing relationships
      await db.runAsync(
        'DELETE FROM related_tasks WHERE source_type = ? AND source_id = ?',
        [sourceType, sourceId]
      );

      await db.runAsync(
        'DELETE FROM related_documents WHERE source_type = ? AND source_id = ?',
        [sourceType, sourceId]
      );

      // @ai-logic: Insert task relationships
      if (relatedTasks && relatedTasks.length > 0) {
        const taskRefs = ValidationUtils.parseReferences(relatedTasks);

        for (const [targetType, ids] of taskRefs) {
          for (const targetId of ids) {
            await db.runAsync(
              'INSERT INTO related_tasks (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)',
              [sourceType, sourceId, targetType, targetId]
            );
          }
        }
      }

      // @ai-logic: Insert document relationships
      if (relatedDocuments && relatedDocuments.length > 0) {
        const docRefs = ValidationUtils.parseReferences(relatedDocuments);

        for (const [targetType, ids] of docRefs) {
          for (const targetId of ids) {
            await db.runAsync(
              'INSERT INTO related_documents (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)',
              [sourceType, sourceId, targetType, targetId]
            );
          }
        }
      }

      logger?.debug(`Saved relationships for ${sourceType} ${sourceId}`);

    } catch (error) {
      logger?.error(`Failed to save relationships for ${sourceType} ${sourceId}`, { error });
      throw new DatabaseError('Failed to save relationships', { error, sourceType, sourceId });
    }
  }

  /**
   * @ai-intent Load related entities
   * @ai-pattern Fetch relationships from tables
   */
  static async loadRelatedEntities(
    db: Database,
    sourceType: string,
    sourceId: number | string,
    logger?: Logger
  ): Promise<{
    related_tasks: string[];
    related_documents: string[];
  }> {
    try {
      // @ai-logic: Load task relationships
      const taskRows = await db.allAsync(
        'SELECT target_type, target_id FROM related_tasks WHERE source_type = ? AND source_id = ?',
        [sourceType, sourceId]
      ) as Array<{ target_type: string; target_id: number }>;

      const relatedTasks = taskRows.map(row =>
        DataConverters.createReference(row.target_type, row.target_id)
      );

      // @ai-logic: Load document relationships
      const docRows = await db.allAsync(
        'SELECT target_type, target_id FROM related_documents WHERE source_type = ? AND source_id = ?',
        [sourceType, sourceId]
      ) as Array<{ target_type: string; target_id: number }>;

      const relatedDocuments = docRows.map(row =>
        DataConverters.createReference(row.target_type, row.target_id)
      );

      return {
        related_tasks: relatedTasks,
        related_documents: relatedDocuments
      };

    } catch (error) {
      logger?.error(`Failed to load relationships for ${sourceType} ${sourceId}`, { error });
      return {
        related_tasks: [],
        related_documents: []
      };
    }
  }

  /**
   * @ai-intent Build WHERE clause from filters
   * @ai-pattern Dynamic query building
   */
  static buildWhereClause(
    filters: Record<string, any>,
    paramValues: any[]
  ): string {
    const conditions: string[] = [];

    for (const [field, value] of Object.entries(filters)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        // @ai-logic: IN clause for arrays
        const placeholders = value.map(() => '?').join(',');
        conditions.push(`${field} IN (${placeholders})`);
        paramValues.push(...value);
      } else if (typeof value === 'string' && value.includes('%')) {
        // @ai-logic: LIKE clause for wildcards
        conditions.push(`${field} LIKE ?`);
        paramValues.push(value);
      } else {
        // @ai-logic: Equality check
        conditions.push(`${field} = ?`);
        paramValues.push(value);
      }
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  /**
   * @ai-intent Execute search query
   * @ai-pattern Common search implementation
   */
  static async executeSearch<T>(
    db: Database,
    tableName: string,
    searchFields: string[],
    query: string,
    additionalFilters?: Record<string, any>,
    logger?: Logger
  ): Promise<T[]> {
    try {
      const params: any[] = [];
      const conditions: string[] = [];

      // @ai-logic: Build search condition
      if (query && searchFields.length > 0) {
        const searchConditions = searchFields.map(field =>
          `${field} LIKE ?`
        ).join(' OR ');

        conditions.push(`(${searchConditions})`);
        searchFields.forEach(() => params.push(`%${query}%`));
      }

      // @ai-logic: Add additional filters
      if (additionalFilters) {
        for (const [field, value] of Object.entries(additionalFilters)) {
          if (value !== undefined && value !== null) {
            conditions.push(`${field} = ?`);
            params.push(value);
          }
        }
      }

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      const sql = `SELECT * FROM ${tableName} ${whereClause} ORDER BY id DESC`;

      logger?.debug('Executing search query', { sql, params });

      return await db.allAsync(sql, params) as T[];

    } catch (error) {
      logger?.error('Search query failed', { error, tableName, query });
      throw new DatabaseError('Search failed', { error, tableName, query });
    }
  }

  /**
   * @ai-intent Check if entity exists
   * @ai-pattern Existence validation
   */
  static async exists(
    db: Database,
    tableName: string,
    id: number | string,
    idField: string = 'id'
  ): Promise<boolean> {
    const row = await db.getAsync(
      `SELECT 1 FROM ${tableName} WHERE ${idField} = ? LIMIT 1`,
      [id]
    );

    return !!row;
  }

  /**
   * @ai-intent Get count with filters
   * @ai-pattern Count query helper
   */
  static async getCount(
    db: Database,
    tableName: string,
    filters?: Record<string, any>
  ): Promise<number> {
    const params: any[] = [];
    const whereClause = filters
      ? this.buildWhereClause(filters, params)
      : '';

    const row = await db.getAsync(
      `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`,
      params
    ) as { count: number };

    return row.count;
  }
}