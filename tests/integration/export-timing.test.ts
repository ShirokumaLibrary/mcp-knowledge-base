import 'reflect-metadata';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DataSource } from 'typeorm';
import fs from 'fs/promises';
import path from 'path';
import { Item } from '../../src/entities/Item.js';
import { Status } from '../../src/entities/Status.js';
import { SystemState } from '../../src/entities/SystemState.js';
import { Tag } from '../../src/entities/Tag.js';
import { ItemTag } from '../../src/entities/ItemTag.js';
import { ItemRelation } from '../../src/entities/ItemRelation.js';
import { ItemKeyword } from '../../src/entities/ItemKeyword.js';
import { Keyword } from '../../src/entities/Keyword.js';
import { Concept } from '../../src/entities/Concept.js';
import { ItemConcept } from '../../src/entities/ItemConcept.js';
import { ExportManager } from '../../src/services/export-manager.js';
import { EnhancedAIService } from '../../src/services/enhanced-ai.service.js';
import { ItemRepository } from '../../src/repositories/ItemRepository.js';
import { StatusRepository } from '../../src/repositories/StatusRepository.js';

// Test database and export directory
const TEST_EXPORT_DIR = '/tmp/test-export-timing-' + Date.now();
const TestDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logging: false,
  entities: [Item, Status, SystemState, Tag, ItemTag, ItemRelation, ItemKeyword, Keyword, Concept, ItemConcept],
});

