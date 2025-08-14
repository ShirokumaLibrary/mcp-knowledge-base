import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CRUDHandlers } from '../../../src/mcp/handlers/crud-handlers.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { prisma } from '../../../src/mcp/database/client.js';

vi.mock('../../../src/mcp/database/client.js', () => ({
  prisma: {
    item: {
      findUnique: vi.fn()
    }
  }
}));

describe('Get Item - Embedding Exclusion', () => {
  let crudHandlers: CRUDHandlers;
  
  const mockItem = {
    id: 1,
    type: 'test_item',
    title: 'Test Item',
    description: 'Test Description',
    content: 'Test Content',
    priority: 'MEDIUM',
    statusId: 1,
    categoryId: null,
    version: '1.0.0',
    startDate: null,
    endDate: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    aiSummary: 'Test summary',
    embedding: Buffer.from(new Array(128).fill(0)),
    searchIndex: 'test index',
    status: { id: 1, name: 'Open', color: '#000000', isActive: true },
    tags: [],
    keywords: [],
    concepts: [],
    relatedTo: [],
    relatedFrom: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    crudHandlers = new CRUDHandlers(prisma);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('embedding exclusion', () => {
    it('should always exclude embedding from response', async () => {
      vi.mocked(prisma.item.findUnique).mockResolvedValue(mockItem);

      const response = await crudHandlers.getItem({ id: 1 });
      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Item');
      expect(result.embedding).toBeUndefined();
    });

    it('should exclude embedding even with large buffer', async () => {
      // Create a buffer with signed byte values (-128 to 127)
      const values = new Array(128).fill(0).map((_, i) => {
        // Map 0-127 to -64 to 63
        return i - 64;
      });
      // Buffer.from with signed values needs proper handling
      const largeEmbedding = Buffer.from(values.map(v => v < 0 ? 256 + v : v));
      const itemWithLargeEmbedding = { 
        ...mockItem, 
        embedding: largeEmbedding 
      };
      vi.mocked(prisma.item.findUnique).mockResolvedValue(itemWithLargeEmbedding);

      const response = await crudHandlers.getItem({ id: 1 });
      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.embedding).toBeUndefined();
    });

    it('should handle null embedding gracefully', async () => {
      const itemWithoutEmbedding = { 
        ...mockItem, 
        embedding: null 
      };
      vi.mocked(prisma.item.findUnique).mockResolvedValue(itemWithoutEmbedding);

      const response = await crudHandlers.getItem({ id: 1 });
      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.embedding).toBeUndefined();
    });

    it('should preserve all other fields when excluding embedding', async () => {
      vi.mocked(prisma.item.findUnique).mockResolvedValue(mockItem);

      const response = await crudHandlers.getItem({ id: 1 });
      const result = JSON.parse(response.content[0].text);
      
      expect(result.id).toBe(1);
      expect(result.type).toBe('test_item');
      expect(result.title).toBe('Test Item');
      expect(result.description).toBe('Test Description');
      expect(result.content).toBe('Test Content');
      expect(result.aiSummary).toBe('Test summary');
      expect(result.searchIndex).toBe('test index');
      expect(result.status).toBe('Open');
      expect(result.tags).toBeDefined();
    });

    it('should throw error for non-existent item', async () => {
      vi.mocked(prisma.item.findUnique).mockResolvedValue(null);

      await expect(crudHandlers.getItem({ 
        id: 999
      })).rejects.toThrow(McpError);
    });
  });

  describe('backward compatibility', () => {
    it('should ignore includeEmbedding parameter if provided (backward compatibility)', async () => {
      vi.mocked(prisma.item.findUnique).mockResolvedValue(mockItem);

      // Even if includeEmbedding is true, embedding should be excluded
      const response = await crudHandlers.getItem({ 
        id: 1,
        includeEmbedding: true 
      } as any);
      
      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.embedding).toBeUndefined();
    });

    it('should work with legacy parameter combinations', async () => {
      vi.mocked(prisma.item.findUnique).mockResolvedValue(mockItem);

      const response = await crudHandlers.getItem({ 
        id: 1,
        someOtherParam: 'value'
      } as any);

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.embedding).toBeUndefined();
    });
  });

  describe('performance', () => {
    it('should have consistent response size without embedding data', async () => {
      vi.mocked(prisma.item.findUnique).mockResolvedValue(mockItem);

      const response1 = await crudHandlers.getItem({ id: 1 });
      const response2 = await crudHandlers.getItem({ id: 1 });

      const size1 = response1.content[0].text.length;
      const size2 = response2.content[0].text.length;

      expect(size1).toBe(size2);
      // Response should be relatively small without embedding
      expect(size1).toBeLessThan(2000);
    });
  });
});