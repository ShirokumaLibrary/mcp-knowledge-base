/**
 * @ai-context Refactored database class with facade pattern
 * @ai-pattern Separation of concerns using facades for each domain
 * @ai-critical Main database entry point with backward compatibility
 * @ai-why Cleaner architecture while maintaining existing API
 * @ai-assumption All operations go through facades for consistency
 */

import * as path from 'path';
import { DatabaseConnection } from './base.js';
import { StatusRepository } from './status-repository.js';
import { TagRepository } from './tag-repository.js';
import { IssueRepository } from './issue-repository.js';
import { PlanRepository } from './plan-repository.js';
import { KnowledgeRepository } from './knowledge-repository.js';
import { DocRepository } from './doc-repository.js';
import { SearchRepository } from './search-repository.js';

// Facades
import { IssueFacade } from './facades/issue-facade.js';
import { PlanFacade } from './facades/plan-facade.js';
import { KnowledgeFacade } from './facades/knowledge-facade.js';
import { DocFacade } from './facades/doc-facade.js';

// Re-export types
export * from '../types/domain-types.js';

/**
 * @ai-context Refactored database class with improved architecture
 * @ai-pattern Facade pattern for clean separation of concerns
 * @ai-critical Maintains backward compatibility while improving structure
 * @ai-lifecycle Initialize -> Create facades -> Delegate operations
 * @ai-why Original class had too many responsibilities
 */
export class FileIssueDatabaseRefactored {
  private connection: DatabaseConnection;
  private initializationPromise: Promise<void> | null = null;  // @ai-pattern: Singleton initialization
  
  // @ai-logic: Core repositories shared across facades
  private statusRepo!: StatusRepository;  // @ai-note: ! operator - initialized in initializeAsync
  private tagRepo!: TagRepository;        // @ai-note: ! operator - initialized in initializeAsync
  private searchRepo!: SearchRepository;  // @ai-note: ! operator - initialized in initializeAsync
  
  // @ai-pattern: Public facades for domain-specific operations
  public issues!: IssueFacade;      // @ai-logic: Issue management operations
  public plans!: PlanFacade;        // @ai-logic: Plan management with timeline
  public knowledge!: KnowledgeFacade; // @ai-logic: Knowledge base articles
  public docs!: DocFacade;          // @ai-logic: Technical documentation

  constructor(
    private dataDir: string,
    private dbPath: string = path.join(dataDir, 'search.db')
  ) {
    this.connection = new DatabaseConnection(this.dbPath);
  }

  /**
   * @ai-intent Initialize database and all facades
   * @ai-flow 1. Check if already initializing -> 2. Create promise -> 3. Initialize components
   * @ai-pattern Singleton initialization to prevent race conditions
   * @ai-critical Must be called before any database operations
   * @ai-why Ensures all components are ready before use
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;  // @ai-logic: Return existing promise to prevent double init
    }

    this.initializationPromise = this.initializeAsync();
    return this.initializationPromise;
  }

  /**
   * @ai-intent Perform actual initialization of all components
   * @ai-flow 1. Init DB -> 2. Create core repos -> 3. Create feature repos -> 4. Create facades
   * @ai-critical Order matters: core repos must exist before feature repos
   * @ai-side-effects Creates SQLite tables, prepares file directories
   * @ai-why Separate method allows promise caching in initialize()
   */
  private async initializeAsync(): Promise<void> {
    await this.connection.initialize();
    const db = this.connection.getDatabase();

    // @ai-logic: Core repositories have no dependencies on each other
    this.statusRepo = new StatusRepository(db);
    this.tagRepo = new TagRepository(db);

    // @ai-logic: Feature repositories depend on core repositories
    const issueRepo = new IssueRepository(db, path.join(this.dataDir, 'issues'), this.statusRepo, this.tagRepo);
    const planRepo = new PlanRepository(db, path.join(this.dataDir, 'plans'), this.statusRepo, this.tagRepo);
    const knowledgeRepo = new KnowledgeRepository(db, path.join(this.dataDir, 'knowledge'), this.tagRepo);
    const docRepo = new DocRepository(db, path.join(this.dataDir, 'docs'), this.tagRepo);

    // @ai-logic: Search repository needs all feature repositories
    this.searchRepo = new SearchRepository(db, issueRepo, planRepo, knowledgeRepo, docRepo);

    // @ai-logic: Facades wrap repositories with initialization handling
    this.issues = new IssueFacade(this.connection, issueRepo, this.statusRepo, this.tagRepo, this.initializationPromise);
    this.plans = new PlanFacade(this.connection, planRepo, this.statusRepo, this.tagRepo, this.initializationPromise);
    this.knowledge = new KnowledgeFacade(this.connection, knowledgeRepo, this.statusRepo, this.tagRepo, this.initializationPromise);
    this.docs = new DocFacade(this.connection, docRepo, this.statusRepo, this.tagRepo, this.initializationPromise);
  }

  // @ai-section Core status methods
  // @ai-intent Direct access to status operations
  // @ai-why Status and tags are core concepts used across all domains
  
  async getAllStatuses() {
    await this.ensureInitialized();
    return this.statusRepo.getAllStatuses();
  }

