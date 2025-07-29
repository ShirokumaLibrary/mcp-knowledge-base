/**
 * @ai-context Comprehensive tests for error hierarchy and utilities
 * @ai-pattern Unit tests for custom error classes
 * @ai-critical Tests error handling foundation used throughout application
 * @ai-related-files
 *   - src/utils/errors.ts (implementation)
 *   - src/middleware/error-middleware.ts (uses these errors)
 *   - All handler files (throw these errors)
 */
import { BaseError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, InternalServerError, DatabaseError, FileSystemError, ErrorUtils } from '../errors.js';
// Test implementation of BaseError for testing abstract class
class TestError extends BaseError {
    code = 'TEST_ERROR';
    statusCode = 418; // I'm a teapot
}
describe('BaseError', () => {
    it('should create error with basic properties', () => {
        const error = new TestError('Test message');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(BaseError);
        expect(error.message).toBe('Test message');
        expect(error.name).toBe('TestError');
        expect(error.code).toBe('TEST_ERROR');
        expect(error.statusCode).toBe(418);
        expect(error.timestamp).toBeDefined();
        expect(new Date(error.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
    it('should include context when provided', () => {
        const context = { userId: 123, action: 'test' };
        const error = new TestError('Test message', context);
        expect(error.context).toEqual(context);
    });
    it('should capture stack trace', () => {
        const error = new TestError('Test message');
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('TestError');
        expect(error.stack).toContain('Test message');
    });
    it('should serialize to JSON correctly', () => {
        const context = { key: 'value' };
        const error = new TestError('Test message', context);
        const json = error.toJSON();
        expect(json).toEqual({
            name: 'TestError',
            code: 'TEST_ERROR',
            message: 'Test message',
            statusCode: 418,
            timestamp: error.timestamp,
            context: context,
            stack: error.stack
        });
    });
});
describe('ValidationError', () => {
    it('should create validation error with fields', () => {
        const fields = {
            email: ['Invalid email format'],
            password: ['Too short', 'Must contain numbers']
        };
        const error = new ValidationError('Validation failed', fields);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.statusCode).toBe(400);
        expect(error.fields).toEqual(fields);
    });
    it('should handle empty fields', () => {
        const error = new ValidationError('Validation failed');
        expect(error.fields).toEqual({});
    });
});
describe('AuthenticationError', () => {
    it('should create authentication error', () => {
        const error = new AuthenticationError('Invalid credentials');
        expect(error.code).toBe('AUTHENTICATION_ERROR');
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid credentials');
    });
});
describe('AuthorizationError', () => {
    it('should create authorization error', () => {
        const error = new AuthorizationError('Insufficient permissions');
        expect(error.code).toBe('AUTHORIZATION_ERROR');
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Insufficient permissions');
    });
});
describe('NotFoundError', () => {
    it('should create not found error with resource details', () => {
        const error = new NotFoundError('issue', 123);
        expect(error.code).toBe('NOT_FOUND');
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('issue with id 123 not found');
        expect(error.resourceType).toBe('issue');
        expect(error.resourceId).toBe(123);
    });
    it('should handle string resource IDs', () => {
        const error = new NotFoundError('session', '2024-01-01-12.00.00.000');
        expect(error.message).toBe('session with id 2024-01-01-12.00.00.000 not found');
        expect(error.resourceId).toBe('2024-01-01-12.00.00.000');
    });
    it('should include context when provided', () => {
        const context = { searchParams: { type: 'issues' } };
        const error = new NotFoundError('issue', 123, context);
        expect(error.context).toEqual(context);
    });
});
describe('ConflictError', () => {
    it('should create conflict error', () => {
        const error = new ConflictError('Resource already exists');
        expect(error.code).toBe('CONFLICT');
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Resource already exists');
    });
});
describe('InternalServerError', () => {
    it('should create internal server error', () => {
        const error = new InternalServerError('Something went wrong');
        expect(error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Something went wrong');
    });
});
describe('DatabaseError', () => {
    it('should create database error with operation', () => {
        const error = new DatabaseError('INSERT', 'Constraint violation');
        expect(error.code).toBe('DATABASE_ERROR');
        expect(error.statusCode).toBe(500);
        expect(error.operation).toBe('INSERT');
        expect(error.message).toBe('Constraint violation');
    });
    it('should include context when provided', () => {
        const context = { table: 'items', query: 'INSERT INTO...' };
        const error = new DatabaseError('INSERT', 'Failed', context);
        expect(error.context).toEqual(context);
    });
});
describe('FileSystemError', () => {
    it('should create file system error with details', () => {
        const error = new FileSystemError('READ', '/path/to/file', 'Permission denied');
        expect(error.code).toBe('FILE_SYSTEM_ERROR');
        expect(error.statusCode).toBe(500);
        expect(error.operation).toBe('READ');
        expect(error.path).toBe('/path/to/file');
        expect(error.message).toBe('Permission denied');
    });
    it('should include context when provided', () => {
        const context = { errno: -13, code: 'EACCES' };
        const error = new FileSystemError('WRITE', '/file', 'Access denied', context);
        expect(error.context).toEqual(context);
    });
});
describe('ErrorUtils', () => {
    describe('isErrorType', () => {
        it('should correctly identify error types', () => {
            const validationError = new ValidationError('Invalid');
            const notFoundError = new NotFoundError('issue', 1);
            const genericError = new Error('Generic');
            expect(ErrorUtils.isErrorType(validationError, ValidationError)).toBe(true);
            expect(ErrorUtils.isErrorType(validationError, NotFoundError)).toBe(false);
            expect(ErrorUtils.isErrorType(notFoundError, NotFoundError)).toBe(true);
            expect(ErrorUtils.isErrorType(genericError, ValidationError)).toBe(false);
        });
        it('should handle non-error values', () => {
            expect(ErrorUtils.isErrorType('string', ValidationError)).toBe(false);
            expect(ErrorUtils.isErrorType(null, ValidationError)).toBe(false);
            expect(ErrorUtils.isErrorType(undefined, ValidationError)).toBe(false);
            expect(ErrorUtils.isErrorType({}, ValidationError)).toBe(false);
        });
    });
    describe('wrap', () => {
        it('should return BaseError instances as-is', () => {
            const error = new ValidationError('Test');
            const wrapped = ErrorUtils.wrap(error);
            expect(wrapped).toBe(error);
        });
        it('should wrap Node.js file system errors', () => {
            const nodeError = new Error('ENOENT: no such file or directory');
            nodeError.code = 'ENOENT';
            const wrapped = ErrorUtils.wrap(nodeError);
            expect(wrapped).toBeInstanceOf(FileSystemError);
            expect(wrapped.message).toBe('ENOENT: no such file or directory');
            expect(wrapped.context).toEqual({ originalCode: 'ENOENT' });
        });
        it('should recognize various file system error codes', () => {
            const codes = ['ENOENT', 'EACCES', 'EISDIR', 'ENOTDIR'];
            codes.forEach(code => {
                const nodeError = new Error(`${code} error`);
                nodeError.code = code;
                const wrapped = ErrorUtils.wrap(nodeError);
                expect(wrapped).toBeInstanceOf(FileSystemError);
                expect(wrapped.context?.originalCode).toBe(code);
            });
        });
        it('should wrap generic errors as InternalServerError', () => {
            const error = new Error('Generic error');
            const wrapped = ErrorUtils.wrap(error);
            expect(wrapped).toBeInstanceOf(InternalServerError);
            expect(wrapped.message).toBe('Generic error');
            expect(wrapped.context).toEqual({ originalError: 'Error' });
        });
        it('should handle non-Error objects', () => {
            const wrapped1 = ErrorUtils.wrap('String error');
            expect(wrapped1).toBeInstanceOf(InternalServerError);
            expect(wrapped1.message).toBe('An unexpected error occurred');
            expect(wrapped1.context).toEqual({ error: 'String error' });
            const wrapped2 = ErrorUtils.wrap(42);
            expect(wrapped2).toBeInstanceOf(InternalServerError);
            expect(wrapped2.context).toEqual({ error: '42' });
            const wrapped3 = ErrorUtils.wrap(null);
            expect(wrapped3).toBeInstanceOf(InternalServerError);
            expect(wrapped3.context).toEqual({ error: 'null' });
        });
        it('should use custom default message', () => {
            const wrapped = ErrorUtils.wrap('error', 'Custom message');
            expect(wrapped.message).toBe('Custom message');
        });
    });
    describe('toLoggable', () => {
        it('should convert BaseError to JSON', () => {
            const error = new ValidationError('Test', { field: ['error'] });
            const loggable = ErrorUtils.toLoggable(error);
            expect(loggable).toEqual(error.toJSON());
        });
        it('should convert standard Error to loggable format', () => {
            const error = new Error('Standard error');
            const loggable = ErrorUtils.toLoggable(error);
            expect(loggable).toEqual({
                name: 'Error',
                message: 'Standard error',
                stack: error.stack
            });
        });
        it('should handle non-Error objects', () => {
            expect(ErrorUtils.toLoggable('string error')).toEqual({
                error: 'string error',
                type: 'string'
            });
            expect(ErrorUtils.toLoggable(123)).toEqual({
                error: '123',
                type: 'number'
            });
            expect(ErrorUtils.toLoggable(null)).toEqual({
                error: 'null',
                type: 'object'
            });
            expect(ErrorUtils.toLoggable(undefined)).toEqual({
                error: 'undefined',
                type: 'undefined'
            });
            expect(ErrorUtils.toLoggable({ key: 'value' })).toEqual({
                error: '[object Object]',
                type: 'object'
            });
        });
    });
});
//# sourceMappingURL=errors.test.js.map