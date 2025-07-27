/**
 * @ai-context Enhanced error logging utilities
 * @ai-pattern Structured error logging with context
 * @ai-critical Provides detailed error information for debugging
 * @ai-why Improves error diagnosis and monitoring
 * @ai-assumption Logs are structured for analysis tools
 */
import { createLogger } from './logger.js';
import { BaseError } from '../errors/custom-errors.js';
import * as os from 'os';
import * as process from 'process';
/**
 * @ai-intent Enhanced error logger
 * @ai-pattern Structured logging with sanitization
 * @ai-critical Handles sensitive data properly
 */
export class ErrorLogger {
    logger;
    config;
    constructor(component, config = {}) {
        this.logger = createLogger(component);
        this.config = {
            includeSystemInfo: true,
            includeMemoryUsage: false,
            includeEnvironment: false,
            sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization'],
            maxContextDepth: 3,
            ...config
        };
    }
    /**
     * @ai-intent Log an error with full context
     * @ai-flow 1. Extract error info -> 2. Build entry -> 3. Sanitize -> 4. Log
     * @ai-pattern Comprehensive error logging
     */
    logError(error, operation, context) {
        const entry = this.buildErrorEntry(error, operation, context);
        // @ai-logic: Log based on level
        switch (entry.level) {
            case 'error':
                this.logger.error(entry.errorMessage, entry);
                break;
            case 'warn':
                this.logger.warn(entry.errorMessage, entry);
                break;
            case 'info':
                this.logger.info(entry.errorMessage, entry);
                break;
        }
    }
    /**
     * @ai-intent Build error log entry
     * @ai-flow Extract all relevant information
     * @ai-pattern Structured data extraction
     */
    buildErrorEntry(error, operation, context) {
        const timestamp = new Date().toISOString();
        const baseEntry = {
            timestamp,
            level: this.determineLogLevel(error),
            component: this.logger.defaultMeta?.component || 'Unknown',
            operation,
            errorType: 'Unknown',
            errorMessage: 'Unknown error'
        };
        // @ai-logic: Extract error information
        if (error instanceof BaseError) {
            baseEntry.errorType = error.constructor.name;
            baseEntry.errorMessage = error.message;
            baseEntry.errorCode = error.code;
            baseEntry.errorStack = error.stack;
            baseEntry.context = { ...error.context, ...context };
        }
        else if (error instanceof Error) {
            baseEntry.errorType = error.constructor.name;
            baseEntry.errorMessage = error.message;
            baseEntry.errorStack = error.stack;
            baseEntry.context = context;
        }
        else {
            baseEntry.errorType = 'UnknownError';
            baseEntry.errorMessage = String(error);
            baseEntry.context = context;
        }
        // @ai-logic: Add system information
        if (this.config.includeSystemInfo) {
            baseEntry.hostname = os.hostname();
            baseEntry.pid = process.pid;
            baseEntry.platform = process.platform;
            baseEntry.nodeVersion = process.version;
        }
        // @ai-logic: Add memory usage
        if (this.config.includeMemoryUsage) {
            baseEntry.memoryUsage = process.memoryUsage();
        }
        // @ai-logic: Sanitize sensitive data
        return this.sanitizeEntry(baseEntry);
    }
    /**
     * @ai-intent Determine appropriate log level
     * @ai-pattern Error classification
     */
    determineLogLevel(error) {
        if (error instanceof BaseError) {
            const warnCodes = ['VALIDATION_ERROR', 'NOT_FOUND', 'RATE_LIMIT_ERROR'];
            const infoCodes = ['BUSINESS_RULE_ERROR'];
            if (infoCodes.includes(error.code)) {
                return 'info';
            }
            if (warnCodes.includes(error.code)) {
                return 'warn';
            }
        }
        return 'error';
    }
    /**
     * @ai-intent Sanitize sensitive data from log entry
     * @ai-flow Recursively clean sensitive fields
     * @ai-critical Prevents logging sensitive information
     */
    sanitizeEntry(entry) {
        const sanitized = { ...entry };
        // @ai-logic: Sanitize context
        if (sanitized.context) {
            sanitized.context = this.sanitizeObject(sanitized.context, this.config.maxContextDepth);
        }
        // @ai-logic: Sanitize stack trace
        if (sanitized.errorStack) {
            sanitized.errorStack = this.sanitizeStackTrace(sanitized.errorStack);
        }
        return sanitized;
    }
    /**
     * @ai-intent Recursively sanitize object
     * @ai-pattern Deep object sanitization
     */
    sanitizeObject(obj, maxDepth, currentDepth = 0) {
        if (currentDepth >= maxDepth) {
            return { _truncated: true };
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // @ai-logic: Check if field is sensitive
            if (this.isSensitiveField(key)) {
                sanitized[key] = '[REDACTED]';
                continue;
            }
            // @ai-logic: Handle different value types
            if (value === null || value === undefined) {
                sanitized[key] = value;
            }
            else if (typeof value === 'object' && !Array.isArray(value)) {
                sanitized[key] = this.sanitizeObject(value, maxDepth, currentDepth + 1);
            }
            else if (Array.isArray(value)) {
                sanitized[key] = value.map(item => typeof item === 'object' && item !== null
                    ? this.sanitizeObject(item, maxDepth, currentDepth + 1)
                    : item);
            }
            else if (typeof value === 'string' && this.containsSensitiveData(value)) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    /**
     * @ai-intent Check if field name is sensitive
     * @ai-pattern Case-insensitive field matching
     */
    isSensitiveField(fieldName) {
        const lowerFieldName = fieldName.toLowerCase();
        return this.config.sensitiveFields.some(sensitive => lowerFieldName.includes(sensitive.toLowerCase()));
    }
    /**
     * @ai-intent Check if string contains sensitive data
     * @ai-pattern Pattern matching for sensitive content
     */
    containsSensitiveData(value) {
        // @ai-logic: Check for common sensitive patterns
        const sensitivePatterns = [
            /^Bearer\s+/i,
            /^Basic\s+/i,
            /password[=:]/i,
            /api[_-]?key[=:]/i,
            /token[=:]/i,
            /secret[=:]/i
        ];
        return sensitivePatterns.some(pattern => pattern.test(value));
    }
    /**
     * @ai-intent Sanitize stack trace
     * @ai-pattern Remove sensitive paths
     */
    sanitizeStackTrace(stack) {
        // @ai-logic: Remove absolute paths
        return stack.replace(/\/[^:\s]+\//g, '/.../')
            .replace(/\\/g, '/'); // Normalize Windows paths
    }
    /**
     * @ai-intent Create error summary for metrics
     * @ai-pattern Error aggregation support
     */
    createErrorSummary(error) {
        return {
            type: error instanceof Error ? error.constructor.name : 'UnknownError',
            code: error instanceof BaseError ? error.code : undefined,
            component: this.logger.defaultMeta?.component || 'Unknown',
            operation: undefined
        };
    }
}
/**
 * @ai-intent Global error logger instance
 * @ai-pattern Singleton for application-wide logging
 */
export const globalErrorLogger = new ErrorLogger('Global', {
    includeSystemInfo: true,
    includeMemoryUsage: process.env.NODE_ENV !== 'production',
    includeEnvironment: process.env.NODE_ENV === 'development'
});
//# sourceMappingURL=error-logger.js.map