  async createStatus(name: string) {
    await this.ensureInitialized();
    return this.statusRepo.createStatus(name);
  }

  async updateStatus(id: number, name: string) {
    await this.ensureInitialized();
    return this.statusRepo.updateStatus(id, name);
  }

  async deleteStatus(id: number) {
    await this.ensureInitialized();
    return this.statusRepo.deleteStatus(id);
  }

  // @ai-section Core tag methods
  // @ai-intent Direct access to tag operations
  // @ai-pattern Tags are shared across all content types
  
  async getAllTags() {
    await this.ensureInitialized();
    return this.tagRepo.getTags();
  }

  async createTag(name: string) {
    await this.ensureInitialized();
    return this.tagRepo.createTag(name);
  }

  async deleteTag(name: string) {
    await this.ensureInitialized();
    return this.tagRepo.deleteTag(name);
  }

  async searchTags(pattern: string) {
    await this.ensureInitialized();
    return this.tagRepo.getTagsByPattern(pattern);
  }

  // @ai-section Search methods
  /**
   * @ai-intent Cross-domain tag search
   * @ai-flow 1. Ensure init -> 2. Parallel search all types -> 3. Return grouped results
   * @ai-performance Parallel execution for better performance
   * @ai-return Object with arrays for each content type
   * @ai-why Unified search across all domains
   */
  async searchAllByTag(tag: string) {
    await this.ensureInitialized();
    const [issues, plans, docs, knowledge] = await Promise.all([
      this.issues.searchIssuesByTag(tag),
      this.plans.searchPlansByTag(tag),
      this.docs.searchDocsByTag(tag),
      this.knowledge.searchKnowledgeByTag(tag)
    ]);

    return { issues, plans, docs, knowledge };
  }

  // @ai-section Utility methods
  /**
   * @ai-intent Close database connections
   * @ai-critical Should be called on shutdown
   * @ai-side-effects Closes SQLite connection
   */
  async close() {
    await this.connection.close();
  }

  /**
   * @ai-intent Ensure database is initialized before operations
   * @ai-pattern Guard method for all public operations
   * @ai-critical Prevents operations on uninitialized database
   */
  private async ensureInitialized() {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  // @ai-section Backward compatibility methods
  // @ai-intent Maintain existing API while using new facade architecture
  // @ai-pattern All methods delegate to appropriate facade
  // @ai-why Allows gradual migration to facade-based API
  
  async createIssue(...args: Parameters<IssueFacade['createIssue']>) {
    return this.issues.createIssue(...args);
  }

  async getIssue(id: number) {
    return this.issues.getIssue(id);
  }

  async updateIssue(...args: Parameters<IssueFacade['updateIssue']>) {
    return this.issues.updateIssue(...args);
  }

  async deleteIssue(id: number) {
    return this.issues.deleteIssue(id);
  }

  async getAllIssues() {
    return this.issues.getAllIssues();
  }

  async getAllIssuesSummary() {
    return this.issues.getAllIssuesSummary();
  }

  async searchIssuesByTag(tag: string) {
    return this.issues.searchIssuesByTag(tag);
  }

  // Plan backward compatibility
  async createPlan(...args: Parameters<PlanFacade['createPlan']>) {
    return this.plans.createPlan(...args);
  }

  async getPlan(id: number) {
    return this.plans.getPlan(id);
  }

  async updatePlan(...args: Parameters<PlanFacade['updatePlan']>) {
    return this.plans.updatePlan(...args);
  }

  async deletePlan(id: number) {
    return this.plans.deletePlan(id);
  }

  async getAllPlans() {
    return this.plans.getAllPlans();
  }

  async searchPlansByTag(tag: string) {
    return this.plans.searchPlansByTag(tag);
  }

  // Knowledge backward compatibility
  async createKnowledge(...args: Parameters<KnowledgeFacade['createKnowledge']>) {
    return this.knowledge.createKnowledge(...args);
  }

  async getKnowledge(id: number) {
    return this.knowledge.getKnowledge(id);
  }

  async updateKnowledge(...args: Parameters<KnowledgeFacade['updateKnowledge']>) {
    return this.knowledge.updateKnowledge(...args);
  }

  async deleteKnowledge(id: number) {
    return this.knowledge.deleteKnowledge(id);
  }

  async getAllKnowledge() {
    return this.knowledge.getAllKnowledge();
  }

  async searchKnowledgeByTag(tag: string) {
    return this.knowledge.searchKnowledgeByTag(tag);
  }

  // Doc backward compatibility
  async createDoc(...args: Parameters<DocFacade['createDoc']>) {
    return this.docs.createDoc(...args);
  }

  async getDoc(id: number) {
    return this.docs.getDoc(id);
  }

  async updateDoc(...args: Parameters<DocFacade['updateDoc']>) {
    return this.docs.updateDoc(...args);
  }

  async deleteDoc(id: number) {
    return this.docs.deleteDoc(id);
  }

  async getAllDocs() {
    return this.docs.getAllDocs();
  }

  async getDocsSummary() {
    return this.docs.getDocsSummary();
  }

  async searchDocsByTag(tag: string) {
    return this.docs.searchDocsByTag(tag);
  }
}