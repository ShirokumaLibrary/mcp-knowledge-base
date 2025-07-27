/**
 * @ai-context Base handler class for all MCP tool handlers
 * @ai-pattern Template method pattern with common error handling
 * @ai-critical Provides consistent error handling and logging
 * @ai-why Eliminates duplicate error handling code across handlers
 * @ai-assumption All handlers follow request-response pattern
 */
import type { Logger } from 'winston';
import { z } from 'zod';
/**
 * @ai-intent Standard tool response structure
 * @ai-pattern MCP protocol response format
 */
export interface ToolResponse {
    content: Array<{
        type: 'text';
        text: string;
    }>;
}
/**
 * @ai-intent Handler method signature
 * @ai-pattern Type-safe handler with validation
 */
export type HandlerMethod<T = unknown, R = any> = (args: T) => Promise<R>;
/**
 * @ai-intent Abstract base handler with common functionality
 * @ai-pattern Template method for consistent error handling
 * @ai-critical All handlers should extend this class
 */
export declare abstract class BaseHandler {
    protected handlerName: string;
    protected database?: any | undefined;
    protected logger: Logger;
    constructor(handlerName: string, database?: any | undefined);
    /**
     * @ai-intent Create standard text response
     * @ai-pattern Consistent response format
     * @ai-usage Return from handler methods
     */
    createResponse(text: string): ToolResponse;
    /**
     * @ai-intent Create error response
     * @ai-pattern User-friendly error messages
     * @ai-usage Return on handled errors
     */
    createErrorResponse(message: string): ToolResponse;
    /**
     * @ai-intent Wrap handler method with error handling
     * @ai-pattern Decorator pattern for consistent error handling
     * @ai-flow 1. Validate args -> 2. Execute handler -> 3. Handle errors
     * @ai-critical Catches all errors and logs them
     */
    wrapHandler<T = unknown>(methodName: string, schema: z.ZodSchema<T>, handler: HandlerMethod<T, ToolResponse>): HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Format date for display
     * @ai-pattern Consistent date formatting
     * @ai-usage For user-facing date strings
     */
    formatDate(date: string | Date): string;
    /**
     * @ai-intent Format datetime for display
     * @ai-pattern Human-readable datetime
     * @ai-usage For timestamps in responses
     */
    formatDateTime(date: string | Date): string;
    /**
     * @ai-intent Parse optional array parameter
     * @ai-pattern Handle undefined/null arrays
     * @ai-usage For optional array arguments
     */
    parseOptionalArray(value: unknown): string[] | undefined;
    /**
     * @ai-intent Format list for display
     * @ai-pattern Consistent list formatting
     * @ai-usage For array fields in responses
     */
    formatList(items: string[] | undefined, emptyText?: string): string;
    /**
     * @ai-intent Format JSON for display
     * @ai-pattern Pretty-printed JSON
     * @ai-usage For complex objects in responses
     */
    formatJson(obj: any): string;
    /**
     * @ai-intent Ensure database is initialized
     * @ai-pattern Guard clause for database operations
     * @ai-critical Prevents operations on uninitialized database
     */
    ensureDatabase(): void;
    /**
     * @ai-intent Format error for user display
     * @ai-pattern User-friendly error messages
     * @ai-usage Convert technical errors to readable format
     */
    formatError(error: unknown): string;
    /**
     * @ai-intent Check if value is empty
     * @ai-pattern Null/undefined/empty string check
     * @ai-usage For validation logic
     */
    isEmpty(value: unknown): boolean;
    /**
     * @ai-intent Truncate text for display
     * @ai-pattern Limit text length with ellipsis
     * @ai-usage For long content in summaries
     */
    truncate(text: string, maxLength?: number): string;
    /**
     * @ai-intent Optional method for handler initialization
     * @ai-pattern Hook for subclass setup
     * @ai-lifecycle Called after construction
     */
    initialize?(): Promise<void>;
}
