import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExportManager } from '../../../src/services/export-manager.js';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
vi.mock('fs/promises');

describe('ExportManager - Current State Export', () => {
  let exportManager: ExportManager;
  let prisma: any;
  const mockFs = fs as any;
  
  beforeEach(() => {
    // Create a mock Prisma client
    prisma = {
      systemState: {
        findMany: vi.fn(),
        findFirst: vi.fn()
      },
      item: {
        findMany: vi.fn(),
        groupBy: vi.fn()
      },
      $disconnect: vi.fn()
    };
    exportManager = new ExportManager(prisma);
    
    // Setup fs mocks
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.unlink.mockResolvedValue(undefined);
    
    // Setup environment
    process.env.SHIROKUMA_EXPORT_DIR = '/test/export';
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.SHIROKUMA_EXPORT_DIR;
  });
  
  describe('exportCurrentState', () => {
    it('should export the latest system state to system/current_state.md', async () => {
      // Arrange
      const mockSystemState = {
        id: 1,
        version: 'v0.8.0',
        content: '## Current State\nThis is the current state',
        summary: 'Test summary',
        metrics: JSON.stringify({
          totalItems: 100,
          totalRelations: 50,
          avgConnections: 2.5
        }),
        context: JSON.stringify({
          lastOperation: 'test',
          environment: 'development'
        }),
        checkpoint: null,
        relatedItems: '[1, 2, 3]',
        tags: '["state", "test"]',
        metadata: JSON.stringify({
          updatedBy: 'test-user'
        }),
        createdAt: new Date('2025-01-14T10:00:00Z'),
        updatedAt: new Date('2025-01-14T12:00:00Z')
      };
      
      // Mock Prisma findMany and findFirst
      vi.spyOn(prisma.systemState, 'findMany').mockResolvedValue([mockSystemState] as any);
      vi.spyOn(prisma.systemState, 'findFirst').mockResolvedValue(mockSystemState as any);
      
      // Act
      const result = await exportManager.exportCurrentState();
      
      // Assert
      expect(result).toEqual({
        exported: true,
        directory: '/test/export',
        file: '.system/current_state/1.md',
        count: 1
      });
      
      // Verify file system operations
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.join('/test/export', '.system', 'current_state'),
        { recursive: true }
      );
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join('/test/export', '.system', 'current_state', '1.md'),
        expect.stringContaining('# System State'),
        'utf-8'
      );
      
      // Verify content includes Front Matter
      const writtenContent = mockFs.writeFile.mock.calls[0][1];
      expect(writtenContent).toContain('version: v0.8.0');
      expect(writtenContent).toContain('metrics:');
      expect(writtenContent).toContain('totalItems: 100');
      expect(writtenContent).toContain('tags: ["state","test"]');
      expect(writtenContent).toContain('relatedItems: [1,2,3]');
    });
    
    it('should return false when no system state exists', async () => {
      // Arrange
      vi.spyOn(prisma.systemState, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.systemState, 'findFirst').mockResolvedValue(null);
      
      // Act
      const result = await exportManager.exportCurrentState();
      
      // Assert
      expect(result).toEqual({
        exported: false,
        directory: '/test/export',
        file: null,
        count: 0
      });
      
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
    
    it('should handle system state without optional fields', async () => {
      // Arrange
      const mockSystemState = {
        id: 1,
        version: 'v0.8.0',
        content: '## Minimal State',
        summary: null,
        metrics: null,
        context: null,
        checkpoint: null,
        relatedItems: '[]',
        tags: '[]',
        metadata: null,
        createdAt: new Date('2025-01-14T10:00:00Z'),
        updatedAt: new Date('2025-01-14T10:00:00Z')
      };
      
      vi.spyOn(prisma.systemState, 'findMany').mockResolvedValue([mockSystemState] as any);
      vi.spyOn(prisma.systemState, 'findFirst').mockResolvedValue(mockSystemState as any);
      
      // Act
      const result = await exportManager.exportCurrentState();
      
      // Assert
      expect(result.exported).toBe(true);
      
      const writtenContent = mockFs.writeFile.mock.calls[0][1];
      expect(writtenContent).toContain('version: v0.8.0');
      expect(writtenContent).toContain('## Minimal State');
      expect(writtenContent).not.toContain('summary:');
      expect(writtenContent).not.toContain('metrics:');
    });
  });
  
  describe('exportItems with includeState option', () => {
    it('should export current state when includeState is true', async () => {
      // Arrange
      const mockItem = {
        id: 1,
        type: 'test',
        title: 'Test Item',
        description: 'Test description',
        content: 'Test content',
        status: { name: 'Open' },
        priority: 'MEDIUM',
        tags: [],
        keywords: [],
        concepts: [],
        relationsFrom: [],
        relationsTo: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockSystemState = {
        id: 1,
        version: 'v0.8.0',
        content: '## State',
        summary: 'Summary',
        metrics: '{}',
        relatedItems: '[]',
        tags: '[]',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      vi.spyOn(prisma.item, 'findMany').mockResolvedValue([mockItem] as any);
      vi.spyOn(prisma.systemState, 'findMany').mockResolvedValue([mockSystemState] as any);
      vi.spyOn(prisma.systemState, 'findFirst').mockResolvedValue(mockSystemState as any);
      
      // Act
      const result = await exportManager.exportItems({ includeState: true });
      
      // Assert
      expect(result.exported).toBe(1);
      expect(result.stateExported).toBe(true);
      expect(result.files).toContain('test/1-Test_Item.md');
      
      // Verify both item and state were written (state writes twice: ID.md and latest.md)
      expect(mockFs.writeFile).toHaveBeenCalledTimes(3);
    });
    
    it('should work normally when includeState is false', async () => {
      // Arrange
      const mockItem = {
        id: 1,
        type: 'test',
        title: 'Test Item',
        description: 'Test description',
        content: 'Test content',
        status: { name: 'Open' },
        priority: 'MEDIUM',
        tags: [],
        keywords: [],
        concepts: [],
        relationsFrom: [],
        relationsTo: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      vi.spyOn(prisma.item, 'findMany').mockResolvedValue([mockItem] as any);
      vi.spyOn(prisma.systemState, 'findFirst').mockResolvedValue(null);
      
      // Act
      const result = await exportManager.exportItems({ includeState: false });
      
      // Assert
      expect(result.exported).toBe(1);
      expect(result.stateExported).toBeUndefined();
      
      // Verify only item was written
      expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
      expect(prisma.systemState.findFirst).not.toHaveBeenCalled();
    });
  });
});