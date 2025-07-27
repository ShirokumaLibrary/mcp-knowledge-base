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
export async function validateTaskInput(
  status: string | undefined,
  statusRepository: IStatusRepository
): Promise<string> {
  if (status) {
    const statuses = await statusRepository.getAllStatuses();
    const isValid = statuses.some(s => s.name === status);
    if (!isValid) {
      throw new Error(`Invalid status: ${status}`);
    }
    return status;
  } else {
    // Get default status
    const statuses = await statusRepository.getAllStatuses();
    return statuses.length > 0 ? statuses[0].name : 'Open';
  }
}

/**
 * @ai-intent Prepare task data object from input parameters
 * @ai-pattern Data transformation separated from persistence
 * @ai-critical Creates consistent task structure
 * @ai-why Centralizes task object creation logic
 */
export function prepareTaskData(params: {
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
}): Issue | Plan {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    content: params.content,
    priority: params.priority,
    status: params.statusName,
    tags: params.tags || [],
    created_at: params.now,
    updated_at: params.now,
    start_date: params.start_date || null,
    end_date: params.end_date || null,
    related_tasks: params.related_tasks || [],
    related_documents: params.related_documents || []
  };
}

/**
 * @ai-intent Generate metadata object for markdown frontmatter
 * @ai-pattern Separate metadata preparation from file writing
 * @ai-critical Includes all necessary fields for markdown generation
 * @ai-why Keeps metadata structure consistent across the codebase
 */
export async function prepareTaskMetadata(
  task: Issue | Plan,
  statusRepository: IStatusRepository
): Promise<Record<string, any>> {
  const statuses = await statusRepository.getAllStatuses();
  const statusObj = statuses.find(s => s.name === task.status);
  const statusId = statusObj ? statusObj.id : null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    status_id: statusId,
    tags: task.tags,
    start_date: task.start_date,
    end_date: task.end_date,
    related_tasks: task.related_tasks,
    related_documents: task.related_documents,
    created_at: task.created_at,
    updated_at: task.updated_at
  };
}

/**
 * @ai-intent Extract tag registration logic
 * @ai-pattern Separate concern for tag management
 * @ai-critical Ensures all tags exist before use
 * @ai-side-effects Creates tags in database if needed
 */
export async function registerTaskTags(
  tags: string[] | undefined,
  tagRepository: { getOrCreateTagId: (tag: string) => Promise<number> }
): Promise<void> {
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      await tagRepository.getOrCreateTagId(tag);
    }
  }
}

/**
 * @ai-intent Build SQL insert parameters for task sync
 * @ai-pattern Data transformation for SQLite storage
 * @ai-critical Order must match INSERT statement
 * @ai-why Centralizes SQL parameter preparation
 */
export function buildTaskSyncParams(
  task: Issue | Plan,
  type: string,
  statusId: number
): any[] {
  return [
    type,
    task.id,
    task.title,
    task.description || null,
    task.content,
    task.priority,
    statusId,
    task.start_date,
    task.end_date,
    JSON.stringify(task.tags || []),
    task.created_at,
    task.updated_at
  ];
}

/**
 * @ai-intent Validate update input parameters
 * @ai-pattern Input validation for update operations
 * @ai-critical Ensures status is valid if provided
 * @ai-why Prevents invalid states during updates
 */
export async function validateUpdateInput(
  status: string | undefined,
  statusRepository: IStatusRepository
): Promise<void> {
  if (status !== undefined) {
    const statuses = await statusRepository.getAllStatuses();
    const isValid = statuses.some(s => s.name === status);
    if (!isValid) {
      throw new Error(`Invalid status: ${status}`);
    }
  }
}

/**
 * @ai-intent Merge update parameters with existing task
 * @ai-pattern Partial update pattern
 * @ai-critical Preserves unmodified fields
 * @ai-why Centralizes update logic for consistency
 */
export function mergeTaskData(
  existingTask: Issue | Plan,
  updates: {
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
  }
): Issue | Plan {
  const now = new Date().toISOString();
  return {
    ...existingTask,
    title: updates.title !== undefined ? updates.title : existingTask.title,
    content: updates.content !== undefined ? updates.content : existingTask.content,
    priority: updates.priority !== undefined ? updates.priority : existingTask.priority,
    status: updates.status !== undefined ? updates.status : existingTask.status,
    tags: updates.tags !== undefined ? updates.tags : existingTask.tags,
    description: updates.description !== undefined ? updates.description : existingTask.description,
    start_date: updates.start_date !== undefined ? updates.start_date : existingTask.start_date,
    end_date: updates.end_date !== undefined ? updates.end_date : existingTask.end_date,
    related_tasks: updates.related_tasks !== undefined ? updates.related_tasks : existingTask.related_tasks,
    related_documents: updates.related_documents !== undefined ? updates.related_documents : existingTask.related_documents,
    updated_at: now
  };
}