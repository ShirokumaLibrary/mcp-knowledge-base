/**
 * @ai-context Retry utilities for resilient operations
 * @ai-pattern Exponential backoff and circuit breaker patterns
 * @ai-critical Handles transient failures gracefully
 * @ai-why Improves reliability of external operations
 * @ai-assumption Some errors are transient and worth retrying
 */
import { createLogger } from './logger.js';
import { BaseError, ErrorFactory } from '../errors/custom-errors.js';
/**
 * @ai-intent Circuit breaker states
 * @ai-pattern Circuit breaker pattern
 */
export var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN"; // Testing if service recovered
})(CircuitState || (CircuitState = {}));
/**
 * @ai-intent Retry utility class
 * @ai-pattern Static methods for retry operations
 * @ai-critical Core retry logic implementation
 */
export class RetryUtils {
    static logger = createLogger('RetryUtils');
    /**
     * @ai-intent Retry an operation with exponential backoff
     * @ai-flow 1. Execute -> 2. Check error -> 3. Wait -> 4. Retry or throw
     * @ai-pattern Exponential backoff with jitter
     * @ai-usage For any async operation that might fail
     */
    static async withRetry(operation, options = {}) {
        const { maxAttempts = 3, initialDelay = 1000, maxDelay = 30000, backoffFactor = 2, jitter = true, retryCondition = this.defaultRetryCondition, onRetry } = options;
        let lastError;
        let delay = initialDelay;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // @ai-logic: Execute the operation
                return await operation();
            }
            catch (error) {
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
    static defaultRetryCondition(error) {
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
        }
        catch {
            // @ai-logic: Default to retry on unknown errors
            return true;
        }
    }
    /**
     * @ai-intent Add jitter to delay
     * @ai-pattern Prevent thundering herd
     * @ai-usage Randomizes retry delays
     */
    static addJitter(delay) {
        // @ai-logic: Add ±25% jitter
        const jitterRange = delay * 0.25;
        const jitter = (Math.random() - 0.5) * 2 * jitterRange;
        return Math.max(0, delay + jitter);
    }
    /**
     * @ai-intent Sleep for specified milliseconds
     * @ai-pattern Async delay
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * @ai-intent Retry with timeout
     * @ai-flow Combines retry with overall timeout
     * @ai-pattern Prevents infinite retry loops
     */
    static async withTimeout(operation, timeoutMs, retryOptions) {
        return Promise.race([
            this.withRetry(operation, retryOptions),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), timeoutMs))
        ]);
    }
}
/**
 * @ai-intent Circuit breaker implementation
 * @ai-pattern Prevents cascading failures
 * @ai-critical Protects system from repeated failures
 */
export class CircuitBreaker {
    name;
    options;
    state = CircuitState.CLOSED;
    failures = 0;
    successes = 0;
    lastFailureTime;
    logger;
    constructor(name, options = {}) {
        this.name = name;
        this.options = options;
        this.logger = createLogger(`CircuitBreaker:${name}`);
    }
    /**
     * @ai-intent Execute operation through circuit breaker
     * @ai-flow 1. Check state -> 2. Execute -> 3. Update state
     * @ai-pattern State machine pattern
     */
    async execute(operation) {
        // @ai-logic: Check if circuit is open
        if (this.state === CircuitState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.state = CircuitState.HALF_OPEN;
                this.logger.info('Circuit breaker half-open', { name: this.name });
            }
            else {
                throw new Error(`Circuit breaker is open for ${this.name}`);
            }
        }
        try {
            // @ai-logic: Execute operation
            const result = await operation();
            // @ai-logic: Record success
            this.onSuccess();
            return result;
        }
        catch (error) {
            // @ai-logic: Record failure
            this.onFailure();
            throw error;
        }
    }
    /**
     * @ai-intent Handle successful operation
     * @ai-flow Update state based on success
     */
    onSuccess() {
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
    onFailure() {
        this.failures++;
        this.lastFailureTime = new Date();
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.logger.warn('Circuit breaker opened', {
                name: this.name,
                failures: this.failures
            });
        }
        else if (this.failures >= (this.options.failureThreshold || 5) &&
            this.state === CircuitState.CLOSED) {
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
    shouldAttemptReset() {
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
    getState() {
        return this.state;
    }
    /**
     * @ai-intent Reset circuit breaker
     * @ai-pattern Manual reset
     */
    reset() {
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
    static instance;
    breakers = new Map();
    constructor() { }
    static getInstance() {
        if (!this.instance) {
            this.instance = new CircuitBreakerManager();
        }
        return this.instance;
    }
    /**
     * @ai-intent Get or create circuit breaker
     * @ai-pattern Lazy initialization
     */
    getBreaker(name, options) {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker(name, options));
        }
        return this.breakers.get(name);
    }
    /**
     * @ai-intent Reset all circuit breakers
     * @ai-pattern Global reset
     */
    resetAll() {
        this.breakers.forEach(breaker => breaker.reset());
    }
    /**
     * @ai-intent Get status of all breakers
     * @ai-pattern Health check support
     */
    getStatus() {
        const status = {};
        this.breakers.forEach((breaker, name) => {
            status[name] = breaker.getState();
        });
        return status;
    }
}
//# sourceMappingURL=retry-utils.js.map