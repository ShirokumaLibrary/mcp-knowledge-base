import { TaskRepository } from '../database/task-repository.js';
import { DatabaseConnection } from '../database/base.js';
import { StatusRepository } from '../database/status-repository.js';
import { TagRepository } from '../database/tag-repository.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
describe('TaskRepository', () => {
    let db;
    let taskRepo;
    let statusRepo;
    let tagRepo;
    let testDir;
    beforeEach(async () => {
        // Create a temporary directory for test data
        testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-tasks-'));
        // Initialize database
        const connection = new DatabaseConnection(':memory:');
        await connection.initialize();
        db = connection.getDatabase();
        // Create repositories
        statusRepo = new StatusRepository(db);
        tagRepo = new TagRepository(db);
        taskRepo = new TaskRepository(db, testDir, statusRepo, tagRepo);
    });
    afterEach(async () => {
        // Clean up test directory
        await fs.rm(testDir, { recursive: true, force: true });
    });
    describe('Task operations', () => {
        it('should create an issue task', async () => {
            const issue = await taskRepo.createTask('issues', 'Test Issue', 'Issue content', 'high', undefined, ['bug', 'urgent']);
            expect(issue.id).toBe(1);
            expect(issue.title).toBe('Test Issue');
            expect(issue.priority).toBe('high');
            expect(issue.tags).toEqual(['bug', 'urgent']);
            // Verify file was created
            const filePath = path.join(testDir, 'issues', 'issues-1.md');
            const exists = await fs.access(filePath).then(() => true).catch(() => false);
            expect(exists).toBe(true);
        });
        it('should handle new task fields', async () => {
            const issue = await taskRepo.createTask('issues', 'Issue with dates', 'Content', 'medium', undefined, ['planning'], 'Description', '2025-07-25', '2025-07-30', ['plans-1', 'issues-2']);
            expect(issue.start_date).toBe('2025-07-25');
            expect(issue.end_date).toBe('2025-07-30');
            expect(issue.related_tasks).toEqual(['plans-1', 'issues-2']);
        });
        it('should update a task', async () => {
            const issue = await taskRepo.createTask('issues', 'Original', 'Content');
            const updated = await taskRepo.updateTask('issues', issue.id, 'Updated', 'New content', 'low', undefined, ['updated']);
            expect(updated).not.toBeNull();
            expect(updated?.title).toBe('Updated');
            expect(updated?.content).toBe('New content');
            expect(updated?.priority).toBe('low');
        });
        it('should delete a task', async () => {
            const issue = await taskRepo.createTask('issues', 'To Delete');
            const success = await taskRepo.deleteTask('issues', issue.id);
            expect(success).toBe(true);
            const deleted = await taskRepo.getTask('issues', issue.id);
            expect(deleted).toBeNull();
        });
        it('should handle related_tasks', async () => {
            // Create a few tasks first
            const issue1 = await taskRepo.createTask('issues', 'Issue 1');
            const plan1 = await taskRepo.createTask('plans', 'Plan 1');
            // Create issue with related tasks
            const issue2 = await taskRepo.createTask('issues', 'Issue with related tasks', 'Content', 'high', undefined, ['important'], undefined, undefined, undefined, ['issues-1', 'plans-1']);
            expect(issue2.related_tasks).toEqual(['issues-1', 'plans-1']);
            // Verify it's saved correctly
            const loaded = await taskRepo.getTask('issues', issue2.id);
            expect(loaded?.related_tasks).toEqual(['issues-1', 'plans-1']);
            // Update related tasks
            const updated = await taskRepo.updateTask('issues', issue2.id, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, ['issues-1', 'plans-1', 'issues-2'] // Note: issues-2 doesn't exist but should still be stored
            );
            expect(updated?.related_tasks).toEqual(['issues-1', 'plans-1', 'issues-2']);
            // Clear related tasks
            const cleared = await taskRepo.updateTask('issues', issue2.id, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, []);
            expect(cleared?.related_tasks).toEqual([]);
        });
    });
    it('should create a plan task', async () => {
        const plan = await taskRepo.createTask('plans', 'Test Plan', 'Plan content', 'high', undefined, ['milestone'], undefined, '2025-07-25', '2025-08-25');
        expect(plan.id).toBe(1);
        expect(plan.title).toBe('Test Plan');
        expect(plan.start_date).toBe('2025-07-25');
        expect(plan.end_date).toBe('2025-08-25');
        // Verify file was created
        const filePath = path.join(testDir, 'plans', 'plans-1.md');
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
    });
    it('should update a plan task', async () => {
        const plan = await taskRepo.createTask('plans', 'Original Plan');
        const updated = await taskRepo.updateTask('plans', plan.id, 'Updated Plan', 'New content', 'low', undefined, undefined, undefined, '2025-08-01', '2025-08-31');
        expect(updated).not.toBeNull();
        expect(updated?.title).toBe('Updated Plan');
        expect(updated?.start_date).toBe('2025-08-01');
        expect(updated?.end_date).toBe('2025-08-31');
    });
    it('should delete a plan task', async () => {
        const plan = await taskRepo.createTask('plans', 'To Delete');
        const success = await taskRepo.deleteTask('plans', plan.id);
        expect(success).toBe(true);
        const deleted = await taskRepo.getTask('plans', plan.id);
        expect(deleted).toBeNull();
    });
    describe('SQLite sync', () => {
        it('should sync issues to search_tasks table', async () => {
            const issue = await taskRepo.createTask('issues', 'Sync Test', 'Content', 'high', undefined, ['test']);
            // Verify it's in the search table
            const rows = await db.allAsync('SELECT * FROM search_tasks WHERE type = ? AND id = ?', ['issues', issue.id]);
            expect(rows).toHaveLength(1);
            expect(rows[0].title).toBe('Sync Test');
            expect(rows[0].type).toBe('issues');
        });
        it('should sync plans to search_tasks table', async () => {
            const plan = await taskRepo.createTask('plans', 'Plan Sync', 'Content', 'medium');
            // Verify it's in the search table
            const rows = await db.allAsync('SELECT * FROM search_tasks WHERE type = ? AND id = ?', ['plans', plan.id]);
            expect(rows).toHaveLength(1);
            expect(rows[0].title).toBe('Plan Sync');
            expect(rows[0].type).toBe('plans');
        });
        it('should handle tag relationships in task_tags table', async () => {
            const issue = await taskRepo.createTask('issues', 'Tagged Issue', 'Content', 'medium', undefined, ['bug', 'urgent']);
            // Get tag IDs
            const tagRows = await db.allAsync('SELECT id, name FROM tags WHERE name IN (?, ?)', ['bug', 'urgent']);
            const tagIds = tagRows.map((r) => r.id);
            // Check task_tags
            const taskTagRows = await db.allAsync('SELECT * FROM task_tags WHERE task_type = ? AND task_id = ?', ['issues', issue.id]);
            expect(taskTagRows).toHaveLength(2);
            expect(taskTagRows.map((r) => r.tag_id).sort()).toEqual(tagIds.sort());
        });
    });
    describe('Related tasks operations', () => {
        it('should create task with related_tasks', async () => {
            const task1 = await taskRepo.createTask('issues', 'Issue 1', 'Content 1');
            const task2 = await taskRepo.createTask('plans', 'Plan 1', 'Content 2');
            const task3 = await taskRepo.createTask('issues', 'Issue with relations', 'Content', 'medium', undefined, ['test'], undefined, undefined, undefined, [`issues-${task1.id}`, `plans-${task2.id}`]);
            expect(task3.related_tasks).toEqual([`issues-${task1.id}`, `plans-${task2.id}`]);
            // Verify file content
            const filePath = path.join(testDir, 'issues', `issues-${task3.id}.md`);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            expect(fileContent).toContain('related_tasks:');
            expect(fileContent).toContain(`issues-${task1.id}`);
            expect(fileContent).toContain(`plans-${task2.id}`);
        });
        it('should update related_tasks', async () => {
            const task1 = await taskRepo.createTask('issues', 'Issue 1', 'Content 1');
            const task2 = await taskRepo.createTask('plans', 'Plan 1', 'Content 2');
            const task3 = await taskRepo.createTask('issues', 'Issue 3', 'Content 3');
            const updated = await taskRepo.updateTask('issues', task1.id, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, [`issues-${task3.id}`, `plans-${task2.id}`]);
            expect(updated).toBeTruthy();
            expect(updated?.related_tasks).toEqual([`issues-${task3.id}`, `plans-${task2.id}`]);
        });
        it('should clear related_tasks with empty array', async () => {
            const task1 = await taskRepo.createTask('issues', 'Issue with relations', 'Content', undefined, undefined, undefined, undefined, undefined, undefined, ['issues-999', 'plans-999']);
            expect(task1.related_tasks).toEqual(['issues-999', 'plans-999']);
            const updated = await taskRepo.updateTask('issues', task1.id, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, []);
            expect(updated).toBeTruthy();
            expect(updated?.related_tasks).toEqual([]);
        });
        it('should preserve related_tasks when not updating them', async () => {
            const task = await taskRepo.createTask('plans', 'Plan with relations', 'Content', undefined, undefined, undefined, undefined, undefined, undefined, ['issues-1', 'plans-2']);
            // Update other fields without touching related_tasks
            await taskRepo.updateTask('plans', task.id, 'Updated title', undefined, 'high');
            const retrieved = await taskRepo.getTask('plans', task.id);
            expect(retrieved?.title).toBe('Updated title');
            expect(retrieved?.priority).toBe('high');
            expect(retrieved?.related_tasks).toEqual(['issues-1', 'plans-2']);
        });
    });
    describe('Search operations', () => {
        it('should find tasks by tag', async () => {
            await taskRepo.createTask('issues', 'Issue 1', 'Content', 'high', undefined, ['important']);
            await taskRepo.createTask('issues', 'Issue 2', 'Content', 'low', undefined, ['important', 'bug']);
            await taskRepo.createTask('issues', 'Issue 3', 'Content', 'medium');
            const results = await taskRepo.searchTasksByTag('issues', 'important');
            expect(results).toHaveLength(2);
            expect(results.every(i => i.tags?.includes('important'))).toBe(true);
        });
        it('should find plan tasks by tag', async () => {
            await taskRepo.createTask('plans', 'Plan 1', 'Content', 'high', undefined, ['milestone']);
            await taskRepo.createTask('plans', 'Plan 2', 'Content', 'medium', undefined, ['milestone', 'q1']);
            await taskRepo.createTask('plans', 'Plan 3', 'Content', 'low');
            const results = await taskRepo.searchTasksByTag('plans', 'milestone');
            expect(results).toHaveLength(2);
            expect(results.every(p => p.tags?.includes('milestone'))).toBe(true);
        });
    });
    describe('Summary operations', () => {
        it('should get task summaries from database', async () => {
            await taskRepo.createTask('issues', 'Issue 1', 'Content 1', 'high', undefined, ['bug']);
            await taskRepo.createTask('issues', 'Issue 2', 'Content 2', 'low', undefined, ['feature']);
            const summaries = await taskRepo.getAllTasksSummary('issues');
            expect(summaries).toHaveLength(2);
            expect(summaries[0]).not.toHaveProperty('content'); // Summary should not include content
            expect(summaries[0]).toHaveProperty('title');
            expect(summaries[0]).toHaveProperty('tags');
        });
        it('should get plan task summaries from database', async () => {
            await taskRepo.createTask('plans', 'Plan 1', 'Content 1', 'high', undefined, undefined, undefined, '2025-07-01', '2025-07-31');
            await taskRepo.createTask('plans', 'Plan 2', 'Content 2', 'medium', undefined, undefined, undefined, '2025-08-01', '2025-08-31');
            const summaries = await taskRepo.getAllTasksSummary('plans');
            expect(summaries).toHaveLength(2);
            expect(summaries[0]).toHaveProperty('start_date');
            expect(summaries[0]).toHaveProperty('end_date');
        });
    });
});
//# sourceMappingURL=task-repository.test.js.map