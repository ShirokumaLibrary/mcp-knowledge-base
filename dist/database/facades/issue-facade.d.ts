/**
 * @ai-context Facade for issue management operations
 * @ai-pattern Simplifies issue repository API with defaults and initialization
 * @ai-critical Ensures proper status assignment and initialization
 * @ai-dependencies IssueRepository for persistence, StatusRepository for defaults
 * @ai-why Provides cleaner API and handles async initialization transparently
 */
import { BaseFacade } from './base-facade.js';
import { IssueRepository } from '../issue-repository.js';
import { Issue, IssueSummary } from '../../types/domain-types.js';
import { DatabaseConnection } from '../base.js';
import { StatusRepository } from '../status-repository.js';
import { TagRepository } from '../tag-repository.js';
export declare class IssueFacade extends BaseFacade {
    private issueRepo;
    private initPromise;
    constructor(connection: DatabaseConnection, issueRepo: IssueRepository, // @ai-logic: Main repository for issue operations
    statusRepo: StatusRepository, tagRepo: TagRepository, initPromise?: Promise<void> | null);
    /**
     * @ai-intent Create new issue with smart defaults
     * @ai-flow 1. Ensure init -> 2. Default status to 'Open' -> 3. Create issue
     * @ai-critical Finds 'Open' status or falls back to ID 1
     * @ai-defaults priority: 'medium', status: 'Open', tags: []
     * @ai-side-effects Creates markdown file and SQLite record
     */
    createIssue(title: string, content?: string, priority?: string, status?: string, tags?: string[]): Promise<Issue>;
    getIssue(id: number): Promise<Issue | null>;
    updateIssue(id: number, title?: string, content?: string, priority?: string, status?: string, tags?: string[]): Promise<boolean>;
    deleteIssue(id: number): Promise<boolean>;
    getAllIssues(): Promise<Issue[]>;
    /**
     * @ai-intent Get lightweight issue summaries for lists
     * @ai-performance Excludes description and tags for speed
     * @ai-return Array of summary objects with minimal fields
     * @ai-why Optimized for UI list rendering performance
     */
    getAllIssuesSummary(): Promise<IssueSummary[]>;
    searchIssuesByTag(tag: string): Promise<Issue[]>;
}
