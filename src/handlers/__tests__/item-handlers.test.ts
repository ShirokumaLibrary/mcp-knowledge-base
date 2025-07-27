/**
 * @ai-context Unit tests for ItemHandlers
 * @ai-pattern Test handler logic with mocked dependencies
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ItemHandlers } from '../item-handlers.js';
import { 
  createSimpleMockDatabase, 
  mockResolvedValue,
  mockReturnValue,
  resetAllMocks,
  createMockHandlerContext
} from '../../test-utils/mock-helpers.js';

describe('ItemHandlers', () => {
  let handlers: ItemHandlers;
  let mockDb: any;

  beforeEach(() => {
    mockDb = createSimpleMockDatabase();
    handlers = new ItemHandlers(mockDb);
    resetAllMocks(mockDb);
  });

  describe('handleGetItems', () => {
    it('should return task summaries for task types', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' }) // isValidType
        .mockResolvedValueOnce({ base_type: 'tasks' }); // isTypeOfBase
      
      const mockSummaries = [
        { id: 1, title: 'Issue 1', priority: 'high', status: 'open' }
      ];
      mockDb.getAllTasksSummary.mockResolvedValueOnce(mockSummaries);

      // Execute
      const result = await handlers.handleGetItems({
        type: 'issues',
        includeClosedStatuses: false
      });

      // Assert
      expect(mockDb.getAllTasksSummary).toHaveBeenCalledWith(
        'issues',
        false,
        undefined
      );
      expect(result.content[0].text).toContain('Issue 1');
    });

    it('should return document summaries for document types', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'docs' }) // isValidType
        .mockResolvedValueOnce({ base_type: 'documents' }); // isTypeOfBase
      
      const mockDocs = [
        { id: 1, title: 'Doc 1', tags: ['test'] }
      ];
      mockDb.getAllDocumentsSummary.mockResolvedValueOnce(mockDocs);

      // Execute
      const result = await handlers.handleGetItems({ type: 'docs' });

      // Assert
      expect(mockDb.getAllDocumentsSummary).toHaveBeenCalledWith('docs');
      expect(result.content[0].text).toContain('Doc 1');
    });

    it('should throw error for unknown type', async () => {
      // Setup
      mockDb.getDatabase().getAsync.mockResolvedValueOnce(null);

      // Execute & Assert
      await expect(handlers.handleGetItems({ type: 'unknown' }))
        .rejects.toThrow(McpError);
    });

    it('should filter by status IDs when provided', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' })
        .mockResolvedValueOnce({ base_type: 'tasks' });
      
      mockDb.getAllTasksSummary.mockResolvedValueOnce([]);

      // Execute
      await handlers.handleGetItems({
        type: 'issues',
        statusIds: [1, 2, 3]
      });

      // Assert
      expect(mockDb.getAllTasksSummary).toHaveBeenCalledWith(
        'issues',
        false,  // includeClosedStatuses defaults to false
        [1, 2, 3]
      );
    });
  });

  describe('handleGetItemDetail', () => {
    it('should return task detail for task types', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' })
        .mockResolvedValueOnce({ base_type: 'tasks' });
      
      const mockIssue = {
        id: 1,
        title: 'Test Issue',
        description: 'Test description',
        priority: 'high',
        status_id: 1,
        tags: ['bug']
      };
      mockDb.getTask.mockResolvedValueOnce(mockIssue);

      // Execute
      const result = await handlers.handleGetItemDetail({
        type: 'issues',
        id: 1
      });

      // Assert
      expect(mockDb.getTask).toHaveBeenCalledWith('issues', 1);
      expect(result.content[0].text).toContain('Test Issue');
    });

    it('should return document detail for document types', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'docs' })
        .mockResolvedValueOnce({ base_type: 'documents' });
      
      const mockDoc = {
        id: 1,
        title: 'Test Doc',
        content: 'Document content',
        tags: ['documentation']
      };
      mockDb.getDocument.mockResolvedValueOnce(mockDoc);

      // Execute
      const result = await handlers.handleGetItemDetail({
        type: 'docs',
        id: 1
      });

      // Assert
      expect(mockDb.getDocument).toHaveBeenCalledWith('docs', 1);
      expect(result.content[0].text).toContain('Test Doc');
    });

    it('should throw error when item not found', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' })
        .mockResolvedValueOnce({ base_type: 'tasks' });
      
      mockDb.getTask.mockResolvedValueOnce(null);

      // Execute & Assert
      await expect(handlers.handleGetItemDetail({
        type: 'issues',
        id: 999
      })).rejects.toThrow('issues ID 999 not found');
    });
  });

  describe('handleCreateItem', () => {
    it('should create task with all fields', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' })
        .mockResolvedValueOnce({ base_type: 'tasks' });
      
      const newIssue = {
        id: 1,
        title: 'New Issue',
        content: 'Issue content',
        priority: 'high',
        status: 'open',
        tags: ['bug', 'urgent']
      };
      mockDb.createTask.mockResolvedValueOnce(newIssue);

      // Execute
      const result = await handlers.handleCreateItem({
        type: 'issues',
        title: 'New Issue',
        content: 'Issue content',
        priority: 'high',
        status: 'open',
        tags: ['bug', 'urgent'],
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      });

      // Assert
      expect(mockDb.createTask).toHaveBeenCalledWith(
        'issues',
        'New Issue',
        'Issue content',
        'high',
        'open',
        ['bug', 'urgent'],
        undefined,
        '2024-01-01',
        '2024-01-31',
        undefined,
        undefined
      );
      expect(result.content[0].text).toContain('issues created');
    });

    it('should create document with all fields', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'docs' })
        .mockResolvedValueOnce({ base_type: 'documents' });
      
      const newDoc = {
        id: 1,
        title: 'New Doc',
        content: 'Doc content',
        tags: ['documentation']
      };
      mockDb.createDocument.mockResolvedValueOnce(newDoc);

      // Execute
      const result = await handlers.handleCreateItem({
        type: 'docs',
        title: 'New Doc',
        content: 'Doc content',
        tags: ['documentation'],
        related_tasks: ['issues-1'],
        related_documents: ['knowledge-1']
      });

      // Assert
      expect(mockDb.createDocument).toHaveBeenCalledWith(
        'docs',
        'New Doc',
        'Doc content',
        ['documentation'],
        undefined,
        ['issues-1'],
        ['knowledge-1']
      );
      expect(result.content[0].text).toContain('docs created');
    });

    it('should throw error when content is missing', async () => {
      // Setup
      mockDb.getDatabase().getAsync.mockResolvedValueOnce({ type: 'docs' });

      // Execute & Assert
      await expect(handlers.handleCreateItem({
        type: 'docs',
        title: 'No Content Doc'
      })).rejects.toThrow('Content is required for docs');
    });
  });

  describe('handleUpdateItem', () => {
    it('should update task successfully', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' })
        .mockResolvedValueOnce({ base_type: 'tasks' });
      
      const updatedIssue = {
        id: 1,
        title: 'Updated Issue',
        priority: 'medium'
      };
      mockDb.updateTask.mockResolvedValueOnce(updatedIssue);

      // Execute
      const result = await handlers.handleUpdateItem({
        type: 'issues',
        id: 1,
        title: 'Updated Issue',
        priority: 'medium'
      });

      // Assert
      expect(mockDb.updateTask).toHaveBeenCalledWith(
        'issues',
        1,
        'Updated Issue',
        undefined,
        'medium',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );
      expect(result.content[0].text).toContain('issues updated');
    });

    it('should update document successfully', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'docs' })
        .mockResolvedValueOnce({ base_type: 'documents' });
      
      mockDb.updateDocument.mockResolvedValueOnce(true);
      const updatedDoc = {
        id: 1,
        title: 'Updated Doc',
        content: 'New content'
      };
      mockDb.getDocument.mockResolvedValueOnce(updatedDoc);

      // Execute
      const result = await handlers.handleUpdateItem({
        type: 'docs',
        id: 1,
        title: 'Updated Doc',
        content: 'New content'
      });

      // Assert
      expect(mockDb.updateDocument).toHaveBeenCalledWith(
        'docs',
        1,
        'Updated Doc',
        'New content',
        undefined,
        undefined,
        undefined,
        undefined
      );
      expect(result.content[0].text).toContain('docs updated');
    });

    it('should throw error when item not found', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' })
        .mockResolvedValueOnce({ base_type: 'tasks' });
      
      mockDb.updateTask.mockResolvedValueOnce(null);

      // Execute & Assert
      await expect(handlers.handleUpdateItem({
        type: 'issues',
        id: 999,
        title: 'Not found'
      })).rejects.toThrow('issues ID 999 not found');
    });
  });

  describe('handleDeleteItem', () => {
    it('should delete task successfully', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' })
        .mockResolvedValueOnce({ base_type: 'tasks' });
      
      mockDb.deleteTask.mockResolvedValueOnce(true);

      // Execute
      const result = await handlers.handleDeleteItem({
        type: 'issues',
        id: 1
      });

      // Assert
      expect(mockDb.deleteTask).toHaveBeenCalledWith('issues', 1);
      expect(result.content[0].text).toBe('issues ID 1 deleted');
    });

    it('should delete document successfully', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'docs' })
        .mockResolvedValueOnce({ base_type: 'documents' });
      
      mockDb.deleteDocument.mockResolvedValueOnce(true);

      // Execute
      const result = await handlers.handleDeleteItem({
        type: 'docs',
        id: 1
      });

      // Assert
      expect(mockDb.deleteDocument).toHaveBeenCalledWith('docs', 1);
      expect(result.content[0].text).toBe('docs ID 1 deleted');
    });

    it('should throw error when deletion fails', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' })
        .mockResolvedValueOnce({ base_type: 'tasks' });
      
      mockDb.deleteTask.mockResolvedValueOnce(false);

      // Execute & Assert
      await expect(handlers.handleDeleteItem({
        type: 'issues',
        id: 999
      })).rejects.toThrow('issues ID 999 not found');
    });
  });

  describe('handleSearchItemsByTag', () => {
    it('should search across all types when types not specified', async () => {
      // Setup
      mockDb.getDatabase().allAsync.mockResolvedValueOnce([
        { type: 'issues' },
        { type: 'docs' }
      ]);
      
      // Mock type validations
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' }) // isValidType for issues
        .mockResolvedValueOnce({ base_type: 'tasks' }) // isTypeOfBase for issues
        .mockResolvedValueOnce({ type: 'docs' }) // isValidType for docs
        .mockResolvedValueOnce({ base_type: 'documents' }); // isTypeOfBase for docs
      
      mockDb.searchTasksByTag.mockResolvedValueOnce([
        { id: 1, title: 'Issue with tag' }
      ]);
      mockDb.searchDocumentsByTag.mockResolvedValueOnce([
        { id: 2, title: 'Doc with tag' }
      ]);

      // Execute
      const result = await handlers.handleSearchItemsByTag({
        tag: 'test-tag'
      });

      // Assert
      expect(mockDb.searchTasksByTag).toHaveBeenCalledWith('issues', 'test-tag');
      expect(mockDb.searchDocumentsByTag).toHaveBeenCalledWith('test-tag', 'docs');
      
      const data = JSON.parse(result.content[0].text).data;
      expect(data.tasks.issues).toHaveLength(1);
      expect(data.documents.docs).toHaveLength(1);
    });

    it('should search only specified types', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce({ type: 'issues' })
        .mockResolvedValueOnce({ base_type: 'tasks' });
      
      mockDb.searchTasksByTag.mockResolvedValueOnce([
        { id: 1, title: 'Found issue' }
      ]);

      // Execute
      const result = await handlers.handleSearchItemsByTag({
        tag: 'test-tag',
        types: ['issues']
      });

      // Assert
      expect(mockDb.searchTasksByTag).toHaveBeenCalledWith('issues', 'test-tag');
      expect(mockDb.searchDocumentsByTag).not.toHaveBeenCalled();
    });

    it('should skip invalid types', async () => {
      // Setup
      mockDb.getDatabase().getAsync
        .mockResolvedValueOnce(null) // invalid type
        .mockResolvedValueOnce({ type: 'docs' }) // valid type
        .mockResolvedValueOnce({ base_type: 'documents' });
      
      mockDb.searchDocumentsByTag.mockResolvedValueOnce([]);

      // Execute
      const result = await handlers.handleSearchItemsByTag({
        tag: 'test-tag',
        types: ['invalid', 'docs']
      });

      // Assert
      expect(mockDb.searchTasksByTag).not.toHaveBeenCalled();
      expect(mockDb.searchDocumentsByTag).toHaveBeenCalledWith('test-tag', 'docs');
    });
  });
});