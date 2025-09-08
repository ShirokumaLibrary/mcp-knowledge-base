import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import fs from 'fs/promises';
import path from 'path';
import { Item } from '../../src/entities/Item.js';
import { Status } from '../../src/entities/Status.js';
import { SystemState } from '../../src/entities/SystemState.js';
import { Tag } from '../../src/entities/Tag.js';
import { ItemTag } from '../../src/entities/ItemTag.js';
import { ItemRelation } from '../../src/entities/ItemRelation.js';
import { ExportManager } from '../../src/services/export-manager.js';

// Test database and export directory
const TEST_EXPORT_DIR = '/tmp/test-auto-export';
const TestDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logging: false,
  entities: [Item, Status, SystemState, Tag, ItemTag, ItemRelation],
});

describe('Auto-Export Integration Tests', () => {
  let exportManager: ExportManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    // Initialize test database
    await TestDataSource.initialize();
    
    // Mock AppDataSource for ExportManager
    (global as any).AppDataSource = TestDataSource;
    
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterAll(async () => {
    // Restore environment
    process.env = originalEnv;
    
    // Close database
    await TestDataSource.destroy();
    
    // Clean up test directory
    await fs.rm(TEST_EXPORT_DIR, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Set up test export directory
    process.env.SHIROKUMA_EXPORT_DIR = TEST_EXPORT_DIR;
    await fs.mkdir(TEST_EXPORT_DIR, { recursive: true });
    
    // Create fresh ExportManager instance
    exportManager = new ExportManager();
    
    // Seed test data
    const statusRepo = TestDataSource.getRepository(Status);
    await statusRepo.save([
      { id: 1, name: 'Open', isClosable: false, sortOrder: 1 },
      { id: 2, name: 'In Progress', isClosable: false, sortOrder: 2 },
      { id: 3, name: 'Completed', isClosable: true, sortOrder: 3 },
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    await TestDataSource.getRepository(Item).delete({});
    await TestDataSource.getRepository(SystemState).delete({});
    await TestDataSource.getRepository(Status).delete({});
    
    // Clean up export directory
    await fs.rm(TEST_EXPORT_DIR, { recursive: true, force: true }).catch(() => {});
  });

  describe('Item Auto-Export', () => {
    it('should export item when auto-export is enabled', async () => {
      // Create a test item
      const itemRepo = TestDataSource.getRepository(Item);
      const item = await itemRepo.save({
        type: 'issue',
        title: 'Test Issue',
        description: 'Test description',
        content: 'Test content',
        statusId: 1,
        priority: 'HIGH',
      });

      // Call auto-export
      await exportManager.autoExportItem(item);

      // Verify file was created
      const expectedPath = path.join(TEST_EXPORT_DIR, 'issue', `${item.id}-Test_Issue.md`);
      const fileExists = await fs.access(expectedPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Verify file content
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toContain('title: "Test Issue"');
      expect(content).toContain('type: issue');
      expect(content).toContain('priority: HIGH');
      expect(content).toContain('Test content');
    });

    it('should not export when environment variable is not set', async () => {
      // Remove environment variable
      delete process.env.SHIROKUMA_EXPORT_DIR;
      const manager = new ExportManager();

      // Create a test item
      const itemRepo = TestDataSource.getRepository(Item);
      const item = await itemRepo.save({
        type: 'issue',
        title: 'Test Issue',
        content: 'Test content',
        statusId: 1,
      });

      // Call auto-export
      await manager.autoExportItem(item);

      // Verify no file was created
      const expectedPath = path.join(TEST_EXPORT_DIR, 'issue', `${item.id}-Test_Issue.md`);
      const fileExists = await fs.access(expectedPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should overwrite existing file on update', async () => {
      // Create initial item
      const itemRepo = TestDataSource.getRepository(Item);
      const item = await itemRepo.save({
        type: 'issue',
        title: 'Original Title',
        content: 'Original content',
        statusId: 1,
      });

      // Export initially
      await exportManager.autoExportItem(item);

      // Update item
      item.title = 'Updated Title';
      item.content = 'Updated content';
      const updated = await itemRepo.save(item);

      // Export again
      await exportManager.autoExportItem(updated);

      // Check old file is removed
      const oldPath = path.join(TEST_EXPORT_DIR, 'issue', `${item.id}-Original_Title.md`);
      const oldExists = await fs.access(oldPath).then(() => true).catch(() => false);
      expect(oldExists).toBe(false);

      // Check new file exists
      const newPath = path.join(TEST_EXPORT_DIR, 'issue', `${item.id}-Updated_Title.md`);
      const newExists = await fs.access(newPath).then(() => true).catch(() => false);
      expect(newExists).toBe(true);

      // Verify updated content
      const content = await fs.readFile(newPath, 'utf-8');
      expect(content).toContain('title: "Updated Title"');
      expect(content).toContain('Updated content');
    });

    it('should handle export errors gracefully', async () => {
      // Make directory read-only to cause error
      await fs.mkdir(path.join(TEST_EXPORT_DIR, 'issue'), { recursive: true });
      await fs.chmod(path.join(TEST_EXPORT_DIR, 'issue'), 0o444);

      // Create a test item
      const itemRepo = TestDataSource.getRepository(Item);
      const item = await itemRepo.save({
        type: 'issue',
        title: 'Test Issue',
        content: 'Test content',
        statusId: 1,
      });

      // Call auto-export - should not throw
      await expect(exportManager.autoExportItem(item)).resolves.toBeUndefined();

      // Restore permissions
      await fs.chmod(path.join(TEST_EXPORT_DIR, 'issue'), 0o755);
    });
  });

  describe('Current State Auto-Export', () => {
    it('should export current state when auto-export is enabled', async () => {
      // Create a test state
      const stateRepo = TestDataSource.getRepository(SystemState);
      const state = await stateRepo.save({
        content: 'Current system state content',
        tags: JSON.stringify(['test', 'state']),
        version: '1.0.0',
        isActive: true,
      });

      // Call auto-export
      await exportManager.autoExportCurrentState(state);

      // Verify file was created
      const expectedPath = path.join(TEST_EXPORT_DIR, '.system', 'current_state', `${state.id}.md`);
      const fileExists = await fs.access(expectedPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Verify latest.md was created
      const latestPath = path.join(TEST_EXPORT_DIR, '.system', 'current_state', 'latest.md');
      const latestExists = await fs.access(latestPath).then(() => true).catch(() => false);
      expect(latestExists).toBe(true);

      // Verify content
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toContain('type: system_state');
      expect(content).toContain('version: "1.0.0"');
      expect(content).toContain('Current system state content');
    });

    it('should use fixed path for current state', async () => {
      // Create multiple states
      const stateRepo = TestDataSource.getRepository(SystemState);
      const state1 = await stateRepo.save({
        content: 'First state',
        version: '1.0.0',
        isActive: false,
      });

      const state2 = await stateRepo.save({
        content: 'Second state',
        version: '1.0.1',
        isActive: true,
      });

      // Export both
      await exportManager.autoExportCurrentState(state1);
      await exportManager.autoExportCurrentState(state2);

      // Verify both files exist in the same directory
      const dir = path.join(TEST_EXPORT_DIR, '.system', 'current_state');
      const files = await fs.readdir(dir);
      
      expect(files).toContain(`${state1.id}.md`);
      expect(files).toContain(`${state2.id}.md`);
      expect(files).toContain('latest.md');

      // Verify latest.md points to the last exported state
      const latestContent = await fs.readFile(path.join(dir, 'latest.md'), 'utf-8');
      expect(latestContent).toContain('Second state');
    });
  });

  describe('Performance', () => {
    it('should complete export within timeout', async () => {
      // Set a short timeout
      process.env.SHIROKUMA_EXPORT_TIMEOUT = '500';
      const manager = new ExportManager();

      // Create a test item
      const itemRepo = TestDataSource.getRepository(Item);
      const item = await itemRepo.save({
        type: 'issue',
        title: 'Performance Test',
        content: 'Content for performance test',
        statusId: 1,
      });

      // Measure export time
      const startTime = Date.now();
      await manager.autoExportItem(item);
      const duration = Date.now() - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(600); // Allow some margin over timeout
    });

    it('should handle concurrent exports', async () => {
      // Create multiple items
      const itemRepo = TestDataSource.getRepository(Item);
      const items = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          itemRepo.save({
            type: 'issue',
            title: `Concurrent Issue ${i}`,
            content: `Content ${i}`,
            statusId: 1,
          })
        )
      );

      // Export all concurrently
      const startTime = Date.now();
      await Promise.all(items.map(item => exportManager.autoExportItem(item)));
      const duration = Date.now() - startTime;

      // Should complete reasonably fast
      expect(duration).toBeLessThan(2000);

      // Verify all files were created
      const issueDir = path.join(TEST_EXPORT_DIR, 'issue');
      const files = await fs.readdir(issueDir);
      expect(files).toHaveLength(10);
    });
  });
});