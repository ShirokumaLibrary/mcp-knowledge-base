/**
 * @ai-context Integration tests for unified API with sessions and dailies
 * @ai-pattern Test actual API behavior with MCP server
 * @ai-critical Ensures backward compatibility during API migration
 */

import { FileIssueDatabase } from '../../src/database/index.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { createUnifiedHandlers } from '../../src/handlers/unified-handlers.js';

describe('API Integration - Sessions and Dailies', () => {
  let tempDir: string;
  let database: FileIssueDatabase;
  let handlers: ReturnType<typeof createUnifiedHandlers>;

  beforeEach(async () => {
    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'api-integration-test-'));
    const dataDir = path.join(tempDir, '.shirokuma/data');
    
    // Create required directories
    const dirs = ['issues', 'plans', 'docs', 'knowledge', 'sessions', 'sessions/dailies'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(dataDir, dir), { recursive: true });
    }
    
    // Initialize database
    database = new FileIssueDatabase(dataDir);
    await database.initialize();
    
    // Create handlers
    handlers = createUnifiedHandlers(database);
  });

  afterEach(async () => {
    await database.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Sessions Integration', () => {
    it('should create session with create_item', async () => {
      const result = await handlers.create_item({
        type: 'sessions',
        title: 'Morning Work Session',
        content: 'Working on API integration',
        tags: ['development', 'api']
      });

      expect(result.type).toBe('sessions');
      expect(result.title).toBe('Morning Work Session');
      expect(result.content).toBe('Working on API integration');
      expect(result.tags).toEqual(['development', 'api']);
      expect(result.id).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/);
    });

    it('should create session with custom datetime', async () => {
      const customDate = '2025-07-01T10:30:00.000Z';
      const result = await handlers.create_item({
        type: 'sessions',
        title: 'Past Session',
        content: 'Historical data',
        datetime: customDate
      });

      expect(result.created_at).toBe(customDate);
      expect(result.start_date).toBe('2025-07-01');
      expect(result.id).toMatch(/^2025-07-01-/);
    });

    it('should create session with custom ID', async () => {
      const customId = '2025-07-20-custom-session';
      const result = await handlers.create_item({
        type: 'sessions',
        title: 'Custom ID Session',
        content: 'Session with custom ID',
        id: customId
      });

      expect(result.id).toBe(customId);
    });

    it('should get latest session with limit=1', async () => {
      // First clear any existing sessions
      const dbInstance = database.getDatabase();
      await dbInstance.runAsync('DELETE FROM items WHERE type = ?', ['sessions']);
      
      // Create multiple sessions
      await handlers.create_item({
        type: 'sessions',
        title: 'First Session',
        content: 'First'
      });

      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamp

      const latest = await handlers.create_item({
        type: 'sessions',
        title: 'Latest Session',
        content: 'Latest'
      });

      // Get latest session - with limit=1 for sessions, it gets today's sessions only
      const results = await handlers.get_items({
        type: 'sessions',
        limit: 1
      });

      // Both sessions are created today, so it should return one of them
      expect(results.length).toBe(1);
      // Since both are today's sessions, it returns the most recent one
      expect(results[0].title).toBe('Latest Session');
    });

    it('should filter sessions by date range', async () => {
      // First clear any existing sessions
      const dbInstance = database.getDatabase();
      await dbInstance.runAsync('DELETE FROM items WHERE type = ?', ['sessions']);
      // Create sessions on different dates
      await handlers.create_item({
        type: 'sessions',
        title: 'July 1st Session',
        content: 'Old session',
        datetime: '2025-07-01T10:00:00.000Z'
      });

      await handlers.create_item({
        type: 'sessions',
        title: 'July 15th Session',
        content: 'Mid-month session',
        datetime: '2025-07-15T10:00:00.000Z'
      });

      await handlers.create_item({
        type: 'sessions',
        title: 'July 30th Session',
        content: 'Recent session',
        datetime: '2025-07-30T10:00:00.000Z'
      });

      // Get sessions from July 10-20
      const results = await handlers.get_items({
        type: 'sessions',
        start_date: '2025-07-10',
        end_date: '2025-07-20'
      });

      expect(results.length).toBe(1);
      expect(results[0].title).toBe('July 15th Session');
      // ListItem doesn't have start_date, sessions have date field
      expect(results[0].date).toBe('2025-07-15');
    });

    it('should get session detail by ID', async () => {
      const session = await handlers.create_item({
        type: 'sessions',
        title: 'Test Session',
        content: 'Session content',
        tags: ['test']
      });

      const detail = await handlers.get_item_detail({
        type: 'sessions',
        id: session.id
      });

      expect(detail.id).toBe(session.id);
      expect(detail.title).toBe('Test Session');
      expect(detail.content).toBe('Session content');
      expect(detail.tags).toEqual(['test']);
    });

    it('should update session', async () => {
      const session = await handlers.create_item({
        type: 'sessions',
        title: 'Original Title',
        content: 'Original content'
      });

      const updated = await handlers.update_item({
        type: 'sessions',
        id: session.id,
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated']
      });

      expect(updated.id).toBe(session.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Updated content');
      expect(updated.tags).toEqual(['updated']);
    });

    it('should search sessions by tag', async () => {
      await handlers.create_item({
        type: 'sessions',
        title: 'Session 1',
        content: 'Content',
        tags: ['work', 'morning']
      });

      await handlers.create_item({
        type: 'sessions',
        title: 'Session 2',
        content: 'Content',
        tags: ['work', 'afternoon']
      });

      await handlers.create_item({
        type: 'sessions',
        title: 'Session 3',
        content: 'Content',
        tags: ['personal']
      });

      const results = await handlers.search_items_by_tag({
        tag: 'work',
        types: ['sessions']
      });

      // Results are in the old format, so we need to extract sessions
      const sessions = results.tasks?.sessions || results.documents?.sessions || [];
      expect(sessions).toHaveLength(2);
      expect(sessions.map((s: any) => s.title)).toContain('Session 1');
      expect(sessions.map((s: any) => s.title)).toContain('Session 2');
    });
  });

  describe('Daily Summaries Integration', () => {
    it('should create daily summary with create_item', async () => {
      const result = await handlers.create_item({
        type: 'dailies',
        title: 'Daily Summary for July 28',
        content: 'Today was productive...',
        date: '2025-07-28',
        tags: ['daily', 'summary']
      });

      expect(result.type).toBe('dailies');
      expect(result.id).toBe('2025-07-28');
      expect(result.title).toBe('Daily Summary for July 28');
      expect(result.content).toBe('Today was productive...');
      expect(result.tags).toEqual(['daily', 'summary']);
    });

    it('should auto-generate date for daily if not provided', async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await handlers.create_item({
        type: 'dailies',
        title: 'Today Summary',
        content: 'Today\'s work'
      });

      expect(result.id).toBe(today);
      expect(result.start_date).toBe(today);
    });

    it('should prevent duplicate daily summaries', async () => {
      await handlers.create_item({
        type: 'dailies',
        title: 'First Summary',
        content: 'Content',
        date: '2025-07-28'
      });

      await expect(handlers.create_item({
        type: 'dailies',
        title: 'Second Summary',
        content: 'Content',
        date: '2025-07-28'
      })).rejects.toThrow('Daily summary for 2025-07-28 already exists');
    });

    it('should get daily summaries by date range', async () => {
      // First clear any existing dailies
      const dbInstance = database.getDatabase();
      await dbInstance.runAsync('DELETE FROM items WHERE type = ?', ['dailies']);
      // Create summaries for different dates
      await handlers.create_item({
        type: 'dailies',
        title: 'July 1 Summary',
        content: 'Content',
        date: '2025-07-01'
      });

      await handlers.create_item({
        type: 'dailies',
        title: 'July 15 Summary',
        content: 'Content',
        date: '2025-07-15'
      });

      await handlers.create_item({
        type: 'dailies',
        title: 'July 30 Summary',
        content: 'Content',
        date: '2025-07-30'
      });

      // Get summaries for last week of July
      const results = await handlers.get_items({
        type: 'dailies',
        start_date: '2025-07-25',
        end_date: '2025-07-31'
      });

      expect(results.length).toBe(1);
      expect(results[0].title).toBe('July 30 Summary');
      // ListItem doesn't have start_date, dailies have date field 
      expect(results[0].date).toBe('2025-07-30');
    });

    it('should get daily summary detail by date', async () => {
      const summary = await handlers.create_item({
        type: 'dailies',
        title: 'Test Summary',
        content: 'Summary content',
        date: '2025-07-28',
        tags: ['test']
      });

      const detail = await handlers.get_item_detail({
        type: 'dailies',
        id: '2025-07-28'
      });

      expect(detail.id).toBe('2025-07-28');
      expect(detail.title).toBe('Test Summary');
      expect(detail.content).toBe('Summary content');
      expect(detail.tags).toEqual(['test']);
    });

    it('should update daily summary', async () => {
      await handlers.create_item({
        type: 'dailies',
        title: 'Original Summary',
        content: 'Original content',
        date: '2025-07-28'
      });

      const updated = await handlers.update_item({
        type: 'dailies',
        id: '2025-07-28',
        title: 'Updated Summary',
        content: 'Updated content',
        tags: ['updated']
      });

      expect(updated.id).toBe('2025-07-28');
      expect(updated.title).toBe('Updated Summary');
      expect(updated.content).toBe('Updated content');
      expect(updated.tags).toEqual(['updated']);
    });
  });

  describe('Date Filtering Behavior', () => {
    it('should filter sessions/dailies by start_date, others by updated_at', async () => {
      // First clear any existing items
      const dbInstance = database.getDatabase();
      await dbInstance.runAsync('DELETE FROM items WHERE type IN (?, ?)', ['sessions', 'docs']);
      // Create items with different dates
      const oldDate = '2025-07-01T10:00:00.000Z';
      const recentDate = '2025-07-20T10:00:00.000Z';

      // Create old session
      await handlers.create_item({
        type: 'sessions',
        title: 'Old Session',
        content: 'Content',
        datetime: oldDate
      });

      // Create recent session
      await handlers.create_item({
        type: 'sessions',
        title: 'Recent Session',
        content: 'Content',
        datetime: recentDate
      });

      // Create old document
      const oldDoc = await handlers.create_item({
        type: 'docs',
        title: 'Old Document',
        content: 'Content'
      });

      // Manually update its timestamp to be old
      const db = database.getDatabase();
      await db.runAsync(
        'UPDATE items SET updated_at = ? WHERE type = ? AND id = ?',
        [oldDate, 'docs', oldDoc.id]
      );

      // Create recent document
      await handlers.create_item({
        type: 'docs',
        title: 'Recent Document',
        content: 'Content'
      });

      // Get recent sessions (filtered by start_date)
      const recentSessions = await handlers.get_items({
        type: 'sessions',
        start_date: '2025-07-15'
      });

      expect(recentSessions.length).toBe(1);
      expect(recentSessions[0].title).toBe('Recent Session');

      // Get recent documents (filtered by updated_at)
      const recentDocs = await handlers.get_items({
        type: 'docs',
        start_date: '2025-07-15'
      });

      expect(recentDocs.length).toBe(1);
      expect(recentDocs[0].title).toBe('Recent Document');
    });
  });
});