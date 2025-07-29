/**
 * @ai-context Central export point for all utilities
 * @ai-pattern Barrel export for utility functions
 * @ai-critical All shared utilities should be exported here
 * @ai-why Simplifies imports across the application
 */
// Logger utilities
export { createLogger } from './logger.js';
// Decorator utilities
export { ensureInitialized } from './decorators.js';
// Date utilities
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
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
 * @ai-intent Retry an operation with exponential backoff
 * @ai-pattern Resilient operation execution
 * @ai-usage For network requests or flaky operations
 */
export async function retry(operation, options = {}) {
    const { maxAttempts = 3, initialDelay = 1000, maxDelay = 30000, backoffFactor = 2 } = options;
    let lastError;
    let delay = initialDelay;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts) {
                throw lastError;
            }
            await sleep(delay);
            delay = Math.min(delay * backoffFactor, maxDelay);
        }
    }
    throw lastError;
}
/**
 * @ai-intent Chunk array into smaller arrays
 * @ai-pattern Array partitioning utility
 * @ai-usage For batch processing
 */
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
/**
 * @ai-intent Remove duplicates from array
 * @ai-pattern Array deduplication
 * @ai-usage For tag lists or IDs
 */
export function unique(array) {
    return Array.from(new Set(array));
}
/**
 * @ai-intent Deep clone an object
 * @ai-pattern Object cloning utility
 * @ai-warning Uses JSON, loses functions/undefined
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * @ai-intent Check if value is a plain object
 * @ai-pattern Type checking utility
 * @ai-usage For validation logic
 */
export function isPlainObject(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value.constructor === Object &&
        Object.prototype.toString.call(value) === '[object Object]');
}
/**
 * @ai-intent Debounce a function
 * @ai-pattern Rate limiting utility
 * @ai-usage For search or save operations
 */
export function debounce(func, wait) {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
}
/**
 * @ai-intent Create enum from array
 * @ai-pattern Type-safe enum creation
 * @ai-usage For dynamic enum generation
 */
export function createEnum(values) {
    const enumObj = {};
    for (const value of values) {
        enumObj[value] = value;
    }
    return enumObj;
}
//# sourceMappingURL=index.js.map