import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockPrismaClient, MockPrisma } from '../../mocks/prisma-mock.js';
import { CRUDHandlers } from '../../../src/mcp/handlers/crud-handlers.js';

// Mock PrismaClient with default export for ESM/CommonJS compatibility
vi.mock('@prisma/client', () => ({
  default: {
    PrismaClient: MockPrismaClient,
    Prisma: MockPrisma
  }
}));

// Mock database-init
vi.mock('../../../src/mcp/database/database-init.js', () => ({
  getStatusId: vi.fn(() => 1),
  ensureTags: vi.fn(() => [])
}));

// Mock Claude Interface
vi.mock('../../../src/services/ai/claude-interface.js', () => ({
  ClaudeInterface: vi.fn(() => ({
    extractWeightedKeywords: vi.fn().mockResolvedValue({
      keywords: [
        { word: 'test', weight: 0.9 },
        { word: 'update', weight: 0.8 }
      ],
      concepts: ['testing', 'update'],
      summary: 'Test summary',
      embedding: Buffer.from(new Array(128).fill(0))
    })
  }))
}));

// Mock Enhanced AI Service
const mockExtractWeightedKeywords = vi.fn();
const mockStoreKeywordsForItem = vi.fn();
const mockStoreConceptsForItem = vi.fn();

vi.mock('../../../src/services/enhanced-ai.service.js', () => ({
  EnhancedAIService: vi.fn(() => ({
    extractWeightedKeywords: mockExtractWeightedKeywords,
    storeKeywordsForItem: mockStoreKeywordsForItem,
    storeConceptsForItem: mockStoreConceptsForItem
  }))
}));

describe('Update Item - AI Enrichment (Fixed)', () => {
  let crudHandlers: CRUDHandlers;
  let prisma: any;
  
  const mockExistingItem = {
    id: 1,
    type: 'test_item',
    title: 'Original Title',
    description: 'Original Description',
    content: 'Original Content',
    priority: 'MEDIUM',
    statusId: 1,
    category: null,
    version: '1.0.0',
    startDate: null,
    endDate: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    aiSummary: 'Original summary',
    embedding: Buffer.from(new Array(128).fill(0)),
    searchIndex: 'original index'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new MockPrismaClient();
    crudHandlers = new CRUDHandlers(prisma);
    
    // Set up default mock responses
    prisma.item.findUnique.mockResolvedValue(mockExistingItem);
    prisma.status.findUnique.mockResolvedValue({ id: 1, name: 'Open' });
    prisma.itemKeyword.deleteMany.mockResolvedValue({ count: 0 });
    prisma.itemConcept.deleteMany.mockResolvedValue({ count: 0 });
    prisma.item.update.mockResolvedValue({
      ...mockExistingItem,
      status: { id: 1, name: 'Open' },
      tags: []
    });
    
    // Mock AI service responses
    mockExtractWeightedKeywords.mockResolvedValue({
      keywords: [
        { keyword: 'updated', weight: 0.8 },
        { keyword: 'content', weight: 0.7 }
      ],
      concepts: ['update', 'test'],
      summary: 'Updated summary',
      embedding: Buffer.from(new Array(128).fill(1))
    });
    
    mockStoreKeywordsForItem.mockResolvedValue(undefined);
    mockStoreConceptsForItem.mockResolvedValue(undefined);
  });

  it('should trigger AI enrichment when title changes', async () => {
    await crudHandlers.updateItem({
      id: 1,
      title: 'New Title'
    });
    
    // Check that AI enrichment was called
    expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
    expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
      title: 'New Title',
      description: 'Original Description',
      content: 'Original Content'
    });
  });

  it('should trigger AI enrichment when description changes', async () => {
    await crudHandlers.updateItem({
      id: 1,
      description: 'New Description'
    });
    
    expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
    expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
      title: 'Original Title',
      description: 'New Description',
      content: 'Original Content'
    });
  });

  it('should trigger AI enrichment when content changes', async () => {
    await crudHandlers.updateItem({
      id: 1,
      content: 'New Content'
    });
    
    expect(mockExtractWeightedKeywords).toHaveBeenCalledTimes(1);
    expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
      title: 'Original Title',
      description: 'Original Description',
      content: 'New Content'
    });
  });

  it('should NOT trigger AI enrichment when only status changes', async () => {
    await crudHandlers.updateItem({
      id: 1,
      status: 'Closed'
    });
    
    expect(mockExtractWeightedKeywords).not.toHaveBeenCalled();
  });

  it('should update database with enriched data', async () => {
    await crudHandlers.updateItem({
      id: 1,
      content: 'New Content'
    });
    
    // Check that update was called
    expect(prisma.item.update).toHaveBeenCalled();
    
    // Get the actual call arguments
    const updateCall = prisma.item.update.mock.calls[0][0];
    
    // Check specific fields
    expect(updateCall.data.content).toBe('New Content');
    expect(updateCall.data.aiSummary).toBe('Updated summary');
    expect(updateCall.data.searchIndex).toBe('updated content');
    expect(updateCall.data.embedding).toBeInstanceOf(Buffer);
  });
});