/**
 * @ai-context Manager orchestrating session and summary operations
 * @ai-pattern Facade pattern over repository and search services
 * @ai-critical Primary interface for session tracking functionality
 * @ai-dependencies Repository for storage, SearchService for queries
 * @ai-assumption Sessions organized by date (YYYY-MM-DD folders)
 */
import { WorkSession, DailySummary } from './types/session-types.js';
import { FileIssueDatabase } from './database.js';
/**
 * @ai-context Central manager for work tracking and daily summaries
 * @ai-pattern Service layer coordinating multiple subsystems
 * @ai-lifecycle Create sessions -> Track work -> Generate summaries
 * @ai-critical All session operations flow through this manager
 * @ai-why Simplifies API for handlers, encapsulates complexity
 */
export declare class WorkSessionManager {
    private db;
    private repository;
    private searchService;
    private formatter;
    /**
     * @ai-intent Initialize session management system
     * @ai-flow 1. Create repository -> 2. Setup search -> 3. Init formatter
     * @ai-defaults Sessions stored in database/sessions directory
     * @ai-dependencies Database required for SQLite search sync
     * @ai-assumption Directory will be created if missing
     */
    constructor(sessionsDir: string | undefined, db: FileIssueDatabase);
    /**
     * @ai-intent Generate unique session ID from timestamp
     * @ai-flow 1. Get current time -> 2. Format components -> 3. Concatenate
     * @ai-pattern YYYYMMDD-HHMMSSsss format for chronological sorting
     * @ai-critical IDs embed date for directory organization
     * @ai-assumption Millisecond precision prevents collisions
     * @ai-example 20240115-143052123 (Jan 15, 2024, 2:30:52.123 PM)
     */
    private generateSessionId;
    /**
     * @ai-intent Create new work session
     * @ai-flow 1. Generate ID -> 2. Build object -> 3. Save to storage
     * @ai-side-effects Creates markdown file, syncs to SQLite
     * @ai-critical Session saved immediately - no in-memory state
     * @ai-pattern Optional ID allows session import/migration
     * @ai-return Complete session object with generated metadata
     */
    createSession(title: string, content?: string, tags?: string[], category?: string, id?: string): WorkSession;
    /**
     * @ai-intent Update existing work session
     * @ai-flow 1. Extract date from ID -> 2. Load current -> 3. Merge changes -> 4. Save
     * @ai-validation Session must exist or throws error
     * @ai-pattern Partial updates - undefined preserves existing values
     * @ai-critical Date extracted from session ID for directory lookup
     * @ai-error-handling Throws descriptive error if session not found
     */
    updateSession(id: string, title?: string, content?: string, tags?: string[], category?: string): WorkSession;
    /**
     * @ai-intent Retrieve session by ID
     * @ai-flow 1. Extract date from ID -> 2. Load from repository
     * @ai-assumption Session ID format: YYYYMMDD-HHMMSSsss
     * @ai-return Session object or null if not found
     * @ai-why Date needed to locate correct directory
     */
    getSession(sessionId: string): WorkSession | null;
    /**
     * @ai-intent Get most recent session from today
     * @ai-flow 1. Get today's date -> 2. Load all sessions -> 3. Find latest
     * @ai-performance Loads all today's sessions - OK for typical usage
     * @ai-assumption Session IDs sort chronologically (timestamp format)
     * @ai-return Latest session or null if none today
     * @ai-why Used for continuing work from previous session
     */
    getLatestSession(): WorkSession | null;
    /**
     * @ai-intent Create daily work summary
     * @ai-flow 1. Build summary object -> 2. Save to date folder
     * @ai-validation Date format: YYYY-MM-DD
     * @ai-side-effects Creates markdown file, syncs to SQLite
     * @ai-critical One summary per date - overwrites existing
     * @ai-return Complete summary object
     */
    createDailySummary(date: string, title: string, content: string, tags?: string[]): DailySummary;
    /**
     * @ai-intent Update existing daily summary
     * @ai-flow 1. Load current -> 2. Merge changes -> 3. Save updated
     * @ai-validation Summary must exist for date
     * @ai-pattern Uses || for defaults (differs from session undefined check)
     * @ai-bug Empty string updates ignored due to || operator
     * @ai-return Updated summary object
     */
    updateDailySummary(date: string, title?: string, content?: string, tags?: string[]): DailySummary;
    /**
     * @ai-section Search Operations
     * @ai-intent Search sessions by exact tag match
     * @ai-flow Delegates to search service for file-based search
     * @ai-performance O(n) file reads - consider SQLite for scale
     * @ai-return Array of complete session objects
     */
    searchSessionsByTag(tag: string): WorkSession[];
    /**
     * @ai-intent Fast full-text search using SQLite
     * @ai-flow Delegates to search service SQLite query
     * @ai-performance Indexed search - much faster than file scan
     * @ai-async Required for database operations
     * @ai-return Promise of matching sessions
     */
    searchSessionsFast(query: string): Promise<WorkSession[]>;
    /**
     * @ai-intent Fast tag search via SQLite
     * @ai-flow Uses indexed tag column for performance
     * @ai-pattern Exact tag match in CSV format
     * @ai-return Promise of matching sessions
     */
    searchSessionsByTagFast(tag: string): Promise<WorkSession[]>;
    /**
     * @ai-intent Search daily summaries via SQLite
     * @ai-flow Full-text search on summary content
     * @ai-return Promise of matching summaries
     */
    searchDailySummariesFast(query: string): Promise<DailySummary[]>;
    /**
     * @ai-intent File-based full-text search
     * @ai-flow Scans all session files for query
     * @ai-performance Slow but accurate - reads every file
     * @ai-why Backup search when SQLite out of sync
     * @ai-return Array of complete sessions
     */
    searchSessionsDetailed(query: string): WorkSession[];
    /**
     * @ai-intent Get sessions within date range
     * @ai-flow Delegates to repository for date filtering
     * @ai-defaults No params = today's sessions only
     * @ai-pattern Dates in YYYY-MM-DD format
     * @ai-return Chronologically ordered sessions
     */
    getSessions(startDate?: string, endDate?: string): WorkSession[];
    /**
     * @ai-intent Get session by ID (searches all dates)
     * @ai-flow Scans all date directories for session
     * @ai-performance O(n) directory scan - consider caching
     * @ai-return Session or null if not found
     */
    getSessionDetail(sessionId: string): WorkSession | null;
    /**
     * @ai-intent Get daily summaries within range
     * @ai-flow Delegates to repository
     * @ai-defaults No params = last 7 days
     * @ai-return Array of summaries in date order
     */
    getDailySummaries(startDate?: string, endDate?: string): DailySummary[];
    /**
     * @ai-intent Get specific daily summary
     * @ai-flow Direct repository load by date
     * @ai-validation Date format: YYYY-MM-DD
     * @ai-return Summary or null if not found
     */
    getDailySummaryDetail(date: string): DailySummary | null;
}
