/**
 * @ai-context Unit tests for ItemHandlers
 * @ai-pattern Test item CRUD operations
 * @ai-critical Ensures item management works correctly
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import { ItemHandlers } from '../item-handlers.js';
import { createMockDatabase, createMockRepository, TestDataFactory } from '../../test-utils/index.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
describe('ItemHandlers', () => {
    let handler;
    let mockDatabase;
    let mockIssueRepo;
    beforeEach(() => {
        mockDatabase = createMockDatabase();
        mockIssueRepo = createMockRepository('issue', [
            TestDataFactory.createIssue({ id: 1, title: 'Test Issue 1' }),
            TestDataFactory.createIssue({ id: 2, title: 'Test Issue 2' })
        ]);
        mockDatabase.issueRepository = mockIssueRepo;
        handler = new ItemHandlers(mockDatabase);
    });
    describe('handleGetItems', () => {
        it('should list all issues', async () => {
            const result = await handler.handleGetItems({ type: 'issues' });
            expect(result.content[0].text).toContain('Found 2 items');
            expect(result.content[0].text).toContain('Test Issue 1');
            expect(result.content[0].text).toContain('Test Issue 2');
        });
        it('should filter by status IDs', async () => {
            mockDatabase.getItemsByType = jest.fn().mockResolvedValue([
                TestDataFactory.createIssue({ id: 1, status: 'Open' })
            ]);
            const result = await handler.handleGetItems({ type: 'issues', statusIds: [1] });
            expect(mockDatabase.getItemsByType).toHaveBeenCalledWith('issues', { statusIds: [1] });
            expect(result.content[0].text).toContain('Found 1 item');
        });
        it('should filter by closed statuses', async () => {
            mockDatabase.getItemsByType = jest.fn().mockResolvedValue([
                TestDataFactory.createIssue({ id: 3, status: 'Done' })
            ]);
            const result = await handler.handleGetItems({ type: 'issues', includeClosedStatuses: true });
            expect(mockDatabase.getItemsByType).toHaveBeenCalledWith('issues', { includeClosedStatuses: true });
        });
        it('should handle empty results', async () => {
            mockDatabase.getItemsByType = jest.fn().mockResolvedValue([]);
            const result = await handler.handleGetItems({ type: 'issues' });
            expect(result.content[0].text).toBe('No items found for type: issues');
        });
    });
    describe('handleGetItemDetail', () => {
        it('should get issue by id', async () => {
            const issue = TestDataFactory.createIssue({
                id: 1,
                title: 'Test Issue',
                content: 'Issue content',
                priority: 'high',
                tags: ['bug', 'urgent']
            });
            mockDatabase.getItemDetail = jest.fn().mockResolvedValue(issue);
            const result = await handler.handleGetItemDetail({ type: 'issues', id: 1 });
            expect(result.content[0].text).toContain('# Test Issue');
            expect(result.content[0].text).toContain('**Priority:** high');
            expect(result.content[0].text).toContain('- bug');
            expect(result.content[0].text).toContain('- urgent');
        });
        it('should throw error for non-existent issue', async () => {
            mockDatabase.getItemDetail = jest.fn().mockResolvedValue(null);
            await expect(handler.handleGetItemDetail({ type: 'issues', id: 999 }))
                .rejects.toThrow(McpError);
            await expect(handler.handleGetItemDetail({ type: 'issues', id: 999 }))
                .rejects.toMatchObject({
                code: ErrorCode.InvalidParams,
                message: expect.stringContaining('Item not found')
            });
        });
    });
    describe('handleCreateItem', () => {
        it('should create new issue', async () => {
            const newIssue = TestDataFactory.createIssue({
                id: 3,
                title: 'New Issue',
                content: 'New content'
            });
            mockDatabase.createItem = jest.fn().mockResolvedValue(newIssue);
            const result = await handler.handleCreateItem({
                type: 'issues',
                title: 'New Issue',
                content: 'New content'
            });
            expect(mockDatabase.createItem).toHaveBeenCalledWith('issues', {
                title: 'New Issue',
                content: 'New content'
            });
            expect(result.content[0].text).toContain('Created issues #3');
            expect(result.content[0].text).toContain('New Issue');
        });
        it('should create issue with all fields', async () => {
            mockDatabase.createItem = jest.fn().mockResolvedValue(TestDataFactory.createIssue({ id: 4 }));
            await handler.handleCreateItem({
                type: 'issues',
                title: 'Full Issue',
                content: 'Full content',
                priority: 'high',
                status: 'In Progress',
                tags: ['feature', 'ui'],
                description: 'Detailed description',
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                related_tasks: ['plans-1'],
                related_documents: ['docs-1']
            });
            expect(mockDatabase.createItem).toHaveBeenCalledWith('issues', expect.objectContaining({
                priority: 'high',
                status: 'In Progress',
                tags: ['feature', 'ui']
            }));
        });
    });
    describe('handleUpdateItem', () => {
        it('should update existing issue', async () => {
            const updatedIssue = TestDataFactory.createIssue({ id: 1, title: 'Updated Issue' });
            mockDatabase.updateItem = jest.fn().mockResolvedValue(updatedIssue);
            const result = await handler.handleUpdateItem({
                type: 'issues',
                id: 1,
                title: 'Updated Issue'
            });
            expect(mockDatabase.updateItem).toHaveBeenCalledWith('issues', 1, { title: 'Updated Issue' });
            expect(result.content[0].text).toContain('Updated issues #1');
        });
        it('should throw error if update fails', async () => {
            mockDatabase.updateItem = jest.fn().mockResolvedValue(null);
            await expect(handler.handleUpdateItem({ type: 'issues', id: 999, title: 'Test' }))
                .rejects.toThrow(McpError);
        });
    });
    describe('handleDeleteItem', () => {
        it('should delete issue', async () => {
            mockDatabase.deleteItem = jest.fn().mockResolvedValue(true);
            const result = await handler.handleDeleteItem({ type: 'issues', id: 1 });
            expect(mockDatabase.deleteItem).toHaveBeenCalledWith('issues', 1);
            expect(result.content[0].text).toBe('Successfully deleted issues #1');
        });
        it('should throw error if delete fails', async () => {
            mockDatabase.deleteItem = jest.fn().mockResolvedValue(false);
            await expect(handler.handleDeleteItem({ type: 'issues', id: 999 }))
                .rejects.toThrow(McpError);
        });
    });
    describe('handleSearchItemsByTag', () => {
        it('should search issues by tag', async () => {
            const searchResults = [
                TestDataFactory.createIssue({ id: 1, title: 'Bug in auth', tags: ['bug'] }),
                TestDataFactory.createIssue({ id: 2, title: 'Another bug', tags: ['bug'] })
            ];
            mockDatabase.searchItemsByTag = jest.fn().mockResolvedValue(searchResults);
            const result = await handler.handleSearchItemsByTag({ tag: 'bug' });
            expect(mockDatabase.searchItemsByTag).toHaveBeenCalledWith('bug', undefined);
            expect(result.content[0].text).toContain('Found 2 items');
        });
        it('should search with type filter', async () => {
            await handler.handleSearchItemsByTag({ tag: 'test', types: ['issues', 'plans'] });
            expect(mockDatabase.searchItemsByTag).toHaveBeenCalledWith('test', ['issues', 'plans']);
        });
    });
});
//# sourceMappingURL=issue-handler.test.js.map