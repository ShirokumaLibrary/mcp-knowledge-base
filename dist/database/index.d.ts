import { WorkSession, DailySummary } from '../types/complete-domain-types.js';
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
export declare class FileIssueDatabase {
    private dataDir;
    private dbPath;
    private connection;
    private statusRepo;
    private tagRepo;
    private taskRepo;
    private documentRepo;
    private searchRepo;
    private typeRepo;
    private initializationPromise;
    constructor(dataDir: string, dbPath?: string);
    /**
     * @ai-intent Get data directory for external access
     * @ai-why TypeHandlers need this to create TypeRepository
     */
    get dataDirectory(): string;
    /**
     * @ai-intent Expose database connection
     * @ai-why TypeRepository needs direct database access
     */
    getDatabase(): import("./base.js").Database;
    /**
     * @ai-intent Initialize database and all repositories
     * @ai-flow 1. Check if initializing -> 2. Start init -> 3. Cache promise
     * @ai-pattern Singleton initialization pattern
     * @ai-critical Must complete before any operations
     * @ai-why Prevents race conditions from concurrent initialization
     */
    initialize(): Promise<void>;
    /**
     * @ai-intent Actual initialization logic
     * @ai-flow 1. Init connection -> 2. Create repos -> 3. Wire dependencies
     * @ai-critical Repository creation order matters - base repos first
     * @ai-side-effects Creates database tables, initializes all repos
     * @ai-assumption Database directory exists or can be created
     */
    private initializeAsync;
    /**
     * @ai-intent Facade method for status retrieval
     * @ai-flow 1. Ensure initialized -> 2. Delegate to repository
     * @ai-pattern Delegation with initialization guard
     * @ai-why All public methods must wait for initialization
     * @ai-return Array of all workflow statuses
     */
    getAllStatuses(): Promise<import("./index.js").Status[]>;
    /**
     * @ai-intent Legacy async method for backward compatibility
     * @ai-flow Simple delegation to getAllStatuses
     * @ai-deprecated Use getAllStatuses() directly
     * @ai-why Historical API - kept for compatibility
     */
    getAllStatusesAsync(): Promise<import("./index.js").Status[]>;
    /**
     * @ai-intent Create new workflow status
     * @ai-flow 1. Wait for init -> 2. Create in SQLite -> 3. Return with ID
     * @ai-side-effects Inserts into statuses table
     * @ai-validation Name uniqueness checked by repository
     * @ai-return New status object with generated ID
     */
    createStatus(name: string, is_closed?: boolean): Promise<import("./index.js").Status>;
    /**
     * @ai-intent Update existing status name
     * @ai-flow 1. Wait for init -> 2. Update in SQLite -> 3. Return updated
     * @ai-validation Status must exist, name must be unique
     * @ai-critical Cannot update if status in use by items
     * @ai-return Updated status object or null if not found
     */
    updateStatus(id: number, name: string, is_closed?: boolean): Promise<boolean>;
    /**
     * @ai-intent Delete workflow status
     * @ai-flow 1. Wait for init -> 2. Check usage -> 3. Delete if unused
     * @ai-validation Fails if status is referenced by any items
     * @ai-critical Preserves referential integrity
     * @ai-return true if deleted, false if not found or in use
     */
    deleteStatus(id: number): Promise<boolean>;
    /**
     * @ai-section Tag Operations
     * @ai-intent Retrieve all tags with usage counts
     * @ai-flow 1. Wait for init -> 2. Query tags table -> 3. Return with counts
     * @ai-performance Counts calculated via SQL joins
     * @ai-return Array of tags with name and usage count
     */
    getTags(): Promise<import("./index.js").Tag[]>;
    /**
     * @ai-intent Create new tag for categorization
     * @ai-flow 1. Wait for init -> 2. Insert into tags table
     * @ai-validation Tag names must be unique (case-insensitive)
     * @ai-side-effects Creates tag in SQLite only
     * @ai-return Created tag object
     */
    createTag(name: string): Promise<string>;
    /**
     * @ai-intent Delete tag by name (not ID despite parameter name)
     * @ai-flow 1. Wait for init -> 2. Delete from tags table
     * @ai-critical Parameter is tag NAME not ID - naming inconsistency
     * @ai-side-effects Removes tag associations from all items
     * @ai-return true if deleted, false if not found
     */
    deleteTag(id: string): Promise<boolean>;
    /**
     * @ai-intent Search tags by name pattern
     * @ai-flow 1. Wait for init -> 2. SQL LIKE query -> 3. Return matches
     * @ai-pattern Case-insensitive substring matching
     * @ai-performance Uses SQL LIKE operator with % wildcards
     * @ai-return Array of matching tags with usage counts
     */
    searchTags(pattern: string): Promise<import("./index.js").Tag[]>;
    /**
     * @ai-section Unified Document Operations (replaces getAllKnowledge, getAllDocs)
     * @ai-intent Retrieve all documents of specified type
     * @ai-flow 1. Wait for init -> 2. Read document files -> 3. Parse content
     * @ai-return Array of document objects with content
     */
    getAllDocuments(type?: string): Promise<import("./index.js").Document[]>;
    /**
     * @ai-intent Get single document by type and ID
     * @ai-flow 1. Wait for init -> 2. Read from markdown
     * @ai-return Complete document object or null
     */
    getDocument(type: string, id: number): Promise<import("./index.js").Document | null>;
    /**
     * @ai-intent Create new document of any type
     * @ai-flow 1. Wait for init -> 2. Generate ID -> 3. Save markdown -> 4. Index
     * @ai-side-effects Creates file and search index entry
     * @ai-return Complete document object
     */
    createDocument(type: string, title: string, content: string, tags?: string[], description?: string, related_tasks?: string[], related_documents?: string[]): Promise<import("./index.js").Document>;
    /**
     * @ai-intent Update document content by type and ID
     * @ai-flow 1. Wait for init -> 2. Read current -> 3. Apply changes -> 4. Reindex
     * @ai-pattern Partial updates allowed
     * @ai-return true if updated, false if not found
     */
    updateDocument(type: string, id: number, title?: string, content?: string, tags?: string[], description?: string, related_tasks?: string[], related_documents?: string[]): Promise<boolean>;
    /**
     * @ai-intent Delete document by type and ID
     * @ai-flow 1. Wait for init -> 2. Delete files and index
     * @ai-critical Permanent deletion
     * @ai-return true if deleted, false if not found
     */
    deleteDocument(type: string, id: number): Promise<boolean>;
    /**
     * @ai-intent Find documents by tag and optional type filter
     * @ai-flow 1. Wait for init -> 2. Query search index -> 3. Filter exact
     * @ai-pattern Tag exact match in JSON array
     * @ai-return Array of matching document items
     */
    searchDocumentsByTag(tag: string, type?: string): Promise<import("./index.js").Document[]>;
    /**
     * @ai-intent Get document summary list without content
     * @ai-flow 1. Wait for init -> 2. Get all docs -> 3. Extract summaries
     * @ai-performance Avoids loading full content
     * @ai-return Array of summary objects
     */
    getAllDocumentsSummary(type?: string): Promise<import("./index.js").DocumentSummary[]>;
    /**
     * @ai-section Unified Task Operations
     * @ai-intent Get task by type and ID through unified interface
     * @ai-logic Validates type from sequences table
     */
    getTask(type: string, id: number): Promise<import("./index.js").Issue | import("./index.js").Plan | null>;
    /**
     * @ai-intent Create task through unified interface
     * @ai-logic Validates type from sequences table
     */
    createTask(type: string, title: string, content?: string, priority?: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<import("./index.js").Issue | import("./index.js").Plan>;
    /**
     * @ai-intent Get all tasks summary through unified interface
     * @ai-logic Validates type from sequences table
     */
    getAllTasksSummary(type: string, includeClosedStatuses?: boolean, statusIds?: number[]): Promise<import("./index.js").IssueSummary[] | import("./index.js").PlanSummary[]>;
    /**
     * @ai-intent Update task through unified interface
     * @ai-logic Validates type from sequences table
     */
    updateTask(type: string, id: number, title?: string, content?: string, priority?: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<import("./index.js").Issue | import("./index.js").Plan | null>;
    /**
     * @ai-intent Delete task through unified interface
     * @ai-logic Validates type from sequences table
     */
    deleteTask(type: string, id: number): Promise<boolean>;
    /**
     * @ai-intent Search tasks by tag through unified interface
     * @ai-logic Validates type from sequences table
     */
    searchTasksByTag(type: string, tag: string): Promise<(import("./index.js").Issue | import("./index.js").Plan)[]>;
    /**
     * @ai-section Global Search Operations
     * @ai-intent Full-text search across all content types
     * @ai-flow 1. Wait for init -> 2. Search all tables -> 3. Merge results
     * @ai-performance Uses SQLite FTS for efficiency
     * @ai-return Categorized results by type
     */
    searchAll(query: string): Promise<{
        issues: import("./index.js").Issue[];
        plans: import("./index.js").Plan[];
        knowledge: import("./index.js").Document[];
    }>;
    /**
     * @ai-intent Search all content types by tag
     * @ai-flow 1. Wait for init -> 2. Query each type -> 3. Aggregate
     * @ai-pattern Exact tag match across all repositories
     * @ai-return Categorized results by content type
     */
    searchAllByTag(tag: string): Promise<{
        issues: import("./index.js").Issue[];
        plans: import("./index.js").Plan[];
        docs: import("./index.js").Document[];
        knowledge: import("./index.js").Document[];
        sessions: WorkSession[];
    }>;
    /**
     * @ai-intent Full-text search work sessions
     * @ai-flow 1. Wait for init -> 2. Query search_sessions
     * @ai-performance SQLite query on indexed content
     * @ai-return Array of matching sessions
     */
    searchSessions(query: string): Promise<any[]>;
    /**
     * @ai-intent Search daily summaries content
     * @ai-flow 1. Wait for init -> 2. Query search_daily_summaries
     * @ai-return Array of matching summaries
     */
    searchDailySummaries(query: string): Promise<any[]>;
    /**
     * @ai-intent Find sessions with specific tag
     * @ai-flow 1. Wait for init -> 2. Tag search in sessions
     * @ai-return Array of matching sessions
     */
    searchSessionsByTag(tag: string): Promise<any[]>;
    /**
     * @ai-intent Rebuild SQLite search index from markdown files
     * @ai-flow 1. Wait for init -> 2. Clear tables -> 3. Re-sync all content
     * @ai-critical Used for database recovery
     * @ai-side-effects Recreates all search tables
     * @ai-performance Can be slow with many files
     */
    rebuildSearchIndex(): Promise<void>;
    /**
     * @ai-section Session Management
     * @ai-intent Sync work session to SQLite for searching
     * @ai-flow 1. Wait for init -> 2. Ensure tags -> 3. UPSERT to search table -> 4. Update tag relationships
     * @ai-side-effects Creates tags if needed, updates search_sessions and session_tags
     * @ai-critical Called after markdown write for consistency
     * @ai-assumption Session object has expected properties
     * @ai-database-schema Uses session_tags relationship table for normalized tag storage
     */
    syncSessionToSQLite(session: WorkSession): Promise<void>;
    /**
     * @ai-intent Sync daily summary to SQLite
     * @ai-flow 1. Wait for init -> 2. Ensure tags -> 3. UPSERT summary -> 4. Update tag relationships
     * @ai-side-effects Updates search_daily_summaries table and summary_tags
     * @ai-critical Date is primary key - one summary per day
     * @ai-assumption Summary has required date and title fields
     * @ai-database-schema Uses summary_tags relationship table for normalized tag storage
     */
    syncDailySummaryToSQLite(summary: DailySummary): Promise<void>;
    /**
     * @ai-intent Clean shutdown of database connections
     * @ai-flow 1. Close SQLite connection -> 2. Flush pending writes
     * @ai-critical Must be called on process exit
     * @ai-side-effects Terminates all database operations
     */
    close(): void;
}
