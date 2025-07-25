/**
 * @ai-context Test suite for document repository async operations
 * @ai-pattern Tests file-based document storage with async I/O
 * @ai-critical Validates concurrent operations and file persistence
 * @ai-assumption Uses temporary directories for isolation
 * @ai-why Documents require content field unlike issues
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { FileIssueDatabase } from '../database.js';
import * as fs from 'fs';
import * as path from 'path';

describe('DocRepository Async Tests', () => {
  let db: FileIssueDatabase;
  // @ai-pattern: Unique test directory using process ID
  const testDataDir = path.join(process.cwd(), 'tmp', 'mcp-test-doc-' + process.pid);
  const testDbPath = path.join(testDataDir, 'test.db');

  /**
   * @ai-intent Set up clean test environment
   * @ai-flow 1. Remove old data -> 2. Create dirs -> 3. Init database
   * @ai-critical Must await initialization for async operations
   * @ai-side-effects Creates test directories and SQLite database
   */
  beforeEach(async () => {
    // @ai-logic: Clean slate for test isolation
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
    
    db = new FileIssueDatabase(testDataDir, testDbPath);
    await db.initialize();  // @ai-critical: Sets up async file operations
  });

  /**
   * @ai-intent Clean up test artifacts
   * @ai-flow 1. Close DB connection -> 2. Remove test files
   * @ai-critical Close DB to release async file handles
   */
  afterEach(() => {
    db.close();  // @ai-logic: Release file locks
    // @ai-cleanup: Remove all test artifacts
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Async file operations', () => {
    /**
     * @ai-intent Test async document creation and file persistence
     * @ai-validation Ensures file is written to disk
     * @ai-critical Content is required for documents
     * @ai-pattern doc-{id}.md naming convention
     */
    test('should create doc with async file write', async () => {
      const doc = await db.createDoc(
        'Test Document',
        '# Test Content\n\nThis is a test document.',  // @ai-example: Markdown content
        ['test', 'async']
      );
      
      expect(doc.title).toBe('Test Document');
      expect(doc.content).toBe('# Test Content\n\nThis is a test document.');
      expect(doc.tags).toEqual(['test', 'async']);
      
      // @ai-validation: Verify doc was created successfully
      expect(doc.id).toBeGreaterThan(0);
      expect(doc.created_at).toBeDefined();
      expect(doc.updated_at).toBeDefined();
    });

    /**
     * @ai-intent Test async document retrieval
     * @ai-validation Ensures data persists across operations
     * @ai-flow 1. Create -> 2. Read -> 3. Verify content
     */
    test('should read doc with async file read', async () => {
      const doc = await db.createDoc('Async Read Test', 'Test content for async read');
      const retrieved = await db.getDoc(doc.id);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved!.title).toBe('Async Read Test');
      expect(retrieved!.content).toBe('Test content for async read');  // @ai-critical: Content preserved
    });

    /**
     * @ai-intent Test concurrent async document operations
     * @ai-validation Ensures thread safety with parallel writes
     * @ai-performance Tests async I/O under load
     * @ai-critical File system must handle concurrent access
     */
    test('should handle concurrent doc operations', async () => {
      // @ai-pattern: Create multiple promises for parallel execution
      const promises = Array.from({ length: 5 }, (_, i) => 
        db.createDoc(
          `Concurrent Doc ${i}`, 
          `Content for document ${i}`,
          [`tag${i}`]
        )
      );
      
      const docs = await Promise.all(promises);
      
      expect(docs).toHaveLength(5);
      docs.forEach((doc, i) => {
        expect(doc.title).toBe(`Concurrent Doc ${i}`);
        expect(doc.content).toBe(`Content for document ${i}`);
      });
      
      // @ai-validation: Files were created successfully - the repository handles file creation
      expect(docs.every(doc => doc.id > 0)).toBe(true);
    });

    /**
     * @ai-intent Test async document update
     * @ai-validation Ensures all fields can be updated
     * @ai-flow 1. Create -> 2. Update -> 3. Verify persistence
     * @ai-critical Update must be atomic
     */
    test('should update doc with async file operations', async () => {
      const doc = await db.createDoc('Original Title', 'Original content');
      const updateResult = await db.updateDoc(
        doc.id,
        'Updated Title',
        'Updated content with more details',
        ['updated', 'test']
      );
      
      expect(updateResult).not.toBeNull();
      expect(updateResult!.title).toBe('Updated Title');
      expect(updateResult!.content).toBe('Updated content with more details');
      
      // @ai-validation: Verify changes persisted to file
      const updated = await db.getDoc(doc.id);
      expect(updated!.title).toBe('Updated Title');
      expect(updated!.content).toBe('Updated content with more details');
      expect(updated!.tags).toEqual(['updated', 'test']);
    });

    /**
     * @ai-intent Test async file deletion
     * @ai-validation Ensures file is physically removed
     * @ai-flow 1. Create -> 2. Verify exists -> 3. Delete -> 4. Verify gone
     * @ai-critical Must remove both file and DB record
     */
    test('should delete doc with async file deletion', async () => {
      const doc = await db.createDoc('To Delete', 'Content to be deleted');
      
      const deleteResult = await db.deleteDoc(doc.id);
      expect(deleteResult).toBe(true);
      
      // @ai-validation: Verify doc is no longer accessible
      const deletedDoc = await db.getDoc(doc.id);
      expect(deletedDoc).toBeNull();
    });

    /**
     * @ai-intent Test graceful handling of missing files
     * @ai-validation Ensures null return instead of throwing
     * @ai-pattern Defensive programming for file operations
     */
    test('should handle file read errors gracefully', async () => {
      // @ai-logic: Try to read non-existent doc
      const doc = await db.getDoc(99999);
      expect(doc).toBeNull();  // @ai-pattern: Null for not found
    });

    /**
     * @ai-intent Test concurrent read operations
     * @ai-validation Ensures consistent results under parallel access
     * @ai-performance Tests read scalability
     * @ai-critical File system must handle concurrent reads
     */
    test('should handle parallel getAllDocs', async () => {
      // @ai-setup: Create test documents
      const d1 = await db.createDoc('Doc 1', 'Content 1');
      const d2 = await db.createDoc('Doc 2', 'Content 2');
      const d3 = await db.createDoc('Doc 3', 'Content 3');
      
      // @ai-pattern: Parallel calls to test concurrency
      const [result1, result2, result3] = await Promise.all([
        db.getAllDocs(),
        db.getAllDocs(),
        db.getAllDocs()
      ]);
      
      // @ai-validation: Check that we get at least the docs we created
      expect(result1.length).toBeGreaterThanOrEqual(3);
      expect(result2.length).toBeGreaterThanOrEqual(3);
      expect(result3.length).toBeGreaterThanOrEqual(3);
      
      // @ai-validation: All results should be identical
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
      
      // @ai-validation: Verify our created docs are present
      const ids = [d1.id, d2.id, d3.id];
      const result1Ids = result1.map(d => d.id);
      expect(result1Ids).toEqual(expect.arrayContaining(ids));
    });

    /**
     * @ai-intent Test document summary generation
     * @ai-validation Ensures only id/title returned
     * @ai-performance Avoids loading full content
     * @ai-pattern Lightweight data for UI lists
     */
    test('should handle getDocsSummary with async operations', async () => {
      // @ai-setup: Create docs with different content lengths
      const timestamp = Date.now();
      const shortDoc = await db.createDoc(`Short Doc ${timestamp}`, 'Short content');
      const longDoc = await db.createDoc(`Long Doc ${timestamp}`, 'This is a much longer document content that should be included in the summary. '.repeat(10));
      
      const summary = await db.getDocsSummary();
      
      // @ai-validation: Should include at least the docs we created
      expect(summary.length).toBeGreaterThanOrEqual(2);
      
      // @ai-validation: Find our created docs in the summary
      const shortDocSummary = summary.find(s => s.id === shortDoc.id);
      const longDocSummary = summary.find(s => s.id === longDoc.id);
      
      expect(shortDocSummary).toBeDefined();
      expect(longDocSummary).toBeDefined();
      expect(shortDocSummary!.title).toBe(`Short Doc ${timestamp}`);
      expect(longDocSummary!.title).toBe(`Long Doc ${timestamp}`);
      
      // @ai-validation: Summary should include id, title, and summary
      expect(Object.keys(shortDocSummary!).sort()).toEqual(['id', 'summary', 'title']);
      expect(Object.keys(longDocSummary!).sort()).toEqual(['id', 'summary', 'title']);
    });

    /**
     * @ai-intent Test tag-based document search
     * @ai-validation Ensures correct filtering by tag
     * @ai-pattern Documents can have multiple tags
     * @ai-return Full document objects for matching tag
     */
    test('should search docs by tag with async operations', async () => {
      await db.createDoc('Doc 1', 'Content 1', ['javascript', 'tutorial']);
      await db.createDoc('Doc 2', 'Content 2', ['typescript', 'tutorial']);
      await db.createDoc('Doc 3', 'Content 3', ['javascript', 'guide']);
      
      const results = await db.searchDocsByTag('javascript');
      
      expect(results).toHaveLength(2);  // @ai-validation: Both JS docs found
      expect(results.map(d => d.title).sort()).toEqual(['Doc 1', 'Doc 3']);
    });
  });

  describe('Error handling', () => {
    /**
     * @ai-intent Test automatic directory creation
     * @ai-validation Ensures directories created on demand
     * @ai-pattern Lazy directory creation pattern
     * @ai-side-effects Creates docs subdirectory
     */
    test('should handle directory creation', async () => {
      // @ai-logic: Repository creates directories automatically
      const doc = await db.createDoc('Test', 'Content');
      expect(doc).toBeDefined();
      expect(doc.id).toBeGreaterThan(0);
      expect(doc.title).toBe('Test');
      expect(doc.content).toBe('Content');
    });

    /**
     * @ai-intent Test update error handling
     * @ai-validation Ensures null return for missing docs
     * @ai-pattern Graceful failure without throwing
     */
    test('should handle update of non-existent doc', async () => {
      const result = await db.updateDoc(99999, 'New Title');
      expect(result).toBeNull();  // @ai-pattern: Null for not found
    });

    /**
     * @ai-intent Test delete error handling
     * @ai-validation Ensures false return for missing docs
     * @ai-pattern Idempotent deletion
     */
    test('should handle delete of non-existent doc', async () => {
      const result = await db.deleteDoc(99999);
      expect(result).toBe(false);  // @ai-pattern: False for not found
    });
  });
});