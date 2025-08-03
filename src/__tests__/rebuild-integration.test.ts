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

  it('should mark database for rebuild when markdown files exist', async () => {
    // Create test markdown files BEFORE creating database
    fs.mkdirSync(path.join(testDataDir, 'issues'), { recursive: true });
    
    // Create test issue
    const issueContent = `# Test Issue

Priority: high
Status: Open
Tags: test, rebuild

This is a test issue for rebuild functionality.`;
    
    fs.writeFileSync(
      path.join(testDataDir, 'issues', 'issues-1.md'),
      issueContent
    );

    // Ensure database doesn't exist yet
    expect(fs.existsSync(testDbPath)).toBe(false);

    // Initialize database for the first time with existing markdown files
    const db = new FileIssueDatabase(testDataDir, testDbPath);
    await db.initialize();

    // Database should now exist and have auto-imported the markdown
    expect(fs.existsSync(testDbPath)).toBe(true);

    // Verify the database was populated via auto-rebuild
    const itemRepo = db.getItemRepository();
    const items = await itemRepo.getItems('issues');
    
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'issues',
      id: '1',
      title: 'Test Issue',
      priority: 'high',
      status: 'Open',
      tags: ['test', 'rebuild']
    });

    db.close();
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

    db.close();
  });
});