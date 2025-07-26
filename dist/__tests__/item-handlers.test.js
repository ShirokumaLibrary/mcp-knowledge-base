import { ItemHandlers } from '../handlers/item-handlers.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
// Mock the database
jest.mock('../database.js');
describe('ItemHandlers', () => {
    let handlers;
    let mockDb;
    let mockDbConnection;
    beforeEach(() => {
        jest.clearAllMocks();
        // Create mock database connection
        mockDbConnection = {
            getAsync: jest.fn(),
            allAsync: jest.fn(),
            runAsync: jest.fn()
        };
        // Create mock database instance with all required methods
        mockDb = {
            getDatabase: jest.fn().mockReturnValue(mockDbConnection),
            getAllTasksSummary: jest.fn(),
            getAllDocumentsSummary: jest.fn(),
            getTask: jest.fn(), // Changed from getTaskDetail
            getDocument: jest.fn(), // Changed from getDocumentDetail
            createTask: jest.fn(),
            createDocument: jest.fn(),
            updateTask: jest.fn(),
            updateDocument: jest.fn(),
            deleteTask: jest.fn(),
            deleteDocument: jest.fn(),
            searchAllByTag: jest.fn(),
            searchTasksByTag: jest.fn(),
            searchDocumentsByTag: jest.fn()
        };
        handlers = new ItemHandlers(mockDb);
    });
    describe('handleGetItems', () => {
        it('should get task items with default filtering', async () => {
            const mockTasks = [
                { id: 1, title: 'Task 1', status: 'Open' },
                { id: 2, title: 'Task 2', status: 'In Progress' }
            ];
            // Mock type validation
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.getAllTasksSummary = jest.fn().mockResolvedValue(mockTasks);
            const result = await handlers.handleGetItems({ type: 'issues' });
            expect(mockDb.getAllTasksSummary).toHaveBeenCalledWith('issues', false, undefined);
            const responseData = JSON.parse(result.content[0].text);
            expect(responseData.data).toEqual(mockTasks);
        });
        it('should get task items with closed statuses included', async () => {
            const mockTasks = [
                { id: 1, title: 'Task 1', status: 'Open' },
                { id: 2, title: 'Task 2', status: 'Closed' }
            ];
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.getAllTasksSummary = jest.fn().mockResolvedValue(mockTasks);
            const result = await handlers.handleGetItems({
                type: 'issues',
                includeClosedStatuses: true
            });
            expect(mockDb.getAllTasksSummary).toHaveBeenCalledWith('issues', true, undefined);
            const responseData = JSON.parse(result.content[0].text);
            expect(responseData.data).toEqual(mockTasks);
        });
        it('should get document items', async () => {
            const mockDocs = [
                { id: 1, title: 'Doc 1', type: 'docs' },
                { id: 2, title: 'Doc 2', type: 'docs' }
            ];
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'docs' })
                .mockResolvedValueOnce({ base_type: 'documents' });
            mockDb.getAllDocumentsSummary = jest.fn().mockResolvedValue(mockDocs);
            const result = await handlers.handleGetItems({ type: 'docs' });
            expect(mockDb.getAllDocumentsSummary).toHaveBeenCalledWith('docs');
            const responseData = JSON.parse(result.content[0].text);
            expect(responseData.data).toEqual(mockDocs);
        });
        it('should throw error for unknown type', async () => {
            mockDbConnection.getAsync.mockResolvedValue(undefined);
            await expect(handlers.handleGetItems({ type: 'invalid' }))
                .rejects.toThrow(McpError);
        });
    });
    describe('handleGetItemDetail', () => {
        it('should get task detail', async () => {
            const mockTask = {
                id: 1,
                title: 'Task 1',
                content: 'Content',
                status: 'Open'
            };
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.getTask = jest.fn().mockResolvedValue(mockTask);
            const result = await handlers.handleGetItemDetail({
                type: 'issues',
                id: 1
            });
            expect(mockDb.getTask).toHaveBeenCalledWith('issues', 1);
            const responseData = JSON.parse(result.content[0].text);
            expect(responseData.data).toEqual(mockTask);
        });
        it('should return error for non-existent item', async () => {
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.getTask = jest.fn().mockResolvedValue(null);
            await expect(handlers.handleGetItemDetail({
                type: 'issues',
                id: 999
            })).rejects.toThrow('issues ID 999 not found');
        });
    });
    describe('handleCreateItem', () => {
        it('should create task with required fields', async () => {
            const mockTask = {
                id: 1,
                title: 'New Task',
                content: 'Task content',
                priority: 'high',
                status: 'Open',
                tags: []
            };
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.createTask = jest.fn().mockResolvedValue(mockTask);
            const result = await handlers.handleCreateItem({
                type: 'issues',
                title: 'New Task',
                content: 'Task content',
                priority: 'high'
            });
            // Check that createTask was called
            expect(mockDb.createTask).toHaveBeenCalled();
            // Response format is "issues created: {json}"
            const text = result.content[0].text;
            expect(text).toContain('issues created:');
            const jsonPart = text.replace('issues created: ', '');
            const responseData = JSON.parse(jsonPart);
            expect(responseData).toEqual(mockTask);
        });
        it('should create document with required fields', async () => {
            const mockDoc = {
                id: 1,
                title: 'New Doc',
                content: 'Doc content',
                type: 'docs'
            };
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'docs' })
                .mockResolvedValueOnce({ base_type: 'documents' });
            mockDb.createDocument = jest.fn().mockResolvedValue(mockDoc);
            const result = await handlers.handleCreateItem({
                type: 'docs',
                title: 'New Doc',
                content: 'Doc content'
            });
            // Check that createDocument was called
            expect(mockDb.createDocument).toHaveBeenCalled();
            // Response format is "docs created: {json}"
            const text = result.content[0].text;
            expect(text).toContain('docs created:');
            const jsonPart = text.replace('docs created: ', '');
            const responseData = JSON.parse(jsonPart);
            expect(responseData).toEqual(mockDoc);
        });
        it('should validate required content for documents', async () => {
            await expect(handlers.handleCreateItem({
                type: 'docs',
                title: 'New Doc'
                // missing content
            })).rejects.toThrow();
        });
        it('should validate status names for tasks', async () => {
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.createTask = jest.fn().mockRejectedValue(new Error('Invalid status: InvalidStatus'));
            await expect(handlers.handleCreateItem({
                type: 'issues',
                title: 'New Task',
                content: 'Content',
                status: 'InvalidStatus'
            })).rejects.toThrow('Invalid status: InvalidStatus');
        });
    });
    describe('handleUpdateItem', () => {
        it('should update task fields', async () => {
            const mockTask = {
                id: 1,
                title: 'Updated Task',
                content: 'Updated content',
                status: 'In Progress'
            };
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.updateTask = jest.fn().mockResolvedValue(mockTask);
            const result = await handlers.handleUpdateItem({
                type: 'issues',
                id: 1,
                title: 'Updated Task',
                content: 'Updated content',
                status: 'In Progress'
            });
            expect(mockDb.updateTask).toHaveBeenCalled();
            // Response format is "issues updated: {json}"
            const text = result.content[0].text;
            expect(text).toContain('issues updated:');
            const jsonPart = text.replace('issues updated: ', '');
            const responseData = JSON.parse(jsonPart);
            expect(responseData).toEqual(mockTask);
        });
        it('should handle partial updates', async () => {
            const mockTask = {
                id: 1,
                title: 'Task 1',
                content: 'Original content',
                status: 'In Progress'
            };
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.updateTask = jest.fn().mockResolvedValue(mockTask);
            await handlers.handleUpdateItem({
                type: 'issues',
                id: 1,
                status: 'In Progress'
                // only updating status
            });
            expect(mockDb.updateTask).toHaveBeenCalledWith('issues', 1, undefined, undefined, undefined, 'In Progress', undefined, undefined, undefined, undefined, undefined);
        });
    });
    describe('handleDeleteItem', () => {
        it('should delete existing item', async () => {
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.deleteTask = jest.fn().mockResolvedValue(true);
            const result = await handlers.handleDeleteItem({
                type: 'issues',
                id: 1
            });
            expect(mockDb.deleteTask).toHaveBeenCalledWith('issues', 1);
            // Response format is plain text: "issues ID 1 deleted"
            expect(result.content[0].text).toBe('issues ID 1 deleted');
        });
        it('should throw error for non-existent item', async () => {
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.deleteTask = jest.fn().mockResolvedValue(false);
            await expect(handlers.handleDeleteItem({
                type: 'issues',
                id: 999
            })).rejects.toThrow('issues ID 999 not found');
        });
    });
    describe('handleSearchItemsByTag', () => {
        it('should search across all types when types not specified', async () => {
            const mockIssueResults = [{ id: 1, title: 'Issue with API' }];
            const mockPlanResults = [];
            const mockDocResults = [{ id: 1, title: 'API Doc' }];
            const mockKnowledgeResults = [];
            mockDbConnection.allAsync.mockResolvedValue([
                { type: 'issues' },
                { type: 'plans' },
                { type: 'docs' },
                { type: 'knowledge' }
            ]);
            // Mock type validation for all types
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' })
                .mockResolvedValueOnce({ type: 'plans' })
                .mockResolvedValueOnce({ base_type: 'tasks' })
                .mockResolvedValueOnce({ type: 'docs' })
                .mockResolvedValueOnce({ base_type: 'documents' })
                .mockResolvedValueOnce({ type: 'knowledge' })
                .mockResolvedValueOnce({ base_type: 'documents' });
            // Mock search methods for each type
            mockDb.searchTasksByTag = jest.fn()
                .mockImplementation((type, tag) => {
                if (type === 'issues' && tag === 'api')
                    return Promise.resolve(mockIssueResults);
                if (type === 'plans' && tag === 'api')
                    return Promise.resolve(mockPlanResults);
                return Promise.resolve([]);
            });
            mockDb.searchDocumentsByTag = jest.fn()
                .mockImplementation((tag, type) => {
                if (type === 'docs' && tag === 'api')
                    return Promise.resolve(mockDocResults);
                if (type === 'knowledge' && tag === 'api')
                    return Promise.resolve(mockKnowledgeResults);
                return Promise.resolve([]);
            });
            const result = await handlers.handleSearchItemsByTag({
                tag: 'api'
            });
            // The handler calls individual search methods for each type
            expect(mockDb.searchTasksByTag).toHaveBeenCalledWith('issues', 'api');
            expect(mockDb.searchTasksByTag).toHaveBeenCalledWith('plans', 'api');
            expect(mockDb.searchDocumentsByTag).toHaveBeenCalledWith('api', 'docs');
            expect(mockDb.searchDocumentsByTag).toHaveBeenCalledWith('api', 'knowledge');
            const responseData = JSON.parse(result.content[0].text);
            expect(responseData.data.tasks).toEqual({
                issues: mockIssueResults,
                plans: mockPlanResults
            });
            expect(responseData.data.documents).toEqual({
                docs: mockDocResults,
                knowledge: mockKnowledgeResults
            });
        });
        it('should search specific types when provided', async () => {
            const mockIssueResults = [{ id: 1, title: 'Issue 1' }];
            const mockDocResults = [{ id: 1, title: 'Doc 1' }];
            // Mock type validation for each type
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' })
                .mockResolvedValueOnce({ type: 'docs' })
                .mockResolvedValueOnce({ base_type: 'documents' });
            mockDb.searchTasksByTag = jest.fn().mockResolvedValue(mockIssueResults);
            mockDb.searchDocumentsByTag = jest.fn().mockResolvedValue(mockDocResults);
            const result = await handlers.handleSearchItemsByTag({
                tag: 'api',
                types: ['issues', 'docs']
            });
            expect(mockDb.searchTasksByTag).toHaveBeenCalledWith('issues', 'api');
            expect(mockDb.searchDocumentsByTag).toHaveBeenCalledWith('api', 'docs');
            const responseData = JSON.parse(result.content[0].text);
            expect(responseData.data.tasks.issues).toEqual(mockIssueResults);
            expect(responseData.data.documents.docs).toEqual(mockDocResults);
        });
        it('should handle empty results', async () => {
            const emptyResults = {
                issues: [],
                plans: [],
                docs: [],
                knowledge: [],
                sessions: []
            };
            mockDbConnection.allAsync.mockResolvedValue([
                { type: 'issues' },
                { type: 'plans' },
                { type: 'docs' },
                { type: 'knowledge' }
            ]);
            // First check if searchAllByTag is being called
            mockDb.searchAllByTag = jest.fn().mockResolvedValue(emptyResults);
            const result = await handlers.handleSearchItemsByTag({
                tag: 'nonexistent'
            });
            const responseData = JSON.parse(result.content[0].text);
            // If searchAllByTag returns the full structure, use it directly
            if (mockDb.searchAllByTag.mock.calls.length > 0) {
                expect(responseData.data).toEqual(emptyResults);
            }
            else {
                // Otherwise check for the grouped structure
                expect(responseData.data).toEqual({});
            }
        });
    });
    describe('Edge cases and error handling', () => {
        it('should handle database errors gracefully', async () => {
            mockDbConnection.getAsync
                .mockResolvedValueOnce({ type: 'issues' })
                .mockResolvedValueOnce({ base_type: 'tasks' });
            mockDb.createTask = jest.fn().mockRejectedValue(new Error('Database connection failed'));
            await expect(handlers.handleCreateItem({
                type: 'issues',
                title: 'Task',
                content: 'Content'
            })).rejects.toThrow('Database connection failed');
        });
        it('should validate date formats', async () => {
            await expect(handlers.handleCreateItem({
                type: 'plans',
                title: 'Plan',
                content: 'Content',
                start_date: 'invalid-date'
            })).rejects.toThrow('Date must be in YYYY-MM-DD format');
        });
        it('should handle concurrent operations', async () => {
            mockDbConnection.getAsync.mockResolvedValue({ type: 'issues', base_type: 'tasks' });
            // Simulate concurrent create operations
            const promises = Array(5).fill(null).map((_, i) => handlers.handleCreateItem({
                type: 'issues',
                title: `Task ${i}`,
                content: 'Content'
            }));
            mockDb.createTask = jest.fn().mockImplementation((type, title) => Promise.resolve({
                id: parseInt(title.split(' ')[1]) + 1,
                title,
                type
            }));
            const results = await Promise.all(promises);
            expect(results).toHaveLength(5);
            expect(mockDb.createTask).toHaveBeenCalledTimes(5);
        });
    });
});
//# sourceMappingURL=item-handlers.test.js.map