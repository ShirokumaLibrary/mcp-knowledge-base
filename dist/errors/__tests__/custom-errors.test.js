/**
 * @ai-context Unit tests for custom error classes
 * @ai-pattern Test error creation, serialization, and type guards
 * @ai-critical Ensures error handling works correctly
 */
import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import { BaseError, DatabaseError, NotFoundError, ValidationError, FileSystemError, ConcurrencyError, BusinessRuleError, IntegrationError, RateLimitError, ErrorFactory, ErrorGuards } from '../custom-errors.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
describe('Custom Error Classes', () => {
    describe('DatabaseError', () => {
        it('should create database error with context', () => {
            const error = new DatabaseError('Connection failed', { host: 'localhost' });
            expect(error.message).toBe('Connection failed');
            expect(error.code).toBe('DATABASE_ERROR');
            expect(error.context).toEqual({ host: 'localhost' });
            expect(error.timestamp).toBeInstanceOf(Date);
        });
        it('should serialize to JSON correctly', () => {
            const error = new DatabaseError('Query failed');
            const json = error.toJSON();
            expect(json).toHaveProperty('name', 'DatabaseError');
            expect(json).toHaveProperty('message', 'Query failed');
            expect(json).toHaveProperty('code', 'DATABASE_ERROR');
            expect(json).toHaveProperty('timestamp');
            expect(json).toHaveProperty('stack');
        });
    });
    describe('NotFoundError', () => {
        it('should create not found error with entity details', () => {
            const error = new NotFoundError('Issue', 123);
            expect(error.message).toBe('Issue with ID 123 not found');
            expect(error.code).toBe('NOT_FOUND');
            expect(error.entityType).toBe('Issue');
            expect(error.entityId).toBe(123);
        });
    });
    describe('ValidationError', () => {
        it('should create validation error with field errors', () => {
            const errors = [
                { field: 'name', message: 'Required', value: undefined },
                { field: 'email', message: 'Invalid format', value: 'test' }
            ];
            const error = new ValidationError('Validation failed', errors);
            expect(error.errors).toEqual(errors);
            expect(error.context?.errors).toEqual(errors);
        });
        it('should create from Zod error', () => {
            const zodError = new z.ZodError([
                {
                    code: z.ZodIssueCode.invalid_type,
                    expected: 'string',
                    received: 'undefined',
                    path: ['user', 'name'],
                    message: 'Required'
                },
                {
                    code: z.ZodIssueCode.invalid_string,
                    validation: 'email',
                    path: ['email'],
                    message: 'Invalid'
                }
            ]);
            const error = ValidationError.fromZodError(zodError);
            expect(error.errors).toHaveLength(2);
            expect(error.errors[0]).toEqual({
                field: 'user.name',
                message: 'Required',
                value: 'undefined'
            });
        });
    });
    describe('FileSystemError', () => {
        it('should create file system error with operation details', () => {
            const error = new FileSystemError('Permission denied', 'write', '/path/to/file');
            expect(error.operation).toBe('write');
            expect(error.path).toBe('/path/to/file');
            expect(error.context?.operation).toBe('write');
            expect(error.context?.path).toBe('/path/to/file');
        });
    });
    describe('RateLimitError', () => {
        it('should create rate limit error with retry info', () => {
            const error = new RateLimitError('Too many requests', 60);
            expect(error.retryAfter).toBe(60);
            expect(error.context?.retryAfter).toBe(60);
        });
    });
});
describe('ErrorFactory', () => {
    describe('fromUnknown', () => {
        it('should return BaseError instances as-is', () => {
            const original = new DatabaseError('Test');
            const result = ErrorFactory.fromUnknown(original);
            expect(result).toBe(original);
        });
        it('should wrap Error instances', () => {
            const original = new Error('Test error');
            const result = ErrorFactory.fromUnknown(original);
            expect(result).toBeInstanceOf(BaseError);
            expect(result.message).toBe('Test error');
            expect(result.code).toBe('UNKNOWN_ERROR');
            expect(result.context?.originalError).toBe('Error');
        });
        it('should handle non-Error values', () => {
            const result = ErrorFactory.fromUnknown('String error');
            expect(result).toBeInstanceOf(BaseError);
            expect(result.message).toBe('An error occurred');
            expect(result.context?.originalError).toBe('String error');
        });
        it('should use custom default message', () => {
            const result = ErrorFactory.fromUnknown(null, 'Custom message');
            expect(result.message).toBe('Custom message');
        });
    });
    describe('isRetryable', () => {
        it('should identify retryable errors', () => {
            expect(ErrorFactory.isRetryable(new DatabaseError('Test'))).toBe(true);
            expect(ErrorFactory.isRetryable(new FileSystemError('Test', 'read', '/path'))).toBe(true);
            expect(ErrorFactory.isRetryable(new IntegrationError('Test', 'api'))).toBe(true);
            expect(ErrorFactory.isRetryable(new ConcurrencyError('Test', 'Issue', 1))).toBe(true);
        });
        it('should identify non-retryable errors', () => {
            expect(ErrorFactory.isRetryable(new ValidationError('Test', []))).toBe(false);
            expect(ErrorFactory.isRetryable(new NotFoundError('Issue', 1))).toBe(false);
            expect(ErrorFactory.isRetryable(new BusinessRuleError('Test', 'rule'))).toBe(false);
        });
    });
    describe('toMcpErrorCode', () => {
        it('should map to correct MCP error codes', () => {
            expect(ErrorFactory.toMcpErrorCode(new ValidationError('Test', []))).toBe(ErrorCode.InvalidParams);
            expect(ErrorFactory.toMcpErrorCode(new NotFoundError('Issue', 1))).toBe(ErrorCode.InvalidParams);
            expect(ErrorFactory.toMcpErrorCode(new BusinessRuleError('Test', 'rule'))).toBe(ErrorCode.InvalidParams);
            expect(ErrorFactory.toMcpErrorCode(new RateLimitError('Test'))).toBe(ErrorCode.InvalidRequest);
            expect(ErrorFactory.toMcpErrorCode(new DatabaseError('Test'))).toBe(ErrorCode.InternalError);
        });
    });
});
describe('ErrorGuards', () => {
    it('should correctly identify error types', () => {
        const dbError = new DatabaseError('Test');
        const notFoundError = new NotFoundError('Issue', 1);
        const validationError = new ValidationError('Test', []);
        const regularError = new Error('Test');
        expect(ErrorGuards.isBaseError(dbError)).toBe(true);
        expect(ErrorGuards.isBaseError(regularError)).toBe(false);
        expect(ErrorGuards.isDatabaseError(dbError)).toBe(true);
        expect(ErrorGuards.isDatabaseError(notFoundError)).toBe(false);
        expect(ErrorGuards.isNotFoundError(notFoundError)).toBe(true);
        expect(ErrorGuards.isNotFoundError(dbError)).toBe(false);
        expect(ErrorGuards.isValidationError(validationError)).toBe(true);
        expect(ErrorGuards.isValidationError(dbError)).toBe(false);
    });
});
//# sourceMappingURL=custom-errors.test.js.map