/**
 * @ai-context TypeScript decorators for cross-cutting concerns
 * @ai-pattern Method decorators to reduce code duplication
 * @ai-critical Used to enforce initialization and other preconditions
 * @ai-dependencies None - pure TypeScript decorators
 * @ai-assumption TypeScript decorators are enabled in tsconfig.json
 */

// Interface for objects with initializationPromise
interface InitializableObject {
  initializationPromise?: Promise<void>;
}

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
export function ensureInitialized(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (this: InitializableObject, ...args: unknown[]) {
    // @ai-logic: Check for initializationPromise property
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    // @ai-logic: Call original method with preserved context
    return originalMethod.apply(this, args);
  };

  return descriptor;
}

/**
 * @ai-intent Logs method execution time for performance monitoring
 * @ai-pattern Decorator that measures async method duration
 * @ai-usage @logExecutionTime on methods to monitor
 * @ai-why Helps identify performance bottlenecks
 */
export function logExecutionTime(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (this: unknown, ...args: unknown[]) {
    const start = performance.now();
    const className = (target as {constructor: {name: string}}).constructor.name;

    try {
      const result = await originalMethod.apply(this, args);
      const duration = performance.now() - start;

      // @ai-logic: Log only if logger exists on instance
      if ((this as {logger?: {debug: (...args: unknown[]) => void}}).logger) {
        (this as {logger: {debug: (...args: unknown[]) => void}}).logger.debug(`${className}.${propertyKey} completed`, { duration });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      if ((this as {logger?: {error: (...args: unknown[]) => void}}).logger) {
        (this as {logger: {error: (...args: unknown[]) => void}}).logger.error(`${className}.${propertyKey} failed`, { duration, error });
      }

      throw error;
    }
  };

  return descriptor;
}

/**
 * @ai-intent Retries failed operations with exponential backoff
 * @ai-pattern Decorator for handling transient failures
 * @ai-usage @retry(3, 1000) for 3 retries with 1s initial delay
 * @ai-why Improves reliability for network/filesystem operations
 */
export function retry(maxAttempts: number = 3, initialDelay: number = 1000) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          if (attempt < maxAttempts) {
            const delay = initialDelay * Math.pow(2, attempt - 1);

            if ((this as {logger?: {warn: (...args: unknown[]) => void}}).logger) {
              (this as {logger: {warn: (...args: unknown[]) => void}}).logger.warn(`${propertyKey} failed, retrying`, {
                attempt,
                maxAttempts,
                delay,
                error
              });
            }

            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}