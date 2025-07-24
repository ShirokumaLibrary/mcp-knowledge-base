import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { BaseRepository } from './base.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import { TagRepository } from './tag-repository.js';
/**
 * @ai-context Repository for project plan management with timeline support
 * @ai-pattern Repository pattern with markdown persistence and date range tracking
 * @ai-critical Plans can reference issues - maintain referential integrity
 * @ai-dependencies StatusRepository (workflow states), TagRepository (categorization)
 * @ai-assumption Plans follow similar lifecycle as issues but with date ranges
 */
export class PlanRepository extends BaseRepository {
    plansDir;
    statusRepository;
    tagRepository;
    constructor(db, plansDir, statusRepository, tagRepository) {
        super(db, 'PlanRepository');
        this.plansDir = plansDir;
        this.statusRepository = statusRepository;
        this.tagRepository = tagRepository || new TagRepository(db);
        // @ai-async: Directory creation deferred to first operation
    }
    async ensureDirectoryExists() {
        try {
            await fsPromises.access(this.plansDir);
        }
        catch {
            await fsPromises.mkdir(this.plansDir, { recursive: true });
        }
    }
    async getPlanNextId() {
        return this.getNextSequenceValue('plans');
    }
    getPlanFilePath(id) {
        return path.join(this.plansDir, `plan-${id}.md`);
    }
    /**
     * @ai-intent Parse plan data from markdown with date validation
     * @ai-flow 1. Extract metadata -> 2. Validate required fields -> 3. Apply defaults
     * @ai-edge-case Handles missing dates gracefully (null values)
     * @ai-assumption Date format is YYYY-MM-DD or null
     * @ai-logic Related issues are stored as numeric IDs for cross-referencing
     */
    parseMarkdownPlan(content) {
        const { metadata, content: description } = parseMarkdown(content);
        // @ai-logic: ID and title are mandatory for valid plans
        if (!metadata.id || !metadata.title)
            return null;
        return {
            id: metadata.id,
            title: metadata.title,
            description: description || null,
            start_date: metadata.start_date || null, // @ai-edge-case: Plans may not have dates initially
            end_date: metadata.end_date || null,
            priority: metadata.priority || 'medium',
            status_id: metadata.status_id || 1,
            status: metadata.status, // @ai-why: Preserved for database rebuild resilience
            related_issues: Array.isArray(metadata.related_issues) ? metadata.related_issues : [],
            tags: Array.isArray(metadata.tags) ? metadata.tags : [],
            created_at: metadata.created_at || new Date().toISOString(),
            updated_at: metadata.updated_at || new Date().toISOString()
        };
    }
    async writeMarkdownPlan(plan) {
        // Get status name if not already set
        if (!plan.status && plan.status_id) {
            const status = await this.statusRepository.getStatus(plan.status_id);
            plan.status = status?.name;
        }
        const metadata = {
            id: plan.id,
            title: plan.title,
            start_date: plan.start_date || '',
            end_date: plan.end_date || '',
            priority: plan.priority,
            status_id: plan.status_id,
            status: plan.status,
            related_issues: plan.related_issues || [],
            tags: plan.tags || [],
            created_at: plan.created_at,
            updated_at: plan.updated_at
        };
        const content = generateMarkdown(metadata, plan.description || '');
        await fsPromises.writeFile(this.getPlanFilePath(plan.id), content, 'utf8');
    }
    /**
     * @ai-intent Sync plan data to SQLite including timeline information
     * @ai-flow 1. Prepare values -> 2. Execute UPSERT -> 3. Handle errors
     * @ai-side-effects Updates search_plans table, enables date-range queries
     * @ai-assumption Empty dates stored as empty strings for SQL compatibility
     * @ai-why Related issues not in search table - retrieved via separate queries
     */
    async syncPlanToSQLite(plan) {
        await this.db.runAsync(`
      INSERT OR REPLACE INTO search_plans 
      (id, title, description, priority, status_id, start_date, end_date, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            plan.id, plan.title, plan.description || '',
            plan.priority, plan.status_id,
            plan.start_date || '', plan.end_date || '', // @ai-logic: Empty strings for NULL dates
            JSON.stringify(plan.tags || []),
            plan.created_at, plan.updated_at
        ]);
    }
    async getAllPlans() {
        await this.ensureDirectoryExists();
        const files = await fsPromises.readdir(this.plansDir);
        const planFiles = files.filter(f => f.startsWith('plan-') && f.endsWith('.md'));
        const planPromises = planFiles.map(async (file) => {
            try {
                const content = await fsPromises.readFile(path.join(this.plansDir, file), 'utf8');
                const plan = this.parseMarkdownPlan(content);
                if (plan) {
                    const status = await this.statusRepository.getStatus(plan.status_id);
                    plan.status = status?.name;
                    return plan;
                }
                return null;
            }
            catch (error) {
                this.logger.error(`Error reading plan file ${file}:`, { error });
                return null;
            }
        });
        const results = await Promise.all(planPromises);
        const plans = results.filter((plan) => plan !== null);
        return plans.sort((a, b) => a.id - b.id);
    }
    async createPlan(title, description, priority = 'medium', status_id, start_date, end_date, tags) {
        await this.ensureDirectoryExists();
        let finalStatusId;
        if (!status_id) {
            const statuses = await this.statusRepository.getAllStatuses();
            finalStatusId = statuses.length > 0 ? statuses[0].id : 1;
        }
        else {
            finalStatusId = status_id;
        }
        const now = new Date().toISOString();
        const plan = {
            id: await this.getPlanNextId(),
            title,
            description: description || null,
            start_date: start_date || null,
            end_date: end_date || null,
            priority,
            status_id: finalStatusId,
            related_issues: [],
            tags: tags || [],
            created_at: now,
            updated_at: now
        };
        // Ensure tags exist before writing plan
        if (plan.tags && plan.tags.length > 0) {
            await this.tagRepository.ensureTagsExist(plan.tags);
        }
        await this.writeMarkdownPlan(plan);
        await this.syncPlanToSQLite(plan);
        const status = await this.statusRepository.getStatus(finalStatusId);
        plan.status = status?.name;
        return plan;
    }
    async updatePlan(id, title, description, priority, status_id, start_date, end_date, tags) {
        const filePath = this.getPlanFilePath(id);
        try {
            await fsPromises.access(filePath);
        }
        catch {
            return false;
        }
        try {
            const content = await fsPromises.readFile(filePath, 'utf8');
            const plan = this.parseMarkdownPlan(content);
            if (!plan)
                return false;
            if (title !== undefined)
                plan.title = title;
            if (description !== undefined)
                plan.description = description;
            if (priority !== undefined)
                plan.priority = priority;
            if (status_id !== undefined)
                plan.status_id = status_id;
            if (start_date !== undefined)
                plan.start_date = start_date;
            if (end_date !== undefined)
                plan.end_date = end_date;
            if (tags !== undefined)
                plan.tags = tags;
            plan.updated_at = new Date().toISOString();
            // Ensure tags exist before writing plan
            if (plan.tags && plan.tags.length > 0) {
                await this.tagRepository.ensureTagsExist(plan.tags);
            }
            await this.writeMarkdownPlan(plan);
            await this.syncPlanToSQLite(plan);
            return true;
        }
        catch (error) {
            this.logger.error(`Error updating plan ${id}:`, { error });
            return false;
        }
    }
    async deletePlan(id) {
        const filePath = this.getPlanFilePath(id);
        try {
            await fsPromises.access(filePath);
        }
        catch {
            return false;
        }
        try {
            await fsPromises.unlink(filePath);
            await this.db.runAsync('DELETE FROM search_plans WHERE id = ?', [id]);
            return true;
        }
        catch (error) {
            this.logger.error(`Error deleting plan ${id}:`, { error });
            return false;
        }
    }
    async getPlan(id) {
        const filePath = this.getPlanFilePath(id);
        try {
            const content = await fsPromises.readFile(filePath, 'utf8');
            const plan = this.parseMarkdownPlan(content);
            if (plan) {
                const status = await this.statusRepository.getStatus(plan.status_id);
                plan.status = status?.name;
            }
            return plan;
        }
        catch (error) {
            this.logger.error(`Error reading plan ${id}:`, { error });
            return null;
        }
    }
    async searchPlansByTag(tag) {
        const allPlans = await this.getAllPlans();
        return allPlans.filter(plan => plan.tags && plan.tags.includes(tag));
    }
}
//# sourceMappingURL=plan-repository.js.map