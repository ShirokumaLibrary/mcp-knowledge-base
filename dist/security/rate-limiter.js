import { createLogger } from '../utils/logger.js';
import { RateLimitError } from '../errors/custom-errors.js';
const logger = createLogger('RateLimiter');
class TokenBucket {
    capacity;
    refillRate;
    tokens;
    lastRefill;
    constructor(capacity, refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }
    tryConsume(count = 1) {
        this.refill();
        if (this.tokens >= count) {
            this.tokens -= count;
            return true;
        }
        return false;
    }
    refill() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = elapsed * this.refillRate;
        this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
    getRetryAfter() {
        this.refill();
        if (this.tokens >= 1) {
            return 0;
        }
        const tokensNeeded = 1 - this.tokens;
        return Math.ceil(tokensNeeded / this.refillRate);
    }
}
export class RateLimiter {
    config;
    buckets = new Map();
    lastCleanup = Date.now();
    cleanupInterval = 60000;
    static PRESETS = {
        strict: {
            windowMs: 60000,
            maxRequests: 10
        },
        normal: {
            windowMs: 60000,
            maxRequests: 60
        },
        lenient: {
            windowMs: 60000,
            maxRequests: 300
        },
        search: {
            windowMs: 60000,
            maxRequests: 30
        },
        write: {
            windowMs: 60000,
            maxRequests: 20
        }
    };
    constructor(config) {
        this.config = config;
    }
    async checkLimit(context = {}) {
        this.cleanupStale();
        const key = this.config.keyGenerator
            ? this.config.keyGenerator(context)
            : this.getDefaultKey(context);
        let bucket = this.buckets.get(key);
        if (!bucket) {
            const refillRate = this.config.maxRequests / this.config.windowMs;
            bucket = new TokenBucket(this.config.maxRequests, refillRate);
            this.buckets.set(key, bucket);
        }
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
    recordResult(context, success) {
        if (success && this.config.skipSuccessfulRequests) {
            const key = this.config.keyGenerator
                ? this.config.keyGenerator(context)
                : this.getDefaultKey(context);
            const bucket = this.buckets.get(key);
            if (bucket) {
            }
        }
    }
    getDefaultKey(context) {
        const ctx = context;
        if (ctx.ip) {
            return `ip:${ctx.ip}`;
        }
        if (ctx.userId) {
            return `user:${ctx.userId}`;
        }
        if (ctx.sessionId) {
            return `session:${ctx.sessionId}`;
        }
        return 'global';
    }
    cleanupStale() {
        const now = Date.now();
        if (now - this.lastCleanup < this.cleanupInterval) {
            return;
        }
        for (const [key] of this.buckets.entries()) {
            if (this.buckets.size > 10000) {
                this.buckets.delete(key);
            }
        }
        this.lastCleanup = now;
    }
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
            remaining: Math.floor(bucket['tokens']),
            reset: new Date(Date.now() + this.config.windowMs)
        };
    }
    reset(context) {
        const key = this.config.keyGenerator
            ? this.config.keyGenerator(context)
            : this.getDefaultKey(context);
        this.buckets.delete(key);
    }
    clearAll() {
        this.buckets.clear();
    }
}
export class CompositeRateLimiter {
    limiters;
    constructor(...configs) {
        this.limiters = configs.map(config => new RateLimiter(config));
    }
    async checkLimits(context) {
        for (const limiter of this.limiters) {
            await limiter.checkLimit(context);
        }
    }
    recordResult(context, success) {
        for (const limiter of this.limiters) {
            limiter.recordResult(context, success);
        }
    }
}
export function createRateLimitMiddleware(config) {
    const limiter = new RateLimiter(config);
    return async (handler) => {
        return async (params, context) => {
            await limiter.checkLimit(context);
            try {
                const result = await handler(params, context);
                limiter.recordResult(context, true);
                return result;
            }
            catch (error) {
                limiter.recordResult(context, false);
                throw error;
            }
        };
    };
}
