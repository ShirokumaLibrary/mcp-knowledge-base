/**
 * @ai-context Repository for tag management using base repository
 * @ai-pattern Extends BaseRepository with tag-specific operations
 * @ai-critical Tags use name as primary key, not numeric ID
 * @ai-lifecycle Tags auto-created when referenced by entities
 * @ai-assumption Tag names are case-sensitive and unique
 */
import { BaseRepository } from './base-repository.js';
export class TagRepositoryV2 extends BaseRepository {
    constructor(db) {
        super(db, 'tags', 'TagRepository');
    }
    /**
     * @ai-intent Get next ID - not applicable for tags
     * @ai-pattern Tags use name as ID
     * @ai-critical Should not be called
     */
    async getNextId(type) {
        // Tags don't use numeric IDs, but satisfy base class contract
        throw new Error('Tags do not use generated IDs - name is the ID');
    }
    /**
     * @ai-intent Map database row to Tag entity
     * @ai-pattern Simple mapping as fields match
     */
    mapRowToEntity(row) {
        return {
            id: String(row.name), // @ai-critical: Name is the ID
            name: String(row.name),
            created_at: String(row.created_at),
            updated_at: row.updated_at ? String(row.updated_at) : String(row.created_at)
        };
    }
    /**
     * @ai-intent Map Tag entity to database row
     * @ai-pattern Handles name as primary key
     */
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
    /**
     * @ai-intent Override findById to use name
     * @ai-pattern Tags use name as primary key
     */
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
    /**
     * @ai-intent Get all tags with usage counts
     * @ai-flow 1. Count usage across tables -> 2. Return with statistics
     * @ai-performance Uses SQL aggregation for efficiency
     * @ai-return Array of tags with usage counts
     */
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
    /**
     * @ai-intent Create new tag
     * @ai-flow Custom insert for name as primary key
     * @ai-validation Tag name must be unique
     * @ai-side-effects Creates tag in tags table only
     */
    async createTag(name) {
        const now = new Date().toISOString();
        await this.db.runAsync('INSERT INTO tags (name, created_at, updated_at) VALUES (?, ?, ?)', [name, now, now]);
        return {
            name,
            createdAt: now
        };
    }
    /**
     * @ai-intent Delete tag by name
     * @ai-flow Override to use name as ID
     * @ai-side-effects Removes from tags and all relationship tables
     * @ai-return true if deleted, false if not found
     */
    async deleteTag(name) {
        return this.transaction(async () => {
            // @ai-logic: Delete from relationship tables first
            await this.db.runAsync('DELETE FROM issue_tags WHERE tag_name = ?', [name]);
            await this.db.runAsync('DELETE FROM plan_tags WHERE tag_name = ?', [name]);
            await this.db.runAsync('DELETE FROM knowledge_tags WHERE tag_name = ?', [name]);
            await this.db.runAsync('DELETE FROM doc_tags WHERE tag_name = ?', [name]);
            await this.db.runAsync('DELETE FROM session_tags WHERE tag_name = ?', [name]);
            await this.db.runAsync('DELETE FROM summary_tags WHERE tag_name = ?', [name]);
            // @ai-logic: Delete the tag itself
            const result = await this.db.runAsync('DELETE FROM tags WHERE name = ?', [name]);
            return result.changes > 0;
        });
    }
    /**
     * @ai-intent Search tags by name pattern
     * @ai-flow Uses LIKE for substring matching
     * @ai-pattern Case-insensitive search
     * @ai-return Matching tags with counts
     */
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
    /**
     * @ai-intent Ensure tags exist before foreign key reference
     * @ai-flow Insert missing tags with IGNORE for existing
     * @ai-critical Called before entity operations
     * @ai-side-effects Creates missing tags
     */
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
    /**
     * @ai-intent Save entity-tag relationships
     * @ai-flow 1. Delete existing -> 2. Insert new relationships
     * @ai-pattern Complete replacement strategy
     * @ai-side-effects Updates relationship tables
     */
    async saveEntityTags(entityType, entityId, tagNames) {
        await this.transaction(async () => {
            // @ai-logic: Ensure tags exist first
            await this.ensureTagsExist(tagNames);
            // @ai-logic: Delete existing relationships
            const deleteQuery = this.getDeleteQuery(entityType);
            await this.db.runAsync(deleteQuery, [entityId]);
            // @ai-logic: Insert new relationships
            if (tagNames.length > 0) {
                const insertQuery = this.getInsertQuery(entityType);
                for (const tagName of tagNames) {
                    await this.db.runAsync(insertQuery, [entityId, tagName]);
                }
            }
        });
    }
    /**
     * @ai-intent Get DELETE query for entity type
     * @ai-pattern Entity-specific relationship tables
     */
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
    /**
     * @ai-intent Get INSERT query for entity type
     * @ai-pattern Entity-specific relationship tables
     */
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
    /**
     * @ai-intent Auto-register tags for an entity
     * @ai-flow Wrapper around ensureTagsExist
     * @ai-usage Called by entity repositories on create/update
     */
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
//# sourceMappingURL=tag-repository-v2.js.map