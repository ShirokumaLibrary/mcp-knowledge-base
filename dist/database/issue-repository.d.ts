import { BaseRepository, Database } from './base.js';
import { Issue } from '../types/domain-types.js';
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
     * @ai-intent Persist issue to markdown file with complete metadata
     * @ai-side-effects Writes to file system, modifies issue.status field
     * @ai-critical File write must be atomic to prevent data corruption
     * @ai-why Status name stored redundantly to support database rebuilds
     */
    private writeMarkdownIssue;
    /**
     * @ai-intent Sync issue data to SQLite for fast searching and filtering
     * @ai-flow 1. Prepare data -> 2. Execute UPSERT -> 3. Handle errors
     * @ai-side-effects Updates search_issues table, replaces existing data
     * @ai-performance Uses INSERT OR REPLACE for idempotent operations
     * @ai-assumption SQLite table schema matches Issue type structure
     */
    syncIssueToSQLite(issue: Issue): Promise<void>;
    /**
     * @ai-intent Load all issues from markdown files
     * @ai-flow 1. List files -> 2. Read in parallel -> 3. Parse & validate -> 4. Sort by ID
     * @ai-performance Parallel file reads for better performance
     * @ai-error-handling Silently skips corrupted files to maintain system stability
     * @ai-return Always returns array, empty if no valid issues found
     */
    getAllIssues(): Promise<Issue[]>;
    getAllIssuesSummary(): Promise<Array<{
        id: number;
        title: string;
        priority: string;
        status_id: number;
        status?: string;
        created_at: string;
        updated_at: string;
    }>>;
    createIssue(title: string, description?: string, priority?: string, status_id?: number, tags?: string[]): Promise<Issue>;
    updateIssue(id: number, title?: string, description?: string, priority?: string, status_id?: number, tags?: string[]): Promise<boolean>;
    deleteIssue(id: number): Promise<boolean>;
    getIssue(id: number): Promise<Issue | null>;
    searchIssuesByTag(tag: string): Promise<Issue[]>;
}
