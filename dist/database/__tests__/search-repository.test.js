// @ts-nocheck
/**
 * @ai-context Tests for SearchRepository
 * @ai-pattern Test full-text search functionality
 * @ai-critical Ensures search functionality works correctly
 */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SearchRepository } from '../search-repository.js';
// Mock dependencies
jest.mock('../base.js');
// Mock BaseRepository constructor
jest.mock('../base.js', () => ({
    BaseRepository: jest.fn().mockImplementation(function (db, loggerName) {
        this.db = db;
        this.logger = { error: jest.fn(), info: jest.fn(), debug: jest.fn() };
    })
}));
describe('SearchRepository', () => {
    let searchRepo;
    let mockDb;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        // Setup mock database
        mockDb = {
            getAsync: jest.fn(),
            allAsync: jest.fn(),
            runAsync: jest.fn()
        };
        // Create a new instance for each test
        searchRepo = new SearchRepository(mockDb);
        // Ensure db is properly set
        searchRepo.db = mockDb;
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    describe('searchContent', () => {
        test('should search items by query in title, content, and description', async () => {
            const mockResults = [
                {
                    type: 'issues',
                    id: '1',
                    title: 'Test Issue',
                    description: 'Test description',
                    content: 'Test content with search term',
                    tags: JSON.stringify(['bug', 'test']),
                    created_at: '2025-01-29T10:00:00Z',
                    updated_at: '2025-01-29T10:00:00Z'
                },
                {
                    type: 'docs',
                    id: '2',
                    title: 'Documentation about test',
                    description: null,
                    content: 'Documentation content',
                    tags: JSON.stringify(['docs']),
                    created_at: '2025-01-29T11:00:00Z',
                    updated_at: '2025-01-29T11:00:00Z'
                }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockResults);
            const results = await searchRepo.searchContent('test');
            expect(results).toHaveLength(2);
            expect(results[0]).toMatchObject({
                type: 'issues',
                id: '1',
                title: 'Test Issue',
                description: 'Test description',
                tags: ['bug', 'test']
            });
            expect(results[0].content).toContain('Test content');
            expect(results[0].content).toContain('...');
            expect(mockDb.allAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE title LIKE ? OR content LIKE ? OR description LIKE ?'), ['%test%', '%test%', '%test%']);
        });
        test('should handle empty search results', async () => {
            mockDb.allAsync.mockResolvedValueOnce([]);
            const results = await searchRepo.searchContent('nonexistent');
            expect(results).toEqual([]);
        });
        test('should handle null content and tags', async () => {
            const mockResults = [
                {
                    type: 'issues',
                    id: '1',
                    title: 'Test Issue',
                    description: 'Test',
                    content: null,
                    tags: null,
                    created_at: '2025-01-29T10:00:00Z',
                    updated_at: '2025-01-29T10:00:00Z'
                }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockResults);
            const results = await searchRepo.searchContent('test');
            expect(results[0].content).toBe('');
            expect(results[0].tags).toEqual([]);
        });
        test('should truncate long content', async () => {
            const longContent = 'a'.repeat(300);
            const mockResults = [
                {
                    type: 'docs',
                    id: '1',
                    title: 'Test',
                    description: null,
                    content: longContent,
                    tags: JSON.stringify([]),
                    created_at: '2025-01-29T10:00:00Z',
                    updated_at: '2025-01-29T10:00:00Z'
                }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockResults);
            const results = await searchRepo.searchContent('test');
            expect(results[0].content).toHaveLength(203); // 200 + '...'
            expect(results[0].content.endsWith('...')).toBe(true);
        });
    });
    describe('searchAllByTag', () => {
        test('should search and group items by tag', async () => {
            const mockResults = [
                {
                    type: 'issues',
                    id: '1',
                    title: 'Bug Issue',
                    description: 'Bug description',
                    content: 'Content',
                    tags: JSON.stringify(['bug', 'urgent']),
                    priority: 'high',
                    created_at: '2025-01-29T10:00:00Z',
                    updated_at: '2025-01-29T10:00:00Z'
                },
                {
                    type: 'plans',
                    id: '2',
                    title: 'Fix Bug',
                    description: null,
                    content: 'Plan content',
                    tags: JSON.stringify(['bug']),
                    priority: 'medium',
                    created_at: '2025-01-29T11:00:00Z',
                    updated_at: '2025-01-29T11:00:00Z'
                },
                {
                    type: 'docs',
                    id: '3',
                    title: 'Bug Documentation',
                    description: 'How to handle bugs',
                    content: 'Doc content',
                    tags: JSON.stringify(['bug', 'guide']),
                    priority: null,
                    created_at: '2025-01-29T12:00:00Z',
                    updated_at: '2025-01-29T12:00:00Z'
                }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockResults);
            const grouped = await searchRepo.searchAllByTag('bug');
            expect(grouped.issues).toHaveLength(1);
            expect(grouped.plans).toHaveLength(1);
            expect(grouped.docs).toHaveLength(1);
            expect(grouped.knowledge).toHaveLength(0);
            expect(grouped.issues[0]).toMatchObject({
                id: 1,
                title: 'Bug Issue',
                priority: 'high',
                tags: ['bug', 'urgent']
            });
            expect(mockDb.allAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE tags LIKE ?'), ['%"bug"%']);
        });
        test('should handle empty tag search results', async () => {
            mockDb.allAsync.mockResolvedValueOnce([]);
            const grouped = await searchRepo.searchAllByTag('nonexistent');
            expect(grouped).toEqual({
                issues: [],
                plans: [],
                docs: [],
                knowledge: []
            });
        });
        test('should handle items with null tags', async () => {
            const mockResults = [
                {
                    type: 'issues',
                    id: '1',
                    title: 'Test Issue',
                    description: 'Test',
                    content: 'Content',
                    tags: null,
                    priority: 'low',
                    created_at: '2025-01-29T10:00:00Z',
                    updated_at: '2025-01-29T10:00:00Z'
                }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockResults);
            const grouped = await searchRepo.searchAllByTag('test');
            expect(grouped.issues[0].tags).toEqual([]);
        });
        test('should handle unknown content types', async () => {
            const mockResults = [
                {
                    type: 'custom',
                    id: '1',
                    title: 'Custom Item',
                    description: 'Custom',
                    content: 'Content',
                    tags: JSON.stringify(['test']),
                    priority: null,
                    created_at: '2025-01-29T10:00:00Z',
                    updated_at: '2025-01-29T10:00:00Z'
                }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockResults);
            const grouped = await searchRepo.searchAllByTag('test');
            // Custom type should not appear in predefined groups
            expect(grouped.issues).toHaveLength(0);
            expect(grouped.plans).toHaveLength(0);
            expect(grouped.docs).toHaveLength(0);
            expect(grouped.knowledge).toHaveLength(0);
        });
    });
    describe('error handling', () => {
        test('should propagate database errors in searchContent', async () => {
            mockDb.allAsync.mockRejectedValueOnce(new Error('Database error'));
            await expect(searchRepo.searchContent('test')).rejects.toThrow('Database error');
        });
        test('should propagate database errors in searchAllByTag', async () => {
            mockDb.allAsync.mockRejectedValueOnce(new Error('Database error'));
            await expect(searchRepo.searchAllByTag('test')).rejects.toThrow('Database error');
        });
    });
    describe('SQL injection protection', () => {
        test('should handle special characters in search query', async () => {
            mockDb.allAsync.mockResolvedValueOnce([]);
            await searchRepo.searchContent("test'; DROP TABLE items; --");
            expect(mockDb.allAsync).toHaveBeenCalledWith(expect.any(String), [`%test'; DROP TABLE items; --%`, `%test'; DROP TABLE items; --%`, `%test'; DROP TABLE items; --%`]);
        });
        test('should handle special characters in tag search', async () => {
            mockDb.allAsync.mockResolvedValueOnce([]);
            await searchRepo.searchAllByTag('test"; DROP TABLE');
            expect(mockDb.allAsync).toHaveBeenCalledWith(expect.any(String), ['%"test"; DROP TABLE"%']);
        });
    });
    describe('ordering', () => {
        test('searchContent should order by created_at DESC', async () => {
            const mockResults = [
                { id: '1', created_at: '2025-01-29T12:00:00Z', type: 'issues', title: 'Newer', content: 'test', tags: '[]' },
                { id: '2', created_at: '2025-01-29T10:00:00Z', type: 'issues', title: 'Older', content: 'test', tags: '[]' }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockResults);
            const results = await searchRepo.searchContent('test');
            expect(results[0].title).toBe('Newer');
            expect(results[1].title).toBe('Older');
        });
        test('searchAllByTag should order by type and created_at DESC', async () => {
            const mockResults = [
                { type: 'issues', id: '1', created_at: '2025-01-29T12:00:00Z', title: 'Issue 1', tags: '["test"]' },
                { type: 'issues', id: '2', created_at: '2025-01-29T10:00:00Z', title: 'Issue 2', tags: '["test"]' },
                { type: 'docs', id: '3', created_at: '2025-01-29T11:00:00Z', title: 'Doc 1', tags: '["test"]' }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockResults);
            await searchRepo.searchAllByTag('test');
            expect(mockDb.allAsync).toHaveBeenCalledWith(expect.stringContaining('ORDER BY type, created_at DESC'), expect.any(Array));
        });
    });
});
//# sourceMappingURL=search-repository.test.js.map