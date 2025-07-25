import { BaseRepository } from './base.js';
/**
 * @ai-context Repository for workflow status management
 * @ai-pattern Simple CRUD repository for status definitions
 * @ai-critical Statuses are referenced by ID - deletion can break referential integrity
 * @ai-lifecycle Statuses created at DB init, custom ones added by users
 * @ai-assumption Default statuses (1-6) should not be deleted
 */
export class StatusRepository extends BaseRepository {
    constructor(db) {
        super(db, 'StatusRepository');
    }
    /**
     * @ai-intent Retrieve all available workflow statuses
     * @ai-flow 1. Query all statuses -> 2. Map to typed objects -> 3. Return sorted by ID
     * @ai-performance Cached by UI layer - called frequently
     * @ai-return Always returns array, empty if table not initialized
     * @ai-why Ordered by ID to show default statuses first
     */
    async getAllStatuses() {
        const rows = await this.db.allAsync('SELECT id, name, is_closed, created_at FROM statuses ORDER BY id');
        // @ai-logic: Type safety through explicit mapping
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            is_closed: row.is_closed === 1,
            created_at: row.created_at
        }));
    }
    async getAllStatusesAsync() {
        return this.getAllStatuses();
    }
    async getStatus(id) {
        const row = await this.db.getAsync('SELECT id, name, is_closed, created_at FROM statuses WHERE id = ?', [id]);
        if (!row)
            return null;
        return {
            id: row.id,
            name: row.name,
            is_closed: row.is_closed === 1,
            created_at: row.created_at
        };
    }
    /**
     * @ai-intent Create custom workflow status
     * @ai-flow 1. Insert with auto-increment ID -> 2. Return complete object
     * @ai-side-effects Adds to statuses table, ID generated by AUTOINCREMENT
     * @ai-error-handling Throws on duplicate names (UNIQUE constraint)
     * @ai-critical IDs 7+ are custom statuses that need preservation during rebuilds
     */
    async createStatus(name, is_closed = false) {
        const result = await this.db.runAsync('INSERT INTO statuses (name, is_closed) VALUES (?, ?)', [name, is_closed ? 1 : 0]);
        return {
            id: result.lastID, // @ai-assumption: SQLite always provides lastID
            name,
            is_closed,
            created_at: new Date().toISOString()
        };
    }
    async updateStatus(id, name, is_closed) {
        let sql = 'UPDATE statuses SET name = ?';
        const params = [name];
        if (is_closed !== undefined) {
            sql += ', is_closed = ?';
            params.push(is_closed ? 1 : 0);
        }
        sql += ' WHERE id = ?';
        params.push(id);
        const result = await this.db.runAsync(sql, params);
        return result.changes > 0;
    }
    /**
     * @ai-intent Remove status definition
     * @ai-flow 1. Execute DELETE -> 2. Check affected rows -> 3. Return success
     * @ai-critical Can break issues/plans using this status - no cascade delete
     * @ai-warning Should prevent deletion of default statuses (1-6) at app layer
     * @ai-return True if deleted, false if not found
     */
    async deleteStatus(id) {
        const result = await this.db.runAsync('DELETE FROM statuses WHERE id = ?', [id]);
        // @ai-logic: changes > 0 means row was actually deleted
        return result.changes > 0;
    }
}
//# sourceMappingURL=status-repository.js.map