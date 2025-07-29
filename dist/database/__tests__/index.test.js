/**
 * @ai-context Comprehensive tests for FileIssueDatabase facade
 * @ai-pattern Integration tests for database layer
 * @ai-critical Tests central data access layer used by all handlers
 * @ai-related-files
 *   - src/database/index.ts (implementation)
 *   - src/repositories/item-repository.ts (item operations)
 *   - src/database/status-repository.ts (status management)
 *   - src/database/tag-repository.ts (tag management)
 */
import { FileIssueDatabase } from '../index.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
describe('FileIssueDatabase', () => {
    let testDataDir;
    let database;
    beforeEach(async () => {
        // Setup test directory
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-issue-db-test-'));
        testDataDir = path.join(tempDir, '.shirokuma/data');
        // Create required directories
        const dirs = ['issues', 'plans', 'docs', 'knowledge', 'sessions', 'dailies'];
        for (const dir of dirs) {
            await fs.mkdir(path.join(testDataDir, dir), { recursive: true });
        }
        // Initialize database
        const dbPath = path.join(testDataDir, 'search.db');
        database = new FileIssueDatabase(testDataDir, dbPath);
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
    describe('initialization', () => {
        it('should initialize database and repositories', async () => {
            await database.initialize();
            expect(database.getDatabase()).toBeDefined();
            expect(database.getItemRepository()).toBeDefined();
            expect(database.getTypeRepository()).toBeDefined();
            expect(database.getFullTextSearchRepository()).toBeDefined();
        });
        it('should cache initialization promise', async () => {
            let initCount = 0;
            const originalInit = database['initializeAsync'];
            database['initializeAsync'] = async function () {
                initCount++;
                return originalInit.call(this);
            };
            await database.initialize();
            await database.initialize();
            await database.initialize();
            expect(initCount).toBe(1); // Should only initialize once
            expect(database.getDatabase()).toBeDefined();
        });
        it('should provide data directory access', () => {
            expect(database.dataDirectory).toBe(testDataDir);
        });
    });
    describe('status management', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should get all statuses', async () => {
            const statuses = await database.getAllStatuses();
            expect(statuses).toBeDefined();
            expect(Array.isArray(statuses)).toBe(true);
            expect(statuses.length).toBeGreaterThan(0);
            // Check default statuses exist
            const statusNames = statuses.map(s => s.name);
            expect(statusNames).toContain('Open');
            expect(statusNames).toContain('In Progress');
            expect(statusNames).toContain('Closed');
        });
        it('should handle getAllStatusesAsync', async () => {
            const statuses = await database.getAllStatusesAsync();
            expect(statuses).toBeDefined();
            expect(Array.isArray(statuses)).toBe(true);
        });
    });
    describe('tag management', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should create and get tags', async () => {
            const tag = await database.createTag('test-tag');
            expect(tag).toBeDefined();
            expect(tag.name).toBe('test-tag');
            expect(tag.id).toBeDefined();
            const tags = await database.getAllTags();
            const tagNames = tags.map(t => t.name);
            expect(tagNames).toContain('test-tag');
        });
        it('should reject empty tag names', async () => {
            await expect(database.createTag('')).rejects.toThrow('Tag name cannot be empty');
            await expect(database.createTag('   ')).rejects.toThrow('Tag name cannot be empty');
        });
        it('should delete tags', async () => {
            await database.createTag('tag-to-delete');
            const result = await database.deleteTag('tag-to-delete');
            expect(result).toBe(true);
            const tags = await database.getAllTags();
            const tagNames = tags.map(t => t.name);
            expect(tagNames).not.toContain('tag-to-delete');
        });
        it('should search tags by pattern', async () => {
            await database.createTag('search-tag-1');
            await database.createTag('search-tag-2');
            await database.createTag('other-tag');
            const results = await database.searchTagsByPattern('search');
            expect(results).toHaveLength(2);
            expect(results.every(tag => tag.name.includes('search'))).toBe(true);
        });
        it('should get or create tag ID', async () => {
            const id1 = await database.getOrCreateTagId('auto-tag');
            const id2 = await database.getOrCreateTagId('auto-tag');
            expect(id1).toBeDefined();
            expect(id2).toBeDefined();
            expect(id1).toBe(id2); // Same tag should return same ID
            expect(typeof id1).toBe('number');
            // The tag should be created
            const tags = await database.getAllTags();
            const tagNames = tags.map(t => t.name);
            expect(tagNames).toContain('auto-tag');
        });
    });
    describe('issue operations', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should create and get issue', async () => {
            const issue = await database.createIssue('Test Issue', 'Issue content', 'high', 'Open', ['bug', 'urgent'], 'Test description', '2024-01-01', '2024-01-31', ['plans-1'], ['docs-1']);
            expect(issue).toBeDefined();
            expect(issue.title).toBe('Test Issue');
            expect(issue.content).toBe('Issue content');
            expect(issue.priority).toBe('high');
            expect(issue.status).toBe('Open');
            expect(issue.tags).toEqual(['bug', 'urgent']);
            const retrieved = await database.getIssue(issue.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(issue.id);
        });
        it('should update issue', async () => {
            const issue = await database.createIssue('Original Title', 'Original content', 'low', 'Open');
            const updated = await database.updateIssue(issue.id, 'Updated Title', 'Updated content', 'high', 'Closed', ['updated'], 'New description');
            expect(updated).toBeDefined();
            expect(updated?.title).toBe('Updated Title');
            expect(updated?.priority).toBe('high');
            expect(updated?.status).toBe('Closed');
        });
        it('should delete issue', async () => {
            const issue = await database.createIssue('To Delete', 'Delete me', 'medium');
            const deleted = await database.deleteIssue(issue.id);
            expect(deleted).toBe(true);
            const retrieved = await database.getIssue(issue.id);
            expect(retrieved).toBeNull();
        });
        it('should get issues summary', async () => {
            // Create test issues
            await database.createIssue('Open Issue', 'Content', 'high', 'Open');
            await database.createIssue('Closed Issue', 'Content', 'low', 'Closed');
            // Get all issues (excluding closed by default)
            const openIssues = await database.getAllIssuesSummary();
            expect(openIssues).toHaveLength(1);
            expect(openIssues[0].status).toBe('Open');
            // Get all including closed
            const allIssues = await database.getAllIssuesSummary(true);
            expect(allIssues).toHaveLength(2);
        });
        it('should search issues by tag', async () => {
            await database.createIssue('Bug Issue 1', 'Content', 'high', 'Open', ['bug']);
            await database.createIssue('Bug Issue 2', 'Content', 'medium', 'Open', ['bug', 'ui']);
            await database.createIssue('Feature Issue', 'Content', 'low', 'Open', ['feature']);
            const bugIssues = await database.searchIssuesByTag('bug');
            expect(bugIssues).toHaveLength(2);
            expect(bugIssues.every(issue => issue.tags.includes('bug'))).toBe(true);
        });
    });
    describe('plan operations', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should create and manage plans', async () => {
            const plan = await database.createPlan('Test Plan', 'Plan content', 'medium', 'Open', ['planning']);
            expect(plan).toBeDefined();
            expect(plan.title).toBe('Test Plan');
            const retrieved = await database.getPlan(plan.id);
            expect(retrieved).toBeDefined();
            const updated = await database.updatePlan(plan.id, 'Updated Plan', 'Updated content');
            expect(updated?.title).toBe('Updated Plan');
            const deleted = await database.deletePlan(plan.id);
            expect(deleted).toBe(true);
        });
    });
    describe('document operations', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should create and manage documents', async () => {
            const doc = await database.createDocument('docs', 'Test Document', 'Document content', ['reference', 'api']);
            expect(doc).toBeDefined();
            expect(doc.title).toBe('Test Document');
            expect(doc.type).toBe('docs');
            const retrieved = await database.getDocument('docs', parseInt(doc.id));
            expect(retrieved).toBeDefined();
            const updated = await database.updateDocument('docs', parseInt(doc.id), 'Updated Document');
            expect(updated).toBe(true);
            const deleted = await database.deleteDocument('docs', parseInt(doc.id));
            expect(deleted).toBe(true);
        });
        it('should get all documents', async () => {
            await database.createDocument('docs', 'Doc 1', 'Content');
            await database.createDocument('docs', 'Doc 2', 'Content');
            await database.createDocument('knowledge', 'Knowledge 1', 'Content');
            const allDocs = await database.getAllDocuments();
            expect(allDocs).toHaveLength(3);
            const docsOnly = await database.getAllDocuments('docs');
            expect(docsOnly).toHaveLength(2);
            expect(docsOnly.every(d => d.type === 'docs')).toBe(true);
        });
        it('should search documents by tag', async () => {
            await database.createDocument('docs', 'API Doc', 'Content', ['api']);
            await database.createDocument('knowledge', 'API Guide', 'Content', ['api', 'guide']);
            const apiDocs = await database.searchDocumentsByTag('api');
            expect(apiDocs).toHaveLength(2);
            const docsOnly = await database.searchDocumentsByTag('api', 'docs');
            expect(docsOnly).toHaveLength(1);
            expect(docsOnly[0].type).toBe('docs');
        });
    });
    describe('type management', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should get all types', async () => {
            const types = await database.getAllTypes();
            expect(types).toBeDefined();
            expect(Array.isArray(types)).toBe(true);
            // Check default types
            const typeNames = types.map(t => t.type);
            expect(typeNames).toContain('issues');
            expect(typeNames).toContain('plans');
            expect(typeNames).toContain('docs');
            expect(typeNames).toContain('knowledge');
        });
        it('should create custom type', async () => {
            // createType returns void, so just check it doesn't throw
            await expect(database.createType('customtype', 'tasks')).resolves.not.toThrow();
            const types = await database.getAllTypes();
            const customType = types.find(t => t.type === 'customtype');
            expect(customType).toBeDefined();
            expect(customType?.base_type).toBe('tasks');
        });
        it('should delete custom type', async () => {
            await database.createType('todelete', 'documents');
            // deleteType returns void, so just check it doesn't throw
            await expect(database.deleteType('todelete')).resolves.not.toThrow();
            const types = await database.getAllTypes();
            const found = types.find(t => t.type === 'todelete');
            expect(found).toBeUndefined();
        });
        it('should get base type', async () => {
            const issuesBase = await database.getBaseType('issues');
            expect(issuesBase).toBe('tasks');
            const docsBase = await database.getBaseType('docs');
            expect(docsBase).toBe('documents');
        });
        it('should get types grouped format', async () => {
            const grouped = await database.getTypes();
            expect(grouped.tasks).toBeDefined();
            expect(grouped.documents).toBeDefined();
            expect(grouped.tasks).toContain('issues');
            expect(grouped.tasks).toContain('plans');
            expect(grouped.documents).toContain('docs');
            expect(grouped.documents).toContain('knowledge');
        });
    });
    describe('search operations', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should search across all content', async () => {
            await database.createIssue('Bug in search', 'Search functionality broken', 'high');
            await database.createPlan('Search improvement', 'Improve search performance', 'medium');
            await database.createDocument('docs', 'Search API', 'How to use search API');
            const results = await database.searchContent('search');
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });
        it('should search all by tag with grouped results', async () => {
            await database.createIssue('Issue 1', 'Content', 'high', 'Open', ['important']);
            await database.createPlan('Plan 1', 'Content', 'medium', 'Open', ['important']);
            await database.createDocument('docs', 'Doc 1', 'Content', ['important']);
            const grouped = await database.searchAllByTag('important');
            expect(grouped.issues).toHaveLength(1);
            expect(grouped.plans).toHaveLength(1);
            expect(grouped.docs).toHaveLength(1);
            expect(grouped.knowledge).toHaveLength(0);
        });
        it('should search all with grouped results', async () => {
            await database.createIssue('Search bug', 'Bug in search', 'high');
            await database.createDocument('docs', 'Search guide', 'How to search');
            const grouped = await database.searchAll('search');
            expect(grouped).toBeDefined();
            expect(grouped.issues).toBeDefined();
            expect(grouped.docs).toBeDefined();
        });
    });
    describe('legacy task methods', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should create task using legacy method', async () => {
            const task = await database.createTask('issues', 'Test Task', 'Task content', 'high', 'Open', ['task-tag']);
            expect(task).toBeDefined();
            expect(task.type).toBe('issues');
            expect(task.title).toBe('Test Task');
        });
        it('should get task using legacy method', async () => {
            const created = await database.createTask('plans', 'Test Plan', 'Content');
            const retrieved = await database.getTask('plans', parseInt(created.id));
            expect(retrieved).toBeDefined();
            expect(retrieved?.title).toBe('Test Plan');
        });
        it('should update task using legacy method', async () => {
            const created = await database.createTask('issues', 'Original', 'Content');
            const updated = await database.updateTask('issues', parseInt(created.id), 'Updated', 'New content');
            expect(updated).toBeDefined();
            expect(updated?.title).toBe('Updated');
        });
        it('should delete task using legacy method', async () => {
            const created = await database.createTask('plans', 'To Delete', 'Content');
            const deleted = await database.deleteTask('plans', parseInt(created.id));
            expect(deleted).toBe(true);
        });
        it('should get tasks summary', async () => {
            await database.createTask('issues', 'Task 1', 'Content', 'high', 'Open');
            await database.createTask('issues', 'Task 2', 'Content', 'low', 'Closed');
            const openTasks = await database.getAllTasksSummary('issues');
            expect(openTasks).toHaveLength(1);
            const allTasks = await database.getAllTasksSummary('issues', true);
            expect(allTasks).toHaveLength(2);
        });
        it('should search tasks by tag', async () => {
            await database.createTask('issues', 'Bug Task', 'Content', 'high', 'Open', ['bug']);
            await database.createTask('plans', 'Bug Plan', 'Content', 'medium', 'Open', ['bug']);
            const results = await database.searchTasksByTag('bug');
            expect(results).toHaveLength(2);
        });
    });
    describe('session operations', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should search sessions', async () => {
            // Create a session through item repository
            const itemRepo = database.getItemRepository();
            await itemRepo.createItem({
                type: 'sessions',
                title: 'Test Session',
                content: 'Session about testing',
                tags: ['test']
            });
            const results = await database.searchSessions('test');
            expect(results).toHaveLength(1);
            expect(results[0].title).toBe('Test Session');
        });
        it('should search sessions by tag', async () => {
            const itemRepo = database.getItemRepository();
            await itemRepo.createItem({
                type: 'sessions',
                title: 'Tagged Session',
                content: 'Content',
                tags: ['important']
            });
            const results = await database.searchSessionsByTag('important');
            expect(results).toHaveLength(1);
            expect(results[0].tags).toContain('important');
        });
    });
    describe('daily summary operations', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should search daily summaries', async () => {
            const itemRepo = database.getItemRepository();
            await itemRepo.createItem({
                type: 'dailies',
                title: 'Daily Summary',
                content: 'Summary of daily activities',
                date: '2024-01-15'
            });
            const results = await database.searchDailySummaries('daily');
            expect(results).toHaveLength(1);
            expect(results[0].title).toBe('Daily Summary');
        });
    });
    describe('error handling', () => {
        beforeEach(async () => {
            await database.initialize();
        });
        it('should handle non-existent items gracefully', async () => {
            const issue = await database.getIssue(9999);
            expect(issue).toBeNull();
            const plan = await database.getPlan(9999);
            expect(plan).toBeNull();
            const doc = await database.getDocument('docs', 9999);
            expect(doc).toBeNull();
        });
        it('should handle update of non-existent items', async () => {
            const updated = await database.updateIssue(9999, 'New Title');
            expect(updated).toBeNull();
        });
        it('should handle delete of non-existent items', async () => {
            const deleted = await database.deleteIssue(9999);
            expect(deleted).toBe(false);
        });
    });
});
//# sourceMappingURL=index.test.js.map