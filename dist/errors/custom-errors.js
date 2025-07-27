/**
 * @ai-context Custom error classes for application-specific errors
 * @ai-pattern Error hierarchy for precise error handling
 * @ai-critical All custom errors extend BaseError
 * @ai-why Enables specific error handling strategies
 * @ai-assumption Error codes align with MCP protocol where applicable
 */
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
/**
 * @ai-intent Base error class with common functionality
 * @ai-pattern All custom errors extend this class
 * @ai-critical Captures stack trace and error context
 */
export class BaseError extends Error {
    code;
    timestamp;
    context;
    constructor(message, code, context) {
        super(message);
        this.code = code;
        this.name = this.constructor.name;
        this.timestamp = new Date();
        this.context = context;
        // @ai-critical: Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
    /**
     * @ai-intent Convert error to JSON representation
     * @ai-pattern Serializable error format
     * @ai-usage For logging and API responses
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp.toISOString(),
            context: this.context,
            stack: this.stack
        };
    }
}
/**
 * @ai-intent Database-related errors
 * @ai-pattern Specific to data access layer
 * @ai-usage Thrown by repositories
 */
export class DatabaseError extends BaseError {
    constructor(message, context) {
        super(message, 'DATABASE_ERROR', context);
    }
}
/**
 * @ai-intent Entity not found errors
 * @ai-pattern Common CRUD operation error
 * @ai-usage When requested entity doesn't exist
 */
export class NotFoundError extends BaseError {
    entityType;
    entityId;
    constructor(entityType, entityId, context) {
        super(`${entityType} with ID ${entityId} not found`, 'NOT_FOUND', { ...context, entityType, entityId });
        this.entityType = entityType;
        this.entityId = entityId;
    }
}
/**
 * @ai-intent Validation errors
 * @ai-pattern Input validation failures
 * @ai-usage For schema validation failures
 */
export class ValidationError extends BaseError {
    errors;
    constructor(message, errors, context) {
        super(message, 'VALIDATION_ERROR', { ...context, errors });
        this.errors = errors;
    }
    /**
     * @ai-intent Create from Zod error
     * @ai-pattern Zod integration helper
     */
    static fromZodError(error) {
        const errors = error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            value: e.received || undefined
        }));
        return new ValidationError('Validation failed', errors, { zodError: error });
    }
}
/**
 * @ai-intent File system errors
 * @ai-pattern File operation failures
 * @ai-usage For markdown file operations
 */
export class FileSystemError extends BaseError {
    operation;
    path;
    constructor(message, operation, path, context) {
        super(message, 'FILESYSTEM_ERROR', { ...context, operation, path });
        this.operation = operation;
        this.path = path;
    }
}
/**
 * @ai-intent Configuration errors
 * @ai-pattern Invalid or missing configuration
 * @ai-usage During application startup
 */
export class ConfigurationError extends BaseError {
    configKey;
    constructor(message, configKey, context) {
        super(message, 'CONFIGURATION_ERROR', { ...context, configKey });
        this.configKey = configKey;
    }
}
/**
 * @ai-intent Concurrency errors
 * @ai-pattern Race conditions or conflicts
 * @ai-usage For optimistic locking failures
 */
export class ConcurrencyError extends BaseError {
    entityType;
    entityId;
    constructor(message, entityType, entityId, context) {
        super(message, 'CONCURRENCY_ERROR', { ...context, entityType, entityId });
        this.entityType = entityType;
        this.entityId = entityId;
    }
}
/**
 * @ai-intent Business rule violations
 * @ai-pattern Domain logic constraints
 * @ai-usage When business rules are violated
 */
export class BusinessRuleError extends BaseError {
    rule;
    constructor(message, rule, context) {
        super(message, 'BUSINESS_RULE_ERROR', { ...context, rule });
        this.rule = rule;
    }
}
/**
 * @ai-intent Integration errors
 * @ai-pattern External service failures
 * @ai-usage For MCP protocol errors
 */
export class IntegrationError extends BaseError {
    service;
    constructor(message, service, context) {
        super(message, 'INTEGRATION_ERROR', { ...context, service });
        this.service = service;
    }
}
/**
 * @ai-intent Rate limiting errors
 * @ai-pattern Too many requests
 * @ai-usage For API rate limits
 */
export class RateLimitError extends BaseError {
    retryAfter;
    constructor(message, retryAfter, context) {
        super(message, 'RATE_LIMIT_ERROR', { ...context, retryAfter });
        this.retryAfter = retryAfter;
    }
}
/**
 * @ai-intent Error factory for creating appropriate errors
 * @ai-pattern Factory pattern for error creation
 * @ai-usage Centralized error creation logic
 */
export class ErrorFactory {
    /**
     * @ai-intent Create error from unknown type
     * @ai-pattern Safe error creation
     * @ai-usage In catch blocks
     */
    static fromUnknown(error, defaultMessage = 'An error occurred') {
        if (error instanceof BaseError) {
            return error;
        }
        if (error instanceof Error) {
            // Create a concrete error class for unknown errors
            return new class extends BaseError {
                constructor() {
                    super(error.message || defaultMessage, 'UNKNOWN_ERROR', {
                        originalError: error.name,
                        stack: error.stack
                    });
                }
            }();
        }
        // Create a concrete error class for non-Error types
        return new class extends BaseError {
            constructor() {
                super(defaultMessage, 'UNKNOWN_ERROR', {
                    originalError: String(error)
                });
            }
        }();
    }
    /**
     * @ai-intent Check if error is retryable
     * @ai-pattern Retry logic helper
     * @ai-usage For resilient operations
     */
    static isRetryable(error) {
        const retryableCodes = [
            'DATABASE_ERROR',
            'FILESYSTEM_ERROR',
            'INTEGRATION_ERROR',
            'CONCURRENCY_ERROR'
        ];
        return retryableCodes.includes(error.code);
    }
    /**
     * @ai-intent Convert to MCP error code
     * @ai-pattern MCP protocol compatibility
     * @ai-usage For handler responses
     */
    static toMcpErrorCode(error) {
        const mapping = {
            'VALIDATION_ERROR': ErrorCode.InvalidParams,
            'NOT_FOUND': ErrorCode.InvalidParams,
            'BUSINESS_RULE_ERROR': ErrorCode.InvalidParams,
            'RATE_LIMIT_ERROR': ErrorCode.InvalidRequest,
            'DATABASE_ERROR': ErrorCode.InternalError,
            'FILESYSTEM_ERROR': ErrorCode.InternalError,
            'CONFIGURATION_ERROR': ErrorCode.InternalError,
            'CONCURRENCY_ERROR': ErrorCode.InternalError,
            'INTEGRATION_ERROR': ErrorCode.InternalError,
            'UNKNOWN_ERROR': ErrorCode.InternalError
        };
        return mapping[error.code] || ErrorCode.InternalError;
    }
}
/**
 * @ai-intent Type guards for error checking
 * @ai-pattern Runtime type checking
 * @ai-usage In error handling logic
 */
export const ErrorGuards = {
    isBaseError(error) {
        return error instanceof BaseError;
    },
    isDatabaseError(error) {
        return error instanceof DatabaseError;
    },
    isNotFoundError(error) {
        return error instanceof NotFoundError;
    },
    isValidationError(error) {
        return error instanceof ValidationError;
    },
    isFileSystemError(error) {
        return error instanceof FileSystemError;
    },
    isBusinessRuleError(error) {
        return error instanceof BusinessRuleError;
    }
};
//# sourceMappingURL=custom-errors.js.map