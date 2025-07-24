/**
 * @ai-context Centralized logging utility using Winston
 * @ai-pattern Logger factory with environment-aware formatting
 * @ai-critical Handles all system logging and error tracking
 * @ai-dependencies Winston for structured logging, config for settings
 * @ai-assumption Production uses JSON format, dev uses colored console
 */
import winston from 'winston';
/**
 * @ai-intent Create logger instance for a specific service
 * @ai-flow 1. Configure level -> 2. Add service meta -> 3. Setup handlers
 * @ai-pattern Factory pattern for service-specific loggers
 * @ai-critical Catches uncaught exceptions and rejections
 * @ai-param service Service name for log context
 * @ai-return Configured Winston logger instance
 * @ai-why Each component gets its own logger for tracing
 */
export declare function createLogger(service: string): winston.Logger;
/**
 * @ai-intent Default logger instance for general use
 * @ai-pattern Singleton logger for non-service-specific logging
 * @ai-usage Import and use directly: logger.info('message')
 */
export declare const logger: winston.Logger;
