import { BaseRepository } from './base.js';
export class TagRepository extends BaseRepository {
    constructor(db) {
        super(db, 'TagRepository');
    }
    async getTags() {
        const rows = await this.db.allAsync('SELECT id, name, created_at FROM tags ORDER BY name');
        return rows.map((row) => {
            const tagRow = row;
            return {
                name: tagRow.name,
                createdAt: tagRow.created_at
            };
        });
    }
    async getAllTags() {
        return this.getTags();
    }
    async getTagById(id) {
        const row = await this.db.getAsync('SELECT id, name, created_at FROM tags WHERE id = ?', [id]);
        if (!row) {
            return null;
        }
        return {
            name: String(row.name),
            createdAt: row.created_at ? String(row.created_at) : undefined
        };
    }
    async getTagIdByName(name) {
        const row = await this.db.getAsync('SELECT id FROM tags WHERE name = ?', [name.trim()]);
        return row ? Number(row.id) : null;
    }
    async registerTags(tags) {
        return this.ensureTagsExist(tags);
    }
    async getTagIds(names) {
        if (!names || names.length === 0) {
            return new Map();
        }
        await this.ensureTagsExist(names);
        const placeholders = names.map(() => '?').join(',');
        const rows = await this.db.allAsync(`SELECT id, name FROM tags WHERE name IN (${placeholders})`, names);
        const idMap = new Map();
        rows.forEach((row) => {
            const tagRow = row;
            idMap.set(tagRow.name, tagRow.id);
        });
        return idMap;
    }
    async createTag(name) {
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            throw new Error('Tag name cannot be empty or whitespace only');
        }
        const result = await this.db.runAsync('INSERT OR IGNORE INTO tags (name) VALUES (?)', [trimmedName]);
        if (result.changes === 0) {
            throw new Error(`Tag "${trimmedName}" already exists`);
        }
        return trimmedName;
    }
    async deleteTag(id) {
        const tagUsageCount = await this.db.getAsync('SELECT COUNT(*) as count FROM item_tags WHERE tag_id = (SELECT id FROM tags WHERE name = ?)', [id]);
        if (tagUsageCount.count > 0) {
            throw new Error(`Cannot delete tag "${id}" because it is used by ${tagUsageCount.count} item(s)`);
        }
        const result = await this.db.runAsync('DELETE FROM tags WHERE name = ?', [id]);
        return (result.changes ?? 0) > 0;
    }
    async getOrCreateTagId(name) {
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            throw new Error('Tag name cannot be empty or whitespace only');
        }
        await this.ensureTagsExist([trimmedName]);
        const row = await this.db.getAsync('SELECT id FROM tags WHERE name = ?', [trimmedName]);
        if (!row) {
            throw new Error(`Failed to get or create tag: ${trimmedName}`);
        }
        return row.id;
    }
    async getTagsByPattern(pattern) {
        const rows = await this.db.allAsync('SELECT id, name, created_at FROM tags WHERE name LIKE ? ORDER BY name', [`%${pattern}%`]);
        return rows.map((row) => {
            const tagRow = row;
            return {
                name: tagRow.name,
                createdAt: tagRow.created_at
            };
        });
    }
    async searchTagsByPattern(pattern) {
        return this.getTagsByPattern(pattern);
    }
    async getEntityTags(entityType, entityId) {
        const tableName = `${entityType}_tags`;
        const idColumn = entityType === 'session' || entityType === 'summary' ?
            `${entityType}_${entityType === 'session' ? 'id' : 'date'}` :
            `${entityType}_id`;
        const rows = await this.db.allAsync(`SELECT t.name 
       FROM tags t 
       JOIN ${tableName} et ON t.id = et.tag_id 
       WHERE et.${idColumn} = ?
       ORDER BY t.name`, [entityId]);
        return rows.map((row) => row.name);
    }
    async saveEntityTags(entityType, entityId, tagNames) {
        if (!tagNames || tagNames.length === 0) {
            return;
        }
        const tableName = `${entityType}_tags`;
        const idColumn = entityType === 'session' || entityType === 'summary' ?
            `${entityType}_${entityType === 'session' ? 'id' : 'date'}` :
            `${entityType}_id`;
        const tagIdMap = await this.getTagIds(tagNames);
        await this.db.runAsync(`DELETE FROM ${tableName} WHERE ${idColumn} = ?`, [entityId]);
        const values = Array.from(tagIdMap.values()).map(() => '(?, ?)').join(',');
        const params = [];
        tagIdMap.forEach(tagId => {
            params.push(entityId, tagId);
        });
        if (params.length > 0) {
            await this.db.runAsync(`INSERT INTO ${tableName} (${idColumn}, tag_id) VALUES ${values}`, params);
        }
    }
    async ensureTagsExist(tags) {
        if (!tags || tags.length === 0) {
            return;
        }
        const trimmedTags = tags
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        if (trimmedTags.length === 0) {
            return;
        }
        const placeholdersForSelect = trimmedTags.map(() => '?').join(',');
        const existingRows = await this.db.allAsync(`SELECT name FROM tags WHERE name IN (${placeholdersForSelect})`, trimmedTags);
        const existingNames = new Set(existingRows.map((row) => row.name));
        const newTags = trimmedTags.filter(tag => !existingNames.has(tag));
        if (newTags.length === 0) {
            this.logger.debug(`All tags already exist: ${trimmedTags.join(', ')}`);
            return;
        }
        const placeholders = newTags.map(() => '(?)').join(',');
        const query = `INSERT OR IGNORE INTO tags (name) VALUES ${placeholders}`;
        try {
            await this.db.runAsync(query, newTags);
            this.logger.debug(`Ensured tags exist: ${trimmedTags.join(', ')} (${newTags.length} new)`);
        }
        catch (error) {
            this.logger.error('Error ensuring tags exist:', { error, tags: trimmedTags });
            throw new Error(`Failed to ensure tags exist: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
