/**
 * @ai-context Manager orchestrating session and summary operations
 * @ai-pattern Facade pattern over repository and search services
 * @ai-critical Primary interface for session tracking functionality
 * @ai-dependencies Repository for storage, SearchService for queries
 * @ai-assumption Sessions organized by date (YYYY-MM-DD folders)
 */
import { SessionRepository } from './repositories/session-repository.js';
import { SessionSearchService } from './services/session-search-service.js';
import { SessionMarkdownFormatter } from './formatters/session-markdown-formatter.js';
import { getConfig } from './config.js';
/**
 * @ai-context Central manager for work tracking and daily summaries
 * @ai-pattern Service layer coordinating multiple subsystems
 * @ai-lifecycle Create sessions -> Track work -> Generate summaries
 * @ai-critical All session operations flow through this manager
 * @ai-why Simplifies API for handlers, encapsulates complexity
 */
export class WorkSessionManager {
    db;
    repository; // @ai-logic: Handles file persistence
    searchService; // @ai-logic: Manages search operations  
    formatter; // @ai-logic: Markdown generation
    /**
     * @ai-intent Initialize session management system
     * @ai-flow 1. Create repository -> 2. Setup search -> 3. Init formatter
     * @ai-defaults Sessions stored in .shirokuma/data/sessions directory
     * @ai-dependencies Database required for SQLite search sync
     * @ai-assumption Directory will be created if missing
     */
    constructor(sessionsDir = getConfig().database.sessionsPath, db) {
        this.db = db;
        this.repository = new SessionRepository(sessionsDir, db);
        this.searchService = new SessionSearchService(db, this.repository);
        this.formatter = new SessionMarkdownFormatter();
    }
    /**
     * @ai-intent Generate unique session ID from timestamp
     * @ai-flow 1. Get current time -> 2. Format components -> 3. Concatenate
     * @ai-pattern YYYY-MM-DD-HH.MM.SS.sss format for better readability
     * @ai-critical IDs embed date for directory organization
     * @ai-assumption Millisecond precision prevents collisions
     * @ai-example 2024-01-15-14.30.52.123 (Jan 15, 2024, 2:30:52.123 PM)
     */
    generateSessionId(date) {
        const now = date || new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // @ai-logic: 0-indexed months
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day}-${hours}.${minutes}.${seconds}.${milliseconds}`;
    }
    /**
     * @ai-intent Create new work session
     * @ai-flow 1. Generate ID -> 2. Build object -> 3. Save to storage
     * @ai-side-effects Creates markdown file, syncs to SQLite
     * @ai-critical Session saved immediately - no in-memory state
     * @ai-pattern Optional ID allows session import/migration
     * @ai-return Complete session object with generated metadata
     */
    createSession(title, content, tags, category, id, // @ai-logic: Custom ID for imports
    datetime // @ai-logic: Custom datetime for past data migration (ISO 8601 format)
    ) {
        const sessionDate = datetime ? new Date(datetime) : new Date();
        const date = sessionDate.toISOString().split('T')[0]; // @ai-pattern: YYYY-MM-DD
        const sessionId = id || this.generateSessionId(sessionDate);
        const session = {
            id: sessionId,
            title,
            content,
            tags,
            category,
            date,
            createdAt: sessionDate.toISOString() // @ai-pattern: ISO 8601 timestamp
        };
        this.repository.saveSession(session); // @ai-critical: Synchronous save
        return session;
    }
    /**
     * @ai-intent Update existing work session
     * @ai-flow 1. Extract date from ID -> 2. Load current -> 3. Merge changes -> 4. Save
     * @ai-validation Session must exist or throws error
     * @ai-pattern Partial updates - undefined preserves existing values
     * @ai-critical Date extracted from session ID for directory lookup
     * @ai-error-handling Throws descriptive error if session not found
     */
    updateSession(id, title, content, tags, category) {
        // @ai-logic: Use getSessionDetail to find session in any date directory
        const session = this.repository.getSessionDetail(id);
        if (!session) {
            throw new Error(`Session ${id} not found`);
        }
        const updatedSession = {
            ...session,
            // @ai-pattern: Explicit undefined check for partial updates
            title: title !== undefined ? title : session.title,
            content: content !== undefined ? content : session.content,
            tags: tags !== undefined ? tags : session.tags,
            category: category !== undefined ? category : session.category,
            updatedAt: new Date().toISOString() // @ai-logic: Track modification time
        };
        this.repository.saveSession(updatedSession);
        return updatedSession;
    }
    /**
     * @ai-intent Retrieve session by ID
     * @ai-flow 1. Extract date from ID -> 2. Load from repository
     * @ai-assumption Session ID format: YYYY-MM-DD-HH.MM.SS.sss
     * @ai-return Session object or null if not found
     * @ai-why Date needed to locate correct directory
     */
    getSession(sessionId) {
        // @ai-logic: Use getSessionDetail to find session in any date directory
        return this.repository.getSessionDetail(sessionId);
    }
    /**
     * @ai-intent Get most recent session from today
     * @ai-flow 1. Get today's date -> 2. Load all sessions -> 3. Find latest
     * @ai-performance Loads all today's sessions - OK for typical usage
     * @ai-assumption Session IDs sort chronologically (timestamp format)
     * @ai-return Latest session or null if none today
     * @ai-why Used for continuing work from previous session
     */
    getLatestSession() {
        const today = new Date().toISOString().split('T')[0];
        const sessions = this.repository.getSessionsForDate(today);
        if (sessions.length === 0) {
            return null; // @ai-edge-case: No sessions today
        }
        // @ai-logic: ID format ensures chronological sorting
        sessions.sort((a, b) => a.id.localeCompare(b.id));
        return sessions[sessions.length - 1];
    }
    /**
     * @ai-intent Create daily work summary
     * @ai-flow 1. Build summary object -> 2. Save to date folder
     * @ai-validation Date format: YYYY-MM-DD
     * @ai-side-effects Creates markdown file, syncs to SQLite
     * @ai-critical One summary per date - overwrites existing
     * @ai-return Complete summary object
     */
    createDailySummary(date, title, content, tags = []) {
        const now = new Date().toISOString();
        const summary = {
            date, // @ai-critical: Primary key for summaries
            title,
            content, // @ai-logic: Main summary text
            tags,
            createdAt: now
        };
        this.repository.saveDailySummary(summary); // @ai-side-effect: Creates new, throws if exists
        return summary;
    }
    /**
     * @ai-intent Update existing daily summary
     * @ai-flow 1. Load current -> 2. Merge changes -> 3. Save updated
     * @ai-validation Summary must exist for date
     * @ai-pattern Uses || for defaults (differs from session undefined check)
     * @ai-bug Empty string updates ignored due to || operator
     * @ai-return Updated summary object
     */
    updateDailySummary(date, title, content, tags) {
        const existing = this.repository.loadDailySummary(date);
        if (!existing) {
            throw new Error(`Daily summary for ${date} not found`);
        }
        const updated = {
            ...existing,
            // @ai-fix: Use !== undefined to allow empty string updates
            title: title !== undefined ? title : existing.title,
            content: content !== undefined ? content : existing.content,
            tags: tags !== undefined ? tags : existing.tags,
            updatedAt: new Date().toISOString()
        };
        this.repository.updateDailySummary(updated);
        return updated;
    }
    /**
     * @ai-section Search Operations
     * @ai-intent Search sessions by exact tag match
     * @ai-flow Delegates to search service for file-based search
     * @ai-performance O(n) file reads - consider SQLite for scale
     * @ai-return Array of complete session objects
     */
    searchSessionsByTag(tag) {
        return this.searchService.searchSessionsByTagDetailed(tag);
    }
    /**
     * @ai-intent Fast full-text search using SQLite
     * @ai-flow Delegates to search service SQLite query
     * @ai-performance Indexed search - much faster than file scan
     * @ai-async Required for database operations
     * @ai-return Promise of matching sessions
     */
    async searchSessionsFast(query) {
        return this.searchService.searchSessionsFast(query);
    }
    /**
     * @ai-intent Fast tag search via SQLite
     * @ai-flow Uses indexed tag column for performance
     * @ai-pattern Exact tag match in CSV format
     * @ai-return Promise of matching sessions
     */
    async searchSessionsByTagFast(tag) {
        return this.searchService.searchSessionsByTagFast(tag);
    }
    /**
     * @ai-intent Search daily summaries via SQLite
     * @ai-flow Full-text search on summary content
     * @ai-return Promise of matching summaries
     */
    async searchDailySummariesFast(query) {
        return this.searchService.searchDailySummariesFast(query);
    }
    /**
     * @ai-intent File-based full-text search
     * @ai-flow Scans all session files for query
     * @ai-performance Slow but accurate - reads every file
     * @ai-why Backup search when SQLite out of sync
     * @ai-return Array of complete sessions
     */
    searchSessionsDetailed(query) {
        return this.searchService.searchSessionsDetailed(query);
    }
    /**
     * @ai-intent Get sessions within date range
     * @ai-flow Delegates to repository for date filtering
     * @ai-defaults No params = today's sessions only
     * @ai-pattern Dates in YYYY-MM-DD format
     * @ai-return Chronologically ordered sessions
     */
    getSessions(startDate, endDate) {
        return this.repository.getSessions(startDate, endDate);
    }
    /**
     * @ai-intent Get session by ID (searches all dates)
     * @ai-flow Scans all date directories for session
     * @ai-performance O(n) directory scan - consider caching
     * @ai-return Session or null if not found
     */
    getSessionDetail(sessionId) {
        return this.repository.getSessionDetail(sessionId);
    }
    /**
     * @ai-intent Get daily summaries within range
     * @ai-flow Delegates to repository
     * @ai-defaults No params = last 7 days
     * @ai-return Array of summaries in date order
     */
    getDailySummaries(startDate, endDate) {
        return this.repository.getDailySummaries(startDate, endDate);
    }
    /**
     * @ai-intent Get specific daily summary
     * @ai-flow Direct repository load by date
     * @ai-validation Date format: YYYY-MM-DD
     * @ai-return Summary or null if not found
     */
    getDailySummaryDetail(date) {
        return this.repository.loadDailySummary(date);
    }
}
//# sourceMappingURL=session-manager.js.map