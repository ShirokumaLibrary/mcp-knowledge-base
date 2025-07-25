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

export class PlanFacade extends BaseFacade {
  constructor(
    connection: DatabaseConnection,
    private planRepo: PlanRepository,  // @ai-logic: Repository for plan operations
    statusRepo: StatusRepository,
    tagRepo: TagRepository,
    private initPromise: Promise<void> | null = null  // @ai-pattern: Async init tracking
  ) {
    super(connection, statusRepo, tagRepo);
  }

  /**
   * @ai-intent Create new plan with timeline and smart defaults
   * @ai-flow 1. Ensure init -> 2. Default status to 'Planned' -> 3. Create plan
   * @ai-critical Defaults to 'Planned' status for new plans
   * @ai-validation Dates should be YYYY-MM-DD format
   * @ai-assumption start_date should be <= end_date (not enforced here)
   * @ai-side-effects Creates markdown file and SQLite record
   */
  async createPlan(
    title: string,
    content?: string,
    priority: string = 'medium',
    status?: string,
    startDate?: string,   // @ai-pattern: YYYY-MM-DD or undefined
    endDate?: string,     // @ai-pattern: YYYY-MM-DD or undefined
    tags: string[] = [],
    description?: string
  ): Promise<Plan> {
    await this.ensureInitialized(this.initPromise);
    if (!status) {
      status = 'Open';  // @ai-logic: Default to 'Open' status
    }
    return this.planRepo.createPlan(title, content || '', priority, status, startDate, endDate, tags, description);
  }

  async getPlan(id: number): Promise<Plan | null> {
    await this.ensureInitialized(this.initPromise);
    return this.planRepo.getPlan(id);
  }

  async updatePlan(
    id: number,
    title?: string,
    content?: string,
    priority?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
    tags?: string[],
    description?: string
  ): Promise<boolean> {
    await this.ensureInitialized(this.initPromise);
    return this.planRepo.updatePlan(id, title, content, priority, status, startDate, endDate, tags, description);
  }

  async deletePlan(id: number): Promise<boolean> {
    await this.ensureInitialized(this.initPromise);
    return this.planRepo.deletePlan(id);
  }

  async getAllPlans(): Promise<Plan[]> {
    await this.ensureInitialized(this.initPromise);
    return this.planRepo.getAllPlans();
  }

  async searchPlansByTag(tag: string): Promise<Plan[]> {
    await this.ensureInitialized(this.initPromise);
    return this.planRepo.searchPlansByTag(tag);
  }

  /**
   * @ai-intent Get lightweight plan summaries for lists
   * @ai-performance Excludes content for speed
   * @ai-return Array of summary objects with minimal fields
   * @ai-why Optimized for UI list rendering performance
   */
  async getAllPlansSummary(): Promise<PlanSummary[]> {
    await this.ensureInitialized(this.initPromise);
    return this.planRepo.getAllPlansSummary();
  }
}