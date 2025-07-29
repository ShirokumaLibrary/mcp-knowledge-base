// @ts-nocheck
/**
 * @ai-context Tests for BaseRepository abstract class
 * @ai-pattern Test concrete implementation to verify base functionality
 * @ai-critical Ensures consistent behavior across all repositories
 */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BaseRepository } from '../base-repository.js';
import { createLogger } from '../../utils/logger.js';
// Mock dependencies
jest.mock('../base.js');
jest.mock('../../utils/logger.js');
// Concrete implementation for testing
class TestRepository extends BaseRepository {
    constructor(db) {
        super(db, 'test_items', 'TestRepository');
    }
    mapRowToEntity(row) {
        return {
            id: Number(row.id),
            name: String(row.name),
            value: String(row.value),
            active: Boolean(row.active),
            created_at: String(row.created_at),
            updated_at: String(row.updated_at)
        };
    }
    mapEntityToRow(entity) {
        const row = {};
        if (entity.id !== undefined)
            row.id = entity.id;
        if (entity.name !== undefined)
            row.name = entity.name;
        if (entity.value !== undefined)
            row.value = entity.value;
        if (entity.active !== undefined)
            row.active = entity.active ? 1 : 0;
        if (entity.created_at !== undefined)
            row.created_at = entity.created_at;
        if (entity.updated_at !== undefined)
            row.updated_at = entity.updated_at;
        return row;
    }
    // Expose protected methods for testing
    async findById(id) {
        return super.findById(id);
    }
    async findAll(options) {
        return super.findAll(options);
    }
    async create(data) {
        return super.create(data);
    }
    async update(id, data) {
        const result = await super.updateById(id, data);
        return result !== null;
    }
    async delete(id) {
        return super.deleteById(id);
    }
    async exists(id) {
        return super.exists(id);
    }
    async count() {
        return super.count();
    }
    async getNextId(type) {
        return super.getNextId(type);
    }
}
describe('BaseRepository', () => {
    let testRepo;
    let mockDb;
    let mockLogger;
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup mock logger
        mockLogger = {
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            debug: jest.fn()
        };
        createLogger.mockReturnValue(mockLogger);
        // Setup mock database
        mockDb = {
            getAsync: jest.fn(),
            allAsync: jest.fn(),
            runAsync: jest.fn()
        };
        testRepo = new TestRepository(mockDb);
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    describe('constructor', () => {
        test('should initialize with correct properties', () => {
            expect(testRepo).toBeDefined();
            expect(createLogger).toHaveBeenCalledWith('TestRepository');
        });
    });
    describe('findById', () => {
        test('should find entity by ID', async () => {
            const mockRow = {
                id: 1,
                name: 'Test Item',
                value: 'test value',
                active: 1,
                created_at: '2025-01-29T10:00:00Z',
                updated_at: '2025-01-29T10:00:00Z'
            };
            mockDb.getAsync.mockResolvedValueOnce(mockRow);
            const result = await testRepo.findById(1);
            expect(result).toEqual({
                id: 1,
                name: 'Test Item',
                value: 'test value',
                active: true,
                created_at: '2025-01-29T10:00:00Z',
                updated_at: '2025-01-29T10:00:00Z'
            });
            expect(mockDb.getAsync).toHaveBeenCalledWith('SELECT * FROM test_items WHERE id = ?', [1]);
        });
        test('should return null for non-existent ID', async () => {
            mockDb.getAsync.mockResolvedValueOnce(undefined);
            const result = await testRepo.findById(999);
            expect(result).toBeNull();
        });
        test('should handle database errors', async () => {
            mockDb.getAsync.mockRejectedValueOnce(new Error('Database error'));
            await expect(testRepo.findById(1)).rejects.toThrow('Database error');
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
    describe('findAll', () => {
        test('should find all entities', async () => {
            const mockRows = [
                {
                    id: 1,
                    name: 'Item 1',
                    value: 'value1',
                    active: 1,
                    created_at: '2025-01-29T10:00:00Z',
                    updated_at: '2025-01-29T10:00:00Z'
                },
                {
                    id: 2,
                    name: 'Item 2',
                    value: 'value2',
                    active: 0,
                    created_at: '2025-01-29T11:00:00Z',
                    updated_at: '2025-01-29T11:00:00Z'
                }
            ];
            mockDb.allAsync.mockResolvedValueOnce(mockRows);
            const result = await testRepo.findAll();
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe(1);
            expect(result[0].active).toBe(true);
            expect(result[1].id).toBe(2);
            expect(result[1].active).toBe(false);
            expect(mockDb.allAsync).toHaveBeenCalledWith('SELECT * FROM test_items', []);
        });
        test('should handle empty results', async () => {
            mockDb.allAsync.mockResolvedValueOnce([]);
            const result = await testRepo.findAll();
            expect(result).toEqual([]);
        });
    });
    describe('create', () => {
        test('should create new entity', async () => {
            const createData = {
                name: 'New Item',
                value: 'new value',
                active: true
            };
            // Mock INSERT
            mockDb.runAsync.mockResolvedValueOnce({ lastID: 1, changes: 1 }); // Insert
            // Mock findById for return value
            const mockCreated = {
                id: 1,
                name: 'New Item',
                value: 'new value',
                active: 1,
                created_at: '2025-01-29T12:00:00Z',
                updated_at: '2025-01-29T12:00:00Z'
            };
            mockDb.getAsync.mockResolvedValueOnce(mockCreated);
            const result = await testRepo.create(createData);
            expect(result).toEqual({
                id: 1,
                name: 'New Item',
                value: 'new value',
                active: true,
                created_at: '2025-01-29T12:00:00Z',
                updated_at: '2025-01-29T12:00:00Z'
            });
            expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO test_items'), expect.arrayContaining(['New Item', 'new value', 1]));
        });
        test('should handle creation failure', async () => {
            const createData = { name: 'Test', value: 'test', active: true };
            mockDb.runAsync.mockRejectedValueOnce(new Error('Insert failed'));
            await expect(testRepo.create(createData)).rejects.toThrow('Insert failed');
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
    describe('update', () => {
        test('should update existing entity', async () => {
            const updateData = {
                name: 'Updated Item',
                value: 'updated value'
            };
            // Mock exists check
            mockDb.getAsync.mockResolvedValueOnce({ id: 1 }); // exists returns true
            // Mock update
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            // Mock findById for updated entity
            const mockUpdated = {
                id: 1,
                name: 'Updated Item',
                value: 'updated value',
                active: 1,
                created_at: '2025-01-29T10:00:00Z',
                updated_at: '2025-01-29T13:00:00Z'
            };
            mockDb.getAsync.mockResolvedValueOnce(mockUpdated);
            const result = await testRepo.update(1, updateData);
            expect(result).toBe(true);
            expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('UPDATE test_items SET'), expect.arrayContaining(['Updated Item', 'updated value', 1]));
        });
        test('should return false for non-existent entity', async () => {
            // Mock exists check returns false
            mockDb.getAsync.mockResolvedValueOnce(undefined);
            const result = await testRepo.update(999, { name: 'Test' });
            expect(result).toBe(false);
        });
        test('should handle empty update data', async () => {
            // Mock exists check
            mockDb.getAsync.mockResolvedValueOnce({ id: 1 }); // exists returns true
            // Since there's no data to update, it should still execute with no fields
            // Mock the empty update (which might succeed but update nothing)
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            // Mock findById for return
            const mockExisting = {
                id: 1,
                name: 'Existing Item',
                value: 'existing value',
                active: 1,
                created_at: '2025-01-29T10:00:00Z',
                updated_at: '2025-01-29T10:00:00Z'
            };
            mockDb.getAsync.mockResolvedValueOnce(mockExisting);
            const result = await testRepo.update(1, {});
            expect(result).toBe(true);
        });
    });
    describe('delete', () => {
        test('should delete existing entity', async () => {
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 });
            const result = await testRepo.delete(1);
            expect(result).toBe(true);
            expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM test_items WHERE id = ?', [1]);
        });
        test('should return false for non-existent entity', async () => {
            mockDb.runAsync.mockResolvedValueOnce({ changes: 0 });
            const result = await testRepo.delete(999);
            expect(result).toBe(false);
        });
    });
    describe('exists', () => {
        test('should return true for existing entity', async () => {
            mockDb.getAsync.mockResolvedValueOnce({ count: 1 });
            const result = await testRepo.exists(1);
            expect(result).toBe(true);
            expect(mockDb.getAsync).toHaveBeenCalledWith('SELECT 1 FROM test_items WHERE id = ? LIMIT 1', [1]);
        });
        test('should return false for non-existent entity', async () => {
            mockDb.getAsync.mockResolvedValueOnce(undefined);
            const result = await testRepo.exists(999);
            expect(result).toBe(false);
        });
    });
    describe('count', () => {
        test('should return total count', async () => {
            mockDb.getAsync.mockResolvedValueOnce({ count: 42 });
            const result = await testRepo.count();
            expect(result).toBe(42);
            expect(mockDb.getAsync).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM test_items', []);
        });
        test('should return 0 for empty table', async () => {
            mockDb.getAsync.mockResolvedValueOnce({ count: 0 });
            const result = await testRepo.count();
            expect(result).toBe(0);
        });
    });
    describe('getNextId', () => {
        test('should get next ID from sequence', async () => {
            // Mock sequence exists and updates
            mockDb.runAsync.mockResolvedValueOnce({ changes: 1 }); // UPDATE succeeds
            mockDb.getAsync.mockResolvedValueOnce({ current_value: 5 }); // Get updated value
            const result = await testRepo.getNextId('test');
            expect(result).toBe(5);
            expect(mockDb.runAsync).toHaveBeenCalledWith('UPDATE sequences SET current_value = current_value + 1 WHERE type = ?', ['test']);
        });
        test('should throw error if sequence not exists', async () => {
            // Mock sequence doesn't exist
            mockDb.runAsync.mockResolvedValueOnce({ changes: 0 }); // UPDATE fails
            await expect(testRepo.getNextId('test')).rejects.toThrow("Sequence type 'test' not found");
        });
    });
    describe('error handling', () => {
        test('should log errors with context', async () => {
            mockDb.getAsync.mockRejectedValueOnce(new Error('Test error'));
            await expect(testRepo.findById(1)).rejects.toThrow('Test error');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to find by ID in test_items', expect.objectContaining({ error: expect.any(Error), id: 1 }));
        });
    });
    describe('edge cases', () => {
        test('should handle null values in rows', async () => {
            const mockRow = {
                id: 1,
                name: null,
                value: null,
                active: null,
                created_at: null,
                updated_at: null
            };
            mockDb.getAsync.mockResolvedValueOnce(mockRow);
            const result = await testRepo.findById(1);
            expect(result).toEqual({
                id: 1,
                name: 'null',
                value: 'null',
                active: false,
                created_at: 'null',
                updated_at: 'null'
            });
        });
        test('should handle special characters in data', async () => {
            const createData = {
                name: "Test's \"special\" <chars>",
                value: 'value with\nnewline',
                active: true
            };
            mockDb.runAsync.mockResolvedValue({ lastID: 1, changes: 1 });
            mockDb.getAsync.mockResolvedValue({ current_value: 0 });
            await expect(testRepo.create(createData)).resolves.toBeDefined();
        });
    });
});
//# sourceMappingURL=base-repository.test.js.map