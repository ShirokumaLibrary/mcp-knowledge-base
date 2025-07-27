import type { Database } from './base.js';
import { BaseRepository } from './base.js';
import type { Issue, Plan, Document } from '../types/domain-types.js';
import type { WorkSession } from '../types/session-types.js';
import type { TaskType } from '../types/type-registry.js';
import { typeRegistry } from '../types/type-registry.js';
import type { DatabaseRow } from './types/database-types.js';

/**
 * @ai-context Centralized search functionality across all content types
 * @ai-pattern Facade pattern for unified search interface
 * @ai-critical Performance-critical - searches must be fast for good UX
 * @ai-dependencies All repository types for fetching full objects after search
 * @ai-assumption SQLite search tables are kept in sync with markdown files
 */
export class SearchRepository extends BaseRepository {
  private taskRepository: any;  // @ai-why: Circular dependency prevents proper typing
  private documentRepository: any;  // @ai-logic: Unified document repository
  private sessionRepository: any;

  constructor(
    db: Database,
    taskRepository: any,
    documentRepository: any,
    sessionRepository?: any
  ) {
    super(db, 'SearchRepository');
    this.taskRepository = taskRepository;
    this.documentRepository = documentRepository;
    this.sessionRepository = sessionRepository;
  }

  /**
   * @ai-intent Full-text search across issues, plans, and knowledge
   * @ai-flow 1. Query search tables -> 2. Get IDs -> 3. Fetch full objects -> 4. Filter nulls
   * @ai-performance Uses LIKE for simple text matching, indexes on title/description
   * @ai-why Two-phase approach: search returns IDs, then fetch full data from files
   * @ai-edge-case Handles deleted files gracefully with filter(Boolean)
   */
  async searchAll(query: string): Promise<{ issues: Issue[], plans: Plan[], knowledge: Document[] }> {
    // @ai-logic: Search tasks (issues and plans) from unified table
    const taskRows = await this.db.allAsync(
      'SELECT type, id FROM search_tasks WHERE title LIKE ? OR content LIKE ?',
      [`%${query}%`, `%${query}%`]
    );

    // Get task types from sequences table
    const sequences = await this.db.allAsync(
      'SELECT type FROM sequences WHERE base_type = \'tasks\' ORDER BY type'
    );

    // Group task rows by type
    const tasksByType: Record<string, DatabaseRow[]> = {};
    for (const row of taskRows) {
      const rowType = String(row.type);
      if (!tasksByType[rowType]) {
        tasksByType[rowType] = [];
      }
      tasksByType[rowType].push(row);
    }

    // For backward compatibility, map first two task types to issues/plans
    const issueType = sequences[0] ? String(sequences[0].type) : null;
    const planType = sequences[1] ? String(sequences[1].type) : null;
    const issueRows = issueType ? (tasksByType[issueType] || []) : [];
    const planRows = planType ? (tasksByType[planType] || []) : [];

    const issuePromises = issueRows.map((row: any) => this.taskRepository.getTask(issueType, row.id));
    const issues = (await Promise.all(issuePromises)).filter(Boolean) as Issue[];

    const planPromises = planRows.map((row: any) => this.taskRepository.getTask(planType, row.id));
    const plans = (await Promise.all(planPromises)).filter(Boolean) as Plan[];

    // @ai-logic: Search all document types
    const documentRows = await this.db.allAsync(
      'SELECT type, id FROM search_documents WHERE title LIKE ? OR content LIKE ?',
      [`%${query}%`, `%${query}%`]
    );

    // Group document rows by type
    const documentsByType: Record<string, DatabaseRow[]> = {};
    for (const row of documentRows) {
      const rowType = String(row.type);
      if (!documentsByType[rowType]) {
        documentsByType[rowType] = [];
      }
      documentsByType[rowType].push(row);
    }

    // Get all documents
    const allDocuments: Document[] = [];
    for (const [docType, rows] of Object.entries(documentsByType)) {
      const docPromises = rows.map((row: any) => this.documentRepository.getDocument(docType, row.id));
      const docs = (await Promise.all(docPromises)).filter(Boolean) as Document[];
      allDocuments.push(...docs);
    }

    // For backward compatibility, return empty array as knowledge
    const knowledge = allDocuments;

    return { issues, plans, knowledge };
  }

