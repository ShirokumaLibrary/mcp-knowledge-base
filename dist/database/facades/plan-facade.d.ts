/**
 * @ai-context Facade for project plan management
 * @ai-pattern Simplifies plan repository with timeline support
 * @ai-critical Handles date validation and status defaults
 * @ai-dependencies PlanRepository for persistence, StatusRepository for defaults
 * @ai-why Plans have additional complexity with date ranges and related issues
 */
import { BaseFacade } from './base-facade.js';
import { PlanRepository } from '../plan-repository.js';
import { Plan, PlanSummary } from '../../types/domain-types.js';
import { DatabaseConnection } from '../base.js';
import { StatusRepository } from '../status-repository.js';
import { TagRepository } from '../tag-repository.js';
export declare class PlanFacade extends BaseFacade {
    private planRepo;
    private initPromise;
    constructor(connection: DatabaseConnection, planRepo: PlanRepository, // @ai-logic: Repository for plan operations
    statusRepo: StatusRepository, tagRepo: TagRepository, initPromise?: Promise<void> | null);
    /**
     * @ai-intent Create new plan with timeline and smart defaults
     * @ai-flow 1. Ensure init -> 2. Default status to 'Planned' -> 3. Create plan
     * @ai-critical Defaults to 'Planned' status for new plans
     * @ai-validation Dates should be YYYY-MM-DD format
     * @ai-assumption start_date should be <= end_date (not enforced here)
     * @ai-side-effects Creates markdown file and SQLite record
     */
    createPlan(title: string, content?: string, priority?: string, status?: string, startDate?: string, // @ai-pattern: YYYY-MM-DD or undefined
    endDate?: string, // @ai-pattern: YYYY-MM-DD or undefined
    tags?: string[], summary?: string): Promise<Plan>;
    getPlan(id: number): Promise<Plan | null>;
    updatePlan(id: number, title?: string, content?: string, priority?: string, status?: string, startDate?: string, endDate?: string, tags?: string[], summary?: string): Promise<boolean>;
    deletePlan(id: number): Promise<boolean>;
    getAllPlans(): Promise<Plan[]>;
    searchPlansByTag(tag: string): Promise<Plan[]>;
    /**
     * @ai-intent Get lightweight plan summaries for lists
     * @ai-performance Excludes content for speed
     * @ai-return Array of summary objects with minimal fields
     * @ai-why Optimized for UI list rendering performance
     */
    getAllPlansSummary(): Promise<PlanSummary[]>;
}
