/**
 * @ai-context Refactored database class with facade pattern
 * @ai-pattern Separation of concerns using facades for each domain
 * @ai-critical Main database entry point with backward compatibility
 * @ai-why Cleaner architecture while maintaining existing API
 * @ai-assumption All operations go through facades for consistency
 */
import { IssueFacade } from './facades/issue-facade.js';
import { PlanFacade } from './facades/plan-facade.js';
import { KnowledgeFacade } from './facades/knowledge-facade.js';
import { DocFacade } from './facades/doc-facade.js';
export * from '../types/domain-types.js';
/**
 * @ai-context Refactored database class with improved architecture
 * @ai-pattern Facade pattern for clean separation of concerns
 * @ai-critical Maintains backward compatibility while improving structure
 * @ai-lifecycle Initialize -> Create facades -> Delegate operations
 * @ai-why Original class had too many responsibilities
 */
export declare class FileIssueDatabaseRefactored {
    private dataDir;
    private dbPath;
    private connection;
    private initializationPromise;
    private statusRepo;
    private tagRepo;
    private searchRepo;
    issues: IssueFacade;
    plans: PlanFacade;
    knowledge: KnowledgeFacade;
    docs: DocFacade;
    constructor(dataDir: string, dbPath?: string);
    /**
     * @ai-intent Initialize database and all facades
     * @ai-flow 1. Check if already initializing -> 2. Create promise -> 3. Initialize components
     * @ai-pattern Singleton initialization to prevent race conditions
     * @ai-critical Must be called before any database operations
     * @ai-why Ensures all components are ready before use
     */
    initialize(): Promise<void>;
    /**
     * @ai-intent Perform actual initialization of all components
     * @ai-flow 1. Init DB -> 2. Create core repos -> 3. Create feature repos -> 4. Create facades
     * @ai-critical Order matters: core repos must exist before feature repos
     * @ai-side-effects Creates SQLite tables, prepares file directories
     * @ai-why Separate method allows promise caching in initialize()
     */
    private initializeAsync;
    getAllStatuses(): Promise<import("./index.js").Status[]>;
    createStatus(name: string): Promise<import("./index.js").Status>;
    updateStatus(id: number, name: string): Promise<boolean>;
    deleteStatus(id: number): Promise<boolean>;
    getAllTags(): Promise<import("./index.js").Tag[]>;
    createTag(name: string): Promise<string>;
    deleteTag(name: string): Promise<boolean>;
    searchTags(pattern: string): Promise<import("./index.js").Tag[]>;
    /**
     * @ai-intent Cross-domain tag search
     * @ai-flow 1. Ensure init -> 2. Parallel search all types -> 3. Return grouped results
     * @ai-performance Parallel execution for better performance
     * @ai-return Object with arrays for each content type
     * @ai-why Unified search across all domains
     */
    searchAllByTag(tag: string): Promise<{
        issues: import("./index.js").Issue[];
        plans: import("./index.js").Plan[];
        docs: import("./index.js").Doc[];
        knowledge: import("./index.js").Knowledge[];
    }>;
    /**
     * @ai-intent Close database connections
     * @ai-critical Should be called on shutdown
     * @ai-side-effects Closes SQLite connection
     */
    close(): Promise<void>;
    /**
     * @ai-intent Ensure database is initialized before operations
     * @ai-pattern Guard method for all public operations
     * @ai-critical Prevents operations on uninitialized database
     */
    private ensureInitialized;
    createIssue(...args: Parameters<IssueFacade['createIssue']>): Promise<import("./index.js").Issue>;
    getIssue(id: number): Promise<import("./index.js").Issue | null>;
    updateIssue(...args: Parameters<IssueFacade['updateIssue']>): Promise<boolean>;
    deleteIssue(id: number): Promise<boolean>;
    getAllIssues(): Promise<import("./index.js").Issue[]>;
    getAllIssuesSummary(): Promise<import("./index.js").IssueSummary[]>;
    searchIssuesByTag(tag: string): Promise<import("./index.js").Issue[]>;
    createPlan(...args: Parameters<PlanFacade['createPlan']>): Promise<import("./index.js").Plan>;
    getPlan(id: number): Promise<import("./index.js").Plan | null>;
    updatePlan(...args: Parameters<PlanFacade['updatePlan']>): Promise<boolean>;
    deletePlan(id: number): Promise<boolean>;
    getAllPlans(): Promise<import("./index.js").Plan[]>;
    searchPlansByTag(tag: string): Promise<import("./index.js").Plan[]>;
    createKnowledge(...args: Parameters<KnowledgeFacade['createKnowledge']>): Promise<import("./index.js").Knowledge>;
    getKnowledge(id: number): Promise<import("./index.js").Knowledge | null>;
    updateKnowledge(...args: Parameters<KnowledgeFacade['updateKnowledge']>): Promise<boolean>;
    deleteKnowledge(id: number): Promise<boolean>;
    getAllKnowledge(): Promise<import("./index.js").Knowledge[]>;
    searchKnowledgeByTag(tag: string): Promise<import("./index.js").Knowledge[]>;
    createDoc(...args: Parameters<DocFacade['createDoc']>): Promise<import("./index.js").Doc>;
    getDoc(id: number): Promise<import("./index.js").Doc | null>;
    updateDoc(...args: Parameters<DocFacade['updateDoc']>): Promise<boolean>;
    deleteDoc(id: number): Promise<boolean>;
    getAllDocs(): Promise<import("./index.js").Doc[]>;
    getDocsSummary(): Promise<{
        id: number;
        title: string;
    }[]>;
    searchDocsByTag(tag: string): Promise<import("./index.js").Doc[]>;
}
