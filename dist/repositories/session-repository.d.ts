import { WorkSession, DailySummary } from '../types/session-types.js';
import { FileIssueDatabase } from '../database.js';
/**
 * @ai-context Repository for work session tracking and daily summaries
 * @ai-pattern Date-based directory structure for chronological organization
 * @ai-critical Sessions are time-based records - preserve chronological order
 * @ai-dependencies Formatter for markdown generation, Database for search sync
 * @ai-assumption Sessions organized by date folders (YYYY-MM-DD)
 */
export declare class SessionRepository {
    private sessionsDir;
    private db;
    private formatter;
    constructor(sessionsDir: string, db: FileIssueDatabase);
    private ensureSessionsDirectory;
    ensureDailyDirectory(date: string): string;
    /**
     * @ai-intent Save work session to markdown file and sync to database
     * @ai-flow 1. Create date directory -> 2. Generate markdown -> 3. Write file -> 4. Sync DB
     * @ai-side-effects Creates directory, writes file, updates SQLite
     * @ai-critical Session IDs include timestamp for uniqueness
     * @ai-error-handling SQLite errors ignored for test compatibility
     * @ai-why Legacy format support for backward compatibility
     */
    saveSession(session: WorkSession): void;
    loadSession(sessionId: string, date: string): WorkSession | null;
    /**
     * @ai-intent Retrieve all sessions for a specific date
     * @ai-flow 1. Check directory -> 2. List session files -> 3. Parse each -> 4. Return array
     * @ai-performance Synchronous reads OK for daily session counts
     * @ai-assumption Session files named 'session-{id}.md'
     * @ai-return Empty array if no sessions or directory missing
     */
    getSessionsForDate(date: string): WorkSession[];
    saveDailySummary(summary: DailySummary): void;
    loadDailySummary(date: string): DailySummary | null;
    /**
     * @ai-intent Find all sessions tagged with specific tag across all dates
     * @ai-flow 1. Scan date dirs -> 2. Read files -> 3. Quick tag check -> 4. Full parse if match
     * @ai-performance O(n) where n is total session count - consider indexing for scale
     * @ai-logic Regex parsing for performance vs full markdown parse
     * @ai-assumption Tags in frontmatter follow specific format
     * @ai-edge-case Non-directory files in sessions folder ignored
     */
    searchSessionsByTag(tag: string): WorkSession[];
    searchSessionsFullText(query: string): WorkSession[];
    getSessions(startDate?: string, endDate?: string): WorkSession[];
    getSessionDetail(sessionId: string): WorkSession | null;
    getDailySummaries(startDate?: string, endDate?: string): DailySummary[];
}
