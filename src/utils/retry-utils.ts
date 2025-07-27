/**
 * @ai-context Retry utilities for resilient operations
 * @ai-pattern Exponential backoff and circuit breaker patterns
 * @ai-critical Handles transient failures gracefully
 * @ai-why Improves reliability of external operations
 * @ai-assumption Some errors are transient and worth retrying
 */

import type { Logger } from 'winston';
import { createLogger } from './logger.js';
import { BaseError, ErrorFactory } from '../errors/custom-errors.js';

/**
 * @ai-intent Retry configuration options
 * @ai-pattern Configurable retry behavior
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * @ai-intent Circuit breaker states
 * @ai-pattern Circuit breaker pattern
 */
export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Failing, reject all calls
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * @ai-intent Circuit breaker configuration
 * @ai-pattern Configurable circuit breaker
 */
export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  resetTimeout?: number;
}

/**
 * @ai-intent Retry utility class
 * @ai-pattern Static methods for retry operations
 * @ai-critical Core retry logic implementation
 */
export class RetryUtils {
  private static logger: Logger = createLogger('RetryUtils');

  /**
   * @ai-intent Retry an operation with exponential backoff
   * @ai-flow 1. Execute -> 2. Check error -> 3. Wait -> 4. Retry or throw
   * @ai-pattern Exponential backoff with jitter
   * @ai-usage For any async operation that might fail
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      jitter = true,
      retryCondition = this.defaultRetryCondition,
      onRetry
    } = options;

    let lastError: unknown;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // @ai-logic: Execute the operation
        return await operation();

      } catch (error) {
        lastError = error;

        // @ai-logic: Check if we should retry
        if (attempt === maxAttempts || !retryCondition(error)) {
          throw error;
        }

        // @ai-logic: Log retry attempt
        this.logger.debug('Retrying operation', {
          attempt,
          maxAttempts,
          delay,
          error: error instanceof Error ? error.message : String(error)
        });

        // @ai-logic: Call retry callback if provided
        if (onRetry) {
          onRetry(error, attempt);
        }

        // @ai-logic: Wait before retry
        await this.sleep(jitter ? this.addJitter(delay) : delay);

        // @ai-logic: Calculate next delay
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    // @ai-logic: This should never be reached
    throw lastError;
  }

  /**
   * @ai-intent Default retry condition
   * @ai-pattern Retry on specific error types
   * @ai-usage Default behavior for retryable errors
   */
  private static defaultRetryCondition(error: unknown): boolean {
    // @ai-logic: Don't retry on validation errors
    if (error instanceof Error) {
      const nonRetryableMessages = [
        'validation',
        'invalid',
        'unauthorized',
        'forbidden',
        'not found'
      ];

      const message = error.message.toLowerCase();
      if (nonRetryableMessages.some(msg => message.includes(msg))) {
        return false;
      }
    }

    // @ai-logic: Check if error is retryable
    try {
      const baseError = error instanceof BaseError
        ? error
        : ErrorFactory.fromUnknown(error);

      return ErrorFactory.isRetryable(baseError);
    } catch {
      // @ai-logic: Default to retry on unknown errors
      return true;
    }
  }

  /**
   * @ai-intent Add jitter to delay
   * @ai-pattern Prevent thundering herd
   * @ai-usage Randomizes retry delays
   */
  private static addJitter(delay: number): number {
    // @ai-logic: Add ±25% jitter
    const jitterRange = delay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, delay + jitter);
  }

  /**
   * @ai-intent Sleep for specified milliseconds
   * @ai-pattern Async delay
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @ai-intent Retry with timeout
   * @ai-flow Combines retry with overall timeout
   * @ai-pattern Prevents infinite retry loops
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    retryOptions?: RetryOptions
  ): Promise<T> {
    return Promise.race([
      this.withRetry(operation, retryOptions),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      )
    ]);
  }
}

/**
 * @ai-intent Circuit breaker implementation
 * @ai-pattern Prevents cascading failures
 * @ai-critical Protects system from repeated failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: Date;
  private readonly logger: Logger;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions = {}
  ) {
    this.logger = createLogger(`CircuitBreaker:${name}`);
  }

  /**
   * @ai-intent Execute operation through circuit breaker
   * @ai-flow 1. Check state -> 2. Execute -> 3. Update state
   * @ai-pattern State machine pattern
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // @ai-logic: Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.logger.info('Circuit breaker half-open', { name: this.name });
      } else {
        throw new Error(`Circuit breaker is open for ${this.name}`);
      }
    }

    try {
      // @ai-logic: Execute operation
      const result = await operation();

      // @ai-logic: Record success
      this.onSuccess();

      return result;

    } catch (error) {
      // @ai-logic: Record failure
      this.onFailure();

      throw error;
    }
  }

  /**
   * @ai-intent Handle successful operation
   * @ai-flow Update state based on success
   */
  private onSuccess(): void {
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;

      if (this.successes >= (this.options.successThreshold || 1)) {
        this.state = CircuitState.CLOSED;
        this.successes = 0;
        this.logger.info('Circuit breaker closed', { name: this.name });
      }
    }
  }

  /**
   * @ai-intent Handle failed operation
   * @ai-flow Update state based on failure
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.logger.warn('Circuit breaker opened', {
        name: this.name,
        failures: this.failures
      });
    } else if (
      this.failures >= (this.options.failureThreshold || 5) &&
      this.state === CircuitState.CLOSED
    ) {
      this.state = CircuitState.OPEN;
      this.logger.warn('Circuit breaker opened', {
        name: this.name,
        failures: this.failures
      });
    }
  }

  /**
   * @ai-intent Check if should attempt reset
   * @ai-pattern Time-based reset logic
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return true;
    }

    const resetTimeout = this.options.resetTimeout || 60000; // 1 minute default
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();

    return timeSinceLastFailure >= resetTimeout;
  }

  /**
   * @ai-intent Get current circuit state
   * @ai-pattern State inspection
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * @ai-intent Reset circuit breaker
   * @ai-pattern Manual reset
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.logger.info('Circuit breaker reset', { name: this.name });
  }
}

/**
 * @ai-intent Circuit breaker manager
 * @ai-pattern Singleton for managing circuit breakers
 */
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerManager {
    if (!this.instance) {
      this.instance = new CircuitBreakerManager();
    }
    return this.instance;
  }

  /**
   * @ai-intent Get or create circuit breaker
   * @ai-pattern Lazy initialization
   */
  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }

    return this.breakers.get(name)!;
  }

  /**
   * @ai-intent Reset all circuit breakers
   * @ai-pattern Global reset
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * @ai-intent Get status of all breakers
   * @ai-pattern Health check support
   */
  getStatus(): Record<string, CircuitState> {
    const status: Record<string, CircuitState> = {};

    this.breakers.forEach((breaker, name) => {
      status[name] = breaker.getState();
    });

    return status;
  }
}