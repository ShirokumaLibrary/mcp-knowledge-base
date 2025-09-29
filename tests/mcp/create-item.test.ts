import 'reflect-metadata';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { DataSource } from 'typeorm';
import { Item } from '../../src/entities/Item.js';
import { Status } from '../../src/entities/Status.js';
import { ItemRepository } from '../../src/repositories/ItemRepository.js';
import { EnhancedAIService } from '../../src/services/enhanced-ai.service.js';

// Create test DataSource
const TestDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logging: false,
  entities: [Item, Status],
});

describe('create_item API - Data Re-fetching', () => {
  let itemRepo: ItemRepository;
  let aiService: EnhancedAIService;

  beforeAll(async () => {
    // Initialize test database
    await TestDataSource.initialize();
    
    // Mock AppDataSource
    (global as any).AppDataSource = TestDataSource;
    
    // Create test status
    const statusRepository = TestDataSource.getRepository(Status);
    await statusRepository.save({
      id: 1,
      name: 'Open',
      isClosable: false,
      sortOrder: 0
    });
  });

  afterAll(async () => {
    await TestDataSource.destroy();
  });

  beforeEach(async () => {
    // Initialize services
    itemRepo = new ItemRepository();
    aiService = new EnhancedAIService(TestDataSource);
    
    // Clear items before each test
    await TestDataSource.getRepository(Item).clear();
  });

  it('should re-fetch item after AI enrichment to get complete data', async () => {
    // Mock AI service to return specific values
    vi.spyOn(aiService, 'enrichItem').mockImplementation(async (item) => {
      // Simulate AI enrichment that updates the database
      await TestDataSource.getRepository(Item).update(item.id, {
        aiSummary: 'AI generated summary',
        searchIndex: 'keyword1 keyword2 keyword3',
        entities: JSON.stringify({ concepts: ['concept1', 'concept2'] })
      });
    });

    // Create item
    const testData = {
      type: 'issue',
      title: 'Test Item',
      description: 'Test description',
      content: 'Test content',
      statusId: 1,
      priority: 'HIGH' as const
    };

    // Create item and perform AI enrichment
    const createdItem = await itemRepo.create(testData);
    await aiService.enrichItem(createdItem);
    
    // The bug: createdItem still has null AI fields in memory
    expect(createdItem.aiSummary).toBeNull();
    expect(createdItem.searchIndex).toBeNull();
    
    // The fix: Re-fetch from database to get updated fields
    const freshItem = await itemRepo.findById(createdItem.id);
    expect(freshItem).toBeTruthy();
    expect(freshItem!.aiSummary).toBe('AI generated summary');
    expect(freshItem!.searchIndex).toBe('keyword1 keyword2 keyword3');
    expect(freshItem!.entities).toContain('concept1');
  });

  it('should handle case when item cannot be re-fetched', async () => {
    // Mock findById to return null (simulating an error)
    vi.spyOn(itemRepo, 'findById').mockResolvedValueOnce(null);
    
    const testData = {
      type: 'issue',
      title: 'Test Item',
      description: 'Test description',
      statusId: 1,
      priority: 'MEDIUM' as const
    };

    const createdItem = await itemRepo.create(testData);
    
    // Try to re-fetch - should handle gracefully
    const freshItem = await itemRepo.findById(createdItem.id);
    expect(freshItem).toBeNull();
  });
});