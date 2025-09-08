import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { AutoExportConfig } from '../../../src/types/export.types.js';
import fs from 'fs/promises';
import path from 'path';

// Mock all TypeORM entities and data source BEFORE importing ExportManager
vi.mock('../../../src/entities/Item.js', () => ({ Item: class Item {} }));
vi.mock('../../../src/entities/SystemState.js', () => ({ SystemState: class SystemState {} }));
vi.mock('../../../src/entities/Status.js', () => ({ Status: class Status {} }));
vi.mock('../../../src/entities/ItemTag.js', () => ({ ItemTag: class ItemTag {} }));
vi.mock('../../../src/entities/ItemKeyword.js', () => ({ ItemKeyword: class ItemKeyword {} }));
vi.mock('../../../src/entities/ItemConcept.js', () => ({ ItemConcept: class ItemConcept {} }));
vi.mock('../../../src/entities/ItemRelation.js', () => ({ ItemRelation: class ItemRelation {} }));

// Mock fs/promises
vi.mock('fs/promises');

// Create mock repositories for different entities
const mockStatusRepository = {
  findOne: vi.fn().mockResolvedValue({ name: 'Open' })
};

const mockItemTagRepository = {
  find: vi.fn().mockResolvedValue([])
};

const mockItemKeywordRepository = {
  find: vi.fn().mockResolvedValue([])
};

const mockItemConceptRepository = {
  find: vi.fn().mockResolvedValue([])
};

const mockItemRelationRepository = {
  find: vi.fn().mockResolvedValue([])
};

// Default mock repository for other entities
const mockRepository = {
  findOne: vi.fn().mockResolvedValue(null),
  find: vi.fn().mockResolvedValue([]),
  createQueryBuilder: vi.fn(() => ({
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    getMany: vi.fn().mockResolvedValue([])
  }))
};

// Store references to mock repositories globally for access in tests
(global as any).mockRepositories = {
  Status: mockStatusRepository,
  ItemTag: mockItemTagRepository,
  ItemKeyword: mockItemKeywordRepository,
  ItemConcept: mockItemConceptRepository,
  ItemRelation: mockItemRelationRepository,
  default: mockRepository
};

vi.mock('../../../src/data-source.js', () => ({
  AppDataSource: {
    getRepository: vi.fn(() => {
      // Always return a mock repository that has find/findOne methods returning proper values
      return {
        findOne: vi.fn().mockResolvedValue({ name: 'Open' }),
        find: vi.fn().mockResolvedValue([]),
        createQueryBuilder: vi.fn(() => ({
          leftJoinAndSelect: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getMany: vi.fn().mockResolvedValue([])
        }))
      };
    }),
    isInitialized: true
  }
}));

// Now import ExportManager after all mocks are set up
import { ExportManager } from '../../../src/services/export-manager.js';

describe('ExportManager - Auto Export', () => {
  let exportManager: ExportManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    exportManager = new ExportManager();
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('AutoExportConfig', () => {
    it('should parse environment variable correctly', () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';
      
      const config = exportManager.getAutoExportConfig();
      
      expect(config).toEqual({
        enabled: true,
        baseDir: '/test/export',
        timeout: 2000
      });
    });

    it('should disable auto-export when environment variable is not set', () => {
      delete process.env.SHIROKUMA_EXPORT_DIR;
      
      const config = exportManager.getAutoExportConfig();
      
      expect(config).toEqual({
        enabled: false,
        baseDir: '',
        timeout: 2000
      });
    });

    it('should parse custom timeout from environment', () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';
      process.env.SHIROKUMA_EXPORT_TIMEOUT = '5000';
      
      const config = exportManager.getAutoExportConfig();
      
      expect(config.timeout).toBe(5000);
    });

    it('should use default timeout for invalid timeout value', () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';
      process.env.SHIROKUMA_EXPORT_TIMEOUT = 'invalid';
      
      const config = exportManager.getAutoExportConfig();
      
      expect(config.timeout).toBe(2000);
    });
  });

  describe('autoExportItem', () => {
    const mockItem = {
      id: 1,
      type: 'issue',
      title: 'Test Issue',
      content: 'Test content',
      statusId: 1,
      priority: 'HIGH',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    };

    it('should export item when auto-export is enabled', async () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue([]);
      
      await exportManager.autoExportItem(mockItem as any);
      
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join('/test/export', 'issue'),
        { recursive: true }
      );
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should not export when auto-export is disabled', async () => {
      delete process.env.SHIROKUMA_EXPORT_DIR;
      
      await exportManager.autoExportItem(mockItem as any);
      
      expect(fs.mkdir).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle export errors without throwing', async () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'));
      
      // Should not throw
      await expect(exportManager.autoExportItem(mockItem as any))
        .resolves.toBeUndefined();
    });

    it('should respect timeout setting', async () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';
      process.env.SHIROKUMA_EXPORT_TIMEOUT = '100'; // Very short timeout
      
      // Mock a slow export operation
      vi.mocked(fs.writeFile).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 200))
      );
      
      const startTime = Date.now();
      await exportManager.autoExportItem(mockItem as any);
      const duration = Date.now() - startTime;
      
      // Should timeout before the 200ms write completes
      expect(duration).toBeLessThan(150);
    });
  });

  describe('autoExportCurrentState', () => {
    const mockState = {
      id: 1,
      content: 'Current system state',
      version: '1.0.0',
      tags: '["session", "test"]',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    };

    it('should export current state when auto-export is enabled', async () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);
      
      await exportManager.autoExportCurrentState(mockState as any);
      
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join('/test/export', '.system', 'current_state'),
        { recursive: true }
      );
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should not export when auto-export is disabled', async () => {
      delete process.env.SHIROKUMA_EXPORT_DIR;
      
      await exportManager.autoExportCurrentState(mockState as any);
      
      expect(fs.mkdir).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should use fixed path for current state', async () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);
      
      await exportManager.autoExportCurrentState(mockState as any);
      
      const expectedPath = path.join('/test/export', '.system', 'current_state', '1.md');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expectedPath,
        expect.any(String),
        'utf-8'
      );
    });

    it('should handle export errors without throwing', async () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Disk full'));
      
      // Should not throw
      await expect(exportManager.autoExportCurrentState(mockState as any))
        .resolves.toBeUndefined();
    });
  });

  describe('Path Building', () => {
    it('should sanitize item filenames correctly', () => {
      const testCases = [
        { input: 'Normal Title', expected: 'Normal_Title' },
        { input: 'Title/With\\Slashes', expected: 'Title_With_Slashes' },
        { input: 'Title:With<>Special|Chars?', expected: 'Title_With_Special_Chars' }, // Trailing underscore removed
        { input: 'Title   With   Spaces', expected: 'Title_With_Spaces' },
        { input: 'a'.repeat(150), expected: 'a'.repeat(100) }, // Length limit
        { input: '...Dots...', expected: 'Dots' },
        { input: '', expected: 'untitled' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = exportManager['sanitizeFilename'](input);
        expect(result).toBe(expected);
      });
    });

    it('should build correct item export path', () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/export/dir';
      
      const itemPath = exportManager.buildItemPath({
        id: 123,
        type: 'issue',
        title: 'Test Issue'
      } as any);
      
      expect(itemPath).toBe('/export/dir/issue/123-Test_Issue.md');
    });

    it('should build correct current state export path', () => {
      process.env.SHIROKUMA_EXPORT_DIR = '/export/dir';
      
      const statePath = exportManager.buildCurrentStatePath();
      
      expect(statePath).toBe('/export/dir/.system/current_state');
    });
  });
});