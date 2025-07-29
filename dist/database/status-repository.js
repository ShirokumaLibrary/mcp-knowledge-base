import { BaseRepository } from './base.js';
export class StatusRepository extends BaseRepository {
    constructor(db) {
        super(db, 'StatusRepository');
    }
    async getAllStatuses() {
        const rows = await this.db.allAsync('SELECT id, name, is_closed, created_at FROM statuses ORDER BY id');
        return rows.map((row) => {
            const statusRow = row;
            return {
                id: Number(statusRow.id),
                name: String(statusRow.name),
                is_closed: statusRow.is_closed === 1,
                created_at: String(statusRow.created_at)
            };
        });
    }
    async getAllStatusesAsync() {
        return this.getAllStatuses();
    }
    async getStatus(id) {
        const row = await this.db.getAsync('SELECT id, name, is_closed, created_at FROM statuses WHERE id = ?', [id]);
        if (!row) {
            return null;
        }
        return {
            id: Number(row.id),
            name: String(row.name),
            is_closed: row.is_closed === 1,
            created_at: String(row.created_at)
        };
    }
    async createStatus(name, is_closed = false) {
        const result = await this.db.runAsync('INSERT INTO statuses (name, is_closed) VALUES (?, ?)', [name, is_closed ? 1 : 0]);
        return {
            id: result.lastID,
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
    async deleteStatus(id) {
        const result = await this.db.runAsync('DELETE FROM statuses WHERE id = ?', [id]);
        return result.changes > 0;
    }
    async getStatusByName(name) {
        const row = await this.db.getAsync('SELECT id, name, is_closed, created_at FROM statuses WHERE name = ?', [name]);
        if (!row) {
            return null;
        }
        return {
            id: Number(row.id),
            name: String(row.name),
            is_closed: row.is_closed === 1,
            created_at: String(row.created_at)
        };
    }
    async getStatusById(id) {
        return this.getStatus(id);
    }
    async getClosedStatusIds() {
        const rows = await this.db.allAsync('SELECT id FROM statuses WHERE is_closed = 1');
        return rows.map((row) => Number(row.id));
    }
}
