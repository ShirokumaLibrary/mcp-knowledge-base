import { ItemRepository } from '../repositories/item-repository.js';
import { FullTextSearchRepository } from './fulltext-search-repository.js';
import { TypeRepository } from './type-repository.js';
import { Session, Daily } from '../types/complete-domain-types.js';
import type { Issue, Plan, Document } from '../types/domain-types.js';
export * from '../types/domain-types.js';
interface GroupedItems {
    issues: Issue[];
    plans: Plan[];
    docs: Document[];
    knowledge: Document[];
    [key: string]: Issue[] | Plan[] | Document[];
}
interface GroupedTypes {
    tasks: string[];
    documents: string[];
    [key: string]: string[];
}
/**
 * @ai-context Main database facade coordinating all repositories
 * @ai-pattern Facade pattern hiding repository complexity from handlers
 * @ai-critical Central data access layer - all data operations go through here
 * @ai-lifecycle Lazy initialization ensures DB ready before operations
 * @ai-dependencies ItemRepository for all content, Status/Tag for metadata
 * @ai-assumption Single database instance per process
 */
export declare class FileIssueDatabase {
    private dataDir;
    private dbPath;
    private connection;
    private itemRepo;
    private statusRepo;
    private tagRepo;
    private searchRepo;
    private fullTextSearchRepo;
    private typeRepo;
    private initializationPromise;
    constructor(dataDir: string, dbPath?: string);
    /**
     * @ai-intent Get data directory for external access
     * @ai-why TypeHandlers need this to create TypeRepository
     */
    get dataDirectory(): string;
    /**
     * @ai-intent Expose database connection
     * @ai-why TypeRepository needs direct database access
     */
    getDatabase(): import("./base.js").Database;
    /**
     * @ai-intent Get ItemRepository for direct access
     * @ai-why UnifiedHandlers need direct access to ItemRepository
     */
    getItemRepository(): ItemRepository;
    /**
     * @ai-intent Get TypeRepository for direct access
     * @ai-why Type management tests need direct access
     */
    getTypeRepository(): TypeRepository;
    /**
     * @ai-intent Get FullTextSearchRepository for search operations
     * @ai-why Search handlers need direct access
     */
    getFullTextSearchRepository(): FullTextSearchRepository;
    /**
     * @ai-intent Initialize database and all repositories
     * @ai-flow 1. Check if initializing -> 2. Start init -> 3. Cache promise
     * @ai-pattern Singleton initialization pattern
     * @ai-critical Must complete before any operations
     */
    initialize(): Promise<void>;
    /**
     * @ai-intent Actual initialization logic
     */
    private initializeAsync;
    getAllStatuses(): Promise<import("./index.js").Status[]>;
    getAllStatusesAsync(): Promise<import("./index.js").Status[]>;
    createStatus(name: string): Promise<import("./index.js").Status>;
    updateStatus(_id: number, _name: string): Promise<boolean>;
    deleteStatus(_id: number): Promise<boolean>;
    getAllTags(): Promise<import("./index.js").Tag[]>;
    getOrCreateTagId(tagName: string): Promise<number>;
    createTag(name: string): Promise<{
        id: number;
        name: string;
    }>;
    deleteTag(name: string): Promise<boolean>;
    searchTagsByPattern(pattern: string): Promise<import("./index.js").Tag[]>;
    createTask(type: string, title: string, content: string, priority?: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<import("../types/unified-types.js").UnifiedItem>;
    getTask(type: string, id: number): Promise<import("../types/unified-types.js").UnifiedItem | null>;
    updateTask(type: string, id: number, title?: string, content?: string, priority?: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<import("../types/unified-types.js").UnifiedItem | null>;
    deleteTask(type: string, id: number): Promise<boolean>;
    getAllTasksSummary(type: string, includeClosedStatuses?: boolean, statuses?: string[]): Promise<import("../types/unified-types.js").UnifiedItem[]>;
    searchTasksByTag(tag: string): Promise<import("../types/unified-types.js").UnifiedItem[]>;
    getTags(): Promise<import("./index.js").Tag[]>;
    searchTags(pattern: string): Promise<import("./index.js").Tag[]>;
    searchAllByTag(tag: string): Promise<GroupedItems>;
    searchAll(query: string): Promise<GroupedItems>;
    createIssue(title: string, content: string, priority: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<{
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        priority: "medium" | "high" | "low";
        status: string | undefined;
        tags: string[];
        start_date: string | null;
        end_date: string | null;
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    }>;
    getIssue(id: number): Promise<{
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        priority: "medium" | "high" | "low";
        status: string | undefined;
        tags: string[];
        start_date: string | null;
        end_date: string | null;
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    } | null>;
    updateIssue(id: number, title?: string, content?: string, priority?: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<{
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        priority: "medium" | "high" | "low";
        status: string | undefined;
        tags: string[];
        start_date: string | null;
        end_date: string | null;
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    } | null>;
    deleteIssue(id: number): Promise<boolean>;
    getAllIssuesSummary(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<{
        id: number;
        title: string;
        description: string | undefined;
        priority: "medium" | "high" | "low";
        status: string | undefined;
        start_date: string | null;
        end_date: string | null;
        tags: string[];
        created_at: string;
        updated_at: string;
    }[]>;
    searchIssuesByTag(tag: string): Promise<{
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        priority: "medium" | "high" | "low";
        status: string | undefined;
        tags: string[];
        start_date: string | null;
        end_date: string | null;
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    }[]>;
    createPlan(title: string, content: string, priority: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<{
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        priority: "medium" | "high" | "low";
        status: string | undefined;
        tags: string[];
        start_date: string | null;
        end_date: string | null;
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    }>;
    getPlan(id: number): Promise<{
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        priority: "medium" | "high" | "low";
        status: string | undefined;
        tags: string[];
        start_date: string | null;
        end_date: string | null;
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    } | null>;
    updatePlan(id: number, title?: string, content?: string, priority?: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<{
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        priority: "medium" | "high" | "low";
        status: string | undefined;
        tags: string[];
        start_date: string | null;
        end_date: string | null;
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    } | null>;
    deletePlan(id: number): Promise<boolean>;
    getAllPlansSummary(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<{
        id: number;
        title: string;
        description: string | undefined;
        priority: "medium" | "high" | "low";
        status: string | undefined;
        start_date: string | null;
        end_date: string | null;
        tags: string[];
        created_at: string;
        updated_at: string;
    }[]>;
    searchPlansByTag(tag: string): Promise<{
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        priority: "medium" | "high" | "low";
        status: string | undefined;
        tags: string[];
        start_date: string | null;
        end_date: string | null;
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    }[]>;
    getAllDocuments(type?: string): Promise<{
        type: string;
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        tags: string[];
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    }[]>;
    getDocument(type: string, id: number): Promise<{
        type: string;
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        tags: string[];
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    } | null>;
    createDocument(type: string, title: string, content: string, tags?: string[], description?: string, related_tasks?: string[], related_documents?: string[]): Promise<{
        type: string;
        id: string;
        title: string;
        description: string | undefined;
        content: string;
        tags: string[];
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    }>;
    updateDocument(type: string, id: number, title?: string, content?: string, tags?: string[], description?: string, related_tasks?: string[], related_documents?: string[]): Promise<boolean>;
    deleteDocument(type: string, id: number): Promise<boolean>;
    searchDocumentsByTag(tag: string, type?: string): Promise<{
        type: string;
        id: number;
        title: string;
        description: string | undefined;
        content: string;
        tags: string[];
        related_tasks: string[] | undefined;
        related_documents: string[] | undefined;
        created_at: string;
        updated_at: string;
    }[]>;
    getAllDocumentsSummary(type?: string): Promise<{
        type: string;
        id: number;
        title: string;
        description: string | undefined;
        tags: string[];
        created_at: string;
        updated_at: string;
    }[]>;
    getAllTypes(): Promise<{
        type: string;
        base_type: string;
        description?: string;
    }[]>;
    createType(name: string, baseType?: 'tasks' | 'documents'): Promise<void>;
    deleteType(name: string): Promise<void>;
    getBaseType(name: string): Promise<string | null>;
    searchContent(query: string): Promise<import("./search-repository.js").SearchRow[]>;
    getItems(type: string): Promise<import("../types/unified-types.js").UnifiedItem[]>;
    getTypes(): Promise<GroupedTypes>;
    searchSessions(query: string): Promise<Session[]>;
    searchSessionsByTag(tag: string): Promise<Session[]>;
    searchDailySummaries(query: string): Promise<Daily[]>;
    /**
     * @ai-intent Clean up resources
     */
    close(): Promise<void>;
}
