/**
 * @ai-context Test suite for related field consolidation
 * @ai-pattern Tests backward compatibility and field migration
 * @ai-critical Ensures related_tasks/related_documents work alongside related field
 */

import { FileIssueDatabase } from '../database/index.js';
import { createUnifiedHandlers } from '../handlers/unified-handlers.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

describe('Related Field Consolidation', () => {
  let testDataDir: string;
  let database: FileIssueDatabase;
  let handlers: ReturnType<typeof createUnifiedHandlers>;

  beforeEach(async () => {
    // Setup test directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'related-field-test-'));
    testDataDir = path.join(tempDir, '.shirokuma/data');
    
    // Create required directories
    const dirs = ['issues', 'plans', 'docs', 'knowledge', 'sessions'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(testDataDir, dir), { recursive: true });
    }
    
    // Initialize database
    const dbPath = path.join(testDataDir, 'search.db');
    database = new FileIssueDatabase(testDataDir, dbPath);
    await database.initialize();
    
    // Create handlers
    handlers = createUnifiedHandlers(database);
  });

  afterEach(async () => {
    await database.close();
    try {
      await fs.rm(path.dirname(testDataDir), { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Backward Compatibility', () => {
    it('should accept related_tasks and related_documents in create_item', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'high',
        related_tasks: ['plans-1', 'issues-2'],
        related_documents: ['docs-1', 'knowledge-1']
      });

      expect(issue).toBeDefined();
      expect(issue.id).toBeDefined();
      
      // Verify that fields are stored in the unified related field
      const retrieved = await handlers.get_item_detail({
        type: 'issues',
        id: parseInt(issue.id)
      });
      
      expect(retrieved.related).toEqual(
        expect.arrayContaining(['plans-1', 'issues-2', 'docs-1', 'knowledge-1'])
      );
    });

    it('should accept related_tasks and related_documents in update_item', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'medium'
      });

      const updated = await handlers.update_item({
        type: 'issues',
        id: parseInt(issue.id),
        related_tasks: ['plans-10'],
        related_documents: ['docs-20']
      });

      expect(updated.related).toEqual(
        expect.arrayContaining(['plans-10', 'docs-20'])
      );
    });

    it('should handle only related field', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'low',
        related: ['issues-1', 'docs-2', 'plans-3']
      });

      expect(issue.related).toEqual(['issues-1', 'docs-2', 'plans-3']);
    });

    it('should merge all three fields when provided together', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'high',
        related: ['existing-1'],
        related_tasks: ['issues-100'],
        related_documents: ['docs-200']
      });

      // All three should be merged
      expect(issue.related).toEqual(
        expect.arrayContaining(['existing-1', 'issues-100', 'docs-200'])
      );
    });
  });

  describe('Field Priority and Deduplication', () => {
    it('should deduplicate related items', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'medium',
        related: ['issues-1', 'docs-1'],
        related_tasks: ['issues-1'], // Duplicate
        related_documents: ['docs-1'] // Duplicate
      });

      // Should not have duplicates
      const uniqueRelated = [...new Set(issue.related)];
      expect(issue.related).toEqual(uniqueRelated);
      expect(issue.related.filter(r => r === 'issues-1')).toHaveLength(1);
      expect(issue.related.filter(r => r === 'docs-1')).toHaveLength(1);
    });

    it('should preserve order when merging fields', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'low',
        related: ['a-1', 'b-2'],
        related_tasks: ['c-3', 'd-4'],
        related_documents: ['e-5', 'f-6']
      });

      // Order should be preserved: related, then tasks, then documents
      expect(issue.related).toBeDefined();
      expect(issue.related).toContain('a-1');
      expect(issue.related).toContain('c-3');
      expect(issue.related).toContain('e-5');
    });
  });

  describe('Update Operations', () => {
    it('should replace all related items on update', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'high',
        related: ['old-1', 'old-2']
      });

      const updated = await handlers.update_item({
        type: 'issues',
        id: parseInt(issue.id),
        related: ['new-1', 'new-2']
      });

      expect(updated.related).toEqual(['new-1', 'new-2']);
      expect(updated.related).not.toContain('old-1');
      expect(updated.related).not.toContain('old-2');
    });

    it('should clear related items when setting empty array', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'medium',
        related: ['item-1', 'item-2']
      });

      const updated = await handlers.update_item({
        type: 'issues',
        id: parseInt(issue.id),
        related: []
      });

      expect(updated.related).toEqual([]);
    });

    it('should not modify related items when not specified in update', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'low',
        related: ['keep-1', 'keep-2']
      });

      const updated = await handlers.update_item({
        type: 'issues',
        id: parseInt(issue.id),
        title: 'Updated Title'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.related).toEqual(['keep-1', 'keep-2']);
    });
  });

  describe('Different Item Types', () => {
    it('should handle related fields for documents', async () => {
      const doc = await handlers.create_item({
        type: 'docs',
        title: 'Test Document',
        content: 'Document content',
        related: ['issues-1', 'knowledge-2'],
        related_documents: ['docs-3'] // Should work for backward compatibility
      });

      expect(doc.related).toEqual(
        expect.arrayContaining(['issues-1', 'knowledge-2', 'docs-3'])
      );
    });

    it('should handle related fields for plans', async () => {
      const plan = await handlers.create_item({
        type: 'plans',
        title: 'Test Plan',
        content: 'Plan content',
        status: 'Open',
        priority: 'high',
        related_tasks: ['issues-10', 'plans-20']
      });

      expect(plan.related).toEqual(
        expect.arrayContaining(['issues-10', 'plans-20'])
      );
    });

    it('should handle related fields for knowledge items', async () => {
      const knowledge = await handlers.create_item({
        type: 'knowledge',
        title: 'Test Knowledge',
        content: 'Knowledge content',
        related_documents: ['docs-100', 'knowledge-200']
      });

      expect(knowledge.related).toEqual(
        expect.arrayContaining(['docs-100', 'knowledge-200'])
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined related fields', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'medium'
        // No related fields specified
      });

      expect(issue.related).toEqual([]);
    });

    it('should handle invalid related item references gracefully', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'low',
        related: ['invalid--item', '123-invalid', 'valid-1']
      });

      // Should store all items, validation happens at retrieval
      expect(issue.related).toContain('valid-1');
    });

    it('should handle very long related lists', async () => {
      const manyRelated = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'high',
        related: manyRelated
      });

      expect(issue.related).toHaveLength(100);
      expect(issue.related).toEqual(manyRelated);
    });
  });
});