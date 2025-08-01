/**
 * @ai-context Test dailies date filtering issue
 * @ai-pattern Reproduce and fix date filtering bug
 */

import { ItemRepository } from '../item-repository.js';
import { FileIssueDatabase } from '../../database/index.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

describe('ItemRepository - Dailies Date Filtering', () => {
  let testDataDir: string;
  let database: FileIssueDatabase;
  let itemRepo: ItemRepository;

  beforeEach(async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dailies-filter-test-'));
    testDataDir = path.join(tempDir, '.shirokuma/data');
    
    // Create required directories - dailies go under sessions/dailies
    await fs.mkdir(path.join(testDataDir, 'sessions', 'dailies'), { recursive: true });
    
    // Create database with explicit SQLite path in test directory
    const dbPath = path.join(testDataDir, 'search.db');
    database = new FileIssueDatabase(testDataDir, dbPath);
    await database.initialize();
    itemRepo = database.getItemRepository();
  });

  afterEach(async () => {
    await database.close();
    // Clean up test directory
    try {
      await fs.rm(path.dirname(testDataDir), { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Dailies date filtering bug', () => {
    it('should find dailies by exact date', async () => {
      // Create a daily for 2025-07-31
      const daily = await itemRepo.createItem({
        type: 'dailies',
        date: '2025-07-31',  // Use date parameter, not id
        title: 'Work Summary - 2025-07-31',
        content: 'Test daily content'
      });

      // This should find the daily
      const results = await itemRepo.getItems('dailies', false, undefined, '2025-07-31', '2025-07-31');
      
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('2025-07-31');
      expect(results[0].title).toBe('Work Summary - 2025-07-31');
    });

    it('should find multiple dailies in date range', async () => {
      // Create dailies for multiple dates (using different dates to avoid conflicts)
      await itemRepo.createItem({
        type: 'dailies',
        date: '2025-08-01',  // Use date parameter, not id
        title: 'Work Summary - 2025-08-01',
        content: 'Day 1'
      });

      await itemRepo.createItem({
        type: 'dailies',
        date: '2025-08-02',  // Use date parameter, not id
        title: 'Work Summary - 2025-08-02',
        content: 'Day 2'
      });

      await itemRepo.createItem({
        type: 'dailies',
        date: '2025-08-03',  // Use date parameter, not id
        title: 'Work Summary - 2025-08-03',
        content: 'Day 3'
      });

      // Should find all three
      const allResults = await itemRepo.getItems('dailies', false, undefined, '2025-08-01', '2025-08-03');
      expect(allResults.length).toBe(3);

      // Should find only middle one
      const middleResults = await itemRepo.getItems('dailies', false, undefined, '2025-08-02', '2025-08-02');
      expect(middleResults.length).toBe(1);
      expect(middleResults[0].id).toBe('2025-08-02');

      // Should find last two
      const lastTwoResults = await itemRepo.getItems('dailies', false, undefined, '2025-08-02', '2025-08-03');
      expect(lastTwoResults.length).toBe(2);
      expect(lastTwoResults.map(r => r.id).sort()).toEqual(['2025-08-02', '2025-08-03']);
    });

    it('should verify start_date field is correctly set', async () => {
      // Create a daily and check the database directly
      await itemRepo.createItem({
        type: 'dailies',
        date: '2025-08-10',  // Use date parameter, not id
        title: 'Work Summary - 2025-08-10',
        content: 'Test content'
      });

      // Check the database directly
      const db = database.getDatabase();
      const row = await db.getAsync(
        'SELECT type, id, start_date FROM items WHERE type = ? AND id = ?',
        ['dailies', '2025-08-10']
      ) as any;

      expect(row).toBeDefined();
      expect(row.start_date).toBe('2025-08-10');
    });
  });
});