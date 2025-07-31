import { TypeRepository } from '../database/type-repository.js';
import { createLogger } from '../utils/logger.js';
import { cleanString } from '../utils/string-utils.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { UnifiedStorage, STORAGE_CONFIGS } from '../storage/unified-storage.js';
export class ItemRepository {
    db;
    statusRepo;
    tagRepo;
    fileDb;
    storage;
    logger = createLogger('ItemRepository');
    constructor(db, dataDir, statusRepo, tagRepo, fileDb) {
        this.db = db;
        this.statusRepo = statusRepo;
        this.tagRepo = tagRepo;
        this.fileDb = fileDb;
        this.storage = new UnifiedStorage(dataDir);
    }
    getStorageConfig(type) {
        if (type in STORAGE_CONFIGS) {
            return STORAGE_CONFIGS[type];
        }
        return {
            baseDir: type,
            filePrefix: `${type}-`,
            useDateSubdir: false
        };
    }
    async itemToStorageItem(item) {
        const typeRepo = new TypeRepository(this.fileDb);
        await typeRepo.init();
        const fieldDefs = await typeRepo.getFieldsForType(item.type);
        const metadata = {};
        if (item.type !== 'sessions' && item.type !== 'dailies') {
            const typeInfo = await this.db.getAsync('SELECT base_type FROM sequences WHERE type = ?', [item.type]);
            if (typeInfo?.base_type) {
                metadata.base = typeInfo.base_type;
            }
        }
        for (const fieldDef of fieldDefs) {
            const fieldName = fieldDef.field_name;
            let value;
            switch (fieldName) {
                case 'id':
                    value = parseInt(item.id) || item.id;
                    break;
                case 'title':
                    value = item.title;
                    break;
                case 'description':
                    value = item.description || fieldDef.default_value;
                    break;
                case 'content':
                    continue;
                case 'priority':
                    value = item.priority || fieldDef.default_value;
                    break;
                case 'status':
                    value = item.status || fieldDef.default_value;
                    break;
                case 'status_id':
                    value = item.status_id;
                    break;
                case 'tags':
                    value = item.tags || JSON.parse(fieldDef.default_value || '[]');
                    break;
                case 'start_date':
                    value = item.start_date || fieldDef.default_value;
                    break;
                case 'end_date':
                    value = item.end_date || fieldDef.default_value;
                    break;
                case 'start_time':
                    value = item.start_time || fieldDef.default_value;
                    break;
                case 'related':
                    value = item.related || JSON.parse(fieldDef.default_value || '[]');
                    break;
                case 'related_tasks':
                    value = item.related_tasks || JSON.parse(fieldDef.default_value || '[]');
                    break;
                case 'related_documents':
                    value = item.related_documents || JSON.parse(fieldDef.default_value || '[]');
                    break;
                case 'created_at':
                    value = item.created_at;
                    break;
                case 'updated_at':
                    value = item.updated_at;
                    break;
                case 'category':
                    if (item.type === 'sessions' && 'category' in item && item.category) {
                        value = item.category;
                    }
                    else {
                        value = fieldDef.default_value;
                    }
                    break;
                default:
                    value = fieldDef.default_value;
            }
            metadata[fieldName] = value;
        }
        return {
            id: item.id,
            metadata,
            content: item.content
        };
    }
    async storageItemToUnifiedItem(item, type, statusName) {
        const metadata = item.metadata;
        const related = (Array.isArray(metadata.related) ? metadata.related : []);
        const related_tasks = (Array.isArray(metadata.related_tasks) ? metadata.related_tasks : related.filter((r) => r.match(/^(issues|plans)-/)));
        const related_documents = (Array.isArray(metadata.related_documents) ? metadata.related_documents : related.filter((r) => r.match(/^(docs|knowledge)-/)));
        const statuses = await this.statusRepo.getAllStatuses();
        let statusId = Number(metadata.status_id || 1);
        if (!statusName) {
            if (metadata.status_id) {
                const status = statuses.find(s => s.id === Number(metadata.status_id));
                statusName = status?.name || 'Open';
            }
            else if (metadata.status) {
                const status = statuses.find(s => s.name === String(metadata.status));
                if (status) {
                    statusName = status.name;
                    statusId = status.id;
                }
                else {
                    statusName = String(metadata.status);
                }
            }
            else {
                statusName = 'Open';
            }
        }
        const unifiedItem = {
            id: item.id,
            type,
            title: String(metadata.title || ''),
            description: metadata.description ? String(metadata.description) : undefined,
            content: item.content,
            priority: (metadata.priority === 'high' || metadata.priority === 'medium' || metadata.priority === 'low' ? metadata.priority : 'medium'),
            status: statusName,
            status_id: Number(statusId),
            start_date: metadata.start_date ? String(metadata.start_date) : null,
            end_date: metadata.end_date ? String(metadata.end_date) : null,
            start_time: metadata.start_time ? String(metadata.start_time) : null,
            tags: Array.isArray(metadata.tags) ? metadata.tags.map(t => String(t)) : [],
            related,
            related_tasks,
            related_documents,
            created_at: String(metadata.created_at || new Date().toISOString()),
            updated_at: String(metadata.updated_at || metadata.created_at || new Date().toISOString())
        };
        if (type === 'sessions' || type === 'dailies') {
            unifiedItem.date = metadata.start_date || null;
        }
        return unifiedItem;
    }
    async getNextId(type) {
        await this.db.runAsync('UPDATE sequences SET current_value = current_value + 1 WHERE type = ?', [type]);
        const row = await this.db.getAsync('SELECT current_value FROM sequences WHERE type = ?', [type]);
        return row.current_value;
    }
    async createItem(params) {
        const { type } = params;
        let typeInfo;
        if (type === 'sessions') {
            typeInfo = { base_type: 'sessions' };
        }
        else if (type === 'dailies') {
            typeInfo = { base_type: 'documents' };
        }
        else {
            typeInfo = await this.db.getAsync('SELECT base_type FROM sequences WHERE type = ?', [type]);
        }
        if (!typeInfo) {
            throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${type}`);
        }
        if (typeInfo.base_type === 'tasks' && !params.content) {
            throw new McpError(ErrorCode.InvalidRequest, `Content is required for ${type}`);
        }
        const cleanedTitle = cleanString(params.title);
        if (cleanedTitle.length === 0) {
            throw new McpError(ErrorCode.InvalidRequest, 'Title cannot be empty');
        }
        if (cleanedTitle.length > 500) {
            throw new McpError(ErrorCode.InvalidRequest, 'Title must be 500 characters or less');
        }
        const validateDate = (dateStr, fieldName) => {
            if (!dateStr) {
                return;
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                throw new McpError(ErrorCode.InvalidRequest, `Invalid ${fieldName} format. Date must be in YYYY-MM-DD format`);
            }
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year ||
                date.getMonth() !== month - 1 ||
                date.getDate() !== day) {
                throw new McpError(ErrorCode.InvalidRequest, `Invalid date: ${dateStr}`);
            }
        };
        validateDate(params.start_date || undefined, 'start_date');
        validateDate(params.end_date || undefined, 'end_date');
        let id;
        let createdAt;
        let startDate = null;
        const now = new Date();
        const nowISOString = now.toISOString();
        if (type === 'sessions') {
            if (params.datetime) {
                const sessionDate = new Date(params.datetime);
                if (isNaN(sessionDate.getTime())) {
                    throw new McpError(ErrorCode.InvalidRequest, 'Invalid datetime format');
                }
                createdAt = sessionDate.toISOString();
                startDate = createdAt.split('T')[0];
            }
            else {
                createdAt = nowISOString;
                startDate = nowISOString.split('T')[0];
            }
            if (params.id) {
                id = params.id;
            }
            else {
                const dateObj = params.datetime ? new Date(params.datetime) : now;
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                const hours = String(dateObj.getHours()).padStart(2, '0');
                const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                const seconds = String(dateObj.getSeconds()).padStart(2, '0');
                const milliseconds = String(dateObj.getMilliseconds()).padStart(3, '0');
                id = `${year}-${month}-${day}-${hours}.${minutes}.${seconds}.${milliseconds}`;
            }
        }
        else if (type === 'dailies') {
            if (params.date) {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
                    throw new McpError(ErrorCode.InvalidRequest, 'Invalid date format. Date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = params.date.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                if (date.getFullYear() !== year ||
                    date.getMonth() !== month - 1 ||
                    date.getDate() !== day) {
                    throw new McpError(ErrorCode.InvalidRequest, `Invalid date: ${params.date}`);
                }
                id = params.date;
                startDate = params.date;
                createdAt = params.date + 'T00:00:00.000Z';
            }
            else {
                id = nowISOString.split('T')[0];
                startDate = id;
                createdAt = nowISOString;
            }
            const config = this.getStorageConfig(type);
            const exists = await this.storage.exists(config, id);
            if (exists) {
                throw new McpError(ErrorCode.InvalidRequest, `Daily summary for ${id} already exists. Use update instead.`);
            }
        }
        else {
            const numId = await this.getNextId(type);
            id = String(numId);
            createdAt = nowISOString;
        }
        const statusName = params.status || 'Open';
        const statuses = await this.statusRepo.getAllStatuses();
        const status = statuses.find(s => s.name === statusName);
        if (!status) {
            throw new McpError(ErrorCode.InvalidRequest, `Invalid status: ${statusName}`);
        }
        const validateRelatedArray = (arr, fieldName) => {
            if (arr && arr.some(item => item === '')) {
                throw new McpError(ErrorCode.InvalidRequest, `Related items cannot contain empty strings in ${fieldName}. Use format like ["issues-1", "plans-2"] with valid type-id references.`);
            }
        };
        validateRelatedArray(params.related_tasks, 'related_tasks');
        validateRelatedArray(params.related_documents, 'related_documents');
        validateRelatedArray(params.related, 'related');
        const uniqueRelatedTasks = params.related_tasks ? [...new Set(params.related_tasks)] : [];
        const uniqueRelatedDocuments = params.related_documents ? [...new Set(params.related_documents)] : [];
        const uniqueRelated = [...new Set([...uniqueRelatedTasks, ...uniqueRelatedDocuments])];
        const cleanedTags = (params.tags || [])
            .map(tag => cleanString(tag))
            .filter(tag => tag.length > 0);
        const item = {
            id: id,
            type,
            title: cleanedTitle,
            description: params.description,
            content: params.content || '',
            priority: params.priority || 'medium',
            status: statusName,
            status_id: status.id,
            start_date: startDate || params.start_date || null,
            end_date: params.end_date || null,
            start_time: null,
            tags: cleanedTags,
            related: uniqueRelated,
            related_tasks: uniqueRelatedTasks,
            related_documents: uniqueRelatedDocuments,
            created_at: createdAt,
            updated_at: createdAt
        };
        if (type === 'sessions' || type === 'dailies') {
            item.date = item.start_date;
        }
        const config = this.getStorageConfig(type);
        const storageItem = await this.itemToStorageItem(item);
        await this.storage.save(config, storageItem);
        await this.syncItemToSQLite(item);
        if (item.tags.length > 0) {
            await this.tagRepo.ensureTagsExist(item.tags);
        }
        this.logger.info(`Created ${type} ${id}`);
        return item;
    }
    async getItem(type, id) {
        let typeInfo;
        if (type === 'sessions') {
            typeInfo = { base_type: 'sessions' };
        }
        else if (type === 'dailies') {
            typeInfo = { base_type: 'documents' };
        }
        else {
            typeInfo = await this.db.getAsync('SELECT base_type FROM sequences WHERE type = ?', [type]);
        }
        if (!typeInfo) {
            throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${type}`);
        }
        const config = this.getStorageConfig(type);
        const storageItem = await this.storage.load(config, id);
        if (!storageItem) {
            return null;
        }
        const statuses = await this.statusRepo.getAllStatuses();
        const status = statuses.find(s => s.id === storageItem.metadata.status_id);
        return await this.storageItemToUnifiedItem(storageItem, type, status?.name);
    }
    async updateItem(params) {
        const { type, id } = params;
        const current = await this.getItem(type, id);
        if (!current) {
            return null;
        }
        let cleanedTitle;
        if (params.title !== undefined) {
            cleanedTitle = cleanString(params.title);
            if (cleanedTitle.length > 500) {
                throw new McpError(ErrorCode.InvalidRequest, 'Title must be 500 characters or less');
            }
        }
        const validateDate = (dateStr, fieldName) => {
            if (!dateStr) {
                return;
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                throw new McpError(ErrorCode.InvalidRequest, `Invalid ${fieldName} format. Date must be in YYYY-MM-DD format`);
            }
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year ||
                date.getMonth() !== month - 1 ||
                date.getDate() !== day) {
                throw new McpError(ErrorCode.InvalidRequest, `Invalid date: ${dateStr}`);
            }
        };
        validateDate(params.start_date || undefined, 'start_date');
        validateDate(params.end_date || undefined, 'end_date');
        const validateRelatedArray = (arr, fieldName) => {
            if (arr && arr.some(item => item === '')) {
                throw new McpError(ErrorCode.InvalidRequest, `Related items cannot contain empty strings in ${fieldName}. Use format like ["issues-1", "plans-2"] with valid type-id references.`);
            }
        };
        validateRelatedArray(params.related_tasks, 'related_tasks');
        validateRelatedArray(params.related_documents, 'related_documents');
        validateRelatedArray(params.related, 'related');
        const currentItemRef = `${type}-${id}`;
        const allRelated = [
            ...(params.related_tasks || []),
            ...(params.related_documents || []),
            ...(params.related || [])
        ];
        if (allRelated.includes(currentItemRef)) {
            throw new McpError(ErrorCode.InvalidRequest, 'Items cannot reference themselves');
        }
        const uniqueRelatedTasks = params.related_tasks !== undefined
            ? [...new Set(params.related_tasks)]
            : current.related_tasks;
        const uniqueRelatedDocuments = params.related_documents !== undefined
            ? [...new Set(params.related_documents)]
            : current.related_documents;
        const cleanedTags = params.tags !== undefined
            ? params.tags.map(tag => cleanString(tag)).filter(tag => tag.length > 0)
            : current.tags;
        const updated = {
            ...current,
            title: cleanedTitle !== undefined ? cleanedTitle : current.title,
            description: params.description !== undefined ? params.description : current.description,
            content: params.content !== undefined ? params.content : current.content,
            priority: params.priority !== undefined ? params.priority : current.priority,
            start_date: params.start_date !== undefined ? params.start_date : current.start_date,
            end_date: params.end_date !== undefined ? params.end_date : current.end_date,
            tags: cleanedTags,
            related_tasks: uniqueRelatedTasks,
            related_documents: uniqueRelatedDocuments,
            updated_at: new Date().toISOString()
        };
        if (params.status !== undefined) {
            const statuses = await this.statusRepo.getAllStatuses();
            const status = statuses.find(s => s.name === params.status);
            if (!status) {
                throw new McpError(ErrorCode.InvalidRequest, `Invalid status: ${params.status}`);
            }
            updated.status = params.status;
            updated.status_id = status.id;
        }
        updated.related = [
            ...(updated.related_tasks || []),
            ...(updated.related_documents || [])
        ];
        const config = this.getStorageConfig(type);
        const storageItem = await this.itemToStorageItem(updated);
        await this.storage.save(config, storageItem);
        await this.syncItemToSQLite(updated);
        if (updated.tags.length > 0) {
            await this.tagRepo.ensureTagsExist(updated.tags);
        }
        this.logger.info(`Updated ${type} ${id}`);
        return updated;
    }
    async deleteItem(type, id) {
        const config = this.getStorageConfig(type);
        const deleted = await this.storage.delete(config, id);
        if (deleted) {
            const row = await this.db.getAsync('SELECT rowid FROM items WHERE type = ? AND id = ?', [type, id]);
            await this.db.runAsync('DELETE FROM items WHERE type = ? AND id = ?', [type, id]);
            if (row) {
                await this.db.runAsync('DELETE FROM items_fts WHERE rowid = ?', [row.rowid]);
            }
            this.logger.info(`Deleted ${type} ${id}`);
        }
        return deleted;
    }
    async getItems(type, includeClosedStatuses, statuses, startDate, endDate, limit) {
        let typeInfo;
        if (type === 'sessions') {
            typeInfo = { base_type: 'sessions' };
        }
        else if (type === 'dailies') {
            typeInfo = { base_type: 'documents' };
        }
        else {
            typeInfo = await this.db.getAsync('SELECT base_type FROM sequences WHERE type = ?', [type]);
        }
        if (!typeInfo) {
            throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${type}`);
        }
        let query = `
      SELECT i.type, i.id, i.title, i.description, i.priority, 
             i.tags, i.updated_at, s.name as status_name,
             i.start_date
      FROM items i
      LEFT JOIN statuses s ON i.status_id = s.id
      WHERE i.type = ?
    `;
        const params = [type];
        if (!includeClosedStatuses) {
            query += ' AND s.is_closed = 0';
        }
        if (statuses !== undefined) {
            if (statuses.length === 0) {
                return [];
            }
            query += ` AND s.name IN (${statuses.map(() => '?').join(',')})`;
            params.push(...statuses);
        }
        if (startDate || endDate) {
            const dateField = (type === 'sessions' || type === 'dailies') ? 'i.start_date' : 'i.updated_at';
            const isDateOnly = (type === 'sessions' || type === 'dailies');
            if (startDate) {
                query += ` AND ${dateField} >= ?`;
                params.push(isDateOnly ? startDate : startDate + 'T00:00:00.000Z');
            }
            if (endDate) {
                query += ` AND ${dateField} <= ?`;
                params.push(isDateOnly ? endDate : endDate + 'T23:59:59.999Z');
            }
        }
        query += ' ORDER BY i.created_at DESC';
        if (limit && limit > 0) {
            const maxLimit = 10000;
            const safeLimit = Math.min(limit, maxLimit);
            query += ` LIMIT ${safeLimit}`;
        }
        const rows = await this.db.allAsync(query, params);
        return rows.map(row => this.rowToListItem(row));
    }
    async searchItemsByTag(tag, types) {
        let query = `
      SELECT DISTINCT i.type, i.id, i.title, i.description, i.priority, 
             i.tags, i.updated_at, s.name as status_name,
             i.start_date
      FROM items i
      JOIN item_tags it ON i.type = it.item_type AND i.id = it.item_id
      JOIN tags t ON it.tag_id = t.id
      LEFT JOIN statuses s ON i.status_id = s.id
      WHERE t.name = ?
    `;
        const params = [tag];
        if (types && types.length > 0) {
            query += ` AND i.type IN (${types.map(() => '?').join(',')})`;
            params.push(...types);
        }
        query += ' ORDER BY i.created_at DESC';
        const rows = await this.db.allAsync(query, params);
        return rows.map(row => this.rowToListItem(row));
    }
    async syncItemToSQLite(item) {
        const params = [
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
            JSON.stringify(item.tags),
            JSON.stringify(item.related),
            item.created_at,
            item.updated_at
        ];
        await this.db.runAsync(`
      INSERT OR REPLACE INTO items 
      (type, id, title, description, content, priority, status_id, 
       start_date, end_date, start_time, tags, related, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, params);
        await this.db.runAsync(`
      INSERT OR REPLACE INTO items_fts 
      (rowid, type, title, description, content, tags)
      VALUES (
        (SELECT rowid FROM items WHERE type = ? AND id = ?),
        ?, ?, ?, ?, ?
      )
    `, [
            item.type, item.id,
            item.type, item.title, item.description || '', item.content, JSON.stringify(item.tags)
        ]);
        await this.db.runAsync('DELETE FROM item_tags WHERE item_type = ? AND item_id = ?', [item.type, item.id]);
        if (item.tags.length > 0) {
            const tagIds = await Promise.all(item.tags.map(tag => this.tagRepo.getOrCreateTagId(tag)));
            for (const tagId of tagIds) {
                await this.db.runAsync('INSERT INTO item_tags (item_type, item_id, tag_id) VALUES (?, ?, ?)', [item.type, item.id, tagId]);
            }
        }
        await this.db.runAsync('DELETE FROM related_items WHERE (source_type = ? AND source_id = ?) OR (target_type = ? AND target_id = ?)', [item.type, item.id, item.type, item.id]);
        if (item.related.length > 0) {
            const uniqueRelated = [...new Set(item.related)];
            for (const relatedRef of uniqueRelated) {
                const [relatedType, relatedId] = relatedRef.split('-');
                try {
                    await this.db.runAsync('INSERT INTO related_items (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)', [item.type, item.id, relatedType, relatedId]);
                }
                catch (error) {
                    if (error instanceof Error && error.message?.includes('UNIQUE constraint failed')) {
                        this.logger.debug(`Skipping duplicate related item: ${item.type}-${item.id} -> ${relatedRef}`);
                    }
                    else {
                        throw error;
                    }
                }
            }
        }
    }
    rowToListItem(row) {
        const tags = row.tags ? JSON.parse(row.tags) : [];
        const item = {
            id: row.id,
            type: row.type,
            title: row.title,
            description: row.description || undefined,
            tags,
            updated_at: row.updated_at
        };
        if (row.status_name) {
            item.status = row.status_name;
        }
        if (row.priority) {
            item.priority = row.priority;
        }
        if ((row.type === 'sessions' || row.type === 'dailies') && row.start_date) {
            item.date = row.start_date;
        }
        return item;
    }
    rowToUnifiedItem(row) {
        const tags = row.tags ? JSON.parse(row.tags) : [];
        const related = row.related ? JSON.parse(row.related) : [];
        const item = {
            id: row.id,
            type: row.type,
            title: row.title,
            description: row.description || undefined,
            content: row.content !== undefined ? (row.content || '') : '',
            priority: row.priority,
            status: row.status_name || 'Unknown',
            status_id: row.status_id || 1,
            start_date: row.start_date,
            end_date: row.end_date,
            start_time: row.start_time,
            tags,
            related,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
        if (row.type === 'sessions' || row.type === 'dailies') {
            item.date = row.start_date;
        }
        return item;
    }
    async rebuildFromMarkdown(type) {
        const config = this.getStorageConfig(type);
        let syncedCount = 0;
        if (config.useDateSubdir) {
            const dateDirs = await this.storage.listDateDirs(config);
            for (const dateDir of dateDirs) {
                const ids = await this.storage.list(config, dateDir);
                for (const id of ids) {
                    const storageItem = await this.storage.load(config, id);
                    if (storageItem && storageItem.metadata.title) {
                        try {
                            const item = await this.storageItemToUnifiedItem(storageItem, type);
                            await this.syncItemToSQLite(item);
                            await this.tagRepo.ensureTagsExist(item.tags);
                            syncedCount++;
                        }
                        catch (error) {
                            this.logger.error(`Failed to sync ${type} ${id}:`, error);
                        }
                    }
                    else if (storageItem) {
                        this.logger.warn(`Skipping ${type} ${id}: missing title`);
                    }
                }
            }
        }
        else {
            const ids = await this.storage.list(config);
            for (const id of ids) {
                const storageItem = await this.storage.load(config, id);
                if (storageItem && storageItem.metadata.title) {
                    try {
                        const item = await this.storageItemToUnifiedItem(storageItem, type);
                        await this.syncItemToSQLite(item);
                        await this.tagRepo.ensureTagsExist(item.tags);
                        syncedCount++;
                    }
                    catch (error) {
                        this.logger.error(`Failed to sync ${type} ${id}:`, error);
                    }
                }
                else if (storageItem) {
                    this.logger.warn(`Skipping ${type} ${id}: missing title`);
                }
            }
        }
        return syncedCount;
    }
    async changeItemType(fromType, fromId, toType) {
        const { ItemRepository: DatabaseItemRepository } = await import('../database/item-repository.js');
        const dbItemRepo = new DatabaseItemRepository(this.db, this.fileDb.dataDirectory, this.statusRepo, this.tagRepo);
        return dbItemRepo.changeItemType(fromType, fromId, toType);
    }
}
