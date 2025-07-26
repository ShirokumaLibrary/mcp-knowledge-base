import { BaseRepository, Database } from './base.js';
import { Issue, Plan, IssueSummary, PlanSummary } from '../types/domain-types.js';
import { IStatusRepository } from '../types/repository-interfaces.js';
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
    updateTask(type: string, id: number, title?: string, content?: string, priority?: string, status?: string, tags?: string[], description?: string, start_date?: string | null, end_date?: string | null, related_tasks?: string[], related_documents?: string[]): Promise<Issue | Plan | null>;
    deleteTask(type: string, id: number): Promise<boolean>;
    getAllTasksSummary(type: string, includeClosedStatuses?: boolean, statusIds?: number[]): Promise<IssueSummary[] | PlanSummary[]>;
    searchTasksByTag(type: string, tag: string): Promise<(Issue | Plan)[]>;
    getAllTasks(type: string): Promise<(Issue | Plan)[]>;
}
