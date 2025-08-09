// ================================
// REDIS-POWERED RATE LIMITING SYSTEM
// ================================

import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';

/**
 * Redis-powered rate limiter with enterprise-grade features
 */
export class RedisRateLimiter {
  private redis: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.redis.on('error', (err) => {
      console.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.redis.on('connect', () => {
      console.log('Redis client connected');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      console.log('Redis client ready');
      this.isConnected = true;
    });

    this.connect();
  }

  private async connect() {
    try {
      await this.redis.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Check rate limit for a given identifier
   */
  async checkRateLimit(
    identifier: string,
    windowMs: number,
    maxRequests: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number; retryAfter?: number }> {
    if (!this.isConnected) {
      // Fallback to allow requests if Redis is not available
      console.warn('Redis not connected, allowing request');
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: Date.now() + windowMs
      };
    }

    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.multi();
      
      // Remove expired entries
      pipeline.zRemRangeByScore(key, 0, windowStart);
      
      // Count current requests in window
      pipeline.zCard(key);
      
      // Add current request
      pipeline.zAdd(key, { score: now, value: now.toString() });
      
      // Set expiry
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      const currentCount = results[1] as number;

      if (currentCount >= maxRequests) {
        // Get the oldest request to calculate retry after
        const oldestRequest = await this.redis.zRange(key, 0, 0, { WITHSCORES: true });
        const retryAfter = oldestRequest.length > 0 ? 
          Math.ceil((parseInt(oldestRequest[0].score) + windowMs - now) / 1000) : 
          Math.ceil(windowMs / 1000);

        return {
          allowed: false,
          remaining: 0,
          resetTime: now + windowMs,
          retryAfter
        };
      }

      return {
        allowed: true,
        remaining: maxRequests - currentCount - 1,
        resetTime: now + windowMs
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fallback to allow requests if Redis operations fail
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      };
    }
  }

  /**
   * Get current rate limit status for an identifier
   */
  async getRateLimitStatus(identifier: string, windowMs: number, maxRequests: number) {
    if (!this.isConnected) {
      return { current: 0, remaining: maxRequests, resetTime: Date.now() + windowMs };
    }

    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Remove expired entries
      await this.redis.zRemRangeByScore(key, 0, windowStart);
      
      // Count current requests
      const currentCount = await this.redis.zCard(key);
      
      return {
        current: currentCount,
        remaining: Math.max(0, maxRequests - currentCount),
        resetTime: now + windowMs
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return { current: 0, remaining: maxRequests, resetTime: now + windowMs };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetRateLimit(identifier: string): Promise<boolean> {
    if (!this.isConnected) return true;

    const key = `rate_limit:${identifier}`;
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.isConnected) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

/**
 * Tiered rate limiter with different limits for different user tiers
 */
export class TieredRateLimiter {
  private redisLimiter: RedisRateLimiter;

  constructor() {
    this.redisLimiter = new RedisRateLimiter();
  }

  /**
   * Check rate limits for a specific API key and endpoint
   */
  async checkLimits(apiKey: string, endpoint: string): Promise<{ allowed: boolean; remaining: number; resetTime: number; retryAfter?: number }> {
    const userTier = await this.getUserTier(apiKey);
    const limits = this.getLimitsForTier(userTier, endpoint);

    return this.redisLimiter.checkRateLimit(
      `${apiKey}:${endpoint}`,
      limits.windowMs,
      limits.maxRequests
    );
  }

  /**
   * Get rate limit status for an API key and endpoint
   */
  async getLimitStatus(apiKey: string, endpoint: string) {
    const userTier = await this.getUserTier(apiKey);
    const limits = this.getLimitsForTier(userTier, endpoint);

    return this.redisLimiter.getRateLimitStatus(
      `${apiKey}:${endpoint}`,
      limits.windowMs,
      limits.maxRequests
    );
  }

  /**
   * Get user tier from API key (placeholder implementation)
   */
  private async getUserTier(apiKey: string): Promise<string> {
    // TODO: Implement actual user tier lookup from database
    // For now, return 'free' as default
    return 'free';
  }

  /**
   * Get rate limits for a specific tier and endpoint
   */
  private getLimitsForTier(tier: string, endpoint: string) {
    const limits = {
      free: {
        scraping: { windowMs: 60000, maxRequests: 5 },      // 5 requests per minute
        matching: { windowMs: 300000, maxRequests: 10 },    // 10 requests per 5 minutes
        general: { windowMs: 60000, maxRequests: 20 }       // 20 requests per minute
      },
      premium: {
        scraping: { windowMs: 60000, maxRequests: 20 },     // 20 requests per minute
        matching: { windowMs: 300000, maxRequests: 50 },    // 50 requests per 5 minutes
        general: { windowMs: 60000, maxRequests: 100 }      // 100 requests per minute
      },
      enterprise: {
        scraping: { windowMs: 60000, maxRequests: 100 },    // 100 requests per minute
        matching: { windowMs: 300000, maxRequests: 200 },   // 200 requests per 5 minutes
        general: { windowMs: 60000, maxRequests: 500 }      // 500 requests per minute
      }
    };

    return limits[tier as keyof typeof limits]?.[endpoint as keyof typeof limits.free] || limits.free[endpoint as keyof typeof limits.free];
  }
}

/**
 * Suspicious activity detector
 */
export class SuspiciousActivityDetector {
  private redis: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.redis.on('error', (err) => {
      console.error('SuspiciousActivityDetector Redis error:', err);
      this.isConnected = false;
    });

    this.redis.on('connect', () => {
      this.isConnected = true;
    });

    this.connect();
  }

  private async connect() {
    try {
      await this.redis.connect();
    } catch (error) {
      console.error('Failed to connect to Redis for suspicious activity detection:', error);
      this.isConnected = false;
    }
  }

  /**
   * Analyze request for suspicious activity
   */
  async analyze(ip: string, apiKey: string, endpoint: string): Promise<boolean> {
    if (!this.isConnected) {
      return false; // Allow if Redis is not available
    }

    try {
      const checks = await Promise.all([
        this.checkRapidRequests(ip),
        this.checkMultipleKeys(ip),
        this.checkUnusualPatterns(apiKey, endpoint)
      ]);

      return checks.some(check => check);
    } catch (error) {
      console.error('Suspicious activity analysis failed:', error);
      return false;
    }
  }

  /**
   * Check for rapid requests from the same IP
   */
  private async checkRapidRequests(ip: string): Promise<boolean> {
    const key = `suspicious:rapid:${ip}`;
    const count = await this.redis.incr(key);
    await this.redis.expire(key, 60); // 1 minute window

    return count > 100; // More than 100 requests per minute
  }

  /**
   * Check for multiple API keys from the same IP
   */
  private async checkMultipleKeys(ip: string): Promise<boolean> {
    const key = `suspicious:keys:${ip}`;
    await this.redis.sAdd(key, apiKey);
    await this.redis.expire(key, 300); // 5 minute window

    const keyCount = await this.redis.sCard(key);
    return keyCount > 5; // More than 5 different API keys from same IP
  }

  /**
   * Check for unusual patterns in API usage
   */
  private async checkUnusualPatterns(apiKey: string, endpoint: string): Promise<boolean> {
    const key = `suspicious:patterns:${apiKey}`;
    const pattern = `${endpoint}:${Date.now()}`;
    
    await this.redis.lPush(key, pattern);
    await this.redis.lTrim(key, 0, 99); // Keep only last 100 patterns
    await this.redis.expire(key, 3600); // 1 hour window

    const patterns = await this.redis.lRange(key, 0, -1);
    
    // Check for bot-like behavior (very regular intervals)
    if (patterns.length > 10) {
      const intervals = [];
      for (let i = 1; i < patterns.length; i++) {
        const current = parseInt(patterns[i].split(':')[1]);
        const previous = parseInt(patterns[i-1].split(':')[1]);
        intervals.push(current - previous);
      }
      
      // Check if intervals are too regular (indicating bot)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      
      if (variance < 1000) { // Very low variance indicates bot-like behavior
        return true;
      }
    }

    return false;
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.isConnected) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}
