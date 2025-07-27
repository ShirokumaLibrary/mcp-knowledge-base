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
import { StatusRepository } from './status-repository.js';
import { TagRepository } from './tag-repository.js';
import { TaskRepository } from './task-repository.js';
import { DocumentRepository } from './document-repository.js';
import { SearchRepository } from './search-repository.js';
import { TypeRepository } from './type-repository.js';
import { getConfig } from '../config.js';
import { ensureInitialized } from '../utils/decorators.js';
import * as path from 'path';
// Re-export types
export * from '../types/domain-types.js';
/**
 * @ai-context Main database facade coordinating all repositories
 * @ai-pattern Facade pattern hiding repository complexity from handlers
 * @ai-critical Central data access layer - all data operations go through here
 * @ai-lifecycle Lazy initialization ensures DB ready before operations
 * @ai-dependencies All repository types, manages their lifecycle
 * @ai-assumption Single database instance per process
 *
 * @ai-repository-overview
 * This facade coordinates multiple specialized repositories:
 * - StatusRepository: Workflow states (Open, In Progress, Done, etc.)
 * - TagRepository: Tag management with auto-registration
 * - IssueRepository: Bug/feature/task tracking with priority
 * - PlanRepository: Project plans with start/end dates
 * - KnowledgeRepository: Reference documentation (requires content)
 * - DocRepository: Technical documentation
 * - SearchRepository: Cross-type search functionality
 *
 * @ai-storage-strategy
 * 1. Primary data in markdown files with YAML frontmatter
 * 2. SQLite for search indexes and relationships
 * 3. Each repository handles its own sync between file <-> SQLite
 * 4. Tag auto-registration happens on create/update operations
 *
 * @ai-database-schema
 * Tables: statuses, tags, search_issues, search_plans, search_docs,
 *         search_knowledge, work_sessions, daily_summaries
 * Tag relationships stored via comma-separated IDs in search tables
 *
 * @ai-error-patterns
 * - File operations return null/false on not found
 * - Database operations throw errors on SQL failures
 * - All methods are async due to file I/O
 */
