import * as fsPromises from 'fs/promises';
import * as path from 'path';
import type { Database } from './base.js';
import { BaseRepository } from './base.js';
import type { Issue, Plan, IssueSummary, PlanSummary } from '../types/domain-types.js';
import type { IStatusRepository } from '../types/repository-interfaces.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import { TagRepository } from './tag-repository.js';
import { isTypeOfBase } from '../types/type-registry.js';
import {
  validateTaskInput,
  prepareTaskData,
  prepareTaskMetadata,
  registerTaskTags,
  validateUpdateInput,
  mergeTaskData
} from './task-repository-helpers.js';

/**
 * @ai-context Unified repository for tasks (issues and plans)
 * @ai-pattern Single repository for both types with type field distinction
 * @ai-critical Replaces IssueRepository and PlanRepository completely
 * @ai-lifecycle Files in tasks/issues-*.md and tasks/plans-*.md
 */
export class TaskRepository extends BaseRepository {
  private tasksDir: string;
  private statusRepository: IStatusRepository;
  private tagRepository: TagRepository;

  constructor(db: Database, tasksDir: string, statusRepository: IStatusRepository, tagRepository?: TagRepository) {
    super(db, 'TaskRepository');
    this.tasksDir = tasksDir;
    this.statusRepository = statusRepository;
    this.tagRepository = tagRepository || new TagRepository(db);
  }

  private async ensureDirectoryExists(dir?: string): Promise<void> {
    const targetDir = dir || this.tasksDir;
    try {
      await fsPromises.access(targetDir);
    } catch {
      await fsPromises.mkdir(targetDir, { recursive: true });
    }
  }

  private getTaskFilePath(type: string, id: number): string {
    // Create type-specific subdirectory under tasks directory
    const typeDir = path.join(this.tasksDir, type);
    return path.join(typeDir, this.getEntityFileName(type, id));
  }

  private parseTaskFromMarkdown(content: string): Issue | Plan | null {
    const { metadata, content: taskContent } = parseMarkdown(content);

    if (!metadata.id || !metadata.title) {
      this.logger.error('Invalid task data: missing required fields', { metadata });
      return null;
    }

    return {
      id: metadata.id,
      title: metadata.title,
      description: metadata.description || undefined,
      content: taskContent,
      priority: metadata.priority || 'medium',
      status: metadata.status,
      tags: metadata.tags || [],
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: metadata.updated_at || new Date().toISOString(),
      start_date: metadata.start_date || null,
      end_date: metadata.end_date || null,
      related_tasks: metadata.related_tasks || [],
      related_documents: metadata.related_documents || []
    };
  }

  private async getDefaultStatusName(): Promise<string> {
    const statuses = await this.statusRepository.getAllStatuses();
    return statuses.length > 0 ? statuses[0].name : 'Open';
  }

  private async isValidStatus(statusName: string): Promise<boolean> {
    const statuses = await this.statusRepository.getAllStatuses();
    return statuses.some(s => s.name === statusName);
  }



