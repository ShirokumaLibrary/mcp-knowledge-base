/**
 * @ai-context Unit tests for ItemRepository type change functionality
 * @ai-pattern Test type migration within same base type
 */

// @ts-nocheck
import { ItemRepository } from '../item-repository.js';

// Mock logger
jest.mock('../../utils/logger.js', () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('ItemRepository - Type Change', () => {
  let repository: ItemRepository;
  let mockDb: any;
  let mockStatusRepo: any;
  let mockTagRepo: any;

  beforeEach(() => {
    // Mock database
    mockDb = {
      getAsync: jest.fn(),
      allAsync: jest.fn(),
      runAsync: jest.fn(),
      getItemRepository: jest.fn()
    };

    // Mock repositories
    mockStatusRepo = {
      getStatusByName: jest.fn().mockResolvedValue({ id: 1, name: 'Open' })
    };
    
    mockTagRepo = {
      ensureTagsExist: jest.fn().mockResolvedValue([])
    };

    // Create repository instance with mocks
    repository = new ItemRepository(mockDb, '/test/data', mockStatusRepo, mockTagRepo);
    
    // Mock the private getType method
    repository.getType = jest.fn().mockImplementation((type) => {
      const types = {
        'issues': { type: 'issues', baseType: 'tasks' },
        'bugs': { type: 'bugs', baseType: 'tasks' },
        'plans': { type: 'plans', baseType: 'tasks' },
        'docs': { type: 'docs', baseType: 'documents' },
        'knowledge': { type: 'knowledge', baseType: 'documents' },
        'sessions': { type: 'sessions', baseType: 'sessions' },
        'dailies': { type: 'dailies', baseType: 'dailies' }
      };
      return Promise.resolve(types[type] || null);
    });
  });

  describe('changeItemType', () => {
    it('should successfully change type within same base type', async () => {
      const originalItem = {
        id: '1',
        type: 'issues',
        title: 'Test Issue',
        content: 'Issue content',
        priority: 'high',
        status: 'Open',
        tags: ['test'],
        related: []
      };

      // Mock getById to return original item
      repository.getById = jest.fn().mockImplementation((type, id) => {
        if (type === 'issues' && id === '1') {
          return Promise.resolve(originalItem);
        }
        return Promise.resolve(null);
      });

      // Mock createItem to return new item
      repository.createItem = jest.fn().mockResolvedValue({
        id: '5',
        type: 'bugs',
        title: 'Test Issue',
        content: 'Issue content',
        priority: 'high',
        status: 'Open',
        tags: ['test'],
        related: []
      });

      // Mock delete
      repository.delete = jest.fn().mockResolvedValue(true);

      // Mock database query for related items
      mockDb.allAsync.mockResolvedValue([]);

      // Execute type change
      const result = await repository.changeItemType('issues', 1, 'bugs');

      expect(result.success).toBe(true);
      expect(result.newId).toBe(5);
      expect(result.error).toBeUndefined();

      // Verify createItem was called with correct params
      expect(repository.createItem).toHaveBeenCalledWith({
        type: 'bugs',
        title: 'Test Issue',
        content: 'Issue content',
        priority: 'high',
        status: 'Open',
        tags: ['test'],
        start_date: undefined,
        end_date: undefined,
        related_tasks: undefined,
        related_documents: undefined
      });

      // Verify delete was called
      expect(repository.delete).toHaveBeenCalledWith('issues', '1');
    });

    it('should update related items references', async () => {
      const originalItem = {
        id: '1',
        type: 'issues',
        title: 'Issue 1',
        content: 'Content 1',
        priority: 'high',
        status: 'Open',
        related: []
      };

      const relatedItem = {
        id: '2',
        type: 'issues',
        title: 'Issue 2',
        content: 'Content 2',
        related: ['issues-1']
      };

      repository.getById = jest.fn().mockImplementation((type, id) => {
        if (type === 'issues' && id === '1') return Promise.resolve(originalItem);
        if (type === 'issues' && id === '2') return Promise.resolve(relatedItem);
        return Promise.resolve(null);
      });

      repository.createItem = jest.fn().mockResolvedValue({
        id: '1',  // Change to match the expected reference
        type: 'bugs',
        ...originalItem
      });

      repository.update = jest.fn().mockResolvedValue(true);
      repository.delete = jest.fn().mockResolvedValue(true);

      // Mock finding related items
      mockDb.allAsync.mockResolvedValue([
        { type: 'issues', id: 2 }
      ]);

      const result = await repository.changeItemType('issues', 1, 'bugs');

      expect(result.success).toBe(true);
      expect(result.relatedUpdates).toBe(1);

      // Verify update was called to fix references
      expect(repository.update).toHaveBeenCalledWith('issues', '2', {
        type: 'issues',
        id: '2',
        related_tasks: ['bugs-1'],
        related_documents: []
      });
    });

    it('should fail when changing between different base types', async () => {
      const result = await repository.changeItemType('issues', 1, 'docs');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot change between different base types');
    });

    it('should fail for non-existent item', async () => {
      repository.getById = jest.fn().mockResolvedValue(null);

      const result = await repository.changeItemType('issues', 999, 'bugs');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found');
    });

    it('should fail for invalid types', async () => {
      const result = await repository.changeItemType('invalid_type', 1, 'bugs');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid type specified');
    });

    it('should fail for sessions and dailies', async () => {
      // Try to change from sessions (will fail due to different base types)
      const result1 = await repository.changeItemType('sessions', 1, 'issues');
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Cannot change between different base types');

      // Try to change to dailies (will fail due to different base types)
      const result2 = await repository.changeItemType('issues', 1, 'dailies');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Cannot change between different base types');
      
      // Try to change from sessions to sessions (should fail with special error)
      const result3 = await repository.changeItemType('sessions', 1, 'sessions');
      expect(result3.success).toBe(false);
      expect(result3.error).toBe('Sessions and dailies cannot be type-changed');
    });

    it('should handle errors gracefully', async () => {
      repository.getById = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await repository.changeItemType('issues', 1, 'bugs');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});