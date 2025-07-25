import { BaseRepository, Database } from './base.js';
import { Issue, Plan, Knowledge, Doc, Document } from '../types/domain-types.js';
import { WorkSession } from '../types/session-types.js';

/**
 * @ai-context Centralized search functionality across all content types
 * @ai-pattern Facade pattern for unified search interface
 * @ai-critical Performance-critical - searches must be fast for good UX
 * @ai-dependencies All repository types for fetching full objects after search
 * @ai-assumption SQLite search tables are kept in sync with markdown files
 */
export class SearchRepository extends BaseRepository {
  private issueRepository: any;  // @ai-why: Circular dependency prevents proper typing
  private planRepository: any;
  private documentRepository: any;  // @ai-logic: Unified document repository
  private sessionRepository: any;

  constructor(
    db: Database, 
    issueRepository: any,
    planRepository: any,
    documentRepository: any,
    sessionRepository?: any
  ) {
    super(db, 'SearchRepository');
    this.issueRepository = issueRepository;
    this.planRepository = planRepository;
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
  async searchAll(query: string): Promise<{ issues: Issue[], plans: Plan[], knowledge: Knowledge[] }> {
    // @ai-logic: Search issues by title and description
    const issueRows = await this.db.allAsync(
      `SELECT id FROM search_issues WHERE title LIKE ? OR content LIKE ?`,
      [`%${query}%`, `%${query}%`]
    );
    const issuePromises = issueRows.map((row: any) => this.issueRepository.getIssue(row.id));
    const issues = (await Promise.all(issuePromises)).filter(Boolean) as Issue[];

    // @ai-logic: Search plans similarly
    const planRows = await this.db.allAsync(
      `SELECT id FROM search_plans WHERE title LIKE ? OR content LIKE ?`,
      [`%${query}%`, `%${query}%`]
    );
    const planPromises = planRows.map((row: any) => this.planRepository.getPlan(row.id));
    const plans = (await Promise.all(planPromises)).filter(Boolean) as Plan[];

    // @ai-logic: Knowledge searches content field too (more comprehensive)
    const knowledgeRows = await this.db.allAsync(
      `SELECT type, id FROM search_documents WHERE type = 'knowledge' AND (title LIKE ? OR content LIKE ?)`,
      [`%${query}%`, `%${query}%`]
    );
    const knowledgePromises = knowledgeRows.map((row: any) => this.documentRepository.getDocument('knowledge', row.id));
    const knowledge = (await Promise.all(knowledgePromises)).filter(Boolean) as Knowledge[];

    return { issues, plans, knowledge };
  }

  /**
   * @ai-intent Find all content tagged with specific tag
   * @ai-flow 1. Parallel fetch all content -> 2. Filter by tag -> 3. Return grouped
   * @ai-performance O(n) for issues/plans, optimized for docs/knowledge/sessions
   * @ai-why Mixed approach: some repos have tag search, others need filtering
   * @ai-assumption Tags are exact matches, case-sensitive
   */
  async searchAllByTag(tag: string): Promise<{ issues: Issue[], plans: Plan[], docs: Doc[], knowledge: Knowledge[], sessions: WorkSession[] }> {
    // @ai-performance: Parallel fetching for better response time
    const results = await Promise.all([
      this.issueRepository.getAllIssues(),
      this.planRepository.getAllPlans(),
      this.documentRepository.searchDocumentsByTag(tag, 'knowledge'),
      this.documentRepository.searchDocumentsByTag(tag, 'doc'),
      this.sessionRepository ? this.sessionRepository.searchSessionsByTag(tag) : Promise.resolve([])
    ]);
    
    const [issues, plans, knowledge, docs, sessions] = results;
    
    return {
      issues: issues.filter((i: Issue) => i.tags && i.tags.includes(tag)),  // @ai-logic: In-memory filter
      plans: plans.filter((p: Plan) => p.tags && p.tags.includes(tag)),
      docs,      // @ai-logic: Already filtered by repository
      knowledge, // @ai-logic: Already filtered by repository
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
      this.db.runAsync('DELETE FROM search_issues'),
      this.db.runAsync('DELETE FROM search_plans'),
      this.db.runAsync('DELETE FROM search_documents')
    ]);

    // @ai-logic: Load all content from markdown files
    const [issues, plans, documents] = await Promise.all([
      this.issueRepository.getAllIssues(),
      this.planRepository.getAllPlans(),
      this.documentRepository.getAllDocuments()
    ]);

    // @ai-critical: Pre-register all tags to avoid race conditions
    const allTags = new Set<string>();
    issues.forEach((issue: Issue) => {
      if (issue.tags) issue.tags.forEach(tag => allTags.add(tag));
    });
    plans.forEach((plan: Plan) => {
      if (plan.tags) plan.tags.forEach(tag => allTags.add(tag));
    });
    documents.forEach((doc: Document) => {
      if (doc.tags) doc.tags.forEach(tag => allTags.add(tag));
    });
    
    // @ai-logic: Tags are auto-registered during document sync operations

    // @ai-performance: Batch sync for better performance
    await Promise.all([
      ...issues.map((issue: Issue) => this.issueRepository.syncIssueToSQLite(issue)),
      ...plans.map((plan: Plan) => this.planRepository.syncPlanToSQLite(plan)),
      ...documents.map((doc: Document) => this.documentRepository.syncDocumentToSQLite(doc))
    ]);
  }
}