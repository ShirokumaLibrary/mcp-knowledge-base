import { BaseRepository, Database } from './base.js';
import { Issue, IssueInternal, IssueSummary } from '../types/domain-types.js';
import { IStatusRepository } from '../types/repository-interfaces.js';
import { TagRepository } from './tag-repository.js';
/**
 * @ai-context Repository for issue management with dual storage strategy
 * @ai-pattern Repository pattern with file-based primary storage and SQLite cache
 * @ai-critical Maintains consistency between markdown files and search database
 * @ai-dependencies StatusRepository (status lookups), TagRepository (tag validation)
 * @ai-lifecycle Files are source of truth, SQLite is rebuilt from files if needed
 */
export declare class IssueRepository extends BaseRepository {
    private issuesDir;
    private statusRepository;
    private tagRepository;
    constructor(db: Database, issuesDir: string, statusRepository: IStatusRepository, tagRepository?: TagRepository);
    private ensureDirectoryExists;
    private getNextId;
    private getIssueFilePath;
    /**
     * @ai-intent Parse markdown file content into Issue object
     * @ai-flow 1. Extract YAML frontmatter -> 2. Validate required fields -> 3. Apply defaults
     * @ai-edge-case Returns null for invalid/incomplete data
     * @ai-assumption Markdown files use YAML frontmatter format
     * @ai-why Graceful handling of corrupted files prevents system crashes
     */
    private parseMarkdownIssue;
    /**
     * @ai-intent Convert internal issue representation to external API format
     * @ai-logic Removes status_id from the response
     * @ai-critical Ensures internal IDs are not exposed in API responses
     */
    private toExternalIssue;
    /**
     * @ai-intent Persist issue to markdown file with complete metadata
     * @ai-side-effects Writes to file system, modifies issue.status field
     * @ai-critical File write must be atomic to prevent data corruption
     * @ai-why Status name stored redundantly to support database rebuilds
     */
    private writeMarkdownIssue;
    /**
     * @ai-intent Sync issue data to SQLite for fast searching and filtering
     * @ai-flow 1. Prepare data -> 2. Execute UPSERT -> 3. Update tag relationships
     * @ai-side-effects Updates search_issues table and issue_tags relationship table
     * @ai-performance Uses INSERT OR REPLACE for idempotent operations
     * @ai-assumption SQLite table schema matches Issue type structure
     * @ai-database-schema Uses issue_tags relationship table for normalized tag storage
     */
    syncIssueToSQLite(issue: IssueInternal): Promise<void>;
    /**
     * @ai-intent Load all issues from markdown files
     * @ai-flow 1. List files -> 2. Read in parallel -> 3. Parse & validate -> 4. Sort by ID
     * @ai-performance Parallel file reads for better performance
     * @ai-error-handling Silently skips corrupted files to maintain system stability
     * @ai-return Always returns array, empty if no valid issues found
     * @ai-params
     *   - includeClosedStatuses: If false (default), excludes issues with closed statuses
     *   - statusIds: If provided, only returns issues with these status IDs
     */
    getAllIssues(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<Issue[]>;
    getAllIssuesSummary(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<IssueSummary[]>;
    createIssue(title: string, content?: string, priority?: string, status?: string, tags?: string[]): Promise<Issue>;
    updateIssue(id: number, title?: string, content?: string, priority?: string, status?: string, tags?: string[]): Promise<boolean>;
    deleteIssue(id: number): Promise<boolean>;
    getIssue(id: number): Promise<Issue | null>;
    /**
     * @ai-intent Search issues by exact tag match using relationship table
     * @ai-flow 1. Get tag ID -> 2. JOIN with issue_tags -> 3. Load full issues
     * @ai-performance Uses indexed JOIN instead of LIKE search
     * @ai-database-schema Leverages issue_tags relationship table
     */
    searchIssuesByTag(tag: string): Promise<Issue[]>;
}
