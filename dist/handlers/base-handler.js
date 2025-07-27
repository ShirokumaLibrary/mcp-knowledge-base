/**
 * @ai-context Base handler class for all MCP tool handlers
 * @ai-pattern Template method pattern with common error handling
 * @ai-critical Provides consistent error handling and logging
 * @ai-why Eliminates duplicate error handling code across handlers
 * @ai-assumption All handlers follow request-response pattern
 */
import { createLogger } from '../utils/logger.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
/**
 * @ai-intent Abstract base handler with common functionality
 * @ai-pattern Template method for consistent error handling
 * @ai-critical All handlers should extend this class
 */
export class BaseHandler {
    handlerName;
    database;
    logger;
    constructor(handlerName, database // @ai-todo: Replace with IDatabase interface
    ) {
        this.handlerName = handlerName;
        this.database = database;
        this.logger = createLogger(handlerName);
    }
    /**
     * @ai-intent Create standard text response
     * @ai-pattern Consistent response format
     * @ai-usage Return from handler methods
     */
    createResponse(text) {
        return {
            content: [{
                    type: 'text',
                    text
                }]
        };
    }
    /**
     * @ai-intent Create error response
     * @ai-pattern User-friendly error messages
     * @ai-usage Return on handled errors
     */
    createErrorResponse(message) {
        return this.createResponse(`Error: ${message}`);
    }
    /**
     * @ai-intent Wrap handler method with error handling
     * @ai-pattern Decorator pattern for consistent error handling
     * @ai-flow 1. Validate args -> 2. Execute handler -> 3. Handle errors
     * @ai-critical Catches all errors and logs them
     */
    wrapHandler(methodName, schema, handler) {
        return async (args) => {
            try {
                // @ai-logic: Validate arguments
                const validatedArgs = schema.parse(args);
                // @ai-logic: Execute handler
                return await handler(validatedArgs);
            }
            catch (error) {
                // @ai-logic: Log error with context
                this.logger.error(`Failed to ${methodName}`, {
                    error,
                    args,
                    handler: this.handlerName
                });
                // @ai-logic: Return appropriate error
                if (error instanceof McpError) {
                    throw error;
                }
                if (error instanceof z.ZodError) {
                    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
                }
                throw new McpError(ErrorCode.InternalError, `Failed to ${methodName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
    }
    /**
     * @ai-intent Format date for display
     * @ai-pattern Consistent date formatting
     * @ai-usage For user-facing date strings
     */
    formatDate(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString().split('T')[0];
    }
    /**
     * @ai-intent Format datetime for display
     * @ai-pattern Human-readable datetime
     * @ai-usage For timestamps in responses
     */
    formatDateTime(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleString();
    }
    /**
     * @ai-intent Parse optional array parameter
     * @ai-pattern Handle undefined/null arrays
     * @ai-usage For optional array arguments
     */
    parseOptionalArray(value) {
        if (value === undefined || value === null) {
            return undefined;
        }
        if (Array.isArray(value)) {
            return value.filter(item => typeof item === 'string');
        }
        return undefined;
    }
    /**
     * @ai-intent Format list for display
     * @ai-pattern Consistent list formatting
     * @ai-usage For array fields in responses
     */
    formatList(items, emptyText = 'None') {
        if (!items || items.length === 0) {
            return emptyText;
        }
        return items.map(item => `- ${item}`).join('\n');
    }
    /**
     * @ai-intent Format JSON for display
     * @ai-pattern Pretty-printed JSON
     * @ai-usage For complex objects in responses
     */
    formatJson(obj) {
        return JSON.stringify(obj, null, 2);
    }
    /**
     * @ai-intent Ensure database is initialized
     * @ai-pattern Guard clause for database operations
     * @ai-critical Prevents operations on uninitialized database
     */
    ensureDatabase() {
        if (!this.database) {
            throw new McpError(ErrorCode.InternalError, 'Database not initialized');
        }
    }
    /**
     * @ai-intent Format error for user display
     * @ai-pattern User-friendly error messages
     * @ai-usage Convert technical errors to readable format
     */
    formatError(error) {
        if (error instanceof McpError) {
            return error.message;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return 'An unknown error occurred';
    }
    /**
     * @ai-intent Check if value is empty
     * @ai-pattern Null/undefined/empty string check
     * @ai-usage For validation logic
     */
    isEmpty(value) {
        return value === null ||
            value === undefined ||
            value === '' ||
            (Array.isArray(value) && value.length === 0);
    }
    /**
     * @ai-intent Truncate text for display
     * @ai-pattern Limit text length with ellipsis
     * @ai-usage For long content in summaries
     */
    truncate(text, maxLength = 100) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }
}
//# sourceMappingURL=base-handler.js.map