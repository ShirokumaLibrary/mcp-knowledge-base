/**
 * @ai-context Base repository pattern implementation
 * @ai-pattern Template method pattern for common database operations
 * @ai-critical All repositories extend this base class
 * @ai-dependencies Database wrapper, entity types, logger
 * @ai-assumption Entity has at least 'id' field
 */

import type { Database } from './base.js';
import { createLogger } from '../utils/logger.js';
import type { Logger } from 'winston';
import type {
  DatabaseRow,
  QueryParameter,
  QueryParameters
} from './types/database-types.js';

/**
 * @ai-intent Base entity interface
 * @ai-pattern All domain entities implement this
 * @ai-critical ID can be string or number
 */
export interface BaseEntity {
  id: string | number;
  [key: string]: unknown; // Simplified to allow any property
}

/**
 * @ai-intent Repository base class
 * @ai-pattern Provides logger for all repositories
 * @ai-usage Extended by BaseRepository
 */
export abstract class RepositoryBase {
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
export abstract class BaseRepository<T extends BaseEntity, K extends string | number = number> {
  protected logger: Logger;

  constructor(
    protected db: Database,
    protected tableName: string,
    loggerName: string
  ) {
    this.logger = createLogger(loggerName);
  }

  /**
   * @ai-intent Get next ID for entity creation
   * @ai-flow Delegates to database for sequence management
   * @ai-critical Must be called before INSERT
   * @ai-return Next available ID
   */
  protected async getNextId(type: string): Promise<number> {
    // Get next ID from sequences table
    const result = await this.db.runAsync(
      'UPDATE sequences SET current_value = current_value + 1 WHERE type = ?',
      [type]
    );

    if (result.changes === 0) {
      throw new Error(`Sequence type '${type}' not found`);
    }

    const row = await this.db.getAsync(
      'SELECT current_value FROM sequences WHERE type = ?',
      [type]
    );

    return Number(row?.current_value || 0);
  }

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
  protected async findById(id: K): Promise<T | null> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const row = await this.db.getAsync(query, [id as QueryParameter]);

      if (!row) {
        return null;
      }