export class FileIssueDatabase {
    dataDir;
    dbPath;
    connection;
    statusRepo; // @ai-logic: Initialized in initializeAsync
    tagRepo;
    taskRepo; // @ai-logic: Unified tasks repository (issues + plans)
    documentRepo; // @ai-logic: Unified doc/knowledge repository
    searchRepo;
    typeRepo; // @ai-logic: Dynamic type management
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
     * @ai-intent Initialize database and all repositories
     * @ai-flow 1. Check if initializing -> 2. Start init -> 3. Cache promise
     * @ai-pattern Singleton initialization pattern
     * @ai-critical Must complete before any operations
     * @ai-why Prevents race conditions from concurrent initialization
     */
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise; // @ai-logic: Reuse existing initialization
        }
        this.initializationPromise = this.initializeAsync();
        return this.initializationPromise;
    }
    /**
     * @ai-intent Actual initialization logic
     * @ai-flow 1. Init connection -> 2. Create repos -> 3. Wire dependencies
     * @ai-critical Repository creation order matters - base repos first
     * @ai-side-effects Creates database tables, initializes all repos
     * @ai-assumption Database directory exists or can be created
     */
    async initializeAsync() {
        await this.connection.initialize();
        const db = this.connection.getDatabase();
        // @ai-logic: Initialize in dependency order
        // @ai-critical: Use provided dataDir instead of config paths for test isolation
        this.statusRepo = new StatusRepository(db); // @ai-logic: No dependencies
        this.tagRepo = new TagRepository(db); // @ai-logic: No dependencies
        this.taskRepo = new TaskRepository(db, path.join(this.dataDir, 'tasks'), this.statusRepo, this.tagRepo);
        this.documentRepo = new DocumentRepository(db, path.join(this.dataDir, 'documents')); // @ai-logic: Unified documents path
        this.searchRepo = new SearchRepository(db, this.taskRepo, this.documentRepo);
        this.typeRepo = new TypeRepository(this); // @ai-logic: Type definitions management
        // @ai-critical: Initialize document repository database tables
        await this.documentRepo.initializeDatabase();
        await this.typeRepo.init();
    }
    /**
     * @ai-intent Facade method for status retrieval
     * @ai-flow 1. Ensure initialized -> 2. Delegate to repository
     * @ai-pattern Delegation with initialization guard
     * @ai-why All public methods must wait for initialization
     * @ai-return Array of all workflow statuses
     */
    async getAllStatuses() {
        return this.statusRepo.getAllStatuses();
    }
    /**
     * @ai-intent Legacy async method for backward compatibility
     * @ai-flow Simple delegation to getAllStatuses
     * @ai-deprecated Use getAllStatuses() directly
     * @ai-why Historical API - kept for compatibility
     */
    async getAllStatusesAsync() {
        return this.getAllStatuses();
    }
    /**
     * @ai-intent Create new workflow status
     * @ai-flow 1. Wait for init -> 2. Create in SQLite -> 3. Return with ID
     * @ai-side-effects Inserts into statuses table
     * @ai-validation Name uniqueness checked by repository
     * @ai-return New status object with generated ID
     */
    async createStatus(name, is_closed = false) {
        return this.statusRepo.createStatus(name, is_closed);
    }
    /**
     * @ai-intent Update existing status name
     * @ai-flow 1. Wait for init -> 2. Update in SQLite -> 3. Return updated
     * @ai-validation Status must exist, name must be unique
     * @ai-critical Cannot update if status in use by items
     * @ai-return Updated status object or null if not found
     */
    async updateStatus(id, name, is_closed) {
        return this.statusRepo.updateStatus(id, name, is_closed);
    }
    /**
     * @ai-intent Delete workflow status
     * @ai-flow 1. Wait for init -> 2. Check usage -> 3. Delete if unused
     * @ai-validation Fails if status is referenced by any items
     * @ai-critical Preserves referential integrity
     * @ai-return true if deleted, false if not found or in use
     */
    async deleteStatus(id) {
        return this.statusRepo.deleteStatus(id);
    }
    /**
     * @ai-section Tag Operations
     * @ai-intent Retrieve all tags with usage counts
     * @ai-flow 1. Wait for init -> 2. Query tags table -> 3. Return with counts
     * @ai-performance Counts calculated via SQL joins
     * @ai-return Array of tags with name and usage count
     */
    async getTags() {
        return this.tagRepo.getTags();
    }
    /**
     * @ai-intent Create new tag for categorization
     * @ai-flow 1. Wait for init -> 2. Insert into tags table
     * @ai-validation Tag names must be unique (case-insensitive)
     * @ai-side-effects Creates tag in SQLite only
     * @ai-return Created tag object
     */
    async createTag(name) {
        return this.tagRepo.createTag(name);
    }
    /**
     * @ai-intent Delete tag by name (not ID despite parameter name)
     * @ai-flow 1. Wait for init -> 2. Delete from tags table
     * @ai-critical Parameter is tag NAME not ID - naming inconsistency
     * @ai-side-effects Removes tag associations from all items
     * @ai-return true if deleted, false if not found
     */
    async deleteTag(id) {
        return this.tagRepo.deleteTag(id);
    }
    /**
     * @ai-intent Search tags by name pattern
     * @ai-flow 1. Wait for init -> 2. SQL LIKE query -> 3. Return matches
     * @ai-pattern Case-insensitive substring matching
     * @ai-performance Uses SQL LIKE operator with % wildcards
     * @ai-return Array of matching tags with usage counts
     */
    async searchTags(pattern) {
        return this.tagRepo.getTagsByPattern(pattern);
    }
    // Legacy task methods removed - use unified task methods instead:
    // - getTask(type, id) instead of getIssue(), getPlan()
    // - createTask(type, ...) instead of createIssue(), createPlan()
    // - updateTask(type, ...) instead of updateIssue(), updatePlan()
    // - deleteTask(type, ...) instead of deleteIssue(), deletePlan()
    // - getAllTasksSummary(type) instead of getAllIssues(), getAllPlans()
    // - searchTasksByTag(tag, type) instead of searchIssuesByTag(), searchPlansByTag()
    /**
     * @ai-section Unified Document Operations (replaces getAllKnowledge, getAllDocs)
     * @ai-intent Retrieve all documents of specified type
     * @ai-flow 1. Wait for init -> 2. Read document files -> 3. Parse content
     * @ai-return Array of document objects with content
     */
    async getAllDocuments(type) {
        return this.documentRepo.getAllDocuments(type);
    }
    /**
     * @ai-intent Get single document by type and ID
     * @ai-flow 1. Wait for init -> 2. Read from markdown
     * @ai-return Complete document object or null
     */
    async getDocument(type, id) {
        return this.documentRepo.getDocument(type, id);
    }
    /**
     * @ai-intent Create new document of any type
     * @ai-flow 1. Wait for init -> 2. Generate ID -> 3. Save markdown -> 4. Index
     * @ai-side-effects Creates file and search index entry
     * @ai-return Complete document object
     */
    async createDocument(type, title, content, tags, description, related_tasks, related_documents) {
        return this.documentRepo.createDocument(type, title, content, tags, description, related_tasks, related_documents);
    }
    /**
     * @ai-intent Update document content by type and ID
     * @ai-flow 1. Wait for init -> 2. Read current -> 3. Apply changes -> 4. Reindex
     * @ai-pattern Partial updates allowed
     * @ai-return true if updated, false if not found
     */
    async updateDocument(type, id, title, content, tags, description, related_tasks, related_documents) {
        return this.documentRepo.updateDocument(type, id, title, content, tags, description, related_tasks, related_documents);
    }
    /**
     * @ai-intent Delete document by type and ID
     * @ai-flow 1. Wait for init -> 2. Delete files and index
     * @ai-critical Permanent deletion
     * @ai-return true if deleted, false if not found
     */
    async deleteDocument(type, id) {
        return this.documentRepo.deleteDocument(type, id);
    }
    /**
     * @ai-intent Find documents by tag and optional type filter
     * @ai-flow 1. Wait for init -> 2. Query search index -> 3. Filter exact
     * @ai-pattern Tag exact match in JSON array
     * @ai-return Array of matching document items
     */
    async searchDocumentsByTag(tag, type) {
        return this.documentRepo.searchDocumentsByTag(tag, type);
    }
    /**
     * @ai-intent Get document summary list without content
     * @ai-flow 1. Wait for init -> 2. Get all docs -> 3. Extract summaries
     * @ai-performance Avoids loading full content
     * @ai-return Array of summary objects
     */
    async getAllDocumentsSummary(type) {
        return this.documentRepo.getAllDocumentsSummary(type);
    }
    // Legacy document methods removed - use unified document methods instead:
    // - getAllDocuments(type) instead of getAllKnowledge(), getAllDocs()
    // - createDocument(type, ...) instead of createKnowledge(), createDoc()
    // - updateDocument(type, ...) instead of updateKnowledge(), updateDoc()
    // - deleteDocument(type, ...) instead of deleteKnowledge(), deleteDoc()
    // - getDocument(type, ...) instead of getKnowledge(), getDoc()
    // - searchDocumentsByTag(tag, type) instead of searchKnowledgeByTag(), searchDocsByTag()
    /**
     * @ai-section Unified Task Operations
     * @ai-intent Get task by type and ID through unified interface
     * @ai-logic Validates type from sequences table
     */
    async getTask(type, id) {
        // Validate type exists in sequences table
        const sequence = await this.connection.getDatabase().getAsync('SELECT base_type FROM sequences WHERE type = ?', [type]);
        if (!sequence || sequence.base_type !== 'tasks') {
            throw new Error(`Unknown task type: ${type}`);
        }
        return this.taskRepo.getTask(type, id);
    }
    /**
     * @ai-intent Create task through unified interface
     * @ai-logic Validates type from sequences table
     */
    async createTask(type, title, content, priority, status, tags, description, start_date, end_date, related_tasks, related_documents) {
        // Validate type exists
        const sequence = await this.connection.getDatabase().getAsync('SELECT base_type FROM sequences WHERE type = ?', [type]);
        if (!sequence || sequence.base_type !== 'tasks') {
            throw new Error(`Unknown task type: ${type}`);
        }
        // Tasks require content
        if (!content) {
            throw new Error(`Content is required for ${type}`);
        }
        return this.taskRepo.createTask(type, title, content, priority, status, tags, description, start_date, end_date, related_tasks, related_documents);
    }
    /**
     * @ai-intent Get all tasks summary through unified interface
     * @ai-logic Validates type from sequences table
     */
    async getAllTasksSummary(type, includeClosedStatuses = false, statusIds) {
        // Validate type exists
        const sequence = await this.connection.getDatabase().getAsync('SELECT base_type FROM sequences WHERE type = ?', [type]);
        if (!sequence || sequence.base_type !== 'tasks') {
            throw new Error(`Unknown task type: ${type}`);
        }
        return this.taskRepo.getAllTasksSummary(type, includeClosedStatuses, statusIds);
    }
    /**
     * @ai-intent Update task through unified interface
     * @ai-logic Validates type from sequences table
     */
    async updateTask(type, id, title, content, priority, status, tags, description, start_date, end_date, related_tasks, related_documents) {
        // Validate type exists
        const sequence = await this.connection.getDatabase().getAsync('SELECT base_type FROM sequences WHERE type = ?', [type]);
        if (!sequence || sequence.base_type !== 'tasks') {
            throw new Error(`Unknown task type: ${type}`);
        }
        return this.taskRepo.updateTask(type, id, title, content, priority, status, tags, description, start_date, end_date, related_tasks, related_documents);
    }
    /**
     * @ai-intent Delete task through unified interface
     * @ai-logic Validates type from sequences table
     */
    async deleteTask(type, id) {
        // Validate type exists
        const sequence = await this.connection.getDatabase().getAsync('SELECT base_type FROM sequences WHERE type = ?', [type]);
        if (!sequence || sequence.base_type !== 'tasks') {
            throw new Error(`Unknown task type: ${type}`);
        }
        return this.taskRepo.deleteTask(type, id);
    }
    /**
     * @ai-intent Search tasks by tag through unified interface
     * @ai-logic Validates type from sequences table
     */
    async searchTasksByTag(type, tag) {
        // Validate type exists
        const sequence = await this.connection.getDatabase().getAsync('SELECT base_type FROM sequences WHERE type = ?', [type]);
        if (!sequence || sequence.base_type !== 'tasks') {
            throw new Error(`Unknown task type: ${type}`);
        }
        return this.taskRepo.searchTasksByTag(type, tag);
    }
    /**
     * @ai-section Global Search Operations
     * @ai-intent Full-text search across all content types
     * @ai-flow 1. Wait for init -> 2. Search all tables -> 3. Merge results
     * @ai-performance Uses SQLite FTS for efficiency
     * @ai-return Categorized results by type
     */
    async searchAll(query) {
        return this.searchRepo.searchAll(query);
    }
    /**
     * @ai-intent Search all content types by tag
     * @ai-flow 1. Wait for init -> 2. Query each type -> 3. Aggregate
     * @ai-pattern Exact tag match across all repositories
     * @ai-return Categorized results by content type
     */
    async searchAllByTag(tag) {
        return this.searchRepo.searchAllByTag(tag);
    }
    /**
     * @ai-intent Full-text search work sessions
     * @ai-flow 1. Wait for init -> 2. Query search_sessions
     * @ai-performance SQLite query on indexed content
     * @ai-return Array of matching sessions
     */
    async searchSessions(query) {
        return this.searchRepo.searchSessions(query);
    }
    /**
     * @ai-intent Search daily summaries content
     * @ai-flow 1. Wait for init -> 2. Query search_daily_summaries
     * @ai-return Array of matching summaries
     */
    async searchDailySummaries(query) {
        return this.searchRepo.searchDailySummaries(query);
    }
    /**
     * @ai-intent Find sessions with specific tag
     * @ai-flow 1. Wait for init -> 2. Tag search in sessions
     * @ai-return Array of matching sessions
     */
    async searchSessionsByTag(tag) {
        return this.searchRepo.searchSessionsByTag(tag);
    }
    /**
     * @ai-intent Rebuild SQLite search index from markdown files
     * @ai-flow 1. Wait for init -> 2. Clear tables -> 3. Re-sync all content
     * @ai-critical Used for database recovery
     * @ai-side-effects Recreates all search tables
     * @ai-performance Can be slow with many files
     */
    async rebuildSearchIndex() {
        return this.searchRepo.rebuildSearchIndex();
    }
    /**
     * @ai-section Session Management
     * @ai-intent Sync work session to SQLite for searching
     * @ai-flow 1. Wait for init -> 2. Ensure tags -> 3. UPSERT to search table -> 4. Update tag relationships
     * @ai-side-effects Creates tags if needed, updates search_sessions and session_tags
     * @ai-critical Called after markdown write for consistency
     * @ai-assumption Session object has expected properties
     * @ai-database-schema Uses session_tags relationship table for normalized tag storage
     */
    async syncSessionToSQLite(session) {
        // @ai-logic: Tags must exist before foreign key reference
        if (session.tags && session.tags.length > 0) {
            await this.tagRepo.ensureTagsExist(session.tags);
        }
        const db = this.connection.getDatabase();
        const tags = session.tags ? session.tags.join(',') : ''; // @ai-pattern: CSV for backward compatibility
        await db.runAsync(`INSERT OR REPLACE INTO search_sessions 
       (id, title, content, category, tags, date, start_time, end_time, summary) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            session.id,
            session.title,
            session.content || '',
            '', // category removed but keep column for backward compatibility
            tags,
            session.date,
            session.startTime,
            session.endTime || '',
            session.summary || ''
        ]);
        // Update tag relationships
        if (session.tags && session.tags.length > 0) {
            await this.tagRepo.saveEntityTags('session', session.id, session.tags);
        }
        else {
            // Clear all tag relationships if no tags
            await db.runAsync('DELETE FROM session_tags WHERE session_id = ?', [session.id]);
        }
        // Update related tasks
        await db.runAsync('DELETE FROM related_tasks WHERE (source_type = ? AND source_id = ?)', ['sessions', session.id]);
        if (session.related_tasks && session.related_tasks.length > 0) {
            for (const taskRef of session.related_tasks) {
                const [targetType, targetId] = taskRef.split('-');
                if (targetType && targetId) {
                    await db.runAsync('INSERT OR IGNORE INTO related_tasks (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)', ['sessions', session.id, targetType, parseInt(targetId)]);
                }
            }
        }
        // Update related documents
        await db.runAsync('DELETE FROM related_documents WHERE (source_type = ? AND source_id = ?)', ['sessions', session.id]);
        if (session.related_documents && session.related_documents.length > 0) {
            for (const docRef of session.related_documents) {
                const [targetType, targetId] = docRef.split('-');
                if (targetType && targetId) {
                    await db.runAsync('INSERT OR IGNORE INTO related_documents (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)', ['sessions', session.id, targetType, parseInt(targetId)]);
                }
            }
        }
    }
    /**
     * @ai-intent Sync daily summary to SQLite
     * @ai-flow 1. Wait for init -> 2. Ensure tags -> 3. UPSERT summary -> 4. Update tag relationships
     * @ai-side-effects Updates search_daily_summaries table and summary_tags
     * @ai-critical Date is primary key - one summary per day
     * @ai-assumption Summary has required date and title fields
     * @ai-database-schema Uses summary_tags relationship table for normalized tag storage
     */
    async syncDailySummaryToSQLite(summary) {
        // @ai-logic: Create tags before referencing
        if (summary.tags && summary.tags.length > 0) {
            await this.tagRepo.ensureTagsExist(summary.tags);
        }
        const db = this.connection.getDatabase();
        const tags = summary.tags ? summary.tags.join(',') : '';
        await db.runAsync(`INSERT OR REPLACE INTO search_daily_summaries 
       (date, title, content, tags, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`, [
            summary.date, // @ai-critical: Primary key
            summary.title,
            summary.content,
            tags,
            summary.createdAt,
            summary.updatedAt || ''
        ]);
        // Update tag relationships
        if (summary.tags && summary.tags.length > 0) {
            await this.tagRepo.saveEntityTags('summary', summary.date, summary.tags);
        }
        else {
            // Clear all tag relationships if no tags
            await db.runAsync('DELETE FROM summary_tags WHERE summary_date = ?', [summary.date]);
        }
        // Update related tasks
        await db.runAsync('DELETE FROM related_tasks WHERE (source_type = ? AND source_id = ?)', ['summaries', summary.date]);
        if (summary.related_tasks && summary.related_tasks.length > 0) {
            for (const taskRef of summary.related_tasks) {
                const [targetType, targetId] = taskRef.split('-');
                if (targetType && targetId) {
                    await db.runAsync('INSERT OR IGNORE INTO related_tasks (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)', ['summaries', summary.date, targetType, parseInt(targetId)]);
                }
            }
        }
        // Update related documents
        await db.runAsync('DELETE FROM related_documents WHERE (source_type = ? AND source_id = ?)', ['summaries', summary.date]);
        if (summary.related_documents && summary.related_documents.length > 0) {
            for (const docRef of summary.related_documents) {
                const [targetType, targetId] = docRef.split('-');
                if (targetType && targetId) {
                    await db.runAsync('INSERT OR IGNORE INTO related_documents (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)', ['summaries', summary.date, targetType, parseInt(targetId)]);
                }
            }
        }
    }
    /**
     * @ai-intent Clean shutdown of database connections
     * @ai-flow 1. Close SQLite connection -> 2. Flush pending writes
     * @ai-critical Must be called on process exit
     * @ai-side-effects Terminates all database operations
     */
    close() {
        this.connection.close();
        this.initializationPromise = null;
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
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "createStatus", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Boolean]),
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
], FileIssueDatabase.prototype, "getTags", null);
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
], FileIssueDatabase.prototype, "searchTags", null);
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
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getTask", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Array, String, Object, Object, Array, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "createTask", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Array]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "getAllTasksSummary", null);
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
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchTasksByTag", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchAll", null);
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
], FileIssueDatabase.prototype, "searchSessions", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchDailySummaries", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "searchSessionsByTag", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "rebuildSearchIndex", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "syncSessionToSQLite", null);
__decorate([
    ensureInitialized,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FileIssueDatabase.prototype, "syncDailySummaryToSQLite", null);
//# sourceMappingURL=index.js.map