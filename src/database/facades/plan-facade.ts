/**
 * @ai-context Facade for project plan management
 * @ai-pattern Simplifies plan repository with timeline support
 * @ai-critical Handles date validation and status defaults
 * @ai-dependencies PlanRepository for persistence, StatusRepository for defaults
 * @ai-why Plans have additional complexity with date ranges and related issues
 */

import { BaseFacade } from './base-facade.js';
import { PlanRepository } from '../plan-repository.js';
import { Plan } from '../../types/domain-types.js';
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
    description?: string,
    priority: string = 'medium',
    statusId?: number,
    startDate?: string,   // @ai-pattern: YYYY-MM-DD or undefined
    endDate?: string,     // @ai-pattern: YYYY-MM-DD or undefined
    tags: string[] = []
  ): Promise<Plan> {
    await this.ensureInitialized(this.initPromise);
    if (!statusId) {
      const statuses = await this.statusRepo.getAllStatuses();
      const plannedStatus = statuses.find(s => s.name === 'Planned');  // @ai-logic: Plans start as 'Planned'
      statusId = plannedStatus ? plannedStatus.id : 1;  // @ai-fallback: Default to ID 1
    }
    return this.planRepo.createPlan(title, description || '', priority, statusId, startDate, endDate, tags);
  }

  async getPlan(id: number): Promise<Plan | null> {
    await this.ensureInitialized(this.initPromise);
    return this.planRepo.getPlan(id);
  }

  async updatePlan(
    id: number,
    title?: string,
    description?: string,
    priority?: string,
    statusId?: number,
    startDate?: string,
    endDate?: string,
    tags?: string[]
  ): Promise<boolean> {
    await this.ensureInitialized(this.initPromise);
    return this.planRepo.updatePlan(id, title, description, priority, statusId, startDate, endDate, tags);
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
}