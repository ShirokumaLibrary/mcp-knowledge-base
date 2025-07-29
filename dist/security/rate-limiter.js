/**
 * @ai-context Rate limiting implementation for DoS protection
 * @ai-pattern Token bucket algorithm
 * @ai-critical Prevents resource exhaustion attacks
 * @ai-why Essential for API stability and fairness
 */
import { createLogger } from '../utils/logger.js';
import { RateLimitError } from '../errors/custom-errors.js';
const logger = createLogger('RateLimiter');
/**
 * @ai-intent Token bucket for rate limiting
 * @ai-pattern Allows burst traffic while maintaining average rate
 */
class TokenBucket {
    capacity;
    refillRate;
    tokens;
    lastRefill;
    constructor(capacity, refillRate // tokens per millisecond
    ) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }
    /**
     * @ai-intent Try to consume tokens
     * @ai-return true if tokens available, false otherwise
     */
    tryConsume(count = 1) {
        this.refill();
        if (this.tokens >= count) {
            this.tokens -= count;
            return true;
        }
        return false;
    }
    /**
     * @ai-intent Refill tokens based on elapsed time
     * @ai-side-effects Updates token count
     */
    refill() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = elapsed * this.refillRate;
        this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
    /**
     * @ai-intent Get time until next token available
     * @ai-return Milliseconds until token available
     */
    getRetryAfter() {
        this.refill();
        if (this.tokens >= 1) {
            return 0;
        }
        // Calculate time needed for one token
        const tokensNeeded = 1 - this.tokens;
        return Math.ceil(tokensNeeded / this.refillRate);
    }
}
/**
 * @ai-intent Rate limiter implementation
 * @ai-pattern Per-key rate limiting with configurable strategies
 * @ai-critical Central point for request throttling
 */
