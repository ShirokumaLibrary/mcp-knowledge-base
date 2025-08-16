import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { ImportManager } from '../../src/services/import-manager.js';

// Mock fs/promises with factory to prevent memory issues
vi.mock('fs/promises', () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    access: vi.fn()
  },
  stat: vi.fn(),
  readFile: vi.fn(),
  readdir: vi.fn(),
  access: vi.fn()
}));

// Import fs after mocking
import fs from 'fs/promises';

describe.skip('ImportManager', () => {
  let importManager: ImportManager;
  let mockPrisma: any;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      item: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn()
      },
      status: {
        findUnique: vi.fn(),
        findMany: vi.fn()
      },
      tag: {
        findUnique: vi.fn(),
        create: vi.fn()
      },
      itemTag: {
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

    importManager = new ImportManager(mockPrisma as unknown as PrismaClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('importFile', () => {
    it('should import a valid markdown file with front matter', async () => {
      // Arrange
      const filePath = '/test/docs/export/issue/1-test.md';
      const fileContent = `---
id: 1
type: issue
title: "Test Issue"
status: Open
priority: HIGH
tags: ["bug", "urgent"]
created: 2025-08-16T00:00:00.000Z
updated: 2025-08-16T00:00:00.000Z
---

# Test Issue

This is a test issue content.`;

      vi.mocked(fs.stat).mockResolvedValue({ size: 1000 } as any);
      vi.mocked(fs.readFile).mockResolvedValue(fileContent);
      mockPrisma.item.findUnique.mockResolvedValue(null);
      mockPrisma.status.findUnique.mockResolvedValue({ id: 1, name: 'Open' });
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue({ id: 1, name: 'bug' });
      mockPrisma.item.create.mockResolvedValue({ id: 1, title: 'Test Issue' });

      // Act
      const result = await importManager.importFile(filePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.itemId).toBe(1);
      expect(mockPrisma.item.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: 1,
            type: 'issue',
            title: 'Test Issue'
          })
        })
      );
    });

    it('should skip import when item already exists in default mode', async () => {
      // Arrange
      const filePath = '/test/docs/export/issue/1-test.md';
      const fileContent = `---
id: 1
type: issue
title: "Test Issue"
status: Open
priority: HIGH
---

# Test Issue`;

      vi.mocked(fs.stat).mockResolvedValue({ size: 500 } as any);
      vi.mocked(fs.readFile).mockResolvedValue(fileContent);
      mockPrisma.item.findUnique.mockResolvedValue({ id: 1, title: 'Existing Issue' });

      // Act
      const result = await importManager.importFile(filePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(mockPrisma.item.create).not.toHaveBeenCalled();
    });

    it('should reject files with path traversal attempts', async () => {
      // Arrange
      const filePath = '../../../etc/passwd';

      // Act & Assert
      await expect(importManager.importFile(filePath)).rejects.toThrow('Invalid file path');
    });

    it('should reject files larger than 10MB', async () => {
      // Arrange
      const filePath = '/test/large.md';
      
      vi.mocked(fs.stat).mockResolvedValue({
        size: 11 * 1024 * 1024 // 11MB
      } as any);

      // Act & Assert
      await expect(importManager.importFile(filePath)).rejects.toThrow('File too large');
    });
  });

  describe('importDirectory', () => {
    it('should import all markdown files from a directory', async () => {
      // Arrange
      const dirPath = '/test/docs/export';
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'issue', isDirectory: () => true },
        { name: 'knowledge', isDirectory: () => true }
      ] as any);
      
      vi.mocked(fs.readdir)
        .mockResolvedValueOnce([
          { name: '1-test.md', isDirectory: () => false }
        ] as any)
        .mockResolvedValueOnce([
          { name: '2-knowledge.md', isDirectory: () => false }
        ] as any);

      const fileContent1 = `---
id: 1
type: issue
title: "Test Issue"
status: Open
priority: HIGH
---

# Test Issue`;

      const fileContent2 = `---
id: 2
type: knowledge
title: "Test Knowledge"
status: Open
priority: MEDIUM
---

# Test Knowledge`;

      vi.mocked(fs.stat).mockResolvedValue({ size: 500 } as any);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(fileContent1)
        .mockResolvedValueOnce(fileContent2);

      mockPrisma.item.findUnique.mockResolvedValue(null);
      mockPrisma.status.findUnique.mockResolvedValue({ id: 1, name: 'Open' });
      mockPrisma.item.create.mockResolvedValue({ id: 1 });

      // Act
      const result = await importManager.importDirectory(dirPath);

      // Assert
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should filter by type when specified', async () => {
      // Arrange
      const dirPath = '/test/docs/export';
      const options = { type: 'issue' };

      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'issue', isDirectory: () => true },
        { name: 'knowledge', isDirectory: () => true }
      ] as any);

      // Act
      const result = await importManager.importDirectory(dirPath, options);

      // Assert
      expect(vi.mocked(fs.readdir)).toHaveBeenCalledTimes(2); // Once for root, once for issue dir
    });
  });

  describe('importAll', () => {
    it('should import all items and system state', async () => {
      // Arrange
      const basePath = '/test/docs/export';
      
      // Mock directory structure
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'issue', isDirectory: () => true },
        { name: '.system', isDirectory: () => true }
      ] as any);

      vi.mocked(fs.access).mockResolvedValue(undefined);

      const systemStateContent = `---
id: 1
version: "v0.8.0"
---

# System State

Current state content`;

      vi.mocked(fs.stat).mockResolvedValue({ size: 500 } as any);
      vi.mocked(fs.readFile).mockResolvedValue(systemStateContent);
      mockPrisma.systemState.create.mockResolvedValue({ id: 1 });

      // Act
      const result = await importManager.importAll(basePath);

      // Assert
      expect(result.stateImported).toBe(true);
    });
  });

  describe('Mode Strategies', () => {
    it('should overwrite existing items in reset mode', async () => {
      // Arrange
      const filePath = '/test/item.md';
      const options = { mode: 'reset' as const };
      const fileContent = `---
id: 1
type: issue
title: "Updated Issue"
status: Open
priority: HIGH
---

# Updated Issue`;

      vi.mocked(fs.stat).mockResolvedValue({ size: 500 } as any);
      vi.mocked(fs.readFile).mockResolvedValue(fileContent);
      mockPrisma.item.findUnique.mockResolvedValue({ id: 1, title: 'Old Issue' });
      mockPrisma.status.findUnique.mockResolvedValue({ id: 1, name: 'Open' });
      mockPrisma.item.update.mockResolvedValue({ id: 1, title: 'Updated Issue' });

      // Act
      const result = await importManager.importFile(filePath, options);

      // Assert
      expect(result.success).toBe(true);
      expect(mockPrisma.item.update).toHaveBeenCalled();
    });

    it('should skip existing items in sync mode', async () => {
      // Arrange
      const filePath = '/test/item.md';
      const options = { mode: 'sync' as const };
      const fileContent = `---
id: 1
type: issue
title: "Test Issue"
status: Open
priority: HIGH
---

# Test Issue`;

      vi.mocked(fs.stat).mockResolvedValue({ size: 500 } as any);
      vi.mocked(fs.readFile).mockResolvedValue(fileContent);
      mockPrisma.item.findUnique.mockResolvedValue({ id: 1 });

      // Act
      const result = await importManager.importFile(filePath, options);

      // Assert
      expect(result.skipped).toBe(true);
      expect(mockPrisma.item.create).not.toHaveBeenCalled();
      expect(mockPrisma.item.update).not.toHaveBeenCalled();
    });
  });

  describe('Security', () => {
    it('should validate file paths to prevent traversal', async () => {
      // Arrange
      const maliciousPaths = [
        '../../etc/passwd',
        '/etc/passwd',
        '../.env',
        '~/secrets'
      ];

      // Act & Assert
      for (const path of maliciousPaths) {
        await expect(importManager.importFile(path)).rejects.toThrow();
      }
    });

    it('should validate front matter to prevent injection', async () => {
      // Arrange
      const filePath = '/test/malicious.md';
      const maliciousContent = `---
id: 1
type: "'; DROP TABLE items; --"
title: "Test"
status: Open
priority: HIGH
---

# Test`;

      vi.mocked(fs.stat).mockResolvedValue({ size: 300 } as any);
      vi.mocked(fs.readFile).mockResolvedValue(maliciousContent);

      // Act & Assert
      await expect(importManager.importFile(filePath)).rejects.toThrow('Invalid type format');
    });
  });

  describe('Transaction Support', () => {
    it('should use transaction for batch imports', async () => {
      // Arrange
      const dirPath = '/test/docs/export';
      const options = { useTransaction: true };

      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'issue', isDirectory: () => true }
      ] as any);

      // Act
      await importManager.importDirectory(dirPath, options);

      // Assert
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should rollback on transaction failure', async () => {
      // Arrange
      const dirPath = '/test/docs/export';
      const options = { useTransaction: true };

      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      // Act & Assert
      await expect(importManager.importDirectory(dirPath, options))
        .rejects.toThrow('Transaction failed');
    });
  });
});