/**
 * @ai-context Helper functions for TaskRepository to follow single responsibility principle
 * @ai-pattern Extract complex logic into pure functions for better testability
 * @ai-critical These helpers support the main TaskRepository operations
 * @ai-dependencies Domain types, status repository interface
 * @ai-assumption Helpers are stateless and side-effect free where possible
 */
import type { Issue, Plan } from '../types/domain-types.js';
import type { IStatusRepository } from '../types/repository-interfaces.js';
/**
 * @ai-intent Validate task input parameters
 * @ai-pattern Input validation separated from business logic
 * @ai-critical Throws descriptive errors for invalid inputs
 * @ai-why Early validation prevents invalid data from entering the system
 */
export declare function validateTaskInput(status: string | undefined, statusRepository: IStatusRepository): Promise<string>;
/**
 * @ai-intent Prepare task data object from input parameters
 * @ai-pattern Data transformation separated from persistence
 * @ai-critical Creates consistent task structure
 * @ai-why Centralizes task object creation logic
 */
export declare function prepareTaskData(params: {
    id: number;
    title: string;
    description?: string;
    content: string;
    priority: string;
    statusName: string;
    tags?: string[];
    start_date?: string | null;
    end_date?: string | null;
    related_tasks?: string[];
    related_documents?: string[];
    now: string;
}): Issue | Plan;
/**
 * @ai-intent Generate metadata object for markdown frontmatter
 * @ai-pattern Separate metadata preparation from file writing
 * @ai-critical Includes all necessary fields for markdown generation
 * @ai-why Keeps metadata structure consistent across the codebase
 */
export declare function prepareTaskMetadata(task: Issue | Plan, statusRepository: IStatusRepository): Promise<Record<string, any>>;
/**
 * @ai-intent Extract tag registration logic
 * @ai-pattern Separate concern for tag management
 * @ai-critical Ensures all tags exist before use
 * @ai-side-effects Creates tags in database if needed
 */
export declare function registerTaskTags(tags: string[] | undefined, tagRepository: {
    getOrCreateTagId: (tag: string) => Promise<number>;
}): Promise<void>;
/**
 * @ai-intent Build SQL insert parameters for task sync
 * @ai-pattern Data transformation for SQLite storage
 * @ai-critical Order must match INSERT statement
 * @ai-why Centralizes SQL parameter preparation
 */
export declare function buildTaskSyncParams(task: Issue | Plan, type: string, statusId: number): any[];
/**
 * @ai-intent Validate update input parameters
 * @ai-pattern Input validation for update operations
 * @ai-critical Ensures status is valid if provided
 * @ai-why Prevents invalid states during updates
 */
export declare function validateUpdateInput(status: string | undefined, statusRepository: IStatusRepository): Promise<void>;
/**
 * @ai-intent Merge update parameters with existing task
 * @ai-pattern Partial update pattern
 * @ai-critical Preserves unmodified fields
 * @ai-why Centralizes update logic for consistency
 */
export declare function mergeTaskData(existingTask: Issue | Plan, updates: {
    title?: string;
    content?: string;
    priority?: string;
    status?: string;
    tags?: string[];
    description?: string;
    start_date?: string | null;
    end_date?: string | null;
    related_tasks?: string[];
    related_documents?: string[];
}): Issue | Plan;
