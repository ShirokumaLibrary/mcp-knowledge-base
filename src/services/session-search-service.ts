/**
 * @ai-context Search service for work sessions and summaries
 * @ai-pattern Dual search strategy: SQLite (fast) vs files (accurate)
 * @ai-critical Provides both indexed and file-based search
 * @ai-dependencies Database for SQLite search, Repository for file search
 * @ai-why SQLite may be out of sync, files are source of truth
 */

import { WorkSession, DailySummary } from '../types/session-types.js';
import { FileIssueDatabase } from '../database.js';
import { SessionRepository } from '../repositories/session-repository.js';

/**
 * @ai-context Orchestrates session search operations
 * @ai-pattern Service layer abstracting search complexity
 * @ai-critical Fast methods use SQLite, detailed methods scan files
 * @ai-performance SQLite 100x faster but may miss recent changes
 * @ai-assumption SQLite sync happens on write but may fail
 */
export class SessionSearchService {
  /**
   * @ai-intent Initialize with both search backends
   * @ai-pattern Dependency injection for flexibility
   * @ai-assumption Both dependencies are initialized
   */
  constructor(
    private db: FileIssueDatabase,
    private repository: SessionRepository
  ) {}

  /**
   * @ai-section SQLite-based Fast Search Methods
   * @ai-intent Full-text search using SQLite FTS
   * @ai-flow 1. Query SQLite -> 2. Return hydrated objects
   * @ai-performance Milliseconds for large datasets
   * @ai-caveat May miss very recent sessions
   */
  async searchSessionsFast(query: string): Promise<WorkSession[]> {
    return this.db.searchSessions(query);  // @ai-logic: Delegates to SQLite FTS
  }

  /**
   * @ai-intent Tag-based search via SQLite
   * @ai-flow 1. Query by exact tag match -> 2. Return sessions
   * @ai-pattern Exact match in CSV tag column
   * @ai-performance Indexed for speed
   */
  async searchSessionsByTagFast(tag: string): Promise<WorkSession[]> {
    return this.db.searchSessionsByTag(tag);  // @ai-pattern: Exact tag match
  }

  /**
   * @ai-intent Search daily summaries via SQLite
   * @ai-flow 1. FTS query on summary content -> 2. Return matches
   * @ai-pattern Full-text search on title and content
   * @ai-return Array of matching summaries
   */
  async searchDailySummariesFast(query: string): Promise<DailySummary[]> {
    return this.db.searchDailySummaries(query);
  }

  /**
   * @ai-section File-based Detailed Search Methods
   * @ai-intent Full-text search by reading all files
   * @ai-flow 1. Scan all session files -> 2. Match query -> 3. Parse and return
   * @ai-performance O(n) file reads - slow but accurate
   * @ai-why Guaranteed to find all matches including recent
   */
  searchSessionsDetailed(query: string): WorkSession[] {
    return this.repository.searchSessionsFullText(query);  // @ai-logic: Scans markdown files
  }

  /**
   * @ai-intent Tag search by scanning files
   * @ai-flow 1. Read all files -> 2. Parse frontmatter -> 3. Match tags
   * @ai-pattern Exact tag match in YAML frontmatter
   * @ai-performance Slower than SQLite but always current
   * @ai-return Complete session objects
   */
  searchSessionsByTagDetailed(tag: string): WorkSession[] {
    return this.repository.searchSessionsByTag(tag);  // @ai-logic: File-based search
  }
}