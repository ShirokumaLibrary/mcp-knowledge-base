import type { Database } from './base.js';
import { BaseRepository } from './base.js';
import type { Issue, Plan, IssueSummary, PlanSummary } from '../types/domain-types.js';
import type { IStatusRepository } from '../types/repository-interfaces.js';
import { TagRepository } from './tag-repository.js';
/**
 * @ai-context Unified repository for tasks (issues and plans)
 * @ai-pattern Single repository for both types with type field distinction
 * @ai-critical Replaces IssueRepository and PlanRepository completely
 * @ai-lifecycle Files in tasks/issues-*.md and tasks/plans-*.md
 */
export declare class TaskRepository extends BaseRepository {
    private tasksDir;
    private statusRepository;
    private tagRepository;
    constructor(db: Database, tasksDir: string, statusRepository: IStatusRepository, tagRepository?: TagRepository);
    private ensureDirectoryExists;
    private getTaskFilePath;
    private parseTaskFromMarkdown;
    private getDefaultStatusName;
    private isValidStatus;
    syncTaskToSQLite(task: Issue | Plan, type: string): Promise<void>;
    getTask(type: string, id: number): Promise<Issue | Plan | null>;
    createTask(type: string, title: string, content?: string, priority?: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<Issue | Plan>;
    /**
     * @ai-intent Save task to markdown file
     * @ai-pattern Extracted from createTask for single responsibility
     * @ai-side-effects Creates file on disk
     */
    private saveTaskToFile;
    updateTask(type: string, id: number, title?: string, content?: string, priority?: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<Issue | Plan | null>;
    /**
     * @ai-intent Load existing task for update
     * @ai-pattern Extracted from updateTask
     * @ai-return Task or null if not found
     */
    private loadExistingTask;
    /**
     * @ai-intent Save updated task to file
     * @ai-pattern Extracted from updateTask
     * @ai-side-effects Updates file on disk
     */
    private saveUpdatedTask;
    deleteTask(type: string, id: number): Promise<boolean>;
    getAllTasksSummary(type: string, includeClosedStatuses?: boolean, statusIds?: number[]): Promise<IssueSummary[] | PlanSummary[]>;
    searchTasksByTag(type: string, tag: string): Promise<(Issue | Plan)[]>;
    getAllTasks(type: string): Promise<(Issue | Plan)[]>;
}
