/**
 * @ai-context Unified repository interfaces for all data access
 * @ai-pattern Repository pattern with consistent interfaces
 * @ai-critical All repositories should implement these interfaces
 * @ai-why Enables dependency injection and testing
 * @ai-assumption All entities have common CRUD operations
 */
import type { Status, Issue, Plan, Document, Tag } from '../../types/domain-types.js';
import type { WorkSession, DailySummary, TagWithCount, Priority, TypeDefinition } from '../../types/complete-domain-types.js';
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
    getAllStatusesAsync(): Promise<Status[]>;
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
    saveEntityTags(entityType: 'issue' | 'plan' | 'knowledge' | 'doc' | 'session' | 'summary', entityId: string | number, tagNames: string[]): Promise<void>;
    autoRegisterTags(tags?: string[]): Promise<void>;
}
/**
 * @ai-intent Task repository interface
 * @ai-pattern Unified interface for issues and plans
 * @ai-critical Supports dynamic task types
 */
export interface ITaskRepository {
    getTask(type: string, id: number): Promise<Issue | Plan | null>;
    getAllTasksSummary(type: string, includeClosedStatuses?: boolean, statusIds?: number[]): Promise<Array<Issue | Plan>>;
    createTask(type: string, title: string, content: string, priority?: Priority, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<Issue | Plan>;
    updateTask(type: string, id: number, title?: string, content?: string, priority?: Priority, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<boolean>;
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
    createDocument(type: string, title: string, content: string, tags?: string[], description?: string, related_tasks?: string[], related_documents?: string[]): Promise<Document>;
    updateDocument(type: string, id: number, title?: string, content?: string, tags?: string[], description?: string, related_tasks?: string[], related_documents?: string[]): Promise<boolean>;
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
        sessions?: WorkSession[];
        summaries?: DailySummary[];
    }>;
    searchAllByTag(tag: string): Promise<{
        issues: Issue[];
        plans: Plan[];
        docs: Document[];
        knowledge: Document[];
        sessions?: WorkSession[];
        summaries?: DailySummary[];
    }>;
    searchSessions(query: string): Promise<WorkSession[]>;
    searchDailySummaries(query: string): Promise<DailySummary[]>;
    searchSessionsByTag(tag: string): Promise<WorkSession[]>;
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
    getSessions(startDate?: string, endDate?: string): Promise<WorkSession[]>;
    getSession(id: string): Promise<WorkSession | null>;
    getLatestSession(): Promise<WorkSession | null>;
    createSession(session: Partial<WorkSession>): Promise<WorkSession>;
    updateSession(id: string, updates: Partial<WorkSession>): Promise<WorkSession | null>;
    deleteSession(id: string): Promise<boolean>;
    searchSessionsByTag(tag: string): Promise<WorkSession[]>;
}
/**
 * @ai-intent Summary management interface
 * @ai-pattern Daily aggregation operations
 * @ai-critical One summary per date maximum
 */
export interface ISummaryRepository {
    getSummaries(startDate?: string, endDate?: string): Promise<DailySummary[]>;
    getSummary(date: string): Promise<DailySummary | null>;
    createSummary(summary: Partial<DailySummary>): Promise<DailySummary>;
    updateSummary(date: string, updates: Partial<DailySummary>): Promise<DailySummary | null>;
    deleteSummary(date: string): Promise<boolean>;
}
/**
 * @ai-intent Master database interface
 * @ai-pattern Facade for all repositories
 * @ai-critical Central access point for all data operations
 */
export interface IDatabase {
    initialize(): Promise<void>;
    close(): void;
    getAllStatuses(): Promise<Status[]>;
    createStatus(name: string, is_closed?: boolean): Promise<Status>;
    updateStatus(id: number, name: string, is_closed?: boolean): Promise<boolean>;
    deleteStatus(id: number): Promise<boolean>;
    getTags(): Promise<TagWithCount[]>;
    createTag(name: string): Promise<Tag>;
    deleteTag(name: string): Promise<boolean>;
    searchTags(pattern: string): Promise<TagWithCount[]>;
    getTask(type: string, id: number): Promise<Issue | Plan | null>;
    getAllTasksSummary(type: string, includeClosedStatuses?: boolean, statusIds?: number[]): Promise<Array<Issue | Plan>>;
    createTask(type: string, title: string, content: string, priority?: Priority, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<Issue | Plan>;
    updateTask(type: string, id: number, title?: string, content?: string, priority?: Priority, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<boolean>;
    deleteTask(type: string, id: number): Promise<boolean>;
    searchTasksByTag(type: string, tag: string): Promise<Array<Issue | Plan>>;
    getAllDocuments(type?: string): Promise<Document[]>;
    getDocument(type: string, id: number): Promise<Document | null>;
    getAllDocumentsSummary(type?: string): Promise<Document[]>;
    createDocument(type: string, title: string, content: string, tags?: string[], description?: string, related_tasks?: string[], related_documents?: string[]): Promise<Document>;
    updateDocument(type: string, id: number, title?: string, content?: string, tags?: string[], description?: string, related_tasks?: string[], related_documents?: string[]): Promise<boolean>;
    deleteDocument(type: string, id: number): Promise<boolean>;
    searchDocumentsByTag(tag: string, type?: string): Promise<Document[]>;
    searchAll(query: string): Promise<any>;
    searchAllByTag(tag: string): Promise<any>;
    searchSessions(query: string): Promise<WorkSession[]>;
    searchDailySummaries(query: string): Promise<DailySummary[]>;
    searchSessionsByTag(tag: string): Promise<WorkSession[]>;
    rebuildSearchIndex(): Promise<void>;
    syncSessionToSQLite(session: WorkSession): Promise<void>;
    syncDailySummaryToSQLite(summary: DailySummary): Promise<void>;
}
