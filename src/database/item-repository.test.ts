import { ItemRepository } from './item-repository.js';
import type { Database } from './base.js';
import type { StatusRepository } from './status-repository.js';
import type { TagRepository } from './tag-repository.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock the entire fs/promises module
jest.mock('fs/promises');

describe('ItemRepository - changeItemType', () => {
  let repository: ItemRepository;
  let mockDb: any;
  let mockStatusRepo: any;
  let mockTagRepo: any;
  const testDataDir = '/test/data';

  beforeEach(() => {
    // Create mock database
    mockDb = {
      runAsync: jest.fn().mockResolvedValue({ lastID: 1, changes: 1 }),
      getAsync: jest.fn(),
      allAsync: jest.fn().mockResolvedValue([]),
      prepareAsync: jest.fn().mockResolvedValue({
        runAsync: jest.fn().mockResolvedValue({ lastID: 1, changes: 1 }),
        finalizeAsync: jest.fn()
      })
    };

    // Create mock status repository
    mockStatusRepo = {
      getStatusByName: jest.fn().mockResolvedValue({ id: 1, name: 'Open', is_closed: false })
    };

    // Create mock tag repository
    mockTagRepo = {
      registerTags: jest.fn(),
      ensureTagsExist: jest.fn()
    };

    // Mock fs methods
    (fs.readFile as jest.Mock).mockResolvedValue('');
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (fs.readdir as jest.Mock).mockResolvedValue([]);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));

    repository = new ItemRepository(
      mockDb as unknown as Database,
      testDataDir,
      mockStatusRepo as unknown as StatusRepository,
      mockTagRepo as unknown as TagRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('changeItemType', () => {
    const mockItem = {
      id: '1',
      type: 'issues',
      title: 'Test Issue',
      description: 'Test description',
      content: 'Test content',
      priority: 'high',
      status: 'Open',
      status_id: 1,
      tags: ['test'],
      related: [],
      related_tasks: [],
      related_documents: [],
      start_date: null,
      end_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('should successfully change item type without references', async () => {
      // Mock type definitions
      const getBaseType = jest.spyOn(repository as any, 'getBaseType');
      getBaseType.mockResolvedValueOnce({ type: 'issues', baseType: 'tasks' });
      getBaseType.mockResolvedValueOnce({ type: 'bugs', baseType: 'tasks' });

      // Mock getById to return the item
      jest.spyOn(repository, 'getById').mockResolvedValue(mockItem);

      // Mock createItem to return new item
      jest.spyOn(repository, 'createItem').mockResolvedValue({
        ...mockItem,
        id: '2',
        type: 'bugs'
      });

      // Mock delete
      jest.spyOn(repository, 'delete').mockResolvedValue(true);

      // Mock database query for related items
      mockDb.allAsync.mockResolvedValue([]);

      const result = await repository.changeItemType('issues', 1, 'bugs');

      expect(result).toEqual({
        success: true,
        newId: 2,
        relatedUpdates: 0
      });

      expect(repository.getById).toHaveBeenCalledWith('issues', '1');
      expect(repository.createItem).toHaveBeenCalledWith({
        type: 'bugs',
        title: 'Test Issue',
        description: 'Test description',
        content: 'Test content',
        priority: 'high',
        status: 'Open',
        tags: ['test'],
        start_date: undefined,
        end_date: undefined,
        related_tasks: [],
        related_documents: []
      });
      expect(repository.delete).toHaveBeenCalledWith('issues', '1');
    });

    it('should update references when changing type', async () => {
      // Mock type definitions
      const getBaseType = jest.spyOn(repository as any, 'getBaseType');
      getBaseType.mockResolvedValueOnce({ type: 'issues', baseType: 'tasks' });
      getBaseType.mockResolvedValueOnce({ type: 'bugs', baseType: 'tasks' });

      // Mock getById
      const getByIdSpy = jest.spyOn(repository, 'getById');
      getByIdSpy.mockResolvedValueOnce(mockItem); // Original item
      getByIdSpy.mockResolvedValueOnce({  // Referencing plan
        id: '10',
        type: 'plans',
        title: 'Test Plan',
        related: ['issues-1', 'docs-5'],
        related_tasks: ['issues-1'],
        related_documents: ['docs-5']
      } as any);

      // Mock createItem
      jest.spyOn(repository, 'createItem').mockResolvedValue({
        ...mockItem,
        id: '3',
        type: 'bugs'
      });

      // Mock update
      jest.spyOn(repository, 'update').mockResolvedValue({} as any);

      // Mock delete
      jest.spyOn(repository, 'delete').mockResolvedValue(true);

      // Mock database query for related items
      mockDb.allAsync.mockResolvedValue([
        { type: 'plans', id: '10' }
      ]);

      const result = await repository.changeItemType('issues', 1, 'bugs');

      expect(result).toEqual({
        success: true,
        newId: 3,
        relatedUpdates: 1
      });

      // Check that update was called with correct references
      expect(repository.update).toHaveBeenCalledWith('plans', '10', {
        type: 'plans',
        id: '10',
        related: ['bugs-3', 'docs-5']
      });
    });

    it('should reject change between different base types', async () => {
      // Mock type definitions
      const getBaseType = jest.spyOn(repository as any, 'getBaseType');
      getBaseType.mockResolvedValueOnce({ type: 'issues', baseType: 'tasks' });
      getBaseType.mockResolvedValueOnce({ type: 'docs', baseType: 'documents' });

      const result = await repository.changeItemType('issues', 1, 'docs');

      expect(result).toEqual({
        success: false,
        error: 'Cannot change between different base types: tasks → documents'
      });

      expect(repository.getById).not.toHaveBeenCalled();
    });

    it('should reject change for special types', async () => {
      const result1 = await repository.changeItemType('sessions', 1, 'issues');
      expect(result1).toEqual({
        success: false,
        error: 'Sessions and dailies cannot be type-changed'
      });

      const result2 = await repository.changeItemType('issues', 1, 'dailies');
      expect(result2).toEqual({
        success: false,
        error: 'Sessions and dailies cannot be type-changed'
      });
    });

    it('should handle non-existent item', async () => {
      // Mock type definitions
      const getBaseType = jest.spyOn(repository as any, 'getBaseType');
      getBaseType.mockResolvedValueOnce({ type: 'issues', baseType: 'tasks' });
      getBaseType.mockResolvedValueOnce({ type: 'bugs', baseType: 'tasks' });

      // Mock getById to return null
      jest.spyOn(repository, 'getById').mockResolvedValue(null);

      const result = await repository.changeItemType('issues', 9999, 'bugs');

      expect(result).toEqual({
        success: false,
        error: 'Item not found'
      });
    });

    it('should handle unknown types', async () => {
      // Mock type definitions
      const getBaseType = jest.spyOn(repository as any, 'getBaseType');
      getBaseType.mockResolvedValueOnce(null);

      const result = await repository.changeItemType('unknown', 1, 'bugs');

      expect(result).toEqual({
        success: false,
        error: 'Unknown type: unknown'
      });
    });

    it('should handle errors gracefully', async () => {
      // Mock type definitions
      const getBaseType = jest.spyOn(repository as any, 'getBaseType');
      getBaseType.mockRejectedValue(new Error('Database error'));

      const result = await repository.changeItemType('issues', 1, 'bugs');

      expect(result).toEqual({
        success: false,
        error: 'Database error'
      });
    });

    it('should update multiple references correctly', async () => {
      // Mock type definitions
      const getBaseType = jest.spyOn(repository as any, 'getBaseType');
      getBaseType.mockResolvedValue({ type: 'issues', baseType: 'tasks' });

      // Mock getById
      const getByIdSpy = jest.spyOn(repository, 'getById');
      getByIdSpy.mockResolvedValueOnce(mockItem); // Original item
      
      // Mock referencing items
      getByIdSpy.mockResolvedValueOnce({
        id: '10',
        type: 'plans',
        related: ['issues-1', 'bugs-2'],
        related_tasks: ['issues-1', 'bugs-2']
      } as any);
      
      getByIdSpy.mockResolvedValueOnce({
        id: '20',
        type: 'docs',
        related: ['issues-1'],
        related_tasks: ['issues-1']
      } as any);

      // Mock createItem
      jest.spyOn(repository, 'createItem').mockResolvedValue({
        ...mockItem,
        id: '5',
        type: 'bugs'
      });

      // Mock update
      jest.spyOn(repository, 'update').mockResolvedValue({} as any);

      // Mock delete
      jest.spyOn(repository, 'delete').mockResolvedValue(true);

      // Mock database query for related items
      mockDb.allAsync.mockResolvedValue([
        { type: 'plans', id: '10' },
        { type: 'docs', id: '20' }
      ]);

      const result = await repository.changeItemType('issues', 1, 'bugs');

      expect(result).toEqual({
        success: true,
        newId: 5,
        relatedUpdates: 2
      });

      // Check updates
      expect(repository.update).toHaveBeenCalledTimes(2);
      expect(repository.update).toHaveBeenCalledWith('plans', '10', {
        type: 'plans',
        id: '10',
        related: ['bugs-5', 'bugs-2']
      });
      expect(repository.update).toHaveBeenCalledWith('docs', '20', {
        type: 'docs',
        id: '20',
        related: ['bugs-5']
      });
    });
  });
});