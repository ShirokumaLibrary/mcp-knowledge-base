/**
 * @ai-context Base repository pattern implementation
 * @ai-pattern Template method pattern for common database operations
 * @ai-critical All repositories extend this base class
 * @ai-dependencies Database wrapper, entity types, logger
 * @ai-assumption Entity has at least 'id' field
 */
import { createLogger } from '../utils/logger.js';
/**
 * @ai-intent Repository base class
 * @ai-pattern Provides logger for all repositories
 * @ai-usage Extended by BaseRepository
 */
export class RepositoryBase {
}
/**
 * @ai-intent Abstract base repository with common operations
 * @ai-pattern Template method pattern for repositories
 * @ai-critical Subclasses must implement abstract methods
 * @ai-generic T for entity type, K for primary key type
 */
export class BaseRepository {
    db;
    tableName;
    logger;
    constructor(db, tableName, loggerName) {
        this.db = db;
        this.tableName = tableName;
        this.logger = createLogger(loggerName);
    }
    /**
     * @ai-intent Get next ID for entity creation
     * @ai-flow Delegates to database for sequence management
     * @ai-critical Must be called before INSERT
     * @ai-return Next available ID
     */
    async getNextId(type) {
        // Get next ID from sequences table
        const result = await this.db.runAsync('UPDATE sequences SET last_id = last_id + 1 WHERE type = ?', [type]);
        if (result.changes === 0) {
            throw new Error(`Sequence type '${type}' not found`);
        }
        const row = await this.db.getAsync('SELECT last_id FROM sequences WHERE type = ?', [type]);
        return Number(row?.last_id || 0);
    }
    /**
     * @ai-intent Generic find by ID implementation
     * @ai-flow 1. Build query -> 2. Execute -> 3. Map result
     * @ai-pattern Reusable across all repositories
     * @ai-return Entity or null if not found
     */
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
    /**
     * @ai-intent Generic find all with filtering
     * @ai-flow 1. Build WHERE -> 2. Add ORDER BY -> 3. Add LIMIT -> 4. Execute
     * @ai-pattern Flexible query builder
     * @ai-usage Common list operations
     */
    async findAll(options) {
        try {
            let query = `SELECT * FROM ${this.tableName}`;
            const params = [];
            // @ai-logic: Build WHERE clause dynamically
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
        }
        catch (error) {
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
    async create(data) {
        try {
            const row = this.mapEntityToRow(data);
            const fields = Object.keys(row);
            const values = Object.values(row);
            const placeholders = fields.map(() => '?').join(', ');
            const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
            const result = await this.db.runAsync(query, values);
            // @ai-logic: Return created entity with ID
            return await this.findById(result.lastID);
        }
        catch (error) {
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
    async executeQuery(query, params = []) {
        try {
            return await this.db.allAsync(query, params);
        }
        catch (error) {
            this.logger.error('Query execution failed', { error, query, params });
            throw error;
        }
    }
    /**
     * @ai-intent Execute non-SELECT query
     * @ai-pattern For UPDATE/DELETE operations
     * @ai-return Run result with changes count
     */
    async executeRun(query, params = []) {
        try {
            return await this.db.runAsync(query, params);
        }
        catch (error) {
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
    async updateById(id, data) {
        try {
            // @ai-logic: Ensure entity exists
            const exists = await this.exists(id);
            if (!exists) {
                return null;
            }
            // @ai-logic: Prepare update data
            const updateData = { ...data };
            delete updateData.id; // @ai-critical: Never update ID
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
        }
        catch (error) {
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
    /**
     * @ai-intent Count records matching criteria
     * @ai-pattern Efficient counting without loading data
     * @ai-usage For pagination metadata
     */
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
    /**
     * @ai-intent Check if entity exists
     * @ai-pattern Efficient existence check
     * @ai-usage Before updates or validations
     */
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
    /**
     * @ai-intent Transaction helper
     * @ai-pattern Ensures atomic operations
     * @ai-usage For multi-step operations
     * @ai-side-effects Commits or rolls back entire transaction
     */
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
//# sourceMappingURL=base-repository.js.map