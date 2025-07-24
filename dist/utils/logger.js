/**
 * @ai-context Centralized logging utility using Winston
 * @ai-pattern Logger factory with environment-aware formatting
 * @ai-critical Handles all system logging and error tracking
 * @ai-dependencies Winston for structured logging, config for settings
 * @ai-assumption Production uses JSON format, dev uses colored console
 */
import winston from 'winston';
import path from 'path';
import { getConfig } from '../config.js';
// @ai-critical: Prevent EventEmitter memory leak warnings in async operations
process.setMaxListeners(50);
const { combine, timestamp, printf, colorize, errors } = winston.format;
const config = getConfig();
/**
 * @ai-intent Custom log format for human-readable output
 * @ai-flow 1. Format timestamp -> 2. Add service -> 3. Include metadata
 * @ai-pattern [timestamp] [service] level: message {metadata}
 * @ai-why Structured logs help debugging and monitoring
 * @ai-example 2024-01-15 10:30:45 [mcp-server] info: Request processed {id: 123}
 */
const customFormat = printf(({ level, message, timestamp, service, ...metadata }) => {
    let msg = `${timestamp} [${service}] ${level}: ${message}`;
    // @ai-logic: Append metadata as JSON if present
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});
/**
 * @ai-intent Development format with colors for terminal
 * @ai-pattern Colorized output for easy visual scanning
 * @ai-logic Stack traces included for debugging
 */
const devFormat = combine(colorize(), // @ai-ux: Colors by log level
timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), // @ai-debug: Full stack traces
customFormat);
/**
 * @ai-intent Production format as JSON for parsing
 * @ai-pattern Structured JSON for log aggregation systems
 * @ai-why JSON enables automated monitoring and alerting
 */
const prodFormat = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), winston.format.json() // @ai-pattern: Machine-readable format
);
/**
 * @ai-intent Determine active log level from config
 * @ai-logic If logging disabled, only show errors
 * @ai-pattern Respects config.logging.enabled flag
 */
const logLevel = config.logging.enabled ? config.logging.level : 'error';
/**
 * @ai-intent Configure log destinations (transports)
 * @ai-pattern Always log to console, conditionally to files
 * @ai-logic Format depends on NODE_ENV
 */
const transports = [
    // @ai-logic: Console always active, format varies by environment
    new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat
    })
];
/**
 * @ai-intent Add file logging in production
 * @ai-flow Check environment -> Check enabled -> Add file transports
 * @ai-pattern Separate error and combined logs
 * @ai-critical Creates log directory if missing
 * @ai-why Persistent logs for debugging production issues
 */
if (process.env.NODE_ENV === 'production' && config.logging.enabled) {
    transports.push(
    // @ai-logic: Error-only log for quick issue scanning
    new winston.transports.File({
        filename: path.join(config.logging.logDir, 'error.log'),
        level: 'error',
        format: prodFormat
    }), 
    // @ai-logic: Combined log for full audit trail
    new winston.transports.File({
        filename: path.join(config.logging.logDir, 'combined.log'),
        format: prodFormat
    }));
}
/**
 * @ai-intent Create logger instance for a specific service
 * @ai-flow 1. Configure level -> 2. Add service meta -> 3. Setup handlers
 * @ai-pattern Factory pattern for service-specific loggers
 * @ai-critical Catches uncaught exceptions and rejections
 * @ai-param service Service name for log context
 * @ai-return Configured Winston logger instance
 * @ai-why Each component gets its own logger for tracing
 */
export function createLogger(service) {
    return winston.createLogger({
        level: logLevel,
        defaultMeta: { service }, // @ai-logic: Service tagged on all logs
        transports,
        // @ai-critical: Prevent process crash from uncaught errors
        exceptionHandlers: [
            new winston.transports.Console({
                format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), printf(info => `${info.timestamp} [UNCAUGHT EXCEPTION] ${info.message}`))
            })
        ],
        // @ai-critical: Handle promise rejections
        rejectionHandlers: [
            new winston.transports.Console({
                format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), printf(info => `${info.timestamp} [UNHANDLED REJECTION] ${info.message}`))
            })
        ]
    });
}
/**
 * @ai-intent Default logger instance for general use
 * @ai-pattern Singleton logger for non-service-specific logging
 * @ai-usage Import and use directly: logger.info('message')
 */
export const logger = createLogger('mcp-knowledge-base');
//# sourceMappingURL=logger.js.map