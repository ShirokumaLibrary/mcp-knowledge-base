import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
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
        Error.captureStackTrace(this, this.constructor);
    }
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
export class DatabaseError extends BaseError {
    constructor(message, context) {
        super(message, 'DATABASE_ERROR', context);
    }
}
export class NotFoundError extends BaseError {
    entityType;
    entityId;
    constructor(entityType, entityId, context) {
        super(`${entityType} with ID ${entityId} not found`, 'NOT_FOUND', { ...context, entityType, entityId });
        this.entityType = entityType;
        this.entityId = entityId;
    }
}
export class ValidationError extends BaseError {
    errors;
    constructor(message, errors, context) {
        super(message, 'VALIDATION_ERROR', { ...context, errors });
        this.errors = errors;
    }
    static fromZodError(error) {
        const errors = error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            value: e.received || undefined
        }));
        return new ValidationError('Validation failed', errors, { zodError: error });
    }
}
export class FileSystemError extends BaseError {
    operation;
    path;
    constructor(message, operation, path, context) {
        super(message, 'FILESYSTEM_ERROR', { ...context, operation, path });
        this.operation = operation;
        this.path = path;
    }
}
export class ConfigurationError extends BaseError {
    configKey;
    constructor(message, configKey, context) {
        super(message, 'CONFIGURATION_ERROR', { ...context, configKey });
        this.configKey = configKey;
    }
}
export class ConcurrencyError extends BaseError {
    entityType;
    entityId;
    constructor(message, entityType, entityId, context) {
        super(message, 'CONCURRENCY_ERROR', { ...context, entityType, entityId });
        this.entityType = entityType;
        this.entityId = entityId;
    }
}
export class BusinessRuleError extends BaseError {
    rule;
    constructor(message, rule, context) {
        super(message, 'BUSINESS_RULE_ERROR', { ...context, rule });
        this.rule = rule;
    }
}
export class IntegrationError extends BaseError {
    service;
    constructor(message, service, context) {
        super(message, 'INTEGRATION_ERROR', { ...context, service });
        this.service = service;
    }
}
export class RateLimitError extends BaseError {
    retryAfter;
    constructor(message, retryAfter, context) {
        super(message, 'RATE_LIMIT_ERROR', { ...context, retryAfter });
        this.retryAfter = retryAfter;
    }
}
export class ErrorFactory {
    static fromUnknown(error, defaultMessage = 'An error occurred') {
        if (error instanceof BaseError) {
            return error;
        }
        if (error instanceof Error) {
            return new class extends BaseError {
                constructor() {
                    super(error.message || defaultMessage, 'UNKNOWN_ERROR', {
                        originalError: error.name,
                        stack: error.stack
                    });
                }
            }();
        }
        return new class extends BaseError {
            constructor() {
                super(defaultMessage, 'UNKNOWN_ERROR', {
                    originalError: String(error)
                });
            }
        }();
    }
    static isRetryable(error) {
        const retryableCodes = [
            'DATABASE_ERROR',
            'FILESYSTEM_ERROR',
            'INTEGRATION_ERROR',
            'CONCURRENCY_ERROR'
        ];
        return retryableCodes.includes(error.code);
    }
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
