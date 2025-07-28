/**
 * @ai-context Integration tests for FileIssueDatabase
 * @ai-pattern Tests async database operations with real file system
 * @ai-critical Validates core CRUD operations for all entity types
 * @ai-assumption Uses temporary directories for test isolation
 * @ai-why Ensures database functionality works correctly end-to-end
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { FileIssueDatabase } from '../database.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
describe('FileIssueDatabase Async Tests', () => {
    jest.setTimeout(10000); // Increase timeout for database operations
    let db;
    // @ai-pattern: Unique test directory per process to avoid conflicts
    const testDataDir = path.join(os.tmpdir(), 'mcp-test-database-' + process.pid + '-' + Date.now());
    const testDbPath = path.join(testDataDir, 'test.db');
    /**
     * @ai-intent Set up fresh database for each test
     * @ai-flow 1. Clean directory -> 2. Create database -> 3. Initialize
     * @ai-critical Must await initialization for SQLite setup
     * @ai-side-effects Creates test directories and SQLite database
     */
    beforeEach(async () => {
        // @ai-logic: Clean slate ensures test isolation
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true, force: true });
        }
        fs.mkdirSync(testDataDir, { recursive: true });
        db = new FileIssueDatabase(testDataDir, testDbPath);
        await db.initialize(); // @ai-critical: Creates tables and default data
    });
    /**
     * @ai-intent Clean up test artifacts
     * @ai-flow 1. Close database -> 2. Remove test files
     * @ai-critical Must close DB before deleting files
     */
    afterEach(async () => {
        await db.close(); // @ai-logic: Release SQLite locks
        // @ai-cleanup: Remove all test files unless KEEP_TEST_DATA is set
        if (process.env.KEEP_TEST_DATA !== 'true' && fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true, force: true });
        }
        else if (process.env.KEEP_TEST_DATA === 'true') {
            console.log(`Test data kept in: ${testDataDir}`);
        }
    });
    describe('Status operations', () => {
        /**
         * @ai-intent Test default status initialization
         * @ai-validation Ensures 7 default statuses exist
         * @ai-assumption Default statuses are: Open, In Progress, Review, Completed, Closed, On Hold, Cancelled
         */
        test('should initialize with default statuses', async () => {
            const statuses = await db.getAllStatuses();
            expect(statuses).toHaveLength(7); // @ai-logic: 7 default statuses including Cancelled
            expect(statuses.map(s => s.name)).toContain('Open');
            expect(statuses.map(s => s.name)).toContain('In Progress');
            expect(statuses.map(s => s.name)).toContain('Completed');
            expect(statuses.map(s => s.name)).toContain('Cancelled');
        });
        /**
         * @ai-intent Test custom status creation
         * @ai-validation Ensures status gets unique ID
         * @ai-critical Status IDs must be positive integers
         */
        test('should create new status', async () => {
            const status = await db.createStatus('Under Review');
            expect(status).not.toBeNull();
            expect(status.name).toBe('Under Review');
            expect(status.id).toBeGreaterThan(0); // @ai-validation: Auto-increment ID
        });
        /**
         * @ai-intent Test status name update
         * @ai-validation Ensures update returns success
         * @ai-assumption Status ID remains unchanged
         */
        test('should update status', async () => {
            const status = await db.createStatus('Testing');
            expect(status).not.toBeNull();
            const success = await db.updateStatus(status.id, 'Fixed'); // @ai-logic: Change name only
            expect(success).toBe(true);
        });
        /**
         * @ai-intent Test status deletion
         * @ai-validation Ensures delete returns success
         * @ai-warning May fail if status is referenced by issues/plans
         */
        test('should delete status', async () => {
            const status = await db.createStatus('To Delete');
            expect(status).not.toBeNull();
            const success = await db.deleteStatus(status.id);
            expect(success).toBe(true);
        });
    });
    describe('Task operations', () => {
        /**
         * @ai-intent Test task (issue) creation with all fields
         * @ai-validation Ensures all fields are stored correctly
         * @ai-critical Tasks must have timestamps and unique ID
         */
        test('should create new issue task', async () => {
            const issue = await db.createTask('issues', 'Test Issue', 'This is a test issue', 'high');
            expect(issue.title).toBe('Test Issue');
            expect(issue.content).toBe('This is a test issue');
            expect(issue.priority).toBe('high'); // @ai-pattern: high/medium/low
            expect(parseInt(issue.id)).toBeGreaterThan(0); // @ai-validation: Sequential ID
            expect(issue.created_at).toBeDefined(); // @ai-pattern: ISO timestamp
            expect(issue.updated_at).toBeDefined(); // @ai-pattern: ISO timestamp
        });
        /**
         * @ai-intent Test task listing
         * @ai-validation Ensures all created tasks are returned
         * @ai-pattern Tasks returned in ID order
         */
        test('should get all tasks by type', async () => {
            await db.createTask('issues', 'Issue 1', 'Test content for issue 1');
            await db.createTask('issues', 'Issue 2', 'Test content for issue 2');
            const issues = await db.getAllTasksSummary('issues');
            expect(issues.length).toBeGreaterThanOrEqual(2); // @ai-validation: At least our 2 issues exist
            // Check that our issues are in the results
            const hasIssue1 = issues.some((i) => i.title === 'Issue 1');
            const hasIssue2 = issues.some((i) => i.title === 'Issue 2');
            expect(hasIssue1).toBe(true);
            expect(hasIssue2).toBe(true);
        });
        /**
         * @ai-intent Test task retrieval by ID
         * @ai-validation Ensures data integrity after save
         * @ai-pattern Null returned for non-existent IDs
         */
        test('should get task by id', async () => {
            const created = await db.createTask('issues', 'Specific Issue', 'Details here');
            const issue = await db.getTask('issues', parseInt(created.id));
            expect(issue).not.toBeNull();
            expect(issue.title).toBe('Specific Issue');
            expect(issue.content).toBe('Details here');
        });
        /**
         * @ai-intent Test task update functionality
         * @ai-validation Ensures all fields can be updated
         * @ai-flow 1. Create -> 2. Update -> 3. Verify changes
         */
        test('should update task', async () => {
            const issue = await db.createTask('issues', 'Old Title', 'Initial content');
            const updated = await db.updateTask('issues', parseInt(issue.id), 'New Title', 'New description', 'low');
            expect(updated).not.toBeNull();
            expect(updated.title).toBe('New Title');
            expect(updated.content).toBe('New description');
            expect(updated.priority).toBe('low'); // @ai-logic: Priority changed
        });
        /**
         * @ai-intent Test task deletion
         * @ai-validation Ensures task is removed from storage
         * @ai-critical Deletion should be permanent
         */
        test('should delete task', async () => {
            const issue = await db.createTask('issues', 'To Delete', 'Content to delete');
            const success = await db.deleteTask('issues', parseInt(issue.id));
            expect(success).toBe(true);
            // @ai-validation: Verify deletion
            const deleted = await db.getTask('issues', parseInt(issue.id));
            expect(deleted).toBeNull(); // @ai-pattern: Null for deleted items
        });
        /**
         * @ai-intent Test new task fields: start_date, end_date, related_tasks
         * @ai-validation Ensures new fields are properly stored and retrieved
         * @ai-pattern Dates in YYYY-MM-DD format, related_tasks as array
         */
        test('should handle new task fields', async () => {
            const issue = await db.createTask('issues', 'Task with dates', 'Test content', 'high', undefined, ['planning'], 'Test description', '2025-07-25', '2025-07-30', ['plans-1', 'issues-2']);
            expect(issue.start_date).toBe('2025-07-25');
            expect(issue.end_date).toBe('2025-07-30');
            expect(issue.related_tasks).toEqual(['plans-1', 'issues-2']);
            // @ai-validation: Verify persistence
            const retrieved = await db.getTask('issues', parseInt(issue.id));
            expect(retrieved.start_date).toBe('2025-07-25');
            expect(retrieved.end_date).toBe('2025-07-30');
            expect(retrieved.related_tasks).toEqual(['plans-1', 'issues-2']);
        });
        /**
         * @ai-intent Test updating issue with new fields
         * @ai-validation Ensures all fields can be updated together
         */
        test('should update issue with new fields', async () => {
            const issue = await db.createTask('issues', 'Original Task', 'Original content');
            const updated = await db.updateTask('issues', parseInt(issue.id), 'Updated Task', 'Updated content', 'low', undefined, ['updated'], 'Updated description', '2025-08-01', '2025-08-15', ['plans-3']);
            expect(updated).not.toBeNull();
            expect(updated.title).toBe('Updated Task');
            expect(updated.start_date).toBe('2025-08-01');
            expect(updated.end_date).toBe('2025-08-15');
            expect(updated.related_tasks).toEqual(['plans-3']);
        });
    });
    describe('Tag operations', () => {
        /**
         * @ai-intent Test tag creation
         * @ai-validation Ensures tag name is returned
         * @ai-pattern Tags are case-sensitive
         */
        test('should create new tag', async () => {
            const tag = await db.createTag('feature');
            expect(tag.name).toBe('feature'); // @ai-logic: Returns the tag object
        });
        /**
         * @ai-intent Test tag listing
         * @ai-validation Ensures all tags are returned
         * @ai-pattern Tags include creation timestamp
         */
        test('should get all tags', async () => {
            await db.createTag('bug');
            await db.createTag('enhancement');
            const tags = await db.getTags();
            expect(tags).toHaveLength(2);
            expect(tags.map(t => t.name)).toContain('bug');
            expect(tags.map(t => t.name)).toContain('enhancement');
        });
        /**
         * @ai-intent Test tag deletion
         * @ai-validation Ensures tag is removed
         * @ai-note Tag uses name as ID, not numeric ID
         */
        test('should delete tag', async () => {
            await db.createTag('to-delete');
            const success = await db.deleteTag('to-delete'); // @ai-pattern: Delete by name
            expect(success).toBe(true);
        });
        /**
         * @ai-intent Test tag pattern matching
         * @ai-validation Ensures partial matches work
         * @ai-pattern Uses SQL LIKE for flexible search
         */
        test('should search tags by pattern', async () => {
            await db.createTag('frontend');
            await db.createTag('backend');
            await db.createTag('testing');
            const results = await db.searchTags('end'); // @ai-pattern: Substring match
            expect(results).toHaveLength(2);
            expect(results.map(t => t.name)).toContain('frontend');
            expect(results.map(t => t.name)).toContain('backend');
        });
    });
    describe('Search operations', () => {
        /**
         * @ai-intent Test cross-type tag search
         * @ai-validation Ensures tag search works across all types
         * @ai-pattern Returns grouped results by type
         */
        test('should search all by tag', async () => {
            // @ai-logic: Create items with same tag across types
            await db.createTask('issues', 'Tagged Issue', 'Issue content', 'medium', undefined, ['important']);
            await db.createTask('plans', 'Tagged Plan', 'Plan content', 'high', undefined, ['important']);
            await db.createDocument('knowledge', 'Tagged Knowledge', 'Content here', ['important']);
            const results = await db.searchAllByTag('important');
            expect(results.issues).toHaveLength(1); // @ai-validation: Issue found
            expect(results.plans).toHaveLength(1);
            expect(results.knowledge).toHaveLength(1);
        });
        /**
         * @ai-intent Test full-text search across types
         * @ai-validation Ensures keyword search in title/description
         * @ai-pattern Searches both title and content fields
         */
        test('should search all by query', async () => {
            // @ai-logic: Create items with keyword in different fields
            await db.createTask('issues', 'Searchable Issue', 'Contains keyword');
            await db.createTask('plans', 'Searchable Plan', 'Contains keyword');
            await db.createDocument('knowledge', 'Searchable Knowledge', 'Contains keyword', []);
            const results = await db.searchAll('keyword'); // @ai-pattern: Text search
            expect(results.issues).toHaveLength(1);
            expect(results.plans).toHaveLength(1);
            expect(results.knowledge).toHaveLength(1);
        });
    });
});
//# sourceMappingURL=database.test.js.map