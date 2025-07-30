import { BaseRepository } from './base-repository.js';
import { RelatedItemsHelper } from '../types/unified-types.js';
import { StatusRepository } from './status-repository.js';
import { TagRepository } from './tag-repository.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { glob } from 'glob';
export class ItemRepository extends BaseRepository {
    statusRepository;
    tagRepository;
    dataDir;
    knownTypes;
    constructor(db, dataDir, statusRepository, tagRepository) {
        super(db, 'ItemRepository', 'items');
        this.dataDir = dataDir;
        this.statusRepository = statusRepository || new StatusRepository(db);
        this.tagRepository = tagRepository || new TagRepository(db);
        this.knownTypes = new Map([
            ['issues', { type: 'issues', baseType: 'tasks' }],
            ['plans', { type: 'plans', baseType: 'tasks' }],
            ['bugs', { type: 'bugs', baseType: 'tasks' }],
            ['docs', { type: 'docs', baseType: 'documents' }],
            ['knowledge', { type: 'knowledge', baseType: 'documents' }],
            ['recipe', { type: 'recipe', baseType: 'documents' }],
            ['tutorial', { type: 'tutorial', baseType: 'documents' }],
            ['sessions', { type: 'sessions', baseType: 'sessions' }],
            ['dailies', { type: 'dailies', baseType: 'dailies' }]
        ]);
    }
    async getType(typeName) {
        if (this.knownTypes.has(typeName)) {
            return this.knownTypes.get(typeName);
        }
        const row = await this.db.getAsync('SELECT type, base_type FROM sequences WHERE type = ?', [typeName]);
        if (row) {
            const typeDef = { type: String(row.type), baseType: String(row.base_type) };
            this.knownTypes.set(typeName, typeDef);
            return typeDef;
        }
        return null;
    }
    mapRowToEntity(row) {
        const tags = row.tags ? JSON.parse(String(row.tags)) : [];
        const related = row.related ? JSON.parse(String(row.related)) : [];
        const item = {
            id: String(row.id),
            type: row.type,
            title: row.title,
            description: row.description || undefined,
            content: row.content || '',
            priority: row.priority || 'medium',
            status_id: row.status_id || 1,
            start_date: row.start_date,
            end_date: row.end_date,
            start_time: row.start_time,
            tags,
            related,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
        return item;
    }
    mapEntityToRow(entity) {
        return {
            type: entity.type,
            id: entity.id,
            title: entity.title,
            description: entity.description || null,
            content: entity.content,
            priority: entity.priority,
            status_id: entity.status_id,
            start_date: entity.start_date,
            end_date: entity.end_date,
            start_time: entity.start_time,
            tags: JSON.stringify(entity.tags),
            related: JSON.stringify(entity.related),
            created_at: entity.created_at,
            updated_at: entity.updated_at
        };
    }
    async createItem(params) {
        const { type, ...data } = params;
        const typeDef = await this.getType(type);
        if (!typeDef) {
            throw new Error(`Unknown type: '${type}'. Use the 'get_types' tool to see all available types and their descriptions.`);
        }
        let id;
        if (type === 'sessions') {
            id = data.id || this.generateSessionId();
        }
        else if (type === 'dailies') {
            id = data.start_date || new Date().toISOString().split('T')[0];
            const existing = await this.getById(type, id);
            if (existing) {
                throw new Error(`Daily summary already exists for date: ${id}. Use 'update_item' to modify the existing summary, or 'get_item_detail' with type='dailies' and id='${id}' to view it.`);
            }
        }
        else {
            const numId = await this.getNextId(type);
            id = numId.toString();
        }
        let statusId = 1;
        if (data.status) {
            const status = await this.statusRepository.getStatusByName(data.status);
            if (!status) {
                throw new Error(`Unknown status: '${data.status}'. Use the 'get_statuses' tool to see all available statuses.`);
            }
            statusId = status.id;
        }
        const priority = data.priority || 'medium';
        const now = new Date().toISOString();
        let startDate = data.start_date || null;
        let startTime = data.start_time || null;
        if (type === 'sessions') {
            startDate = id.split('-').slice(0, 3).join('-');
            startTime = id.split('-').slice(3).join(':').replace(/\./g, ':');
        }
        else if (type === 'dailies') {
            startDate = id;
        }
        const item = {
            id,
            type,
            title: data.title,
            description: data.description || undefined,
            content: data.content || '',
            priority,
            status_id: statusId,
            start_date: startDate,
            end_date: data.end_date || null,
            start_time: startTime,
            tags: data.tags || [],
            related: data.related || [],
            created_at: now,
            updated_at: now
        };
        await this.saveToMarkdown(item);
        await this.syncToDatabase(item);
        if (item.tags.length > 0) {
            await this.tagRepository.registerTags(item.tags);
        }
        return item;
    }
    async getById(type, id) {
        const filePath = this.getFilePath(type, id);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const { metadata, content: bodyContent } = parseMarkdown(content);
            if (!metadata.id) {
                return null;
            }
            const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
            const related = Array.isArray(metadata.related) ? metadata.related :
                (Array.isArray(metadata.related_tasks) && Array.isArray(metadata.related_documents) ?
                    [...metadata.related_tasks, ...metadata.related_documents] : []);
            let statusId = metadata.status_id;
            if (!statusId && metadata.status) {
                const status = await this.statusRepository.getStatusByName(metadata.status);
                statusId = status?.id || 1;
            }
            let item;
            if (type === 'sessions' || type === 'dailies') {
                item = {
                    id: String(metadata.id),
                    type,
                    title: metadata.title,
                    description: metadata.description || undefined,
                    content: bodyContent,
                    priority: metadata.priority || 'medium',
                    status_id: statusId || 1,
                    start_date: metadata.start_date || metadata.date || new Date().toISOString().split('T')[0],
                    end_date: null,
                    start_time: type === 'sessions' ? (metadata.start_time || null) : null,
                    tags,
                    related,
                    created_at: metadata.created_at || new Date().toISOString(),
                    updated_at: metadata.updated_at || new Date().toISOString()
                };
            }
            else {
                item = {
                    id: String(metadata.id),
                    type,
                    title: metadata.title,
                    description: metadata.description || undefined,
                    content: bodyContent,
                    priority: metadata.priority || 'medium',
                    status_id: statusId || 1,
                    start_date: metadata.start_date || metadata.date || null,
                    end_date: metadata.end_date || null,
                    start_time: null,
                    tags,
                    related,
                    created_at: metadata.created_at || new Date().toISOString(),
                    updated_at: metadata.updated_at || new Date().toISOString()
                };
            }
            return item;
        }
        catch {
            return null;
        }
    }
    async update(type, id, params) {
        const existing = await this.getById(type, id);
        if (!existing) {
            return null;
        }
        let statusId = existing.status_id;
        if (params.status) {
            const status = await this.statusRepository.getStatusByName(params.status);
            if (!status) {
                throw new Error(`Unknown status: '${params.status}'. Use the 'get_statuses' tool to see all available statuses.`);
            }
            statusId = status.id;
        }
        const updated = {
            ...existing,
            title: params.title ?? existing.title,
            description: params.description !== undefined ? params.description : existing.description,
            content: params.content ?? existing.content,
            priority: params.priority ?? existing.priority,
            status_id: statusId,
            start_date: params.start_date !== undefined ? params.start_date : existing.start_date,
            end_date: params.end_date !== undefined ? params.end_date : existing.end_date,
            start_time: params.start_time ?? existing.start_time,
            tags: params.tags ?? existing.tags,
            related: params.related ?? existing.related,
            updated_at: new Date().toISOString()
        };
        await this.saveToMarkdown(updated);
        await this.syncToDatabase(updated);
        if (params.tags) {
            await this.tagRepository.registerTags(params.tags);
        }
        return updated;
    }
    async delete(type, id) {
        const filePath = this.getFilePath(type, id);
        try {
            await fs.unlink(filePath);
            await this.db.runAsync('DELETE FROM items WHERE type = ? AND id = ?', [type, id]);
            await this.db.runAsync('DELETE FROM related_items WHERE (source_type = ? AND source_id = ?) OR (target_type = ? AND target_id = ?)', [type, id, type, id]);
            await this.db.runAsync('DELETE FROM item_tags WHERE item_type = ? AND item_id = ?', [type, id]);
            return true;
        }
        catch {
            return false;
        }
    }
    async search(params) {
        let query = 'SELECT DISTINCT i.* FROM items i';
        const joins = [];
        const conditions = [];
        const values = [];
        if (params.type) {
            conditions.push('i.type = ?');
            values.push(params.type);
        }
        else if (params.types && params.types.length > 0) {
            conditions.push(`i.type IN (${params.types.map(() => '?').join(',')})`);
            values.push(...params.types);
        }
        if (params.query) {
            joins.push('JOIN items_fts ON items_fts.rowid = i.rowid');
            conditions.push('items_fts MATCH ?');
            values.push(params.query);
        }
        if (params.tags && params.tags.length > 0) {
            for (let i = 0; i < params.tags.length; i++) {
                const tag = params.tags[i];
                const tagAlias = `t${i}`;
                const tagId = await this.tagRepository.getTagIdByName(tag);
                if (tagId) {
                    joins.push(`JOIN item_tags ${tagAlias} ON ${tagAlias}.item_type = i.type AND ${tagAlias}.item_id = i.id`);
                    conditions.push(`${tagAlias}.tag_id = ?`);
                    values.push(tagId);
                }
            }
        }
        if (params.status) {
            const status = await this.statusRepository.getStatusByName(params.status);
            if (status) {
                conditions.push('i.status_id = ?');
                values.push(status.id);
            }
        }
        else if (!params.includeClosedStatuses) {
            const closedStatuses = await this.statusRepository.getClosedStatusIds();
            if (closedStatuses.length > 0) {
                conditions.push(`i.status_id NOT IN (${closedStatuses.map(() => '?').join(',')})`);
                values.push(...closedStatuses);
            }
        }
        if (params.priority) {
            conditions.push('i.priority = ?');
            values.push(params.priority);
        }
        if (params.startDate) {
            conditions.push('i.start_date >= ?');
            values.push(params.startDate);
        }
        if (params.endDate) {
            conditions.push('i.start_date <= ?');
            values.push(params.endDate);
        }
        if (joins.length > 0) {
            query += ' ' + joins.join(' ');
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY i.created_at DESC';
        if (params.limit) {
            query += ' LIMIT ?';
            values.push(params.limit);
            if (params.offset) {
                query += ' OFFSET ?';
                values.push(params.offset);
            }
        }
        const rows = await this.db.allAsync(query, values);
        const items = [];
        for (const row of rows) {
            const item = await this.getById(String(row.type), String(row.id));
            if (item) {
                items.push(item);
            }
        }
        return items;
    }
    async getAllByType(type) {
        const dir = this.getTypeDirectory(type);
        try {
            await fs.access(dir);
        }
        catch {
            return [];
        }
        const pattern = path.join(dir, `${type}-*.md`);
        const files = await glob(pattern);
        const items = [];
        for (const file of files) {
            const filename = path.basename(file);
            const match = filename.match(new RegExp(`${type}-(.*)\\.md$`));
            if (match) {
                const id = match[1];
                const item = await this.getById(type, id);
                if (item) {
                    items.push(item);
                }
            }
        }
        return items;
    }
    generateSessionId() {
        const now = new Date();
        const pad = (n, width) => n.toString().padStart(width, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}-` +
            `${pad(now.getHours(), 2)}.${pad(now.getMinutes(), 2)}.${pad(now.getSeconds(), 2)}.` +
            `${pad(now.getMilliseconds(), 3)}`;
    }
    getTypeDirectory(type) {
        if (type === 'sessions') {
            return path.join(this.dataDir, 'sessions');
        }
        return path.join(this.dataDir, type);
    }
    getFilePath(type, id) {
        const idStr = String(id);
        if (idStr.includes('..') || idStr.includes('/') || idStr.includes('\\') ||
            idStr.includes('\0') || idStr.includes('%') || idStr === '.' ||
            path.isAbsolute(idStr)) {
            throw new Error(`Invalid ID format: ${idStr}`);
        }
        if (!/^[a-zA-Z0-9\-_.]+$/.test(idStr)) {
            throw new Error(`Invalid ID format: ${idStr}`);
        }
        if (type === 'sessions') {
            const dateMatch = id.match(/^(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                const date = dateMatch[1];
                return path.join(this.dataDir, 'sessions', date, `sessions-${id}.md`);
            }
        }
        else if (type === 'dailies') {
            return path.join(this.dataDir, 'sessions', id, `dailies-${id}.md`);
        }
        const dir = this.getTypeDirectory(type);
        return path.join(dir, `${type}-${id}.md`);
    }
    async saveToMarkdown(item) {
        const filePath = this.getFilePath(item.type, item.id);
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        const status = await this.statusRepository.getStatusById(item.status_id);
        const statusName = status?.name || 'Open';
        const metadata = {
            id: item.type === 'sessions' || item.type === 'dailies' ? item.id : parseInt(item.id),
            title: item.title,
            priority: item.priority,
            status: statusName,
            tags: item.tags,
            related: item.related,
            created_at: item.created_at,
            updated_at: item.updated_at
        };
        if (item.description) {
            metadata.description = item.description;
        }
        if (item.start_date) {
            metadata.start_date = item.start_date;
        }
        if (item.end_date) {
            metadata.end_date = item.end_date;
        }
        if (item.start_time) {
            metadata.start_time = item.start_time;
        }
        const markdown = generateMarkdown(metadata, item.content);
        await fs.writeFile(filePath, markdown, 'utf8');
    }
    async searchByTag(tag) {
        const sql = `
      SELECT DISTINCT item_type as type, item_id as id
      FROM item_tags it
      JOIN tags t ON t.id = it.tag_id
      WHERE t.name = ?
    `;
        const rows = await this.db.allAsync(sql, [tag]);
        const items = [];
        for (const row of rows) {
            const item = await this.getById(String(row.type), String(row.id));
            if (item) {
                items.push(item);
            }
        }
        return items;
    }
    async syncToDatabase(item) {
        const tagsJson = JSON.stringify(item.tags);
        const relatedJson = JSON.stringify(item.related);
        await this.db.runAsync(`
      INSERT OR REPLACE INTO items 
      (type, id, title, description, content, priority, status_id, 
       start_date, end_date, start_time, tags, related, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            item.type,
            item.id,
            item.title,
            item.description || null,
            item.content,
            item.priority,
            item.status_id,
            item.start_date,
            item.end_date,
            item.start_time,
            tagsJson,
            relatedJson,
            item.created_at,
            item.updated_at
        ]);
        await this.db.runAsync(`
      INSERT OR REPLACE INTO items_fts 
      (rowid, type, title, description, content, tags)
      VALUES (
        (SELECT rowid FROM items WHERE type = ? AND id = ?),
        ?, ?, ?, ?, ?
      )
    `, [
            item.type, item.id,
            item.type, item.title, item.description || '', item.content, tagsJson
        ]);
        await this.db.runAsync('DELETE FROM item_tags WHERE item_type = ? AND item_id = ?', [item.type, item.id]);
        for (const tagName of item.tags) {
            const tagId = await this.tagRepository.getTagIdByName(tagName);
            if (tagId) {
                await this.db.runAsync('INSERT INTO item_tags (item_type, item_id, tag_id) VALUES (?, ?, ?)', [item.type, item.id, tagId]);
            }
        }
        await this.db.runAsync('DELETE FROM related_items WHERE source_type = ? AND source_id = ?', [item.type, item.id]);
        for (const related of item.related) {
            const { type: targetType, id: targetId } = RelatedItemsHelper.parse(related);
            await this.db.runAsync('INSERT INTO related_items (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)', [item.type, item.id, targetType, targetId]);
        }
    }
    async changeItemType(fromType, fromId, toType) {
        this.logger.info(`Changing type from ${fromType}-${fromId} to ${toType}`);
        try {
            const fromTypeDef = await this.getType(fromType);
            const toTypeDef = await this.getType(toType);
            if (!fromTypeDef || !toTypeDef) {
                return { success: false, error: 'Invalid type specified' };
            }
            if (fromTypeDef.baseType !== toTypeDef.baseType) {
                return {
                    success: false,
                    error: `Cannot change between different base types: ${fromTypeDef.baseType} → ${toTypeDef.baseType}`
                };
            }
            if (['sessions', 'dailies'].includes(fromType) || ['sessions', 'dailies'].includes(toType)) {
                return { success: false, error: 'Sessions and dailies cannot be type-changed' };
            }
            const originalItem = await this.getById(fromType, String(fromId));
            if (!originalItem) {
                return { success: false, error: 'Item not found' };
            }
            const newItem = await this.createItem({
                type: toType,
                title: originalItem.title,
                description: originalItem.description,
                content: originalItem.content || '',
                priority: originalItem.priority,
                status: originalItem.status,
                tags: originalItem.tags,
                start_date: originalItem.start_date || undefined,
                end_date: originalItem.end_date || undefined,
                related_tasks: originalItem.related_tasks,
                related_documents: originalItem.related_documents
            });
            const oldReference = `${fromType}-${fromId}`;
            const newReference = `${toType}-${newItem.id}`;
            let relatedUpdates = 0;
            const relatedRows = await this.db.allAsync(`
        SELECT DISTINCT type, id 
        FROM items 
        WHERE related LIKE ?
      `, [`%"${oldReference}"%`]);
            for (const row of relatedRows) {
                const item = await this.getById(String(row.type), String(row.id));
                if (item) {
                    const updatedRelated = item.related.map((ref) => ref === oldReference ? newReference : ref);
                    await this.update(String(row.type), String(row.id), {
                        type: String(row.type),
                        id: String(row.id),
                        related: updatedRelated
                    });
                    relatedUpdates++;
                }
            }
            await this.delete(fromType, String(fromId));
            return {
                success: true,
                newId: Number(newItem.id),
                relatedUpdates
            };
        }
        catch (error) {
            this.logger.error('Failed to change item type', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
