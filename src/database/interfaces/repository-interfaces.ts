/**
 * @ai-context Unified repository interfaces for all data access
 * @ai-pattern Repository pattern with consistent interfaces
 * @ai-critical All repositories should implement these interfaces
 * @ai-why Enables dependency injection and testing
 * @ai-assumption All entities have common CRUD operations
 */

import type {
  Status,
  Issue,
  Plan,
  Document,
  Tag
} from '../../types/domain-types.js';
import type {
  Session,
  Daily,
  TagWithCount,
  Priority,
  TypeDefinition
} from '../../types/complete-domain-types.js';

/**
 * @ai-intent Base repository operations
 * @ai-pattern Common CRUD interface
 * @ai-generic T for entity type, K for key type
 */
export interface IBaseRepository<T, K = number> {
  findById(id: K): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: K, data: Partial<T>): Promise<T | null>;
  delete(id: K): Promise<boolean>;
}

/**
 * @ai-intent Status repository interface
 * @ai-pattern Extends base with status-specific operations
 * @ai-critical Status operations affect referential integrity
 */
export interface IStatusRepository extends IBaseRepository<Status, number> {
  getAllStatuses(): Promise<Status[]>;
  getAllStatusesAsync(): Promise<Status[]>;  // @ai-deprecated: Legacy method
  getStatus(id: number): Promise<Status | null>;
  createStatus(name: string, is_closed?: boolean): Promise<Status>;
  updateStatus(id: number, name: string, is_closed?: boolean): Promise<boolean>;
  deleteStatus(id: number): Promise<boolean>;
  isStatusInUse(id: number): Promise<boolean>;
}

/**
 * @ai-intent Tag repository interface
 * @ai-pattern Tags use name as primary key
 * @ai-critical Auto-registration is key feature
 */
export interface ITagRepository {
  getTags(): Promise<TagWithCount[]>;
  createTag(name: string): Promise<Tag>;
  deleteTag(name: string): Promise<boolean>;
  getTagsByPattern(pattern: string): Promise<TagWithCount[]>;
  ensureTagsExist(tagNames: string[]): Promise<void>;
  saveEntityTags(
    entityType: 'issue' | 'plan' | 'knowledge' | 'doc' | 'session' | 'summary',
    entityId: string | number,
    tagNames: string[]
  ): Promise<void>;
  autoRegisterTags(tags?: string[]): Promise<void>;
}

/**
 * @ai-intent Task repository interface
 * @ai-pattern Unified interface for issues and plans
 * @ai-critical Supports dynamic task types
 */
export interface ITaskRepository {
  getTask(type: string, id: number): Promise<Issue | Plan | null>;
  getAllTasksSummary(
    type: string,
    includeClosedStatuses?: boolean,
    statuses?: string[]
  ): Promise<Array<Issue | Plan>>;
  createTask(
    type: string,
    title: string,
    content: string,
    priority?: Priority,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related?: string[]
  ): Promise<Issue | Plan>;
  updateTask(
    type: string,
    id: number,
    title?: string,
    content?: string,
    priority?: Priority,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related?: string[]
  ): Promise<boolean>;
  deleteTask(type: string, id: number): Promise<boolean>;
  searchTasksByTag(type: string, tag: string): Promise<Array<Issue | Plan>>;
  syncTaskToSearchIndex(type: string, task: Issue | Plan): Promise<void>;
}

/**
 * @ai-intent Document repository interface
 * @ai-pattern Unified interface for docs and knowledge
 * @ai-critical Content is required for documents
 */
export interface IDocumentRepository {
  getAllDocuments(type?: string): Promise<Document[]>;
  getDocument(type: string, id: number): Promise<Document | null>;
  getAllDocumentsSummary(type?: string): Promise<Document[]>;
  createDocument(
    type: string,
    title: string,
    content: string,
    tags?: string[],
    description?: string,
    related?: string[]
  ): Promise<Document>;
  updateDocument(
    type: string,
    id: number,
    title?: string,
    content?: string,
    tags?: string[],
    description?: string,
    related?: string[]
  ): Promise<boolean>;
  deleteDocument(type: string, id: number): Promise<boolean>;
  searchDocumentsByTag(tag: string, type?: string): Promise<Document[]>;
  syncDocumentToSearchIndex(type: string, doc: Document): Promise<void>;
}

/**
 * @ai-intent Search repository interface
 * @ai-pattern Cross-entity search operations
 * @ai-critical Handles full-text and tag-based search
 */
export interface ISearchRepository {
  searchAll(query: string): Promise<{
    issues: Issue[];
    plans: Plan[];
    docs: Document[];
    knowledge: Document[];
    sessions?: Session[];
    summaries?: Daily[];
  }>;
  searchAllByTag(tag: string): Promise<{
    issues: Issue[];
    plans: Plan[];
    docs: Document[];
    knowledge: Document[];
    sessions?: Session[];
    summaries?: Daily[];
  }>;
  searchSessions(query: string): Promise<Session[]>;
  searchDailySummaries(query: string): Promise<Daily[]>;
  searchSessionsByTag(tag: string): Promise<Session[]>;
  rebuildSearchIndex(): Promise<void>;
}

