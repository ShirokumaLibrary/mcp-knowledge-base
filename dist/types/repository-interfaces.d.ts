/**
 * @ai-context Repository interfaces for dependency injection
 * @ai-pattern Interface segregation for loose coupling
 * @ai-critical Prevents circular dependencies between repositories
 * @ai-why Enables testing with mock implementations
 */
import type { Status, Issue, Plan, Document, IssueSummary, PlanSummary, DocumentSummary, Tag, WorkSession, DailySummary } from './complete-domain-types.js';
/**
 * @ai-intent Status repository contract
 * @ai-pattern CRUD operations for workflow statuses
 * @ai-critical Used by TaskRepository
 * @ai-debt Replace 'any' with proper Status type
 */
export interface IStatusRepository {
    getStatus(id: number): Promise<Status | null>;
    getAllStatuses(): Promise<Status[]>;
    createStatus(name: string, is_closed?: boolean): Promise<Status>;
    updateStatus(id: number, name: string, is_closed?: boolean): Promise<boolean>;
    deleteStatus(id: number): Promise<boolean>;
}
/**
 * @ai-intent Tag repository contract
 * @ai-pattern Tag management across all content types
 * @ai-critical Shared by all content repositories
 * @ai-debt Missing proper Tag type definitions
 */
export interface ITagRepository {
    getTag(id: number): Promise<Tag | null>;
    getAllTags(): Promise<Tag[]>;
    createTag(name: string): Promise<Tag>;
    deleteTag(id: number): Promise<boolean>;
    searchTags(pattern: string): Promise<Tag[]>;
    getTags(): Promise<Tag[]>;
    getOrCreateTagId(name: string): Promise<number>;
    ensureTagsExist(tags: string[]): Promise<void>;
    getTagsByPattern(pattern: string): Promise<Tag[]>;
}
export interface IIssueRepository {
    getAllIssues(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<Issue[]>;
    getAllIssuesSummary(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<IssueSummary[]>;
    createIssue(title: string, description?: string, priority?: string, status_id?: number, tags?: string[]): Promise<Issue>;
    updateIssue(id: number, title?: string, description?: string, priority?: string, status_id?: number, tags?: string[]): Promise<boolean>;
    deleteIssue(id: number): Promise<boolean>;
    getIssue(id: number): Promise<Issue | null>;
    searchIssuesByTag(tag: string): Promise<Issue[]>;
}
export interface IPlanRepository {
    getAllPlans(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<Plan[]>;
    getAllPlansSummary(): Promise<PlanSummary[]>;
    createPlan(title: string, description?: string, priority?: string, status_id?: number, tags?: string[], start_date?: string, end_date?: string): Promise<Plan>;
    updatePlan(id: number, title?: string, description?: string, priority?: string, status_id?: number, tags?: string[], start_date?: string, end_date?: string): Promise<boolean>;
    deletePlan(id: number): Promise<boolean>;
    getPlan(id: number): Promise<Plan | null>;
    searchPlansByTag(tag: string): Promise<Plan[]>;
}
export interface IDocRepository {
    getAllDocs(): Promise<Document[]>;
    getAllDocsSummary(): Promise<DocumentSummary[]>;
    createDoc(title: string, content: string, tags?: string[]): Promise<Document>;
    updateDoc(id: number, title?: string, content?: string, tags?: string[]): Promise<boolean>;
    deleteDoc(id: number): Promise<boolean>;
    getDoc(id: number): Promise<Document | null>;
    searchDocsByTag(tag: string): Promise<Document[]>;
}
export interface IKnowledgeRepository {
    getAllKnowledge(): Promise<Document[]>;
    getAllKnowledgeSummary(): Promise<DocumentSummary[]>;
    createKnowledge(title: string, content: string, tags?: string[]): Promise<Document>;
    updateKnowledge(id: number, title?: string, content?: string, tags?: string[]): Promise<boolean>;
    deleteKnowledge(id: number): Promise<boolean>;
    getKnowledge(id: number): Promise<Document | null>;
    searchKnowledgeByTag(tag: string): Promise<Document[]>;
}
/**
 * @ai-intent Search repository contract
 * @ai-pattern Cross-type search operations
 * @ai-critical Central search functionality
 * @ai-return Categorized results by content type
 * @ai-debt Type safety needed for search results
 */
export interface ISearchRepository {
    searchAllByTag(tag: string): Promise<{
        issues: Issue[];
        plans: Plan[];
        docs: Document[];
        knowledge: Document[];
        sessions?: WorkSession[];
    }>;
    searchSessionsByTag(tag: string): Promise<WorkSession[]>;
    searchSessionsByContent(query: string): Promise<WorkSession[]>;
    searchAll(query: string): Promise<{
        issues: Issue[];
        plans: Plan[];
        knowledge: Document[];
    }>;
    searchSessions(query: string): Promise<WorkSession[]>;
    searchDailySummaries(query: string): Promise<DailySummary[]>;
    rebuildSearchIndex(): Promise<void>;
}
