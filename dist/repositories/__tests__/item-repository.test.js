/**
 * @ai-context Comprehensive tests for ItemRepository
 * @ai-pattern Unit tests covering CRUD operations, file I/O, and SQLite sync
 * @ai-related-files
 *   - src/repositories/item-repository.ts (implementation)
 *   - src/types/unified-types.ts (type definitions)
 *   - src/test-utils/database-test-helper.ts (test utilities)
 */
import { StatusRepository } from '../../database/status-repository.js';
import { TagRepository } from '../../database/tag-repository.js';
import { FileIssueDatabase } from '../../database/index.js';
import { DatabaseConnection } from '../../database/base.js';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
describe('ItemRepository', () => {
    let testDataDir;
    let database;
    let itemRepo;
    let dbConnection;
    let statusRepo;
    let tagRepo;
    beforeEach(async () => {
        // Setup test directory
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'item-repo-test-'));
        testDataDir = path.join(tempDir, '.shirokuma/data');
        // Create required directories
        const dirs = ['issues', 'plans', 'docs', 'knowledge', 'sessions', 'dailies'];
        for (const dir of dirs) {
            await fs.mkdir(path.join(testDataDir, dir), { recursive: true });
        }
        // Initialize database
        const dbPath = path.join(testDataDir, 'search.db');
        database = new FileIssueDatabase(testDataDir, dbPath);
        await database.initialize();
        // Get repositories
        itemRepo = database.getItemRepository();
        dbConnection = new DatabaseConnection(dbPath);
        await dbConnection.initialize();
        const db = dbConnection.getDatabase();
        statusRepo = new StatusRepository(db);
        tagRepo = new TagRepository(db);
    });
    afterEach(async () => {
        await database.close();
        await dbConnection.close();
        // Clean up test directory
        try {
            await fs.rm(path.dirname(testDataDir), { recursive: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    });
    describe('createItem', () => {
        it('should create an issue with all fields', async () => {
            const params = {
                type: 'issues',
                title: 'Test Issue',
                content: 'Issue content',
                description: 'Issue description',
                priority: 'high',
                status: 'Open',
                tags: ['bug', 'urgent'],
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                related_tasks: ['plans-1'],
                related_documents: ['docs-1']
            };
            const item = await itemRepo.createItem(params);
            expect(item).toBeDefined();
            expect(item.type).toBe('issues');
            expect(item.title).toBe('Test Issue');
            expect(item.content).toBe('Issue content');
            expect(item.description).toBe('Issue description');
            expect(item.priority).toBe('high');
            expect(item.status).toBe('Open');
            expect(item.tags).toEqual(['bug', 'urgent']);
            expect(item.start_date).toBe('2024-01-01');
            expect(item.end_date).toBe('2024-01-31');
            expect(item.related_tasks).toEqual(['plans-1']);
            expect(item.related_documents).toEqual(['docs-1']);
            expect(item.id).toMatch(/^\d+$/); // Should be numeric string
            expect(item.created_at).toBeDefined();
            expect(item.updated_at).toBeDefined();
            // Verify file was created
            const filePath = path.join(testDataDir, 'issues', `issues-${item.id}.md`);
            const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
            expect(fileExists).toBe(true);
            // Verify SQLite sync
            const dbItem = await database.getDatabase().getAsync('SELECT * FROM items WHERE type = ? AND id = ?', ['issues', item.id]);
            expect(dbItem).toBeDefined();
        });
        it('should create a plan with minimal fields', async () => {
            const params = {
                type: 'plans',
                title: 'Test Plan',
                content: 'Plan content'
            };
            const item = await itemRepo.createItem(params);
            expect(item).toBeDefined();
            expect(item.type).toBe('plans');
            expect(item.title).toBe('Test Plan');
            expect(item.content).toBe('Plan content');
            expect(item.priority).toBe('medium'); // Default
            expect(item.status).toBe('Open'); // Default
            expect(item.tags).toEqual([]);
            expect(item.related_tasks).toEqual([]);
            expect(item.related_documents).toEqual([]);
        });
        it('should create a document type item', async () => {
            const params = {
                type: 'docs',
                title: 'Test Document',
                content: 'Document content',
                tags: ['reference', 'api']
            };
            const item = await itemRepo.createItem(params);
            expect(item).toBeDefined();
            expect(item.type).toBe('docs');
            expect(item.title).toBe('Test Document');
            expect(item.content).toBe('Document content');
            expect(item.tags).toEqual(['reference', 'api']);
            // Documents have default priority and status
            expect(item.priority).toBe('medium');
            expect(item.status).toBe('Open');
        });
        it('should auto-increment IDs for each type', async () => {
            // Create multiple items of same type
            const item1 = await itemRepo.createItem({
                type: 'issues',
                title: 'Issue 1',
                content: 'Content 1'
            });
            const item2 = await itemRepo.createItem({
                type: 'issues',
                title: 'Issue 2',
                content: 'Content 2'
            });
            const item3 = await itemRepo.createItem({
                type: 'issues',
                title: 'Issue 3',
                content: 'Content 3'
            });
            // IDs should be sequential
            expect(parseInt(item2.id)).toBe(parseInt(item1.id) + 1);
            expect(parseInt(item3.id)).toBe(parseInt(item2.id) + 1);
        });
        it('should maintain separate ID sequences for different types', async () => {
            const issue = await itemRepo.createItem({
                type: 'issues',
                title: 'Issue',
                content: 'Issue content'
            });
            const plan = await itemRepo.createItem({
                type: 'plans',
                title: 'Plan',
                content: 'Plan content'
            });
            const doc = await itemRepo.createItem({
                type: 'docs',
                title: 'Doc',
                content: 'Doc content'
            });
            // Each type should start from 1
            expect(issue.id).toBe('1');
            expect(plan.id).toBe('1');
            expect(doc.id).toBe('1');
        });
        it('should auto-register new tags', async () => {
            const params = {
                type: 'issues',
                title: 'Test Issue',
                content: 'Content',
                tags: ['new-tag-1', 'new-tag-2']
            };
            await itemRepo.createItem(params);
            // Verify tags were registered
            const tags = await tagRepo.getAllTags();
            const tagNames = tags.map(t => t.name);
            expect(tagNames).toContain('new-tag-1');
            expect(tagNames).toContain('new-tag-2');
        });
        it('should normalize tag names', async () => {
            const params = {
                type: 'issues',
                title: 'Test Issue',
                content: 'Content',
                tags: ['  Tag With Spaces  ', 'UPPERCASE', 'mixed-CASE']
            };
            const item = await itemRepo.createItem(params);
            // Tags should be trimmed and case-preserved
            expect(item.tags).toEqual(['Tag With Spaces', 'UPPERCASE', 'mixed-CASE']);
        });
        it('should reject invalid type', async () => {
            const params = {
                type: 'invalid-type',
                title: 'Test',
                content: 'Content'
            };
            await expect(itemRepo.createItem(params)).rejects.toThrow();
        });
        it('should reject missing required fields', async () => {
            const params = {
                type: 'issues',
                title: 'Test Issue'
                // Missing content
            };
            await expect(itemRepo.createItem(params)).rejects.toThrow();
        });
        it('should handle file system errors gracefully', async () => {
            // Make directory read-only to cause write error
            const issuesDir = path.join(testDataDir, 'issues');
            await fs.chmod(issuesDir, 0o444);
            const params = {
                type: 'issues',
                title: 'Test Issue',
                content: 'Content'
            };
            try {
                await expect(itemRepo.createItem(params)).rejects.toThrow();
            }
            finally {
                // Restore permissions for cleanup
                await fs.chmod(issuesDir, 0o755);
            }
        });
        it('should support custom types', async () => {
            // First register a custom type
            await database.createType('customtasks', 'tasks');
            const params = {
                type: 'customtasks',
                title: 'Custom Task',
                content: 'Custom content',
                priority: 'low',
                status: 'In Progress'
            };
            const item = await itemRepo.createItem(params);
            expect(item).toBeDefined();
            expect(item.type).toBe('customtasks');
            expect(item.priority).toBe('low');
            expect(item.status).toBe('In Progress');
            // Verify file in correct directory
            const filePath = path.join(testDataDir, 'customtasks', `customtasks-${item.id}.md`);
            const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
            expect(fileExists).toBe(true);
        });
        it('should set timestamps correctly', async () => {
            const beforeCreate = new Date().toISOString();
            const item = await itemRepo.createItem({
                type: 'issues',
                title: 'Test Issue',
                content: 'Content'
            });
            const afterCreate = new Date().toISOString();
            expect(item.created_at).toBeDefined();
            expect(item.updated_at).toBeDefined();
            expect(item.created_at).toBe(item.updated_at); // Should be same on creation
            expect(new Date(item.created_at).getTime()).toBeGreaterThanOrEqual(new Date(beforeCreate).getTime());
            expect(new Date(item.created_at).getTime()).toBeLessThanOrEqual(new Date(afterCreate).getTime());
        });
        it('should handle sequential creates', async () => {
            // Create multiple items sequentially to ensure proper ID generation
            const items = [];
            for (let i = 0; i < 5; i++) {
                const item = await itemRepo.createItem({
                    type: 'issues',
                    title: `Sequential Issue ${i}`,
                    content: `Content ${i}`
                });
                items.push(item);
            }
            // All items should be created with unique IDs
            const ids = items.map(item => item.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(5);
            // IDs should be sequential
            expect(ids).toEqual(['1', '2', '3', '4', '5']);
        });
    });
    describe('getItem', () => {
        it('should retrieve an existing item', async () => {
            // First create an item
            const created = await itemRepo.createItem({
                type: 'issues',
                title: 'Test Issue',
                content: 'Issue content',
                description: 'Issue description',
                priority: 'high',
                status: 'Open',
                tags: ['bug', 'urgent']
            });
            // Then retrieve it
            const item = await itemRepo.getItem('issues', created.id);
            expect(item).toBeDefined();
            expect(item?.id).toBe(created.id);
            expect(item?.title).toBe('Test Issue');
            expect(item?.content).toBe('Issue content');
            expect(item?.description).toBe('Issue description');
            expect(item?.priority).toBe('high');
            expect(item?.status).toBe('Open');
            expect(item?.tags).toEqual(['bug', 'urgent']);
        });
        it('should return null for non-existent item', async () => {
            const item = await itemRepo.getItem('issues', '9999');
            expect(item).toBeNull();
        });
        it('should reject invalid type', async () => {
            await expect(itemRepo.getItem('invalid-type', '1')).rejects.toThrow();
        });
        it('should handle missing markdown file', async () => {
            // Create item then delete the file
            const created = await itemRepo.createItem({
                type: 'issues',
                title: 'Test Issue',
                content: 'Issue content'
            });
            const filePath = path.join(testDataDir, 'issues', `issues-${created.id}.md`);
            await fs.unlink(filePath);
            const item = await itemRepo.getItem('issues', created.id);
            expect(item).toBeNull();
        });
    });
    describe('updateItem', () => {
        it('should update all fields', async () => {
            // Create an item
            const created = await itemRepo.createItem({
                type: 'issues',
                title: 'Original Title',
                content: 'Original content',
                priority: 'low',
                status: 'Open',
                tags: ['original']
            });
            // Update it
            const updated = await itemRepo.updateItem({
                type: 'issues',
                id: created.id,
                title: 'Updated Title',
                content: 'Updated content',
                description: 'New description',
                priority: 'high',
                status: 'Closed',
                tags: ['updated', 'modified'],
                start_date: '2024-02-01',
                end_date: '2024-02-28',
                related_tasks: ['plans-1'],
                related_documents: ['docs-1']
            });
            expect(updated).toBeDefined();
            expect(updated?.id).toBe(created.id);
            expect(updated?.title).toBe('Updated Title');
            expect(updated?.content).toBe('Updated content');
            expect(updated?.description).toBe('New description');
            expect(updated?.priority).toBe('high');
            expect(updated?.status).toBe('Closed');
            expect(updated?.tags).toEqual(['updated', 'modified']);
            expect(updated?.start_date).toBe('2024-02-01');
            expect(updated?.end_date).toBe('2024-02-28');
            expect(updated?.related_tasks).toEqual(['plans-1']);
            expect(updated?.related_documents).toEqual(['docs-1']);
            expect(updated?.updated_at).not.toBe(created.updated_at);
        });
        it('should update partial fields', async () => {
            const created = await itemRepo.createItem({
                type: 'issues',
                title: 'Original Title',
                content: 'Original content',
                description: 'Original description',
                priority: 'medium',
                tags: ['original']
            });
            const updated = await itemRepo.updateItem({
                type: 'issues',
                id: created.id,
                title: 'New Title',
                priority: 'high'
            });
            expect(updated).toBeDefined();
            expect(updated?.title).toBe('New Title');
            expect(updated?.content).toBe('Original content'); // Unchanged
            expect(updated?.description).toBe('Original description'); // Unchanged
            expect(updated?.priority).toBe('high');
            expect(updated?.tags).toEqual(['original']); // Unchanged
        });
        it('should return null for non-existent item', async () => {
            const updated = await itemRepo.updateItem({
                type: 'issues',
                id: '9999',
                title: 'New Title'
            });
            expect(updated).toBeNull();
        });
        it('should handle empty tags update', async () => {
            const created = await itemRepo.createItem({
                type: 'issues',
                title: 'Test Issue',
                content: 'Content',
                tags: ['tag1', 'tag2']
            });
            const updated = await itemRepo.updateItem({
                type: 'issues',
                id: created.id,
                tags: []
            });
            expect(updated?.tags).toEqual([]);
        });
        it('should not change created_at on update', async () => {
            const created = await itemRepo.createItem({
                type: 'issues',
                title: 'Test Issue',
                content: 'Content'
            });
            await new Promise(resolve => setTimeout(resolve, 10)); // Wait a bit
            const updated = await itemRepo.updateItem({
                type: 'issues',
                id: created.id,
                title: 'Updated Title'
            });
            expect(updated?.created_at).toBe(created.created_at);
            expect(updated?.updated_at).not.toBe(created.updated_at);
        });
    });
    describe('deleteItem', () => {
        it('should delete an existing item', async () => {
            // Create an item
            const created = await itemRepo.createItem({
                type: 'issues',
                title: 'To Delete',
                content: 'Delete me'
            });
            // Verify it exists
            const exists = await itemRepo.getItem('issues', created.id);
            expect(exists).toBeDefined();
            // Delete it
            const result = await itemRepo.deleteItem('issues', created.id);
            expect(result).toBe(true);
            // Verify it's gone
            const deleted = await itemRepo.getItem('issues', created.id);
            expect(deleted).toBeNull();
            // Verify file is deleted
            const filePath = path.join(testDataDir, 'issues', `issues-${created.id}.md`);
            const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
            expect(fileExists).toBe(false);
        });
        it('should return false for non-existent item', async () => {
            const result = await itemRepo.deleteItem('issues', '9999');
            expect(result).toBe(false);
        });
        it('should remove item from SQLite', async () => {
            const created = await itemRepo.createItem({
                type: 'issues',
                title: 'To Delete',
                content: 'Delete me'
            });
            await itemRepo.deleteItem('issues', created.id);
            // Check SQLite
            const dbItem = await database.getDatabase().getAsync('SELECT * FROM items WHERE type = ? AND id = ?', ['issues', created.id]);
            expect(dbItem).toBeUndefined();
        });
        it('should handle file deletion errors gracefully', async () => {
            const created = await itemRepo.createItem({
                type: 'issues',
                title: 'To Delete',
                content: 'Delete me'
            });
            // Delete file manually first
            const filePath = path.join(testDataDir, 'issues', `issues-${created.id}.md`);
            await fs.unlink(filePath);
            // Should return false when file doesn't exist
            const result = await itemRepo.deleteItem('issues', created.id);
            expect(result).toBe(false);
        });
    });
    describe('getItems', () => {
        beforeEach(async () => {
            // Create test data
            await itemRepo.createItem({
                type: 'issues',
                title: 'Open Issue 1',
                content: 'Content',
                status: 'Open',
                priority: 'high'
            });
            await itemRepo.createItem({
                type: 'issues',
                title: 'In Progress Issue',
                content: 'Content',
                status: 'In Progress',
                priority: 'medium'
            });
            await itemRepo.createItem({
                type: 'issues',
                title: 'Closed Issue',
                content: 'Content',
                status: 'Closed',
                priority: 'low'
            });
            await itemRepo.createItem({
                type: 'plans',
                title: 'Plan 1',
                content: 'Content',
                status: 'Open'
            });
        });
        it('should get all items of a type', async () => {
            const items = await itemRepo.getItems('issues', true); // Include closed
            expect(items).toHaveLength(3);
            expect(items.every(item => item.type === 'issues')).toBe(true);
        });
        it('should filter by open statuses by default', async () => {
            const items = await itemRepo.getItems('issues');
            expect(items).toHaveLength(2); // Open and In Progress
            expect(items.every(item => item.status !== 'Closed')).toBe(true);
        });
        it('should include closed statuses when requested', async () => {
            const items = await itemRepo.getItems('issues', true);
            expect(items).toHaveLength(3); // All items
        });
        it('should filter by specific statuses', async () => {
            const items = await itemRepo.getItems('issues', false, ['Open']);
            expect(items).toHaveLength(1);
            expect(items[0].status).toBe('Open');
        });
        it('should return empty array for type with no items', async () => {
            const items = await itemRepo.getItems('docs');
            expect(items).toEqual([]);
        });
    });
    describe('searchItemsByTag', () => {
        beforeEach(async () => {
            await itemRepo.createItem({
                type: 'issues',
                title: 'Issue with bug tag',
                content: 'Content',
                tags: ['bug', 'high-priority']
            });
            await itemRepo.createItem({
                type: 'plans',
                title: 'Plan with bug tag',
                content: 'Content',
                tags: ['bug', 'feature']
            });
            await itemRepo.createItem({
                type: 'docs',
                title: 'Doc with feature tag',
                content: 'Content',
                tags: ['feature', 'api']
            });
        });
        it('should find items by tag', async () => {
            const items = await itemRepo.searchItemsByTag('bug');
            expect(items).toHaveLength(2);
            expect(items.every(item => item.tags.includes('bug'))).toBe(true);
        });
        it('should filter by types', async () => {
            const items = await itemRepo.searchItemsByTag('bug', ['issues']);
            expect(items).toHaveLength(1);
            expect(items[0].type).toBe('issues');
        });
        it('should search across multiple types', async () => {
            const items = await itemRepo.searchItemsByTag('feature', ['plans', 'docs']);
            expect(items).toHaveLength(2);
            expect(items.some(item => item.type === 'plans')).toBe(true);
            expect(items.some(item => item.type === 'docs')).toBe(true);
        });
        it('should return empty array for non-existent tag', async () => {
            const items = await itemRepo.searchItemsByTag('non-existent');
            expect(items).toEqual([]);
        });
    });
});
//# sourceMappingURL=item-repository.test.js.map