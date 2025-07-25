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
    async parseMarkdownPlan(content) {
        const { metadata, content: contentBody } = parseMarkdown(content);
        // @ai-logic: ID and title are mandatory for valid plans
        if (!metadata.id || !metadata.title)
            return null;
        // @ai-logic: Resolve status_id from status name
        let status_id = 1; // Default to first status
        if (metadata.status) {
            const statuses = await this.statusRepository.getAllStatuses();
            const matchedStatus = statuses.find(s => s.name === metadata.status);
            if (matchedStatus) {
                status_id = matchedStatus.id;
            }
        }
        return {
            id: metadata.id,
            title: metadata.title,
            summary: metadata.summary || undefined,
            content: contentBody || '',
            start_date: metadata.start_date || null, // @ai-edge-case: Plans may not have dates initially
            end_date: metadata.end_date || null,
            priority: metadata.priority || 'medium',
            status_id: status_id,
            status: metadata.status || 'Open', // @ai-why: Status name is primary storage
            related_issues: Array.isArray(metadata.related_issues) ? metadata.related_issues : [],
            tags: Array.isArray(metadata.tags) ? metadata.tags : [],
            created_at: metadata.created_at || new Date().toISOString(),
            updated_at: metadata.updated_at || new Date().toISOString()
        };
    }
    /**
     * @ai-intent Convert internal plan representation to external API format
     * @ai-logic Removes status_id from the response
     * @ai-critical Ensures internal IDs are not exposed in API responses
     */
    toExternalPlan(internal) {
        const { status_id, ...external } = internal;
        return external;
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
            summary: plan.summary,
            start_date: plan.start_date || '',
            end_date: plan.end_date || '',
            priority: plan.priority,
            status: plan.status, // @ai-logic: Only store status name, not ID
            related_issues: plan.related_issues || [],
            tags: plan.tags || [],
            created_at: plan.created_at,
            updated_at: plan.updated_at
        };
        const content = generateMarkdown(metadata, plan.content || '');
        await fsPromises.writeFile(this.getPlanFilePath(plan.id), content, 'utf8');
    }
    /**
     * @ai-intent Sync plan data to SQLite including timeline information
     * @ai-flow 1. Prepare values -> 2. Execute UPSERT -> 3. Update tag relationships
     * @ai-side-effects Updates search_plans table and plan_tags relationship table
     * @ai-assumption Empty dates stored as empty strings for SQL compatibility
     * @ai-why Related issues not in search table - retrieved via separate queries
     * @ai-database-schema Uses plan_tags relationship table for normalized tag storage
     */
    async syncPlanToSQLite(plan) {
        // Update main plan data
        await this.db.runAsync(`
      INSERT OR REPLACE INTO search_plans 
      (id, title, summary, content, priority, status_id, start_date, end_date, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            plan.id, plan.title, plan.summary || '',
            plan.content || '',
            plan.priority, plan.status_id,
            plan.start_date || '', plan.end_date || '', // @ai-logic: Empty strings for NULL dates
            JSON.stringify(plan.tags || []), // @ai-why: Keep for backward compatibility
            plan.created_at, plan.updated_at
        ]);
        // Update tag relationships
        if (plan.tags && plan.tags.length > 0) {
            await this.tagRepository.saveEntityTags('plan', plan.id, plan.tags);
        }
        else {
            // Clear all tag relationships if no tags
            await this.db.runAsync('DELETE FROM plan_tags WHERE plan_id = ?', [plan.id]);
        }
    }
    async getAllPlans(includeClosedStatuses = false, statusIds) {
        await this.ensureDirectoryExists();
        const files = await fsPromises.readdir(this.plansDir);
        const planFiles = files.filter(f => f.startsWith('plan-') && f.endsWith('.md'));
        // Get all statuses to filter by is_closed if needed
        let closedStatusIds = [];
        if (!includeClosedStatuses && !statusIds) {
            const allStatuses = await this.statusRepository.getAllStatuses();
            closedStatusIds = allStatuses.filter(s => s.is_closed).map(s => s.id);
        }
        const planPromises = planFiles.map(async (file) => {
            try {
                const content = await fsPromises.readFile(path.join(this.plansDir, file), 'utf8');
                const plan = await this.parseMarkdownPlan(content);
                if (plan) {
                    // Apply status filtering
                    if (statusIds && !statusIds.includes(plan.status_id)) {
                        return null;
                    }
                    if (!includeClosedStatuses && !statusIds && closedStatusIds.includes(plan.status_id)) {
                        return null;
                    }
                    const status = await this.statusRepository.getStatus(plan.status_id);
                    plan.status = status?.name;
                    return this.toExternalPlan(plan);
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
    async getAllPlansSummary(includeClosedStatuses = false, statusIds) {
        await this.ensureDirectoryExists();
        const files = await fsPromises.readdir(this.plansDir);
        const planFiles = files.filter(f => f.startsWith('plan-') && f.endsWith('.md'));
        // Get all statuses to filter by is_closed if needed
        let closedStatusIds = [];
        if (!includeClosedStatuses && !statusIds) {
            const allStatuses = await this.statusRepository.getAllStatuses();
            closedStatusIds = allStatuses.filter(s => s.is_closed).map(s => s.id);
        }
        const summaryPromises = planFiles.map(async (file) => {
            try {
                const content = await fsPromises.readFile(path.join(this.plansDir, file), 'utf8');
                const plan = await this.parseMarkdownPlan(content);
                if (plan) {
                    // Apply status filtering
                    if (statusIds && !statusIds.includes(plan.status_id)) {
                        return null;
                    }
                    if (!includeClosedStatuses && !statusIds && closedStatusIds.includes(plan.status_id)) {
                        return null;
                    }
                    const status = await this.statusRepository.getStatus(plan.status_id);
                    const summary = {
                        id: plan.id,
                        title: plan.title,
                        summary: plan.summary,
                        priority: plan.priority,
                        status: status?.name,
                        start_date: plan.start_date,
                        end_date: plan.end_date,
                        created_at: plan.created_at,
                        updated_at: plan.updated_at
                    };
                    return summary;
                }
                return null;
            }
            catch (error) {
                this.logger.error(`Error reading plan file ${file}:`, { error });
                return null;
            }
        });
        const results = await Promise.all(summaryPromises);
        const summaries = results.filter((summary) => summary !== null);
        return summaries.sort((a, b) => a.id - b.id);
    }
    async createPlan(title, content, priority = 'medium', status, start_date, end_date, tags, summary) {
        await this.ensureDirectoryExists();
        // @ai-logic: Resolve status name to ID
        let finalStatusId;
        let statusName;
        if (!status) {
            const statuses = await this.statusRepository.getAllStatuses();
            const defaultStatus = statuses.find(s => s.name === 'Open') || statuses[0];
            finalStatusId = defaultStatus.id;
            statusName = defaultStatus.name;
        }
        else {
            const statuses = await this.statusRepository.getAllStatuses();
            const matchedStatus = statuses.find(s => s.name === status);
            if (!matchedStatus) {
                throw new Error(`Status '${status}' not found`);
            }
            finalStatusId = matchedStatus.id;
            statusName = matchedStatus.name;
        }
        const now = new Date().toISOString();
        const plan = {
            id: await this.getPlanNextId(),
            title,
            summary,
            content: content || '',
            start_date: start_date || null,
            end_date: end_date || null,
            priority,
            status_id: finalStatusId,
            status: statusName,
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
        return this.toExternalPlan(plan);
    }
    async updatePlan(id, title, content, priority, status, start_date, end_date, tags, summary) {
        const filePath = this.getPlanFilePath(id);
        try {
            await fsPromises.access(filePath);
        }
        catch {
            return false;
        }
        try {
            const fileContent = await fsPromises.readFile(filePath, 'utf8');
            const plan = await this.parseMarkdownPlan(fileContent);
            if (!plan)
                return false;
            if (title !== undefined)
                plan.title = title;
            if (summary !== undefined)
                plan.summary = summary;
            if (content !== undefined)
                plan.content = content;
            if (priority !== undefined)
                plan.priority = priority;
            if (status !== undefined) {
                // @ai-logic: Resolve status name to ID
                const statuses = await this.statusRepository.getAllStatuses();
                const matchedStatus = statuses.find(s => s.name === status);
                if (!matchedStatus) {
                    throw new Error(`Status '${status}' not found`);
                }
                plan.status_id = matchedStatus.id;
                plan.status = matchedStatus.name;
            }
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
            // @ai-logic: CASCADE DELETE in foreign key constraint handles plan_tags cleanup
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
            const plan = await this.parseMarkdownPlan(content);
            if (plan) {
                const status = await this.statusRepository.getStatus(plan.status_id);
                plan.status = status?.name;
                return this.toExternalPlan(plan);
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Error reading plan ${id}:`, { error });
            return null;
        }
    }
    /**
     * @ai-intent Search plans by exact tag match using relationship table
     * @ai-flow 1. Get tag ID -> 2. JOIN with plan_tags -> 3. Load full plans
     * @ai-performance Uses indexed JOIN instead of LIKE search
     * @ai-database-schema Leverages plan_tags relationship table
     */
    async searchPlansByTag(tag) {
        // Get tag ID
        const tagRow = await this.db.getAsync('SELECT id FROM tags WHERE name = ?', [tag]);
        if (!tagRow) {
            return []; // Tag doesn't exist
        }
        // Find all plan IDs with this tag
        const planRows = await this.db.allAsync(`SELECT DISTINCT p.id 
       FROM search_plans p
       JOIN plan_tags pt ON p.id = pt.plan_id
       WHERE pt.tag_id = ?
       ORDER BY p.id`, [tagRow.id]);
        // Load full plan data
        const plans = [];
        for (const row of planRows) {
            const plan = await this.getPlan(row.id);
            if (plan) {
                plans.push(plan);
            }
        }
        return plans;
    }
}
//# sourceMappingURL=plan-repository.js.map