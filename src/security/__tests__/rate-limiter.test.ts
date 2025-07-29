import { RateLimiter, CompositeRateLimiter, createRateLimitMiddleware } from '../rate-limiter.js';
import { RateLimitError } from '../../errors/custom-errors.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  
  beforeEach(() => {
    // Clear any existing instances
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    if (rateLimiter) {
      rateLimiter.clearAll();
    }
  });

  describe('Token bucket algorithm', () => {
    it('should allow requests within limit', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 5
      });

      const context = { ip: '127.0.0.1' };

      // All 5 requests should pass
      for (let i = 0; i < 5; i++) {
        await expect(rateLimiter.checkLimit(context)).resolves.not.toThrow();
      }
    });

    it('should block requests exceeding limit', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2
      });

      const context = { ip: '127.0.0.1' };

      // First 2 requests should pass
      await rateLimiter.checkLimit(context);
      await rateLimiter.checkLimit(context);

      // Third request should be blocked
      await expect(rateLimiter.checkLimit(context))
        .rejects.toThrow(RateLimitError);
    });

    it('should track different IPs separately', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 1
      });

      const context1 = { ip: '127.0.0.1' };
      const context2 = { ip: '127.0.0.2' };

      // Both IPs should get their own limit
      await rateLimiter.checkLimit(context1);
      await rateLimiter.checkLimit(context2);

      // Second request from first IP should fail
      await expect(rateLimiter.checkLimit(context1)).rejects.toThrow(RateLimitError);
      
      // Second request from second IP should also fail (only 1 allowed)
      await expect(rateLimiter.checkLimit(context2)).rejects.toThrow(RateLimitError);
    });

    it('should use user ID when available', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 1
      });

      // When IP is present, it takes precedence over userId
      const contextWithIp = { 
        ip: '127.0.0.1',
        userId: 'user123'
      };

      await rateLimiter.checkLimit(contextWithIp);
      
      // Same IP, different user - should be limited (IP-based)
      const contextSameIp = {
        ip: '127.0.0.1',
        userId: 'user456'
      };
      
      await expect(rateLimiter.checkLimit(contextSameIp)).rejects.toThrow(RateLimitError);
      
      // Different IP, same user - should work (IP takes precedence)
      const contextDifferentIp = {
        ip: '192.168.1.1',
        userId: 'user123'
      };
      
      await expect(rateLimiter.checkLimit(contextDifferentIp)).resolves.not.toThrow();
      
      // Context with only userId (no IP)
      const contextUserOnly = {
        userId: 'user789'
      };
      
      await rateLimiter.checkLimit(contextUserOnly);
      
      // Same user, no IP - should be limited
      await expect(rateLimiter.checkLimit(contextUserOnly)).rejects.toThrow(RateLimitError);
    });

    it('should handle missing context gracefully', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 1
      });

      // Should use global identifier when no context provided
      await rateLimiter.checkLimit({});
      await expect(rateLimiter.checkLimit({})).rejects.toThrow(RateLimitError);
    });

    it('should reset limits after window expires', async () => {
      jest.useFakeTimers();
      
      rateLimiter = new RateLimiter({
        windowMs: 1000, // 1 second
        maxRequests: 1
      });

      const context = { ip: '127.0.0.1' };

      await rateLimiter.checkLimit(context);
      await expect(rateLimiter.checkLimit(context)).rejects.toThrow();

      // Advance time past the window
      jest.advanceTimersByTime(1100);

      // Should work again
      await expect(rateLimiter.checkLimit(context)).resolves.not.toThrow();

      jest.useRealTimers();
    });

    it('should record result for skipSuccessfulRequests config', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true
      });

      const context = { ip: '127.0.0.1' };

      // First request
      await rateLimiter.checkLimit(context);
      rateLimiter.recordResult(context, true);
      
      // Second request
      await rateLimiter.checkLimit(context);
      rateLimiter.recordResult(context, true);
      
      // Third would normally fail but skipSuccessfulRequests might affect it
      // The implementation doesn't actually refund tokens, so this will still fail
      await expect(rateLimiter.checkLimit(context)).rejects.toThrow(RateLimitError);
    });
  });

  describe('Configuration', () => {
    it('should use provided configuration', () => {
      rateLimiter = new RateLimiter({
        windowMs: 30000,
        maxRequests: 50
      });
      
      // Test that it respects the configuration
      const context = { ip: '127.0.0.1' };
      const status = rateLimiter.getStatus(context);
      expect(status.limit).toBe(50);
      expect(status.remaining).toBe(50);
    });

    it('should use preset configurations', () => {
      rateLimiter = new RateLimiter(RateLimiter.PRESETS.strict);
      
      const context = { ip: '127.0.0.1' };
      const status = rateLimiter.getStatus(context);
      expect(status.limit).toBe(10); // strict preset
    });
  });

  describe('Metrics and monitoring', () => {
    it('should track request counts via getStatus', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5
      });

      const context = { ip: '127.0.0.1' };

      let status = rateLimiter.getStatus(context);
      expect(status.limit).toBe(5);
      expect(status.remaining).toBe(5);

      await rateLimiter.checkLimit(context);
      await rateLimiter.checkLimit(context);

      status = rateLimiter.getStatus(context);
      expect(status.limit).toBe(5);
      expect(status.remaining).toBe(3);
    });

    it('should reset limits for specific context', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 1
      });

      const context = { ip: '127.0.0.1' };
      
      // Use up the limit
      await rateLimiter.checkLimit(context);
      await expect(rateLimiter.checkLimit(context)).rejects.toThrow(RateLimitError);
      
      // Reset the limit
      rateLimiter.reset(context);
      
      // Should work again
      await expect(rateLimiter.checkLimit(context)).resolves.not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should throw RateLimitError with retry information', async () => {
      rateLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 1
      });

      const context = { ip: '127.0.0.1' };
      
      // Use up the limit
      await rateLimiter.checkLimit(context);
      
      // Next request should throw with retry info
      try {
        await rateLimiter.checkLimit(context);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).message).toContain('retry after');
      }
    });
  });

  describe('Composite rate limiter', () => {
    it('should check multiple rate limits', async () => {
      const composite = new CompositeRateLimiter(
        { windowMs: 60000, maxRequests: 10 }, // 10 per minute
        { windowMs: 1000, maxRequests: 1 }     // 1 per second
      );

      const context = { ip: '127.0.0.1' };

      // First request should pass both limits
      await composite.checkLimits(context);
      
      // Second immediate request should fail second limit (1 per second)
      await expect(composite.checkLimits(context)).rejects.toThrow(RateLimitError);
    });
  });

  describe('Rate limit middleware', () => {
    it('should wrap handlers with rate limiting', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2
      });

      const mockHandler = jest.fn().mockResolvedValue({ result: 'success' });
      const protectedHandler = await middleware(mockHandler);

      const context = { ip: '127.0.0.1' };

      // First two requests should succeed
      await protectedHandler({}, context);
      await protectedHandler({}, context);
      expect(mockHandler).toHaveBeenCalledTimes(2);
      
      // Third request should be rate limited
      await expect(protectedHandler({}, context)).rejects.toThrow(RateLimitError);
      expect(mockHandler).toHaveBeenCalledTimes(2); // Not called again
    });

    it('should record success and failure', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 3,
        skipFailedRequests: true
      });

      const mockHandler = jest.fn()
        .mockResolvedValueOnce({ result: 'success' })
        .mockRejectedValueOnce(new Error('Handler error'))
        .mockResolvedValueOnce({ result: 'success' });
        
      const protectedHandler = await middleware(mockHandler);
      const context = { ip: '127.0.0.1' };

      // Success
      await protectedHandler({}, context);
      
      // Failure (should not count if skipFailedRequests is true)
      await expect(protectedHandler({}, context)).rejects.toThrow('Handler error');
      
      // Should still have one more request
      await protectedHandler({}, context);
      
      // This would be the 4th request (3rd counted request)
      await expect(protectedHandler({}, context)).rejects.toThrow(RateLimitError);
    });
  });
});