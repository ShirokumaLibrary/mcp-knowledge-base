/**
 * @ai-context Custom error classes for application-specific errors
 * @ai-pattern Error hierarchy for precise error handling
 * @ai-critical All custom errors extend BaseError
 * @ai-why Enables specific error handling strategies
 * @ai-assumption Error codes align with MCP protocol where applicable
 */
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';
/**
 * @ai-intent Base error class with common functionality
 * @ai-pattern All custom errors extend this class
 * @ai-critical Captures stack trace and error context
 */
export declare abstract class BaseError extends Error {
    readonly code: string;
    readonly timestamp: Date;
    readonly context?: Record<string, unknown>;
    constructor(message: string, code: string, context?: Record<string, unknown>);
    /**
     * @ai-intent Convert error to JSON representation
     * @ai-pattern Serializable error format
     * @ai-usage For logging and API responses
     */
    toJSON(): Record<string, unknown>;
}
/**
 * @ai-intent Database-related errors
 * @ai-pattern Specific to data access layer
 * @ai-usage Thrown by repositories
 */
export declare class DatabaseError extends BaseError {
    constructor(message: string, context?: Record<string, unknown>);
}
/**
 * @ai-intent Entity not found errors
 * @ai-pattern Common CRUD operation error
 * @ai-usage When requested entity doesn't exist
 */
export declare class NotFoundError extends BaseError {
    readonly entityType: string;
    readonly entityId: string | number;
    constructor(entityType: string, entityId: string | number, context?: Record<string, unknown>);
}
/**
 * @ai-intent Validation errors
 * @ai-pattern Input validation failures
 * @ai-usage For schema validation failures
 */
export declare class ValidationError extends BaseError {
    readonly errors: Array<{
        field: string;
        message: string;
        value?: unknown;
    }>;
    constructor(message: string, errors: Array<{
        field: string;
        message: string;
        value?: unknown;
    }>, context?: Record<string, unknown>);
    /**
     * @ai-intent Create from Zod error
     * @ai-pattern Zod integration helper
     */
    static fromZodError(error: z.ZodError): ValidationError;
}
/**
 * @ai-intent File system errors
 * @ai-pattern File operation failures
 * @ai-usage For markdown file operations
 */
export declare class FileSystemError extends BaseError {
    readonly operation: 'read' | 'write' | 'delete' | 'create';
    readonly path: string;
    constructor(message: string, operation: 'read' | 'write' | 'delete' | 'create', path: string, context?: Record<string, unknown>);
}
/**
 * @ai-intent Configuration errors
 * @ai-pattern Invalid or missing configuration
 * @ai-usage During application startup
 */
export declare class ConfigurationError extends BaseError {
    readonly configKey: string;
    constructor(message: string, configKey: string, context?: Record<string, unknown>);
}
/**
 * @ai-intent Concurrency errors
 * @ai-pattern Race conditions or conflicts
 * @ai-usage For optimistic locking failures
 */
export declare class ConcurrencyError extends BaseError {
    readonly entityType: string;
    readonly entityId: string | number;
    constructor(message: string, entityType: string, entityId: string | number, context?: Record<string, unknown>);
}
/**
 * @ai-intent Business rule violations
 * @ai-pattern Domain logic constraints
 * @ai-usage When business rules are violated
 */
export declare class BusinessRuleError extends BaseError {
    readonly rule: string;
    constructor(message: string, rule: string, context?: Record<string, unknown>);
}
/**
 * @ai-intent Integration errors
 * @ai-pattern External service failures
 * @ai-usage For MCP protocol errors
 */
export declare class IntegrationError extends BaseError {
    readonly service: string;
    constructor(message: string, service: string, context?: Record<string, unknown>);
}
/**
 * @ai-intent Rate limiting errors
 * @ai-pattern Too many requests
 * @ai-usage For API rate limits
 */
export declare class RateLimitError extends BaseError {
    readonly retryAfter?: number | undefined;
    constructor(message: string, retryAfter?: number | undefined, context?: Record<string, unknown>);
}
/**
 * @ai-intent Error factory for creating appropriate errors
 * @ai-pattern Factory pattern for error creation
 * @ai-usage Centralized error creation logic
 */
export declare class ErrorFactory {
    /**
     * @ai-intent Create error from unknown type
     * @ai-pattern Safe error creation
     * @ai-usage In catch blocks
     */
    static fromUnknown(error: unknown, defaultMessage?: string): BaseError;
    /**
     * @ai-intent Check if error is retryable
     * @ai-pattern Retry logic helper
     * @ai-usage For resilient operations
     */
    static isRetryable(error: BaseError): boolean;
    /**
     * @ai-intent Convert to MCP error code
     * @ai-pattern MCP protocol compatibility
     * @ai-usage For handler responses
     */
    static toMcpErrorCode(error: BaseError): ErrorCode;
}
/**
 * @ai-intent Type guards for error checking
 * @ai-pattern Runtime type checking
 * @ai-usage In error handling logic
 */
export declare const ErrorGuards: {
    isBaseError(error: unknown): error is BaseError;
    isDatabaseError(error: unknown): error is DatabaseError;
    isNotFoundError(error: unknown): error is NotFoundError;
    isValidationError(error: unknown): error is ValidationError;
    isFileSystemError(error: unknown): error is FileSystemError;
    isBusinessRuleError(error: unknown): error is BusinessRuleError;
};