export class RateLimiter {
    config;
    buckets = new Map();
    lastCleanup = Date.now();
    cleanupInterval = 60000; // 1 minute
    /**
     * @ai-intent Default rate limit configurations
     * @ai-pattern Conservative limits to prevent abuse
     */
    static PRESETS = {
        strict: {
            windowMs: 60000, // 1 minute
            maxRequests: 10 // 10 requests per minute
        },
        normal: {
            windowMs: 60000, // 1 minute
            maxRequests: 60 // 1 request per second average
        },
        lenient: {
            windowMs: 60000, // 1 minute
            maxRequests: 300 // 5 requests per second average
        },
        search: {
            windowMs: 60000, // 1 minute
            maxRequests: 30 // 30 searches per minute
        },
        write: {
            windowMs: 60000, // 1 minute
            maxRequests: 20 // 20 writes per minute
        }
    };
    constructor(config) {
        this.config = config;
    }
    /**
     * @ai-intent Check if request should be allowed
     * @ai-flow 1. Generate key -> 2. Get bucket -> 3. Try consume -> 4. Handle result
     * @ai-throws RateLimitError if limit exceeded
     */
    async checkLimit(context = {}) {
        // Periodic cleanup
        this.cleanupStale();
        // Generate key for this request
        const key = this.config.keyGenerator
            ? this.config.keyGenerator(context)
            : this.getDefaultKey(context);
        // Get or create bucket
        let bucket = this.buckets.get(key);
        if (!bucket) {
            const refillRate = this.config.maxRequests / this.config.windowMs;
            bucket = new TokenBucket(this.config.maxRequests, refillRate);
            this.buckets.set(key, bucket);
        }
        // Try to consume token
        if (!bucket.tryConsume()) {
            const retryAfter = bucket.getRetryAfter();
            logger.warn('Rate limit exceeded', {
                key,
                retryAfter,
                config: this.config
            });
            throw new RateLimitError(`Rate limit exceeded. Please retry after ${Math.ceil(retryAfter / 1000)} seconds`, retryAfter);
        }
    }
    /**
     * @ai-intent Record request result
     * @ai-pattern Optionally don't count successful/failed requests
     */
    recordResult(context, success) {
        if (success && this.config.skipSuccessfulRequests) {
            // Refund the token
            const key = this.config.keyGenerator
                ? this.config.keyGenerator(context)
                : this.getDefaultKey(context);
            const bucket = this.buckets.get(key);
            if (bucket) {
                // Simple refund by trying to consume -1 (hack)
                // In production, implement proper refund method
            }
        }
    }
    /**
     * @ai-intent Generate default key
     * @ai-pattern IP-based or global rate limiting
     */
    getDefaultKey(context) {
        // Try to extract identifier from context
        if (context.ip) {
            return `ip:${context.ip}`;
        }
        if (context.userId) {
            return `user:${context.userId}`;
        }
        if (context.sessionId) {
            return `session:${context.sessionId}`;
        }
        // Global rate limit
        return 'global';
    }
    /**
     * @ai-intent Clean up stale buckets
     * @ai-pattern Prevent memory leak from abandoned keys
     */
    cleanupStale() {
        const now = Date.now();
        if (now - this.lastCleanup < this.cleanupInterval) {
            return;
        }
        // Remove buckets that haven't been used recently
        // const staleThreshold = now - this.config.windowMs * 2;
        for (const [key] of this.buckets.entries()) {
            // Check if bucket is stale (would need to track last access)
            // For now, just limit total size
            if (this.buckets.size > 10000) {
                this.buckets.delete(key);
            }
        }
        this.lastCleanup = now;
    }
    /**
     * @ai-intent Get current limit status
     * @ai-usage For monitoring and headers
     */
    getStatus(context) {
        const key = this.config.keyGenerator
            ? this.config.keyGenerator(context)
            : this.getDefaultKey(context);
        const bucket = this.buckets.get(key);
        if (!bucket) {
            return {
                limit: this.config.maxRequests,
                remaining: this.config.maxRequests,
                reset: new Date(Date.now() + this.config.windowMs)
            };
        }
        return {
            limit: this.config.maxRequests,
            remaining: Math.floor(bucket['tokens']), // Access private field
            reset: new Date(Date.now() + this.config.windowMs)
        };
    }
    /**
     * @ai-intent Reset limits for a specific key
     * @ai-usage For admin operations
     */
    reset(context) {
        const key = this.config.keyGenerator
            ? this.config.keyGenerator(context)
            : this.getDefaultKey(context);
        this.buckets.delete(key);
    }
    /**
     * @ai-intent Clear all rate limit data
     * @ai-usage For testing or emergency reset
     */
    clearAll() {
        this.buckets.clear();
    }
}
/**
 * @ai-intent Create composite rate limiter
 * @ai-pattern Multiple limits with different strategies
 * @ai-usage For complex rate limiting scenarios
 */
export class CompositeRateLimiter {
    limiters;
    constructor(...configs) {
        this.limiters = configs.map(config => new RateLimiter(config));
    }
    /**
     * @ai-intent Check all rate limits
     * @ai-throws First rate limit error encountered
     */
    async checkLimits(context) {
        for (const limiter of this.limiters) {
            await limiter.checkLimit(context);
        }
    }
    /**
     * @ai-intent Record result for all limiters
     */
    recordResult(context, success) {
        for (const limiter of this.limiters) {
            limiter.recordResult(context, success);
        }
    }
}
/**
 * @ai-intent Rate limiting middleware factory
 * @ai-pattern Creates handler wrapper
 * @ai-usage For MCP handler protection
 */
export function createRateLimitMiddleware(config) {
    const limiter = new RateLimiter(config);
    return async (handler) => {
        return async (params, context) => {
            // Check rate limit
            await limiter.checkLimit(context);
            try {
                // Execute handler
                const result = await handler(params, context);
                // Record success
                limiter.recordResult(context, true);
                return result;
            }
            catch (error) {
                // Record failure
                limiter.recordResult(context, false);
                throw error;
            }
        };
    };
}
//# sourceMappingURL=rate-limiter.js.map