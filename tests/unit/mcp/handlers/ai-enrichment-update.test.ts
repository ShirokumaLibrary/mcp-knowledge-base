/**
 * Unit tests for AI enrichment regeneration in update_item API
 * TDD Red Phase - These tests should fail initially, proving the bug exists
 * 
 * Test Strategy:
 * 1. Content changes trigger AI enrichment regeneration
 * 2. Non-content changes do NOT trigger AI enrichment
 * 3. AI enrichment updates all metadata (keywords, concepts, embedding, summary)
 * 4. Performance: AI enrichment only runs when content actually changes
 * 5. Edge cases and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CRUDHandlers } from '../../../../src/mcp/handlers/crud-handlers.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mock Prisma Client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    item: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    itemTag: {
      deleteMany: vi.fn(),
    },
    itemKeyword: {
      deleteMany: vi.fn(),
    },
    itemConcept: {
      deleteMany: vi.fn(),
    },
    keyword: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    concept: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    status: {
      findUnique: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  })),
}));

// Mock database-init functions
vi.mock('../../../../src/mcp/database/database-init.js', () => ({
  getStatusId: vi.fn(() => 1),
  ensureTags: vi.fn(() => []),
}));

// Mock Claude Interface
vi.mock('../../../../src/services/ai/claude-interface.js', async () => {
  const mock = await import('../../../mocks/claude-interface.mock.js');
  return {
    ClaudeInterface: mock.MockClaudeInterface
  };
});

// Mock Enhanced AI Service
const mockExtractWeightedKeywords = vi.fn();
const mockStoreKeywordsForItem = vi.fn();
const mockStoreConceptsForItem = vi.fn();

vi.mock('../../../../src/services/enhanced-ai.service.js', () => ({
  EnhancedAIService: vi.fn(() => ({
    extractWeightedKeywords: mockExtractWeightedKeywords,
    storeKeywordsForItem: mockStoreKeywordsForItem,
    storeConceptsForItem: mockStoreConceptsForItem,
  })),
}));

describe('AI Enrichment Regeneration on update_item', () => {
  let prisma: any;
  let crudHandlers: CRUDHandlers;
  
  const existingItem = {
    id: 1,
    type: 'knowledge',
    title: 'Original Title',
    description: 'Original Description',
    content: 'Original content about testing',
    aiSummary: 'Original AI summary',
    statusId: 1,
    priority: 'MEDIUM',
    category: 'testing',
    searchIndex: 'original keywords testing',
    embedding: Buffer.from([1, 2, 3, 4]), // Mock embedding
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const updatedItem = {
    ...existingItem,
    content: 'Updated content about AI enrichment',
    updatedAt: new Date('2025-01-13'),
  };

  const enrichedMetadata = {
    keywords: [
      { keyword: 'updated', weight: 0.9 },
      { keyword: 'ai', weight: 0.8 },
      { keyword: 'enrichment', weight: 0.7 },
    ],
    concepts: ['artificial-intelligence', 'data-processing'],
    summary: 'Updated AI generated summary',
    embedding: Buffer.from([5, 6, 7, 8]), // New embedding
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    crudHandlers = new CRUDHandlers(prisma);
    
    // Setup default mock responses
    prisma.item.findUnique.mockResolvedValue(existingItem);
    prisma.item.update.mockResolvedValue({
      ...updatedItem,
      status: { id: 1, name: 'Open' },
      tags: [],
    });
    
    mockExtractWeightedKeywords.mockResolvedValue(enrichedMetadata);
    mockStoreKeywordsForItem.mockResolvedValue(undefined);
    mockStoreConceptsForItem.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('should regenerate AI enrichment when content is updated', () => {
    it('should regenerate keywords when content changes', async () => {
      // Act: Update item with new content
      await crudHandlers.updateItem({
        id: 1,
        content: 'Completely new content about machine learning algorithms',
      });

      // Assert: AI service should be called to extract new keywords
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
      expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
        title: existingItem.title,
        description: existingItem.description,
        content: 'Completely new content about machine learning algorithms',
      });

      // Assert: Keywords should be stored
      expect(mockStoreKeywordsForItem).toHaveBeenCalledTimes(1);
      expect(mockStoreKeywordsForItem).toHaveBeenCalledWith(
        1,
        enrichedMetadata.keywords
      );
    });

    it('should regenerate concepts when content changes', async () => {
      // Act: Update item with new content
      await crudHandlers.updateItem({
        id: 1,
        content: 'New content focusing on neural networks and deep learning',
      });

      // Assert: AI service should generate new concepts
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
      
      // Assert: Concepts should be stored
      expect(mockStoreConceptsForItem).toHaveBeenCalledTimes(1);
      expect(mockStoreConceptsForItem).toHaveBeenCalledWith(
        1,
        enrichedMetadata.concepts
      );
    });

    it('should regenerate embedding when content changes', async () => {
      // Act: Update item with new content
      await crudHandlers.updateItem({
        id: 1,
        content: 'Updated content requiring new semantic embedding',
      });

      // Assert: AI service should generate new embedding
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
      
      // Assert: Update should include new embedding
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            embedding: enrichedMetadata.embedding,
          }),
        })
      );
    });

    it('should regenerate AI summary when content changes', async () => {
      // Act: Update item with new content
      await crudHandlers.updateItem({
        id: 1,
        content: 'Fresh content that needs a new AI-generated summary',
      });

      // Assert: AI service should generate new summary
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
      
      // Assert: Update should include new AI summary
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            aiSummary: enrichedMetadata.summary,
          }),
        })
      );
    });

    it('should update searchIndex with new keywords when content changes', async () => {
      // Act: Update item with new content
      await crudHandlers.updateItem({
        id: 1,
        content: 'Content with specific keywords for search indexing',
      });

      // Assert: searchIndex should be updated with new keywords
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            searchIndex: 'updated ai enrichment', // Keywords joined as string
          }),
        })
      );
    });

    it('should handle content update along with other fields', async () => {
      // Act: Update content and other fields simultaneously
      await crudHandlers.updateItem({
        id: 1,
        title: 'New Title',
        content: 'New content with multiple field updates',
        priority: 'HIGH',
      });

      // Assert: AI enrichment should be triggered
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
      expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
        title: 'New Title', // Use updated title
        description: existingItem.description,
        content: 'New content with multiple field updates',
      });

      // Assert: All fields should be updated
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Title',
            content: 'New content with multiple field updates',
            priority: 'HIGH',
            aiSummary: enrichedMetadata.summary,
            embedding: enrichedMetadata.embedding,
          }),
        })
      );
    });
  });

  describe('should regenerate AI enrichment when title or description is updated', () => {
    it('should trigger AI enrichment when only title is updated', async () => {
      // Act: Update only title, not content
      await crudHandlers.updateItem({
        id: 1,
        title: 'Updated Title Only',
      });

      // Assert: AI service SHOULD be called for title changes
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
      expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
        title: 'Updated Title Only',
        description: existingItem.description,
        content: existingItem.content,
      });
      expect(mockStoreKeywordsForItem).toHaveBeenCalledTimes(1);
      expect(mockStoreConceptsForItem).toHaveBeenCalledTimes(1);
    });

    it('should trigger AI enrichment when only description is updated', async () => {
      // Act: Update only description
      await crudHandlers.updateItem({
        id: 1,
        description: 'Updated description without content change',
      });

      // Assert: AI service SHOULD be called for description changes
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
      expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
        title: existingItem.title,
        description: 'Updated description without content change',
        content: existingItem.content,
      });
    });
  });

  describe('should NOT regenerate AI enrichment when non-text fields are updated', () => {
    it('should not trigger AI enrichment when only status is updated', async () => {
      // Act: Update only status
      await crudHandlers.updateItem({
        id: 1,
        status: 'Closed',
      });

      // Assert: AI service should NOT be called
      expect(mockExtractWeightedKeywords).not.toHaveBeenCalled();
    });

    it('should not trigger AI enrichment when only priority is updated', async () => {
      // Act: Update only priority
      await crudHandlers.updateItem({
        id: 1,
        priority: 'CRITICAL',
      });

      // Assert: AI service should NOT be called
      expect(mockExtractWeightedKeywords).not.toHaveBeenCalled();
    });

    it('should not trigger AI enrichment when only tags are updated', async () => {
      // Act: Update only tags
      await crudHandlers.updateItem({
        id: 1,
        tags: ['new-tag', 'another-tag'],
      });

      // Assert: AI service should NOT be called
      expect(mockExtractWeightedKeywords).not.toHaveBeenCalled();
    });

    it('should not trigger AI enrichment when only dates are updated', async () => {
      // Act: Update only dates
      await crudHandlers.updateItem({
        id: 1,
        startDate: '2025-02-01',
        endDate: '2025-02-28',
      });

      // Assert: AI service should NOT be called
      expect(mockExtractWeightedKeywords).not.toHaveBeenCalled();
    });
  });

  describe('performance: AI enrichment optimization', () => {
    it('should only call AI service once even with multiple content fields', async () => {
      // Act: Update multiple content-related fields
      await crudHandlers.updateItem({
        id: 1,
        title: 'New Title',
        description: 'New Description',
        content: 'New Content',
      });

      // Assert: AI service should be called exactly once
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
    });

    it('should not regenerate if content is set to the same value', async () => {
      // Act: Update content with the same value
      await crudHandlers.updateItem({
        id: 1,
        content: existingItem.content, // Same as existing
      });

      // Assert: AI service should NOT be called (optimization)
      expect(mockExtractWeightedKeywords).not.toHaveBeenCalled();
    });

    it('should handle content trimming and detect actual changes', async () => {
      // Act: Update content with only whitespace differences
      await crudHandlers.updateItem({
        id: 1,
        content: '  Original content about testing  ', // Whitespace added
      });

      // Assert: Should detect this as no real change (after trimming)
      expect(mockExtractWeightedKeywords).not.toHaveBeenCalled();
    });

    it('should regenerate when content has meaningful changes', async () => {
      // Act: Update with actually different content
      await crudHandlers.updateItem({
        id: 1,
        content: 'Original content about testing and new information',
      });

      // Assert: Should detect meaningful change and regenerate
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle AI service failure gracefully', async () => {
      // Arrange: Make AI service throw an error
      mockExtractWeightedKeywords.mockRejectedValueOnce(
        new Error('AI service unavailable')
      );

      // Act & Assert: Update should still succeed without AI enrichment
      await expect(
        crudHandlers.updateItem({
          id: 1,
          content: 'New content despite AI failure',
        })
      ).resolves.toBeDefined();

      // Assert: Update should proceed with content change
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'New content despite AI failure',
          }),
        })
      );
    });

    it('should handle empty content update', async () => {
      // Act: Update with empty content
      await crudHandlers.updateItem({
        id: 1,
        content: '',
      });

      // Assert: Should still trigger AI enrichment for empty content
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
      expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
        title: existingItem.title,
        description: existingItem.description,
        content: '',
      });
    });

    it('should clean up old keywords and concepts before storing new ones', async () => {
      // Act: Update content
      await crudHandlers.updateItem({
        id: 1,
        content: 'Content requiring keyword and concept cleanup',
      });

      // Assert: Old keywords and concepts should be deleted first
      expect(prisma.itemKeyword.deleteMany).toHaveBeenCalledWith({
        where: { itemId: 1 },
      });
      expect(prisma.itemConcept.deleteMany).toHaveBeenCalledWith({
        where: { itemId: 1 },
      });

      // Assert: New ones should be stored after deletion
      expect(mockStoreKeywordsForItem).toHaveBeenCalled();
      expect(mockStoreConceptsForItem).toHaveBeenCalled();
    });

    it('should handle item not found error', async () => {
      // Arrange: Item doesn't exist
      prisma.item.findUnique.mockResolvedValueOnce(null);

      // Act & Assert: Should throw appropriate error
      await expect(
        crudHandlers.updateItem({
          id: 999,
          content: 'New content for non-existent item',
        })
      ).rejects.toThrow(McpError);

      // Assert: AI service should not be called
      expect(mockExtractWeightedKeywords).not.toHaveBeenCalled();
    });

    it('should use updated title and description for AI enrichment if provided', async () => {
      // Act: Update all content fields
      await crudHandlers.updateItem({
        id: 1,
        title: 'Completely New Title',
        description: 'Completely New Description',
        content: 'Completely New Content',
      });

      // Assert: AI enrichment should use all new values
      expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
        title: 'Completely New Title',
        description: 'Completely New Description',
        content: 'Completely New Content',
      });
    });

    it('should handle very large content updates', async () => {
      // Arrange: Create very large content
      const largeContent = 'x'.repeat(100000); // 100KB of content

      // Act: Update with large content
      await crudHandlers.updateItem({
        id: 1,
        content: largeContent,
      });

      // Assert: Should handle large content
      expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
      expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
        title: existingItem.title,
        description: existingItem.description,
        content: largeContent,
      });
    });

    it('should handle special characters in content', async () => {
      // Act: Update with special characters
      const specialContent = 'Content with 特殊文字 and émojis 🚀 and symbols @#$%';
      await crudHandlers.updateItem({
        id: 1,
        content: specialContent,
      });

      // Assert: Should handle special characters
      expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
        title: existingItem.title,
        description: existingItem.description,
        content: specialContent,
      });
    });
  });

  describe('integration with existing update functionality', () => {
    it('should preserve existing update behavior for non-content fields', async () => {
      // Act: Update multiple non-content fields
      await crudHandlers.updateItem({
        id: 1,
        type: 'issue',
        priority: 'HIGH',
        category: 'bug-fix',
        version: '2.0.0',
      });

      // Assert: Fields should be updated without AI enrichment
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'issue',
            priority: 'HIGH',
            category: 'bug-fix',
            version: '2.0.0',
          }),
        })
      );

      // Assert: No AI enrichment triggered
      expect(mockExtractWeightedKeywords).not.toHaveBeenCalled();
    });

    it('should handle partial updates with content change', async () => {
      // Act: Partial update including content
      await crudHandlers.updateItem({
        id: 1,
        content: 'Partially updated content',
        // Other fields not provided
      });

      // Assert: Only content and AI fields should be updated
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Partially updated content',
            aiSummary: enrichedMetadata.summary,
            embedding: enrichedMetadata.embedding,
            searchIndex: 'updated ai enrichment',
          }),
        })
      );

      // Assert: Other fields should not be in update
      const updateCall = prisma.item.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('title');
      expect(updateCall.data).not.toHaveProperty('description');
      expect(updateCall.data).not.toHaveProperty('priority');
    });
  });
});

describe('AI Enrichment Regeneration - Title and Description changes', () => {
  let prisma: any;
  let crudHandlers: CRUDHandlers;
  
  const existingItem = {
    id: 2,
    type: 'knowledge',
    title: 'Original Title',
    description: 'Original Description',
    content: 'Original content',
    aiSummary: 'Original summary',
    statusId: 1,
    priority: 'MEDIUM',
    searchIndex: 'original keywords',
    embedding: Buffer.from([1, 2, 3, 4]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    crudHandlers = new CRUDHandlers(prisma);
    
    prisma.item.findUnique.mockResolvedValue(existingItem);
    prisma.item.update.mockResolvedValue({
      ...existingItem,
      status: { id: 1, name: 'Open' },
      tags: [],
    });
    
    mockExtractWeightedKeywords.mockResolvedValue({
      keywords: [{ keyword: 'test', weight: 0.5 }],
      concepts: ['testing'],
      summary: 'Test summary',
      embedding: Buffer.from([5, 6, 7, 8]),
    });
  });

  it('should regenerate AI enrichment when only title changes', async () => {
    // Act: Update only title
    await crudHandlers.updateItem({
      id: 2,
      title: 'Significantly Different Title About AI',
    });

    // Assert: AI enrichment SHOULD be triggered for title changes
    expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
    // But title should still be updated
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Significantly Different Title About AI',
        }),
      })
    );
  });

  it('should regenerate AI enrichment when only description changes', async () => {
    // Act: Update only description
    await crudHandlers.updateItem({
      id: 2,
      description: 'Completely new description with different context',
    });

    // Assert: AI enrichment SHOULD be triggered for description changes
    expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
    // But description should still be updated
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'Completely new description with different context',
        }),
      })
    );
  });

  it('should regenerate AI enrichment when content changes along with title and description', async () => {
    // Act: Update content along with title and description
    await crudHandlers.updateItem({
      id: 2,
      title: 'New Title',
      description: 'New Description',
      content: 'New content that triggers AI enrichment',
    });

    // Assert: AI enrichment should be triggered because content changed
    expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
    expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
      title: 'New Title',
      description: 'New Description',
      content: 'New content that triggers AI enrichment',
    });
  });
});