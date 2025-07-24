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
export declare abstract class BaseError extends Error {
    abstract readonly code: string;
    abstract readonly statusCode: number;
    readonly timestamp: string;
    readonly context?: Record<string, any>;
    constructor(message: string, context?: Record<string, any>);
    toJSON(): {
        name: string;
        code: string;
        message: string;
        statusCode: number;
        timestamp: string;
        context: Record<string, any> | undefined;
        stack: string | undefined;
    };
}
/**
 * @ai-intent Input validation failures from schema or business rules
 * @ai-flow Used by handlers when Zod validation fails or custom checks fail
 * @ai-critical Includes field-level errors for precise user feedback
 * @ai-assumption Field names match schema property names
 */
export declare class ValidationError extends BaseError {
    readonly code = "VALIDATION_ERROR";
    readonly statusCode = 400;
    readonly fields: Record<string, string[]>;
    constructor(message: string, fields?: Record<string, string[]>, context?: Record<string, any>);
}
/**
 * Authentication error
 */
export declare class AuthenticationError extends BaseError {
    readonly code = "AUTHENTICATION_ERROR";
    readonly statusCode = 401;
}
/**
 * Authorization error
 */
export declare class AuthorizationError extends BaseError {
    readonly code = "AUTHORIZATION_ERROR";
    readonly statusCode = 403;
}
/**
 * @ai-intent Entity lookup failures (issue, plan, doc, etc.)
 * @ai-flow Thrown by repositories when ID doesn't exist
 * @ai-critical Includes resource type and ID for clear error messages
 * @ai-assumption Resource types match MCP tool type parameter values
 */
export declare class NotFoundError extends BaseError {
    readonly code = "NOT_FOUND";
    readonly statusCode = 404;
    readonly resourceType: string;
    readonly resourceId: string | number;
    constructor(resourceType: string, resourceId: string | number, context?: Record<string, any>);
}
/**
 * Conflict error
 */
export declare class ConflictError extends BaseError {
    readonly code = "CONFLICT";
    readonly statusCode = 409;
}
/**
 * Internal server error
 */
export declare class InternalServerError extends BaseError {
    readonly code = "INTERNAL_SERVER_ERROR";
    readonly statusCode = 500;
}
/**
 * Database error
 */
export declare class DatabaseError extends BaseError {
    readonly code = "DATABASE_ERROR";
    readonly statusCode = 500;
    readonly operation: string;
    constructor(operation: string, message: string, context?: Record<string, any>);
}
/**
 * File system error
 */
export declare class FileSystemError extends BaseError {
    readonly code = "FILE_SYSTEM_ERROR";
    readonly statusCode = 500;
    readonly path: string;
    readonly operation: string;
    constructor(operation: string, path: string, message: string, context?: Record<string, any>);
}
/**
 * @ai-context Utility class for error handling and transformation
 * @ai-pattern Static utility methods for error operations
 * @ai-critical Central point for error normalization and logging
 * @ai-why Consistent error handling across all components
 */
export declare class ErrorUtils {
    /**
     * @ai-intent Type guard for checking error types
     * @ai-flow Used in catch blocks to handle specific errors differently
     * @ai-return Type-safe boolean with TypeScript narrowing
     * @ai-why Enables type-safe error handling in TypeScript
     */
    static isErrorType<T extends BaseError>(error: unknown, errorClass: new (...args: any[]) => T): error is T;
    /**
     * @ai-intent Convert unknown errors to structured BaseError types
     * @ai-flow 1. Check if already BaseError -> 2. Detect error type -> 3. Wrap appropriately
     * @ai-critical Preserves original error information in context
     * @ai-assumption Node.js error codes follow standard conventions
     * @ai-why Ensures all errors have consistent structure for logging/API responses
     */
    static wrap(error: unknown, defaultMessage?: string): BaseError;
    /**
     * Convert error to safely loggable format
     */
    static toLoggable(error: unknown): Record<string, any>;
}
