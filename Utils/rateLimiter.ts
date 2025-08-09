// Utils/rateLimiter.ts - REDIS v4 COMPATIBLE VERSION
import { createClient, RedisClientType } from 'redis';

export class RateLimiter {
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
      console.error('Rate limiter Redis error:', err);
      this.isConnected = false;
    });

    this.redis.on('connect', () => {
      console.log('Rate limiter Redis connected');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      console.log('Rate limiter Redis ready');
      this.isConnected = true;
    });

    this.connect();
  }

  private async connect() {
    try {
      await this.redis.connect();
    } catch (error) {
      console.error('Failed to connect to Redis for rate limiter:', error);
      this.isConnected = false;
    }
  }

  /**
   * Check rate limit using sliding window
   */
  async checkLimit(
    identifier: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (!this.isConnected) {
      console.warn('Redis not connected for rate limiter, allowing request');
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + windowMs };
    }

    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Remove expired entries
      await this.redis.zRemRangeByScore(key, 0, windowStart);
      
      // Get current count
      const currentCount = await this.redis.zCard(key);
      
      if (currentCount >= limit) {
        // Get oldest request time for reset calculation
        // FIXED: Redis v4 compatible zRange
        const oldestRequest = await this.redis.zRangeWithScores(key, 0, 0);
        const resetTime = oldestRequest.length > 0 
          ? oldestRequest[0].score + windowMs 
          : now + windowMs;

        return {
          allowed: false,
          remaining: 0,
          resetTime
        };
      }

      // Add current request
      await this.redis.zAdd(key, {
        score: now,
        value: `${now}-${Math.random()}`
      });

      // Set expiration
      await this.redis.expire(key, Math.ceil(windowMs / 1000));

      return {
        allowed: true,
        remaining: limit - currentCount - 1,
        resetTime: now + windowMs
      };

    } catch (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true, remaining: limit, resetTime: now + windowMs }; // Fail open
    }
  }

  /**
   * Get current rate limit status
   */
  async getLimitStatus(identifier: string, limit: number, windowMs: number) {
    if (!this.isConnected) {
      return { current: 0, remaining: limit, resetTime: Date.now() + windowMs };
    }

    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Remove expired entries
      await this.redis.zRemRangeByScore(key, 0, windowStart);
      
      // Get current count
      const currentCount = await this.redis.zCard(key);
      
      return {
        current: currentCount,
        remaining: Math.max(0, limit - currentCount),
        resetTime: now + windowMs
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return { current: 0, remaining: limit, resetTime: now + windowMs };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetLimit(identifier: string): Promise<boolean> {
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
   * Get rate limiting statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    totalRequests: number;
    isConnected: boolean;
  }> {
    if (!this.isConnected) {
      return {
        totalKeys: 0,
        totalRequests: 0,
        isConnected: false
      };
    }

    try {
      // Get all rate limit keys
      const keys = await this.redis.keys('rate_limit:*');
      let totalRequests = 0;

      // Count total requests across all keys
      for (const key of keys) {
        const count = await this.redis.zCard(key);
        totalRequests += count;
      }

      return {
        totalKeys: keys.length,
        totalRequests,
        isConnected: true
      };
    } catch (error) {
      console.error('Failed to get rate limiter stats:', error);
      return {
        totalKeys: 0,
        totalRequests: 0,
        isConnected: this.isConnected
      };
    }
  }

  /**
   * Cleanup expired keys (maintenance function)
   */
  async cleanup(): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const keys = await this.redis.keys('rate_limit:*');
      let cleanedCount = 0;

      for (const key of keys) {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000); // 1 hour cleanup window
        
        // Remove very old entries
        const removed = await this.redis.zRemRangeByScore(key, 0, oneHourAgo);
        
        // If key is now empty, delete it
        const remaining = await this.redis.zCard(key);
        if (remaining === 0) {
          await this.redis.del(key);
          cleanedCount++;
        }
      }

      console.log(`🧹 Rate limiter cleanup: removed ${cleanedCount} empty keys`);
      return cleanedCount;
    } catch (error) {
      console.error('Rate limiter cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          details: { connection: false, error: 'Redis not connected' }
        };
      }

      // Test basic operation
      await this.redis.ping();
      const stats = await this.getStats();

      return {
        status: 'healthy',
        details: {
          connection: true,
          stats
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { connection: false, error: error.message }
      };
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.isConnected) {
      await this.redis.quit();
      this.isConnected = false;
      console.log('Rate limiter Redis connection closed');
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('Closing rate limiter Redis connection...');
    await rateLimiter.close();
  });

  process.on('SIGTERM', async () => {
    console.log('Closing rate limiter Redis connection...');
    await rateLimiter.close();
  });
}