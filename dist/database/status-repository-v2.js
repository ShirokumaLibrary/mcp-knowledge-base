import { BaseRepository } from './base-repository.js';
export class StatusRepositoryV2 extends BaseRepository {
    constructor(db) {
        super(db, 'statuses', 'StatusRepository');
    }
    async getNextId() {
        return 0;
    }
    mapRowToEntity(row) {
        return {
            id: Number(row.id),
            name: String(row.name),
            is_closed: row.is_closed === 1,
            created_at: String(row.created_at),
            updated_at: row.updated_at ? String(row.updated_at) : String(row.created_at)
        };
    }
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
    async getAllStatuses() {
        return this.findAll({
            orderBy: 'id',
            order: 'ASC'
        });
    }
    async getAllStatusesAsync() {
        return this.getAllStatuses();
    }
    async getStatus(id) {
        return this.findById(id);
    }
    async createStatus(name, is_closed = false) {
        const now = new Date().toISOString();
        const result = await this.db.runAsync('INSERT INTO statuses (name, is_closed, created_at, updated_at) VALUES (?, ?, ?, ?)', [name, is_closed ? 1 : 0, now, now]);
        const id = result.lastID;
        const created = await this.findById(id);
        if (!created) {
            throw new Error(`Failed to retrieve created status with ID ${id}`);
        }
        return created;
    }
    async updateStatus(id, name, is_closed) {
        const updateData = { name };
        if (is_closed !== undefined) {
            updateData.is_closed = is_closed;
        }
        const result = await this.updateById(id, updateData);
        return result !== null;
    }
    async deleteStatus(id) {
        return this.deleteById(id);
    }
    async isStatusInUse(id) {
        const issueCount = await this.executeQuery('SELECT COUNT(*) as count FROM search_issues WHERE status_id = ?', [id]);
        const planCount = await this.executeQuery('SELECT COUNT(*) as count FROM search_plans WHERE status_id = ?', [id]);
        return issueCount[0].count > 0 || planCount[0].count > 0;
    }
}
