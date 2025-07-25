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
    private issueRepo;
    private planRepo;
    private knowledgeRepo;
    private docRepo;
    private searchRepo;
    private initializationPromise;
    constructor(dataDir: string, dbPath?: string);
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
     * @ai-section Issue Operations
     * @ai-intent Retrieve all issues with full details
     * @ai-flow 1. Wait for init -> 2. Read all markdown files -> 3. Parse and return
     * @ai-performance O(n) file reads - consider pagination for scale
     * @ai-return Array of complete issue objects sorted by ID
     */
    getAllIssues(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<import("./index.js").Issue[]>;
    /**
     * @ai-intent Get lightweight issue list for UI display
     * @ai-flow 1. Wait for init -> 2. Query SQLite -> 3. Return summaries
     * @ai-performance Uses indexed SQLite query vs file reads
     * @ai-return Array with id, title, priority, status fields only
     */
    getAllIssuesSummary(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<import("./index.js").IssueSummary[]>;
    /**
     * @ai-intent Create new issue with optional metadata
     * @ai-flow 1. Wait for init -> 2. Generate ID -> 3. Write markdown -> 4. Sync SQLite
     * @ai-side-effects Creates markdown file and SQLite record
     * @ai-defaults Priority: 'medium', Status: 1 (default status)
     * @ai-return Complete issue object with generated ID
     */
    createIssue(title: string, description?: string, priority?: string, status?: string, tags?: string[], summary?: string): Promise<import("./index.js").Issue>;
    /**
     * @ai-intent Update existing issue with partial changes
     * @ai-flow 1. Wait for init -> 2. Read current -> 3. Merge changes -> 4. Write both stores
     * @ai-pattern Partial update - undefined values preserve existing
     * @ai-validation Issue must exist, status_id must be valid
     * @ai-return Updated issue object or null if not found
     */
    updateIssue(id: number, title?: string, description?: string, priority?: string, status?: string, tags?: string[], summary?: string): Promise<boolean>;
    /**
     * @ai-intent Delete issue permanently
     * @ai-flow 1. Wait for init -> 2. Delete markdown -> 3. Delete from SQLite
     * @ai-side-effects Removes file and database record
     * @ai-critical No soft delete - permanent removal
     * @ai-return true if deleted, false if not found
     */
    deleteIssue(id: number): Promise<boolean>;
    /**
     * @ai-intent Retrieve single issue by ID
     * @ai-flow 1. Wait for init -> 2. Read markdown file -> 3. Parse and return
     * @ai-source Markdown file is source of truth
     * @ai-return Complete issue object or null if not found
     */
    getIssue(id: number): Promise<import("./index.js").Issue | null>;
    /**
     * @ai-section Plan Operations
     * @ai-intent Retrieve all plans with timeline data
     * @ai-flow 1. Wait for init -> 2. Read plan files -> 3. Parse with dates
     * @ai-critical Plans include start/end dates for scheduling
     * @ai-return Array of plan objects sorted by ID
     */
    getAllPlans(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<import("./index.js").Plan[]>;
    /**
     * @ai-intent Create new plan with timeline
     * @ai-flow 1. Wait for init -> 2. Validate dates -> 3. Create files -> 4. Sync
     * @ai-validation Start date must be before end date
     * @ai-pattern Dates in YYYY-MM-DD format
     * @ai-return Complete plan object with generated ID
     */
    createPlan(title: string, description?: string, priority?: string, status?: string, start_date?: string, end_date?: string, tags?: string[], summary?: string): Promise<import("./index.js").Plan>;
    /**
     * @ai-intent Update plan including timeline adjustments
     * @ai-flow 1. Wait for init -> 2. Read current -> 3. Validate changes -> 4. Update
     * @ai-validation New dates must maintain start <= end relationship
     * @ai-pattern Partial updates preserve unspecified fields
     * @ai-return Updated plan or null if not found
     */
    updatePlan(id: number, title?: string, description?: string, priority?: string, status?: string, start_date?: string, end_date?: string, tags?: string[], summary?: string): Promise<boolean>;
    /**
     * @ai-intent Delete plan permanently
     * @ai-flow 1. Wait for init -> 2. Remove markdown -> 3. Clean SQLite
     * @ai-critical No cascade to related items
     * @ai-return true if deleted, false if not found
     */
    deletePlan(id: number): Promise<boolean>;
    /**
     * @ai-intent Retrieve single plan with timeline
     * @ai-flow 1. Wait for init -> 2. Read from markdown
     * @ai-return Complete plan object or null
     */
    getPlan(id: number): Promise<import("./index.js").Plan | null>;
    /**
     * @ai-intent Find issues with specific tag
     * @ai-flow 1. Wait for init -> 2. Query SQLite -> 3. Filter exact matches
     * @ai-pattern Exact tag match, case-sensitive
     * @ai-performance Uses SQLite index on tags column
     * @ai-return Array of matching issues
     */
    searchIssuesByTag(tag: string): Promise<import("./index.js").Issue[]>;
    /**
     * @ai-intent Find plans with specific tag
     * @ai-flow 1. Wait for init -> 2. Query search_plans -> 3. Filter matches
     * @ai-pattern Exact tag match within JSON array
     * @ai-return Array of matching plans with timeline data
     */
    searchPlansByTag(tag: string): Promise<import("./index.js").Plan[]>;
    /**
     * @ai-section Knowledge Base Operations
     * @ai-intent Retrieve all knowledge articles
     * @ai-flow 1. Wait for init -> 2. Read knowledge files -> 3. Parse content
     * @ai-pattern Knowledge items are reference documentation
     * @ai-return Array of knowledge objects with content
     */
    getAllKnowledge(): Promise<import("./index.js").Knowledge[]>;
    /**
     * @ai-intent Create new knowledge article
     * @ai-flow 1. Wait for init -> 2. Generate ID -> 3. Save markdown -> 4. Index
     * @ai-validation Content is required for knowledge items
     * @ai-side-effects Creates file and search index entry
     * @ai-return Complete knowledge object
     */
    createKnowledge(title: string, content: string, tags?: string[], summary?: string): Promise<import("./index.js").Knowledge>;
    /**
     * @ai-intent Update knowledge article content
     * @ai-flow 1. Wait for init -> 2. Read current -> 3. Apply changes -> 4. Reindex
     * @ai-pattern Partial updates allowed
     * @ai-return Updated knowledge or null
     */
    updateKnowledge(id: number, title?: string, content?: string, tags?: string[], summary?: string): Promise<boolean>;
    /**
     * @ai-intent Delete knowledge article
     * @ai-flow 1. Wait for init -> 2. Delete files and index
     * @ai-critical Permanent deletion
     * @ai-return true if deleted, false if not found
     */
    deleteKnowledge(id: number): Promise<boolean>;
    /**
     * @ai-intent Retrieve single knowledge article
     * @ai-flow 1. Wait for init -> 2. Read from markdown
     * @ai-return Complete knowledge object or null
     */
    getKnowledge(id: number): Promise<import("./index.js").Knowledge | null>;
    /**
     * @ai-intent Find knowledge articles by tag
     * @ai-flow 1. Wait for init -> 2. Query search index -> 3. Filter exact
     * @ai-pattern Tag exact match in JSON array
     * @ai-return Array of matching knowledge items
     */
    searchKnowledgeByTag(tag: string): Promise<import("./index.js").Knowledge[]>;
    /**
     * @ai-section Documentation Operations
     * @ai-intent Retrieve all technical documentation
     * @ai-flow 1. Wait for init -> 2. Read doc files -> 3. Parse all
     * @ai-critical Docs can be large - memory consideration
     * @ai-return Array of complete doc objects
     */
    getAllDocs(): Promise<import("./index.js").Doc[]>;
    /**
     * @ai-intent Get doc list without content
     * @ai-flow 1. Wait for init -> 2. Get all docs -> 3. Extract summaries
     * @ai-performance Avoids loading full content
     * @ai-return Array of {id, title} objects only
     */
    getDocsSummary(): Promise<import("./index.js").DocSummary[]>;
    /**
     * @ai-intent Create new documentation
     * @ai-flow 1. Wait for init -> 2. Generate ID -> 3. Save -> 4. Index
     * @ai-validation Content required for docs
     * @ai-return Complete doc object
     */
    createDoc(title: string, content: string, tags?: string[], summary?: string): Promise<import("./index.js").Doc>;
    /**
     * @ai-intent Update documentation content
     * @ai-flow 1. Wait for init -> 2. Update markdown and index
     * @ai-pattern Partial updates supported
     * @ai-return Updated doc or null
     */
    updateDoc(id: number, title?: string, content?: string, tags?: string[], summary?: string): Promise<import("./index.js").Doc | null>;
    /**
     * @ai-intent Delete documentation
     * @ai-flow 1. Wait for init -> 2. Remove files and index
     * @ai-return true if deleted, false if not found
     */
    deleteDoc(id: number): Promise<boolean>;
    /**
     * @ai-intent Retrieve single documentation
     * @ai-flow 1. Wait for init -> 2. Read from markdown
     * @ai-return Complete doc object or null
     */
    getDoc(id: number): Promise<import("./index.js").Doc | null>;
    /**
     * @ai-intent Find docs by tag
     * @ai-flow 1. Wait for init -> 2. Query search_docs table
     * @ai-return Array of matching docs
     */
    searchDocsByTag(tag: string): Promise<import("./index.js").Doc[]>;
    /**
     * @ai-intent Get lightweight plan list for UI display
     * @ai-flow 1. Wait for init -> 2. Query SQLite -> 3. Return summaries
     * @ai-performance Uses indexed SQLite query vs file reads
     * @ai-return Array with key fields including timeline data
     */
    getAllPlansSummary(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<import("./index.js").PlanSummary[]>;
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
        knowledge: import("./index.js").Knowledge[];
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
        docs: import("./index.js").Doc[];
        knowledge: import("./index.js").Knowledge[];
        sessions: import("../types/session-types.js").WorkSession[];
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
    syncSessionToSQLite(session: any): Promise<void>;
    /**
     * @ai-intent Sync daily summary to SQLite
     * @ai-flow 1. Wait for init -> 2. Ensure tags -> 3. UPSERT summary -> 4. Update tag relationships
     * @ai-side-effects Updates search_daily_summaries table and summary_tags
     * @ai-critical Date is primary key - one summary per day
     * @ai-assumption Summary has required date and title fields
     * @ai-database-schema Uses summary_tags relationship table for normalized tag storage
     */
    syncDailySummaryToSQLite(summary: any): Promise<void>;
    /**
     * @ai-intent Clean shutdown of database connections
     * @ai-flow 1. Close SQLite connection -> 2. Flush pending writes
     * @ai-critical Must be called on process exit
     * @ai-side-effects Terminates all database operations
     */
    close(): void;
}
