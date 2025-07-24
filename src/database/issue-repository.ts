import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { BaseRepository, Database } from './base.js';
import { Issue } from '../types/domain-types.js';
import { IStatusRepository } from '../types/repository-interfaces.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import { TagRepository } from './tag-repository.js';

/**
 * @ai-context Repository for issue management with dual storage strategy
 * @ai-pattern Repository pattern with file-based primary storage and SQLite cache
 * @ai-critical Maintains consistency between markdown files and search database
 * @ai-dependencies StatusRepository (status lookups), TagRepository (tag validation)
 * @ai-lifecycle Files are source of truth, SQLite is rebuilt from files if needed
 */
export class IssueRepository extends BaseRepository {
  private issuesDir: string;
  private statusRepository: IStatusRepository;
  private tagRepository: TagRepository;

  constructor(db: Database, issuesDir: string, statusRepository: IStatusRepository, tagRepository?: TagRepository) {
    super(db, 'IssueRepository');
    this.issuesDir = issuesDir;
    this.statusRepository = statusRepository;
    this.tagRepository = tagRepository || new TagRepository(db);
    // @ai-async: Directory creation deferred to first operation
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fsPromises.access(this.issuesDir);
    } catch {
      await fsPromises.mkdir(this.issuesDir, { recursive: true });
    }
  }

  private async getNextId(): Promise<number> {
    return this.getNextSequenceValue('issues');
  }

  private getIssueFilePath(id: number): string {
    return path.join(this.issuesDir, `issue-${id}.md`);
  }

  /**
   * @ai-intent Parse markdown file content into Issue object
   * @ai-flow 1. Extract YAML frontmatter -> 2. Validate required fields -> 3. Apply defaults
   * @ai-edge-case Returns null for invalid/incomplete data
   * @ai-assumption Markdown files use YAML frontmatter format
   * @ai-why Graceful handling of corrupted files prevents system crashes
   */
  private parseMarkdownIssue(content: string): Issue | null {
    const { metadata, content: description } = parseMarkdown(content);
    
    // @ai-logic: id and title are minimum required fields
    if (!metadata.id || !metadata.title) return null;

    return {
      id: metadata.id,
      title: metadata.title,
      description: description || null,
      priority: metadata.priority || 'medium',
      status_id: metadata.status_id || 1,
      status: metadata.status,  // @ai-why: Preserves status name for database rebuilds
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: metadata.updated_at || new Date().toISOString()
    };
  }

  /**
   * @ai-intent Persist issue to markdown file with complete metadata
   * @ai-side-effects Writes to file system, modifies issue.status field
   * @ai-critical File write must be atomic to prevent data corruption
   * @ai-why Status name stored redundantly to support database rebuilds
   */
  private async writeMarkdownIssue(issue: Issue): Promise<void> {
    // @ai-logic: Ensure status name is always persisted for rebuild resilience
    if (!issue.status && issue.status_id) {
      const status = await this.statusRepository.getStatus(issue.status_id);
      issue.status = status?.name;
    }
    
    const metadata = {
      id: issue.id,
      title: issue.title,
      priority: issue.priority,
      status_id: issue.status_id,
      status: issue.status,
      tags: issue.tags || [],
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
    
    const content = generateMarkdown(metadata, issue.description || '');
    await fsPromises.writeFile(this.getIssueFilePath(issue.id), content, 'utf8');
  }

  /**
   * @ai-intent Sync issue data to SQLite for fast searching and filtering
   * @ai-flow 1. Prepare data -> 2. Execute UPSERT -> 3. Handle errors
   * @ai-side-effects Updates search_issues table, replaces existing data
   * @ai-performance Uses INSERT OR REPLACE for idempotent operations
   * @ai-assumption SQLite table schema matches Issue type structure
   */
  async syncIssueToSQLite(issue: Issue): Promise<void> {
    await this.db.runAsync(`
      INSERT OR REPLACE INTO search_issues 
      (id, title, description, priority, status_id, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        issue.id, issue.title, issue.description || '', 
        issue.priority, issue.status_id, 
        JSON.stringify(issue.tags || []),  // @ai-why: Tags stored as JSON for flexible querying
        issue.created_at, issue.updated_at
      ]
    );
  }

  /**
   * @ai-intent Load all issues from markdown files
   * @ai-flow 1. List files -> 2. Read in parallel -> 3. Parse & validate -> 4. Sort by ID
   * @ai-performance Parallel file reads for better performance
   * @ai-error-handling Silently skips corrupted files to maintain system stability
   * @ai-return Always returns array, empty if no valid issues found
   */
  async getAllIssues(): Promise<Issue[]> {
    await this.ensureDirectoryExists();
    const files = await fsPromises.readdir(this.issuesDir);
    const issueFiles = files.filter(f => f.startsWith('issue-') && f.endsWith('.md'));
    
    // @ai-performance: Parallel processing with error isolation
    const issuePromises = issueFiles.map(async (file) => {
      try {
        const content = await fsPromises.readFile(path.join(this.issuesDir, file), 'utf8');
        const issue = this.parseMarkdownIssue(content);
        if (issue) {
          const status = await this.statusRepository.getStatus(issue.status_id);
          issue.status = status?.name;
          return issue;
        }
        return null;
      } catch (error) {
        this.logger.error(`Error reading issue file ${file}:`, { error });
        return null;
      }
    });

    const results = await Promise.all(issuePromises);
    const issues = results.filter((issue): issue is Issue => issue !== null);
    return issues.sort((a, b) => a.id - b.id);
  }

  async getAllIssuesSummary(): Promise<Array<{id: number, title: string, priority: string, status_id: number, status?: string, created_at: string, updated_at: string}>> {
    await this.ensureDirectoryExists();
    const files = await fsPromises.readdir(this.issuesDir);
    const issueFiles = files.filter(f => f.startsWith('issue-') && f.endsWith('.md'));
    
    const summaryPromises = issueFiles.map(async (file) => {
      try {
        const content = await fsPromises.readFile(path.join(this.issuesDir, file), 'utf8');
        const issue = this.parseMarkdownIssue(content);
        if (issue) {
          const status = await this.statusRepository.getStatus(issue.status_id);
          return {
            id: issue.id,
            title: issue.title,
            priority: issue.priority,
            status_id: issue.status_id,
            status: status?.name,
            created_at: issue.created_at,
            updated_at: issue.updated_at
          };
        }
        return null;
      } catch (error) {
        this.logger.error(`Error reading issue file ${file}:`, { error });
        return null;
      }
    });

    const results = await Promise.all(summaryPromises);
    const issues = results.filter((issue): issue is NonNullable<typeof issue> => issue !== null);
    return issues.sort((a, b) => a.id - b.id);
  }

  async createIssue(title: string, description?: string, priority: string = 'medium', status_id?: number, tags?: string[]): Promise<Issue> {
    await this.ensureDirectoryExists();
    
    let finalStatusId: number;
    if (!status_id) {
      const statuses = await this.statusRepository.getAllStatuses();
      finalStatusId = statuses.length > 0 ? statuses[0].id : 1;
    } else {
      finalStatusId = status_id;
    }

    const now = new Date().toISOString();
    const issue: Issue = {
      id: await this.getNextId(),
      title,
      description: description || null,
      priority,
      status_id: finalStatusId,
      tags: tags || [],
      created_at: now,
      updated_at: now
    };

    // Ensure tags exist before writing issue
    if (issue.tags && issue.tags.length > 0) {
      await this.tagRepository.ensureTagsExist(issue.tags);
    }

    await this.writeMarkdownIssue(issue);
    await this.syncIssueToSQLite(issue);
    
    const status = await this.statusRepository.getStatus(finalStatusId);
    issue.status = status?.name;
    return issue;
  }

  async updateIssue(id: number, title?: string, description?: string, priority?: string, status_id?: number, tags?: string[]): Promise<boolean> {
    const filePath = this.getIssueFilePath(id);
    
    try {
      await fsPromises.access(filePath);
    } catch {
      return false;
    }

    try {
      const content = await fsPromises.readFile(filePath, 'utf8');
      const issue = this.parseMarkdownIssue(content);
      if (!issue) return false;

      if (title !== undefined) issue.title = title;
      if (description !== undefined) issue.description = description;
      if (priority !== undefined) issue.priority = priority;
      if (status_id !== undefined) issue.status_id = status_id;
      if (tags !== undefined) issue.tags = tags;
      issue.updated_at = new Date().toISOString();

      // Ensure tags exist before writing issue
      if (issue.tags && issue.tags.length > 0) {
        await this.tagRepository.ensureTagsExist(issue.tags);
      }

      await this.writeMarkdownIssue(issue);
      await this.syncIssueToSQLite(issue);
      return true;
    } catch (error) {
      this.logger.error(`Error updating issue ${id}:`, { error });
      return false;
    }
  }

  async deleteIssue(id: number): Promise<boolean> {
    const filePath = this.getIssueFilePath(id);
    
    try {
      await fsPromises.access(filePath);
    } catch {
      return false;
    }

    try {
      await fsPromises.unlink(filePath);
      await this.db.runAsync('DELETE FROM search_issues WHERE id = ?', [id]);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting issue ${id}:`, { error });
      return false;
    }
  }

  async getIssue(id: number): Promise<Issue | null> {
    const filePath = this.getIssueFilePath(id);
    
    try {
      const content = await fsPromises.readFile(filePath, 'utf8');
      const issue = this.parseMarkdownIssue(content);
      if (issue) {
        const status = await this.statusRepository.getStatus(issue.status_id);
        issue.status = status?.name;
      }
      return issue;
    } catch (error) {
      this.logger.error(`Error reading issue ${id}:`, { error });
      return null;
    }
  }

  async searchIssuesByTag(tag: string): Promise<Issue[]> {
    const allIssues = await this.getAllIssues();
    return allIssues.filter(issue => issue.tags && issue.tags.includes(tag));
  }
}