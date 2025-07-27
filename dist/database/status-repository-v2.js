/**
 * @ai-context Repository for workflow status management using base repository
 * @ai-pattern Extends BaseRepository for type-safe operations
 * @ai-critical Statuses are referenced by ID - deletion can break referential integrity
 * @ai-lifecycle Statuses created at DB init, custom ones added by users
 * @ai-assumption Default statuses (1-6) should not be deleted
 */
import { BaseRepository } from './base-repository.js';
export class StatusRepositoryV2 extends BaseRepository {
    constructor(db) {
        super(db, 'statuses', 'StatusRepository');
    }
    /**
     * @ai-intent Get next ID using SQLite AUTOINCREMENT
     * @ai-pattern SQLite handles ID generation
     * @ai-critical Returns 0 as placeholder - real ID from lastID
     */
    async getNextId() {
        // @ai-logic: SQLite AUTOINCREMENT handles this
        return 0; // Placeholder, actual ID comes from lastID
    }
    /**
     * @ai-intent Map database row to Status entity
     * @ai-pattern Converts SQLite boolean representation
     * @ai-critical is_closed stored as 0/1 in database
     */
    mapRowToEntity(row) {
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
    mapEntityToRow(entity) {
        const row = {};
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
    async getAllStatuses() {
        return this.findAll({
            orderBy: 'id',
            order: 'ASC'
        });
    }
    /**
     * @ai-intent Legacy async method for backward compatibility
     * @ai-deprecated Use getAllStatuses() directly
     */
    async getAllStatusesAsync() {
        return this.getAllStatuses();
    }
    /**
     * @ai-intent Get single status by ID
     * @ai-flow Delegates to base findById
     * @ai-return Status or null if not found
     */
    async getStatus(id) {
        return this.findById(id);
    }
    /**
     * @ai-intent Create custom workflow status
     * @ai-flow Uses base insert with specific fields
     * @ai-side-effects Adds to statuses table
     * @ai-error-handling Throws on duplicate names
     */
    async createStatus(name, is_closed = false) {
        // @ai-logic: Override base insert to handle AUTOINCREMENT
        const now = new Date().toISOString();
        const result = await this.db.runAsync('INSERT INTO statuses (name, is_closed, created_at, updated_at) VALUES (?, ?, ?, ?)', [name, is_closed ? 1 : 0, now, now]);
        const id = result.lastID;
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
    async updateStatus(id, name, is_closed) {
        const updateData = { name };
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
    async deleteStatus(id) {
        return this.deleteById(id);
    }
    /**
     * @ai-intent Check if status is in use
     * @ai-pattern Checks both issues and plans
     * @ai-usage Call before deletion to prevent breaks
     */
    async isStatusInUse(id) {
        const issueCount = await this.executeQuery('SELECT COUNT(*) as count FROM search_issues WHERE status_id = ?', [id]);
        const planCount = await this.executeQuery('SELECT COUNT(*) as count FROM search_plans WHERE status_id = ?', [id]);
        return issueCount[0].count > 0 || planCount[0].count > 0;
    }
}
//# sourceMappingURL=status-repository-v2.js.map