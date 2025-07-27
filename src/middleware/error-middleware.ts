/**
 * @ai-context Error handling middleware for MCP handlers
 * @ai-pattern Centralized error processing
 * @ai-critical Converts all errors to appropriate responses
 * @ai-why Consistent error handling across all handlers
 * @ai-assumption All handlers wrapped with this middleware
 */

import { McpError } from '@modelcontextprotocol/sdk/types.js';
import type { Logger } from 'winston';
import type { z } from 'zod';
import { createLogger } from '../utils/logger.js';
import type {
  BaseError,
  NotFoundError,
  BusinessRuleError} from '../errors/custom-errors.js';
import {
  ErrorFactory,
  ErrorGuards,
  ValidationError,
  RateLimitError
} from '../errors/custom-errors.js';
import type { ToolResponse } from '../types/api-types.js';

/**
 * @ai-intent Error context for logging
 * @ai-pattern Structured error metadata
 */
interface ErrorContext {
  handler: string;
  method: string;
  args?: unknown;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * @ai-intent Error response formatter
 * @ai-pattern Consistent error response structure
 */
interface ErrorResponse extends ToolResponse {
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * @ai-intent Error handling middleware class
 * @ai-pattern Middleware pattern for error processing
 * @ai-critical Handles all error types consistently
 */
export class ErrorMiddleware {
  private static logger: Logger = createLogger('ErrorMiddleware');

  /**
   * @ai-intent Wrap handler with error handling
   * @ai-flow 1. Execute handler -> 2. Catch errors -> 3. Process -> 4. Return response
   * @ai-pattern Higher-order function wrapper
   * @ai-usage Applied to all handler methods
   */
  static wrap<T extends (...args: any[]) => Promise<ToolResponse>>(
    handler: T,
    context: ErrorContext
  ): T {
    return (async (...args: Parameters<T>): Promise<ToolResponse> => {
      const startTime = Date.now();
      const errorContext = { ...context, args: args[0], timestamp: new Date().toISOString() };

      try {
        // @ai-logic: Execute the handler
        const result = await handler(...args);

        // @ai-logic: Log successful execution
        this.logger.debug('Handler executed successfully', {
          ...errorContext,
          duration: Date.now() - startTime
        });

        return result;

      } catch (error) {
        // @ai-logic: Process and log the error
        const processedError = this.processError(error, errorContext);

        // @ai-logic: Log error with appropriate level
        this.logError(processedError, errorContext);

        // @ai-logic: Convert to appropriate response
        return this.createErrorResponse(processedError, errorContext);
      }
    }) as T;
  }

  /**
   * @ai-intent Process raw error into BaseError
   * @ai-flow 1. Check error type -> 2. Convert if needed -> 3. Enhance with context
   * @ai-pattern Error normalization
   */
  private static processError(error: unknown, context: ErrorContext): BaseError {
    // @ai-logic: Already a BaseError
    if (ErrorGuards.isBaseError(error)) {
      return error;
    }

    // @ai-logic: MCP protocol error
    if (error instanceof McpError) {
      return ErrorFactory.fromUnknown(error, error.message);
    }

    // @ai-logic: Zod validation error
    if (this.isZodError(error)) {
      return ValidationError.fromZodError(error as z.ZodError);
    }

    // @ai-logic: Generic error
    return ErrorFactory.fromUnknown(error);
  }

  /**
   * @ai-intent Log error with appropriate level
   * @ai-flow Determine log level based on error type
   * @ai-pattern Structured logging with context
   */
  private static logError(error: BaseError, context: ErrorContext): void {
    const logData = {
      ...context,
      error: error.toJSON(),
      errorCode: error.code,
      errorMessage: error.message
    };

    // @ai-logic: Determine log level
    if (ErrorGuards.isValidationError(error) || ErrorGuards.isNotFoundError(error)) {
      this.logger.warn('Client error occurred', logData);
    } else if (ErrorGuards.isBusinessRuleError(error)) {
      this.logger.info('Business rule violation', logData);
    } else if (error.code === 'RATE_LIMIT_ERROR') {
      this.logger.warn('Rate limit exceeded', logData);
    } else {
      this.logger.error('Server error occurred', logData);
    }
  }

  /**
   * @ai-intent Create user-friendly error response
   * @ai-flow 1. Determine message -> 2. Add details -> 3. Format response
   * @ai-pattern User-friendly error messages
   */
  private static createErrorResponse(
    error: BaseError,
    context: ErrorContext
  ): ToolResponse {
    let userMessage: string;
    let details: unknown = undefined;

    // @ai-logic: Create user-friendly messages
    if (ErrorGuards.isValidationError(error)) {
      const validationError = error as ValidationError;
      userMessage = 'Invalid input: ' + validationError.errors
        .map(e => `${e.field}: ${e.message}`)
        .join(', ');
      details = validationError.errors;

    } else if (ErrorGuards.isNotFoundError(error)) {
      const notFoundError = error as NotFoundError;
      userMessage = `${notFoundError.entityType} not found`;

    } else if (ErrorGuards.isBusinessRuleError(error)) {
      const businessError = error as BusinessRuleError;
      userMessage = businessError.message;

    } else if (error instanceof RateLimitError) {
      userMessage = 'Too many requests. Please try again later.';
      if (error.retryAfter) {
        userMessage += ` Retry after ${error.retryAfter} seconds.`;
      }

    } else {
      // @ai-logic: Generic error message for internal errors
      userMessage = 'An error occurred while processing your request. Please try again.';

      // @ai-logic: Add request ID for support
      if (context.requestId) {
        userMessage += ` Reference: ${context.requestId}`;
      }
    }

    // @ai-logic: Create error response
    const response: ErrorResponse = {
      content: [{
        type: 'text',
        text: `Error: ${userMessage}`
      }]
    };

    // @ai-logic: Add error details in development
    if (process.env.NODE_ENV === 'development') {
      response.error = {
        code: error.code,
        message: error.message,
        details: details || error.context
      };
    }

    return response;
  }

  /**
   * @ai-intent Check if error is from Zod
   * @ai-pattern Type guard for Zod errors
   */
  private static isZodError(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      'errors' in error &&
      Array.isArray((error as any).errors) &&
      'name' in error &&
      (error as any).name === 'ZodError'
    );
  }

  /**
   * @ai-intent Create error context for a handler
   * @ai-pattern Context factory
   * @ai-usage Called when registering handlers
   */
  static createContext(handler: string, method: string): ErrorContext {
    return {
      handler,
      method,
      requestId: this.generateRequestId()
    };
  }

  /**
   * @ai-intent Generate unique request ID
   * @ai-pattern Request tracking
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * @ai-intent Global error handler for uncaught errors
   * @ai-pattern Process-level error handling
   * @ai-critical Prevents application crash
   */
  static setupGlobalErrorHandling(): void {
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });

      // @ai-critical: Give time to flush logs
      setTimeout(() => process.exit(1), 1000);
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      this.logger.error('Unhandled rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined
      });
    });
  }
}