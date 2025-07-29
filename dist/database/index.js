var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { DatabaseConnection } from './base.js';
import { ItemRepository } from '../repositories/item-repository.js';
import { StatusRepository } from './status-repository.js';
import { TagRepository } from './tag-repository.js';
import { SearchRepository } from './search-repository.js';
import { FullTextSearchRepository } from './fulltext-search-repository.js';
import { TypeRepository } from './type-repository.js';
import { getConfig } from '../config.js';
import { ensureInitialized } from '../utils/decorators.js';
// import * as path from 'path';
// Re-export types
export * from '../types/domain-types.js';
/**
 * @ai-context Main database facade coordinating all repositories
 * @ai-pattern Facade pattern hiding repository complexity from handlers
 * @ai-critical Central data access layer - all data operations go through here
 * @ai-lifecycle Lazy initialization ensures DB ready before operations
 * @ai-dependencies ItemRepository for all content, Status/Tag for metadata
 * @ai-assumption Single database instance per process
 */
export class FileIssueDatabase {
    dataDir;
    dbPath;
    connection;
    itemRepo;
    statusRepo;
    tagRepo;
    searchRepo;
    fullTextSearchRepo;
    typeRepo;
    initializationPromise = null;
    constructor(dataDir, dbPath = getConfig().database.sqlitePath) {
        this.dataDir = dataDir;
        this.dbPath = dbPath;
        this.connection = new DatabaseConnection(this.dbPath);
    }
    /**
     * @ai-intent Get data directory for external access
     * @ai-why TypeHandlers need this to create TypeRepository
     */
    get dataDirectory() {
        return this.dataDir;
    }
    /**
     * @ai-intent Expose database connection
     * @ai-why TypeRepository needs direct database access
     */
    getDatabase() {
        return this.connection.getDatabase();
    }
    /**
     * @ai-intent Get ItemRepository for direct access
     * @ai-why UnifiedHandlers need direct access to ItemRepository
     */
    getItemRepository() {
        return this.itemRepo;
    }
    /**
     * @ai-intent Get TypeRepository for direct access
     * @ai-why Type management tests need direct access
     */
    getTypeRepository() {
        return this.typeRepo;
    }
    /**
     * @ai-intent Get FullTextSearchRepository for search operations
     * @ai-why Search handlers need direct access
     */
    getFullTextSearchRepository() {
        return this.fullTextSearchRepo;
    }
    /**
     * @ai-intent Initialize database and all repositories
     * @ai-flow 1. Check if initializing -> 2. Start init -> 3. Cache promise
     * @ai-pattern Singleton initialization pattern
     * @ai-critical Must complete before any operations
     */
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        this.initializationPromise = this.initializeAsync();
        return this.initializationPromise;
    }
    /**
     * @ai-intent Actual initialization logic
     */
    async initializeAsync() {
        await this.connection.initialize();
        const db = this.connection.getDatabase();
        // Initialize in dependency order
        this.statusRepo = new StatusRepository(db);
        this.tagRepo = new TagRepository(db);
        this.itemRepo = new ItemRepository(db, this.dataDir, this.statusRepo, this.tagRepo, this);
        this.searchRepo = new SearchRepository(db);
        this.fullTextSearchRepo = new FullTextSearchRepository(db);
        this.typeRepo = new TypeRepository(this);
        await this.typeRepo.init();
    }
    // Status methods
    async getAllStatuses() {
        return this.statusRepo.getAllStatuses();
    }
    async getAllStatusesAsync() {
        return this.getAllStatuses();
    }
    // Legacy status methods for tests
    async createStatus(name) {
        console.warn('createStatus is deprecated');
        const statuses = await this.statusRepo.getAllStatuses();
        const existing = statuses.find(s => s.name === name);
        if (existing) {
            return existing;
        }
        const id = statuses.length + 1;
        return { id, name, is_closed: false };
    }
    async updateStatus(_id, _name) {
        console.warn('updateStatus is deprecated');
        return true;
    }
    async deleteStatus(_id) {
        console.warn('deleteStatus is deprecated');
        return true;
    }
    // Tag methods
    async getAllTags() {
        return this.tagRepo.getAllTags();
    }
    async getOrCreateTagId(tagName) {
        return this.tagRepo.getOrCreateTagId(tagName);
    }
    async createTag(name) {
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            throw new Error('Tag name cannot be empty or whitespace only');
        }
        await this.tagRepo.createTag(trimmedName);
        const id = await this.tagRepo.getOrCreateTagId(trimmedName);
        return { id, name: trimmedName };
    }
    async deleteTag(name) {
        return this.tagRepo.deleteTag(name);
    }
    async searchTagsByPattern(pattern) {
        return this.tagRepo.searchTagsByPattern(pattern);
    }
    // Legacy task methods for tests
    async createTask(type, title, content, priority, status, tags, description, start_date, end_date, related_tasks, related_documents) {
        return this.itemRepo.createItem({
            type,
            title,
            content,
            priority: (priority || 'medium'),
            status,
            tags,
            description,
            start_date: start_date || undefined,
            end_date: end_date || undefined,
            related_tasks,
            related_documents
        });
    }
    async getTask(type, id) {
        return this.itemRepo.getItem(type, String(id));
    }
    async updateTask(type, id, title, content, priority, status, tags, description, start_date, end_date, related_tasks, related_documents) {
        return this.itemRepo.updateItem({
            type,
            id: String(id),
            title,
            content,
            priority: (priority || 'medium'),
            status,
            tags,
            description,
            start_date: start_date || undefined,
            end_date: end_date || undefined,
            related_tasks,
            related_documents
        });
    }
    async deleteTask(type, id) {
        return this.itemRepo.deleteItem(type, String(id));
    }
    async getAllTasksSummary(type, includeClosedStatuses, statuses) {
        return this.itemRepo.getItems(type, includeClosedStatuses, statuses);
    }
    async searchTasksByTag(tag) {
        return this.itemRepo.searchItemsByTag(tag, ['issues', 'plans']);
    }
    async getTags() {
        return this.tagRepo.getAllTags();
    }
    async searchTags(pattern) {
        return this.tagRepo.searchTagsByPattern(pattern);
    }
    async searchAllByTag(tag) {
        const items = await this.itemRepo.searchItemsByTag(tag);
        // Group by type for backward compatibility
        const grouped = {
            issues: [],
            plans: [],
            docs: [],
            knowledge: []
        };
        for (const item of items) {
            switch (item.type) {
                case 'issues':
                    grouped.issues.push(item);
                    break;
                case 'plans':
                    grouped.plans.push(item);
                    break;
                case 'docs':
                    grouped.docs.push(item);
                    break;
                case 'knowledge':
                    grouped.knowledge.push(item);
                    break;
            }
        }
        return grouped;
    }
    async searchAll(query) {
        const items = await this.searchRepo.searchContent(query);
        // Group by type for backward compatibility
        const grouped = {
            issues: [],
            plans: [],
            docs: [],
            knowledge: []
        };
        for (const item of items) {
            switch (item.type) {
                case 'issues':
                    grouped.issues.push(item);
                    break;
                case 'plans':
                    grouped.plans.push(item);
                    break;
                case 'docs':
                    grouped.docs.push(item);
                    break;
                case 'knowledge':
                    grouped.knowledge.push(item);
                    break;
            }
        }
        return grouped;
    }
    // Issue methods (delegate to ItemRepository)
    async createIssue(title, content, priority, status, tags, description, start_date, end_date, related_tasks, related_documents) {
        const item = await this.itemRepo.createItem({
            type: 'issues',
            title,
            content,
            priority: priority,
            status,
            tags,
            description,
            start_date: start_date || undefined,
            end_date: end_date || undefined,
            related_tasks,
            related_documents
        });
        // Convert to Issue format for backward compatibility
        return {
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            priority: item.priority,
            status: item.status,
            tags: item.tags,
            start_date: item.start_date,
            end_date: item.end_date,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        };
    }
    async getIssue(id) {
        const item = await this.itemRepo.getItem('issues', String(id));
        if (!item) {
            return null;
        }
        return {
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            priority: item.priority,
            status: item.status,
            tags: item.tags,
            start_date: item.start_date,
            end_date: item.end_date,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        };
    }
    async updateIssue(id, title, content, priority, status, tags, description, start_date, end_date, related_tasks, related_documents) {
        const item = await this.itemRepo.updateItem({
            type: 'issues',
            id: String(id),
            title,
            content,
            priority: priority,
            status,
            tags,
            description,
            start_date: start_date || undefined,
            end_date: end_date || undefined,
            related_tasks,
            related_documents
        });
        if (!item) {
            return null;
        }
        return {
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            priority: item.priority,
            status: item.status,
            tags: item.tags,
            start_date: item.start_date,
            end_date: item.end_date,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        };
    }
    async deleteIssue(id) {
        return this.itemRepo.deleteItem('issues', String(id));
    }
    async getAllIssuesSummary(includeClosedStatuses, statusIds) {
        // Convert status IDs to names for backward compatibility
        let statuses;
        if (statusIds && statusIds.length > 0) {
            const allStatuses = await this.statusRepo.getAllStatuses();
            statuses = statusIds
                .map(id => allStatuses.find(s => s.id === id)?.name)
                .filter((name) => name !== undefined);
        }
        const items = await this.itemRepo.getItems('issues', includeClosedStatuses, statuses);
        return items.map(item => ({
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            priority: item.priority,
            status: item.status,
            start_date: item.start_date,
            end_date: item.end_date,
            tags: item.tags,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));
    }
    async searchIssuesByTag(tag) {
        const items = await this.itemRepo.searchItemsByTag(tag, ['issues']);
        return items.map(item => ({
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            priority: item.priority,
            status: item.status,
            tags: item.tags,
            start_date: item.start_date,
            end_date: item.end_date,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));
    }
    // Plan methods (delegate to ItemRepository)
    async createPlan(title, content, priority, status, tags, description, start_date, end_date, related_tasks, related_documents) {
        const item = await this.itemRepo.createItem({
            type: 'plans',
            title,
            content,
            priority: priority,
            status,
            tags,
            description,
            start_date: start_date || undefined,
            end_date: end_date || undefined,
            related_tasks,
            related_documents
        });
        return {
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            priority: item.priority,
            status: item.status,
            tags: item.tags,
            start_date: item.start_date,
            end_date: item.end_date,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        };
    }
    async getPlan(id) {
        const item = await this.itemRepo.getItem('plans', String(id));
        if (!item) {
            return null;
        }
        return {
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            priority: item.priority,
            status: item.status,
            tags: item.tags,
            start_date: item.start_date,
            end_date: item.end_date,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        };
    }
    async updatePlan(id, title, content, priority, status, tags, description, start_date, end_date, related_tasks, related_documents) {
        const item = await this.itemRepo.updateItem({
            type: 'plans',
            id: String(id),
            title,
            content,
            priority: priority,
            status,
            tags,
            description,
            start_date: start_date || undefined,
            end_date: end_date || undefined,
            related_tasks,
            related_documents
        });
        if (!item) {
            return null;
        }
        return {
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            priority: item.priority,
            status: item.status,
            tags: item.tags,
            start_date: item.start_date,
            end_date: item.end_date,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        };
    }
    async deletePlan(id) {
        return this.itemRepo.deleteItem('plans', String(id));
    }
    async getAllPlansSummary(includeClosedStatuses, statusIds) {
        // Convert status IDs to names for backward compatibility
        let statuses;
        if (statusIds && statusIds.length > 0) {
            const allStatuses = await this.statusRepo.getAllStatuses();
            statuses = statusIds
                .map(id => allStatuses.find(s => s.id === id)?.name)
                .filter((name) => name !== undefined);
        }
        const items = await this.itemRepo.getItems('plans', includeClosedStatuses, statuses);
        return items.map(item => ({
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            priority: item.priority,
            status: item.status,
            start_date: item.start_date,
            end_date: item.end_date,
            tags: item.tags,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));
    }
    async searchPlansByTag(tag) {
        const items = await this.itemRepo.searchItemsByTag(tag, ['plans']);
        return items.map(item => ({
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            priority: item.priority,
            status: item.status,
            tags: item.tags,
            start_date: item.start_date,
            end_date: item.end_date,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));
    }
    // Document methods (delegate to ItemRepository)
    async getAllDocuments(type) {
        if (!type) {
            // Get both docs and knowledge
            const docs = await this.itemRepo.getItems('docs');
            const knowledge = await this.itemRepo.getItems('knowledge');
            return [...docs, ...knowledge].map(item => ({
                type: item.type,
                id: parseInt(item.id),
                title: item.title,
                description: item.description,
                content: item.content,
                tags: item.tags,
                related_tasks: item.related_tasks,
                related_documents: item.related_documents,
                created_at: item.created_at,
                updated_at: item.updated_at
            }));
        }
        const items = await this.itemRepo.getItems(type);
        return items.map(item => ({
            type: item.type,
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            tags: item.tags,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));
    }
    async getDocument(type, id) {
        const item = await this.itemRepo.getItem(type, String(id));
        if (!item) {
            return null;
        }
        return {
            type: item.type,
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            tags: item.tags,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        };
    }
    async createDocument(type, title, content, tags, description, related_tasks, related_documents) {
        const item = await this.itemRepo.createItem({
            type,
            title,
            content,
            tags,
            description,
            related_tasks,
            related_documents
        });
        return {
            type: item.type,
            id: item.id,
            title: item.title,
            description: item.description,
            content: item.content,
            tags: item.tags,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        };
    }
    async updateDocument(type, id, title, content, tags, description, related_tasks, related_documents) {
        const item = await this.itemRepo.updateItem({
            type,
            id: String(id),
            title,
            content,
            tags,
            description,
            related_tasks,
            related_documents
        });
        if (!item) {
            return false;
        }
        return true;
    }
    async deleteDocument(type, id) {
        return this.itemRepo.deleteItem(type, String(id));
    }
    async searchDocumentsByTag(tag, type) {
        const types = type ? [type] : ['docs', 'knowledge'];
        const items = await this.itemRepo.searchItemsByTag(tag, types);
        return items.map(item => ({
            type: item.type,
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            content: item.content,
            tags: item.tags,
            related_tasks: item.related_tasks,
            related_documents: item.related_documents,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));
    }
    async getAllDocumentsSummary(type) {
        if (!type) {
            const docs = await this.itemRepo.getItems('docs');
            const knowledge = await this.itemRepo.getItems('knowledge');
            return [...docs, ...knowledge].map(item => ({
                type: item.type,
                id: parseInt(item.id),
                title: item.title,
                description: item.description,
                tags: item.tags,
                created_at: item.created_at,
                updated_at: item.updated_at
            }));
        }
        const items = await this.itemRepo.getItems(type);
        return items.map(item => ({
            type: item.type,
            id: parseInt(item.id),
            title: item.title,
            description: item.description,
            tags: item.tags,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));
    }
    // Type methods
    async getAllTypes() {
        return this.typeRepo.getAllTypes();
    }
    async createType(name, baseType) {
        return this.typeRepo.createType(name, baseType);
    }
    async deleteType(name) {
        return this.typeRepo.deleteType(name);
    }
    async getBaseType(name) {
        return this.typeRepo.getBaseType(name);
    }
    // Search methods
    async searchContent(query) {
        return this.searchRepo.searchContent(query);
    }
    // Legacy item methods
    async getItems(type) {
        return this.itemRepo.getItems(type);
    }
    async getTypes() {
        const types = await this.typeRepo.getAllTypes();
        // Group by base_type for backward compatibility
        const grouped = {
            tasks: [],
            documents: []
        };
        for (const type of types) {
            if (grouped[type.base_type]) {
                grouped[type.base_type].push(type.type);
            }
        }
        return grouped;
    }
    // Session search methods (placeholder - actual implementation pending)
    async searchSessions(query) {
        // Search for sessions in the items table
        const results = await this.connection.getDatabase().allAsync(`SELECT * FROM items 
       WHERE type = 'sessions' AND (title LIKE ? OR content LIKE ? OR description LIKE ?)
       ORDER BY created_at DESC`, [`%${query}%`, `%${query}%`, `%${query}%`]);
        // Convert database rows to Session format
        return results.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description || undefined,
            content: row.content || undefined,
            tags: row.tags ? JSON.parse(row.tags) : [],
            related_tasks: row.related ? JSON.parse(row.related).filter((r) => r.startsWith('issues-') || r.startsWith('plans-')) : undefined,
            related_documents: row.related ? JSON.parse(row.related).filter((r) => r.startsWith('docs-') || r.startsWith('knowledge-')) : undefined,
            date: row.start_date || row.id.split('-').slice(0, 3).join('-'),
            startTime: row.start_time || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at || undefined
        }));
    }
    async searchSessionsByTag(tag) {
        // Search for sessions with the specific tag
        const results = await this.connection.getDatabase().allAsync(`SELECT * FROM items 
       WHERE type = 'sessions' AND tags LIKE ?
       ORDER BY created_at DESC`, [`%"${tag}"%`]);
        // Convert database rows to Session format
        return results.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description || undefined,
            content: row.content || undefined,
            tags: row.tags ? JSON.parse(row.tags) : [],
            related_tasks: row.related ? JSON.parse(row.related).filter((r) => r.startsWith('issues-') || r.startsWith('plans-')) : undefined,
            related_documents: row.related ? JSON.parse(row.related).filter((r) => r.startsWith('docs-') || r.startsWith('knowledge-')) : undefined,
            date: row.start_date || row.id.split('-').slice(0, 3).join('-'),
            startTime: row.start_time || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at || undefined
        }));
    }
    async searchDailySummaries(query) {
        // Search for summaries in the items table
        const results = await this.connection.getDatabase().allAsync(`SELECT * FROM items 
       WHERE type = 'dailies' AND (title LIKE ? OR content LIKE ? OR description LIKE ?)
       ORDER BY created_at DESC`, [`%${query}%`, `%${query}%`, `%${query}%`]);
        // Convert database rows to Daily format
        return results.map((row) => ({
            date: row.id, // ID is the date for summaries
            title: row.title,
            description: row.description || undefined,
            content: row.content || '',
            tags: row.tags ? JSON.parse(row.tags) : [],
            related_tasks: row.related ? JSON.parse(row.related).filter((r) => r.startsWith('issues-') || r.startsWith('plans-')) : [],
            related_documents: row.related ? JSON.parse(row.related).filter((r) => r.startsWith('docs-') || r.startsWith('knowledge-')) : [],
            createdAt: row.created_at,
            updatedAt: row.updated_at || undefined
        }));
    }
    /**
     * @ai-intent Clean up resources
     */
    async close() {
        try {
            await this.connection.close();
        }
        catch (error) {
            // Log but don't throw - tests need cleanup to complete
            console.error('Error closing database connection:', error);
        }
    }
}
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getAllStatuses", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "createStatus", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "updateStatus", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "deleteStatus", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getAllTags", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getOrCreateTagId", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "createTag", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "deleteTag", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchTagsByPattern", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Array, String, Object, Object, Array, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "createTask", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getTask", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String, String, String, Array, String, Object, Object, Array, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "updateTask", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "deleteTask", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getAllTasksSummary", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchTasksByTag", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getTags", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchTags", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchAllByTag", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchAll", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Array, String, Object, Object, Array, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "createIssue", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getIssue", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String, String, Array, String, Object, Object, Array, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "updateIssue", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "deleteIssue", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getAllIssuesSummary", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchIssuesByTag", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Array, String, Object, Object, Array, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "createPlan", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getPlan", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String, String, Array, String, Object, Object, Array, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "updatePlan", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "deletePlan", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getAllPlansSummary", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchPlansByTag", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getAllDocuments", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getDocument", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Array, String, Array, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "createDocument", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String, Array, String, Array, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "updateDocument", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "deleteDocument", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchDocumentsByTag", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getAllDocumentsSummary", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getAllTypes", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "createType", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "deleteType", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getBaseType", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchContent", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getItems", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getTypes", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchSessions", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchSessionsByTag", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchDailySummaries", null);
//# sourceMappingURL=index.js.map