/**
 * @ai-context Custom error hierarchy for structured error handling
 * @ai-pattern Error class hierarchy with context preservation
 * @ai-critical Base for all application errors - ensures consistent error format
 * @ai-why Structured errors enable better debugging and user feedback
 */
/**
 * @ai-context Abstract base class for all custom errors
 * @ai-pattern Template pattern for error structure
 * @ai-critical All errors must extend this for consistent handling
 * @ai-assumption Error codes and status codes map to HTTP/MCP conventions
 */
export class BaseError extends Error {
    timestamp;
    context; // @ai-logic: Additional debug information
    constructor(message, context) {
        super(message);
        this.name = this.constructor.name;
        this.timestamp = new Date().toISOString();
        this.context = context;
        Error.captureStackTrace(this, this.constructor); // @ai-why: Clean stack traces
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            context: this.context,
            stack: this.stack
        };
    }
}
/**
 * @ai-intent Input validation failures from schema or business rules
 * @ai-flow Used by handlers when Zod validation fails or custom checks fail
 * @ai-critical Includes field-level errors for precise user feedback
 * @ai-assumption Field names match schema property names
 */
export class ValidationError extends BaseError {
    code = 'VALIDATION_ERROR';
    statusCode = 400; // @ai-logic: Bad Request
    fields; // @ai-logic: field -> [error messages]
    constructor(message, fields = {}, context) {
        super(message, context);
        this.fields = fields;
    }
}
/**
 * Authentication error
 */
export class AuthenticationError extends BaseError {
    code = 'AUTHENTICATION_ERROR';
    statusCode = 401;
}
/**
 * Authorization error
 */
export class AuthorizationError extends BaseError {
    code = 'AUTHORIZATION_ERROR';
    statusCode = 403;
}
/**
 * @ai-intent Entity lookup failures (issue, plan, doc, etc.)
 * @ai-flow Thrown by repositories when ID doesn't exist
 * @ai-critical Includes resource type and ID for clear error messages
 * @ai-assumption Resource types match MCP tool type parameter values
 */
export class NotFoundError extends BaseError {
    code = 'NOT_FOUND';
    statusCode = 404;
    resourceType; // @ai-logic: 'issue', 'plan', 'doc', etc.
    resourceId; // @ai-logic: The missing ID
    constructor(resourceType, resourceId, context) {
        super(`${resourceType} with id ${resourceId} not found`, context);
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
}
/**
 * Conflict error
 */
export class ConflictError extends BaseError {
    code = 'CONFLICT';
    statusCode = 409;
}
/**
 * Internal server error
 */
export class InternalServerError extends BaseError {
    code = 'INTERNAL_SERVER_ERROR';
    statusCode = 500;
}
/**
 * Database error
 */
export class DatabaseError extends BaseError {
    code = 'DATABASE_ERROR';
    statusCode = 500;
    operation;
    constructor(operation, message, context) {
        super(message, context);
        this.operation = operation;
    }
}
/**
 * File system error
 */
export class FileSystemError extends BaseError {
    code = 'FILE_SYSTEM_ERROR';
    statusCode = 500;
    path;
    operation;
    constructor(operation, path, message, context) {
        super(message, context);
        this.operation = operation;
        this.path = path;
    }
}
/**
 * @ai-context Utility class for error handling and transformation
 * @ai-pattern Static utility methods for error operations
 * @ai-critical Central point for error normalization and logging
 * @ai-why Consistent error handling across all components
 */
export class ErrorUtils {
    /**
     * @ai-intent Type guard for checking error types
     * @ai-flow Used in catch blocks to handle specific errors differently
     * @ai-return Type-safe boolean with TypeScript narrowing
     * @ai-why Enables type-safe error handling in TypeScript
     */
    static isErrorType(error, errorClass) {
        return error instanceof errorClass;
    }
    /**
     * @ai-intent Convert unknown errors to structured BaseError types
     * @ai-flow 1. Check if already BaseError -> 2. Detect error type -> 3. Wrap appropriately
     * @ai-critical Preserves original error information in context
     * @ai-assumption Node.js error codes follow standard conventions
     * @ai-why Ensures all errors have consistent structure for logging/API responses
     */
    static wrap(error, defaultMessage = 'An unexpected error occurred') {
        // @ai-logic: Already structured - return as-is
        if (error instanceof BaseError) {
            return error;
        }
        if (error instanceof Error) {
            // @ai-logic: Detect Node.js file system errors by code
            if ('code' in error && typeof error.code === 'string') {
                if (['ENOENT', 'EACCES', 'EISDIR', 'ENOTDIR'].includes(error.code)) {
                    return new FileSystemError('unknown', 'unknown', error.message, { originalCode: error.code } // @ai-logic: Preserve original error code
                    );
                }
            }
            return new InternalServerError(error.message, { originalError: error.name });
        }
        // @ai-edge-case: Non-Error objects (strings, numbers, etc.)
        return new InternalServerError(defaultMessage, { error: String(error) });
    }
    /**
     * Convert error to safely loggable format
     */
    static toLoggable(error) {
        if (error instanceof BaseError) {
            return error.toJSON();
        }
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }
        return {
            error: String(error),
            type: typeof error
        };
    }
}
//# sourceMappingURL=errors.js.map