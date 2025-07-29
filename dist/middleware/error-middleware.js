/**
 * @ai-context Error handling middleware for MCP handlers
 * @ai-pattern Centralized error processing
 * @ai-critical Converts all errors to appropriate responses
 * @ai-why Consistent error handling across all handlers
 * @ai-assumption All handlers wrapped with this middleware
 */
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { createLogger } from '../utils/logger.js';
import { ErrorFactory, ErrorGuards, ValidationError, RateLimitError } from '../errors/custom-errors.js';
/**
 * @ai-intent Error handling middleware class
 * @ai-pattern Middleware pattern for error processing
 * @ai-critical Handles all error types consistently
 */
export class ErrorMiddleware {
    static logger = createLogger('ErrorMiddleware');
    /**
     * @ai-intent Wrap handler with error handling
     * @ai-flow 1. Execute handler -> 2. Catch errors -> 3. Process -> 4. Return response
     * @ai-pattern Higher-order function wrapper
     * @ai-usage Applied to all handler methods
     */
    static wrap(handler, context) {
        return (async (...args) => {
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
            }
            catch (error) {
                // @ai-logic: Process and log the error
                const processedError = this.processError(error, errorContext);
                // @ai-logic: Log error with appropriate level
                this.logError(processedError, errorContext);
                // @ai-logic: Convert to appropriate response
                return this.createErrorResponse(processedError, errorContext);
            }
        });
    }
    /**
     * @ai-intent Process raw error into BaseError
     * @ai-flow 1. Check error type -> 2. Convert if needed -> 3. Enhance with context
     * @ai-pattern Error normalization
     */
    static processError(error, _context) {
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
            return ValidationError.fromZodError(error);
        }
        // @ai-logic: Generic error
        return ErrorFactory.fromUnknown(error);
    }
    /**
     * @ai-intent Log error with appropriate level
     * @ai-flow Determine log level based on error type
     * @ai-pattern Structured logging with context
     */
    static logError(error, context) {
        const logData = {
            ...context,
            error: error.toJSON(),
            errorCode: error.code,
            errorMessage: error.message
        };
        // @ai-logic: Determine log level
        if (ErrorGuards.isValidationError(error) || ErrorGuards.isNotFoundError(error)) {
            this.logger.warn('Client error occurred', logData);
        }
        else if (ErrorGuards.isBusinessRuleError(error)) {
            this.logger.info('Business rule violation', logData);
        }
        else if (error.code === 'RATE_LIMIT_ERROR') {
            this.logger.warn('Rate limit exceeded', logData);
        }
        else {
            this.logger.error('Server error occurred', logData);
        }
    }
    /**
     * @ai-intent Create user-friendly error response
     * @ai-flow 1. Determine message -> 2. Add details -> 3. Format response
     * @ai-pattern User-friendly error messages
     */
    static createErrorResponse(error, context) {
        let userMessage;
        let details = undefined;
        // @ai-logic: Create user-friendly messages
        if (ErrorGuards.isValidationError(error)) {
            const validationError = error;
            userMessage = 'Invalid input: ' + validationError.errors
                .map(e => `${e.field}: ${e.message}`)
                .join(', ');
            details = validationError.errors;
        }
        else if (ErrorGuards.isNotFoundError(error)) {
            const notFoundError = error;
            userMessage = `${notFoundError.entityType} not found`;
        }
        else if (ErrorGuards.isBusinessRuleError(error)) {
            const businessError = error;
            userMessage = businessError.message;
        }
        else if (error instanceof RateLimitError) {
            userMessage = 'Too many requests. Please try again later.';
            if (error.retryAfter) {
                userMessage += ` Retry after ${error.retryAfter} seconds.`;
            }
        }
        else {
            // @ai-logic: Generic error message for internal errors
            userMessage = 'An error occurred while processing your request. Please try again.';
            // @ai-logic: Add request ID for support
            if (context.requestId) {
                userMessage += ` Reference: ${context.requestId}`;
            }
        }
        // @ai-logic: Create error response
        const response = {
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
    static isZodError(error) {
        return (error !== null &&
            typeof error === 'object' &&
            'errors' in error &&
            Array.isArray(error.errors) &&
            'name' in error &&
            error.name === 'ZodError');
    }
    /**
     * @ai-intent Create error context for a handler
     * @ai-pattern Context factory
     * @ai-usage Called when registering handlers
     */
    static createContext(handler, method) {
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
    static generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * @ai-intent Global error handler for uncaught errors
     * @ai-pattern Process-level error handling
     * @ai-critical Prevents application crash
     */
    static setupGlobalErrorHandling() {
        process.on('uncaughtException', (error) => {
            this.logger.error('Uncaught exception', {
                error: error.message,
                stack: error.stack,
                name: error.name
            });
            // @ai-critical: Give time to flush logs
            setTimeout(() => process.exit(1), 1000);
        });
        process.on('unhandledRejection', (reason, _promise) => {
            this.logger.error('Unhandled rejection', {
                reason: reason instanceof Error ? reason.message : String(reason),
                stack: reason instanceof Error ? reason.stack : undefined
            });
        });
    }
}
//# sourceMappingURL=error-middleware.js.map