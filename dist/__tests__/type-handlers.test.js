// @ts-nocheck
/**
 * @ai-context Comprehensive tests for TypeHandlers
 * @ai-pattern Test dynamic type system CRUD operations
 * @ai-critical Ensure type validation and data integrity
 */
import { TypeHandlers } from '../handlers/type-handlers.js';
import { TypeRepository } from '../database/type-repository.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
// Mock dependencies
jest.mock('../database.js');
jest.mock('../database/type-repository.js');
describe('TypeHandlers', () => {
    let handlers;
    let mockDb;
    let mockTypeRepo;
    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {};
        // Mock TypeRepository
        mockTypeRepo = {
            init: jest.fn(),
            getAllTypes: jest.fn(),
            createType: jest.fn(),
            updateType: jest.fn(),
            deleteType: jest.fn()
        };
        // Mock TypeRepository constructor
        TypeRepository.mockImplementation(() => mockTypeRepo);
        handlers = new TypeHandlers(mockDb);
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    describe('init', () => {
        it('should initialize type repository', async () => {
            await handlers.init();
            expect(mockTypeRepo.init).toHaveBeenCalled();
        });
    });
    describe('handleGetTypes', () => {
        it('should return all types grouped by base_type', async () => {
            const mockTypes = [
                { type: 'issues', base_type: 'tasks', description: 'Bug tracking' },
                { type: 'plans', base_type: 'tasks', description: 'Project planning' },
                { type: 'docs', base_type: 'documents', description: 'Technical documentation' },
                { type: 'knowledge', base_type: 'documents', description: 'Knowledge base' }
            ];
            mockTypeRepo.getAllTypes.mockResolvedValue(mockTypes);
            const result = await handlers.handleGetTypes({});
            expect(mockTypeRepo.getAllTypes).toHaveBeenCalled();
            expect(result.content[0].type).toBe('text');
            const text = result.content[0].text;
            expect(text).toContain('## Available Types');
            expect(text).toContain('### Tasks (Task Management)');
            expect(text).toContain('### Documents (Documents)');
            expect(text).toContain('| issues | Bug tracking |');
            expect(text).toContain('| docs | Technical documentation |');
        });
        it('should include special types (sessions and dailies)', async () => {
            mockTypeRepo.getAllTypes.mockResolvedValue([]);
            const result = await handlers.handleGetTypes({});
            const text = result.content[0].text;
            expect(text).toContain('### Special Types');
            expect(text).toContain('| sessions | Work session tracking');
            expect(text).toContain('| dailies | Daily summaries');
        });
        it('should include type definitions when requested', async () => {
            const mockTypes = [
                { type: 'issues', base_type: 'tasks', description: 'Bug tracking' }
            ];
            mockTypeRepo.getAllTypes.mockResolvedValue(mockTypes);
            const result = await handlers.handleGetTypes({ include_definitions: true });
            const text = result.content[0].text;
            expect(text).toContain('## Type Definitions (JSON)');
            expect(text).toContain('```json');
            expect(text).toContain('"supported_fields"');
        });
        it('should handle custom base types', async () => {
            const mockTypes = [
                { type: 'custom-type', base_type: 'custom-base', description: 'Custom type' }
            ];
            mockTypeRepo.getAllTypes.mockResolvedValue(mockTypes);
            const result = await handlers.handleGetTypes({});
            const text = result.content[0].text;
            expect(text).toContain('### custom-base');
            expect(text).toContain('| custom-type | custom-base |');
        });
        it('should handle empty type list', async () => {
            mockTypeRepo.getAllTypes.mockResolvedValue([]);
            const result = await handlers.handleGetTypes({});
            const text = result.content[0].text;
            expect(text).toContain('## Available Types');
            // Should still show special types
            expect(text).toContain('### Special Types');
        });
    });
    describe('handleCreateType', () => {
        it('should create a new type with valid parameters', async () => {
            const args = {
                name: 'features',
                base_type: 'tasks',
                description: 'Feature requests'
            };
            const result = await handlers.handleCreateType(args);
            expect(mockTypeRepo.createType).toHaveBeenCalledWith('features', 'tasks', 'Feature requests');
            expect(result.content[0].text).toContain('Type "features" created successfully');
            expect(result.content[0].text).toContain('base_type "tasks"');
        });
        it('should create type with default base_type', async () => {
            const args = {
                name: 'notes',
                description: 'Personal notes'
            };
            const result = await handlers.handleCreateType(args);
            // Should default to documents if not specified
            expect(mockTypeRepo.createType).toHaveBeenCalledWith('notes', 'documents', 'Personal notes');
        });
        it('should validate type name format', async () => {
            const args = {
                name: 'Invalid Name!',
                base_type: 'tasks'
            };
            await expect(handlers.handleCreateType(args)).rejects.toThrow(McpError);
        });
        it('should handle duplicate type names', async () => {
            mockTypeRepo.createType.mockRejectedValue(new Error('Type already exists'));
            const args = {
                name: 'issues',
                base_type: 'tasks'
            };
            await expect(handlers.handleCreateType(args)).rejects.toThrow(McpError);
        });
        it('should validate required parameters', async () => {
            // Missing name
            await expect(handlers.handleCreateType({})).rejects.toThrow();
            // Empty name
            await expect(handlers.handleCreateType({ name: '' })).rejects.toThrow();
        });
    });
    describe('handleUpdateType', () => {
        it('should update type description', async () => {
            const args = {
                name: 'features',
                description: 'Updated feature request tracking'
            };
            const result = await handlers.handleUpdateType(args);
            expect(mockTypeRepo.updateType).toHaveBeenCalledWith('features', 'Updated feature request tracking');
            expect(result.content[0].text).toBe('Type "features" description updated successfully');
        });
        it('should handle non-existent type', async () => {
            mockTypeRepo.updateType.mockRejectedValue(new Error('Type not found'));
            const args = {
                name: 'non-existent',
                description: 'New description'
            };
            await expect(handlers.handleUpdateType(args)).rejects.toThrow(McpError);
        });
        it('should validate required parameters', async () => {
            // Missing name
            await expect(handlers.handleUpdateType({ description: 'Test' })).rejects.toThrow();
            // Missing description
            await expect(handlers.handleUpdateType({ name: 'test' })).rejects.toThrow();
        });
        it('should handle database errors', async () => {
            mockTypeRepo.updateType.mockRejectedValue(new Error('Database error'));
            const args = {
                name: 'features',
                description: 'New description'
            };
            await expect(handlers.handleUpdateType(args)).rejects.toThrow(McpError);
        });
    });
    describe('handleDeleteType', () => {
        it('should delete an existing type', async () => {
            const args = { name: 'features' };
            const result = await handlers.handleDeleteType(args);
            expect(mockTypeRepo.deleteType).toHaveBeenCalledWith('features');
            expect(result.content[0].text).toBe('Type "features" deleted successfully');
        });
        it('should handle non-existent type', async () => {
            mockTypeRepo.deleteType.mockRejectedValue(new McpError(ErrorCode.InvalidRequest, 'Type not found'));
            const args = { name: 'non-existent' };
            await expect(handlers.handleDeleteType(args)).rejects.toThrow(McpError);
        });
        it('should prevent deletion of types with existing items', async () => {
            mockTypeRepo.deleteType.mockRejectedValue(new Error('Cannot delete type with existing items'));
            const args = { name: 'issues' };
            await expect(handlers.handleDeleteType(args)).rejects.toThrow(McpError);
        });
        it('should validate required parameters', async () => {
            // Missing name
            await expect(handlers.handleDeleteType({})).rejects.toThrow();
            // Empty name
            await expect(handlers.handleDeleteType({ name: '' })).rejects.toThrow();
        });
        it('should propagate McpError without wrapping', async () => {
            const originalError = new McpError(ErrorCode.InvalidRequest, 'Custom error');
            mockTypeRepo.deleteType.mockRejectedValue(originalError);
            await expect(handlers.handleDeleteType({ name: 'test' })).rejects.toBe(originalError);
        });
    });
    describe('getFieldsForBaseType', () => {
        it('should return correct fields for tasks base type', async () => {
            const mockTypes = [
                { type: 'custom-task', base_type: 'tasks' }
            ];
            mockTypeRepo.getAllTypes.mockResolvedValue(mockTypes);
            const result = await handlers.handleGetTypes({ include_definitions: true });
            const text = result.content[0].text;
            expect(text).toContain('"supported_fields": [');
            expect(text).toContain('"priority"');
            expect(text).toContain('"status"');
            expect(text).toContain('"start_date"');
            expect(text).toContain('"end_date"');
        });
        it('should return correct fields for documents base type', async () => {
            const mockTypes = [
                { type: 'custom-doc', base_type: 'documents' }
            ];
            mockTypeRepo.getAllTypes.mockResolvedValue(mockTypes);
            const result = await handlers.handleGetTypes({ include_definitions: true });
            const text = result.content[0].text;
            expect(text).toContain('"supported_fields": [');
            expect(text).toContain('"content"');
            expect(text).toContain('"description"');
        });
        it('should return default fields for unknown base type', async () => {
            const mockTypes = [
                { type: 'custom', base_type: 'unknown' }
            ];
            mockTypeRepo.getAllTypes.mockResolvedValue(mockTypes);
            const result = await handlers.handleGetTypes({ include_definitions: true });
            const text = result.content[0].text;
            expect(text).toContain('"supported_fields": [');
            expect(text).toContain('"title"');
            expect(text).toContain('"content"');
            expect(text).toContain('"tags"');
        });
    });
    describe('edge cases', () => {
        it('should handle types with no description', async () => {
            const mockTypes = [
                { type: 'minimal', base_type: 'tasks' } // No description
            ];
            mockTypeRepo.getAllTypes.mockResolvedValue(mockTypes);
            const result = await handlers.handleGetTypes({});
            const text = result.content[0].text;
            expect(text).toContain('| minimal | Custom Task Type |'); // Should use default description
        });
        it('should handle special characters in type names', async () => {
            const mockTypes = [
                { type: 'user_stories', base_type: 'tasks', description: 'User stories & requirements' }
            ];
            mockTypeRepo.getAllTypes.mockResolvedValue(mockTypes);
            const result = await handlers.handleGetTypes({});
            const text = result.content[0].text;
            expect(text).toContain('user_stories');
            expect(text).toContain('User stories & requirements');
        });
    });
});
//# sourceMappingURL=type-handlers.test.js.map