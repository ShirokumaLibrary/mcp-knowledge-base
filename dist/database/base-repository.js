import { createLogger } from '../utils/logger.js';
export class RepositoryBase {
}
export class BaseRepository {
    db;
    tableName;
    logger;
    constructor(db, tableName, loggerName) {
        this.db = db;
        this.tableName = tableName;
        this.logger = createLogger(loggerName);
    }
    async getNextId(type) {
        const result = await this.db.runAsync('UPDATE sequences SET current_value = current_value + 1 WHERE type = ?', [type]);
        if (result.changes === 0) {
            throw new Error(`Sequence type '${type}' not found`);
        }
        const row = await this.db.getAsync('SELECT current_value FROM sequences WHERE type = ?', [type]);
        return Number(row?.current_value || 0);
    }
    async findById(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
            const row = await this.db.getAsync(query, [id]);
            if (!row) {
                return null;
            }
            return this.mapRowToEntity(row);
        }
        catch (error) {
            this.logger.error(`Failed to find by ID in ${this.tableName}`, { error, id });
            throw error;
        }
    }
    async findAll(options) {
        try {
            let query = `SELECT * FROM ${this.tableName}`;
            const params = [];
            if (options?.where) {
                const conditions = Object.entries(options.where)
                    .filter(([, value]) => value !== undefined)
                    .map(([key, value]) => {
                    params.push(value);
                    return `${key} = ?`;
                })
                    .join(' AND ');
                if (conditions) {
                    query += ` WHERE ${conditions}`;
                }
            }
            if (options?.orderBy) {
                query += ` ORDER BY ${String(options.orderBy)} ${options.order || 'ASC'}`;
            }
            if (options?.limit) {
                query += ` LIMIT ${options.limit}`;
                if (options.offset) {
                    query += ` OFFSET ${options.offset}`;
                }
            }
            const rows = await this.db.allAsync(query, params);
            return rows.map(row => this.mapRowToEntity(row));
        }
        catch (error) {
            this.logger.error(`Failed to find all in ${this.tableName}`, { error, options });
            throw error;
        }
    }
    async create(data) {
        try {
            const row = this.mapEntityToRow(data);
            const fields = Object.keys(row);
            const values = Object.values(row);
            const placeholders = fields.map(() => '?').join(', ');
            const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
            const result = await this.db.runAsync(query, values);
            return await this.findById(result.lastID);
        }
        catch (error) {
            this.logger.error(`Failed to create in ${this.tableName}`, { error, data });
            throw error;
        }
    }
    async executeQuery(query, params = []) {
        try {
            return await this.db.allAsync(query, params);
        }
        catch (error) {
            this.logger.error('Query execution failed', { error, query, params });
            throw error;
        }
    }
    async executeRun(query, params = []) {
        try {
            return await this.db.runAsync(query, params);
        }
        catch (error) {
            this.logger.error('Run execution failed', { error, query, params });
            throw error;
        }
    }
    async updateById(id, data) {
        try {
            const exists = await this.exists(id);
            if (!exists) {
                return null;
            }
            const updateData = { ...data };
            if ('id' in updateData) {
                delete updateData.id;
            }
            const row = this.mapEntityToRow(updateData);
            const updates = Object.entries(row)
                .filter(([key]) => key !== 'id')
                .map(([key]) => `${key} = ?`)
                .join(', ');
            const values = Object.entries(row)
                .filter(([key]) => key !== 'id')
                .map(([, value]) => value);
            values.push(id);
            const query = `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`;
            await this.db.runAsync(query, values);
            return await this.findById(id);
        }
        catch (error) {
            this.logger.error(`Failed to update in ${this.tableName}`, { error, id, data });
            throw error;
        }
    }
    async deleteById(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await this.db.runAsync(query, [id]);
            return result.changes > 0;
        }
        catch (error) {
            this.logger.error(`Failed to delete from ${this.tableName}`, { error, id });
            throw error;
        }
    }
    async count(where) {
        try {
            let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
            const params = [];
            if (where) {
                const conditions = Object.entries(where)
                    .map(([key, value]) => {
                    params.push(value);
                    return `${key} = ?`;
                })
                    .join(' AND ');
                if (conditions) {
                    query += ` WHERE ${conditions}`;
                }
            }
            const result = await this.db.getAsync(query, params);
            return Number(result?.count) || 0;
        }
        catch (error) {
            this.logger.error(`Failed to count in ${this.tableName}`, { error, where });
            throw error;
        }
    }
    async exists(id) {
        try {
            const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
            const row = await this.db.getAsync(query, [id]);
            return row !== undefined;
        }
        catch (error) {
            this.logger.error(`Failed to check existence in ${this.tableName}`, { error, id });
            throw error;
        }
    }
    async transaction(callback) {
        try {
            await this.db.runAsync('BEGIN');
            try {
                const result = await callback(this.db);
                await this.db.runAsync('COMMIT');
                return result;
            }
            catch (error) {
                await this.db.runAsync('ROLLBACK');
                throw error;
            }
        }
        catch (error) {
            this.logger.error('Transaction failed', { error });
            throw error;
        }
    }
}
