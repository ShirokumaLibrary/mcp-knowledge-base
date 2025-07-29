/**
 * @ai-context Test for rebuild-db.ts sequence handling
 * @ai-pattern Validates that sessions/dailies sequences remain 0 after rebuild
 * @ai-critical Ensures ID generation remains correct for different types
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { FileIssueDatabase } from '../database/index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

describe('Rebuild Sequence Handling', () => {
  jest.setTimeout(30000);
  const testDataDir = path.join(os.tmpdir(), 'mcp-sequence-test-' + process.pid + '-' + Date.now());
  const dbPath = path.join(testDataDir, 'search.db');
  let db: FileIssueDatabase;

  beforeEach(async () => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
    
    db = new FileIssueDatabase(testDataDir, dbPath);
    await db.initialize();
  });

  afterEach(async () => {
    await db.close();
    if (process.env.KEEP_TEST_DATA !== 'true' && fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  test('should maintain sequence values correctly after rebuild', async () => {
    const itemRepo = db.getItemRepository();
    
    // Create items with numeric IDs
    await itemRepo.createItem({
      type: 'issues',
      title: 'Issue 1',
      content: 'Content 1'
    });
    
    await itemRepo.createItem({
      type: 'issues',
      title: 'Issue 2',
      content: 'Content 2'
    });
    
    await itemRepo.createItem({
      type: 'docs',
      title: 'Doc 1',
      content: 'Doc content'
    });
    
    // Create items with non-numeric IDs
    await itemRepo.createItem({
      type: 'sessions',
      title: 'Session 1',
      content: 'Session content'
    });
    
    await itemRepo.createItem({
      type: 'dailies',
      date: '2025-07-30',
      title: 'Daily Summary',
      content: 'Daily content'
    });
    
    // Check sequences before rebuild
    const database = db.getDatabase();
    const sequencesBefore = await database.allAsync(
      'SELECT type, current_value FROM sequences WHERE type IN (?, ?, ?, ?) ORDER BY type',
      ['issues', 'docs', 'sessions', 'dailies']
    ) as Array<{type: string; current_value: number}>;
    
    expect(sequencesBefore).toEqual([
      { type: 'dailies', current_value: 0 },
      { type: 'docs', current_value: 1 },
      { type: 'issues', current_value: 2 },
      { type: 'sessions', current_value: 0 }
    ]);
    
    // Close database and rebuild
    await db.close();
    fs.unlinkSync(dbPath);
    
    // Run rebuild script
    const output = execSync(`MCP_DATABASE_PATH=${testDataDir} node dist/rebuild-db.js`, {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    // Verify skipped sequences in output
    expect(output).toContain("Skipped sequence 'sessions' (uses timestamp/date IDs)");
    expect(output).toContain("Skipped sequence 'dailies' (uses timestamp/date IDs)");
    expect(output).toContain("Updated sequence 'issues' to 2");
    expect(output).toContain("Updated sequence 'docs' to 1");
    
    // Reopen database and check sequences
    db = new FileIssueDatabase(testDataDir, dbPath);
    await db.initialize();
    
    const database2 = db.getDatabase();
    const sequencesAfter = await database2.allAsync(
      'SELECT type, current_value FROM sequences WHERE type IN (?, ?, ?, ?) ORDER BY type',
      ['issues', 'docs', 'sessions', 'dailies']
    ) as Array<{type: string; current_value: number}>;
    
    // Verify sequences are correct after rebuild
    expect(sequencesAfter).toEqual([
      { type: 'dailies', current_value: 0 },  // Should remain 0
      { type: 'docs', current_value: 1 },     // Should match max ID
      { type: 'issues', current_value: 2 },   // Should match max ID
      { type: 'sessions', current_value: 0 }  // Should remain 0
    ]);
  });

  test('should handle empty database rebuild correctly', async () => {
    // Close initial database
    await db.close();
    fs.unlinkSync(dbPath);
    
    // Run rebuild on empty directory
    execSync(`MCP_DATABASE_PATH=${testDataDir} node dist/rebuild-db.js`, {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    // Reopen and check all sequences are 0
    db = new FileIssueDatabase(testDataDir, dbPath);
    await db.initialize();
    
    const database = db.getDatabase();
    const sequences = await database.allAsync(
      'SELECT type, current_value FROM sequences ORDER BY type',
      []
    ) as Array<{type: string; current_value: number}>;
    
    // All sequences should be 0 in empty database
    sequences.forEach(seq => {
      expect(seq.current_value).toBe(0);
    });
  });
});