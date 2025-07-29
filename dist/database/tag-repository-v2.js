import { BaseRepository } from './base-repository.js';
export class TagRepositoryV2 extends BaseRepository {
    constructor(db) {
        super(db, 'tags', 'TagRepository');
    }
    async getNextId(_type) {
        throw new Error('Tags do not use generated IDs - name is the ID');
    }
    mapRowToEntity(row) {
        return {
            id: String(row.name),
            name: String(row.name),
            created_at: String(row.created_at),
            updated_at: row.updated_at ? String(row.updated_at) : String(row.created_at)
        };
    }
    mapEntityToRow(entity) {
        const row = {};
        if (entity.name !== undefined) {
            row.name = entity.name;
        }
        if (entity.created_at !== undefined) {
            row.created_at = entity.created_at;
        }
        if (entity.updated_at !== undefined) {
            row.updated_at = entity.updated_at;
        }
        return row;
    }
    async findById(name) {
        try {
            const row = await this.db.getAsync('SELECT * FROM tags WHERE name = ?', [name]);
            if (!row) {
                return null;
            }
            return this.mapRowToEntity(row);
        }
        catch (error) {
            this.logger.error('Failed to find tag by name', { error, name });
            throw error;
        }
    }
    async getTags() {
        const query = `
      SELECT 
        t.name,
        t.created_at,
        (
          SELECT COUNT(DISTINCT entity_type || '-' || entity_id)
          FROM (
            SELECT 'issue' as entity_type, issue_id as entity_id FROM issue_tags WHERE tag_name = t.name
            UNION ALL
            SELECT 'plan', plan_id FROM plan_tags WHERE tag_name = t.name
            UNION ALL
            SELECT 'knowledge', knowledge_id FROM knowledge_tags WHERE tag_name = t.name
            UNION ALL
            SELECT 'doc', doc_id FROM doc_tags WHERE tag_name = t.name
            UNION ALL
            SELECT 'session', session_id FROM session_tags WHERE tag_name = t.name
            UNION ALL
            SELECT 'summary', summary_date FROM summary_tags WHERE tag_name = t.name
          )
        ) as count
      FROM tags t
      ORDER BY t.name
    `;
        const rows = await this.executeQuery(query);
        return rows.map(row => ({
            name: String(row.name),
            createdAt: String(row.created_at),
            count: Number(row.count) || 0
        }));
    }
    async createTag(name) {
        const now = new Date().toISOString();
        await this.db.runAsync('INSERT INTO tags (name, created_at, updated_at) VALUES (?, ?, ?)', [name, now, now]);
        return {
            name,
            createdAt: now
        };
    }
    async deleteTag(name) {
        return this.transaction(async () => {
            await this.db.runAsync('DELETE FROM issue_tags WHERE tag_name = ?', [name]);
            await this.db.runAsync('DELETE FROM plan_tags WHERE tag_name = ?', [name]);
            await this.db.runAsync('DELETE FROM knowledge_tags WHERE tag_name = ?', [name]);
            await this.db.runAsync('DELETE FROM doc_tags WHERE tag_name = ?', [name]);
            await this.db.runAsync('DELETE FROM session_tags WHERE tag_name = ?', [name]);
            await this.db.runAsync('DELETE FROM summary_tags WHERE tag_name = ?', [name]);
            const result = await this.db.runAsync('DELETE FROM tags WHERE name = ?', [name]);
            return result.changes > 0;
        });
    }
    async getTagsByPattern(pattern) {
        const query = `
      SELECT 
        t.name,
        t.created_at,
        (
          SELECT COUNT(DISTINCT entity_type || '-' || entity_id)
          FROM (
            SELECT 'issue' as entity_type, issue_id as entity_id FROM issue_tags WHERE tag_name = t.name
            UNION ALL
            SELECT 'plan', plan_id FROM plan_tags WHERE tag_name = t.name
            UNION ALL
            SELECT 'knowledge', knowledge_id FROM knowledge_tags WHERE tag_name = t.name
            UNION ALL
            SELECT 'doc', doc_id FROM doc_tags WHERE tag_name = t.name
            UNION ALL
            SELECT 'session', session_id FROM session_tags WHERE tag_name = t.name
            UNION ALL
            SELECT 'summary', summary_date FROM summary_tags WHERE tag_name = t.name
          )
        ) as count
      FROM tags t
      WHERE LOWER(t.name) LIKE LOWER(?)
      ORDER BY t.name
    `;
        const rows = await this.executeQuery(query, [`%${pattern}%`]);
        return rows.map(row => ({
            name: String(row.name),
            createdAt: String(row.created_at),
            count: Number(row.count) || 0
        }));
    }
    async ensureTagsExist(tagNames) {
        if (!tagNames || tagNames.length === 0) {
            return;
        }
        const now = new Date().toISOString();
        await this.transaction(async () => {
            for (const tagName of tagNames) {
                await this.db.runAsync('INSERT OR IGNORE INTO tags (name, created_at, updated_at) VALUES (?, ?, ?)', [tagName, now, now]);
            }
        });
    }
    async saveEntityTags(entityType, entityId, tagNames) {
        await this.transaction(async () => {
            await this.ensureTagsExist(tagNames);
            const deleteQuery = this.getDeleteQuery(entityType);
            await this.db.runAsync(deleteQuery, [entityId]);
            if (tagNames.length > 0) {
                const insertQuery = this.getInsertQuery(entityType);
                for (const tagName of tagNames) {
                    await this.db.runAsync(insertQuery, [entityId, tagName]);
                }
            }
        });
    }
    getDeleteQuery(entityType) {
        const queries = {
            issue: 'DELETE FROM issue_tags WHERE issue_id = ?',
            plan: 'DELETE FROM plan_tags WHERE plan_id = ?',
            knowledge: 'DELETE FROM knowledge_tags WHERE knowledge_id = ?',
            doc: 'DELETE FROM doc_tags WHERE doc_id = ?',
            session: 'DELETE FROM session_tags WHERE session_id = ?',
            summary: 'DELETE FROM summary_tags WHERE summary_date = ?'
        };
        return queries[entityType] || '';
    }
    getInsertQuery(entityType) {
        const queries = {
            issue: 'INSERT INTO issue_tags (issue_id, tag_name) VALUES (?, ?)',
            plan: 'INSERT INTO plan_tags (plan_id, tag_name) VALUES (?, ?)',
            knowledge: 'INSERT INTO knowledge_tags (knowledge_id, tag_name) VALUES (?, ?)',
            doc: 'INSERT INTO doc_tags (doc_id, tag_name) VALUES (?, ?)',
            session: 'INSERT INTO session_tags (session_id, tag_name) VALUES (?, ?)',
            summary: 'INSERT INTO summary_tags (summary_date, tag_name) VALUES (?, ?)'
        };
        return queries[entityType] || '';
    }
    async autoRegisterTags(tags) {
        if (!tags || tags.length === 0) {
            return;
        }
        try {
            await this.ensureTagsExist(tags);
        }
        catch (error) {
            this.logger.error('Error ensuring tags exist', { error, tags });
            throw error;
        }
    }
}
