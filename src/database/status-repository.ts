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

export class StatusRepository extends BaseRepository<StatusEntity, number> {
  constructor(db: Database) {
    super(db, 'statuses', 'StatusRepository');
  }

  /**
   * @ai-intent Get next ID using SQLite AUTOINCREMENT
   * @ai-pattern SQLite handles ID generation
   * @ai-critical Returns 0 as placeholder - real ID from lastID
   */
  protected async getNextId(): Promise<number> {
    // @ai-logic: SQLite AUTOINCREMENT handles this
    return 0; // Placeholder, actual ID comes from lastID
  }

  /**
   * @ai-intent Map database row to Status entity
   * @ai-pattern Converts SQLite boolean representation
   * @ai-critical is_closed stored as 0/1 in database
   */
  protected mapRowToEntity(row: DatabaseRow): StatusEntity {
    return {
      id: Number(row.id),
      name: String(row.name),
      is_closed: row.is_closed === 1,
      created_at: String(row.created_at),
      updated_at: row.updated_at ? String(row.updated_at) : String(row.created_at)
    };
  }

  /**
   * @ai-intent Map Status entity to database row
   * @ai-pattern Converts boolean to SQLite integer
   * @ai-critical Filters undefined values
   */
  protected mapEntityToRow(entity: Partial<StatusEntity>): DatabaseRow {
    const row: DatabaseRow = {};

    if (entity.id !== undefined) {
      row.id = entity.id;
    }
    if (entity.name !== undefined) {
      row.name = entity.name;
    }
    if (entity.is_closed !== undefined) {
      row.is_closed = entity.is_closed ? 1 : 0;
    }
    if (entity.created_at !== undefined) {
      row.created_at = entity.created_at;
    }
    if (entity.updated_at !== undefined) {
      row.updated_at = entity.updated_at;
    }

    return row;
  }

  /**
   * @ai-intent Retrieve all available workflow statuses
   * @ai-flow Uses base findAll with ordering
   * @ai-performance Cached by UI layer - called frequently
   * @ai-return Always returns array, empty if table not initialized
   */
  async getAllStatuses(): Promise<Status[]> {
    return this.findAll({
      orderBy: 'id',
      order: 'ASC'
    });
  }

  /**
   * @ai-intent Legacy async method for backward compatibility
   * @ai-deprecated Use getAllStatuses() directly
   */
  async getAllStatusesAsync(): Promise<Status[]> {
    return this.getAllStatuses();
  }

  /**
   * @ai-intent Get single status by ID
   * @ai-flow Delegates to base findById
   * @ai-return Status or null if not found
   */
  async getStatus(id: number): Promise<Status | null> {
    return this.findById(id);
  }

  /**
   * @ai-intent Create custom workflow status
   * @ai-flow Uses base insert with specific fields
   * @ai-side-effects Adds to statuses table
   * @ai-error-handling Throws on duplicate names
   */
  async createStatus(name: string, is_closed: boolean = false): Promise<Status> {
    // @ai-logic: Override base insert to handle AUTOINCREMENT
    const now = new Date().toISOString();
    const result = await this.db.runAsync(
      'INSERT INTO statuses (name, is_closed, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [name, is_closed ? 1 : 0, now, now]
    );

    const id = (result as any).lastID!;
    const created = await this.findById(id);

    if (!created) {
      throw new Error(`Failed to retrieve created status with ID ${id}`);
    }

    return created;
  }

  /**
   * @ai-intent Update status properties
   * @ai-flow Custom implementation for partial updates
   * @ai-pattern Only updates provided fields
   * @ai-return true if updated, false if not found
   */
  async updateStatus(id: number, name: string, is_closed?: boolean): Promise<boolean> {
    const updateData: Partial<StatusEntity> = { name };

    if (is_closed !== undefined) {
      updateData.is_closed = is_closed;
    }

    const result = await this.updateById(id, updateData);
    return result !== null;
  }

  /**
   * @ai-intent Remove status definition
   * @ai-flow Delegates to base deleteById
   * @ai-critical Can break items using this status
   * @ai-return true if deleted, false if not found
   */
  async deleteStatus(id: number): Promise<boolean> {
    return this.deleteById(id);
  }

  /**
   * @ai-intent Check if status is in use
   * @ai-pattern Checks both issues and plans
   * @ai-usage Call before deletion to prevent breaks
   */
  async isStatusInUse(id: number): Promise<boolean> {
    const issueCount = await this.executeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM search_issues WHERE status_id = ?',
      [id]
    );

    const planCount = await this.executeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM search_plans WHERE status_id = ?',
      [id]
    );

    return issueCount[0].count > 0 || planCount[0].count > 0;
  }

  /**
   * @ai-intent Find status by exact name match
   * @ai-flow Query by name -> Return mapped entity or null
   * @ai-usage For finding existing statuses before creation
   */
  async getStatusByName(name: string): Promise<Status | null> {
    const rows = await this.executeQuery<DatabaseRow>(
      'SELECT * FROM statuses WHERE name = ?',
      [name]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(rows[0]);
  }

  /**
   * @ai-intent Alias for getStatus method
   * @ai-deprecated Use getStatus() directly
   */
  async getStatusById(id: number): Promise<Status | null> {
    return this.getStatus(id);
  }

  /**
   * @ai-intent Get IDs of all closed statuses
   * @ai-flow Query closed statuses -> Extract IDs
   * @ai-usage For filtering out completed items
   */
  async getClosedStatusIds(): Promise<number[]> {
    const rows = await this.executeQuery<{ id: number }>(
      'SELECT id FROM statuses WHERE is_closed = 1',
      []
    );

    return rows.map(row => row.id);
  }
}