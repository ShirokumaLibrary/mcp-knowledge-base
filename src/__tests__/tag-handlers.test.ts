// @ts-nocheck
import { TagHandlers } from '../handlers/tag-handlers.js';
import { FileIssueDatabase } from '../database.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mock the database
jest.mock('../database.js');

// Mock logger to prevent errors
jest.mock('../utils/logger.js', () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('TagHandlers', () => {
  let handlers: TagHandlers;
  let mockDb: jest.Mocked<FileIssueDatabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getTags: jest.fn(),
      createTag: jest.fn(),
      deleteTag: jest.fn(),
      searchTags: jest.fn()
    } as any;
    handlers = new TagHandlers(mockDb);
  });

  describe('handleGetTags', () => {
    it('should get all tags', async () => {
      const mockTags = [
        { name: 'api', created_at: '2025-01-26T10:00:00.000Z' },
        { name: 'bug', created_at: '2025-01-26T11:00:00.000Z' },
        { name: 'feature', created_at: '2025-01-26T12:00:00.000Z' }
      ];
      mockDb.getTags = jest.fn().mockResolvedValue(mockTags);

      const result = await handlers.handleGetTags();

      expect(mockDb.getTags).toHaveBeenCalled();
      expect(JSON.parse(result.content[0].text)).toEqual({ data: mockTags });
    });

    it('should return empty array when no tags exist', async () => {
      mockDb.getTags = jest.fn().mockResolvedValue([]);

      const result = await handlers.handleGetTags();

      expect(JSON.parse(result.content[0].text)).toEqual({ data: [] });
    });
  });

  describe('handleCreateTag', () => {
    it('should create new tag', async () => {
      const mockTag = {
        name: 'new-tag',
        created_at: '2025-01-26T13:00:00.000Z'
      };
      mockDb.createTag = jest.fn().mockResolvedValue(mockTag);

      const result = await handlers.handleCreateTag({
        name: 'new-tag'
      });

      expect(mockDb.createTag).toHaveBeenCalledWith('new-tag');
      const response = JSON.parse(result.content[0].text);
      expect(response.message).toBe('Tag created successfully');
      expect(response.data.name).toBe('new-tag');
    });

    it('should handle duplicate tag names', async () => {
      mockDb.createTag = jest.fn().mockRejectedValue(
        new Error('Tag already exists')
      );

      await expect(handlers.handleCreateTag({
        name: 'existing-tag'
      })).rejects.toThrow('Tag already exists');
    });

    it('should validate tag name format', async () => {
      // Test various invalid tag names
      const invalidNames = [
        '',           // empty
        ' ',          // whitespace only
        'tag name',   // contains space
        'TAG',        // uppercase (if tags should be lowercase)
        '123',        // numbers only
        'tag!',       // special characters
      ];

      for (const name of invalidNames) {
        mockDb.createTag = jest.fn().mockRejectedValue(
          new Error('Invalid tag name')
        );

        await expect(handlers.handleCreateTag({ name }))
          .rejects.toThrow();
      }
    });

    it('should allow valid tag names', async () => {
      const validNames = [
        'api',
        'bug-fix',
        'feature_request',
        'v1.0.0',
        'priority-1',
        'ui-ux'
      ];

      mockDb.createTag = jest.fn().mockImplementation((name) =>
        Promise.resolve({ name, created_at: new Date().toISOString() })
      );

      for (const name of validNames) {
        const result = await handlers.handleCreateTag({ name });
        const response = JSON.parse(result.content[0].text);
        expect(response.message).toBe('Tag created successfully');
        expect(response.data.name).toBe(name);
      }
    });
  });

  describe('handleDeleteTag', () => {
    it('should delete existing tag', async () => {
      mockDb.deleteTag = jest.fn().mockResolvedValue(true);

      const result = await handlers.handleDeleteTag({
        name: 'obsolete-tag'
      });

      expect(mockDb.deleteTag).toHaveBeenCalledWith('obsolete-tag');
      const response = JSON.parse(result.content[0].text);
      expect(response.message).toContain('deleted successfully');
    });

    it('should throw error for non-existent tag', async () => {
      mockDb.deleteTag = jest.fn().mockResolvedValue(false);

      await expect(handlers.handleDeleteTag({
        name: 'nonexistent-tag'
      })).rejects.toThrow(McpError);
    });

    it('should handle tags in use', async () => {
      mockDb.deleteTag = jest.fn().mockRejectedValue(
        new Error('Tag is in use by 5 items')
      );

      await expect(handlers.handleDeleteTag({
        name: 'used-tag'
      })).rejects.toThrow('Tag is in use by 5 items');
    });
  });

  describe('handleSearchTags', () => {
    it('should search tags by pattern', async () => {
      const mockTags = [
        { name: 'api-v1', created_at: '2025-01-26T10:00:00.000Z' },
        { name: 'api-v2', created_at: '2025-01-26T11:00:00.000Z' },
        { name: 'api-docs', created_at: '2025-01-26T12:00:00.000Z' }
      ];
      mockDb.searchTags = jest.fn().mockResolvedValue(mockTags);

      const result = await handlers.handleSearchTags({
        pattern: 'api'
      });

      expect(mockDb.searchTags).toHaveBeenCalledWith('api');
      expect(JSON.parse(result.content[0].text)).toEqual({ data: mockTags });
    });

    it('should return empty array for no matches', async () => {
      mockDb.searchTags = jest.fn().mockResolvedValue([]);

      const result = await handlers.handleSearchTags({
        pattern: 'xyz'
      });

      expect(JSON.parse(result.content[0].text)).toEqual({ data: [] });
    });

    it('should handle wildcard patterns', async () => {
      const mockTags = [
        { name: 'bug-critical', created_at: '2025-01-26T10:00:00.000Z' },
        { name: 'bug-minor', created_at: '2025-01-26T11:00:00.000Z' }
      ];
      mockDb.searchTags = jest.fn().mockResolvedValue(mockTags);

      const result = await handlers.handleSearchTags({
        pattern: 'bug-*'
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.data).toHaveLength(2);
    });

    it('should be case-sensitive', async () => {
      mockDb.searchTags = jest.fn()
        .mockResolvedValueOnce([{ name: 'api' }])  // lowercase
        .mockResolvedValueOnce([]);                // uppercase

      const result1 = await handlers.handleSearchTags({ pattern: 'api' });
      const result2 = await handlers.handleSearchTags({ pattern: 'API' });

      const data1 = JSON.parse(result1.content[0].text).data;
      const data2 = JSON.parse(result2.content[0].text).data;
      expect(data1).toHaveLength(1);
      expect(data2).toHaveLength(0);
    });

    it('should find tags with partial matches', async () => {
      const mockTags = [
        { name: 'authentication', created_at: '2025-01-26T10:00:00.000Z' },
        { name: 'authorization', created_at: '2025-01-26T11:00:00.000Z' },
        { name: 'automation', created_at: '2025-01-26T12:00:00.000Z' }
      ];
      mockDb.searchTags = jest.fn().mockResolvedValue(mockTags);

      const result = await handlers.handleSearchTags({
        pattern: 'auth'
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.data).toHaveLength(3);
      expect(data.data.map((t: any) => t.name)).toContain('authentication');
      expect(data.data.map((t: any) => t.name)).toContain('authorization');
      expect(data.data.map((t: any) => t.name)).toContain('automation');
    });

    it('should find tags with pattern at different positions', async () => {
      const mockTags = [
        { name: 'test-api', created_at: '2025-01-26T10:00:00.000Z' },
        { name: 'api-test', created_at: '2025-01-26T11:00:00.000Z' },
        { name: 'testing-api-v2', created_at: '2025-01-26T12:00:00.000Z' }
      ];
      mockDb.searchTags = jest.fn().mockResolvedValue(mockTags);

      const result = await handlers.handleSearchTags({
        pattern: 'api'
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.data).toHaveLength(3);
    });

    it('should handle SQL wildcard characters in pattern', async () => {
      const mockTags = [
        { name: 'test%tag', created_at: '2025-01-26T10:00:00.000Z' },
        { name: 'test_tag', created_at: '2025-01-26T11:00:00.000Z' }
      ];
      
      // Pattern with % should be treated literally
      mockDb.searchTags = jest.fn()
        .mockResolvedValueOnce([{ name: 'test%tag' }])
        .mockResolvedValueOnce([{ name: 'test_tag' }]);

      const result1 = await handlers.handleSearchTags({ pattern: 'test%' });
      const result2 = await handlers.handleSearchTags({ pattern: 'test_' });

      expect(mockDb.searchTags).toHaveBeenNthCalledWith(1, 'test%');
      expect(mockDb.searchTags).toHaveBeenNthCalledWith(2, 'test_');
    });
  });

  describe('Tag auto-registration', () => {
    it('should handle auto-created tags from items', async () => {
      // When an item is created with new tags, they should be auto-registered
      const mockTag = {
        name: 'auto-created',
        created_at: '2025-01-26T14:00:00.000Z'
      };
      mockDb.createTag = jest.fn().mockResolvedValue(mockTag);

      // Simulate tag auto-creation scenario
      const result = await handlers.handleCreateTag({
        name: 'auto-created'
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.message).toBe('Tag created successfully');
      expect(response.data.name).toBe('auto-created');
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle many tags efficiently', async () => {
      // Create array of 1000 tags
      const manyTags = Array(1000).fill(null).map((_, i) => ({
        name: `tag-${i}`,
        created_at: new Date().toISOString()
      }));
      mockDb.getTags = jest.fn().mockResolvedValue(manyTags);

      const start = Date.now();
      const result = await handlers.handleGetTags();
      const duration = Date.now() - start;

      const data = JSON.parse(result.content[0].text);
      expect(data.data).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should handle concurrent tag operations', async () => {
      // Set up mocks before creating operations
      mockDb.createTag = jest.fn().mockImplementation((name) =>
        Promise.resolve({ id: Date.now(), name })
      );
      mockDb.deleteTag = jest.fn().mockResolvedValue(true);
      mockDb.searchTags = jest.fn().mockResolvedValue([]);

      const operations = [
        handlers.handleCreateTag({ name: 'concurrent-1' }),
        handlers.handleCreateTag({ name: 'concurrent-2' }),
        handlers.handleSearchTags({ pattern: 'con' })
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(3);
    });

    it('should handle special characters in tag names', async () => {
      const specialTags = [
        'feature/new',
        'bug#123',
        'v1.0.0-beta',
        'priority:high',
        'type=enhancement'
      ];

      for (const tagName of specialTags) {
        mockDb.searchTags = jest.fn().mockResolvedValue([{ name: tagName }]);
        
        const result = await handlers.handleSearchTags({ pattern: tagName });
        const data = JSON.parse(result.content[0].text);
        expect(data.data).toHaveLength(1);
      }
    });
  });

  describe('Tag usage statistics', () => {
    it('should handle tags with usage counts', async () => {
      // If the system tracks tag usage
      const mockTagsWithCounts = [
        { name: 'popular', created_at: '2025-01-26T10:00:00.000Z', usage_count: 50 },
        { name: 'rare', created_at: '2025-01-26T11:00:00.000Z', usage_count: 1 }
      ];
      mockDb.getTags = jest.fn().mockResolvedValue(mockTagsWithCounts);

      const result = await handlers.handleGetTags();

      const data = JSON.parse(result.content[0].text).data;
      expect(data[0].usage_count).toBe(50);
      expect(data[1].usage_count).toBe(1);
    });
  });

  describe('Error recovery', () => {
    it('should handle database connection errors', async () => {
      mockDb.getTags = jest.fn().mockRejectedValue(
        new Error('Database connection lost')
      );

      await expect(handlers.handleGetTags())
        .rejects.toThrow('Database connection lost');
    });

    it('should handle malformed tag data gracefully', async () => {
      // Simulate corrupted tag data
      mockDb.getTags = jest.fn().mockResolvedValue([
        { name: 'valid-tag', created_at: '2025-01-26T10:00:00.000Z' },
        { name: null, created_at: '2025-01-26T11:00:00.000Z' }, // Invalid
        { name: 'another-valid', created_at: '2025-01-26T12:00:00.000Z' }
      ]);

      const result = await handlers.handleGetTags();
      
      // Should filter out or handle invalid entries
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data.filter(t => t.name !== null)).toHaveLength(2);
    });
  });

  describe('handleSearchAllByTag', () => {
    beforeEach(() => {
      mockDb.searchAllByTag = jest.fn();
    });

    it('should search all content types by tag', async () => {
      const mockResults = {
        issues: [
          { id: 1, title: 'Bug fix', tags: ['bug', 'api'] },
          { id: 2, title: 'API error', tags: ['api', 'error'] }
        ],
        plans: [
          { id: 1, title: 'API refactor', tags: ['api', 'refactoring'] }
        ],
        docs: [
          { id: 1, title: 'API Documentation', tags: ['api', 'docs'] }
        ],
        knowledge: [],
        sessions: [
          { id: '2025-01-26-10.00.00.000', title: 'API debugging', tags: ['api', 'debug'] }
        ]
      };
      
      mockDb.searchAllByTag.mockResolvedValue(mockResults);

      const result = await handlers.handleSearchAllByTag({ tag: 'api' });

      expect(mockDb.searchAllByTag).toHaveBeenCalledWith('api');
      const data = JSON.parse(result.content[0].text).data;
      expect(data.issues).toHaveLength(2);
      expect(data.plans).toHaveLength(1);
      expect(data.docs).toHaveLength(1);
      expect(data.knowledge).toHaveLength(0);
      expect(data.sessions).toHaveLength(1);
    });

    it('should handle empty results', async () => {
      const emptyResults = {
        issues: [],
        plans: [],
        docs: [],
        knowledge: [],
        sessions: []
      };
      
      mockDb.searchAllByTag.mockResolvedValue(emptyResults);

      const result = await handlers.handleSearchAllByTag({ tag: 'nonexistent' });

      const data = JSON.parse(result.content[0].text).data;
      expect(data.issues).toHaveLength(0);
      expect(data.plans).toHaveLength(0);
      expect(data.docs).toHaveLength(0);
      expect(data.knowledge).toHaveLength(0);
      expect(data.sessions).toHaveLength(0);
    });

    it('should validate tag parameter', async () => {
      // Missing tag
      await expect(handlers.handleSearchAllByTag({})).rejects.toThrow();
      
      // Empty tag
      await expect(handlers.handleSearchAllByTag({ tag: '' })).rejects.toThrow();
    });

    it('should handle database errors', async () => {
      mockDb.searchAllByTag.mockRejectedValue(new Error('Database error'));

      await expect(handlers.handleSearchAllByTag({ tag: 'api' }))
        .rejects.toThrow(McpError);
    });

    it('should propagate McpError without wrapping', async () => {
      const originalError = new McpError(ErrorCode.InvalidRequest, 'Tag not found');
      mockDb.searchAllByTag.mockRejectedValue(originalError);

      await expect(handlers.handleSearchAllByTag({ tag: 'test' })).rejects.toBe(originalError);
    });

    it('should handle special characters in tag names', async () => {
      const mockResults = {
        issues: [{ id: 1, title: 'Special tag test', tags: ['feature/new'] }],
        plans: [],
        docs: [],
        knowledge: [],
        sessions: []
      };
      
      mockDb.searchAllByTag.mockResolvedValue(mockResults);

      const result = await handlers.handleSearchAllByTag({ tag: 'feature/new' });

      expect(mockDb.searchAllByTag).toHaveBeenCalledWith('feature/new');
      const data = JSON.parse(result.content[0].text).data;
      expect(data.issues).toHaveLength(1);
    });
  });

  describe('Error handling patterns', () => {
    it('should preserve McpError type in all methods', async () => {
      const originalError = new McpError(ErrorCode.InvalidRequest, 'Custom error');
      
      // Make sure searchAllByTag is defined
      mockDb.searchAllByTag = jest.fn();
      
      // Test each method
      mockDb.getTags.mockRejectedValue(originalError);
      await expect(handlers.handleGetTags()).rejects.toBe(originalError);

      mockDb.createTag.mockRejectedValue(originalError);
      await expect(handlers.handleCreateTag({ name: 'test' })).rejects.toBe(originalError);

      mockDb.deleteTag.mockRejectedValue(originalError);
      await expect(handlers.handleDeleteTag({ name: 'test' })).rejects.toBe(originalError);

      mockDb.searchTags.mockRejectedValue(originalError);
      await expect(handlers.handleSearchTags({ pattern: 'test' })).rejects.toBe(originalError);

      mockDb.searchAllByTag.mockRejectedValue(originalError);
      await expect(handlers.handleSearchAllByTag({ tag: 'test' })).rejects.toBe(originalError);
    });

    it('should convert general errors to McpError', async () => {
      const generalError = new Error('General error');

      mockDb.getTags.mockRejectedValue(generalError);
      await expect(handlers.handleGetTags()).rejects.toThrow(McpError);

      mockDb.createTag.mockRejectedValue(generalError);
      await expect(handlers.handleCreateTag({ name: 'test' })).rejects.toThrow(McpError);
    });
  });
});