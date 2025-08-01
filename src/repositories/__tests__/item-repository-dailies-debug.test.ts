/**
 * @ai-context Debug dailies date filtering issue
 * @ai-pattern Minimal test to reproduce bug
 */

import { ItemRepository } from '../item-repository.js';
import { FileIssueDatabase } from '../../database/index.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

describe('ItemRepository - Dailies Date Filtering Debug', () => {
  let testDataDir: string;
  let database: FileIssueDatabase;
  let itemRepo: ItemRepository;

  beforeEach(async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dailies-debug-test-'));
    testDataDir = path.join(tempDir, '.shirokuma/data');
    
    // Create required directories
    await fs.mkdir(path.join(testDataDir, 'dailies'), { recursive: true });
    
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

  it('should correctly filter dailies by date', async () => {
    // Create a daily with the proper 'date' parameter (not 'id')
    await itemRepo.createItem({
      type: 'dailies',
      date: '2025-07-31',
      title: 'Work Summary - 2025-07-31',
      content: 'Test daily content'
    });

    // Check the database directly to see what was stored
    const db = database.getDatabase();
    const rows = await db.allAsync(
      'SELECT type, id, start_date, created_at FROM items WHERE type = ?',
      ['dailies']
    ) as any[];
    
    // The bug: start_date is stored correctly but the filtering doesn't work
    expect(rows.length).toBe(1);
    expect(rows[0].start_date).toBe('2025-07-31'); // This should pass
    
    // Try to find it with date filter - this is where it fails
    const filteredResults = await itemRepo.getItems('dailies', false, undefined, '2025-07-31', '2025-07-31');
    
    // This should now work correctly
    expect(filteredResults.length).toBe(1);
  });
});