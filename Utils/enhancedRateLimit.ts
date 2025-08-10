// ================================
// ENHANCED ATOMIC RATE LIMITING SYSTEM
// ================================

import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Lua script for atomic rate limiting
const LUA_SCRIPT = `
-- Utils/atomicRateLimit.lua - OPTIMIZED VERSION
-- Enhanced atomic rate limiting with perfect TTL handling and collision prevention

local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Clean expired entries from sorted set
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

-- Always refresh TTL to prevent key expiration during active usage
redis.call('EXPIRE', key, math.ceil(window / 1000) + 1)

-- Get current count of requests in window
local current = redis.call('ZCARD', key)

if current < limit then
  -- Generate unique member ID to prevent collisions
  local member_id = now .. ":" .. redis.sha1hex(key .. now .. math.random())
  
  -- Add current request to sorted set
  redis.call('ZADD', key, now, member_id)
  
  -- Return: allowed=1, remaining_requests, reset_time
  return {1, limit - current - 1, now + window}
else
  -- Return: allowed=0, remaining_requests=0, reset_time
  return {0, 0, now + window}
end
`;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface TieredLimitResult extends RateLimitResult {
  tier: string;
  endpoint: string;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  redisConnected: boolean;
  lastError?: string;
  metrics: {
    totalRequests: number;
    rateLimitedRequests: number;
    averageResponseTime: number;
  };
}

/**
 * Enhanced atomic rate limiter with Lua script support
 */
export class EnhancedRateLimiter {
  private redis: RedisClientType;
  private isConnected: boolean = false;
  private scriptSha: string | null = null;
  private metrics = {
    totalRequests: 0,
    rateLimitedRequests: 0,
    responseTimes: [] as number[],
  };

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
      this.loadLuaScript();
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

  private async loadLuaScript() {
    try {
      this.scriptSha = await this.redis.scriptLoad(LUA_SCRIPT);
      console.log('Lua script loaded successfully:', this.scriptSha);
    } catch (error) {
      console.error('Failed to load Lua script:', error);
    }
  }

  /**
   * Check rate limit using atomic Lua script
   */
  async checkLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    category: string = 'default'
  ): Promise<RateLimitResult> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    if (!this.isConnected) {
      console.warn('Redis not connected, allowing request');
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + windowMs
      };
    }

    const key = `rate_limit:${category}:${identifier}`;
    const now = Date.now();

    try {
      let result: any;

      if (this.scriptSha) {
        // Use cached script SHA for better performance
        result = await this.redis.evalSha(this.scriptSha, {
          keys: [key],
          arguments: [limit.toString(), windowMs.toString(), now.toString()]
        });
      } else {
        // Fallback to eval if script not loaded
        result = await this.redis.eval(LUA_SCRIPT, {
          keys: [key],
          arguments: [limit.toString(), windowMs.toString(), now.toString()]
        });
      }

      // Ensure result is an array
      const resultArray = Array.isArray(result) ? result : [result];
      const [allowed, remaining, resetTime] = resultArray;

      const responseTime = Date.now() - startTime;
      this.metrics.responseTimes.push(responseTime);
      if (this.metrics.responseTimes.length > 100) {
        this.metrics.responseTimes.shift();
      }

      if (!allowed) {
        this.metrics.rateLimitedRequests++;
      }

      return {
        allowed: allowed === 1,
        remaining: remaining as number,
        resetTime: resetTime as number
      };

    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fallback to allow requests if Redis operations fail
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs
      };
    }
  }

  /**
   * Check tiered rate limits for different user tiers
   */
  async checkTieredLimit(
    apiKey: string,
    endpoint: string,
    tier: string = 'free'
  ): Promise<TieredLimitResult> {
    const limits = this.getLimitsForTier(tier, endpoint);
    const result = await this.checkLimit(apiKey, limits.maxRequests, limits.windowMs, endpoint);
    
    return {
      ...result,
      tier,
      endpoint
    };
  }

  /**
   * Get limits for a specific tier and endpoint
   */
  private getLimitsForTier(tier: string, endpoint: string) {
    const tierLimits = {
      free: {
        matching: { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 3 requests per 15 minutes
        default: { maxRequests: 10, windowMs: 60 * 1000 } // 10 requests per minute
      },
      premium: {
        matching: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 requests per 15 minutes
        default: { maxRequests: 50, windowMs: 60 * 1000 } // 50 requests per minute
      }
    };

    return tierLimits[tier as keyof typeof tierLimits]?.[endpoint as keyof typeof tierLimits.free] || 
           tierLimits.free.default;
  }

  /**
   * Get current rate limit status
   */
  async getLimitStatus(identifier: string, category: string = 'default') {
    if (!this.isConnected) {
      return { current: 0, remaining: 100, resetTime: Date.now() + 60000 };
    }

    const key = `rate_limit:${category}:${identifier}`;
    const now = Date.now();

    try {
      // Remove expired entries
      await this.redis.zRemRangeByScore(key, 0, now - 60000);
      
      // Count current requests
      const currentCount = await this.redis.zCard(key);
      
      return {
        current: currentCount,
        remaining: Math.max(0, 100 - currentCount),
        resetTime: now + 60000
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return { current: 0, remaining: 100, resetTime: now + 60000 };
    }
  }

  /**
   * Health check for the rate limiter
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const status = this.isConnected ? 'healthy' : 'unhealthy';
    const averageResponseTime = this.metrics.responseTimes.length > 0 
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length 
      : 0;

    return {
      status,
      redisConnected: this.isConnected,
      metrics: {
        totalRequests: this.metrics.totalRequests,
        rateLimitedRequests: this.metrics.rateLimitedRequests,
        averageResponseTime
      }
    };
  }

  /**
   * Get global statistics
   */
  async getGlobalStats() {
    if (!this.isConnected) {
      return { totalKeys: 0, totalRequests: 0 };
    }

    try {
      const keys = await this.redis.keys('rate_limit:*');
      return {
        totalKeys: keys.length,
        totalRequests: this.metrics.totalRequests
      };
    } catch (error) {
      console.error('Failed to get global stats:', error);
      return { totalKeys: 0, totalRequests: this.metrics.totalRequests };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetLimit(identifier: string, category: string = 'default'): Promise<boolean> {
    if (!this.isConnected) return true;

    const key = `rate_limit:${category}:${identifier}`;
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

// Export singleton instance
export const rateLimiter = new EnhancedRateLimiter();
