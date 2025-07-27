/**
 * @ai-context Rate limiting implementation for DoS protection
 * @ai-pattern Token bucket algorithm
 * @ai-critical Prevents resource exhaustion attacks
 * @ai-why Essential for API stability and fairness
 */
/**
 * @ai-intent Rate limit configuration
 * @ai-pattern Different limits for different operations
 */
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (context: any) => string;
}
/**
 * @ai-intent Rate limiter implementation
 * @ai-pattern Per-key rate limiting with configurable strategies
 * @ai-critical Central point for request throttling
 */
export declare class RateLimiter {
    private config;
    private buckets;
    private lastCleanup;
    private readonly cleanupInterval;
    /**
     * @ai-intent Default rate limit configurations
     * @ai-pattern Conservative limits to prevent abuse
     */
    static readonly PRESETS: {
        readonly strict: {
            readonly windowMs: 60000;
            readonly maxRequests: 10;
        };
        readonly normal: {
            readonly windowMs: 60000;
            readonly maxRequests: 60;
        };
        readonly lenient: {
            readonly windowMs: 60000;
            readonly maxRequests: 300;
        };
        readonly search: {
            readonly windowMs: 60000;
            readonly maxRequests: 30;
        };
        readonly write: {
            readonly windowMs: 60000;
            readonly maxRequests: 20;
        };
    };
    constructor(config: RateLimitConfig);
    /**
     * @ai-intent Check if request should be allowed
     * @ai-flow 1. Generate key -> 2. Get bucket -> 3. Try consume -> 4. Handle result
     * @ai-throws RateLimitError if limit exceeded
     */
    checkLimit(context?: any): Promise<void>;
    /**
     * @ai-intent Record request result
     * @ai-pattern Optionally don't count successful/failed requests
     */
    recordResult(context: any, success: boolean): void;
    /**
     * @ai-intent Generate default key
     * @ai-pattern IP-based or global rate limiting
     */
    private getDefaultKey;
    /**
     * @ai-intent Clean up stale buckets
     * @ai-pattern Prevent memory leak from abandoned keys
     */
    private cleanupStale;
    /**
     * @ai-intent Get current limit status
     * @ai-usage For monitoring and headers
     */
    getStatus(context: any): {
        limit: number;
        remaining: number;
        reset: Date;
    };
    /**
     * @ai-intent Reset limits for a specific key
     * @ai-usage For admin operations
     */
    reset(context: any): void;
    /**
     * @ai-intent Clear all rate limit data
     * @ai-usage For testing or emergency reset
     */
    clearAll(): void;
}
/**
 * @ai-intent Create composite rate limiter
 * @ai-pattern Multiple limits with different strategies
 * @ai-usage For complex rate limiting scenarios
 */
export declare class CompositeRateLimiter {
    private limiters;
    constructor(...configs: RateLimitConfig[]);
    /**
     * @ai-intent Check all rate limits
     * @ai-throws First rate limit error encountered
     */
    checkLimits(context: any): Promise<void>;
    /**
     * @ai-intent Record result for all limiters
     */
    recordResult(context: any, success: boolean): void;
}
/**
 * @ai-intent Rate limiting middleware factory
 * @ai-pattern Creates handler wrapper
 * @ai-usage For MCP handler protection
 */
export declare function createRateLimitMiddleware(config: RateLimitConfig): (handler: Function) => Promise<(params: any, context?: any) => Promise<any>>;
