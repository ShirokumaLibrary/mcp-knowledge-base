import { DatabaseConnection } from './base.js';
import { StatusRepository } from './status-repository.js';
import { TagRepository } from './tag-repository.js';
import { IssueRepository } from './issue-repository.js';
import { PlanRepository } from './plan-repository.js';
import { DocumentRepository } from './document-repository.js';
import { SearchRepository } from './search-repository.js';
import { TypeRepository } from './type-repository.js';
import { getConfig } from '../config.js';
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
    issueRepo;
    planRepo;
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
        this.issueRepo = new IssueRepository(db, path.join(this.dataDir, 'issues'), this.statusRepo, this.tagRepo);
        this.planRepo = new PlanRepository(db, path.join(this.dataDir, 'plans'), this.statusRepo, this.tagRepo);
        this.documentRepo = new DocumentRepository(db, path.join(this.dataDir, 'documents')); // @ai-logic: Unified documents path
        this.searchRepo = new SearchRepository(db, this.issueRepo, this.planRepo, this.documentRepo);
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
        if (this.initializationPromise) {
            await this.initializationPromise; // @ai-critical: Must wait for DB ready
        }
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
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
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
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
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
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
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
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
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
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
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
        if (this.initializationPromise) {
            await this.initializationPromise; // @ai-bug: Misleading parameter name
        }
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
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.tagRepo.getTagsByPattern(pattern);
    }
    /**
     * @ai-section Issue Operations
     * @ai-intent Retrieve all issues with full details
     * @ai-flow 1. Wait for init -> 2. Read all markdown files -> 3. Parse and return
     * @ai-performance O(n) file reads - consider pagination for scale
     * @ai-return Array of complete issue objects sorted by ID
     */
    async getAllIssues(includeClosedStatuses = false, statusIds) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.issueRepo.getAllIssues(includeClosedStatuses, statusIds);
    }
    /**
     * @ai-intent Get lightweight issue list for UI display
     * @ai-flow 1. Wait for init -> 2. Query SQLite -> 3. Return summaries
     * @ai-performance Uses indexed SQLite query vs file reads
     * @ai-return Array with id, title, priority, status fields only
     */
    async getAllIssuesSummary(includeClosedStatuses = false, statusIds) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.issueRepo.getAllIssuesSummary(includeClosedStatuses, statusIds);
    }
    /**
     * @ai-intent Create new issue with optional metadata
     * @ai-flow 1. Wait for init -> 2. Generate ID -> 3. Write markdown -> 4. Sync SQLite
     * @ai-side-effects Creates markdown file and SQLite record
     * @ai-defaults Priority: 'medium', Status: 1 (default status)
     * @ai-return Complete issue object with generated ID
     */
    async createIssue(title, content, priority, status, tags, description) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.issueRepo.createIssue(title, content, priority, status, tags, description);
    }
    /**
     * @ai-intent Update existing issue with partial changes
     * @ai-flow 1. Wait for init -> 2. Read current -> 3. Merge changes -> 4. Write both stores
     * @ai-pattern Partial update - undefined values preserve existing
     * @ai-validation Issue must exist, status_id must be valid
     * @ai-return Updated issue object or null if not found
     */
    async updateIssue(id, title, content, priority, status, tags, description) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.issueRepo.updateIssue(id, title, content, priority, status, tags, description);
    }
    /**
     * @ai-intent Delete issue permanently
     * @ai-flow 1. Wait for init -> 2. Delete markdown -> 3. Delete from SQLite
     * @ai-side-effects Removes file and database record
     * @ai-critical No soft delete - permanent removal
     * @ai-return true if deleted, false if not found
     */
    async deleteIssue(id) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.issueRepo.deleteIssue(id);
    }
    /**
     * @ai-intent Retrieve single issue by ID
     * @ai-flow 1. Wait for init -> 2. Read markdown file -> 3. Parse and return
     * @ai-source Markdown file is source of truth
     * @ai-return Complete issue object or null if not found
     */
    async getIssue(id) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.issueRepo.getIssue(id);
    }
    /**
     * @ai-section Plan Operations
     * @ai-intent Retrieve all plans with timeline data
     * @ai-flow 1. Wait for init -> 2. Read plan files -> 3. Parse with dates
     * @ai-critical Plans include start/end dates for scheduling
     * @ai-return Array of plan objects sorted by ID
     */
    async getAllPlans(includeClosedStatuses = false, statusIds) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.planRepo.getAllPlans(includeClosedStatuses, statusIds);
    }
    /**
     * @ai-intent Create new plan with timeline
     * @ai-flow 1. Wait for init -> 2. Validate dates -> 3. Create files -> 4. Sync
     * @ai-validation Start date must be before end date
     * @ai-pattern Dates in YYYY-MM-DD format
     * @ai-return Complete plan object with generated ID
     */
    async createPlan(title, content, priority, status, start_date, end_date, tags, description) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.planRepo.createPlan(title, content, priority, status, start_date, end_date, tags, description);
    }
    /**
     * @ai-intent Update plan including timeline adjustments
     * @ai-flow 1. Wait for init -> 2. Read current -> 3. Validate changes -> 4. Update
     * @ai-validation New dates must maintain start <= end relationship
     * @ai-pattern Partial updates preserve unspecified fields
     * @ai-return Updated plan or null if not found
     */
    async updatePlan(id, title, content, priority, status, start_date, end_date, tags, description) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.planRepo.updatePlan(id, title, content, priority, status, start_date, end_date, tags, description);
    }
    /**
     * @ai-intent Delete plan permanently
     * @ai-flow 1. Wait for init -> 2. Remove markdown -> 3. Clean SQLite
     * @ai-critical No cascade to related items
     * @ai-return true if deleted, false if not found
     */
    async deletePlan(id) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.planRepo.deletePlan(id);
    }
    /**
     * @ai-intent Retrieve single plan with timeline
     * @ai-flow 1. Wait for init -> 2. Read from markdown
     * @ai-return Complete plan object or null
     */
    async getPlan(id) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.planRepo.getPlan(id);
    }
    /**
     * @ai-intent Find issues with specific tag
     * @ai-flow 1. Wait for init -> 2. Query SQLite -> 3. Filter exact matches
     * @ai-pattern Exact tag match, case-sensitive
     * @ai-performance Uses SQLite index on tags column
     * @ai-return Array of matching issues
     */
    async searchIssuesByTag(tag) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.issueRepo.searchIssuesByTag(tag);
    }
    /**
     * @ai-intent Find plans with specific tag
     * @ai-flow 1. Wait for init -> 2. Query search_plans -> 3. Filter matches
     * @ai-pattern Exact tag match within JSON array
     * @ai-return Array of matching plans with timeline data
     */
    async searchPlansByTag(tag) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.planRepo.searchPlansByTag(tag);
    }
    /**
     * @ai-section Knowledge Base Operations
     * @ai-intent Retrieve all knowledge articles
     * @ai-flow 1. Wait for init -> 2. Read knowledge files -> 3. Parse content
     * @ai-pattern Knowledge items are reference documentation
     * @ai-return Array of knowledge objects with content
     */
    async getAllKnowledge() {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.getAllDocuments('knowledge');
    }
    /**
     * @ai-intent Create new knowledge article
     * @ai-flow 1. Wait for init -> 2. Generate ID -> 3. Save markdown -> 4. Index
     * @ai-validation Content is required for knowledge items
     * @ai-side-effects Creates file and search index entry
     * @ai-return Complete knowledge object
     */
    async createKnowledge(title, content, tags, description) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.createDocument('knowledge', title, content, tags, description);
    }
    /**
     * @ai-intent Update knowledge article content
     * @ai-flow 1. Wait for init -> 2. Read current -> 3. Apply changes -> 4. Reindex
     * @ai-pattern Partial updates allowed
     * @ai-return Updated knowledge or null
     */
    async updateKnowledge(id, title, content, tags, description) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        const success = await this.documentRepo.updateDocument('knowledge', id, title, content, tags, description);
        return success ? await this.documentRepo.getDocument('knowledge', id) : null;
    }
    /**
     * @ai-intent Delete knowledge article
     * @ai-flow 1. Wait for init -> 2. Delete files and index
     * @ai-critical Permanent deletion
     * @ai-return true if deleted, false if not found
     */
    async deleteKnowledge(id) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.deleteDocument('knowledge', id);
    }
    /**
     * @ai-intent Retrieve single knowledge article
     * @ai-flow 1. Wait for init -> 2. Read from markdown
     * @ai-return Complete knowledge object or null
     */
    async getKnowledge(id) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.getDocument('knowledge', id);
    }
    /**
     * @ai-intent Find knowledge articles by tag
     * @ai-flow 1. Wait for init -> 2. Query search index -> 3. Filter exact
     * @ai-pattern Tag exact match in JSON array
     * @ai-return Array of matching knowledge items
     */
    async searchKnowledgeByTag(tag) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.searchDocumentsByTag(tag, 'knowledge');
    }
    /**
     * @ai-section Documentation Operations
     * @ai-intent Retrieve all technical documentation
     * @ai-flow 1. Wait for init -> 2. Read doc files -> 3. Parse all
     * @ai-critical Docs can be large - memory consideration
     * @ai-return Array of complete doc objects
     */
    async getAllDocs() {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.getAllDocuments('doc');
    }
    /**
     * @ai-intent Get doc list without content
     * @ai-flow 1. Wait for init -> 2. Get all docs -> 3. Extract summaries
     * @ai-performance Avoids loading full content
     * @ai-return Array of {id, title} objects only
     */
    async getDocsSummary() {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        const docs = await this.documentRepo.getAllDocuments('doc');
        return docs.map(d => ({ id: d.id, title: d.title, description: d.description }));
    }
    /**
     * @ai-intent Create new documentation
     * @ai-flow 1. Wait for init -> 2. Generate ID -> 3. Save -> 4. Index
     * @ai-validation Content required for docs
     * @ai-return Complete doc object
     */
    async createDoc(title, content, tags, description) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.createDocument('doc', title, content, tags, description);
    }
    /**
     * @ai-intent Update documentation content
     * @ai-flow 1. Wait for init -> 2. Update markdown and index
     * @ai-pattern Partial updates supported
     * @ai-return Updated doc or null
     */
    async updateDoc(id, title, content, tags, description) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        const success = await this.documentRepo.updateDocument('doc', id, title, content, tags, description);
        return success ? await this.documentRepo.getDocument('doc', id) : null;
    }
    /**
     * @ai-intent Delete documentation
     * @ai-flow 1. Wait for init -> 2. Remove files and index
     * @ai-return true if deleted, false if not found
     */
    async deleteDoc(id) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.deleteDocument('doc', id);
    }
    /**
     * @ai-intent Retrieve single documentation
     * @ai-flow 1. Wait for init -> 2. Read from markdown
     * @ai-return Complete doc object or null
     */
    async getDoc(id) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.getDocument('doc', id);
    }
    /**
     * @ai-intent Find docs by tag
     * @ai-flow 1. Wait for init -> 2. Query search_docs table
     * @ai-return Array of matching docs
     */
    async searchDocsByTag(tag) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.searchDocumentsByTag(tag, 'doc');
    }
    /**
     * @ai-intent Get lightweight plan list for UI display
     * @ai-flow 1. Wait for init -> 2. Query SQLite -> 3. Return summaries
     * @ai-performance Uses indexed SQLite query vs file reads
     * @ai-return Array with key fields including timeline data
     */
    async getAllPlansSummary(includeClosedStatuses = false, statusIds) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.planRepo.getAllPlansSummary(includeClosedStatuses, statusIds);
    }
    /**
     * @ai-section Global Search Operations
     * @ai-intent Full-text search across all content types
     * @ai-flow 1. Wait for init -> 2. Search all tables -> 3. Merge results
     * @ai-performance Uses SQLite FTS for efficiency
     * @ai-return Categorized results by type
     */
    async searchAll(query) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.searchRepo.searchAll(query);
    }
    /**
     * @ai-intent Search all content types by tag
     * @ai-flow 1. Wait for init -> 2. Query each type -> 3. Aggregate
     * @ai-pattern Exact tag match across all repositories
     * @ai-return Categorized results by content type
     */
    async searchAllByTag(tag) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.searchRepo.searchAllByTag(tag);
    }
    /**
     * @ai-intent Full-text search work sessions
     * @ai-flow 1. Wait for init -> 2. Query search_sessions
     * @ai-performance SQLite query on indexed content
     * @ai-return Array of matching sessions
     */
    async searchSessions(query) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.searchRepo.searchSessions(query);
    }
    /**
     * @ai-intent Search daily summaries content
     * @ai-flow 1. Wait for init -> 2. Query search_daily_summaries
     * @ai-return Array of matching summaries
     */
    async searchDailySummaries(query) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.searchRepo.searchDailySummaries(query);
    }
    /**
     * @ai-intent Find sessions with specific tag
     * @ai-flow 1. Wait for init -> 2. Tag search in sessions
     * @ai-return Array of matching sessions
     */
    async searchSessionsByTag(tag) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
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
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
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
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
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
            session.category || '',
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
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
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
    }
    /**
     * @ai-section Unified Document Operations
     * @ai-intent Operations for unified doc/knowledge documents
     * @ai-pattern Replaces separate doc and knowledge operations
     * @ai-critical Uses composite key (type, id) for identification
     */
    /**
     * @ai-intent Get all documents of specific subtype
     * @ai-flow 1. Wait for init -> 2. Query by type -> 3. Return sorted
     * @ai-param type Optional filter by 'doc' or 'knowledge'
     * @ai-return Array of Document objects
     */
    async getAllDocuments(type) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.getAllDocuments(type);
    }
    /**
     * @ai-intent Get document summaries for lists
     * @ai-flow 1. Wait for init -> 2. Query SQLite -> 3. Return lightweight
     * @ai-performance Excludes content field
     * @ai-return Array of DocumentSummary objects
     */
    async getAllDocumentsSummary(type) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.getAllDocumentsSummary(type);
    }
    /**
     * @ai-intent Create new document with subtype
     * @ai-flow 1. Wait for init -> 2. Get type-specific ID -> 3. Save
     * @ai-critical Type determines ID sequence
     * @ai-return Complete Document object
     */
    async createDocument(type, title, content, tags, description) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.createDocument(type, title, content, tags, description);
    }
    /**
     * @ai-intent Get single document by type and ID
     * @ai-flow 1. Wait for init -> 2. Load from file
     * @ai-return Document object or null
     */
    async getDocument(type, id) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.getDocument(type, id);
    }
    /**
     * @ai-intent Update document with partial changes
     * @ai-flow 1. Wait for init -> 2. Apply updates -> 3. Save
     * @ai-return true if updated, false if not found
     */
    async updateDocument(type, id, title, content, tags, description) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.updateDocument(type, id, title, content, tags, description);
    }
    /**
     * @ai-intent Delete document by type and ID
     * @ai-flow 1. Wait for init -> 2. Remove file and index
     * @ai-return true if deleted, false if not found
     */
    async deleteDocument(type, id) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.deleteDocument(type, id);
    }
    /**
     * @ai-intent Search documents by tag
     * @ai-flow 1. Wait for init -> 2. Query by tag -> 3. Filter by type
     * @ai-return Array of matching documents
     */
    async searchDocumentsByTag(tag, type) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        return this.documentRepo.searchDocumentsByTag(tag, type);
    }
    /**
     * @ai-intent Clean shutdown of database connections
     * @ai-flow 1. Close SQLite connection -> 2. Flush pending writes
     * @ai-critical Must be called on process exit
     * @ai-side-effects Terminates all database operations
     */
    close() {
        this.connection.close();
    }
}
//# sourceMappingURL=index.js.map