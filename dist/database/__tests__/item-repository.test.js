// @ts-nocheck
/**
 * @ai-context Comprehensive tests for ItemRepository
 * @ai-pattern Test all CRUD operations and edge cases
 * @ai-critical Ensure data integrity and type safety
 */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ItemRepository } from '../item-repository.js';
import { StatusRepository } from '../status-repository.js';
import { TagRepository } from '../tag-repository.js';
import { TypeRepository } from '../type-repository.js';
import * as fs from 'fs/promises';
// Mock dependencies
jest.mock('../base.js');
jest.mock('../status-repository.js');
jest.mock('../tag-repository.js');
jest.mock('../type-repository.js');
jest.mock('fs/promises');
jest.mock('glob');
describe('ItemRepository', () => {
    let itemRepo;
    let mockDb;
    let mockStatusRepo;
    let mockTagRepo;
    let mockTypeRepo;
    let mockDatabase;
    let mockWriteFile;
    let mockReadFile;
    let mockMkdir;
    let mockUnlink;
    const testDataDir = '/test/data';
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        // Setup fs mocks
        mockWriteFile = fs.writeFile;
        mockReadFile = fs.readFile;
        mockMkdir = fs.mkdir;
        mockUnlink = fs.unlink;
        // Create mock instances using mocked constructors
        const MockedDatabase = Database;
        const MockedStatusRepository = StatusRepository;
        const MockedTagRepository = TagRepository;
        const MockedTypeRepository = TypeRepository;
        mockDb = {
            getAsync: jest.fn(),
            allAsync: jest.fn(),
            runAsync: jest.fn()
        };
        mockStatusRepo = {
            getStatusByName: jest.fn().mockResolvedValue({ id: 1, name: 'Open', is_closed: false }),
            getStatusById: jest.fn().mockResolvedValue({ id: 1, name: 'Open', is_closed: false }),
            getClosedStatusIds: jest.fn().mockResolvedValue([])
        };
        mockTagRepo = {
            registerTags: jest.fn().mockResolvedValue(undefined),
            saveEntityTags: jest.fn().mockResolvedValue(undefined),
            getEntityTags: jest.fn().mockResolvedValue([]),
            getTagIdByName: jest.fn().mockResolvedValue(1)
        };
        mockTypeRepo = {
            typeExists: jest.fn().mockResolvedValue(true),
            getBaseType: jest.fn().mockResolvedValue('tasks')
        };
        mockDatabase = {
            getTypeRepository: jest.fn().mockReturnValue(mockTypeRepo)
        };
        // Setup default mock implementations
        mockDb.getAsync = jest.fn();
        mockDb.allAsync = jest.fn();
        mockDb.runAsync = jest.fn();
        mockStatusRepo.getStatusByName = jest.fn().mockResolvedValue({ id: 1, name: 'Open', is_closed: false });
        mockStatusRepo.getStatusById = jest.fn().mockResolvedValue({ id: 1, name: 'Open', is_closed: false });
        mockStatusRepo.getClosedStatusIds = jest.fn().mockResolvedValue([]);
        mockTagRepo.registerTags = jest.fn().mockResolvedValue(undefined);
        mockTagRepo.saveEntityTags = jest.fn().mockResolvedValue(undefined);
        mockTagRepo.getEntityTags = jest.fn().mockResolvedValue([]);
        mockTagRepo.getTagIdByName = jest.fn().mockResolvedValue(1);
        mockTypeRepo.typeExists = jest.fn().mockResolvedValue(true);
        mockTypeRepo.getBaseType = jest.fn().mockResolvedValue('tasks');
        // Create repository instance
        itemRepo = new ItemRepository(mockDb, testDataDir, mockStatusRepo, mockTagRepo);
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    describe('createItem', () => {
        test('should create a new item with all required fields', async () => {
            const createParams = {
                type: 'issues',
                title: 'Test Issue',
                content: 'Test content',
                tags: ['bug', 'urgent'],
                priority: 'high',
                status: 'Open'
            };
            // Mock type check
            mockDb.getAsync.mockResolvedValueOnce({ type: 'issues', base_type: 'tasks' });
            // Mock ID generation
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 }); // Create sequence
            mockDb.getAsync.mockResolvedValueOnce({ current_value: 0 }); // Get current ID (will be incremented to 1)
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 }); // Increment ID
            // Mock file operations
            mockMkdir.mockResolvedValueOnce(undefined);
            mockWriteFile.mockResolvedValueOnce(undefined);
            // Mock database sync
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 }); // Insert into items
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 }); // Insert into search
            const result = await itemRepo.createItem(createParams);
            expect(result).toMatchObject({
                id: '0',
                type: 'issues',
                title: 'Test Issue',
                content: 'Test content',
                tags: ['bug', 'urgent'],
                priority: 'high',
                status_id: 1
            });
            expect(mockTagRepo.registerTags).toHaveBeenCalledWith(['bug', 'urgent']);
            expect(mockStatusRepo.getStatusByName).toHaveBeenCalledWith('Open');
        });
        test('should handle missing optional fields', async () => {
            const createParams = {
                type: 'docs',
                title: 'Test Document'
            };
            mockDb.getAsync.mockResolvedValueOnce({ type: 'docs', base_type: 'documents' });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockDb.getAsync.mockResolvedValueOnce({ current_value: 2 });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockMkdir.mockResolvedValueOnce(undefined);
            mockWriteFile.mockResolvedValueOnce(undefined);
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            const result = await itemRepo.createItem(createParams);
            expect(result.content).toBe('');
            expect(result.tags).toEqual([]);
            expect(result.priority).toBe('medium');
        });
        test('should throw error for invalid type', async () => {
            const createParams = {
                type: 'invalid_type',
                title: 'Test'
            };
            mockDb.getAsync.mockResolvedValueOnce(undefined); // Type not found
            await expect(itemRepo.createItem(createParams)).rejects.toThrow('Unknown type: invalid_type');
        });
    });
    describe('getById', () => {
        test('should find item by ID and type', async () => {
            const mockMarkdown = `---
id: 1
title: Test Issue
tags: ["bug"]
related: []
status: Open
status_id: 1
priority: high
created_at: 2025-01-29T10:00:00Z
updated_at: 2025-01-29T10:00:00Z
---

Test content`;
            mockReadFile.mockResolvedValueOnce(mockMarkdown);
            const result = await itemRepo.getById('issues', '1');
            expect(result).toMatchObject({
                id: '1',
                type: 'issues',
                title: 'Test Issue',
                content: 'Test content',
                tags: ['bug'],
                priority: 'high'
            });
        });
        test('should return null for non-existent item', async () => {
            mockReadFile.mockRejectedValueOnce(new Error('File not found'));
            const result = await itemRepo.getById('issues', '999');
            expect(result).toBeNull();
        });
    });
    describe('update', () => {
        test('should update existing item', async () => {
            const updateParams = {
                type: 'issues',
                id: '1',
                title: 'Updated Title',
                tags: ['updated', 'modified'],
                priority: 'low'
            };
            // Mock existing item
            const mockMarkdown = `---
id: 1
title: Old Title
tags: ["old"]
related: []
status: Open
status_id: 1
priority: high
created_at: 2025-01-29T10:00:00Z
updated_at: 2025-01-29T10:00:00Z
---

Content`;
            mockReadFile.mockResolvedValueOnce(mockMarkdown);
            mockMkdir.mockResolvedValueOnce(undefined);
            mockWriteFile.mockResolvedValueOnce(undefined);
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 }); // Update in DB
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 }); // Update in search
            const result = await itemRepo.update('issues', '1', updateParams);
            expect(result).toMatchObject({
                id: '1',
                type: 'issues',
                title: 'Updated Title',
                tags: ['updated', 'modified'],
                priority: 'low'
            });
            expect(mockTagRepo.registerTags).toHaveBeenCalledWith(['updated', 'modified']);
        });
        test('should return null for non-existent item', async () => {
            mockReadFile.mockRejectedValueOnce(new Error('File not found'));
            const result = await itemRepo.update('issues', '999', { type: 'issues', id: '999', title: 'Updated' });
            expect(result).toBeNull();
        });
    });
    describe('delete', () => {
        test('should delete existing item', async () => {
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 }); // Delete from items
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 }); // Delete from search
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 }); // Delete from item_tags
            mockUnlink.mockResolvedValueOnce(undefined);
            const result = await itemRepo.delete('issues', '1');
            expect(result).toBe(true);
            expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM items'), expect.arrayContaining(['issues', '1']));
        });
        test('should return false for non-existent item', async () => {
            mockUnlink.mockRejectedValueOnce(new Error('File not found'));
            const result = await itemRepo.delete('issues', '999');
            expect(result).toBe(false);
        });
    });
    describe('findAll', () => {
        test('should find all items by type', async () => {
            const mockRows = [
                {
                    id: '1',
                    type: 'issues',
                    title: 'Issue 1',
                    content: 'Content 1',
                    tags: JSON.stringify(['bug']),
                    related: JSON.stringify([]),
                    status: 'Open',
                    status_id: 1,
                    priority: 'high',
                    created_at: '2025-01-29T10:00:00Z',
                    updated_at: '2025-01-29T10:00:00Z'
                },
                {
                    id: '2',
                    type: 'issues',
                    title: 'Issue 2',
                    content: 'Content 2',
                    tags: JSON.stringify(['feature']),
                    related: JSON.stringify([]),
                    status: 'Closed',
                    status_id: 2,
                    priority: 'low',
                    created_at: '2025-01-29T10:00:00Z',
                    updated_at: '2025-01-29T10:00:00Z'
                }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockRows);
            const result = await itemRepo.findAll({ type: 'issues' });
            expect(result).toHaveLength(2);
            expect(result[0].title).toBe('Issue 1');
            expect(result[1].title).toBe('Issue 2');
        });
        test('should filter by closed statuses', async () => {
            mockStatusRepo.getClosedStatusIds.mockResolvedValueOnce([2, 3]);
            const mockRows = [
                {
                    id: '1',
                    type: 'issues',
                    title: 'Open Issue',
                    status_id: 1,
                    content: '',
                    tags: JSON.stringify([]),
                    related: JSON.stringify([]),
                    priority: 'medium',
                    created_at: '2025-01-29T10:00:00Z',
                    updated_at: '2025-01-29T10:00:00Z'
                }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockRows);
            const result = await itemRepo.findAll({
                type: 'issues',
                includeClosedStatuses: false
            });
            expect(result).toHaveLength(1);
            expect(mockDb.allAsync).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
        });
    });
    describe('search functionality', () => {
        test('should search items by tag', async () => {
            const mockRows = [
                {
                    item_id: '1',
                    type: 'issues'
                }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockRows);
            // Mock reading the actual item
            const mockMarkdown = `---
id: 1
title: Tagged Issue
tags: ["bug", "urgent"]
related: []
status: Open
status_id: 1
priority: high
created_at: 2025-01-29T10:00:00Z
updated_at: 2025-01-29T10:00:00Z
---

Content`;
            mockReadFile.mockResolvedValueOnce(mockMarkdown);
            const result = await itemRepo.searchByTag('bug');
            expect(result).toHaveLength(1);
            expect(result[0].tags).toContain('bug');
        });
        test('should handle date range filters', async () => {
            mockDb.allAsync.mockResolvedValueOnce([]);
            await itemRepo.findAll({
                type: 'issues',
                startDate: '2025-01-01',
                endDate: '2025-01-31'
            });
            expect(mockDb.allAsync).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
        });
    });
    describe('type validation', () => {
        test('should validate task types', async () => {
            const createParams = {
                type: 'issues',
                title: 'Task Item',
                priority: 'high',
                status: 'Open'
            };
            mockDb.getAsync.mockResolvedValueOnce({ type: 'issues', base_type: 'tasks' });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockDb.getAsync.mockResolvedValueOnce({ current_value: 1 });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockMkdir.mockResolvedValueOnce(undefined);
            mockWriteFile.mockResolvedValueOnce(undefined);
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            const result = await itemRepo.createItem(createParams);
            expect(result.priority).toBe('high');
            expect(result.status_id).toBe(1);
        });
        test('should validate document types', async () => {
            const createParams = {
                type: 'docs',
                title: 'Document Item',
                content: 'Document content'
            };
            mockDb.getAsync.mockResolvedValueOnce({ type: 'docs', base_type: 'documents' });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockDb.getAsync.mockResolvedValueOnce({ current_value: 2 });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockMkdir.mockResolvedValueOnce(undefined);
            mockWriteFile.mockResolvedValueOnce(undefined);
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            const result = await itemRepo.createItem(createParams);
            expect(result.content).toBe('Document content');
        });
    });
    describe('error handling', () => {
        test('should handle database errors gracefully', async () => {
            mockReadFile.mockRejectedValueOnce(new Error('Read error'));
            const result = await itemRepo.getById('issues', '1');
            expect(result).toBeNull();
        });
        test('should handle file system errors', async () => {
            const createParams = {
                type: 'issues',
                title: 'Test Issue'
            };
            mockDb.getAsync.mockResolvedValueOnce({ type: 'issues', base_type: 'tasks' });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockDb.getAsync.mockResolvedValueOnce({ current_value: 1 });
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            mockMkdir.mockResolvedValueOnce(undefined);
            mockWriteFile.mockRejectedValueOnce(new Error('File write error'));
            await expect(itemRepo.createItem(createParams)).rejects.toThrow('File write error');
        });
    });
});
//# sourceMappingURL=item-repository.test.js.map