/**
 * @ai-intent Type repository interface
 * @ai-pattern Dynamic type management
 * @ai-critical Enables custom content types
 */
export interface ITypeRepository {
  createType(name: string, baseType: 'tasks' | 'documents'): Promise<TypeDefinition>;
  getTypes(includeDefinitions?: boolean): Promise<{
    tasks: string[];
    documents: string[];
    definitions?: Record<string, TypeDefinition>;
  }>;
  deleteType(name: string): Promise<boolean>;
  typeExists(name: string): Promise<boolean>;
}

/**
 * @ai-intent Session management interface
 * @ai-pattern Work tracking operations
 * @ai-critical Sessions use timestamp-based IDs
 */
export interface ISessionRepository {
  getSessions(startDate?: string, endDate?: string): Promise<Session[]>;
  getSession(id: string): Promise<Session | null>;
  getLatestSession(): Promise<Session | null>;
  createSession(session: Partial<Session>): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | null>;
  deleteSession(id: string): Promise<boolean>;
  searchSessionsByTag(tag: string): Promise<Session[]>;
}

/**
 * @ai-intent Summary management interface
 * @ai-pattern Daily aggregation operations
 * @ai-critical One summary per date maximum
 */
export interface ISummaryRepository {
  getSummaries(startDate?: string, endDate?: string): Promise<Daily[]>;
  getSummary(date: string): Promise<Daily | null>;
  createSummary(summary: Partial<Daily>): Promise<Daily>;
  updateSummary(date: string, updates: Partial<Daily>): Promise<Daily | null>;
  deleteSummary(date: string): Promise<boolean>;
}

/**
 * @ai-intent Master database interface
 * @ai-pattern Facade for all repositories
 * @ai-critical Central access point for all data operations
 */
export interface IDatabase {
  // Initialization
  initialize(): Promise<void>;
  close(): void;

  // Status operations
  getAllStatuses(): Promise<Status[]>;
  createStatus(name: string, is_closed?: boolean): Promise<Status>;
  updateStatus(id: number, name: string, is_closed?: boolean): Promise<boolean>;
  deleteStatus(id: number): Promise<boolean>;

  // Tag operations
  getTags(): Promise<TagWithCount[]>;
  createTag(name: string): Promise<Tag>;
  deleteTag(name: string): Promise<boolean>;
  searchTags(pattern: string): Promise<TagWithCount[]>;

  // Task operations
  getTask(type: string, id: number): Promise<Issue | Plan | null>;
  getAllTasksSummary(
    type: string,
    includeClosedStatuses?: boolean,
    statuses?: string[]
  ): Promise<Array<Issue | Plan>>;
  createTask(
    type: string,
    title: string,
    content: string,
    priority?: Priority,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related?: string[]
  ): Promise<Issue | Plan>;
  updateTask(
    type: string,
    id: number,
    title?: string,
    content?: string,
    priority?: Priority,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related?: string[]
  ): Promise<boolean>;
  deleteTask(type: string, id: number): Promise<boolean>;
  searchTasksByTag(type: string, tag: string): Promise<Array<Issue | Plan>>;

  // Document operations
  getAllDocuments(type?: string): Promise<Document[]>;
  getDocument(type: string, id: number): Promise<Document | null>;
  getAllDocumentsSummary(type?: string): Promise<Document[]>;
  createDocument(
    type: string,
    title: string,
    content: string,
    tags?: string[],
    description?: string,
    related?: string[]
  ): Promise<Document>;
  updateDocument(
    type: string,
    id: number,
    title?: string,
    content?: string,
    tags?: string[],
    description?: string,
    related?: string[]
  ): Promise<boolean>;
  deleteDocument(type: string, id: number): Promise<boolean>;
  searchDocumentsByTag(tag: string, type?: string): Promise<Document[]>;

  // Search operations
  // @ai-any-deliberate: Generic search result - returns mixed item types (Issue, Plan, Doc, Knowledge)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchAll(query: string): Promise<any>;
  // @ai-any-deliberate: Generic tag search result - returns mixed item types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchAllByTag(tag: string): Promise<any>;
  searchSessions(query: string): Promise<Session[]>;
  searchDailySummaries(query: string): Promise<Daily[]>;
  searchSessionsByTag(tag: string): Promise<Session[]>;
  rebuildSearchIndex(): Promise<void>;

  // Session operations
  syncSessionToSQLite(session: Session): Promise<void>;
  syncDailyToSQLite(summary: Daily): Promise<void>;
}