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

// File utilities
export { ensureDirectoryExists } from './file-utils.js';

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
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * @ai-intent Retry an operation with exponential backoff
 * @ai-pattern Resilient operation execution
 * @ai-usage For network requests or flaky operations
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

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
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];

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
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * @ai-intent Deep clone an object
 * @ai-pattern Object cloning utility
 * @ai-warning Uses JSON, loses functions/undefined
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * @ai-intent Check if value is a plain object
 * @ai-pattern Type checking utility
 * @ai-usage For validation logic
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.constructor === Object &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * @ai-intent Debounce a function
 * @ai-pattern Rate limiting utility
 * @ai-usage For search or save operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
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
export function createEnum<T extends string>(
  values: readonly T[]
): { [K in T]: K } {
  const enumObj = {} as { [K in T]: K };

  for (const value of values) {
    enumObj[value] = value;
  }

  return enumObj;
}