  async syncTaskToSQLite(task: Issue | Plan, type: string): Promise<void> {
    const statuses = await this.statusRepository.getAllStatuses();
    const status = statuses.find(s => s.name === task.status);
    const statusId = status?.id || 1;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO search_tasks 
       (type, id, title, summary, content, priority, status_id, start_date, end_date, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    // Update tag relationships
    await this.db.runAsync(
      'DELETE FROM task_tags WHERE task_type = ? AND task_id = ?',
      [type, task.id]
    );

    if (task.tags && task.tags.length > 0) {
      for (const tagName of task.tags) {
        const tagId = await this.tagRepository.getOrCreateTagId(tagName);
        await this.db.runAsync(
          'INSERT OR IGNORE INTO task_tags (task_type, task_id, tag_id) VALUES (?, ?, ?)',
          [type, task.id, tagId]
        );
      }
    }

    // Update related tasks
    await this.db.runAsync(
      'DELETE FROM related_tasks WHERE (source_type = ? AND source_id = ?)',
      [type, task.id]
    );

    if (task.related_tasks && task.related_tasks.length > 0) {
      for (const taskRef of task.related_tasks) {
        const [targetType, targetId] = taskRef.split('-');
        if (targetType && targetId) {
          await this.db.runAsync(
            'INSERT OR IGNORE INTO related_tasks (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)',
            [type, task.id, targetType, parseInt(targetId)]
          );
        }
      }
    }

    // Update related documents
    await this.db.runAsync(
      'DELETE FROM related_documents WHERE (source_type = ? AND source_id = ?)',
      [type, task.id.toString()]
    );

    if (task.related_documents && task.related_documents.length > 0) {
      for (const docRef of task.related_documents) {
        const [targetType, targetId] = docRef.split('-');
        if (targetType && targetId) {
          await this.db.runAsync(
            'INSERT OR IGNORE INTO related_documents (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)',
            [type, task.id.toString(), targetType, parseInt(targetId)]
          );
        }
      }
    }
  }













  // Unified methods that accept type as parameter
  async getTask(type: string, id: number): Promise<Issue | Plan | null> {
    const filePath = this.getTaskFilePath(type, id);

    try {
      const content = await fsPromises.readFile(filePath, 'utf-8');
      const task = this.parseTaskFromMarkdown(content);

      if (task) {
        // Sync to SQLite
        await this.syncTaskToSQLite(task, type);
      }

      return task;
    } catch (error) {
      this.logger.debug(`Task not found: ${type}-${id}`, { error });
      return null;
    }
  }

  async createTask(
    type: string,
    title: string,
    content: string = '',
    priority: string = 'medium',
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related_tasks?: string[],
    related_documents?: string[]
  ): Promise<Issue | Plan> {
    await this.ensureDirectoryExists();

    const id = await this.getNextSequenceValue(type);
    const now = new Date().toISOString();

    // Validate and get status name
    const statusName = await validateTaskInput(status, this.statusRepository);

    // Prepare task data
    const task = prepareTaskData({
      id,
      title,
      description,
      content,
      priority,
      statusName,
      tags,
      start_date,
      end_date,
      related_tasks,
      related_documents,
      now
    });

    // Save task to file
    await this.saveTaskToFile(task, type);

    // Register tags
    await registerTaskTags(tags, this.tagRepository);

    // Sync to SQLite
    await this.syncTaskToSQLite(task, type);

    return task;
  }

  /**
   * @ai-intent Save task to markdown file
   * @ai-pattern Extracted from createTask for single responsibility
   * @ai-side-effects Creates file on disk
   */
  private async saveTaskToFile(task: Issue | Plan, type: string): Promise<void> {
    const metadata = await prepareTaskMetadata(task, this.statusRepository);
    const markdownContent = generateMarkdown(metadata, task.content);
    const filePath = this.getTaskFilePath(type, task.id);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await this.ensureDirectoryExists(dir);

    await fsPromises.writeFile(filePath, markdownContent, 'utf-8');
    this.logger.info(`Created ${type}: ${task.title} (ID: ${task.id})`);
  }

  async updateTask(
    type: string,
    id: number,
    title?: string,
    content?: string,
    priority?: string,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related_tasks?: string[],
    related_documents?: string[]
  ): Promise<Issue | Plan | null> {
    // Load existing task
    const existingTask = await this.loadExistingTask(type, id);
    if (!existingTask) {
      return null;
    }

    // Validate update input
    await validateUpdateInput(status, this.statusRepository);

    // Merge data
    const updatedTask = mergeTaskData(existingTask, {
      title,
      content,
      priority,
      status,
      tags,
      description,
      start_date,
      end_date,
      related_tasks,
      related_documents
    });

    // Save updated task
    await this.saveUpdatedTask(updatedTask, type);

    // Register new tags
    await registerTaskTags(tags, this.tagRepository);

    // Sync to SQLite
    await this.syncTaskToSQLite(updatedTask, type);

    return updatedTask;
  }

  /**
   * @ai-intent Load existing task for update
   * @ai-pattern Extracted from updateTask
   * @ai-return Task or null if not found
   */
  private async loadExistingTask(type: string, id: number): Promise<Issue | Plan | null> {
    return this.getTask(type, id);
  }

  /**
   * @ai-intent Save updated task to file
   * @ai-pattern Extracted from updateTask
   * @ai-side-effects Updates file on disk
   */
  private async saveUpdatedTask(task: Issue | Plan, type: string): Promise<void> {
    const metadata = await prepareTaskMetadata(task, this.statusRepository);
    const markdownContent = generateMarkdown(metadata, task.content);
    const filePath = this.getTaskFilePath(type, task.id);

    await fsPromises.writeFile(filePath, markdownContent, 'utf-8');
    this.logger.info(`Updated ${type} ${task.id}`);
  }

  async deleteTask(type: string, id: number): Promise<boolean> {
    const filePath = this.getTaskFilePath(type, id);

    try {
      await fsPromises.unlink(filePath);
      this.logger.info(`Deleted ${type} ${id}`);

      // Remove from SQLite
      await this.db.runAsync(
        'DELETE FROM search_tasks WHERE type = ? AND id = ?',
        [type, id]
      );

      return true;
    } catch (error) {
      this.logger.debug(`Failed to delete ${type} ${id}`, { error });
      return false;
    }
  }

  async getAllTasksSummary(
    type: string,
    includeClosedStatuses?: boolean,
    statusIds?: number[]
  ): Promise<IssueSummary[] | PlanSummary[]> {
    let query = `
      SELECT t.*, s.name as status_name, s.is_closed
      FROM search_tasks t
      LEFT JOIN statuses s ON t.status_id = s.id
      WHERE t.type = ?
    `;
    const params: any[] = [type];

    if (!includeClosedStatuses) {
      query += ' AND (s.is_closed = 0 OR s.is_closed IS NULL)';
    }

    if (statusIds && statusIds.length > 0) {
      query += ` AND t.status_id IN (${statusIds.map(() => '?').join(',')})`;
      params.push(...statusIds);
    }

    query += ' ORDER BY t.created_at DESC';

    const rows = await this.db.allAsync(query, params);

    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.summary,
      priority: row.priority,
      status: row.status_name || 'Unknown',
      start_date: row.start_date,
      end_date: row.end_date,
      tags: row.tags ? JSON.parse(row.tags) : [],
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  async searchTasksByTag(type: string, tag: string): Promise<(Issue | Plan)[]> {
    await this.ensureDirectoryExists();

    const typeDir = path.join(this.tasksDir, type);
    let taskFiles: string[] = [];

    try {
      const files = await fsPromises.readdir(typeDir);
      taskFiles = files.filter(f => f.startsWith(`${type}-`) && f.endsWith('.md'));
    } catch (error) {
      // Directory might not exist yet
      return [];
    }

    const tasks: (Issue | Plan)[] = [];

    for (const file of taskFiles) {
      const filePath = path.join(typeDir, file);
      try {
        const content = await fsPromises.readFile(filePath, 'utf-8');
        const task = this.parseTaskFromMarkdown(content);

        if (task && task.tags && task.tags.includes(tag)) {
          tasks.push(task);
        }
      } catch (error) {
        this.logger.error(`Error reading task file ${file}:`, error);
      }
    }

    return tasks.sort((a, b) => a.id - b.id);
  }

  // Generic method to get all tasks of a specific type
  async getAllTasks(type: string): Promise<(Issue | Plan)[]> {
    await this.ensureDirectoryExists();

    const typeDir = path.join(this.tasksDir, type);
    let taskFiles: string[] = [];

    try {
      const files = await fsPromises.readdir(typeDir);
      taskFiles = files.filter(f => f.startsWith(`${type}-`) && f.endsWith('.md'));
    } catch (error) {
      // Directory might not exist yet
      return [];
    }

    const tasks: (Issue | Plan)[] = [];

    for (const file of taskFiles) {
      const filePath = path.join(typeDir, file);
      try {
        const content = await fsPromises.readFile(filePath, 'utf-8');
        const task = this.parseTaskFromMarkdown(content);

        if (task) {
          tasks.push(task);
        }
      } catch (error) {
        this.logger.error(`Error reading task file ${file}:`, error);
      }
    }

    return tasks.sort((a, b) => a.id - b.id);
  }
}