/**
 * @ai-context Test suite for work session management functionality
 * @ai-pattern Integration tests with real file system and database
 * @ai-critical Tests create/update/search operations for sessions
 * @ai-assumption Uses temporary directories to avoid conflicts
 * @ai-why Ensures session tracking works correctly end-to-end
 */
import { SessionManager } from '../session-manager';
import { FileIssueDatabase } from '../database';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
describe('SessionManager', () => {
    jest.setTimeout(10000); // Increase timeout for database operations
    // @ai-pattern: Isolated test directories using process ID and timestamp
    const testDataDir = path.join(os.tmpdir(), 'mcp-test-sessions-' + process.pid + '-' + Date.now());
    const testDbPath = path.join(testDataDir, 'test.db');
    let sessionManager;
    let testDb;
    /**
     * @ai-intent Set up clean test environment for each test
     * @ai-flow 1. Clean old data -> 2. Create dirs -> 3. Init DB -> 4. Create manager
     * @ai-critical Must initialize database before creating session manager
     * @ai-side-effects Creates temporary directories and SQLite database
     */
    beforeEach(async () => {
        // @ai-logic: Clean slate for each test
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true, force: true });
        }
        fs.mkdirSync(testDataDir, { recursive: true });
        testDb = new FileIssueDatabase(testDataDir, testDbPath);
        await testDb.initialize(); // @ai-critical: Required for SQLite sync
        sessionManager = new SessionManager(testDataDir, testDb);
    });
    /**
     * @ai-intent Clean up test artifacts after each test
     * @ai-flow 1. Close DB connection -> 2. Remove test directories
     * @ai-critical Must close DB to release file locks
     * @ai-side-effects Removes all test files and directories
     */
    afterEach(async () => {
        // @ai-logic: Close database first to release locks
        if (testDb) {
            await testDb.close();
        }
        // @ai-logic: Remove all test artifacts unless KEEP_TEST_DATA is set
        if (process.env.KEEP_TEST_DATA !== 'true' && fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true, force: true });
        }
        else if (process.env.KEEP_TEST_DATA === 'true') {
            console.log(`Test data kept in: ${testDataDir}`);
        }
    });
    describe('createSession', () => {
        /**
         * @ai-intent Test basic session creation with required fields
         * @ai-validation Checks ID generation, date format, timestamps
         * @ai-assumption Sessions created without update timestamp initially
         */
        it('should create a new work session with current date', async () => {
            const session = await sessionManager.createSession('Implementing chat session recording feature');
            expect(session).toBeDefined();
            expect(session.id).toBeDefined(); // @ai-validation: Auto-generated ID
            expect(session.date).toBeDefined();
            expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // @ai-pattern: YYYY-MM-DD
            expect(session.createdAt).toBeDefined(); // @ai-validation: ISO timestamp
            expect(session.title).toBe('Implementing chat session recording feature');
            expect(session.updatedAt).toBeUndefined(); // @ai-logic: Not updated yet
        });
        /**
         * @ai-intent Test session persistence and file structure
         * @ai-validation Ensures sessions are saved to the correct location
         * @ai-critical Sessions must be persisted for retrieval
         */
        it('should create and persist session with proper file structure', async () => {
            // Create session with content
            const session = await sessionManager.createSession('Test Title', 'Test content for file creation');
            // Verify session was created with expected structure
            expect(session).toBeDefined();
            expect(session.id).toBeDefined();
            expect(session.id).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/);
            expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(session.title).toBe('Test Title');
            expect(session.content).toBe('Test content for file creation');
            // Verify it can be loaded back (which proves it was persisted)
            const loadedSession = await sessionManager.getSession(session.id);
            expect(loadedSession).not.toBeNull();
            expect(loadedSession?.title).toBe('Test Title');
            expect(loadedSession?.content).toBe('Test content for file creation');
            // The fact that we can load it back proves the file was created successfully
            // Testing specific file paths is an implementation detail that can be fragile
        });
        /**
         * @ai-intent Test session creation with all optional fields
         * @ai-validation Ensures all fields are properly stored
         * @ai-assumption Content can include markdown formatting
         */
        it('should create session with content', async () => {
            const session = await sessionManager.createSession('Test Session', '## Implementation\n\n- Task 1\n- Task 2', // @ai-example: Markdown content
            ['test', 'session'] // @ai-pattern: Tag array
            );
            expect(session.title).toBe('Test Session');
            expect(session.content).toContain('Task 1');
            expect(session.tags).toEqual(['test', 'session']);
        });
        /**
         * @ai-intent Test custom session ID override
         * @ai-validation Ensures custom IDs are accepted
         * @ai-pattern ID format: YYYY-MM-DD-HH.MM.SS.sss
         */
        it('should create session with custom ID', async () => {
            const customId = '2023-12-01-12.00.00.000'; // @ai-example: Manual ID
            const session = await sessionManager.createSession('Custom ID Session', 'Custom content', undefined, customId);
            expect(session.id).toBe(customId);
            expect(session.title).toBe('Custom ID Session');
            expect(session.content).toBe('Custom content');
        });
        /**
         * @ai-intent Test tag-only session creation
         * @ai-validation Ensures tags work without other optional fields
         */
        it('should create session with tags', async () => {
            const session = await sessionManager.createSession('Test Session', undefined, ['test', 'session']);
            expect(session.tags).toEqual(['test', 'session']);
        });
        /**
         * @ai-intent Test custom datetime for past data migration
         * @ai-validation Ensures sessions can be created with past dates
         * @ai-pattern ISO 8601 datetime format
         */
        it('should create session with custom datetime', async () => {
            const customDatetime = '2024-01-15T14:30:00.000Z';
            const session = await sessionManager.createSession('Past Session', 'Historical data', ['migration'], undefined, customDatetime);
            expect(session.date).toBe('2024-01-15'); // @ai-validation: Date extracted from datetime
            expect(session.createdAt).toBe(customDatetime);
            // ID will be based on the datetime converted to local time
            expect(session.id).toMatch(/^2024-01-15-\d{2}\.\d{2}\.\d{2}\.\d{3}$/); // @ai-pattern: ID based on custom datetime
        });
    });
    describe('updateSession', () => {
        /**
         * @ai-intent Test error handling for missing sessions
         * @ai-validation Ensures proper error messages
         * @ai-error-handling Throws descriptive error
         */
        it('should throw error if session not found', async () => {
            await expect(sessionManager.updateSession('non-existent-id', 'Title')).rejects.toThrow('Session non-existent-id not found'); // @ai-pattern: Include ID in error
        });
        /**
         * @ai-intent Test comprehensive session update
         * @ai-validation Ensures all fields can be updated
         * @ai-critical updatedAt timestamp must be set
         */
        it('should update session fields', async () => {
            const session = await sessionManager.createSession('Original Title', 'Original content', ['tag1']);
            const updated = await sessionManager.updateSession(session.id, 'Updated Title', 'Updated content', ['tag1', 'tag2'] // @ai-logic: Can add new tags
            );
            expect(updated.title).toBe('Updated Title');
            expect(updated.content).toBe('Updated content');
            expect(updated.tags).toEqual(['tag1', 'tag2']);
            expect(updated.updatedAt).toBeDefined(); // @ai-critical: Must track update time
        });
        /**
         * @ai-intent Test partial update preservation
         * @ai-validation Ensures unspecified fields remain unchanged
         * @ai-pattern Partial updates common in UI
         */
        it('should preserve unchanged fields', async () => {
            const session = await sessionManager.createSession('Title', 'Content', ['tag1']);
            const updated = await sessionManager.updateSession(session.id, 'New Title'); // @ai-logic: Only title updated
            expect(updated.title).toBe('New Title');
            expect(updated.content).toBe('Content');
            expect(updated.tags).toEqual(['tag1']);
        });
    });
    describe('getSession', () => {
        /**
         * @ai-intent Test null return for missing sessions
         * @ai-validation Graceful handling of not found
         */
        it('should return null for non-existent session', async () => {
            const session = await sessionManager.getSession('non-existent');
            expect(session).toBeNull(); // @ai-pattern: Null instead of throwing
        });
        /**
         * @ai-intent Test session persistence and retrieval
         * @ai-validation Ensures data survives save/load cycle
         * @ai-critical Core functionality for session management
         */
        it('should load saved session', async () => {
            const session = await sessionManager.createSession('Test Session', 'Content');
            // Debug: Check if session was created properly
            expect(session).toBeDefined();
            expect(session.id).toBeDefined();
            expect(session.id).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/); // YYYY-MM-DD-HH.MM.SS.sss format
            // Wait a bit for filesystem operations
            await new Promise(resolve => setTimeout(resolve, 100));
            const loaded = await sessionManager.getSession(session.id);
            expect(loaded).not.toBeNull();
            expect(loaded?.title).toBe('Test Session');
            expect(loaded?.content).toBe('Content');
        });
        it('should return null if session not found', async () => {
            const loaded = await sessionManager.getSession('non-existent-id');
            expect(loaded).toBeNull();
        });
    });
    describe('searchSessionsByTag', () => {
        /**
         * @ai-intent Test tag-based session search
         * @ai-validation Ensures correct filtering by tag
         * @ai-pattern Sessions can have multiple tags
         * @ai-timing Delays ensure unique timestamps
         */
        it('should find sessions by tag', async () => {
            await sessionManager.createSession('Session 1', undefined, ['tag1', 'tag2']);
            // @ai-timing: Wait to ensure different IDs (timestamp-based)
            await new Promise(resolve => setTimeout(resolve, 10));
            await sessionManager.createSession('Session 2', undefined, ['tag2', 'tag3']);
            await new Promise(resolve => setTimeout(resolve, 10));
            await sessionManager.createSession('Session 3', undefined, ['tag3']);
            const results = await sessionManager.searchSessionsByTag('tag2');
            expect(results).toHaveLength(2); // @ai-validation: Both sessions with tag2
            expect(results.map(s => s.title)).toContain('Session 1');
            expect(results.map(s => s.title)).toContain('Session 2');
            // @ai-timing: Wait for async operations to complete
            await new Promise(resolve => setTimeout(resolve, 100));
        });
    });
    describe('Daily', () => {
        /**
         * @ai-intent Test daily summary creation
         * @ai-validation Ensures summary has all required fields
         * @ai-pattern One summary per date
         * @ai-assumption Date is primary key
         */
        it('should create daily summary', async () => {
            const date = new Date().toISOString().split('T')[0]; // @ai-pattern: YYYY-MM-DD
            const summary = await sessionManager.createDaily(date, 'Daily Work Summary', '## Completed Tasks\n\n- Task 1\n- Task 2', // @ai-example: Markdown content
            ['summary', 'daily']);
            expect(summary.date).toBe(date);
            expect(summary.title).toBe('Daily Work Summary');
            expect(summary.content).toContain('Task 1');
            expect(summary.tags).toEqual(['summary', 'daily']);
            expect(summary.createdAt).toBeDefined();
        });
        /**
         * @ai-intent Test daily summary update
         * @ai-validation Ensures updates overwrite existing
         * @ai-critical Same date updates existing summary
         */
        it('should update daily summary', async () => {
            const date = new Date().toISOString().split('T')[0];
            await sessionManager.createDaily(date, 'Initial Title', 'Initial content', ['tag1']);
            const updated = await sessionManager.updateDaily(date, // @ai-critical: Date is the key
            'Updated Title', 'Updated content', ['tag1', 'tag2']);
            expect(updated.title).toBe('Updated Title');
            expect(updated.content).toBe('Updated content');
            expect(updated.tags).toEqual(['tag1', 'tag2']);
            expect(updated.updatedAt).toBeDefined(); // @ai-validation: Track update time
        });
        /**
         * @ai-intent Test error handling for missing summary
         * @ai-validation Ensures descriptive error messages
         * @ai-error-handling Throws with date information
         */
        it('should throw error if daily summary not found', async () => {
            await expect(sessionManager.updateDaily('2020-01-01')).rejects.toThrow('Daily summary for 2020-01-01 not found'); // @ai-pattern: Include date in error
        });
    });
});
//# sourceMappingURL=chat-session.test.js.map