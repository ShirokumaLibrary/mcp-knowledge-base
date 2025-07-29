/**
 * @ai-context TypeScript decorators for cross-cutting concerns
 * @ai-pattern Method decorators to reduce code duplication
 * @ai-critical Used to enforce initialization and other preconditions
 * @ai-dependencies None - pure TypeScript decorators
 * @ai-assumption TypeScript decorators are enabled in tsconfig.json
 */
/**
 * @ai-intent Ensures async initialization is complete before method execution
 * @ai-pattern Decorator that wraps async methods with initialization check
 * @ai-critical Prevents race conditions in database operations
 * @ai-usage @ensureInitialized on any method requiring initialized state
 * @ai-why Eliminates repetitive initialization checks in every method
 * @ai-example
 * ```typescript
 * class Database {
 *   private initializationPromise?: Promise<void>;
 *
 *   @ensureInitialized
 *   async query() {
 *     // Method body executes after initialization
 *   }
 * }
 * ```
 */
export declare function ensureInitialized(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
/**
 * @ai-intent Logs method execution time for performance monitoring
 * @ai-pattern Decorator that measures async method duration
 * @ai-usage @logExecutionTime on methods to monitor
 * @ai-why Helps identify performance bottlenecks
 */
export declare function logExecutionTime(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
/**
 * @ai-intent Retries failed operations with exponential backoff
 * @ai-pattern Decorator for handling transient failures
 * @ai-usage @retry(3, 1000) for 3 retries with 1s initial delay
 * @ai-why Improves reliability for network/filesystem operations
 */
export declare function retry(maxAttempts?: number, initialDelay?: number): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
