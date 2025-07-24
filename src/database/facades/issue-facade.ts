/**
 * @ai-context Facade for issue management operations
 * @ai-pattern Simplifies issue repository API with defaults and initialization
 * @ai-critical Ensures proper status assignment and initialization
 * @ai-dependencies IssueRepository for persistence, StatusRepository for defaults
 * @ai-why Provides cleaner API and handles async initialization transparently
 */

import { BaseFacade } from './base-facade.js';
import { IssueRepository } from '../issue-repository.js';
import { Issue } from '../../types/domain-types.js';
import { DatabaseConnection } from '../base.js';
import { StatusRepository } from '../status-repository.js';
import { TagRepository } from '../tag-repository.js';

export class IssueFacade extends BaseFacade {
  constructor(
    connection: DatabaseConnection,
    private issueRepo: IssueRepository,  // @ai-logic: Main repository for issue operations
    statusRepo: StatusRepository,
    tagRepo: TagRepository,
    private initPromise: Promise<void> | null = null  // @ai-pattern: Async initialization tracking
  ) {
    super(connection, statusRepo, tagRepo);
  }

  /**
   * @ai-intent Create new issue with smart defaults
   * @ai-flow 1. Ensure init -> 2. Default status to 'Open' -> 3. Create issue
   * @ai-critical Finds 'Open' status or falls back to ID 1
   * @ai-defaults priority: 'medium', status: 'Open', tags: []
   * @ai-side-effects Creates markdown file and SQLite record
   */
  async createIssue(
    title: string,
    content?: string,
    priority: string = 'medium',
    statusId?: number,
    tags: string[] = []
  ): Promise<Issue> {
    await this.ensureInitialized(this.initPromise);
    if (!statusId) {
      const statuses = await this.statusRepo.getAllStatuses();
      const openStatus = statuses.find(s => s.name === 'Open');  // @ai-logic: Prefer 'Open' status
      statusId = openStatus ? openStatus.id : 1;  // @ai-fallback: Default to ID 1
    }
    return this.issueRepo.createIssue(title, content || '', priority, statusId, tags);
  }

  async getIssue(id: number): Promise<Issue | null> {
    await this.ensureInitialized(this.initPromise);
    return this.issueRepo.getIssue(id);
  }

  async updateIssue(
    id: number,
    title?: string,
    content?: string,
    priority?: string,
    statusId?: number,
    tags?: string[]
  ): Promise<boolean> {
    await this.ensureInitialized(this.initPromise);
    return this.issueRepo.updateIssue(id, title, content, priority, statusId, tags);
  }

  async deleteIssue(id: number): Promise<boolean> {
    await this.ensureInitialized(this.initPromise);
    return this.issueRepo.deleteIssue(id);
  }

  async getAllIssues(): Promise<Issue[]> {
    await this.ensureInitialized(this.initPromise);
    return this.issueRepo.getAllIssues();
  }

  /**
   * @ai-intent Get lightweight issue summaries for lists
   * @ai-performance Excludes description and tags for speed
   * @ai-return Array of summary objects with minimal fields
   * @ai-why Optimized for UI list rendering performance
   */
  async getAllIssuesSummary(): Promise<Array<{
    id: number;
    title: string;
    priority: string;
    status_id: number;
    status?: string;
    created_at: string;
    updated_at: string;
  }>> {
    await this.ensureInitialized(this.initPromise);
    return this.issueRepo.getAllIssuesSummary();
  }

  async searchIssuesByTag(tag: string): Promise<Issue[]> {
    await this.ensureInitialized(this.initPromise);
    return this.issueRepo.searchIssuesByTag(tag);
  }
}