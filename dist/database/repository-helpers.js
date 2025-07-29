import { ValidationUtils } from '../utils/validation-utils.js';
import { DataConverters } from '../utils/transform-utils.js';
import { DatabaseError } from '../errors/custom-errors.js';
export class RepositoryHelpers {
    static async getNextId(db, type, logger) {
        try {
            await db.runAsync('BEGIN IMMEDIATE');
            const row = await db.getAsync('SELECT next_id FROM sequences WHERE type = ?', [type]);
            if (!row) {
                await db.runAsync('INSERT INTO sequences (type, next_id) VALUES (?, 1)', [type]);
                await db.runAsync('COMMIT');
                return 1;
            }
            const nextId = row.next_id;
            await db.runAsync('UPDATE sequences SET next_id = next_id + 1 WHERE type = ?', [type]);
            await db.runAsync('COMMIT');
            logger?.debug(`Generated ID ${nextId} for type ${type}`);
            return nextId;
        }
        catch (error) {
            await db.runAsync('ROLLBACK');
            logger?.error(`Failed to get next ID for ${type}`, { error });
            throw new DatabaseError(`Failed to generate ID for ${type}`, { error, type });
        }
    }
    static async saveEntityTags(db, entityType, entityId, tags, tableName, logger) {
        try {
            const cleanedTags = ValidationUtils.cleanTags(tags);
            if (cleanedTags.length > 0) {
                await this.autoRegisterTags(db, cleanedTags, logger);
            }
            const deleteQuery = `DELETE FROM ${tableName} WHERE ${entityType}_id = ?`;
            await db.runAsync(deleteQuery, [entityId]);
            if (cleanedTags.length > 0) {
                const insertQuery = `INSERT INTO ${tableName} (${entityType}_id, tag_name) VALUES (?, ?)`;
                for (const tag of cleanedTags) {
                    await db.runAsync(insertQuery, [entityId, tag]);
                }
            }
            logger?.debug(`Saved ${cleanedTags.length} tags for ${entityType} ${entityId}`);
        }
        catch (error) {
            logger?.error(`Failed to save tags for ${entityType} ${entityId}`, { error });
            throw new DatabaseError('Failed to save tags', { error, entityType, entityId });
        }
    }
    static async autoRegisterTags(db, tags, logger) {
        if (!tags || tags.length === 0) {
            return;
        }
        const now = new Date().toISOString();
        try {
            for (const tag of tags) {
                await db.runAsync('INSERT OR IGNORE INTO tags (name, created_at, updated_at) VALUES (?, ?, ?)', [tag, now, now]);
            }
            logger?.debug(`Auto-registered ${tags.length} tags`);
        }
        catch (error) {
            logger?.error('Failed to auto-register tags', { error, tags });
            throw new DatabaseError('Failed to auto-register tags', { error, tags });
        }
    }
    static async loadEntityTags(db, entityType, entityId, tableName, logger) {
        try {
            const query = `SELECT tag_name FROM ${tableName} WHERE ${entityType}_id = ? ORDER BY tag_name`;
            const rows = await db.allAsync(query, [entityId]);
            return rows.map(row => row.tag_name);
        }
        catch (error) {
            logger?.error(`Failed to load tags for ${entityType} ${entityId}`, { error });
            return [];
        }
    }
    static async saveRelatedEntities(db, sourceType, sourceId, relatedTasks, relatedDocuments, logger) {
        try {
            await db.runAsync('DELETE FROM related_items WHERE source_type = ? AND source_id = ?', [sourceType, sourceId]);
            if (relatedTasks && relatedTasks.length > 0) {
                const taskRefs = ValidationUtils.parseReferences(relatedTasks);
                for (const [targetType, ids] of taskRefs) {
                    for (const targetId of ids) {
                        await db.runAsync('INSERT INTO related_items (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)', [sourceType, sourceId, targetType, targetId]);
                    }
                }
            }
            if (relatedDocuments && relatedDocuments.length > 0) {
                const docRefs = ValidationUtils.parseReferences(relatedDocuments);
                for (const [targetType, ids] of docRefs) {
                    for (const targetId of ids) {
                        await db.runAsync('INSERT INTO related_items (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)', [sourceType, sourceId, targetType, targetId]);
                    }
                }
            }
            logger?.debug(`Saved relationships for ${sourceType} ${sourceId}`);
        }
        catch (error) {
            logger?.error(`Failed to save relationships for ${sourceType} ${sourceId}`, { error });
            throw new DatabaseError('Failed to save relationships', { error, sourceType, sourceId });
        }
    }
    static async loadRelatedEntities(db, sourceType, sourceId, logger) {
        try {
            const rows = await db.allAsync('SELECT target_type, target_id FROM related_items WHERE source_type = ? AND source_id = ?', [sourceType, sourceId]);
            const taskTypes = ['issues', 'plans'];
            const relatedTasks = [];
            const relatedDocuments = [];
            for (const row of rows) {
                const ref = DataConverters.createReference(row.target_type, row.target_id);
                if (taskTypes.includes(row.target_type)) {
                    relatedTasks.push(ref);
                }
                else {
                    relatedDocuments.push(ref);
                }
            }
            return {
                related_tasks: relatedTasks,
                related_documents: relatedDocuments
            };
        }
        catch (error) {
            logger?.error(`Failed to load relationships for ${sourceType} ${sourceId}`, { error });
            return {
                related_tasks: [],
                related_documents: []
            };
        }
    }
    static buildWhereClause(filters, paramValues) {
        const conditions = [];
        for (const [field, value] of Object.entries(filters)) {
            if (value === undefined || value === null) {
                continue;
            }
            if (Array.isArray(value)) {
                const placeholders = value.map(() => '?').join(',');
                conditions.push(`${field} IN (${placeholders})`);
                paramValues.push(...value);
            }
            else if (typeof value === 'string' && value.includes('%')) {
                conditions.push(`${field} LIKE ?`);
                paramValues.push(value);
            }
            else {
                conditions.push(`${field} = ?`);
                paramValues.push(value);
            }
        }
        return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }
    static async executeSearch(db, tableName, searchFields, query, additionalFilters, logger) {
        try {
            const params = [];
            const conditions = [];
            if (query && searchFields.length > 0) {
                const searchConditions = searchFields.map(field => `${field} LIKE ?`).join(' OR ');
                conditions.push(`(${searchConditions})`);
                searchFields.forEach(() => params.push(`%${query}%`));
            }
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
            return await db.allAsync(sql, params);
        }
        catch (error) {
            logger?.error('Search query failed', { error, tableName, query });
            throw new DatabaseError('Search failed', { error, tableName, query });
        }
    }
    static async exists(db, tableName, id, idField = 'id') {
        const row = await db.getAsync(`SELECT 1 FROM ${tableName} WHERE ${idField} = ? LIMIT 1`, [id]);
        return !!row;
    }
    static async getCount(db, tableName, filters) {
        const params = [];
        const whereClause = filters
            ? this.buildWhereClause(filters, params)
            : '';
        const row = await db.getAsync(`SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`, params);
        return row.count;
    }
}