  /**
   * @ai-intent Find all content tagged with specific tag
   * @ai-flow 1. Parallel fetch all content -> 2. Filter by tag -> 3. Return grouped
   * @ai-performance O(n) for issues/plans, optimized for docs/knowledge/sessions
   * @ai-why Mixed approach: some repos have tag search, others need filtering
   * @ai-assumption Tags are exact matches, case-sensitive
   */
  async searchAllByTag(tag: string): Promise<{ issues: Issue[], plans: Plan[], docs: Document[], knowledge: Document[], sessions: WorkSession[] }> {
    // @ai-performance: Parallel fetching for better response time
    // Get task types from sequences
    const taskSequences = await this.db.allAsync(
      'SELECT type FROM sequences WHERE base_type = \'tasks\' ORDER BY type'
    );

    // Fetch all tasks by type
    const taskPromises = taskSequences.map((seq: any) =>
      this.taskRepository.getAllTasks(seq.type)
    );

    const results = await Promise.all([
      ...taskPromises,
      this.documentRepository.searchDocumentsByTag(tag), // All document types
      this.sessionRepository ? this.sessionRepository.searchSessionsByTag(tag) : Promise.resolve([])
    ]);

    // Extract results
    const allTasks = results.slice(0, taskSequences.length);
    const allDocuments = results[taskSequences.length] as Document[];
    const sessions = results[taskSequences.length + 1] as WorkSession[];

    // For backward compatibility, assume first two task types are issues and plans
    const issues = (allTasks[0] || []).filter((t: any) => t.tags && t.tags.includes(tag)) as Issue[];
    const plans = (allTasks[1] || []).filter((t: any) => t.tags && t.tags.includes(tag)) as Plan[];

    // Filter documents by type
    const docs = allDocuments.filter(d => d.type === 'docs');
    const knowledge = allDocuments.filter(d => d.type === 'knowledge');

    return {
      issues,    // @ai-logic: Already filtered above
      plans,     // @ai-logic: Already filtered above
      docs,      // @ai-logic: Filtered from all documents
      knowledge, // @ai-logic: Filtered from all documents
      sessions   // @ai-logic: Already filtered by repository
    };
  }

