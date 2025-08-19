// Utils/enhancedRateLimit.ts - REDIS v4 OPTIMIZED & BULLETPROOF
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient, RedisClientType } from 'redis';

/**
 * Enhanced rate limiter with atomic operations using Lua scripts
 * Optimized for Redis v4+ with bulletproof error handling
 */
export class EnhancedRateLimiter {
  private static luaScript: string;
  private static globalInstance: EnhancedRateLimiter;
  private redis: RedisClientType;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 10;

  // Performance metrics
  private metrics = {
    requests: 0,
    allowed: 0,
    denied: 0,
    errors: 0,
    cacheHits: 0
  };

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > this.maxRetries) {
            console.error(`❌ Redis connection failed after ${this.maxRetries} retries`);
            return new Error('Redis connection failed');
          }
          const delay = Math.min(retries * 100, 3000);
          console.log(`🔄 Redis reconnecting... attempt ${retries}, delay: ${delay}ms`);
          return delay;
        }
      }
    });

    this.setupEventHandlers();
    this.loadLuaScript();
  }

  /**
   * Get singleton instance for optimal connection management
   */
  static getInstance(): EnhancedRateLimiter {
    if (!EnhancedRateLimiter.globalInstance) {
      EnhancedRateLimiter.globalInstance = new EnhancedRateLimiter();
    }
    return EnhancedRateLimiter.globalInstance;
  }

  private setupEventHandlers() {
    this.redis.on('error', (err) => {
      console.error('🚨 Enhanced rate limiter Redis error:', err);
      this.isConnected = false;
      this.metrics.errors++;
    });

    this.redis.on('connect', () => {
      console.log('✅ Enhanced rate limiter Redis connected');
      this.isConnected = true;
      this.retryCount = 0;
    });

    this.redis.on('ready', () => {
      console.log('🚀 Enhanced rate limiter Redis ready');
      this.isConnected = true;
    });

    this.redis.on('reconnecting', () => {
      console.log('🔄 Enhanced rate limiter Redis reconnecting...');
      this.retryCount++;
    });

    this.redis.on('end', () => {
      console.log('🔌 Enhanced rate limiter Redis connection ended');
      this.isConnected = false;
    });
  }

  private loadLuaScript() {
    try {
      const scriptPath = join(process.cwd(), 'Utils/atomicRateLimit.lua');
      EnhancedRateLimiter.luaScript = readFileSync(scriptPath, 'utf8');
      console.log('✅ Atomic rate limit Lua script loaded successfully');
    } catch (error) {
      console.warn('⚠️ Failed to load external Lua script, using inline version:', error);
      // Bulletproof fallback inline script
      EnhancedRateLimiter.luaScript = `
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        -- Clean expired entries
        redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
        
        -- Always refresh TTL
        redis.call('EXPIRE', key, math.ceil(window / 1000))
        
        -- Get current count
        local current = redis.call('ZCARD', key)
        
        if current < limit then
          -- Add request with unique ID
          local member_id = now .. ":" .. redis.sha1hex(key .. now .. math.random())
          redis.call('ZADD', key, now, member_id)
          return {1, limit - current - 1, now + window}
        else
          return {0, 0, now + window}
        end
      `;
    }
  }

  /**
   * Ensure Redis connection with smart retry logic
   */
  private async ensureConnection(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    // Check if Redis URL is configured
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
      console.log('ℹ️ Redis not configured, skipping rate limiting');
      return false;
    }

    if (this.connectionPromise) {
      try {
        await this.connectionPromise;
        return this.isConnected;
      } catch (error) {
        console.log('ℹ️ Redis connection failed, continuing without rate limiting');
        return false;
      }
    }

    this.connectionPromise = this.connect();
    
    try {
      await this.connectionPromise;
      return this.isConnected;
    } catch (error) {
      console.log('ℹ️ Redis connection failed, continuing without rate limiting');
      return false;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async connect(): Promise<void> {
    try {
      if (!this.redis.isOpen) {
        await this.redis.connect();
      }
    } catch (error) {
      console.log('ℹ️ Redis not available, continuing without rate limiting');
      this.isConnected = false;
      // Don't throw error, just return
    }
  }

  /**
   * Check rate limit with atomic operations - STATIC METHOD
   */
  static async checkLimit(
    redis: RedisClientType, 
    identifier: string, 
    limit: number, 
    windowMs: number,
    category: string = 'general'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const key = `rate_limit:${category}:${identifier}`;
      
      // Redis v4 compatible eval call
      const result = await redis.eval(
        EnhancedRateLimiter.luaScript,
        {
          keys: [key],
          arguments: [limit.toString(), windowMs.toString(), Date.now().toString()]
        }
      ) as [number, number, number];

      return {
        allowed: result[0] === 1,
        remaining: result[1],
        resetTime: result[2]
      };
    } catch (error) {
      console.error('❌ Enhanced rate limit check failed:', error);
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: Date.now() + windowMs 
      }; // Fail closed for safety
    }
  }

  /**
   * Check rate limit for this instance with bulletproof error handling
   */
  async checkLimit(
    identifier: string, 
    limit: number, 
    windowMs: number,
    category: string = 'general'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    this.metrics.requests++;

    // Ensure connection before proceeding
    const connected = await this.ensureConnection();
    if (!connected) {
      console.error('❌ Redis not connected for enhanced rate limiter - failing closed for safety');
      this.metrics.errors++;
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: Date.now() + windowMs 
      };
    }

    try {
      const result = await EnhancedRateLimiter.checkLimit(
        this.redis, 
        identifier, 
        limit, 
        windowMs, 
        category
      );

      // Update metrics
      if (result.allowed) {
        this.metrics.allowed++;
      } else {
        this.metrics.denied++;
      }

      return result;
    } catch (error) {
      console.error('❌ Instance rate limit check failed:', error);
      this.metrics.errors++;
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: Date.now() + windowMs 
      };
    }
  }

  /**
   * Tiered rate limiting for different user types
   */
  async checkTieredLimit(
    apiKey: string,
    endpoint: string,
    userTier: string = 'free'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number; tier: string }> {
    const limits = {
      free: {
        matching: { limit: 5, window: 15 * 60 * 1000 }, // 5 per 15 min
        scraping: { limit: 10, window: 60 * 60 * 1000 }, // 10 per hour
        general: { limit: 50, window: 60 * 60 * 1000 }   // 50 per hour
      },
      premium: {
        matching: { limit: 25, window: 15 * 60 * 1000 }, // 25 per 15 min
        scraping: { limit: 50, window: 60 * 60 * 1000 }, // 50 per hour
        general: { limit: 200, window: 60 * 60 * 1000 }  // 200 per hour
      },
      enterprise: {
        matching: { limit: 100, window: 15 * 60 * 1000 }, // 100 per 15 min
        scraping: { limit: 200, window: 60 * 60 * 1000 }, // 200 per hour
        general: { limit: 1000, window: 60 * 60 * 1000 }  // 1000 per hour
      }
    };

    const config = limits[userTier as keyof typeof limits]?.[endpoint as keyof typeof limits.free] 
                  || limits.free.general;
    
    const result = await this.checkLimit(
      apiKey,
      config.limit,
      config.window,
      endpoint
    );

    return {
      ...result,
      tier: userTier
    };
  }

  /**
   * Get current rate limit status with Redis v4 compatibility
   */
  async getLimitStatus(
    identifier: string, 
    limit: number, 
    windowMs: number,
    category: string = 'general'
  ): Promise<{ current: number; remaining: number; resetTime: number }> {
    const connected = await this.ensureConnection();
    if (!connected) {
      return { current: 0, remaining: limit, resetTime: Date.now() + windowMs };
    }

    const key = `rate_limit:${category}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Redis v4 compatible methods
      await this.redis.zRemRangeByScore(key, 0, windowStart);
      const currentCount = await this.redis.zCard(key);
      
      return {
        current: currentCount,
        remaining: Math.max(0, limit - currentCount),
        resetTime: now + windowMs
      };
    } catch (error) {
      console.error('❌ Failed to get enhanced rate limit status:', error);
      this.metrics.errors++;
      return { current: 0, remaining: limit, resetTime: now + windowMs };
    }
  }

  /**
   * Get global rate limiting statistics
   */
  async getGlobalStats(): Promise<{
    totalRequests: number;
    rejectionRate: number;
    activeKeys: number;
    performance: any;
  }> {
    const connected = await this.ensureConnection();
    if (!connected) {
      return {
        totalRequests: 0,
        rejectionRate: 0,
        activeKeys: 0,
        performance: this.metrics
      };
    }

    try {
      // Get all rate limit keys
      const keys = await this.redis.keys('rate_limit:*');
      let totalRequests = 0;

      for (const key of keys) {
        const count = await this.redis.zCard(key);
        totalRequests += count;
      }

      const rejectionRate = this.metrics.requests > 0 
        ? (this.metrics.denied / this.metrics.requests) * 100 
        : 0;

      return {
        totalRequests,
        rejectionRate: Math.round(rejectionRate * 100) / 100,
        activeKeys: keys.length,
        performance: { ...this.metrics }
      };
    } catch (error) {
      console.error('❌ Failed to get global rate limit stats:', error);
      return {
        totalRequests: 0,
        rejectionRate: 0,
        activeKeys: 0,
        performance: this.metrics
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetLimit(identifier: string, category: string = 'general'): Promise<boolean> {
    const connected = await this.ensureConnection();
    if (!connected) return true;

    const key = `rate_limit:${category}:${identifier}`;
    try {
      await this.redis.del(key);
      console.log(`🧹 Rate limit reset for: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to reset enhanced rate limit:', error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Bulk reset rate limits (admin function)
   */
  async resetAllLimits(pattern: string = 'rate_limit:*'): Promise<number> {
    const connected = await this.ensureConnection();
    if (!connected) return 0;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      await this.redis.del(keys);
      console.log(`🧹 Bulk reset ${keys.length} rate limits`);
      return keys.length;
    } catch (error) {
      console.error('❌ Failed to bulk reset rate limits:', error);
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const successRate = this.metrics.requests > 0 
      ? (this.metrics.allowed / this.metrics.requests) * 100 
      : 100;

    return {
      ...this.metrics,
      successRate: Math.round(successRate * 100) / 100,
      errorRate: this.metrics.requests > 0 
        ? (this.metrics.errors / this.metrics.requests) * 100 
        : 0,
      isConnected: this.isConnected
    };
  }

  /**
   * Health check for monitoring
   */
  async healthCheck(): Promise<{ 
    status: 'healthy' | 'degraded' | 'unhealthy'; 
    details: any 
  }> {
    const metrics = this.getMetrics();
    
    try {
      const connected = await this.ensureConnection();
      
      if (!connected) {
        return {
          status: 'unhealthy',
          details: { 
            connection: false, 
            error: 'Redis connection failed',
            metrics 
          }
        };
      }

      // Test basic Redis operation
      await this.redis.ping();
      
      const errorRate = metrics.errorRate;
      const status = errorRate > 10 ? 'degraded' : 'healthy';

      return {
        status,
        details: {
          connection: true,
          errorRate,
          metrics,
          lastError: errorRate > 0 ? 'Check logs for details' : null
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { 
          connection: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          metrics 
        }
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    console.log('🔌 Closing enhanced rate limiter Redis connection...');
    
    try {
      if (this.isConnected && this.redis.isOpen) {
        await this.redis.quit();
      }
      this.isConnected = false;
      console.log('✅ Enhanced rate limiter Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing enhanced rate limiter Redis connection:', error);
    }
  }

  /**
   * Static cleanup for singleton
   */
  static async cleanup(): Promise<void> {
    if (EnhancedRateLimiter.globalInstance) {
      await EnhancedRateLimiter.globalInstance.close();
    }
  }
}

// Export singleton instance for convenience
export const rateLimiter = EnhancedRateLimiter.getInstance();

// Graceful shutdown handling
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('🔄 Received SIGINT, closing rate limiter...');
    await EnhancedRateLimiter.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('🔄 Received SIGTERM, closing rate limiter...');
    await EnhancedRateLimiter.cleanup();
    process.exit(0);
  });
}