      return this.mapRowToEntity(row);
    } catch (error) {
      this.logger.error(`Failed to find by ID in ${this.tableName}`, { error, id });
      throw error;
    }
  }

  /**
   * @ai-intent Generic find all with filtering
   * @ai-flow 1. Build WHERE -> 2. Add ORDER BY -> 3. Add LIMIT -> 4. Execute
   * @ai-pattern Flexible query builder
   * @ai-usage Common list operations
   */
  protected async findAll(options?: QueryOptions<T>): Promise<T[]> {
    try {
      let query = `SELECT * FROM ${this.tableName}`;
      const params: QueryParameters = [];

      // @ai-logic: Build WHERE clause dynamically
      if (options?.where) {
        const conditions = Object.entries(options.where)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => {
            params.push(value as QueryParameter);
            return `${key} = ?`;
          })
          .join(' AND ');

        if (conditions) {
          query += ` WHERE ${conditions}`;
        }
      }

      // @ai-logic: Add ordering
      if (options?.orderBy) {
        query += ` ORDER BY ${String(options.orderBy)} ${options.order || 'ASC'}`;
      }

      // @ai-logic: Add pagination
      if (options?.limit) {
        query += ` LIMIT ${options.limit}`;

        if (options.offset) {
          query += ` OFFSET ${options.offset}`;
        }
      }

      const rows = await this.db.allAsync(query, params);

      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      this.logger.error(`Failed to find all in ${this.tableName}`, { error, options });
      throw error;
    }
  }

  /**
   * @ai-intent Generic create implementation
   * @ai-flow 1. Map to row -> 2. INSERT -> 3. Return created entity
   * @ai-pattern Returns complete entity with generated ID
   * @ai-side-effects Creates new database record
   */
  protected async create(data: Omit<T, 'id'>): Promise<T> {
    try {
      const row = this.mapEntityToRow(data as Partial<T>);
      const fields = Object.keys(row);
      const values = Object.values(row);
      const placeholders = fields.map(() => '?').join(', ');

      const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;

      const result = await this.db.runAsync(query, values);

      // @ai-logic: Return created entity with ID
      return await this.findById(result.lastID as K) as T;
    } catch (error) {
      this.logger.error(`Failed to create in ${this.tableName}`, { error, data });
      throw error;
    }
  }

  /**
   * @ai-intent Execute raw query with type safety
   * @ai-pattern Escape hatch for complex queries
   * @ai-usage When base methods aren't sufficient
   * @ai-generic R for result row type
   */
  protected async executeQuery<R extends DatabaseRow = DatabaseRow>(
    query: string,
    params: QueryParameters = []
  ): Promise<R[]> {
    try {
      return await this.db.allAsync(query, params) as R[];
    } catch (error) {
      this.logger.error('Query execution failed', { error, query, params });
      throw error;
    }
  }

  /**
   * @ai-intent Execute non-SELECT query
   * @ai-pattern For UPDATE/DELETE operations
   * @ai-return Run result with changes count
   */
  protected async executeRun(
    query: string,
    params: QueryParameters = []
  ): Promise<{ changes: number; lastID: number | bigint }> {
    try {
      return await this.db.runAsync(query, params);
    } catch (error) {
      this.logger.error('Run execution failed', { error, query, params });
      throw error;
    }
  }

  /**
   * @ai-intent Generic update implementation
   * @ai-flow 1. Check exists -> 2. Map data -> 3. UPDATE -> 4. Return updated
   * @ai-pattern Optimistic update with result verification
   * @ai-return Updated entity or null if not found
   */
  protected async updateById(id: K, data: Partial<T>): Promise<T | null> {
    try {
      // @ai-logic: Ensure entity exists
      const exists = await this.exists(id);
      if (!exists) {
        return null;
      }

      // @ai-logic: Prepare update data
      const updateData = { ...data };
      // Use proper type narrowing instead of any
      if ('id' in updateData) {
        delete updateData.id; // @ai-critical: Never update ID
      }

      const row = this.mapEntityToRow(updateData);
      const updates = Object.entries(row)
        .filter(([key]) => key !== 'id') // @ai-critical: Don't update ID
        .map(([key]) => `${key} = ?`)
        .join(', ');

      const values = Object.entries(row)
        .filter(([key]) => key !== 'id')
        .map(([, value]) => value);

      values.push(id); // @ai-logic: ID for WHERE clause

      const query = `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`;

      await this.db.runAsync(query, values);

      // @ai-logic: Return updated entity
      return await this.findById(id);
    } catch (error) {
      this.logger.error(`Failed to update in ${this.tableName}`, { error, id, data });
      throw error;
    }
  }

  /**
   * @ai-intent Generic delete implementation
   * @ai-flow 1. Check exists -> 2. Execute DELETE -> 3. Return success
   * @ai-pattern Soft delete not implemented (uses hard delete)
   * @ai-side-effects Permanently removes record
   */
  protected async deleteById(id: K): Promise<boolean> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = await this.db.runAsync(query, [id as QueryParameter]);

      return result.changes > 0;
    } catch (error) {
      this.logger.error(`Failed to delete from ${this.tableName}`, { error, id });
      throw error;
    }
  }

  /**
   * @ai-intent Count records matching criteria
   * @ai-pattern Efficient counting without loading data
   * @ai-usage For pagination metadata
   */
  protected async count(where?: Partial<T>): Promise<number> {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const params: QueryParameters = [];

      if (where) {
        const conditions = Object.entries(where)
          .map(([key, value]) => {
            params.push(value as QueryParameter);
            return `${key} = ?`;
          })
          .join(' AND ');

        if (conditions) {
          query += ` WHERE ${conditions}`;
        }
      }

      const result = await this.db.getAsync(query, params);

      return Number(result?.count) || 0;
    } catch (error) {
      this.logger.error(`Failed to count in ${this.tableName}`, { error, where });
      throw error;
    }
  }

  /**
   * @ai-intent Check if entity exists
   * @ai-pattern Efficient existence check
   * @ai-usage Before updates or validations
   */
  protected async exists(id: K): Promise<boolean> {
    try {
      const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
      const row = await this.db.getAsync(query, [id as QueryParameter]);

      return row !== undefined;
    } catch (error) {
      this.logger.error(`Failed to check existence in ${this.tableName}`, { error, id });
      throw error;
    }
  }

  /**
   * @ai-intent Transaction helper
   * @ai-pattern Ensures atomic operations
   * @ai-usage For multi-step operations
   * @ai-side-effects Commits or rolls back entire transaction
   */
  protected async transaction<R>(
    callback: (db: Database) => Promise<R>
  ): Promise<R> {
    try {
      await this.db.runAsync('BEGIN');

      try {
        const result = await callback(this.db);
        await this.db.runAsync('COMMIT');
        return result;
      } catch (error) {
        await this.db.runAsync('ROLLBACK');
        throw error;
      }
    } catch (error) {
      this.logger.error('Transaction failed', { error });
      throw error;
    }
  }
}