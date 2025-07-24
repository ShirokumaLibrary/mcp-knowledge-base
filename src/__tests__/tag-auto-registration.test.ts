/**
 * @ai-context Test suite for automatic tag creation across all entities
 * @ai-pattern Tests tag auto-registration when entities are created/updated
 * @ai-critical Tags must be automatically created when referenced
 * @ai-assumption Tag names are case-sensitive and unique
 * @ai-related-files
 *   - src/database/tag-repository.ts (auto-registration logic)
 *   - src/database/*-repository.ts (all entities that use tags)
 *   - src/types/domain-types.ts (Tag interface)
 * @ai-why Simplifies UX by not requiring manual tag creation
 * @ai-integration-point All repository create/update methods trigger tag registration
 */

import { beforeEach, afterEach, describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { FileIssueDatabase } from '../database/index.js';

describe('Tag Auto Registration', () => {
  let db: FileIssueDatabase;
  const testDir = '/home/webapp/mcp/tmp/mcp-test-tag-auto-' + process.pid;
  const dbPath = path.join(testDir, 'test.db');

  /**
   * @ai-intent Set up clean test environment
   * @ai-flow 1. Remove old data -> 2. Create dirs -> 3. Init database
   * @ai-critical Must await initialization for tag table creation
   * @ai-side-effects Creates test directories and SQLite database
   * @ai-database-schema Creates tags table during initialization
   */
  beforeEach(async () => {
    // @ai-logic: Clean slate for test isolation
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    db = new FileIssueDatabase(testDir, dbPath);
    await db.initialize();  // @ai-critical: Creates tags table
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('Issue tag auto-registration', () => {
    /**
     * @ai-intent Test tag creation during issue creation
     * @ai-validation Verifies tags are created in tags table
     * @ai-flow 1. Create issue with tags -> 2. Tags auto-registered -> 3. Verify
     * @ai-data-flow createIssue -> autoRegisterTags -> INSERT INTO tags
     * @ai-database-schema Tags stored in tags table with name as primary key
     */
    it('should automatically create tags when creating issue', async () => {
      // Create issue with new tags
      await db.createIssue('Test Issue', 'Description', 'high', undefined, ['auto-tag1', 'auto-tag2']);
      
      // Verify tags were created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('auto-tag1');
      expect(tagNames).toContain('auto-tag2');
    });

    /**
     * @ai-intent Test idempotent tag creation
     * @ai-validation Ensures no duplicate tags are created
     * @ai-critical UNIQUE constraint prevents duplicates
     * @ai-pattern INSERT OR IGNORE for safe concurrent access
     * @ai-edge-case Pre-existing tags should not cause errors
     */
    it('should not duplicate existing tags when creating issue', async () => {
      // Pre-create a tag
      await db.createTag('existing-tag');
      
      // Create issue with existing and new tags
      await db.createIssue('Test Issue', 'Description', 'high', undefined, ['existing-tag', 'new-tag']);
      
      // Verify only one instance of each tag exists
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames.filter(name => name === 'existing-tag')).toHaveLength(1);
      expect(tagNames).toContain('new-tag');
    });

    /**
     * @ai-intent Test tag creation during issue update
     * @ai-validation New tags added during update are registered
     * @ai-flow 1. Create issue -> 2. Update with new tags -> 3. Tags registered
     * @ai-pattern Update operations also trigger auto-registration
     * @ai-compare-with Create operation uses same registration logic
     */
    it('should automatically create tags when updating issue', async () => {
      // Create issue without tags
      const issue = await db.createIssue('Test Issue', 'Description', 'high');
      
      // Update issue with new tags
      await db.updateIssue(issue.id, undefined, undefined, undefined, undefined, ['update-tag1', 'update-tag2']);
      
      // Verify tags were created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('update-tag1');
      expect(tagNames).toContain('update-tag2');
    });
  });

  describe('Plan tag auto-registration', () => {
    /**
     * @ai-intent Test tag creation during plan creation
     * @ai-validation Plans with timeline data still register tags
     * @ai-flow 1. Create plan with dates/tags -> 2. Tags auto-registered
     * @ai-pattern Same auto-registration as issues
     * @ai-integration-point TagRepository.autoRegisterTags called
     */
    it('should automatically create tags when creating plan', async () => {
      // Create plan with new tags
      await db.createPlan('Test Plan', 'Description', 'high', undefined, '2025-01-01', '2025-12-31', ['plan-tag1', 'plan-tag2']);
      
      // Verify tags were created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('plan-tag1');
      expect(tagNames).toContain('plan-tag2');
    });

    /**
     * @ai-intent Test tag creation during plan update
     * @ai-validation Partial updates with only tags work correctly
     * @ai-pattern undefined parameters skip update, tags still registered
     * @ai-edge-case Many undefined params in update call
     */
    it('should automatically create tags when updating plan', async () => {
      // Create plan without tags
      const plan = await db.createPlan('Test Plan', 'Description', 'high');
      
      // Update plan with new tags
      await db.updatePlan(plan.id, undefined, undefined, undefined, undefined, undefined, undefined, ['plan-update-tag']);
      
      // Verify tag was created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('plan-update-tag');
    });
  });

  describe('Knowledge tag auto-registration', () => {
    /**
     * @ai-intent Test tag creation for knowledge articles
     * @ai-validation Knowledge with content requires tag registration
     * @ai-critical Knowledge always requires content field
     * @ai-pattern Knowledge articles are reference documentation
     * @ai-compare-with Docs are similar but different purpose
     */
    it('should automatically create tags when creating knowledge', async () => {
      // Create knowledge with new tags
      await db.createKnowledge('Test Knowledge', 'Content', ['knowledge-tag1', 'knowledge-tag2']);
      
      // Verify tags were created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('knowledge-tag1');
      expect(tagNames).toContain('knowledge-tag2');
    });

    /**
     * @ai-intent Test tag update for knowledge articles
     * @ai-validation Empty initial tags can be updated later
     * @ai-pattern [] empty array is valid initial state
     * @ai-flow 1. Create without tags -> 2. Update adds tags -> 3. Auto-register
     */
    it('should automatically create tags when updating knowledge', async () => {
      // Create knowledge without tags
      const knowledge = await db.createKnowledge('Test Knowledge', 'Content', []);
      
      // Update knowledge with new tags
      await db.updateKnowledge(knowledge.id, undefined, undefined, ['knowledge-update-tag']);
      
      // Verify tag was created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('knowledge-update-tag');
    });
  });

  describe('Doc tag auto-registration', () => {
    /**
     * @ai-intent Test tag creation for technical docs
     * @ai-validation Docs follow same tag pattern as knowledge
     * @ai-pattern Technical documentation vs reference knowledge
     * @ai-compare-with Knowledge tests - identical pattern
     */
    it('should automatically create tags when creating doc', async () => {
      // Create doc with new tags
      await db.createDoc('Test Doc', 'Content', ['doc-tag1', 'doc-tag2']);
      
      // Verify tags were created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('doc-tag1');
      expect(tagNames).toContain('doc-tag2');
    });

    /**
     * @ai-intent Test tag update for docs
     * @ai-validation Update with partial fields still registers tags
     * @ai-pattern undefined skips field update, tags still processed
     * @ai-data-flow updateDoc -> autoRegisterTags -> INSERT OR IGNORE
     */
    it('should automatically create tags when updating doc', async () => {
      // Create doc without tags
      const doc = await db.createDoc('Test Doc', 'Content', []);
      
      // Update doc with new tags
      await db.updateDoc(doc.id, undefined, undefined, ['doc-update-tag']);
      
      // Verify tag was created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('doc-update-tag');
    });
  });

  describe('Session tag auto-registration', () => {
    /**
     * @ai-intent Test tag creation for work sessions
     * @ai-validation Session sync operations register tags
     * @ai-critical Sessions use different sync method than CRUD
     * @ai-pattern Sessions have time tracking fields
     * @ai-filesystem Sessions stored by date in YYYY-MM-DD directories
     * @ai-database-schema work_sessions table with time fields
     */
    it('should automatically create tags when syncing session', async () => {
      // Create a session with new tags
      const session = {
        id: 'test-session-1',
        title: 'Test Session',
        description: 'Test Description',
        category: 'development',
        tags: ['session-tag1', 'session-tag2'],
        date: '2025-01-24',
        startTime: '10:00:00',
        endTime: '12:00:00',
        summary: 'Test summary'
      };
      
      await db.syncSessionToSQLite(session);
      
      // Verify tags were created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('session-tag1');
      expect(tagNames).toContain('session-tag2');
    });

    /**
     * @ai-intent Test tag creation for daily summaries
     * @ai-validation Daily summary sync registers tags
     * @ai-pattern One summary per day constraint
     * @ai-critical Summaries aggregate daily work
     * @ai-database-schema daily_summaries table keyed by date
     * @ai-filesystem Stored in sessions/YYYY-MM-DD/daily-summary-YYYY-MM-DD.md
     */
    it('should automatically create tags when syncing daily summary', async () => {
      // Create a daily summary with new tags
      const summary = {
        date: '2025-01-24',
        title: 'Daily Summary',
        content: 'Test content',
        tags: ['summary-tag1', 'summary-tag2'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.syncDailySummaryToSQLite(summary);
      
      // Verify tags were created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      expect(tagNames).toContain('summary-tag1');
      expect(tagNames).toContain('summary-tag2');
    });
  });

  describe('Batch tag creation', () => {
    /**
     * @ai-intent Test concurrent tag creation across entity types
     * @ai-validation Ensures thread-safe tag registration
     * @ai-performance Parallel operations don't cause duplicates
     * @ai-critical Common tags shared across entities
     * @ai-pattern Promise.all for concurrent operations
     * @ai-database-schema INSERT OR IGNORE prevents race conditions
     * @ai-edge-case Same tag used by multiple entity types
     */
    it('should efficiently create multiple tags at once', async () => {
      // Create multiple items with overlapping tags
      await Promise.all([
        db.createIssue('Issue 1', 'Desc', 'high', undefined, ['common-tag', 'issue-specific']),
        db.createPlan('Plan 1', 'Desc', 'medium', undefined, undefined, undefined, ['common-tag', 'plan-specific']),
        db.createKnowledge('Knowledge 1', 'Content', ['common-tag', 'knowledge-specific']),
        db.createDoc('Doc 1', 'Content', ['common-tag', 'doc-specific'])
      ]);
      
      // Verify all unique tags were created
      const tags = await db.getTags();
      const tagNames = tags.map(t => t.name);
      
      expect(tagNames).toContain('common-tag');
      expect(tagNames).toContain('issue-specific');
      expect(tagNames).toContain('plan-specific');
      expect(tagNames).toContain('knowledge-specific');
      expect(tagNames).toContain('doc-specific');
      
      // Verify no duplicates
      const commonTagCount = tagNames.filter(name => name === 'common-tag').length;
      expect(commonTagCount).toBe(1);
    });
  });
});