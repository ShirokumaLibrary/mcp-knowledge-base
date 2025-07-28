/**
 * @ai-context Test date range filtering in ItemRepository
 * @ai-pattern Unit tests for date-based queries
 */
import { FileIssueDatabase } from '../../database/index.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
describe('ItemRepository Date Filtering', () => {
    let testDataDir;
    let database;
    let itemRepo;
    beforeEach(async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'item-date-test-'));
        testDataDir = path.join(tempDir, '.shirokuma/data');
        // Create required directories
        await fs.mkdir(path.join(testDataDir, 'issues'), { recursive: true });
        await fs.mkdir(path.join(testDataDir, 'plans'), { recursive: true });
        await fs.mkdir(path.join(testDataDir, 'docs'), { recursive: true });
        await fs.mkdir(path.join(testDataDir, 'knowledge'), { recursive: true });
        await fs.mkdir(path.join(testDataDir, 'sessions'), { recursive: true });
        // Create database with explicit SQLite path in test directory
        const dbPath = path.join(testDataDir, 'search.db');
        database = new FileIssueDatabase(testDataDir, dbPath);
        await database.initialize();
        itemRepo = database.getItemRepository();
    });
    afterEach(async () => {
        await database.close();
        // Clean up test directory
        try {
            await fs.rm(path.dirname(testDataDir), { recursive: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    });
    describe('Date field mapping', () => {
        it('should filter sessions by start_date', async () => {
            // Create sessions
            const session1 = await itemRepo.createItem({
                type: 'sessions',
                title: 'Morning session',
                content: 'Session content'
            });
            // Update the date to test filtering
            const db = database.getDatabase();
            await db.runAsync('UPDATE items SET start_date = ? WHERE type = ? AND id = ?', ['2025-07-20', 'sessions', session1.id]);
            const session2 = await itemRepo.createItem({
                type: 'sessions',
                title: 'Today session',
                content: 'Today content'
            });
            // Get sessions from July 20th
            const results = await itemRepo.getItems('sessions', false, undefined, '2025-07-20', '2025-07-20');
            expect(results.length).toBe(1);
            expect(results[0].title).toBe('Morning session');
        });
        it('should filter other types by updated_at', async () => {
            // Create documents
            const doc1 = await itemRepo.createItem({
                type: 'docs',
                title: 'Old doc',
                content: 'Old content'
            });
            // Make it older
            const db = database.getDatabase();
            await db.runAsync('UPDATE items SET updated_at = ? WHERE type = ? AND id = ?', ['2025-07-01T10:00:00.000Z', 'docs', doc1.id]);
            const doc2 = await itemRepo.createItem({
                type: 'docs',
                title: 'Recent doc',
                content: 'New content'
            });
            // Get docs updated after July 15th
            const results = await itemRepo.getItems('docs', false, undefined, '2025-07-15');
            expect(results.length).toBe(1);
            expect(results[0].title).toBe('Recent doc');
        });
    });
    describe('Date range behavior', () => {
        beforeEach(async () => {
            // Create test data
            const db = database.getDatabase();
            // Create issues with different dates
            const issue1 = await itemRepo.createItem({
                type: 'issues',
                title: 'Issue 1',
                content: 'Content',
                status: 'Open'
            });
            await db.runAsync('UPDATE items SET updated_at = ? WHERE type = ? AND id = ?', ['2025-07-10T10:00:00.000Z', 'issues', issue1.id]);
            const issue2 = await itemRepo.createItem({
                type: 'issues',
                title: 'Issue 2',
                content: 'Content',
                status: 'Open'
            });
            await db.runAsync('UPDATE items SET updated_at = ? WHERE type = ? AND id = ?', ['2025-07-20T10:00:00.000Z', 'issues', issue2.id]);
            const issue3 = await itemRepo.createItem({
                type: 'issues',
                title: 'Issue 3',
                content: 'Content',
                status: 'Open'
            });
            await db.runAsync('UPDATE items SET updated_at = ? WHERE type = ? AND id = ?', ['2025-07-30T10:00:00.000Z', 'issues', issue3.id]);
        });
        it('should return items from start_date onwards when no end_date', async () => {
            const results = await itemRepo.getItems('issues', false, undefined, '2025-07-15');
            expect(results.length).toBe(2);
            expect(results.map(r => r.title)).toContain('Issue 2');
            expect(results.map(r => r.title)).toContain('Issue 3');
        });
        it('should return items up to end_date when no start_date', async () => {
            const results = await itemRepo.getItems('issues', false, undefined, undefined, '2025-07-15');
            expect(results.length).toBe(1);
            expect(results[0].title).toBe('Issue 1');
        });
        it('should return items within date range', async () => {
            const results = await itemRepo.getItems('issues', false, undefined, '2025-07-15', '2025-07-25');
            expect(results.length).toBe(1);
            expect(results[0].title).toBe('Issue 2');
        });
        it('should include entire end_date day', async () => {
            const results = await itemRepo.getItems('issues', false, undefined, '2025-07-20', '2025-07-20');
            expect(results.length).toBe(1);
            expect(results[0].title).toBe('Issue 2');
        });
    });
    describe('Combined filters', () => {
        it('should combine date and status filters', async () => {
            // Create issues with different statuses and dates
            const issue1 = await itemRepo.createItem({
                type: 'issues',
                title: 'Old Open',
                content: 'Content',
                status: 'Open'
            });
            const issue2 = await itemRepo.createItem({
                type: 'issues',
                title: 'Recent Closed',
                content: 'Content',
                status: 'Closed'
            });
            const issue3 = await itemRepo.createItem({
                type: 'issues',
                title: 'Recent Open',
                content: 'Content',
                status: 'Open'
            });
            // Update dates
            const db = database.getDatabase();
            await db.runAsync('UPDATE items SET updated_at = ? WHERE type = ? AND id = ?', ['2025-07-01T10:00:00.000Z', 'issues', issue1.id]);
            // Get recent open issues only
            const results = await itemRepo.getItems('issues', false, // exclude closed
            undefined, '2025-07-15' // recent only
            );
            expect(results.length).toBe(1);
            expect(results[0].title).toBe('Recent Open');
        });
    });
});
//# sourceMappingURL=item-repository-date-filter.test.js.map