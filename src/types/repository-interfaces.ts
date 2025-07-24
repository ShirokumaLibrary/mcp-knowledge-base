/**
 * @ai-context Repository interfaces for dependency injection
 * @ai-pattern Interface segregation for loose coupling
 * @ai-critical Prevents circular dependencies between repositories
 * @ai-debt Heavy use of 'any' type - needs proper typing
 * @ai-why Enables testing with mock implementations
 */

/**
 * @ai-intent Status repository contract
 * @ai-pattern CRUD operations for workflow statuses
 * @ai-critical Used by IssueRepository and PlanRepository
 * @ai-debt Replace 'any' with proper Status type
 */
export interface IStatusRepository {
  getStatus(id: number): Promise<any>;  // @ai-debt: Should return Status | null
  getAllStatuses(): Promise<Array<{id: number; name: string}>>;
  createStatus(name: string): Promise<{id: number; name: string}>;
  updateStatus(id: number, name: string): Promise<boolean>;
  deleteStatus(id: number): Promise<boolean>;
}

/**
 * @ai-intent Tag repository contract
 * @ai-pattern Tag management across all content types
 * @ai-critical Shared by all content repositories
 * @ai-debt Missing proper Tag type definitions
 */
export interface ITagRepository {
  getTag(id: number): Promise<any>;              // @ai-debt: Tag | null
  getAllTags(): Promise<any[]>;                  // @ai-debt: Tag[]
  createTag(name: string): Promise<any>;         // @ai-debt: Tag
  deleteTag(id: number): Promise<boolean>;
  searchTags(pattern: string): Promise<any[]>;   // @ai-debt: Tag[]
}

export interface IIssueRepository {
  getAllIssues(): Promise<any[]>;
  getAllIssuesSummary(): Promise<any[]>;
  createIssue(title: string, description?: string, priority?: string, status_id?: number, tags?: string[]): Promise<any>;
  updateIssue(id: number, title?: string, description?: string, priority?: string, status_id?: number, tags?: string[]): Promise<boolean>;
  deleteIssue(id: number): Promise<boolean>;
  getIssue(id: number): Promise<any | null>;
  searchIssuesByTag(tag: string): Promise<any[]>;
}

export interface IPlanRepository {
  getAllPlans(): Promise<any[]>;
  getAllPlansSummary(): Promise<any[]>;
  createPlan(title: string, description?: string, priority?: string, status_id?: number, tags?: string[], start_date?: string, end_date?: string): Promise<any>;
  updatePlan(id: number, title?: string, description?: string, priority?: string, status_id?: number, tags?: string[], start_date?: string, end_date?: string): Promise<boolean>;
  deletePlan(id: number): Promise<boolean>;
  getPlan(id: number): Promise<any | null>;
  searchPlansByTag(tag: string): Promise<any[]>;
}

export interface IDocRepository {
  getAllDocs(): Promise<any[]>;
  getAllDocsSummary(): Promise<any[]>;
  createDoc(title: string, content: string, tags?: string[]): Promise<any>;
  updateDoc(id: number, title?: string, content?: string, tags?: string[]): Promise<boolean>;
  deleteDoc(id: number): Promise<boolean>;
  getDoc(id: number): Promise<any | null>;
  searchDocsByTag(tag: string): Promise<any[]>;
}

export interface IKnowledgeRepository {
  getAllKnowledge(): Promise<any[]>;
  getAllKnowledgeSummary(): Promise<any[]>;
  createKnowledge(title: string, content: string, tags?: string[]): Promise<any>;
  updateKnowledge(id: number, title?: string, content?: string, tags?: string[]): Promise<boolean>;
  deleteKnowledge(id: number): Promise<boolean>;
  getKnowledge(id: number): Promise<any | null>;
  searchKnowledgeByTag(tag: string): Promise<any[]>;
}

/**
 * @ai-intent Search repository contract
 * @ai-pattern Cross-type search operations
 * @ai-critical Central search functionality
 * @ai-return Categorized results by content type
 * @ai-debt Type safety needed for search results
 */
export interface ISearchRepository {
  searchAllByTag(tag: string): Promise<{    // @ai-pattern: Unified tag search
    issues: any[];      // @ai-debt: Issue[]
    plans: any[];       // @ai-debt: Plan[]
    docs: any[];        // @ai-debt: Doc[]
    knowledge: any[];   // @ai-debt: Knowledge[]
    sessions?: any[];   // @ai-debt: WorkSession[] (optional)
  }>;
  searchSessionsByTag(tag: string): Promise<any[]>;      // @ai-debt: WorkSession[]
  searchSessionsByContent(query: string): Promise<any[]>; // @ai-debt: WorkSession[]
}