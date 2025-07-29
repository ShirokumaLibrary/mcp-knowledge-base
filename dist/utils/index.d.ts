/**
 * @ai-context Central export point for all utilities
 * @ai-pattern Barrel export for utility functions
 * @ai-critical All shared utilities should be exported here
 * @ai-why Simplifies imports across the application
 */
export { createLogger } from './logger.js';
export { ensureInitialized } from './decorators.js';
export { formatRelativeDate } from './date-utils.js';
/**
 * @ai-intent Common utility functions
 * @ai-pattern Shared helper functions
 */
/**
 * @ai-intent Sleep for specified milliseconds
 * @ai-pattern Async delay utility
 * @ai-usage For retry logic or rate limiting
 */
export declare const sleep: (ms: number) => Promise<void>;
/**
 * @ai-intent Retry an operation with exponential backoff
 * @ai-pattern Resilient operation execution
 * @ai-usage For network requests or flaky operations
 */
export declare function retry<T>(operation: () => Promise<T>, options?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
}): Promise<T>;
/**
 * @ai-intent Chunk array into smaller arrays
 * @ai-pattern Array partitioning utility
 * @ai-usage For batch processing
 */
export declare function chunk<T>(array: T[], size: number): T[][];
/**
 * @ai-intent Remove duplicates from array
 * @ai-pattern Array deduplication
 * @ai-usage For tag lists or IDs
 */
export declare function unique<T>(array: T[]): T[];
/**
 * @ai-intent Deep clone an object
 * @ai-pattern Object cloning utility
 * @ai-warning Uses JSON, loses functions/undefined
 */
export declare function deepClone<T>(obj: T): T;
/**
 * @ai-intent Check if value is a plain object
 * @ai-pattern Type checking utility
 * @ai-usage For validation logic
 */
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
/**
 * @ai-intent Debounce a function
 * @ai-pattern Rate limiting utility
 * @ai-usage For search or save operations
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * @ai-intent Create enum from array
 * @ai-pattern Type-safe enum creation
 * @ai-usage For dynamic enum generation
 */
export declare function createEnum<T extends string>(values: readonly T[]): {
    [K in T]: K;
};
