/**
 * @ai-context Enhanced error logging utilities
 * @ai-pattern Structured error logging with context
 * @ai-critical Provides detailed error information for debugging
 * @ai-why Improves error diagnosis and monitoring
 * @ai-assumption Logs are structured for analysis tools
 */
/**
 * @ai-intent Error log entry structure
 * @ai-pattern Comprehensive error metadata
 */
export interface ErrorLogEntry {
    errorType: string;
    errorMessage: string;
    errorCode?: string;
    errorStack?: string;
    timestamp: string;
    level: 'error' | 'warn' | 'info';
    component: string;
    operation?: string;
    requestId?: string;
    userId?: string;
    sessionId?: string;
    hostname?: string;
    pid?: number;
    platform?: string;
    nodeVersion?: string;
    duration?: number;
    memoryUsage?: NodeJS.MemoryUsage;
    context?: Record<string, unknown>;
    tags?: string[];
}
/**
 * @ai-intent Error logger configuration
 * @ai-pattern Configurable logging behavior
 */
export interface ErrorLoggerConfig {
    includeSystemInfo?: boolean;
    includeMemoryUsage?: boolean;
    includeEnvironment?: boolean;
    sensitiveFields?: string[];
    maxContextDepth?: number;
}
/**
 * @ai-intent Enhanced error logger
 * @ai-pattern Structured logging with sanitization
 * @ai-critical Handles sensitive data properly
 */
export declare class ErrorLogger {
    private readonly logger;
    private readonly config;
    constructor(component: string, config?: ErrorLoggerConfig);
    /**
     * @ai-intent Log an error with full context
     * @ai-flow 1. Extract error info -> 2. Build entry -> 3. Sanitize -> 4. Log
     * @ai-pattern Comprehensive error logging
     */
    logError(error: unknown, operation?: string, context?: Record<string, unknown>): void;
    /**
     * @ai-intent Build error log entry
     * @ai-flow Extract all relevant information
     * @ai-pattern Structured data extraction
     */
    private buildErrorEntry;
    /**
     * @ai-intent Determine appropriate log level
     * @ai-pattern Error classification
     */
    private determineLogLevel;
    /**
     * @ai-intent Sanitize sensitive data from log entry
     * @ai-flow Recursively clean sensitive fields
     * @ai-critical Prevents logging sensitive information
     */
    private sanitizeEntry;
    /**
     * @ai-intent Recursively sanitize object
     * @ai-pattern Deep object sanitization
     */
    private sanitizeObject;
    /**
     * @ai-intent Check if field name is sensitive
     * @ai-pattern Case-insensitive field matching
     */
    private isSensitiveField;
    /**
     * @ai-intent Check if string contains sensitive data
     * @ai-pattern Pattern matching for sensitive content
     */
    private containsSensitiveData;
    /**
     * @ai-intent Sanitize stack trace
     * @ai-pattern Remove sensitive paths
     */
    private sanitizeStackTrace;
    /**
     * @ai-intent Create error summary for metrics
     * @ai-pattern Error aggregation support
     */
    createErrorSummary(error: unknown): {
        type: string;
        code?: string;
        component: string;
        operation?: string;
    };
}
/**
 * @ai-intent Global error logger instance
 * @ai-pattern Singleton for application-wide logging
 */
export declare const globalErrorLogger: ErrorLogger;
