import { StatusRepository } from '../database/status-repository';
import { createTestDatabase } from '../test-utils/database-test-helper.js';
describe('Status Filtering Tests', () => {
    let context;
    let statusRepo;
    beforeEach(async () => {
        context = await createTestDatabase('status-filtering');
        statusRepo = new StatusRepository(context.db.getDatabase());
    });
    afterEach(async () => {
        await context.cleanup();
    });
    describe('Default status filtering', () => {
        beforeEach(async () => {
            // Create tasks with different statuses
            await context.db.createTask('issues', 'Open Task', 'Content', 'high', 'Open');
            await context.db.createTask('issues', 'In Progress Task', 'Content', 'medium', 'In Progress');
            await context.db.createTask('issues', 'Review Task', 'Content', 'low', 'Review');
            await context.db.createTask('issues', 'Completed Task', 'Content', 'high', 'Completed');
            await context.db.createTask('issues', 'Closed Task', 'Content', 'medium', 'Closed');
            await context.db.createTask('issues', 'On Hold Task', 'Content', 'low', 'On Hold');
            await context.db.createTask('issues', 'Cancelled Task', 'Content', 'high', 'Cancelled');
        });
        it('should exclude closed statuses by default', async () => {
            const tasks = await context.db.getAllTasksSummary('issues');
            // Should only include open statuses
            expect(tasks).toHaveLength(4);
            const statuses = tasks.map((t) => t.status);
            expect(statuses).toContain('Open');
            expect(statuses).toContain('In Progress');
            expect(statuses).toContain('Review');
            expect(statuses).toContain('On Hold');
            // Should not include closed statuses
            expect(statuses).not.toContain('Completed');
            expect(statuses).not.toContain('Closed');
            expect(statuses).not.toContain('Cancelled');
        });
        it('should include all statuses when includeClosedStatuses is true', async () => {
            const tasks = await context.db.getAllTasksSummary('issues', true);
            expect(tasks).toHaveLength(7);
            const statuses = tasks.map((t) => t.status);
            // Should include all statuses
            expect(statuses).toContain('Open');
            expect(statuses).toContain('In Progress');
            expect(statuses).toContain('Review');
            expect(statuses).toContain('On Hold');
            expect(statuses).toContain('Completed');
            expect(statuses).toContain('Closed');
            expect(statuses).toContain('Cancelled');
        });
        it('should filter by specific status names', async () => {
            const tasks = await context.db.getAllTasksSummary('issues', false, [
                'Open',
                'In Progress'
            ]);
            expect(tasks).toHaveLength(2);
            const taskStatuses = tasks.map((t) => t.status);
            expect(taskStatuses).toContain('Open');
            expect(taskStatuses).toContain('In Progress');
        });
        it('should return empty array when filtering by non-existent status name', async () => {
            const tasks = await context.db.getAllTasksSummary('issues', false, ['NonExistentStatus']);
            expect(tasks).toHaveLength(0);
        });
        it('should handle empty status array', async () => {
            const tasks = await context.db.getAllTasksSummary('issues', false, []);
            // Empty status array should return no tasks
            expect(tasks).toHaveLength(0);
            const statuses = tasks.map((t) => t.status);
            expect(statuses).not.toContain('Completed');
            expect(statuses).not.toContain('Closed');
            expect(statuses).not.toContain('Cancelled');
        });
    });
    describe('Status filtering for different task types', () => {
        it('should apply filtering to plans', async () => {
            await context.db.createTask('plans', 'Open Plan', 'Content', 'high', 'Open');
            await context.db.createTask('plans', 'Completed Plan', 'Content', 'high', 'Completed');
            const openPlans = await context.db.getAllTasksSummary('plans');
            expect(openPlans).toHaveLength(1);
            expect(openPlans[0].title).toBe('Open Plan');
            const allPlans = await context.db.getAllTasksSummary('plans', true);
            expect(allPlans).toHaveLength(2);
        });
        it('should handle custom task types', async () => {
            // Create custom task type using the database connection directly
            const conn = context.db.getDatabase();
            await conn.runAsync('INSERT INTO sequences (type, current_value, base_type) VALUES (?, ?, ?)', ['bugs', 0, 'tasks']);
            await context.db.createTask('bugs', 'Open Bug', 'Content', 'high', 'Open');
            await context.db.createTask('bugs', 'Closed Bug', 'Content', 'high', 'Closed');
            const openBugs = await context.db.getAllTasksSummary('bugs');
            expect(openBugs).toHaveLength(1);
            expect(openBugs[0].title).toBe('Open Bug');
        });
    });
    describe('Status transitions', () => {
        it('should handle status updates correctly', async () => {
            const task = await context.db.createTask('issues', 'Task', 'Content', 'high', 'Open');
            // Initially visible in default query
            let tasks = await context.db.getAllTasksSummary('issues');
            expect(tasks.find((t) => t.id === String(task.id))).toBeTruthy();
            // Update to closed status
            await context.db.updateTask('issues', parseInt(task.id), undefined, undefined, undefined, 'Closed');
            // Should not be visible in default query
            tasks = await context.db.getAllTasksSummary('issues');
            expect(tasks.find((t) => t.id === String(task.id))).toBeFalsy();
            // Should be visible with includeClosedStatuses
            tasks = await context.db.getAllTasksSummary('issues', true);
            expect(tasks.find((t) => t.id === String(task.id))).toBeTruthy();
        });
        it('should validate status names on update', async () => {
            const task = await context.db.createTask('issues', 'Task', 'Content', 'high', 'Open');
            // Try to update with invalid status
            await expect(context.db.updateTask('issues', parseInt(task.id), undefined, undefined, undefined, 'InvalidStatus')).rejects.toThrow('Invalid status: InvalidStatus');
        });
    });
    describe('Performance with many statuses', () => {
        it('should handle queries efficiently with many tasks', async () => {
            // Create many tasks with various statuses - sequentially to avoid ID conflicts
            const statuses = ['Open', 'In Progress', 'Completed', 'Closed'];
            const createdTasks = [];
            for (let i = 0; i < 100; i++) {
                const status = statuses[i % statuses.length];
                try {
                    const task = await context.db.createTask('issues', `Task ${i}`, 'Content', 'medium', status);
                    createdTasks.push(task);
                }
                catch (err) {
                    console.error(`Error creating task ${i}:`, err.message);
                }
            }
            // Time the query
            const start = Date.now();
            const openTasks = await context.db.getAllTasksSummary('issues');
            const duration = Date.now() - start;
            // Should complete quickly
            expect(duration).toBeLessThan(100);
            // Should have correct count (50 open/in progress out of 100)
            expect(openTasks).toHaveLength(50);
            // Verify we have the right mix
            const allTasks = await context.db.getAllTasksSummary('issues', true);
            expect(allTasks).toHaveLength(100);
        });
    });
    describe('Edge cases', () => {
        it('should handle tasks with null status gracefully', async () => {
            // Directly insert a task with null status (shouldn't happen normally)
            const conn = context.db.getDatabase();
            const now = new Date().toISOString();
            await conn.runAsync('INSERT INTO items (type, id, title, priority, status_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', ['issues', 999, 'Null Status Task', 'medium', null, now, now]);
            // Should handle gracefully
            const tasks = await context.db.getAllTasksSummary('issues');
            const nullStatusTask = tasks.find((t) => t.id === '999');
            expect(nullStatusTask).toBeUndefined(); // Should be excluded
        });
        it('should handle concurrent status updates', async () => {
            const task = await context.db.createTask('issues', 'Task', 'Content', 'high', 'Open');
            // Try concurrent updates
            const updates = Array(5).fill(null).map((_, i) => context.db.updateTask('issues', parseInt(task.id), undefined, undefined, undefined, i % 2 === 0 ? 'In Progress' : 'Review'));
            await Promise.all(updates);
            // Should have one of the statuses
            const updated = await context.db.getTask('issues', parseInt(task.id));
            expect(['In Progress', 'Review']).toContain(updated?.status);
        });
    });
});
//# sourceMappingURL=status-filtering.test.js.map