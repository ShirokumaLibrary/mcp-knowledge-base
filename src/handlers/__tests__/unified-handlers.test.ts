/**
 * @ai-context Comprehensive tests for UnifiedHandlers
 * @ai-pattern Unit tests for MCP handler layer
 * @ai-critical Tests all API entry points for item operations
 * @ai-related-files
 *   - src/handlers/unified-handlers.ts (implementation)
 *   - src/repositories/item-repository.ts (data layer)
 *   - src/schemas/unified-schemas.ts (validation)
 */

import { createUnifiedHandlers, handleUnifiedToolCall } from '../unified-handlers.js';
import { FileIssueDatabase } from '../../database/index.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import type { UnifiedItem } from '../../types/unified-types.js';

describe('UnifiedHandlers', () => {
  let testDataDir: string;
  let database: FileIssueDatabase;
  let handlers: ReturnType<typeof createUnifiedHandlers>;

  beforeEach(async () => {
    // Setup test directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'unified-handlers-test-'));
    testDataDir = path.join(tempDir, '.shirokuma/data');
    
    // Create required directories
    const dirs = ['issues', 'plans', 'docs', 'knowledge', 'sessions', 'sessions/dailies'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(testDataDir, dir), { recursive: true });
    }
    
    // Create date-based subdirectories for sessions (for today)
    const today = new Date().toISOString().split('T')[0];
    await fs.mkdir(path.join(testDataDir, 'sessions', today), { recursive: true });
    
    // Initialize database
    const dbPath = path.join(testDataDir, 'search.db');
    database = new FileIssueDatabase(testDataDir, dbPath);
    await database.initialize();
    
    // Create handlers
    handlers = createUnifiedHandlers(database);
  });

  afterEach(async () => {
    await database.close();
    // Clean up test directory
    try {
      await fs.rm(path.dirname(testDataDir), { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('get_items', () => {
    beforeEach(async () => {
      // Create test data
      await database.getItemRepository().createItem({
        type: 'issues',
        title: 'Open Issue',
        content: 'Content',
        status: 'Open',
        priority: 'high'
      });

      await database.getItemRepository().createItem({
        type: 'issues',
        title: 'Closed Issue',
        content: 'Content',
        status: 'Closed',
        priority: 'low'
      });

      await database.getItemRepository().createItem({
        type: 'plans',
        title: 'Test Plan',
        content: 'Content',
        status: 'Open'
      });
    });

    it('should get items by type', async () => {
      const items = await handlers.get_items({ type: 'issues' });
      
      expect(items).toHaveLength(1); // Only open items by default
      expect(items[0].type).toBe('issues');
      expect(items[0].status).toBe('Open');
    });

    it('should include closed statuses when requested', async () => {
      const items = await handlers.get_items({ 
        type: 'issues',
        includeClosedStatuses: true 
      });
      
      expect(items).toHaveLength(2);
      expect(items.some(item => item.status === 'Closed')).toBe(true);
    });

    it('should filter by specific statuses', async () => {
      const items = await handlers.get_items({ 
        type: 'issues',
        statuses: ['Closed'],
        includeClosedStatuses: true // Need to include closed statuses
      });
      
      expect(items).toHaveLength(1);
      expect(items[0].status).toBe('Closed');
    });

    it('should handle date range filtering', async () => {
      // Create session with specific date
      const created = await database.getItemRepository().createItem({
        type: 'sessions',
        title: 'Session in January',
        content: 'Content',
        datetime: '2024-01-15T10:00:00.000Z' // This will set start_date
      });

      const items = await handlers.get_items({ 
        type: 'sessions',
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      });
      
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Session in January');
    });

    it('should handle limit parameter', async () => {
      // Create multiple items
      for (let i = 0; i < 5; i++) {
        await database.getItemRepository().createItem({
          type: 'docs',
          title: `Doc ${i}`,
          content: 'Content'
        });
      }

      const items = await handlers.get_items({ 
        type: 'docs',
        limit: 3
      });
      
      expect(items).toHaveLength(3);
    });

    it('should handle get latest session', async () => {
      // Create multiple sessions including today
      await database.getItemRepository().createItem({
        type: 'sessions',
        title: 'Old Session',
        content: 'Old content',
        datetime: '2025-07-01T10:00:00.000Z'
      });
      
      // Create session for today (start_date will be set from ID)
      const todaySession = await database.getItemRepository().createItem({
        type: 'sessions',
        title: 'Today Session',
        content: 'Content'
      });

      // Debug: check today's date and session's date
      const today = new Date().toISOString().split('T')[0];
      const sessionDate = todaySession.id.substring(0, 10);
      console.log('Today:', today);
      console.log('Session date:', sessionDate);
      console.log('Session start_date:', todaySession.start_date);
      
      // When limit=1 with sessions, it should get today's sessions only
      const items = await handlers.get_items({ 
        type: 'sessions',
        limit: 1
      });
      
      console.log('Items returned:', items.length);
      
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Today Session');
      
      // Without limit, should get all sessions
      const allItems = await handlers.get_items({ 
        type: 'sessions'
      });
      
      expect(allItems.length).toBeGreaterThan(1);
    });
  });

  describe('get_item_detail', () => {
    it('should get item by ID', async () => {
      const created = await database.getItemRepository().createItem({
        type: 'issues',
        title: 'Test Issue',
        content: 'Issue content',
        description: 'Test description'
      });

      const item = await handlers.get_item_detail({
        type: 'issues',
        id: parseInt(created.id)
      });

      expect(item).toBeDefined();
      expect(item.id).toBe(created.id);
      expect(item.title).toBe('Test Issue');
      expect(item.content).toBe('Issue content');
      expect(item.description).toBe('Test description');
    });

    it('should throw error for non-existent item', async () => {
      await expect(handlers.get_item_detail({
        type: 'issues',
        id: 9999
      })).rejects.toThrow(McpError);

      await expect(handlers.get_item_detail({
        type: 'issues',
        id: 9999
      })).rejects.toThrow('issues with ID 9999 not found');
    });

    it('should handle string ID parameter', async () => {
      const created = await database.getItemRepository().createItem({
        type: 'docs',
        title: 'Test Doc',
        content: 'Doc content'
      });

      const item = await handlers.get_item_detail({
        type: 'docs',
        id: created.id as any // Testing string ID
      });

      expect(item).toBeDefined();
      expect(item.id).toBe(created.id);
    });
  });

  describe('create_item', () => {
    it('should create task type item', async () => {
      const item = await handlers.create_item({
        type: 'issues',
        title: 'New Issue',
        content: 'Issue content',
        priority: 'high',
        status: 'Open',
        tags: ['bug', 'urgent'],
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      });

      expect(item).toBeDefined();
      expect(item.type).toBe('issues');
      expect(item.title).toBe('New Issue');
      expect(item.priority).toBe('high');
      expect(item.status).toBe('Open');
      expect(item.tags).toEqual(['bug', 'urgent']);
    });

    it('should create document type item', async () => {
      const item = await handlers.create_item({
        type: 'docs',
        title: 'New Document',
        content: 'Document content',
        tags: ['reference', 'api']
      });

      expect(item).toBeDefined();
      expect(item.type).toBe('docs');
      expect(item.title).toBe('New Document');
      expect(item.tags).toEqual(['reference', 'api']);
    });

    it('should create session with custom datetime', async () => {
      const item = await handlers.create_item({
        type: 'sessions',
        title: 'Past Session',
        content: 'Session content',
        datetime: '2024-01-01T10:30:00.000Z'
      });

      expect(item).toBeDefined();
      expect(item.type).toBe('sessions');
      expect(item.start_date).toBe('2024-01-01');
    });

    it('should create daily summary', async () => {
      const item = await handlers.create_item({
        type: 'dailies',
        title: 'Daily Summary',
        content: 'Summary content',
        date: '2024-01-15'
      });

      expect(item).toBeDefined();
      expect(item.type).toBe('dailies');
      expect(item.id).toBe('2024-01-15');
    });

    it('should validate required fields', async () => {
      await expect(handlers.create_item({
        type: 'issues',
        title: 'No Content'
        // Missing required content field
      } as any)).rejects.toThrow();
    });
  });

  describe('update_item', () => {
    it('should update all fields', async () => {
      const created = await database.getItemRepository().createItem({
        type: 'issues',
        title: 'Original Title',
        content: 'Original content',
        priority: 'low'
      });

      const updated = await handlers.update_item({
        type: 'issues',
        id: parseInt(created.id),
        title: 'Updated Title',
        content: 'Updated content',
        priority: 'high',
        status: 'In Progress',
        tags: ['updated']
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Updated content');
      expect(updated.priority).toBe('high');
      expect(updated.status).toBe('In Progress');
      expect(updated.tags).toEqual(['updated']);
    });

    it('should update partial fields', async () => {
      const created = await database.getItemRepository().createItem({
        type: 'docs',
        title: 'Original Title',
        content: 'Original content',
        tags: ['original']
      });

      const updated = await handlers.update_item({
        type: 'docs',
        id: parseInt(created.id),
        title: 'New Title'
      });

      expect(updated.title).toBe('New Title');
      expect(updated.content).toBe('Original content'); // Unchanged
      expect(updated.tags).toEqual(['original']); // Unchanged
    });

    it('should throw error for non-existent item', async () => {
      await expect(handlers.update_item({
        type: 'issues',
        id: 9999,
        title: 'New Title'
      })).rejects.toThrow(McpError);

      await expect(handlers.update_item({
        type: 'issues',
        id: 9999,
        title: 'New Title'
      })).rejects.toThrow('issues with ID 9999 not found');
    });

    it('should preserve created_at timestamp', async () => {
      const created = await database.getItemRepository().createItem({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await handlers.update_item({
        type: 'issues',
        id: parseInt(created.id),
        title: 'Updated Title'
      });

      expect(updated.created_at).toBe(created.created_at);
      expect(updated.updated_at).not.toBe(created.updated_at);
    });
  });

  describe('delete_item', () => {
    it('should delete existing item', async () => {
      const created = await database.getItemRepository().createItem({
        type: 'issues',
        title: 'To Delete',
        content: 'Delete me'
      });

      const result = await handlers.delete_item({
        type: 'issues',
        id: parseInt(created.id)
      });

      expect(result).toBe(`issues ID ${created.id} deleted`);

      // Verify deletion
      await expect(handlers.get_item_detail({
        type: 'issues',
        id: parseInt(created.id)
      })).rejects.toThrow();
    });

    it('should throw error for non-existent item', async () => {
      await expect(handlers.delete_item({
        type: 'issues',
        id: 9999
      })).rejects.toThrow(McpError);

      await expect(handlers.delete_item({
        type: 'issues',
        id: 9999
      })).rejects.toThrow('issues with ID 9999 not found');
    });

    it('should handle string ID parameter', async () => {
      const created = await database.getItemRepository().createItem({
        type: 'docs',
        title: 'To Delete',
        content: 'Delete me'
      });

      const result = await handlers.delete_item({
        type: 'docs',
        id: created.id as any // Testing string ID
      });

      expect(result).toBe(`docs ID ${created.id} deleted`);
    });
  });

  describe('search_items_by_tag', () => {
    beforeEach(async () => {
      await database.getItemRepository().createItem({
        type: 'issues',
        title: 'Issue with bug',
        content: 'Content',
        tags: ['bug', 'urgent']
      });

      await database.getItemRepository().createItem({
        type: 'plans',
        title: 'Plan with bug',
        content: 'Content',
        tags: ['bug', 'feature']
      });

      await database.getItemRepository().createItem({
        type: 'docs',
        title: 'Doc with api',
        content: 'Content',
        tags: ['api', 'reference']
      });

      await database.getItemRepository().createItem({
        type: 'sessions',
        title: 'Session with bug',
        content: 'Content',
        tags: ['bug']
      });
    });

    it('should search items by tag', async () => {
      const result = await handlers.search_items_by_tag({ tag: 'bug' });

      expect(result.tasks).toBeDefined();
      expect(result.documents).toBeDefined();
      expect(result.tasks.issues).toHaveLength(1);
      expect(result.tasks.plans).toHaveLength(1);
      expect(result.tasks.sessions).toHaveLength(1); // Sessions grouped under tasks
    });

    it('should filter by types', async () => {
      const result = await handlers.search_items_by_tag({ 
        tag: 'bug',
        types: ['issues']
      });

      expect(result.tasks.issues).toHaveLength(1);
      expect(result.tasks.plans).toBeUndefined();
      expect(result.documents).toEqual({});
    });

    it('should handle empty results', async () => {
      const result = await handlers.search_items_by_tag({ tag: 'non-existent' });

      expect(result.tasks).toEqual({});
      expect(result.documents).toEqual({});
    });

    it('should group by base type correctly', async () => {
      // Create custom type
      await database.createType('customdocs', 'documents');
      await database.getItemRepository().createItem({
        type: 'customdocs',
        title: 'Custom Doc',
        content: 'Content',
        tags: ['custom']
      });

      const result = await handlers.search_items_by_tag({ tag: 'custom' });

      expect(result.documents.customdocs).toHaveLength(1);
    });

    it('should handle multiple types search', async () => {
      const result = await handlers.search_items_by_tag({ 
        tag: 'bug',
        types: ['issues', 'plans', 'docs']
      });

      expect(result.tasks.issues).toHaveLength(1);
      expect(result.tasks.plans).toHaveLength(1);
      expect(result.tasks.sessions).toBeUndefined(); // Not included in types filter
      expect(result.documents).toEqual({});
    });
  });

  describe('strict parameter validation', () => {
    it('should reject unknown parameters in get_items', async () => {
      await expect(handleUnifiedToolCall('get_items', {
        type: 'issues',
        unknown_field: 'value'
      }, handlers)).rejects.toThrow();
    });

    it('should reject unknown parameters in get_item_detail', async () => {
      await expect(handleUnifiedToolCall('get_item_detail', {
        type: 'issues',
        id: 1,
        extra_param: 'value'
      }, handlers)).rejects.toThrow();
    });

    it('should reject unknown parameters in create_item', async () => {
      await expect(handleUnifiedToolCall('create_item', {
        type: 'issues',
        title: 'Test Issue',
        unknown_field: 'value'
      }, handlers)).rejects.toThrow();
    });

    it('should reject deprecated category field in create_item', async () => {
      await expect(handleUnifiedToolCall('create_item', {
        type: 'sessions',
        title: 'Test Session',
        category: 'development' // This field was removed
      }, handlers)).rejects.toThrow();
    });

    it('should reject unknown parameters in update_item', async () => {
      const created = await database.getItemRepository().createItem({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content'
      });

      await expect(handleUnifiedToolCall('update_item', {
        type: 'issues',
        id: parseInt(created.id),
        title: 'Updated Title',
        unknown_field: 'value'
      }, handlers)).rejects.toThrow();
    });

    it('should reject unknown parameters in delete_item', async () => {
      await expect(handleUnifiedToolCall('delete_item', {
        type: 'issues',
        id: 1,
        force: true // Unknown parameter
      }, handlers)).rejects.toThrow();
    });

    it('should reject unknown parameters in search_items_by_tag', async () => {
      await expect(handleUnifiedToolCall('search_items_by_tag', {
        tag: 'bug',
        limit: 10 // Unknown parameter
      }, handlers)).rejects.toThrow();
    });

    it('should accept all valid parameters without throwing', async () => {
      // Test that valid parameters work correctly
      const created = await handlers.create_item({
        type: 'issues',
        title: 'Valid Issue',
        description: 'Description',
        content: 'Content',
        priority: 'high',
        status: 'Open',
        tags: ['test'],
        related: [],
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        related_documents: [],
        related_tasks: []
      });

      expect(created.title).toBe('Valid Issue');

      // Update with all valid parameters
      await handlers.update_item({
        type: 'issues',
        id: parseInt(created.id),
        title: 'Updated Title',
        description: 'Updated Description',
        content: 'Updated Content',
        priority: 'low',
        status: 'Closed',
        tags: ['updated'],
        related: [],
        start_date: null,
        end_date: null,
        related_documents: [],
        related_tasks: []
      });

      // Get with all valid parameters
      const items = await handlers.get_items({
        type: 'issues',
        statuses: ['Closed'],
        includeClosedStatuses: true,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        limit: 10
      });

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Updated Title');
    });
  });
});