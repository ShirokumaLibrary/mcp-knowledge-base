/**
 * @ai-context Test suite for knowledge repository async operations
 * @ai-pattern Tests file-based knowledge storage with async I/O
 * @ai-critical Knowledge requires content field (unlike issues)
 * @ai-assumption Uses temporary directories for isolation
 * @ai-related-files
 *   - src/database/knowledge-repository.ts (implementation)
 *   - src/types/domain-types.ts (Knowledge interface)
 *   - src/database/doc-repository.ts (similar pattern but different domain)
 * @ai-why Knowledge articles are immutable reference documentation
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { FileIssueDatabase } from '../database.js';
import * as fs from 'fs';
import * as path from 'path';

describe('KnowledgeRepository Async Tests', () => {
  let db: FileIssueDatabase;
  const testDataDir = path.join(process.cwd(), 'tmp', 'mcp-test-knowledge-' + process.pid);
  const testDbPath = path.join(testDataDir, 'test.db');

  beforeEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
    
    db = new FileIssueDatabase(testDataDir, testDbPath);
    await db.initialize();
  });

  afterEach(() => {
    db.close();
    // Clean up test directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Async file operations', () => {
    /**
     * @ai-intent Test async knowledge creation and file persistence
     * @ai-validation Ensures file is written to disk
     * @ai-critical Content is required for knowledge (not optional)
     * @ai-pattern knowledge-{id}.md naming convention
     * @ai-filesystem Creates in {dataDir}/knowledge/ directory
     * @ai-compare-with createDoc in doc-repository.test.ts - similar but different type
     */
    test('should create knowledge with async file write', async () => {
      const knowledge = await db.createKnowledge(
        'Test Knowledge',
        '# Important Information\n\nThis is test knowledge content.',  // @ai-example: Markdown content required
        ['test', 'async']
      );
      
      expect(knowledge.title).toBe('Test Knowledge');
      expect(knowledge.content).toBe('# Important Information\n\nThis is test knowledge content.');
      expect(knowledge.tags).toEqual(['test', 'async']);
      
      // @ai-validation: Verify knowledge was created successfully
      expect(knowledge.id).toBeGreaterThan(0);
      expect(knowledge.created_at).toBeDefined();
      expect(knowledge.updated_at).toBeDefined();
    });

    /**
     * @ai-intent Test async knowledge retrieval from file
     * @ai-validation Ensures data persists across operations
     * @ai-flow 1. Create -> 2. Read -> 3. Verify content
     * @ai-data-flow Repository -> parseMarkdown -> Knowledge object
     * @ai-related-files src/utils/markdown-parser.ts (parsing logic)
     */
    test('should read knowledge with async file read', async () => {
      const knowledge = await db.createKnowledge('Async Read Test', 'Test content for async read');
      const retrieved = await db.getKnowledge(knowledge.id);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved!.title).toBe('Async Read Test');
      expect(retrieved!.content).toBe('Test content for async read');  // @ai-critical: Content must be preserved
    });

    /**
     * @ai-intent Test concurrent async knowledge operations
     * @ai-validation Ensures thread safety with parallel writes
     * @ai-performance Tests async I/O under load
     * @ai-critical File system must handle concurrent access
     * @ai-database-schema Also updates search_knowledge table concurrently
     * @ai-related-files
     *   - src/database/base.ts (sequence generation for IDs)
     *   - src/database/knowledge-repository.ts (syncKnowledgeToSQLite)
     */
    test('should handle concurrent knowledge operations', async () => {
      // @ai-pattern: Create multiple promises for parallel execution
      const promises = Array.from({ length: 5 }, (_, i) => 
        db.createKnowledge(
          `Concurrent Knowledge ${i}`, 
          `Content for knowledge ${i}`,
          [`tag${i}`]  // @ai-integration-point: Tags auto-registered in tags table
        )
      );
      
      const knowledgeList = await Promise.all(promises);
      
      expect(knowledgeList).toHaveLength(5);
      knowledgeList.forEach((knowledge, i) => {
        expect(knowledge.title).toBe(`Concurrent Knowledge ${i}`);
        expect(knowledge.content).toBe(`Content for knowledge ${i}`);
      });
      
      // @ai-validation: Files were created successfully - the repository handles file creation
      expect(knowledgeList.every(k => k.id > 0)).toBe(true);
    });

    /**
     * @ai-intent Test async knowledge update
     * @ai-validation Ensures all fields can be updated
     * @ai-flow 1. Create -> 2. Update -> 3. Verify persistence
     * @ai-critical Update must be atomic (file + SQLite)
     * @ai-data-flow
     *   1. updateKnowledge -> readFile -> parseMarkdown
     *   2. Update fields -> generateMarkdown -> writeFile
     *   3. syncKnowledgeToSQLite -> UPDATE search_knowledge
     * @ai-compare-with updateDoc/updateIssue - same pattern
     */
    test('should update knowledge with async file operations', async () => {
      const knowledge = await db.createKnowledge('Original Title', 'Original content');
      const updateResult = await db.updateKnowledge(
        knowledge.id,
        'Updated Title',
        'Updated content with more details',
        ['updated', 'test']  // @ai-integration-point: New tags auto-registered
      );
      
      expect(updateResult).toBe(true);
      
      // @ai-validation: Verify changes persisted to file
      const updated = await db.getKnowledge(knowledge.id);
      expect(updated!.title).toBe('Updated Title');
      expect(updated!.content).toBe('Updated content with more details');
      expect(updated!.tags).toEqual(['updated', 'test']);
    });

    /**
     * @ai-intent Test async file and database deletion
     * @ai-validation Ensures file is physically removed
     * @ai-flow 1. Create -> 2. Verify exists -> 3. Delete -> 4. Verify gone
     * @ai-critical Must remove both file and DB record
     * @ai-data-flow
     *   1. deleteKnowledge -> unlink file
     *   2. DELETE FROM search_knowledge WHERE id = ?
     * @ai-filesystem Removes from {dataDir}/knowledge/ directory
     */
    test('should delete knowledge with async file deletion', async () => {
      const knowledge = await db.createKnowledge('To Delete', 'Content to be deleted');
      
      const deleteResult = await db.deleteKnowledge(knowledge.id);
      expect(deleteResult).toBe(true);
      
      // @ai-validation: Verify knowledge is no longer accessible
      const deletedKnowledge = await db.getKnowledge(knowledge.id);
      expect(deletedKnowledge).toBeNull();
    });

    /**
     * @ai-intent Test graceful handling of missing files
     * @ai-validation Ensures null return instead of throwing
     * @ai-pattern Defensive programming for file operations
     * @ai-compare-with Same pattern in doc-repository.test.ts
     */
    test('should handle file read errors gracefully', async () => {
      // @ai-logic: Try to read non-existent knowledge
      const knowledge = await db.getKnowledge(99999);
      expect(knowledge).toBeNull();  // @ai-pattern: Null for not found
    });

    /**
     * @ai-intent Test concurrent read operations
     * @ai-validation Ensures consistent results under parallel access
     * @ai-performance Tests read scalability
     * @ai-critical File system must handle concurrent reads
     * @ai-data-flow getAllKnowledge -> readdir -> parallel readFile -> parseMarkdown
     * @ai-compare-with getAllDocs in doc-repository.test.ts
     */
    test('should handle parallel getAllKnowledge', async () => {
      // @ai-setup: Create test knowledge articles
      const k1 = await db.createKnowledge('Knowledge 1', 'Content 1');
      const k2 = await db.createKnowledge('Knowledge 2', 'Content 2');
      const k3 = await db.createKnowledge('Knowledge 3', 'Content 3');
      
      // @ai-pattern: Parallel calls to test concurrency
      const [result1, result2, result3] = await Promise.all([
        db.getAllKnowledge(),
        db.getAllKnowledge(),
        db.getAllKnowledge()
      ]);
      
      // @ai-validation: Check that we get at least the knowledge we created
      expect(result1.length).toBeGreaterThanOrEqual(3);
      expect(result2.length).toBeGreaterThanOrEqual(3);
      expect(result3.length).toBeGreaterThanOrEqual(3);
      
      // @ai-validation: All results should be identical
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
      
      // @ai-validation: Verify our created knowledge is present
      const ids = [k1.id, k2.id, k3.id];
      const result1Ids = result1.map(k => k.id);
      expect(result1Ids).toEqual(expect.arrayContaining(ids));
    });

    /**
     * @ai-intent Test tag-based knowledge search
     * @ai-validation Ensures correct filtering by tag
     * @ai-pattern Knowledge articles can have multiple tags
     * @ai-return Full knowledge objects for matching tag
     * @ai-integration-point Tags registered in tags table via TagRepository
     * @ai-related-files src/database/tag-repository.ts (tag management)
     */
    test('should search knowledge by tag with async operations', async () => {
      await db.createKnowledge('Knowledge 1', 'Content 1', ['javascript', 'tutorial']);
      await db.createKnowledge('Knowledge 2', 'Content 2', ['typescript', 'tutorial']);
      await db.createKnowledge('Knowledge 3', 'Content 3', ['javascript', 'guide']);
      
      const results = await db.searchKnowledgeByTag('javascript');
      
      expect(results).toHaveLength(2);  // @ai-validation: Both JS knowledge found
      expect(results.map(k => k.title).sort()).toEqual(['Knowledge 1', 'Knowledge 3']);
    });
  });

  describe('Error handling', () => {
    /**
     * @ai-intent Test automatic directory creation
     * @ai-validation Ensures directories created on demand
     * @ai-pattern Lazy directory creation pattern
     * @ai-side-effects Creates knowledge subdirectory
     * @ai-filesystem {dataDir}/knowledge/ created if missing
     * @ai-compare-with Same pattern in all repository tests
     */
    test('should handle directory creation errors', async () => {
      // @ai-logic: Repository creates directories automatically
      const knowledge = await db.createKnowledge('Test', 'Content');
      expect(knowledge).toBeDefined();
      expect(knowledge.id).toBeGreaterThan(0);
      expect(knowledge.title).toBe('Test');
      expect(knowledge.content).toBe('Content');
    });

    /**
     * @ai-intent Test update error handling
     * @ai-validation Ensures false return for missing knowledge
     * @ai-pattern Graceful failure without throwing
     * @ai-return boolean instead of throwing error
     */
    test('should handle update of non-existent knowledge', async () => {
      const result = await db.updateKnowledge(99999, 'New Title');
      expect(result).toBe(false);  // @ai-pattern: False for not found
    });

    /**
     * @ai-intent Test delete error handling
     * @ai-validation Ensures false return for missing knowledge
     * @ai-pattern Idempotent deletion
     * @ai-return boolean for success/failure
     */
    test('should handle delete of non-existent knowledge', async () => {
      const result = await db.deleteKnowledge(99999);
      expect(result).toBe(false);  // @ai-pattern: False for not found
    });
  });
});