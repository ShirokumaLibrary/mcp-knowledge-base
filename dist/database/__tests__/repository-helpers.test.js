/**
 * @ai-context Unit tests for RepositoryHelpers
 * @ai-pattern Test common repository operations
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { RepositoryHelpers } from '../repository-helpers.js';
import { mockFn, mockResolvedValue } from '../../test-utils/mock-helpers.js';
import { DatabaseError } from '../../errors/custom-errors.js';
describe('RepositoryHelpers', () => {
    let mockDb;
    let mockLogger;
    beforeEach(() => {
        // Mock database
        mockDb = {
            getAsync: mockResolvedValue(null),
            runAsync: mockResolvedValue({ changes: 1, lastInsertRowid: 1 }),
            allAsync: mockResolvedValue([])
        };
        // Mock logger
        mockLogger = {
            debug: mockFn(),
            info: mockFn(),
            warn: mockFn(),
            error: mockFn()
        };
    });
    describe('getNextId', () => {
        it('should return next ID for existing type', async () => {
            // Setup
            mockDb.getAsync.mockResolvedValueOnce({ next_id: 5 });
            mockDb.runAsync.mockResolvedValue({ changes: 1 });
            // Execute
            const result = await RepositoryHelpers.getNextId(mockDb, 'issues', mockLogger);
            // Assert
            expect(result).toBe(5);
            expect(mockDb.runAsync).toHaveBeenCalledWith('BEGIN IMMEDIATE');
            expect(mockDb.getAsync).toHaveBeenCalledWith('SELECT next_id FROM sequences WHERE type = ?', ['issues']);
            expect(mockDb.runAsync).toHaveBeenCalledWith('UPDATE sequences SET next_id = next_id + 1 WHERE type = ?', ['issues']);
            expect(mockDb.runAsync).toHaveBeenCalledWith('COMMIT');
        });
        it('should create sequence for new type', async () => {
            // Setup
            mockDb.getAsync.mockResolvedValueOnce(null); // First check returns null
            mockDb.runAsync.mockResolvedValue({ changes: 1 });
            // Execute
            const result = await RepositoryHelpers.getNextId(mockDb, 'new-type', mockLogger);
            // Assert
            expect(result).toBe(1);
            expect(mockDb.runAsync).toHaveBeenCalledWith('BEGIN IMMEDIATE');
            expect(mockDb.runAsync).toHaveBeenCalledWith('INSERT INTO sequences (type, next_id) VALUES (?, 1)', ['new-type']);
            expect(mockDb.runAsync).toHaveBeenCalledWith('COMMIT');
        });
        it('should handle transaction errors with rollback', async () => {
            // Setup - simulate error
            mockDb.getAsync.mockResolvedValueOnce({ next_id: 10 });
            mockDb.runAsync
                .mockResolvedValueOnce({ changes: 1 }) // BEGIN
                .mockRejectedValueOnce(new Error('SQLITE_CONSTRAINT')); // UPDATE fails
            // Execute & Assert
            await expect(RepositoryHelpers.getNextId(mockDb, 'issues')).rejects.toThrow(DatabaseError);
            // Should have called ROLLBACK
            expect(mockDb.runAsync).toHaveBeenCalledWith('ROLLBACK');
        });
        it('should log debug messages', async () => {
            // Setup
            mockDb.getAsync.mockResolvedValueOnce({ next_id: 42 });
            mockDb.runAsync.mockResolvedValue({ changes: 1 });
            // Execute
            await RepositoryHelpers.getNextId(mockDb, 'issues', mockLogger);
            // Assert
            expect(mockLogger.debug).toHaveBeenCalledWith('Generated ID 42 for type issues');
        });
    });
    describe('autoRegisterTags', () => {
        it('should create new tags', async () => {
            // Setup
            mockDb.getAsync
                .mockResolvedValueOnce(null) // tag1 doesn't exist
                .mockResolvedValueOnce(null) // tag2 doesn't exist
                .mockResolvedValueOnce({ name: 'tag3' }); // tag3 exists
            mockDb.runAsync.mockResolvedValue({ changes: 1 });
            // Execute
            await RepositoryHelpers.autoRegisterTags(mockDb, ['tag1', 'tag2', 'tag3'], mockLogger);
            // Assert
            expect(mockDb.runAsync).toHaveBeenCalledTimes(3); // One for each tag
        });
        it('should handle empty tag array', async () => {
            // Execute
            await RepositoryHelpers.autoRegisterTags(mockDb, []);
            // Assert
            expect(mockDb.runAsync).not.toHaveBeenCalled();
        });
        it('should register all provided tags', async () => {
            // Execute
            await RepositoryHelpers.autoRegisterTags(mockDb, ['tag1', 'tag2'], mockLogger);
            // Assert
            expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
            expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT OR IGNORE INTO tags'), expect.arrayContaining(['tag1']));
        });
        it('should log tag registration', async () => {
            // Execute
            await RepositoryHelpers.autoRegisterTags(mockDb, ['new-tag'], mockLogger);
            // Assert
            expect(mockLogger.debug).toHaveBeenCalledWith('Auto-registered 1 tags');
        });
    });
    describe('saveEntityTags', () => {
        it('should save tags for entity', async () => {
            // Setup
            mockDb.runAsync.mockResolvedValue({ changes: 1 });
            // Execute
            await RepositoryHelpers.saveEntityTags(mockDb, 'issue', 1, ['bug', 'urgent'], 'issue_tags', mockLogger);
            // Assert
            expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM issue_tags'), [1]);
            expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO issue_tags'), [1, 'bug']);
            expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO issue_tags'), [1, 'urgent']);
        });
        it('should handle empty tags by removing all links', async () => {
            // Execute
            await RepositoryHelpers.saveEntityTags(mockDb, 'issue', 1, [], 'issue_tags');
            // Assert
            expect(mockDb.runAsync).toHaveBeenCalledTimes(1); // Only DELETE
            expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM issue_tags'), [1]);
        });
        it('should log tag saving', async () => {
            // Execute
            await RepositoryHelpers.saveEntityTags(mockDb, 'document', 5, ['guide'], 'document_tags', mockLogger);
            // Assert
            expect(mockLogger.debug).toHaveBeenCalledWith('Saved 1 tags for document 5');
        });
    });
    describe('loadEntityTags', () => {
        it('should return tags for entity', async () => {
            // Setup
            mockDb.allAsync.mockResolvedValueOnce([
                { tag_name: 'bug' },
                { tag_name: 'urgent' }
            ]);
            // Execute
            const result = await RepositoryHelpers.loadEntityTags(mockDb, 'issue', 1, 'issue_tags', mockLogger);
            // Assert
            expect(result).toEqual(['bug', 'urgent']);
            expect(mockDb.allAsync).toHaveBeenCalledWith(expect.stringContaining('SELECT tag_name FROM issue_tags'), [1]);
        });
        it('should return empty array when no tags', async () => {
            // Setup
            mockDb.allAsync.mockResolvedValueOnce([]);
            // Execute
            const result = await RepositoryHelpers.loadEntityTags(mockDb, 'document', 1, 'document_tags');
            // Assert
            expect(result).toEqual([]);
        });
    });
    describe('saveRelatedEntities', () => {
        it('should save related tasks and documents', async () => {
            // Setup
            mockDb.runAsync.mockResolvedValue({ changes: 1 });
            // Execute
            await RepositoryHelpers.saveRelatedEntities(mockDb, 'issues', 1, ['plans-10', 'issues-2'], ['docs-3', 'knowledge-4'], mockLogger);
            // Assert
            // Should delete existing relations
            expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM related_items WHERE source_type = ? AND source_id = ?', ['issues', 1]);
            // Should insert new relations
            expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO related_items'), expect.arrayContaining(['issues', 1]));
        });
        it('should handle empty relations', async () => {
            // Execute
            await RepositoryHelpers.saveRelatedEntities(mockDb, 'issues', 1, [], []);
            // Assert
            expect(mockDb.runAsync).toHaveBeenCalledTimes(1); // Only DELETE
        });
        it('should log relation saving', async () => {
            // Execute
            await RepositoryHelpers.saveRelatedEntities(mockDb, 'docs', 5, ['issues-1'], ['knowledge-2'], mockLogger);
            // Assert
            expect(mockLogger.debug).toHaveBeenCalledWith('Saved relationships for docs 5');
        });
    });
    describe('loadRelatedEntities', () => {
        it('should return related tasks and documents', async () => {
            // Setup
            mockDb.allAsync.mockResolvedValueOnce([
                { target_type: 'issues', target_id: 1 },
                { target_type: 'plans', target_id: 2 },
                { target_type: 'docs', target_id: 3 },
                { target_type: 'knowledge', target_id: 4 }
            ]);
            // Execute
            const result = await RepositoryHelpers.loadRelatedEntities(mockDb, 'issues', 1);
            // Assert
            expect(result.related_tasks).toEqual(['issues-1', 'plans-2']);
            expect(result.related_documents).toEqual(['docs-3', 'knowledge-4']);
        });
        it('should return empty arrays when no relations', async () => {
            // Setup
            mockDb.allAsync.mockResolvedValue([]);
            // Execute
            const result = await RepositoryHelpers.loadRelatedEntities(mockDb, 'docs', 1);
            // Assert
            expect(result.related_tasks).toEqual([]);
            expect(result.related_documents).toEqual([]);
        });
    });
    // Remove tests for non-existent methods
});
//# sourceMappingURL=repository-helpers.test.js.map