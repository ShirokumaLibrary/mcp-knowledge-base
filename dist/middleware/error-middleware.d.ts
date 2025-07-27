/**
 * @ai-context Error handling middleware for MCP handlers
 * @ai-pattern Centralized error processing
 * @ai-critical Converts all errors to appropriate responses
 * @ai-why Consistent error handling across all handlers
 * @ai-assumption All handlers wrapped with this middleware
 */
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
 * @ai-intent Error handling middleware class
 * @ai-pattern Middleware pattern for error processing
 * @ai-critical Handles all error types consistently
 */
export declare class ErrorMiddleware {
    private static logger;
    /**
     * @ai-intent Wrap handler with error handling
     * @ai-flow 1. Execute handler -> 2. Catch errors -> 3. Process -> 4. Return response
     * @ai-pattern Higher-order function wrapper
     * @ai-usage Applied to all handler methods
     */
    static wrap<T extends (...args: any[]) => Promise<ToolResponse>>(handler: T, context: ErrorContext): T;
    /**
     * @ai-intent Process raw error into BaseError
     * @ai-flow 1. Check error type -> 2. Convert if needed -> 3. Enhance with context
     * @ai-pattern Error normalization
     */
    private static processError;
    /**
     * @ai-intent Log error with appropriate level
     * @ai-flow Determine log level based on error type
     * @ai-pattern Structured logging with context
     */
    private static logError;
    /**
     * @ai-intent Create user-friendly error response
     * @ai-flow 1. Determine message -> 2. Add details -> 3. Format response
     * @ai-pattern User-friendly error messages
     */
    private static createErrorResponse;
    /**
     * @ai-intent Check if error is from Zod
     * @ai-pattern Type guard for Zod errors
     */
    private static isZodError;
    /**
     * @ai-intent Create error context for a handler
     * @ai-pattern Context factory
     * @ai-usage Called when registering handlers
     */
    static createContext(handler: string, method: string): ErrorContext;
    /**
     * @ai-intent Generate unique request ID
     * @ai-pattern Request tracking
     */
    private static generateRequestId;
    /**
     * @ai-intent Global error handler for uncaught errors
     * @ai-pattern Process-level error handling
     * @ai-critical Prevents application crash
     */
    static setupGlobalErrorHandling(): void;
}
export {};
