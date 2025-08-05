/**
 * @ai-context Test suite for sessions/dailies date extraction and filtering
 * @ai-pattern Comprehensive tests covering date extraction from IDs and period filtering when start_date is missing
 * @ai-related-files
 *   - src/repositories/item-repository.ts (implementation)
 *   - src/repositories/__tests__/item-repository-date-filter.test.ts (sessions date filtering)
 *   - src/repositories/__tests__/item-repository-dailies-filter.test.ts (dailies specific tests)
 */

import { ItemRepository } from '../item-repository.js';
import { FileIssueDatabase } from '../../database/index.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

describe('ItemRepository - sessions/dailies date extraction and filtering', () => {
  let testDataDir: string;
  let database: FileIssueDatabase;
  let itemRepo: ItemRepository;
  let tempDir: string;

  beforeEach(async () => {
    // Setup test directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'issues-93-test-'));
    testDataDir = path.join(tempDir, '.shirokuma/data');
    
    // Create required directories
    const dirs = ['issues', 'plans', 'docs', 'knowledge', 'sessions', 'dailies'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(testDataDir, dir), { recursive: true });
    }
    
    // Initialize database
    const dbPath = path.join(testDataDir, 'search.db');
    database = new FileIssueDatabase(testDataDir, dbPath);
    await database.initialize();
    
    // Get repositories
    itemRepo = database.getItemRepository();
  });

  afterEach(async () => {
    // Cleanup
    await database.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Integration Tests - Period Filtering', () => {
    beforeEach(async () => {
      // Create test data with various dates
      const testDailies = [
        { id: '2024-01-10', title: 'Daily 1' },
        { id: '2024-01-15', title: 'Daily 2' },
        { id: '2024-01-20', title: 'Daily 3' },
        { id: '2024-01-25', title: 'Daily 4' },
        { id: '2024-02-01', title: 'Daily 5' },
      ];

      const testSessions = [
        { id: '2024-01-10-10.00.00.000', title: 'Session 1' },
        { id: '2024-01-15-14.30.00.000', title: 'Session 2' },
        { id: '2024-01-20-09.15.00.000', title: 'Session 3' },
        { id: '2024-01-25-16.45.00.000', title: 'Session 4' },
        { id: '2024-02-01-11.20.00.000', title: 'Session 5' },
      ];

      // Create dailies without start_date to simulate old data
      for (const daily of testDailies) {
        await itemRepo.createItem({
          date: daily.id,
          type: 'dailies',
          title: daily.title,
          content: `Content for ${daily.title}`,
          priority: 'medium',
          status: 'Open',
          tags: ['daily'],
          // Intentionally omit start_date
        });
      }

      // Create sessions without start_date
      for (const session of testSessions) {
        await itemRepo.createItem({
          id: session.id,
          type: 'sessions',
          title: session.title,
          content: `Content for ${session.title}`,
          priority: 'medium',
          status: 'Open',
          tags: ['session'],
          // Intentionally omit start_date
        });
      }
    });

    it('should filter dailies by date range', async () => {
      const results = await itemRepo.getItems('dailies', false, undefined, '2024-01-15', '2024-01-20');

      expect(results.length).toBe(2);
      expect(results.map(item => item.id).sort()).toEqual(['2024-01-15', '2024-01-20']);
    });

    it('should filter sessions by date range', async () => {
      const results = await itemRepo.getItems('sessions', false, undefined, '2024-01-15', '2024-01-20');

      expect(results.length).toBe(2);
      expect(results.map(item => item.id).sort()).toEqual([
        '2024-01-15-14.30.00.000',
        '2024-01-20-09.15.00.000'
      ]);
    });

    it('should handle inclusive date boundaries', async () => {
      const results = await itemRepo.getItems('dailies', false, undefined, '2024-01-10', '2024-01-10');

      expect(results.length).toBe(1);
      expect(results[0].id).toBe('2024-01-10');
    });

    it('should return empty array for date range with no matches', async () => {
      const results = await itemRepo.getItems('dailies', false, undefined, '2024-03-01', '2024-03-31');

      expect(results.length).toBe(0);
    });

    it('should handle only startDate filter', async () => {
      const results = await itemRepo.getItems('dailies', false, undefined, '2024-01-20');

      expect(results.length).toBe(3); // 2024-01-20, 2024-01-25, 2024-02-01
    });

    it('should handle only endDate filter', async () => {
      const results = await itemRepo.getItems('dailies', false, undefined, undefined, '2024-01-15');

      expect(results.length).toBe(2); // 2024-01-10, 2024-01-15
    });
  });

  describe('Regression Tests - Other Types Unaffected', () => {
    it('should not affect plans type filtering', async () => {
      await itemRepo.createItem({
        type: 'plans',
        title: 'Plan with date',
        content: 'Plan content',
        priority: 'high',
        status: 'In Progress',
        tags: ['milestone'],
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      });

      const results = await itemRepo.getItems('plans', false, undefined, '2024-01-15');

      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Plan with date');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed session IDs gracefully', async () => {
      const malformedIds = [
        '2024-01-15-invalid',
        '2024-13-45-10.00.00.000', // Invalid month/day
        'abcd-01-15-10.00.00.000',
        '2024-01-15.10.00.00.000', // Wrong separator
      ];

      for (const id of malformedIds) {
        await itemRepo.createItem({
          id,
          type: 'sessions',
          title: `Session ${id}`,
          content: 'Content',
          priority: 'medium',
          status: 'Open',
          tags: ['session']
        });
      }

      const results = await itemRepo.getItems('sessions', false, undefined, '2024-01-01', '2024-12-31');

      // Sessions with valid date prefix should be included
      // '2024-01-15-invalid' has a valid date prefix
      // '2024-13-45-10.00.00.000' has invalid month/day
      const validDatePrefixIds = results.map(r => r.id).filter(id => id.startsWith('2024-01-15'));
      expect(validDatePrefixIds.length).toBeGreaterThan(0);
    });

    it('should handle dailies with future dates', async () => {
      const futureDate = '2025-12-31';
      await itemRepo.createItem({
        date: futureDate,
        type: 'dailies',
        title: 'Future Daily',
        content: 'Future content',
        priority: 'medium',
        status: 'Open',
        tags: ['daily']
      });

      const results = await itemRepo.getItems('dailies', false, undefined, '2025-01-01');

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(futureDate);
    });

    it('should handle sessions with millisecond precision', async () => {
      const preciseId = '2024-01-15-14.30.45.123';
      await itemRepo.createItem({
        id: preciseId,
        type: 'sessions',
        title: 'Precise Session',
        content: 'Content',
        priority: 'medium',
        status: 'Open',
        tags: ['session']
      });

      const results = await itemRepo.getItems('sessions', false, undefined, '2024-01-15', '2024-01-15');

      expect(results.length).toBe(1);
      // Verify the session was found
      expect(results[0].id).toBe(preciseId);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Create 100 dailies
      const promises = [];
      for (let i = 1; i <= 31; i++) {
        const day = String(i).padStart(2, '0');
        promises.push(itemRepo.createItem({
          date: `2024-01-${day}`,
          type: 'dailies',
          title: `Daily ${i}`,
          content: `Content ${i}`,
          priority: 'medium',
          status: 'Open',
          tags: ['daily']
        }));
      }
      
      await Promise.all(promises);
      
      // Query a subset
      const queryStart = Date.now();
      const results = await itemRepo.getItems('dailies', false, undefined, '2024-01-10', '2024-01-20');
      const queryTime = Date.now() - queryStart;
      
      expect(results.length).toBe(11); // 10th to 20th inclusive
      expect(queryTime).toBeLessThan(100); // Should be fast
      
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(1000); // Total time under 1 second
    });
  });

});