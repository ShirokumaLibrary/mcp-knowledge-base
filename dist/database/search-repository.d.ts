import { BaseRepository, Database } from './base.js';
import { Issue, Plan, Knowledge, Doc } from '../types/domain-types.js';
import { WorkSession } from '../types/session-types.js';
/**
 * @ai-context Centralized search functionality across all content types
 * @ai-pattern Facade pattern for unified search interface
 * @ai-critical Performance-critical - searches must be fast for good UX
 * @ai-dependencies All repository types for fetching full objects after search
 * @ai-assumption SQLite search tables are kept in sync with markdown files
 */
export declare class SearchRepository extends BaseRepository {
    private issueRepository;
    private planRepository;
    private documentRepository;
    private sessionRepository;
    constructor(db: Database, issueRepository: any, planRepository: any, documentRepository: any, sessionRepository?: any);
    /**
     * @ai-intent Full-text search across issues, plans, and knowledge
     * @ai-flow 1. Query search tables -> 2. Get IDs -> 3. Fetch full objects -> 4. Filter nulls
     * @ai-performance Uses LIKE for simple text matching, indexes on title/description
     * @ai-why Two-phase approach: search returns IDs, then fetch full data from files
     * @ai-edge-case Handles deleted files gracefully with filter(Boolean)
     */
    searchAll(query: string): Promise<{
        issues: Issue[];
        plans: Plan[];
        knowledge: Knowledge[];
    }>;
    /**
     * @ai-intent Find all content tagged with specific tag
     * @ai-flow 1. Parallel fetch all content -> 2. Filter by tag -> 3. Return grouped
     * @ai-performance O(n) for issues/plans, optimized for docs/knowledge/sessions
     * @ai-why Mixed approach: some repos have tag search, others need filtering
     * @ai-assumption Tags are exact matches, case-sensitive
     */
    searchAllByTag(tag: string): Promise<{
        issues: Issue[];
        plans: Plan[];
        docs: Doc[];
        knowledge: Knowledge[];
        sessions: WorkSession[];
    }>;
    searchSessions(query: string): Promise<any[]>;
    searchDailySummaries(query: string): Promise<any[]>;
    /**
     * @ai-intent Search daily summaries by exact tag match using relationship table
     * @ai-flow 1. Get tag ID -> 2. JOIN with summary_tags -> 3. Return full summary data
     * @ai-performance Uses indexed JOIN instead of LIKE search
     * @ai-database-schema Leverages summary_tags relationship table
     */
    searchDailySummariesByTag(tag: string): Promise<any[]>;
    /**
     * @ai-intent Search sessions by exact tag match using relationship table
     * @ai-flow 1. Get tag ID -> 2. JOIN with session_tags -> 3. Return full session data
     * @ai-performance Uses indexed JOIN instead of LIKE search
     * @ai-database-schema Leverages session_tags relationship table
     */
    searchSessionsByTag(tag: string): Promise<any[]>;
    /**
     * @ai-intent Rebuild search index from markdown files
     * @ai-flow 1. Clear tables -> 2. Load all content -> 3. Sync to SQLite
     * @ai-side-effects Deletes and recreates all search table data
     * @ai-critical Used for disaster recovery - must be reliable
     * @ai-performance Can be slow with large datasets - consider progress reporting
     * @ai-why Separate from docs/sessions which are handled differently
     */
    rebuildSearchIndex(): Promise<void>;
}
