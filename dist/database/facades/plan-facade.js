/**
 * @ai-context Facade for project plan management
 * @ai-pattern Simplifies plan repository with timeline support
 * @ai-critical Handles date validation and status defaults
 * @ai-dependencies PlanRepository for persistence, StatusRepository for defaults
 * @ai-why Plans have additional complexity with date ranges and related issues
 */
import { BaseFacade } from './base-facade.js';
export class PlanFacade extends BaseFacade {
    planRepo;
    initPromise;
    constructor(connection, planRepo, // @ai-logic: Repository for plan operations
    statusRepo, tagRepo, initPromise = null // @ai-pattern: Async init tracking
    ) {
        super(connection, statusRepo, tagRepo);
        this.planRepo = planRepo;
        this.initPromise = initPromise;
    }
    /**
     * @ai-intent Create new plan with timeline and smart defaults
     * @ai-flow 1. Ensure init -> 2. Default status to 'Planned' -> 3. Create plan
     * @ai-critical Defaults to 'Planned' status for new plans
     * @ai-validation Dates should be YYYY-MM-DD format
     * @ai-assumption start_date should be <= end_date (not enforced here)
     * @ai-side-effects Creates markdown file and SQLite record
     */
    async createPlan(title, content, priority = 'medium', status, startDate, // @ai-pattern: YYYY-MM-DD or undefined
    endDate, // @ai-pattern: YYYY-MM-DD or undefined
    tags = [], summary) {
        await this.ensureInitialized(this.initPromise);
        if (!status) {
            status = 'Open'; // @ai-logic: Default to 'Open' status
        }
        return this.planRepo.createPlan(title, content || '', priority, status, startDate, endDate, tags, summary);
    }
    async getPlan(id) {
        await this.ensureInitialized(this.initPromise);
        return this.planRepo.getPlan(id);
    }
    async updatePlan(id, title, content, priority, status, startDate, endDate, tags, summary) {
        await this.ensureInitialized(this.initPromise);
        return this.planRepo.updatePlan(id, title, content, priority, status, startDate, endDate, tags, summary);
    }
    async deletePlan(id) {
        await this.ensureInitialized(this.initPromise);
        return this.planRepo.deletePlan(id);
    }
    async getAllPlans() {
        await this.ensureInitialized(this.initPromise);
        return this.planRepo.getAllPlans();
    }
    async searchPlansByTag(tag) {
        await this.ensureInitialized(this.initPromise);
        return this.planRepo.searchPlansByTag(tag);
    }
    /**
     * @ai-intent Get lightweight plan summaries for lists
     * @ai-performance Excludes content for speed
     * @ai-return Array of summary objects with minimal fields
     * @ai-why Optimized for UI list rendering performance
     */
    async getAllPlansSummary() {
        await this.ensureInitialized(this.initPromise);
        return this.planRepo.getAllPlansSummary();
    }
}
//# sourceMappingURL=plan-facade.js.map