  async searchSessions(query: string): Promise<any[]> {
    try {
      const rows = await this.db.allAsync(
        `SELECT * FROM search_sessions WHERE 
         title LIKE ? OR content LIKE ? OR summary LIKE ? OR category LIKE ?`,
        [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
      );

      return rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        tags: row.tags ? row.tags.split(',') : [],
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time || undefined,
        summary: row.summary
      }));
    } catch (error) {
      this.logger.error('Session search error:', { error });
      return [];
    }
  }

  async searchDailySummaries(query: string): Promise<any[]> {
    try {
      const rows = await this.db.allAsync(
        `SELECT * FROM search_daily_summaries WHERE 
         title LIKE ? OR content LIKE ?`,
        [`%${query}%`, `%${query}%`]
      );

      return rows.map((row: any) => ({
        date: row.date,
        title: row.title,
        content: row.content,
        tags: row.tags ? row.tags.split(',') : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      this.logger.error('Daily summary search error:', { error });
      return [];
    }
  }

  /**
   * @ai-intent Search daily summaries by exact tag match using relationship table
   * @ai-flow 1. Get tag ID -> 2. JOIN with summary_tags -> 3. Return full summary data
   * @ai-performance Uses indexed JOIN instead of LIKE search
   * @ai-database-schema Leverages summary_tags relationship table
   */
  async searchDailySummariesByTag(tag: string): Promise<any[]> {
    try {
      // Get tag ID
      const tagRow = await this.db.getAsync(
        'SELECT id FROM tags WHERE name = ?',
        [tag]
      );

      if (!tagRow) {
        return []; // Tag doesn't exist
      }

      // Find all summaries with this tag using JOIN
      const rows = await this.db.allAsync(
        `SELECT DISTINCT s.* 
         FROM search_daily_summaries s
         JOIN summary_tags st ON s.date = st.summary_date
         WHERE st.tag_id = ?
         ORDER BY s.date DESC`,
        [tagRow.id]
      );

      return rows.map((row: any) => ({
        date: row.date,
        title: row.title,
        content: row.content,
        tags: row.tags ? row.tags.split(',') : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      this.logger.error('Daily summary tag search error:', { error });
      return [];
    }
  }

  /**
   * @ai-intent Search sessions by exact tag match using relationship table
   * @ai-flow 1. Get tag ID -> 2. JOIN with session_tags -> 3. Return full session data
   * @ai-performance Uses indexed JOIN instead of LIKE search
   * @ai-database-schema Leverages session_tags relationship table
   */
  async searchSessionsByTag(tag: string): Promise<any[]> {
    try {
      // Get tag ID
      const tagRow = await this.db.getAsync(
        'SELECT id FROM tags WHERE name = ?',
        [tag]
      );

      if (!tagRow) {
        return []; // Tag doesn't exist
      }

      // Find all sessions with this tag using JOIN
      const rows = await this.db.allAsync(
        `SELECT DISTINCT s.* 
         FROM search_sessions s
         JOIN session_tags st ON s.id = st.session_id
         WHERE st.tag_id = ?
         ORDER BY s.date DESC, s.start_time DESC`,
        [tagRow.id]
      );

      return rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        tags: row.tags ? row.tags.split(',') : [],
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time || undefined,
        summary: row.summary
      }));
    } catch (error) {
      this.logger.error('Session tag search error:', { error });
      return [];
    }
  }

  /**
   * @ai-intent Rebuild search index from markdown files
   * @ai-flow 1. Clear tables -> 2. Load all content -> 3. Sync to SQLite
   * @ai-side-effects Deletes and recreates all search table data
   * @ai-critical Used for disaster recovery - must be reliable
   * @ai-performance Can be slow with large datasets - consider progress reporting
   * @ai-why Separate from docs/sessions which are handled differently
   */
  async rebuildSearchIndex(): Promise<void> {
    // @ai-logic: Clear existing data to prevent duplicates
    await Promise.all([
      this.db.runAsync('DELETE FROM search_tasks'),
      this.db.runAsync('DELETE FROM search_documents')
    ]);

    // @ai-logic: Load all content from markdown files
    // Get task types from sequences
    const taskSequences = await this.db.allAsync(
      'SELECT type FROM sequences WHERE base_type = \'tasks\' ORDER BY type'
    );

    // Fetch all tasks by type
    const taskPromises = taskSequences.map((seq: any) =>
      this.taskRepository.getAllTasks(seq.type)
    );

    const results = await Promise.all([
      ...taskPromises,
      this.documentRepository.getAllDocuments()
    ]);

    // Extract results
    const allTasks = results.slice(0, taskSequences.length);
    const documents = results[taskSequences.length] as Document[];

    // For backward compatibility, assume first two task types are issues and plans
    const issues = allTasks[0] || [];
    const plans = allTasks[1] || [];

    // @ai-critical: Pre-register all tags to avoid race conditions
    const allTags = new Set<string>();
    issues.forEach((issue: Issue) => {
      if (issue.tags) {
        issue.tags.forEach(tag => allTags.add(tag));
      }
    });
    plans.forEach((plan: Plan) => {
      if (plan.tags) {
        plan.tags.forEach(tag => allTags.add(tag));
      }
    });
    documents.forEach((doc: Document) => {
      if (doc.tags) {
        doc.tags.forEach(tag => allTags.add(tag));
      }
    });

    // @ai-logic: Tags are auto-registered during document sync operations

    // @ai-performance: Batch sync for better performance
    // Get task types from sequences
    const sequences = await this.db.allAsync(
      'SELECT type FROM sequences WHERE base_type = \'tasks\' ORDER BY type'
    );
    const issueType = sequences[0]?.type;
    const planType = sequences[1]?.type;

    if (!issueType || !planType) {
      throw new Error('Task types not properly initialized in sequences table');
    }

    await Promise.all([
      ...issues.map((issue: Issue) => this.taskRepository.syncTaskToSQLite(issue, issueType as TaskType)),
      ...plans.map((plan: Plan) => this.taskRepository.syncTaskToSQLite(plan, planType as TaskType)),
      ...documents.map((doc: Document) => this.documentRepository.syncDocumentToSQLite(doc))
    ]);
  }
}