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

  it('should demonstrate the date filtering bug', async () => {
    // Create a daily
    await itemRepo.createItem({
      type: 'dailies',
      id: '2025-07-31',
      title: 'Work Summary - 2025-07-31',
      content: 'Test daily content'
    });

    // First, verify the daily was created successfully
    const allDailies = await itemRepo.getItems('dailies');
    console.log('All dailies:', allDailies);
    expect(allDailies.length).toBe(1);

    // Check the database directly
    const db = database.getDatabase();
    const rows = await db.allAsync(
      'SELECT type, id, start_date FROM items WHERE type = ?',
      ['dailies']
    ) as any[];
    console.log('Database rows:', rows);

    // Try to find it with date filter
    const filteredResults = await itemRepo.getItems('dailies', false, undefined, '2025-07-31', '2025-07-31');
    console.log('Filtered results:', filteredResults);
    
    // This is where the bug occurs
    expect(filteredResults.length).toBe(1);

    // Let's also check the SQL query being generated
    // Add debug output to see the actual query
    const debugQuery = `
      SELECT type, id, start_date 
      FROM items 
      WHERE type = 'dailies' 
        AND start_date >= '2025-07-31' 
        AND start_date <= '2025-07-31'
    `;
    const debugResults = await db.allAsync(debugQuery) as any[];
    console.log('Debug query results:', debugResults);
  });
});