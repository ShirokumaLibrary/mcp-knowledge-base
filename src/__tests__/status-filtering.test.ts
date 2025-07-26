import { FileIssueDatabase } from '../database.js';
import { StatusRepository } from '../database/status-repository';
import path from 'path';
import fs from 'fs/promises';

describe('Status Filtering Tests', () => {
  let db: FileIssueDatabase;
  let statusRepo: StatusRepository;
  const testDbPath = ':memory:';
  const testDataDir = path.join(__dirname, 'test-status-filtering');

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDataDir, { recursive: true });
    } catch {}

    db = new FileIssueDatabase(testDataDir, testDbPath);
    await db.initialize();
    statusRepo = new StatusRepository(db.getDatabase());
    
    // Create items table for search index
    await db.getDatabase().runAsync(`
      CREATE TABLE IF NOT EXISTS items (
        type TEXT,
        id INTEGER,
        title TEXT,
        tags TEXT,
        priority TEXT,
        status_id INTEGER,
        created_at TEXT,
        updated_at TEXT,
        PRIMARY KEY (type, id)
      )
    `);
  });

  afterEach(async () => {
    await db.close();
    try {
      await fs.rm(testDataDir, { recursive: true });
    } catch {}
  });

  describe('Default status filtering', () => {
    beforeEach(async () => {
      // Create tasks with different statuses
      await db.createTask('issues', 'Open Task', 'Content', 'high', 'Open');
      await db.createTask('issues', 'In Progress Task', 'Content', 'medium', 'In Progress');
      await db.createTask('issues', 'Review Task', 'Content', 'low', 'Review');
      await db.createTask('issues', 'Completed Task', 'Content', 'high', 'Completed');
      await db.createTask('issues', 'Closed Task', 'Content', 'medium', 'Closed');
      await db.createTask('issues', 'On Hold Task', 'Content', 'low', 'On Hold');
      await db.createTask('issues', 'Cancelled Task', 'Content', 'high', 'Cancelled');
    });

    it('should exclude closed statuses by default', async () => {
      const tasks = await db.getAllTasksSummary('issues');
      
      // Should only include open statuses
      expect(tasks).toHaveLength(4);
      const statuses = tasks.map(t => t.status);
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
      const tasks = await db.getAllTasksSummary('issues', true);
      
      expect(tasks).toHaveLength(7);
      const statuses = tasks.map(t => t.status);
      
      // Should include all statuses
      expect(statuses).toContain('Open');
      expect(statuses).toContain('In Progress');
      expect(statuses).toContain('Review');
      expect(statuses).toContain('On Hold');
      expect(statuses).toContain('Completed');
      expect(statuses).toContain('Closed');
      expect(statuses).toContain('Cancelled');
    });

    it('should filter by specific status IDs', async () => {
      // Get status IDs
      const statuses = await statusRepo.getAllStatuses();
      const openStatus = statuses.find(s => s.name === 'Open');
      const inProgressStatus = statuses.find(s => s.name === 'In Progress');
      
      const tasks = await db.getAllTasksSummary('issues', false, [
        openStatus!.id,
        inProgressStatus!.id
      ]);
      
      expect(tasks).toHaveLength(2);
      const taskStatuses = tasks.map(t => t.status);
      expect(taskStatuses).toContain('Open');
      expect(taskStatuses).toContain('In Progress');
    });

    it('should return empty array when filtering by non-existent status ID', async () => {
      const tasks = await db.getAllTasksSummary('issues', false, [999]);
      expect(tasks).toHaveLength(0);
    });

    it('should handle empty status ID array', async () => {
      const tasks = await db.getAllTasksSummary('issues', false, []);
      // Empty status ID array should return all open tasks (same as default)
      expect(tasks).toHaveLength(4);
      const statuses = tasks.map(t => t.status);
      expect(statuses).not.toContain('Completed');
      expect(statuses).not.toContain('Closed');
      expect(statuses).not.toContain('Cancelled');
    });
  });

  describe('Status filtering for different task types', () => {
    it('should apply filtering to plans', async () => {
      await db.createTask('plans', 'Open Plan', 'Content', 'high', 'Open');
      await db.createTask('plans', 'Completed Plan', 'Content', 'high', 'Completed');
      
      const openPlans = await db.getAllTasksSummary('plans');
      expect(openPlans).toHaveLength(1);
      expect(openPlans[0].title).toBe('Open Plan');
      
      const allPlans = await db.getAllTasksSummary('plans', true);
      expect(allPlans).toHaveLength(2);
    });

    it('should handle custom task types', async () => {
      // Create custom task type using the database connection directly
      const conn = db.getDatabase();
      await conn.runAsync(
        'INSERT INTO sequences (type, current_value, base_type) VALUES (?, ?, ?)',
        ['bugs', 0, 'tasks']
      );
      
      await db.createTask('bugs', 'Open Bug', 'Content', 'high', 'Open');
      await db.createTask('bugs', 'Closed Bug', 'Content', 'high', 'Closed');
      
      const openBugs = await db.getAllTasksSummary('bugs');
      expect(openBugs).toHaveLength(1);
      expect(openBugs[0].title).toBe('Open Bug');
    });
  });

  describe('Status transitions', () => {
    it('should handle status updates correctly', async () => {
      const task = await db.createTask('issues', 'Task', 'Content', 'high', 'Open');
      
      // Initially visible in default query
      let tasks = await db.getAllTasksSummary('issues');
      expect(tasks.find(t => t.id === task.id)).toBeTruthy();
      
      // Update to closed status
      await db.updateTask('issues', task.id, undefined, undefined, undefined, 'Closed');
      
      // Should not be visible in default query
      tasks = await db.getAllTasksSummary('issues');
      expect(tasks.find(t => t.id === task.id)).toBeFalsy();
      
      // Should be visible with includeClosedStatuses
      tasks = await db.getAllTasksSummary('issues', true);
      expect(tasks.find(t => t.id === task.id)).toBeTruthy();
    });

    it('should validate status names on update', async () => {
      const task = await db.createTask('issues', 'Task', 'Content', 'high', 'Open');
      
      // Try to update with invalid status
      await expect(
        db.updateTask('issues', task.id, undefined, undefined, undefined, 'InvalidStatus')
      ).rejects.toThrow('Invalid status: InvalidStatus');
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
          const task = await db.createTask('issues', `Task ${i}`, 'Content', 'medium', status);
          createdTasks.push(task);
        } catch (err: any) {
          console.error(`Error creating task ${i}:`, err.message);
        }
      }
      
      // Time the query
      const start = Date.now();
      const openTasks = await db.getAllTasksSummary('issues');
      const duration = Date.now() - start;
      
      // Should complete quickly
      expect(duration).toBeLessThan(100);
      
      // Should have correct count (50 open/in progress out of 100)
      expect(openTasks).toHaveLength(50);
      
      // Verify we have the right mix
      const allTasks = await db.getAllTasksSummary('issues', true);
      expect(allTasks).toHaveLength(100);
    });
  });

  describe('Edge cases', () => {
    it('should handle tasks with null status gracefully', async () => {
      // Directly insert a task with null status (shouldn't happen normally)
      const conn = db.getDatabase();
      await conn.runAsync(
        'INSERT INTO items (type, id, title, priority, status_id) VALUES (?, ?, ?, ?, ?)',
        ['issues', 999, 'Null Status Task', 'medium', null]
      );
      
      // Should handle gracefully
      const tasks = await db.getAllTasksSummary('issues');
      const nullStatusTask = tasks.find(t => t.id === 999);
      expect(nullStatusTask).toBeUndefined(); // Should be excluded
    });

    it('should handle concurrent status updates', async () => {
      const task = await db.createTask('issues', 'Task', 'Content', 'high', 'Open');
      
      // Try concurrent updates
      const updates = Array(5).fill(null).map((_, i) => 
        db.updateTask('issues', task.id, undefined, undefined, undefined, 
          i % 2 === 0 ? 'In Progress' : 'Review')
      );
      
      await Promise.all(updates);
      
      // Should have one of the statuses
      const updated = await db.getTask('issues', task.id);
      expect(['In Progress', 'Review']).toContain(updated?.status);
    });
  });
});