/**
 * @ai-context Test suite for unified related field
 * @ai-pattern Tests unified related field functionality
 * @ai-critical Ensures unified related field works correctly
 */

import { FileIssueDatabase } from '../database/index.js';
import { createUnifiedHandlers } from '../handlers/unified-handlers.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

describe('Unified Related Field', () => {
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

  describe('Basic Functionality', () => {
    it('should accept unified related field in create_item', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Test content',
        status: 'Open',
        priority: 'high',
        related: ['plans-1', 'issues-2', 'docs-1', 'knowledge-1']
      });

      expect(issue).toBeDefined();
      expect(issue.id).toBeDefined();
      
      // Verify that fields are stored correctly
      const retrieved = await handlers.get_item_detail({
        type: 'issues',
        id: parseInt(issue.id)
      });
      
      expect(retrieved.related).toEqual(
        expect.arrayContaining(['plans-1', 'issues-2', 'docs-1', 'knowledge-1'])
      );
    });

    it('should accept unified related field in update_item', async () => {
      const created = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'medium'
      });

      const updated = await handlers.update_item({
        type: 'issues',
        id: parseInt(created.id),
        related: ['plans-10', 'docs-20']
      });

      expect(updated.related).toEqual(
        expect.arrayContaining(['plans-10', 'docs-20'])
      );
    });

    it('should handle empty related field', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'low',
        related: []
      });

      expect(issue.related).toEqual([]);
    });

    it('should handle multiple types in related field', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'high',
        related: ['issues-1', 'plans-2', 'docs-3', 'knowledge-4']
      });

      // All types should be preserved
      expect(issue.related).toEqual(
        expect.arrayContaining(['issues-1', 'plans-2', 'docs-3', 'knowledge-4'])
      );
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate related items', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'medium',
        related: ['issues-1', 'docs-1', 'issues-1', 'docs-1'] // Duplicates
      });

      // Should not have duplicates
      const uniqueRelated = [...new Set(issue.related)];
      expect(issue.related).toEqual(uniqueRelated);
      expect(issue.related.filter(r => r === 'issues-1')).toHaveLength(1);
      expect(issue.related.filter(r => r === 'docs-1')).toHaveLength(1);
    });

    it('should preserve order in related field', async () => {
      const issue = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'low',
        related: ['a-1', 'b-2', 'c-3', 'd-4', 'e-5', 'f-6']
      });

      // Order should be preserved
      expect(issue.related).toBeDefined();
      expect(issue.related).toEqual(['a-1', 'b-2', 'c-3', 'd-4', 'e-5', 'f-6']);
    });
  });

  describe('Update Scenarios', () => {
    it('should replace related field on update', async () => {
      const created = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'medium',
        related: ['old-1', 'old-2']
      });

      const updated = await handlers.update_item({
        type: 'issues',
        id: parseInt(created.id),
        related: ['new-1', 'new-2', 'new-3']
      });

      expect(updated.related).toEqual(['new-1', 'new-2', 'new-3']);
      expect(updated.related).not.toContain('old-1');
      expect(updated.related).not.toContain('old-2');
    });

    it('should clear related field when updated with empty array', async () => {
      const created = await handlers.create_item({
        type: 'issues',
        title: 'Test Issue',
        content: 'Content',
        status: 'Open',
        priority: 'low',
        related: ['item-1', 'item-2']
      });

      const updated = await handlers.update_item({
        type: 'issues',
        id: parseInt(created.id),
        related: []
      });

      expect(updated.related).toEqual([]);
    });
  });

  describe('Different Item Types', () => {
    it('should handle related field for documents', async () => {
      const doc = await handlers.create_item({
        type: 'docs',
        title: 'Test Document',
        content: 'Document content',
        related: ['issues-5', 'knowledge-10']
      });

      expect(doc.related).toEqual(['issues-5', 'knowledge-10']);
    });

    it('should handle related field for plans', async () => {
      const plan = await handlers.create_item({
        type: 'plans',
        title: 'Test Plan',
        content: 'Plan content',
        status: 'Open',
        priority: 'high',
        related: ['issues-1', 'issues-2', 'docs-3']
      });

      expect(plan.related).toEqual(['issues-1', 'issues-2', 'docs-3']);
    });

    it('should handle related field for knowledge items', async () => {
      const knowledge = await handlers.create_item({
        type: 'knowledge',
        title: 'Test Knowledge',
        content: 'Knowledge content',
        related: ['docs-100', 'knowledge-200']
      });

      expect(knowledge.related).toEqual(['docs-100', 'knowledge-200']);
    });
  });

  describe('Parallel Operations', () => {
    it('should handle concurrent creates with related fields', async () => {
      const createPromises = Array.from({ length: 3 }, (_, i) => 
        handlers.create_item({
          type: 'issues',
          title: `Issue ${i}`,
          content: `Content ${i}`,
          status: 'Open',
          priority: 'medium',
          related: [`docs-${i}`, `knowledge-${i+10}`]
        })
      );

      const results = await Promise.all(createPromises);
      
      results.forEach((issue, i) => {
        expect(issue.related).toContain(`docs-${i}`);
        expect(issue.related).toContain(`knowledge-${i+10}`);
      });
    });

    it('should handle concurrent updates to related field', async () => {
      const issue1 = await handlers.create_item({
        type: 'issues',
        title: 'Issue 1',
        content: 'Content 1',
        status: 'Open',
        priority: 'high',
        related: ['docs-3']
      });

      const issue2 = await handlers.create_item({
        type: 'issues',
        title: 'Issue 2',
        content: 'Content 2',
        status: 'Open',
        priority: 'medium',
        related: ['issues-10', 'plans-20']
      });

      const issue3 = await handlers.create_item({
        type: 'issues',
        title: 'Issue 3',
        content: 'Content 3',
        status: 'Open',
        priority: 'low',
        related: ['docs-100', 'knowledge-200']
      });

      // Verify all created correctly
      expect(issue1.related).toEqual(['docs-3']);
      expect(issue2.related).toEqual(['issues-10', 'plans-20']);
      expect(issue3.related).toEqual(['docs-100', 'knowledge-200']);

      // Update them concurrently
      const updatePromises = [
        handlers.update_item({
          type: 'issues',
          id: parseInt(issue1.id),
          related: [`issues-${issue2.id}`, `issues-${issue3.id}`]
        }),
        handlers.update_item({
          type: 'issues',
          id: parseInt(issue2.id),
          related: [`issues-${issue1.id}`, `issues-${issue3.id}`]
        }),
        handlers.update_item({
          type: 'issues',
          id: parseInt(issue3.id),
          related: [`issues-${issue1.id}`, `issues-${issue2.id}`]
        })
      ];

      const [updated1, updated2, updated3] = await Promise.all(updatePromises);

      // Verify cross-references
      expect(updated1.related).toContain(`issues-${issue2.id}`);
      expect(updated1.related).toContain(`issues-${issue3.id}`);
      expect(updated2.related).toContain(`issues-${issue1.id}`);
      expect(updated2.related).toContain(`issues-${issue3.id}`);
      expect(updated3.related).toContain(`issues-${issue1.id}`);
      expect(updated3.related).toContain(`issues-${issue2.id}`);
    });
  });
});