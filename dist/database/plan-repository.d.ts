import { BaseRepository, Database } from './base.js';
import { Plan, PlanInternal, PlanSummary } from '../types/domain-types.js';
import { IStatusRepository } from '../types/repository-interfaces.js';
import { TagRepository } from './tag-repository.js';
/**
 * @ai-context Repository for project plan management with timeline support
 * @ai-pattern Repository pattern with markdown persistence and date range tracking
 * @ai-critical Plans can reference issues - maintain referential integrity
 * @ai-dependencies StatusRepository (workflow states), TagRepository (categorization)
 * @ai-assumption Plans follow similar lifecycle as issues but with date ranges
 */
export declare class PlanRepository extends BaseRepository {
    private plansDir;
    private statusRepository;
    private tagRepository;
    constructor(db: Database, plansDir: string, statusRepository: IStatusRepository, tagRepository?: TagRepository);
    private ensureDirectoryExists;
    private getPlanNextId;
    private getPlanFilePath;
    /**
     * @ai-intent Parse plan data from markdown with date validation
     * @ai-flow 1. Extract metadata -> 2. Validate required fields -> 3. Apply defaults
     * @ai-edge-case Handles missing dates gracefully (null values)
     * @ai-assumption Date format is YYYY-MM-DD or null
     * @ai-logic Related issues are stored as numeric IDs for cross-referencing
     */
    private parseMarkdownPlan;
    /**
     * @ai-intent Convert internal plan representation to external API format
     * @ai-logic Removes status_id from the response
     * @ai-critical Ensures internal IDs are not exposed in API responses
     */
    private toExternalPlan;
    private writeMarkdownPlan;
    /**
     * @ai-intent Sync plan data to SQLite including timeline information
     * @ai-flow 1. Prepare values -> 2. Execute UPSERT -> 3. Update tag relationships
     * @ai-side-effects Updates search_plans table and plan_tags relationship table
     * @ai-assumption Empty dates stored as empty strings for SQL compatibility
     * @ai-why Related issues not in search table - retrieved via separate queries
     * @ai-database-schema Uses plan_tags relationship table for normalized tag storage
     */
    syncPlanToSQLite(plan: PlanInternal): Promise<void>;
    getAllPlans(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<Plan[]>;
    getAllPlansSummary(includeClosedStatuses?: boolean, statusIds?: number[]): Promise<PlanSummary[]>;
    createPlan(title: string, content?: string, priority?: string, status?: string, start_date?: string, end_date?: string, tags?: string[], summary?: string): Promise<Plan>;
    updatePlan(id: number, title?: string, content?: string, priority?: string, status?: string, start_date?: string, end_date?: string, tags?: string[], summary?: string): Promise<boolean>;
    deletePlan(id: number): Promise<boolean>;
    getPlan(id: number): Promise<Plan | null>;
    /**
     * @ai-intent Search plans by exact tag match using relationship table
     * @ai-flow 1. Get tag ID -> 2. JOIN with plan_tags -> 3. Load full plans
     * @ai-performance Uses indexed JOIN instead of LIKE search
     * @ai-database-schema Leverages plan_tags relationship table
     */
    searchPlansByTag(tag: string): Promise<Plan[]>;
}
