/**
 * @ai-context Unit tests for BaseHandler
 * @ai-pattern Test base handler functionality
 * @ai-critical Ensures handler framework works correctly
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { BaseHandler } from '../base-handler.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createSimpleMockDatabase } from '../../test-utils/mock-helpers.js';
import { jest } from '@jest/globals';
// Test implementation of BaseHandler
class TestHandler extends BaseHandler {
    constructor(database) {
        super('TestHandler', database);
    }
    async testMethod(args) {
        return this.createResponse(`Hello, ${args.name}!`);
    }
}
describe('BaseHandler', () => {
    let handler;
    let mockDatabase;
    beforeEach(() => {
        mockDatabase = createSimpleMockDatabase();
        handler = new TestHandler(mockDatabase);
        // Replace logger with mock
        handler.logger = {
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            debug: jest.fn()
        };
    });
    describe('createResponse', () => {
        it('should create standard tool response', () => {
            const response = handler.createResponse('Test message');
            expect(response).toEqual({
                content: [{
                        type: 'text',
                        text: 'Test message'
                    }]
            });
        });
    });
    describe('createErrorResponse', () => {
        it('should create error response with prefix', () => {
            const response = handler.createErrorResponse('Something went wrong');
            expect(response).toEqual({
                content: [{
                        type: 'text',
                        text: 'Error: Something went wrong'
                    }]
            });
        });
    });
    describe('wrapHandler', () => {
        const testSchema = z.object({
            name: z.string()
        });
        it('should validate args and execute handler', async () => {
            const wrapped = handler.wrapHandler('test', testSchema, async (args) => handler.testMethod(args));
            const result = await wrapped({ name: 'World' });
            expect(result).toEqual({
                content: [{
                        type: 'text',
                        text: 'Hello, World!'
                    }]
            });
        });
        it('should throw McpError on validation failure', async () => {
            const wrapped = handler.wrapHandler('test', testSchema, async (args) => handler.testMethod(args));
            await expect(wrapped({ name: 123 })).rejects.toThrow(McpError);
            await expect(wrapped({ name: 123 })).rejects.toMatchObject({
                code: ErrorCode.InvalidParams
            });
        });
        it('should log errors', async () => {
            const wrapped = handler.wrapHandler('test', testSchema, async () => {
                throw new Error('Test error');
            });
            await expect(wrapped({ name: 'Test' })).rejects.toThrow();
            expect(handler.logger.error).toHaveBeenCalled();
        });
        it('should rethrow McpError as-is', async () => {
            const mcpError = new McpError(ErrorCode.InvalidRequest, 'Test MCP error');
            const wrapped = handler.wrapHandler('test', testSchema, async () => {
                throw mcpError;
            });
            await expect(wrapped({ name: 'Test' })).rejects.toThrow(mcpError);
        });
    });
    describe('formatDate', () => {
        it('should format date string', () => {
            expect(handler.formatDate('2024-01-15T10:30:00Z')).toBe('2024-01-15');
        });
        it('should format Date object', () => {
            const date = new Date('2024-01-15T10:30:00Z');
            expect(handler.formatDate(date)).toBe('2024-01-15');
        });
    });
    describe('formatDateTime', () => {
        it('should format datetime string', () => {
            const result = handler.formatDateTime('2024-01-15T10:30:00Z');
            expect(result).toContain('2024');
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });
    });
    describe('parseOptionalArray', () => {
        it('should return undefined for null/undefined', () => {
            expect(handler.parseOptionalArray(null)).toBeUndefined();
            expect(handler.parseOptionalArray(undefined)).toBeUndefined();
        });
        it('should filter non-string values', () => {
            const result = handler.parseOptionalArray(['a', 123, 'b', null, 'c']);
            expect(result).toEqual(['a', 'b', 'c']);
        });
        it('should return undefined for non-array', () => {
            expect(handler.parseOptionalArray('not an array')).toBeUndefined();
            expect(handler.parseOptionalArray(123)).toBeUndefined();
        });
    });
    describe('formatList', () => {
        it('should format array as list', () => {
            const result = handler.formatList(['item1', 'item2', 'item3']);
            expect(result).toBe('- item1\n- item2\n- item3');
        });
        it('should return empty text for empty array', () => {
            expect(handler.formatList([])).toBe('None');
            expect(handler.formatList([], 'Empty')).toBe('Empty');
            expect(handler.formatList(undefined)).toBe('None');
        });
    });
    describe('formatJson', () => {
        it('should pretty print JSON', () => {
            const obj = { name: 'test', value: 123 };
            const result = handler.formatJson(obj);
            expect(result).toContain('{\n');
            expect(result).toContain('  "name": "test"');
            expect(result).toContain('  "value": 123');
        });
    });
    describe('ensureDatabase', () => {
        it('should not throw when database exists', () => {
            expect(() => handler.ensureDatabase()).not.toThrow();
        });
        it('should throw McpError when database is missing', () => {
            const handlerNoDb = new TestHandler();
            expect(() => handlerNoDb.ensureDatabase()).toThrow(McpError);
            expect(() => handlerNoDb.ensureDatabase()).toThrow('Database not initialized');
        });
    });
    describe('formatError', () => {
        it('should format McpError', () => {
            const error = new McpError(ErrorCode.InvalidParams, 'Test error');
            const result = handler.formatError(error);
            expect(result).toContain('Test error');
        });
        it('should format Error', () => {
            const error = new Error('Regular error');
            expect(handler.formatError(error)).toBe('Regular error');
        });
        it('should format unknown error', () => {
            expect(handler.formatError('string error')).toBe('An unknown error occurred');
            expect(handler.formatError(null)).toBe('An unknown error occurred');
        });
    });
    describe('isEmpty', () => {
        it('should return true for empty values', () => {
            expect(handler.isEmpty(null)).toBe(true);
            expect(handler.isEmpty(undefined)).toBe(true);
            expect(handler.isEmpty('')).toBe(true);
            expect(handler.isEmpty([])).toBe(true);
        });
        it('should return false for non-empty values', () => {
            expect(handler.isEmpty('test')).toBe(false);
            expect(handler.isEmpty(0)).toBe(false);
            expect(handler.isEmpty(false)).toBe(false);
            expect(handler.isEmpty(['item'])).toBe(false);
        });
    });
    describe('truncate', () => {
        it('should truncate long text', () => {
            const longText = 'This is a very long text that needs to be truncated';
            expect(handler.truncate(longText, 20)).toBe('This is a very lo...');
        });
        it('should not truncate short text', () => {
            const shortText = 'Short text';
            expect(handler.truncate(shortText, 20)).toBe('Short text');
        });
        it('should use default max length', () => {
            const text = 'a'.repeat(150);
            const result = handler.truncate(text);
            expect(result.length).toBe(100);
            expect(result.endsWith('...')).toBe(true);
        });
    });
});
//# sourceMappingURL=base-handler.test.js.map