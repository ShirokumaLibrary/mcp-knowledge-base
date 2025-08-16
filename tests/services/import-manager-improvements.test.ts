import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs/promises';
import { ImportManager, ImportError } from '../../src/services/import-manager.js';

// Mock modules
vi.mock('fs/promises');

describe('ImportManager - Security & Performance Improvements', () => {
  let importManager: ImportManager;
  let mockPrisma: any;

  beforeEach(() => {
    // Create minimal mock Prisma client
    mockPrisma = {
      item: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      },
      status: {
        findUnique: vi.fn()
      },
      tag: {
        findUnique: vi.fn(),
        create: vi.fn()
      },
      itemRelation: {
        createMany: vi.fn()
      },
      systemState: {
        create: vi.fn()
      },
      $transaction: vi.fn((callback) => callback(mockPrisma))
    };

    importManager = new ImportManager(mockPrisma as any);
  });

  describe('Windows Path Security', () => {
    it('should reject Windows system paths', async () => {
      const windowsPaths = [
        'C:\\Windows\\System32\\config.sys',
        'C:\\Program Files\\app\\data.md',
        'C:\\PROGRAM FILES (X86)\\test.md'
      ];

      // Mock Windows platform
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      });

      for (const path of windowsPaths) {
        await expect(importManager.importFile(path)).rejects.toThrow('system directory access denied');
      }

      // Restore platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true
      });
    });

    it('should reject path traversal on Windows', async () => {
      const traversalPaths = [
        '..\\..\\etc\\passwd',
        'docs\\..\\..\\sensitive.md',
        '.\\..\\..\\config.md'
      ];

      for (const path of traversalPaths) {
        await expect(importManager.importFile(path)).rejects.toThrow('path traversal detected');
      }
    });
  });

  describe('Batch Processing Performance', () => {
    it('should process files in batches', async () => {
      const dirPath = '/test/docs';
      const batchSize = 3;
      
      // Mock directory with multiple files
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'file1.md', isDirectory: () => false },
        { name: 'file2.md', isDirectory: () => false },
        { name: 'file3.md', isDirectory: () => false },
        { name: 'file4.md', isDirectory: () => false },
        { name: 'file5.md', isDirectory: () => false }
      ] as any);

      const fileContent = `---
id: 1
type: test
title: "Test"
status: Open
priority: MEDIUM
---
Content`;

      vi.mocked(fs.stat).mockResolvedValue({ size: 100 } as any);
      vi.mocked(fs.readFile).mockResolvedValue(fileContent);
      mockPrisma.item.findUnique.mockResolvedValue(null);
      mockPrisma.status.findUnique.mockResolvedValue({ id: 1, name: 'Open' });
      mockPrisma.item.create.mockResolvedValue({ id: 1 });

      const startTime = Date.now();
      const result = await importManager.importDirectory(dirPath, { batchSize });
      const duration = Date.now() - startTime;

      // Should process 5 files successfully
      expect(result.imported).toBe(5);
      expect(result.failed).toBe(0);

      // Batch processing should be faster than sequential
      // (This is a simplified test - in real scenario we'd measure actual concurrency)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('System State Error Handling', () => {
    it('should report system state import errors', async () => {
      const basePath = '/test/export';
      
      // Mock directory structure
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: '.system', isDirectory: () => true }
      ] as any);

      // Mock system state file exists but has invalid content
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Invalid YAML format'));

      // Create a new instance to avoid contamination
      const testManager = new ImportManager(mockPrisma as any);
      
      const result = await testManager.importAll(basePath);

      // Should have a warning in errors array
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0].code).toBe('STATE_IMPORT_WARNING');
      expect(result.stateImported).toBe(false);
    });

    it('should ignore ENOENT errors for missing system state', async () => {
      const basePath = '/test/export';
      
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'issue', isDirectory: () => true }
      ] as any);

      const enoentError = new Error('ENOENT: no such file');
      vi.mocked(fs.access).mockRejectedValue(enoentError);

      const testManager = new ImportManager(mockPrisma as any);
      const result = await testManager.importAll(basePath);

      // Should not have errors for missing file
      expect(result.errors?.length || 0).toBe(0);
      expect(result.stateImported).toBe(false);
    });
  });
});