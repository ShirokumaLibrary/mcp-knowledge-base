/**
 * @ai-context Retry utilities for resilient operations
 * @ai-pattern Exponential backoff and circuit breaker patterns
 * @ai-critical Handles transient failures gracefully
 * @ai-why Improves reliability of external operations
 * @ai-assumption Some errors are transient and worth retrying
 */
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
export declare enum CircuitState {
    CLOSED = "CLOSED",// Normal operation
    OPEN = "OPEN",// Failing, reject all calls
    HALF_OPEN = "HALF_OPEN"
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
export declare class RetryUtils {
    private static logger;
    /**
     * @ai-intent Retry an operation with exponential backoff
     * @ai-flow 1. Execute -> 2. Check error -> 3. Wait -> 4. Retry or throw
     * @ai-pattern Exponential backoff with jitter
     * @ai-usage For any async operation that might fail
     */
    static withRetry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
    /**
     * @ai-intent Default retry condition
     * @ai-pattern Retry on specific error types
     * @ai-usage Default behavior for retryable errors
     */
    private static defaultRetryCondition;
    /**
     * @ai-intent Add jitter to delay
     * @ai-pattern Prevent thundering herd
     * @ai-usage Randomizes retry delays
     */
    private static addJitter;
    /**
     * @ai-intent Sleep for specified milliseconds
     * @ai-pattern Async delay
     */
    private static sleep;
    /**
     * @ai-intent Retry with timeout
     * @ai-flow Combines retry with overall timeout
     * @ai-pattern Prevents infinite retry loops
     */
    static withTimeout<T>(operation: () => Promise<T>, timeoutMs: number, retryOptions?: RetryOptions): Promise<T>;
}
/**
 * @ai-intent Circuit breaker implementation
 * @ai-pattern Prevents cascading failures
 * @ai-critical Protects system from repeated failures
 */
export declare class CircuitBreaker {
    private readonly name;
    private readonly options;
    private state;
    private failures;
    private successes;
    private lastFailureTime?;
    private readonly logger;
    constructor(name: string, options?: CircuitBreakerOptions);
    /**
     * @ai-intent Execute operation through circuit breaker
     * @ai-flow 1. Check state -> 2. Execute -> 3. Update state
     * @ai-pattern State machine pattern
     */
    execute<T>(operation: () => Promise<T>): Promise<T>;
    /**
     * @ai-intent Handle successful operation
     * @ai-flow Update state based on success
     */
    private onSuccess;
    /**
     * @ai-intent Handle failed operation
     * @ai-flow Update state based on failure
     */
    private onFailure;
    /**
     * @ai-intent Check if should attempt reset
     * @ai-pattern Time-based reset logic
     */
    private shouldAttemptReset;
    /**
     * @ai-intent Get current circuit state
     * @ai-pattern State inspection
     */
    getState(): CircuitState;
    /**
     * @ai-intent Reset circuit breaker
     * @ai-pattern Manual reset
     */
    reset(): void;
}
/**
 * @ai-intent Circuit breaker manager
 * @ai-pattern Singleton for managing circuit breakers
 */
export declare class CircuitBreakerManager {
    private static instance;
    private breakers;
    private constructor();
    static getInstance(): CircuitBreakerManager;
    /**
     * @ai-intent Get or create circuit breaker
     * @ai-pattern Lazy initialization
     */
    getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker;
    /**
     * @ai-intent Reset all circuit breakers
     * @ai-pattern Global reset
     */
    resetAll(): void;
    /**
     * @ai-intent Get status of all breakers
     * @ai-pattern Health check support
     */
    getStatus(): Record<string, CircuitState>;
}
