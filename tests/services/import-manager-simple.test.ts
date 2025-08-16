import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs/promises';
import { ImportManager, ImportError } from '../../src/services/import-manager.js';

// Mock modules
vi.mock('fs/promises');

describe('ImportManager - Simple Tests', () => {
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

  it('should validate file paths to prevent traversal', async () => {
    const maliciousPaths = [
      '../../etc/passwd',
      '../.env',
      '~/secrets'
    ];

    for (const path of maliciousPaths) {
      await expect(importManager.importFile(path)).rejects.toThrow('Invalid file path');
    }
  });

  it('should reject files larger than 10MB', async () => {
    const filePath = '/test/large.md';
    
    vi.mocked(fs.stat).mockResolvedValue({
      size: 11 * 1024 * 1024 // 11MB
    } as any);

    await expect(importManager.importFile(filePath)).rejects.toThrow('File too large');
  });

  it('should import a valid markdown file', async () => {
    const filePath = '/test/docs/export/issue/1-test.md';
    const fileContent = `---
id: 1
type: issue
title: "Test Issue"
status: Open
priority: HIGH
---

# Test Issue

This is a test issue content.`;

    vi.mocked(fs.stat).mockResolvedValue({ size: 1000 } as any);
    vi.mocked(fs.readFile).mockResolvedValue(fileContent);
    mockPrisma.item.findUnique.mockResolvedValue(null);
    mockPrisma.status.findUnique.mockResolvedValue({ id: 1, name: 'Open' });
    mockPrisma.item.create.mockResolvedValue({ id: 1, title: 'Test Issue' });

    const result = await importManager.importFile(filePath);

    expect(result.success).toBe(true);
    expect(result.itemId).toBe(1);
  });
});