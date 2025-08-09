// ================================
// ENHANCED RATE LIMITING WITH ATOMIC OPERATIONS
// ================================

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient, RedisClientType } from 'redis';

/**
 * Enhanced rate limiter with atomic operations using Lua scripts
 */
export class EnhancedRateLimiter {
  private static luaScript: string;
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
      console.error('Enhanced rate limiter Redis error:', err);
      this.isConnected = false;
    });

    this.redis.on('connect', () => {
      console.log('Enhanced rate limiter Redis connected');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      console.log('Enhanced rate limiter Redis ready');
      this.isConnected = true;
    });

    // Load Lua script
    try {
      EnhancedRateLimiter.luaScript = readFileSync(
        join(process.cwd(), 'Utils/atomicRateLimit.lua'), 
        'utf8'
      );
      console.log('✅ Lua script loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load Lua script:', error);
      // Fallback script (inline version)
      EnhancedRateLimiter.luaScript = `
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
        redis.call('EXPIRE', key, math.ceil(window / 1000))
        local current = redis.call('ZCARD', key)
        
        if current < limit then
          local member_id = now .. ":" .. redis.sha1hex(key .. now .. math.random())
          redis.call('ZADD', key, now, member_id)
          return {1, limit - current - 1}
        else
          return {0, 0}
        end
      `;
    }

    this.connect();
  }

  private async connect() {
    try {
      await this.redis.connect();
    } catch (error) {
      console.error('Failed to connect to Redis for enhanced rate limiter:', error);
      this.isConnected = false;
    }
  }

  /**
   * Check rate limit with atomic operations
   */
  static async checkLimit(
    redis: RedisClientType, 
    identifier: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime?: number }> {
    try {
      const result = await redis.eval(
        EnhancedRateLimiter.luaScript,
        1,
        `rate_limit:${identifier}`,
        limit,
        windowMs,
        Date.now()
      ) as [number, number];

      return {
        allowed: result[0] === 1,
        remaining: result[1],
        resetTime: Date.now() + windowMs
      };
    } catch (error) {
      console.error('Enhanced rate limit check failed:', error);
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs }; // Fail open
    }
  }

  /**
   * Check rate limit for this instance
   */
  async checkLimit(
    identifier: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime?: number }> {
    if (!this.isConnected) {
      console.warn('Redis not connected for enhanced rate limiter, allowing request');
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + windowMs };
    }

    return EnhancedRateLimiter.checkLimit(this.redis, identifier, limit, windowMs);
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
      
      // Count current requests
      const currentCount = await this.redis.zCard(key);
      
      return {
        current: currentCount,
        remaining: Math.max(0, limit - currentCount),
        resetTime: now + windowMs
      };
    } catch (error) {
      console.error('Failed to get enhanced rate limit status:', error);
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
      console.error('Failed to reset enhanced rate limit:', error);
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
