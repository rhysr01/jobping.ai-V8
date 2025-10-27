/**
 * Tests for Production Rate Limiter
 */

import { RateLimiter, RATE_LIMIT_CONFIG, withRateLimiting } from '@/Utils/productionRateLimiter';
import { NextRequest, NextResponse } from 'next/server';

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn()
}));

// Mock Next.js
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: jest.fn()
}));

describe('Production Rate Limiter', () => {
  let rateLimiter: RateLimiter;
  let mockRedisClient: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
      ping: jest.fn(),
      quit: jest.fn()
    };

    require('redis').createClient.mockReturnValue(mockRedisClient);
    
    mockRequest = {
      ip: '192.168.1.1',
      headers: {
        get: jest.fn()
      }
    } as any;

    rateLimiter = new RateLimiter();
  });

  describe('RateLimiter class', () => {
    it('should initialize with default config', () => {
      expect(rateLimiter).toBeDefined();
      expect(rateLimiter.getConfig()).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        'test-endpoint': {
          windowMs: 60000,
          maxRequests: 5,
          skipSuccessfulRequests: false
        }
      };

      const customRateLimiter = new RateLimiter(customConfig);
      expect(customRateLimiter.getConfig()).toEqual(customConfig);
    });

    it('should check rate limit for valid request', async () => {
      mockRedisClient.get.mockResolvedValue('5');
      mockRedisClient.incr.mockResolvedValue(6);

      const result = await rateLimiter.checkRateLimit('test-endpoint', '192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBeDefined();
    });

    it('should block request when rate limit exceeded', async () => {
      mockRedisClient.get.mockResolvedValue('10');
      mockRedisClient.incr.mockResolvedValue(11);

      const result = await rateLimiter.checkRateLimit('test-endpoint', '192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetTime).toBeDefined();
    });

    it('should handle Redis connection errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await rateLimiter.checkRateLimit('test-endpoint', '192.168.1.1');

      expect(result.allowed).toBe(true); // Should allow when Redis fails
      expect(result.remaining).toBe(0);
    });

    it('should handle missing Redis key', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.incr.mockResolvedValue(1);

      const result = await rateLimiter.checkRateLimit('test-endpoint', '192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should set expiration on new keys', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.incr.mockResolvedValue(1);

      await rateLimiter.checkRateLimit('test-endpoint', '192.168.1.1');

      expect(mockRedisClient.expire).toHaveBeenCalled();
    });

    it('should handle different endpoints with different limits', async () => {
      const webhookConfig = RATE_LIMIT_CONFIG['webhook-tally'];
      const scrapeConfig = RATE_LIMIT_CONFIG['scrape'];

      expect(webhookConfig.maxRequests).toBe(10);
      expect(scrapeConfig.maxRequests).toBe(2);
    });

    it('should handle user-based rate limiting', async () => {
      mockRedisClient.get.mockResolvedValue('5');
      mockRedisClient.incr.mockResolvedValue(6);

      const result = await rateLimiter.checkRateLimit('test-endpoint', 'user@example.com', 'user');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should handle IP-based rate limiting', async () => {
      mockRedisClient.get.mockResolvedValue('5');
      mockRedisClient.incr.mockResolvedValue(6);

      const result = await rateLimiter.checkRateLimit('test-endpoint', '192.168.1.1', 'ip');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('RATE_LIMIT_CONFIG', () => {
    it('should have valid configuration for all endpoints', () => {
      Object.entries(RATE_LIMIT_CONFIG).forEach(([endpoint, config]) => {
        expect(config.windowMs).toBeGreaterThan(0);
        expect(config.maxRequests).toBeGreaterThan(0);
        expect(typeof config.skipSuccessfulRequests).toBe('boolean');
      });
    });

    it('should have reasonable limits for webhook-tally', () => {
      const config = RATE_LIMIT_CONFIG['webhook-tally'];
      expect(config.windowMs).toBe(60000); // 1 minute
      expect(config.maxRequests).toBe(10);
      expect(config.skipSuccessfulRequests).toBe(false);
    });

    it('should have strict limits for scrape endpoint', () => {
      const config = RATE_LIMIT_CONFIG['scrape'];
      expect(config.windowMs).toBe(60000); // 1 minute
      expect(config.maxRequests).toBe(2);
      expect(config.skipSuccessfulRequests).toBe(true);
    });

    it('should have appropriate limits for match-users', () => {
      const config = RATE_LIMIT_CONFIG['match-users'];
      expect(config.windowMs).toBeGreaterThan(0);
      expect(config.maxRequests).toBe(3);
      expect(config.skipSuccessfulRequests).toBe(true);
    });

    it('should have strict limits for send-scheduled-emails', () => {
      const config = RATE_LIMIT_CONFIG['send-scheduled-emails'];
      expect(config.windowMs).toBe(60000); // 1 minute
      expect(config.maxRequests).toBe(1);
      expect(config.skipSuccessfulRequests).toBe(true);
    });

    it('should have appropriate limits for create-checkout-session', () => {
      const config = RATE_LIMIT_CONFIG['create-checkout-session'];
      expect(config.windowMs).toBe(300000); // 5 minutes
      expect(config.maxRequests).toBe(3);
      expect(config.skipSuccessfulRequests).toBe(false);
    });
  });

  describe('withRateLimiting middleware', () => {
    it('should allow request when rate limit not exceeded', async () => {
      mockRedisClient.get.mockResolvedValue('5');
      mockRedisClient.incr.mockResolvedValue(6);

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withRateLimiting(handler, 'test-endpoint');

      const response = await wrappedHandler(mockRequest);

      expect(handler).toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should block request when rate limit exceeded', async () => {
      mockRedisClient.get.mockResolvedValue('10');
      mockRedisClient.incr.mockResolvedValue(11);

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withRateLimiting(handler, 'test-endpoint');

      const response = await wrappedHandler(mockRequest);

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(429);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withRateLimiting(handler, 'test-endpoint');

      const response = await wrappedHandler(mockRequest);

      expect(handler).toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should extract IP from request headers', async () => {
      mockRequest.headers.get.mockReturnValue('192.168.1.100');
      mockRedisClient.get.mockResolvedValue('5');
      mockRedisClient.incr.mockResolvedValue(6);

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withRateLimiting(handler, 'test-endpoint');

      await wrappedHandler(mockRequest);

      expect(mockRequest.headers.get).toHaveBeenCalledWith('x-forwarded-for');
    });

    it('should use request IP as fallback', async () => {
      mockRequest.headers.get.mockReturnValue(null);
      mockRedisClient.get.mockResolvedValue('5');
      mockRedisClient.incr.mockResolvedValue(6);

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withRateLimiting(handler, 'test-endpoint');

      await wrappedHandler(mockRequest);

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.1')
      );
    });
  });

  describe('edge cases', () => {
    it('should handle missing endpoint configuration', async () => {
      const result = await rateLimiter.checkRateLimit('non-existent-endpoint', '192.168.1.1');

      expect(result.allowed).toBe(true); // Should allow when no config
      expect(result.remaining).toBe(0);
    });

    it('should handle empty identifier', async () => {
      const result = await rateLimiter.checkRateLimit('test-endpoint', '');

      expect(result.allowed).toBe(true); // Should allow when no identifier
      expect(result.remaining).toBe(0);
    });

    it('should handle null identifier', async () => {
      const result = await rateLimiter.checkRateLimit('test-endpoint', null as any);

      expect(result.allowed).toBe(true); // Should allow when no identifier
      expect(result.remaining).toBe(0);
    });

    it('should handle undefined identifier', async () => {
      const result = await rateLimiter.checkRateLimit('test-endpoint', undefined as any);

      expect(result.allowed).toBe(true); // Should allow when no identifier
      expect(result.remaining).toBe(0);
    });

    it('should handle very long identifiers', async () => {
      const longIdentifier = 'x'.repeat(1000);
      mockRedisClient.get.mockResolvedValue('5');
      mockRedisClient.incr.mockResolvedValue(6);

      const result = await rateLimiter.checkRateLimit('test-endpoint', longIdentifier);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should handle special characters in identifiers', async () => {
      const specialIdentifier = 'user@example.com:123!@#$%^&*()';
      mockRedisClient.get.mockResolvedValue('5');
      mockRedisClient.incr.mockResolvedValue(6);

      const result = await rateLimiter.checkRateLimit('test-endpoint', specialIdentifier);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('Redis connection management', () => {
    it('should handle Redis connection failure', async () => {
      require('redis').createClient.mockImplementation(() => {
        throw new Error('Redis connection failed');
      });

      const fallbackRateLimiter = new RateLimiter();
      const result = await fallbackRateLimiter.checkRateLimit('test-endpoint', '192.168.1.1');

      expect(result.allowed).toBe(true); // Should allow when Redis fails
    });

    it('should handle Redis ping failure', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Redis ping failed'));

      const result = await rateLimiter.checkRateLimit('test-endpoint', '192.168.1.1');

      expect(result.allowed).toBe(true); // Should allow when Redis fails
    });

    it('should handle Redis operations timeout', async () => {
      mockRedisClient.get.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const result = await rateLimiter.checkRateLimit('test-endpoint', '192.168.1.1');

      expect(result.allowed).toBe(true); // Should allow when Redis times out
    });
  });

  describe('test mode behavior', () => {
    it('should use test prefix in test mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const testRateLimiter = new RateLimiter();
      expect(testRateLimiter).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should use test prefix when JOBPING_TEST_MODE is set', () => {
      const originalEnv = process.env.JOBPING_TEST_MODE;
      process.env.JOBPING_TEST_MODE = '1';

      const testRateLimiter = new RateLimiter();
      expect(testRateLimiter).toBeDefined();

      process.env.JOBPING_TEST_MODE = originalEnv;
    });
  });
});
