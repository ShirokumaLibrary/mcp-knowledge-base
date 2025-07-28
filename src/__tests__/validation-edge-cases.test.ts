import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FileIssueDatabase } from '../database.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Validation Edge Cases', () => {
  let db: FileIssueDatabase;
  const testDataDir = path.join(os.tmpdir(), 'mcp-test-validation-' + process.pid + '-' + Date.now());
  const testDbPath = path.join(testDataDir, 'test.db');

  beforeEach(async () => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
    
    db = new FileIssueDatabase(testDataDir, testDbPath);
    await db.initialize();
  });

  afterEach(async () => {
    await db.close();
    if (process.env.KEEP_TEST_DATA !== 'true' && fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Date Validation', () => {
    it('should reject invalid date format for start_date', async () => {
      await expect(
        db.createTask('issues', 'Test Issue', 'Test content', 'medium', undefined, [], undefined, '2025-02-30') // Invalid date
      ).rejects.toThrow('Invalid date: 2025-02-30');
    });

    it('should reject invalid date format for end_date', async () => {
      await expect(
        db.createTask('issues', 'Test Issue', 'Test content', 'medium', undefined, [], undefined, undefined, '2025-13-01') // Invalid month
      ).rejects.toThrow('Invalid date: 2025-13-01');
    });

    it('should reject February 31st', async () => {
      await expect(
        db.createTask('plans', 'Test Plan', 'Test content', 'medium', undefined, [], undefined, '2025-02-31')
      ).rejects.toThrow('Invalid date: 2025-02-31');
    });

    it('should reject non-existent leap year date', async () => {
      await expect(
        db.createTask('plans', 'Test Plan', 'Test content', 'medium', undefined, [], undefined, '2025-02-29') // 2025 is not a leap year
      ).rejects.toThrow('Invalid date: 2025-02-29');
    });

    it('should accept valid leap year date', async () => {
      const created = await db.createTask('plans', 'Test Plan', 'Test content', 'medium', undefined, [], undefined, '2024-02-29'); // 2024 is a leap year
      expect(created.start_date).toBe('2024-02-29');
    });

    it('should reject invalid date when updating', async () => {
      const created = await db.createTask('issues', 'Test Issue', 'Test content');
      
      await expect(
        db.updateTask(
          'issues', 
          parseInt(created.id), 
          undefined, // title
          undefined, // content
          undefined, // priority
          undefined, // status
          undefined, // tags
          undefined, // description
          '2025-04-31' // Invalid date - April has 30 days
        )
      ).rejects.toThrow('Invalid date: 2025-04-31');
    });

    it('should reject date with invalid day for month', async () => {
      await expect(
        db.createTask('issues', 'Test Issue', 'Test content', 'medium', undefined, [], undefined, '2025-06-31') // June has 30 days
      ).rejects.toThrow('Invalid date: 2025-06-31');
    });

    it('should accept edge case valid dates', async () => {
      // Last day of each month
      const item1 = await db.createTask('issues', 'Test 1', 'Test content', 'medium', undefined, [], undefined, '2025-01-31');
      expect(item1.start_date).toBe('2025-01-31');
      
      const item2 = await db.createTask('issues', 'Test 2', 'Test content', 'medium', undefined, [], undefined, '2025-12-31');
      expect(item2.start_date).toBe('2025-12-31');
    });
  });

  describe('Duplicate Related Items', () => {
    it('should handle duplicate items in related_tasks gracefully', async () => {
      const created = await db.createTask(
        'issues', 
        'Test Issue', 
        'Test content', 
        'medium', 
        undefined, 
        [], 
        undefined, 
        undefined, 
        undefined, 
        ['issues-1', 'issues-1', 'issues-2'] // Duplicate issues-1
      );
      
      // Should store without duplicates
      expect(created.related_tasks).toEqual(['issues-1', 'issues-2']);
    });

    it('should handle duplicate items when updating', async () => {
      const created = await db.createTask('issues', 'Test Issue', 'Test content');
      
      const updated = await db.updateTask(
        'issues', 
        parseInt(created.id), 
        undefined, // title
        undefined, // content
        undefined, // priority
        undefined, // status
        undefined, // tags
        undefined, // description
        undefined, // start_date
        undefined, // end_date
        ['issues-10', 'issues-10', 'issues-20', 'issues-20'] // Duplicates
      );
      
      // Should remove duplicates
      expect(updated?.related_tasks).toEqual(['issues-10', 'issues-20']);
    });

    it('should silently remove duplicates when updating', async () => {
      const created = await db.createTask(
        'issues', 
        'Test Issue', 
        'Test content', 
        'medium', 
        undefined, 
        [], 
        undefined, 
        undefined, 
        undefined, 
        ['issues-10', 'issues-20']
      );
      
      // Update with duplicates - should succeed without error
      const updated = await db.updateTask(
        'issues', 
        parseInt(created.id), 
        undefined, // title
        undefined, // content
        undefined, // priority
        undefined, // status
        undefined, // tags
        undefined, // description
        undefined, // start_date
        undefined, // end_date
        ['issues-10', 'issues-20', 'issues-10'] // Adding duplicate
      );
      
      // Should have unique items only
      expect(updated?.related_tasks).toEqual(['issues-10', 'issues-20']);
    });
  });

  describe('Type Name Validation', () => {
    it('should reject type names longer than 50 characters', async () => {
      await expect(
        db.getTypeRepository().createType('a'.repeat(51))
      ).rejects.toThrow('Type name must be 50 characters or less');
    });

    it('should accept type names up to 50 characters', async () => {
      const typeName = 'a'.repeat(50);
      await db.getTypeRepository().createType(typeName);
      
      // Verify it was created
      const types = await db.getTypeRepository().getTypes();
      expect(types.documents).toContainEqual(expect.objectContaining({
        type: typeName
      }));
    });

    it('should reject empty type names', async () => {
      await expect(
        db.getTypeRepository().createType('')
      ).rejects.toThrow(/at least 1 character/);
    });
  });

  describe('Tag Validation', () => {
    it('should reject tags with only whitespace', async () => {
      await expect(
        db.createTag('   ')
      ).rejects.toThrow('Tag name cannot be empty or whitespace only');
    });

    it('should reject empty tags', async () => {
      await expect(
        db.createTag('')
      ).rejects.toThrow('Tag name cannot be empty or whitespace only');
    });

    it('should trim whitespace from tags', async () => {
      await db.createTag('  test-tag  ');
      const tags = await db.getAllTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('test-tag');
      expect(tagNames).not.toContain('  test-tag  ');
    });

    it('should handle whitespace in item tags', async () => {
      const created = await db.createTask(
        'issues', 
        'Test Issue', 
        'Test content', 
        'medium', 
        undefined, 
        ['  tag1  ', '   ', 'tag2', ''] // Mix of valid and invalid tags
      );
      
      // Should only store valid, trimmed tags
      expect(created.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('Limit Parameter Validation', () => {
    it('should ignore negative limit values', async () => {
      // Create multiple items
      await db.createTask('issues', 'Issue 1', 'Content 1');
      await db.createTask('issues', 'Issue 2', 'Content 2');
      await db.createTask('issues', 'Issue 3', 'Content 3');
      
      // Try with negative limit
      const items = await db.getItemRepository().getItems('issues', true, undefined, undefined, undefined, -10);
      
      // Should return all items (ignore negative limit)
      expect(items.length).toBe(3);
    });

    it('should ignore zero limit value', async () => {
      // Create multiple items
      await db.createTask('issues', 'Issue 1', 'Content 1');
      await db.createTask('issues', 'Issue 2', 'Content 2');
      await db.createTask('issues', 'Issue 3', 'Content 3');
      
      // Try with zero limit
      const items = await db.getItemRepository().getItems('issues', true, undefined, undefined, undefined, 0);
      
      // Should return all items (ignore zero limit)
      expect(items.length).toBe(3);
    });

    it('should apply positive limit correctly', async () => {
      // Create multiple items
      await db.createTask('issues', 'Issue 1', 'Content 1');
      await db.createTask('issues', 'Issue 2', 'Content 2');
      await db.createTask('issues', 'Issue 3', 'Content 3');
      
      // Try with positive limit
      const items = await db.getItemRepository().getItems('issues', true, undefined, undefined, undefined, 2);
      
      // Should return only 2 items
      expect(items.length).toBe(2);
    });

    it('should handle very large limit values', async () => {
      // Create multiple items
      await db.createTask('issues', 'Issue 1', 'Content 1');
      await db.createTask('issues', 'Issue 2', 'Content 2');
      await db.createTask('issues', 'Issue 3', 'Content 3');
      
      // Try with very large limit
      const items = await db.getItemRepository().getItems('issues', true, undefined, undefined, undefined, 999999);
      
      // Should return all available items
      expect(items.length).toBe(3);
    });

    it('should cap limit at maximum value', async () => {
      // Create many items sequentially to avoid ID conflicts
      for (let i = 1; i <= 15; i++) {
        await db.createTask('issues', `Issue ${i}`, `Content ${i}`);
      }
      
      // Try with limit exceeding max (10000)
      const items = await db.getItemRepository().getItems('issues', true, undefined, undefined, undefined, 20000);
      
      // Should return all items but respecting the internal cap of 10000
      expect(items.length).toBe(15); // All items, since we have less than 10000
    });
  });

  describe('Title Length Validation', () => {
    it('should reject titles longer than 500 characters', async () => {
      const longTitle = 'a'.repeat(501);
      
      await expect(
        db.createTask('issues', longTitle, 'Content')
      ).rejects.toThrow('Title must be 500 characters or less');
    });

    it('should accept titles exactly 500 characters', async () => {
      const maxTitle = 'あ'.repeat(500);
      
      const created = await db.createTask('issues', maxTitle, 'Content');
      expect(created.title).toBe(maxTitle);
      expect(created.title.length).toBe(500);
    });

    it('should reject long titles when updating', async () => {
      const created = await db.createTask('issues', 'Short title', 'Content');
      const longTitle = 'b'.repeat(501);
      
      await expect(
        db.getItemRepository().updateItem({ 
          type: 'issues', 
          id: created.id, 
          title: longTitle 
        })
      ).rejects.toThrow('Title must be 500 characters or less');
    });
  });

  describe('Self-Reference Validation', () => {
    it('should reject self-reference in related_tasks', async () => {
      const created = await db.createTask('issues', 'Test Issue', 'Content');
      
      await expect(
        db.getItemRepository().updateItem({ 
          type: 'issues',
          id: created.id,
          related_tasks: [`issues-${created.id}`] 
        })
      ).rejects.toThrow('Items cannot reference themselves');
    });

    it('should reject self-reference in related_documents', async () => {
      const created = await db.createDocument('docs', 'Test Doc', 'Content');
      
      await expect(
        db.getItemRepository().updateItem({ 
          type: 'docs',
          id: created.id,
          related_documents: [`docs-${created.id}`] 
        })
      ).rejects.toThrow('Items cannot reference themselves');
    });

    it('should reject self-reference in mixed related arrays', async () => {
      const created = await db.createTask('issues', 'Test Issue', 'Content');
      
      await expect(
        db.getItemRepository().updateItem({ 
          type: 'issues',
          id: created.id,
          related_tasks: ['issues-1', `issues-${created.id}`],
          related_documents: ['docs-1']
        })
      ).rejects.toThrow('Items cannot reference themselves');
    });
  });

  describe('Zero-Width Character Filtering', () => {
    it('should filter out zero-width characters from tags', async () => {
      const created = await db.createTask('issues', 'Test', 'Content', 'medium', undefined, [
        'normal-tag',
        '\u200B', // Zero-width space only
        'tag\u200Bwith\u200Bzero\u200Bwidth', // Tag with zero-width spaces
        '\u200B\u200B\u200B' // Multiple zero-width spaces
      ]);
      
      expect(created.tags).toEqual(['normal-tag', 'tagwithzerowidth']);
      expect(created.tags).not.toContain('\u200B');
      expect(created.tags).not.toContain('');
    });

    it('should filter zero-width characters from titles', async () => {
      const created = await db.createTask('issues', 'Test\u200BTitle\u200B', 'Content');
      expect(created.title).toBe('TestTitle');
    });

    it('should handle other invisible characters', async () => {
      const created = await db.createTask('issues', 'Test', 'Content', 'medium', undefined, [
        'tag\u200C\u200D\uFEFF', // Zero-width non-joiner, zero-width joiner, BOM
        '\u2060word\u2061joiner\u2062', // Word joiner, function application, invisible times
        'normal-tag'
      ]);
      
      // BOM文字などが削除されることで、単語が分割される場合もある
      expect(created.tags).toEqual(['tag', 'wordjoiner', 'normal-tag']);
    });
  });

  describe('Related Fields Validation', () => {
    it('should reject empty strings in related_tasks array', async () => {
      await expect(
        db.createTask('issues', 'Test Issue', 'Test content', 'medium', undefined, [], undefined, undefined, undefined, ['issues-1', '', 'plans-1'])
      ).rejects.toThrow('Related items cannot contain empty strings');
    });

    it('should reject empty strings in related_documents array', async () => {
      await expect(
        db.createTask('issues', 'Test Issue', 'Test content', 'medium', undefined, [], undefined, undefined, undefined, undefined, ['docs-1', '', 'knowledge-1'])
      ).rejects.toThrow('Related items cannot contain empty strings');
    });

    it('should reject empty strings in related array when updating', async () => {
      // Create the item first, then try to update with empty string in related field
      const created = await db.createTask('issues', 'Test Issue', 'Test content');
      
      await expect(
        db.updateTask(
          'issues', 
          parseInt(created.id), 
          undefined, // title
          undefined, // content
          undefined, // priority
          undefined, // status
          undefined, // tags
          undefined, // description
          undefined, // start_date
          undefined, // end_date
          ['issues-2', '', 'plans-1'] // related_tasks
        )
      ).rejects.toThrow('Related items cannot contain empty strings');
    });

    it('should reject empty strings in related_documents when updating', async () => {
      // First create an item
      const created = await db.createTask('issues', 'Test Issue', 'Test content');

      // Try to update with empty strings
      await expect(
        db.updateTask(
          'issues', 
          parseInt(created.id), 
          undefined, // title
          undefined, // content
          undefined, // priority
          undefined, // status
          undefined, // tags
          undefined, // description
          undefined, // start_date
          undefined, // end_date
          undefined, // related_tasks
          ['docs-1', '', 'knowledge-1'] // related_documents
        )
      ).rejects.toThrow('Related items cannot contain empty strings');
    });
  });
});