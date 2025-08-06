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
export abstract class BaseError extends Error {
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    public readonly code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
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
  toJSON(): Record<string, unknown> {
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
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', context);
  }
}

/**
 * @ai-intent Entity not found errors
 * @ai-pattern Common CRUD operation error
 * @ai-usage When requested entity doesn't exist
 */
export class NotFoundError extends BaseError {
  constructor(
    public readonly entityType: string,
    public readonly entityId: string | number,
    context?: Record<string, unknown>
  ) {
    super(
      `${entityType} with ID ${entityId} not found`,
      'NOT_FOUND',
      { ...context, entityType, entityId }
    );
  }
}

/**
 * @ai-intent Validation errors
 * @ai-pattern Input validation failures
 * @ai-usage For schema validation failures
 */
export class ValidationError extends BaseError {
  constructor(
    message: string,
    public readonly errors: Array<{
      field: string;
      message: string;
      value?: unknown;
    }>,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', { ...context, errors });
  }

  /**
   * @ai-intent Create from Zod error
   * @ai-pattern Zod integration helper
   */
  static fromZodError(error: z.ZodError): ValidationError {
    const errors = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      value: (e as { received?: unknown }).received || undefined
    }));

    return new ValidationError(
      'Validation failed',
      errors,
      { zodError: error }
    );
  }
}

/**
 * @ai-intent File system errors
 * @ai-pattern File operation failures
 * @ai-usage For markdown file operations
 */
export class FileSystemError extends BaseError {
  constructor(
    message: string,
    public readonly operation: 'read' | 'write' | 'delete' | 'create',
    public readonly path: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'FILESYSTEM_ERROR', { ...context, operation, path });
  }
}

/**
 * @ai-intent Configuration errors
 * @ai-pattern Invalid or missing configuration
 * @ai-usage During application startup
 */
export class ConfigurationError extends BaseError {
  constructor(
    message: string,
    public readonly configKey: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'CONFIGURATION_ERROR', { ...context, configKey });
  }
}

/**
 * @ai-intent Concurrency errors
 * @ai-pattern Race conditions or conflicts
 * @ai-usage For optimistic locking failures
 */
export class ConcurrencyError extends BaseError {
  constructor(
    message: string,
    public readonly entityType: string,
    public readonly entityId: string | number,
    context?: Record<string, unknown>
  ) {
    super(
      message,
      'CONCURRENCY_ERROR',
      { ...context, entityType, entityId }
    );
  }
}

/**
 * @ai-intent Business rule violations
 * @ai-pattern Domain logic constraints
 * @ai-usage When business rules are violated
 */
export class BusinessRuleError extends BaseError {
  constructor(
    message: string,
    public readonly rule: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'BUSINESS_RULE_ERROR', { ...context, rule });
  }
}

/**
 * @ai-intent Integration errors
 * @ai-pattern External service failures
 * @ai-usage For MCP protocol errors
 */
export class IntegrationError extends BaseError {
  constructor(
    message: string,
    public readonly service: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'INTEGRATION_ERROR', { ...context, service });
  }
}

/**
 * @ai-intent Rate limiting errors
 * @ai-pattern Too many requests
 * @ai-usage For API rate limits
 */
export class RateLimitError extends BaseError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMIT_ERROR', { ...context, retryAfter });
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
  static fromUnknown(error: unknown, defaultMessage: string = 'An error occurred'): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    if (error instanceof Error) {
      // Create a concrete error class for unknown errors
      return new class extends BaseError {
        constructor() {
          super((error as Error).message || defaultMessage, 'UNKNOWN_ERROR', {
            originalError: (error as Error).name,
            stack: (error as Error).stack
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
  static isRetryable(error: BaseError): boolean {
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
  static toMcpErrorCode(error: BaseError): ErrorCode {
    const mapping: Record<string, ErrorCode> = {
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
  isBaseError(error: unknown): error is BaseError {
    return error instanceof BaseError;
  },

  isDatabaseError(error: unknown): error is DatabaseError {
    return error instanceof DatabaseError;
  },

  isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError;
  },

  isValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError;
  },

  isFileSystemError(error: unknown): error is FileSystemError {
    return error instanceof FileSystemError;
  },

  isBusinessRuleError(error: unknown): error is BusinessRuleError {
    return error instanceof BusinessRuleError;
  }
};