describe('Export Timing Issues', () => {
  let exportManager: ExportManager;
  let aiService: EnhancedAIService;
  let itemRepo: ItemRepository;
  let statusRepo: StatusRepository;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    // Initialize test database
    await TestDataSource.initialize();
    
    // Create repositories
    itemRepo = new ItemRepository();
    statusRepo = new StatusRepository();
    
    // Mock AppDataSource for repositories
    (global as any).AppDataSource = TestDataSource;
    
    // Save original environment
    originalEnv = { ...process.env };
    
    // Create test status
    const statusRepository = TestDataSource.getRepository(Status);
    await statusRepository.save({
      name: 'Open',
      isClosable: false,
      sortOrder: 0
    });
  });

  afterAll(async () => {
    // Restore environment
    process.env = originalEnv;
    
    // Close database
    await TestDataSource.destroy();
    
    // Clean up test directory
    await fs.rm(TEST_EXPORT_DIR, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Setup test export directory
    await fs.mkdir(TEST_EXPORT_DIR, { recursive: true });
    
    // Set environment variable for export
    process.env.SHIROKUMA_EXPORT_DIR = TEST_EXPORT_DIR;
    
    // Reset ConfigManager singleton
    const ConfigManager = (await import('../../src/services/config-manager.js')).ConfigManager;
    ConfigManager.getInstance().reset();
    
    // Initialize services
    aiService = new EnhancedAIService();
    exportManager = new ExportManager();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_EXPORT_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Clear environment variable
    delete process.env.SHIROKUMA_EXPORT_DIR;
    
    // Clear database
    await TestDataSource.getRepository(Item).clear();
  });

  it('should export item with incomplete frontmatter when AI enrichment is not awaited (reproducing bug)', async () => {
    // Mock the AI service to simulate delay
    vi.spyOn(aiService, 'generateSummary').mockImplementation(async () => {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'AI generated summary after delay';
    });
    
    vi.spyOn(aiService, 'extractKeywords').mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return ['keyword1', 'keyword2', 'keyword3'];
    });
    
    vi.spyOn(aiService, 'extractConcepts').mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return ['concept1', 'concept2'];
    });

    // Create a test item
    const testItem = {
      type: 'issue',
      title: 'Test Export Timing Issue',
      description: 'Testing if export happens before AI enrichment completes',
      content: 'This is a test to reproduce the frontmatter missing issue.',
      statusId: 1,
      priority: 'HIGH' as const,
      tags: ['test', 'export', 'timing']
    };

    // Create item
    const createdItem = await itemRepo.create(testItem);
    
    // Simulate the current problematic flow (not awaiting enrichment)
    // Start AI enrichment but don't wait for it
    const enrichmentPromise = (async () => {
      const summary = await aiService.generateSummary(
        testItem.title,
        testItem.description || '',
        testItem.content || ''
      );
      
      const keywords = await aiService.extractKeywords(
        testItem.title,
        testItem.description || '',
        testItem.content || ''
      );
      
      const concepts = await aiService.extractConcepts(
        testItem.content || testItem.description || testItem.title
      );
      
      // Update item with AI-generated data
      await itemRepo.update(createdItem.id, {
        aiSummary: summary,
        searchIndex: keywords.join(' '),
        entities: JSON.stringify({ concepts })
      });
    })();
    
    // Export immediately without waiting for enrichment (THIS IS THE BUG)
    await exportManager.autoExportItem(createdItem);
    
    // Check the exported file
    const exportedFile = path.join(TEST_EXPORT_DIR, 'issue', `${createdItem.id}-${createdItem.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`);
    const fileContent = await fs.readFile(exportedFile, 'utf-8');
    
    // Parse frontmatter
    const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
    expect(frontmatterMatch).toBeTruthy();
    
    const frontmatter = frontmatterMatch![1];
    
    // These fields should be missing or null because AI enrichment hasn't completed
    // This test should PASS if the bug exists (proving the problem)
    expect(frontmatter).not.toContain('aiSummary: "AI generated summary after delay"');
    expect(frontmatter).toContain('aiSummary: null'); // Should be null or missing
    
    // The keywords field should not contain the AI-generated keywords
    expect(frontmatter).not.toContain('keyword1');
    expect(frontmatter).not.toContain('keyword2');
    
    // Wait for enrichment to complete (cleanup)
    await enrichmentPromise;
  }, 10000); // Increase timeout for async operations

  it('should export item with complete frontmatter when properly re-fetching after enrichment (expected fix)', async () => {
    // Mock the AI service with immediate responses
    vi.spyOn(aiService, 'generateSummary').mockResolvedValue('Complete AI summary');
    vi.spyOn(aiService, 'extractKeywords').mockResolvedValue(['keyword1', 'keyword2', 'keyword3']);
    vi.spyOn(aiService, 'extractConcepts').mockResolvedValue(['concept1', 'concept2']);

    // Create a test item
    const testItem = {
      type: 'issue',
      title: 'Test Proper Export',
      description: 'Testing proper export with complete frontmatter',
      content: 'This test should have all AI-generated fields in frontmatter.',
      statusId: 1,
      priority: 'HIGH' as const,
      tags: ['test', 'export', 'proper']
    };

    // Create item
    const createdItem = await itemRepo.create(testItem);
    
    // Properly await AI enrichment
    const summary = await aiService.generateSummary(
      testItem.title,
      testItem.description || '',
      testItem.content || ''
    );
    
    const keywords = await aiService.extractKeywords(
      testItem.title,
      testItem.description || '',
      testItem.content || ''
    );
    
    const concepts = await aiService.extractConcepts(
      testItem.content || testItem.description || testItem.title
    );
    
    // Update item with AI-generated data
    await itemRepo.update(createdItem.id, {
      aiSummary: summary,
      searchIndex: keywords.join(' '),
      entities: JSON.stringify({ concepts })
    });
    
    // THE FIX: Re-fetch the item to get all updated fields
    const freshItem = await itemRepo.findById(createdItem.id);
    expect(freshItem).toBeTruthy();
    
    // Export with complete data
    await exportManager.autoExportItem(freshItem!);
    
    // Check the exported file
    const exportedFile = path.join(TEST_EXPORT_DIR, 'issue', `${freshItem!.id}-${freshItem!.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`);
    const fileContent = await fs.readFile(exportedFile, 'utf-8');
    
    // Parse frontmatter
    const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
    expect(frontmatterMatch).toBeTruthy();
    
    const frontmatter = frontmatterMatch![1];
    
    // All AI-generated fields should be present
    expect(frontmatter).toContain('aiSummary:');
    expect(frontmatter).toContain('Complete AI summary');
    expect(frontmatter).toContain('keywords:');
    expect(frontmatter).toContain('keyword1');
    expect(frontmatter).toContain('keyword2');
    expect(frontmatter).toContain('keyword3');
  });
});