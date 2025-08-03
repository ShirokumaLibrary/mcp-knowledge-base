import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// @ai-critical: Ensure test runs in non-production mode
// @ai-why: Tests need full logging and normal database behavior
process.env.NODE_ENV = 'test';
process.env.MCP_MODE = 'false';

import { FileIssueDatabase } from '../database/index.js';

describe('Database Rebuild Integration', () => {
  const testDataDir = path.join(process.cwd(), 'test-rebuild-integration');
  const testDbPath = path.join(testDataDir, 'search.db');
  
  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('should auto-rebuild database when markdown files exist', async () => {
    // Create test markdown files BEFORE creating database
    fs.mkdirSync(path.join(testDataDir, 'issues'), { recursive: true });
    
    // Create test issue with proper frontmatter format
    const issueContent = `---
title: Test Issue
priority: high
status: Open
tags: ["test", "rebuild"]
---

This is a test issue for rebuild functionality.`;
    
    fs.writeFileSync(
      path.join(testDataDir, 'issues', 'issues-1.md'),
      issueContent
    );

    // Ensure database doesn't exist yet
    expect(fs.existsSync(testDbPath)).toBe(false);

    // First initialization - should set needs_rebuild flag
    const db1 = new FileIssueDatabase(testDataDir, testDbPath);
    await db1.initialize();

    // Database should now exist
    expect(fs.existsSync(testDbPath)).toBe(true);

    // The auto-rebuild should have already happened during initialization
    // Check that the markdown files were imported
    const itemRepo1 = db1.getItemRepository();
    const items1 = await itemRepo1.getItems('issues');
    
    // The rebuild should have imported the test issue
    expect(items1).toHaveLength(1);
    expect(items1[0]).toMatchObject({
      type: 'issues',
      id: '1',
      title: 'Test Issue',
      priority: 'high',
      status: 'Open',
      tags: ['test', 'rebuild']
    });
    
    // Check that needs_rebuild flag was cleared after rebuild
    const rawDb1 = db1.getDatabase();
    const needsRebuild = await rawDb1.getAsync(
      'SELECT value FROM db_metadata WHERE key = ?',
      ['needs_rebuild']
    ) as { value: string } | undefined;
    
    // Flag should be cleared after successful rebuild
    expect(needsRebuild).toBeUndefined();

    // Close first instance
    await db1.close();

    // Second initialization - should NOT trigger rebuild again
    const db2 = new FileIssueDatabase(testDataDir, testDbPath);
    await db2.initialize();

    // Verify the database still has the imported data
    const itemRepo2 = db2.getItemRepository();
    const items2 = await itemRepo2.getItems('issues');
    
    expect(items2).toHaveLength(1);
    expect(items2[0]).toMatchObject({
      type: 'issues',
      id: '1',
      title: 'Test Issue',
      priority: 'high',
      status: 'Open',
      tags: ['test', 'rebuild']
    });

    // Confirm that needs_rebuild flag is still cleared
    const rawDb2 = db2.getDatabase();
    const stillNeedsRebuild = await rawDb2.getAsync(
      'SELECT value FROM db_metadata WHERE key = ?',
      ['needs_rebuild']
    ) as { value: string } | undefined;
    
    expect(stillNeedsRebuild).toBeUndefined();

    await db2.close();
  });

  it('should create empty database when no markdown files exist', async () => {
    // Create empty directory structure
    fs.mkdirSync(testDataDir, { recursive: true });

    // Initialize database
    const db = new FileIssueDatabase(testDataDir, testDbPath);
    await db.initialize();

    // Database should exist
    expect(fs.existsSync(testDbPath)).toBe(true);

    // Verify the database is empty
    const allTypes = await db.getTypeRepository().getAllTypes();
    
    // Should only have default types
    expect(allTypes.length).toBeGreaterThan(0);
    
    // But no items
    const itemRepo = db.getItemRepository();
    const issues = await itemRepo.getItems('issues');
    expect(issues).toHaveLength(0);

    await db.close();
  });
});