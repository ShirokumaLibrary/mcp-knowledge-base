import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { BaseRepository, Database } from './base.js';
import { Issue, IssueInternal, IssueSummary } from '../types/domain-types.js';
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
  private readonly sequenceType = 'issues';

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
    return this.getNextSequenceValue(this.sequenceType);
  }

  private getIssueFilePath(id: number): string {
    return path.join(this.issuesDir, this.getEntityFileName(this.sequenceType, id));
  }

  /**
   * @ai-intent Parse markdown file content into Issue object
   * @ai-flow 1. Extract YAML frontmatter -> 2. Validate required fields -> 3. Apply defaults
   * @ai-edge-case Returns null for invalid/incomplete data
   * @ai-assumption Markdown files use YAML frontmatter format
   * @ai-why Graceful handling of corrupted files prevents system crashes
   */
  private async parseMarkdownIssue(content: string): Promise<IssueInternal | null> {
    const { metadata, content: contentBody } = parseMarkdown(content);
    
    // @ai-logic: id and title are minimum required fields
    if (!metadata.id || !metadata.title) return null;

    // @ai-logic: Resolve status_id from status name
    let status_id = 1; // Default to first status
    if (metadata.status) {
      const statuses = await this.statusRepository.getAllStatuses();
      const matchedStatus = statuses.find(s => s.name === metadata.status);
      if (matchedStatus) {
        status_id = matchedStatus.id;
      }
    }

    return {
      id: metadata.id,
      title: metadata.title,
      description: metadata.description || undefined,
      content: contentBody || '',
      priority: metadata.priority || 'medium',
      status_id: status_id,
      status: metadata.status || 'Open',  // @ai-why: Status name is primary storage
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: metadata.updated_at || new Date().toISOString()
    };
  }

  /**
   * @ai-intent Convert internal issue representation to external API format
   * @ai-logic Removes status_id from the response
   * @ai-critical Ensures internal IDs are not exposed in API responses
   */
  private toExternalIssue(internal: IssueInternal): Issue {
    const { status_id, ...external } = internal;
    return external;
  }

  /**
   * @ai-intent Persist issue to markdown file with complete metadata
   * @ai-side-effects Writes to file system, modifies issue.status field
   * @ai-critical File write must be atomic to prevent data corruption
   * @ai-why Status name stored redundantly to support database rebuilds
   */
  private async writeMarkdownIssue(issue: IssueInternal): Promise<void> {
    // @ai-logic: Ensure status name is always persisted for rebuild resilience
    if (!issue.status && issue.status_id) {
      const status = await this.statusRepository.getStatus(issue.status_id);
      issue.status = status?.name;
    }
    
    const metadata = {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      status: issue.status,  // @ai-logic: Only store status name, not ID
      tags: issue.tags || [],
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
    
    const content = generateMarkdown(metadata, issue.content || '');
    await fsPromises.writeFile(this.getIssueFilePath(issue.id), content, 'utf8');
  }

  /**
   * @ai-intent Sync issue data to SQLite for fast searching and filtering
   * @ai-flow 1. Prepare data -> 2. Execute UPSERT -> 3. Update tag relationships
   * @ai-side-effects Updates search_issues table and issue_tags relationship table
   * @ai-performance Uses INSERT OR REPLACE for idempotent operations
   * @ai-assumption SQLite table schema matches Issue type structure
   * @ai-database-schema Uses issue_tags relationship table for normalized tag storage
   */
  async syncIssueToSQLite(issue: IssueInternal): Promise<void> {
    // Update main issue data
    await this.db.runAsync(`
      INSERT OR REPLACE INTO search_issues 
      (id, title, summary, content, priority, status_id, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        issue.id, issue.title, issue.description || '',
        issue.content || '', 
        issue.priority, issue.status_id, 
        JSON.stringify(issue.tags || []),  // @ai-why: Keep for backward compatibility
        issue.created_at, issue.updated_at
      ]
    );
    
    // Update tag relationships
    if (issue.tags && issue.tags.length > 0) {
      await this.tagRepository.saveEntityTags('issue', issue.id, issue.tags);
    } else {
      // Clear all tag relationships if no tags
      await this.db.runAsync('DELETE FROM issue_tags WHERE issue_id = ?', [issue.id]);
    }
  }

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
  async getAllIssues(includeClosedStatuses: boolean = false, statusIds?: number[]): Promise<Issue[]> {
    await this.ensureDirectoryExists();
    const files = await fsPromises.readdir(this.issuesDir);
    const issueFiles = files.filter(f => f.startsWith(`${this.sequenceType}-`) && f.endsWith('.md'));
    
    // Get all statuses to filter by is_closed if needed
    let closedStatusIds: number[] = [];
    if (!includeClosedStatuses && !statusIds) {
      const allStatuses = await this.statusRepository.getAllStatuses();
      closedStatusIds = allStatuses.filter(s => s.is_closed).map(s => s.id);
    }
    
    // @ai-performance: Parallel processing with error isolation
    const issuePromises = issueFiles.map(async (file) => {
      try {
        const content = await fsPromises.readFile(path.join(this.issuesDir, file), 'utf8');
        const issue = await this.parseMarkdownIssue(content);
        if (issue) {
          // Apply status filtering
          if (statusIds && !statusIds.includes(issue.status_id)) {
            return null;
          }
          if (!includeClosedStatuses && !statusIds && closedStatusIds.includes(issue.status_id)) {
            return null;
          }
          
          const status = await this.statusRepository.getStatus(issue.status_id);
          issue.status = status?.name;
          return this.toExternalIssue(issue);
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

  async getAllIssuesSummary(includeClosedStatuses: boolean = false, statusIds?: number[]): Promise<IssueSummary[]> {
    await this.ensureDirectoryExists();
    const files = await fsPromises.readdir(this.issuesDir);
    const issueFiles = files.filter(f => f.startsWith(`${this.sequenceType}-`) && f.endsWith('.md'));
    
    // Get all statuses to filter by is_closed if needed
    let closedStatusIds: number[] = [];
    if (!includeClosedStatuses && !statusIds) {
      const allStatuses = await this.statusRepository.getAllStatuses();
      closedStatusIds = allStatuses.filter(s => s.is_closed).map(s => s.id);
    }
    
    const summaryPromises = issueFiles.map(async (file) => {
      try {
        const content = await fsPromises.readFile(path.join(this.issuesDir, file), 'utf8');
        const issue = await this.parseMarkdownIssue(content);
        if (issue) {
          // Apply status filtering
          if (statusIds && !statusIds.includes(issue.status_id)) {
            return null;
          }
          if (!includeClosedStatuses && !statusIds && closedStatusIds.includes(issue.status_id)) {
            return null;
          }
          
          const status = await this.statusRepository.getStatus(issue.status_id);
          const summary: IssueSummary = {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            priority: issue.priority,
            created_at: issue.created_at,
            updated_at: issue.updated_at
          };
          if (status?.name) {
            summary.status = status.name;
          }
          return summary;
        }
        return null;
      } catch (error) {
        this.logger.error(`Error reading issue file ${file}:`, { error });
        return null;
      }
    });

    const results = await Promise.all(summaryPromises);
    const summaries = results.filter((summary): summary is IssueSummary => summary !== null);
    return summaries.sort((a, b) => a.id - b.id);
  }

  async createIssue(title: string, content?: string, priority: string = 'medium', status?: string, tags?: string[], description?: string): Promise<Issue> {
    await this.ensureDirectoryExists();
    
    // @ai-logic: Resolve status name to ID
    let finalStatusId: number;
    let statusName: string;
    if (!status) {
      const statuses = await this.statusRepository.getAllStatuses();
      const defaultStatus = statuses.find(s => s.name === 'Open') || statuses[0];
      finalStatusId = defaultStatus.id;
      statusName = defaultStatus.name;
    } else {
      const statuses = await this.statusRepository.getAllStatuses();
      const matchedStatus = statuses.find(s => s.name === status);
      if (!matchedStatus) {
        throw new Error(`Status '${status}' not found`);
      }
      finalStatusId = matchedStatus.id;
      statusName = matchedStatus.name;
    }

    const now = new Date().toISOString();
    const issue: IssueInternal = {
      id: await this.getNextId(),
      title,
      description,
      content: content || '',
      priority,
      status_id: finalStatusId,
      status: statusName,
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
    
    return this.toExternalIssue(issue);
  }

  async updateIssue(id: number, title?: string, content?: string, priority?: string, status?: string, tags?: string[], description?: string): Promise<boolean> {
    const filePath = this.getIssueFilePath(id);
    
    try {
      await fsPromises.access(filePath);
    } catch {
      return false;
    }

    try {
      const fileContent = await fsPromises.readFile(filePath, 'utf8');
      const issue = await this.parseMarkdownIssue(fileContent);
      if (!issue) return false;

      if (title !== undefined) issue.title = title;
      if (description !== undefined) issue.description = description;
      if (content !== undefined) issue.content = content;
      if (priority !== undefined) issue.priority = priority;
      if (status !== undefined) {
        // @ai-logic: Resolve status name to ID
        const statuses = await this.statusRepository.getAllStatuses();
        const matchedStatus = statuses.find(s => s.name === status);
        if (!matchedStatus) {
          throw new Error(`Status '${status}' not found`);
        }
        issue.status_id = matchedStatus.id;
        issue.status = matchedStatus.name;
      }
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
      // @ai-logic: CASCADE DELETE in foreign key constraint handles issue_tags cleanup
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
      const issue = await this.parseMarkdownIssue(content);
      if (issue) {
        const status = await this.statusRepository.getStatus(issue.status_id);
        issue.status = status?.name;
        return this.toExternalIssue(issue);
      }
      return null;
    } catch (error) {
      this.logger.error(`Error reading issue ${id}:`, { error });
      return null;
    }
  }

  /**
   * @ai-intent Search issues by exact tag match using relationship table
   * @ai-flow 1. Get tag ID -> 2. JOIN with issue_tags -> 3. Load full issues
   * @ai-performance Uses indexed JOIN instead of LIKE search
   * @ai-database-schema Leverages issue_tags relationship table
   */
  async searchIssuesByTag(tag: string): Promise<Issue[]> {
    // Get tag ID
    const tagRow = await this.db.getAsync(
      'SELECT id FROM tags WHERE name = ?',
      [tag]
    );
    
    if (!tagRow) {
      return []; // Tag doesn't exist
    }
    
    // Find all issue IDs with this tag
    const issueRows = await this.db.allAsync(
      `SELECT DISTINCT i.id 
       FROM search_issues i
       JOIN issue_tags it ON i.id = it.issue_id
       WHERE it.tag_id = ?
       ORDER BY i.id`,
      [tagRow.id]
    );
    
    // Load full issue data
    const issues: Issue[] = [];
    for (const row of issueRows) {
      const issue = await this.getIssue(row.id);
      if (issue) {
        issues.push(issue);
      }
    }
    
    return issues;
  }
}