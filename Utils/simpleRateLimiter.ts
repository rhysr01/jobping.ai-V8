// Simple in-memory rate limiter (no Redis required)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class SimpleRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  async checkLimit(
    identifier: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    
    // Get or create entry
    let entry = this.limits.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }
    
    // Increment count
    entry.count++;
    this.limits.set(key, entry);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      this.cleanup();
    }
    
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  async getLimitStatus(identifier: string, limit: number, windowMs: number) {
    const result = await this.checkLimit(identifier, limit, windowMs);
    return {
      ...result,
      limit,
      windowMs
    };
  }

  async resetLimit(identifier: string): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    return this.limits.delete(key);
  }

  async getStats() {
    return {
      totalKeys: this.limits.size,
      totalRequests: Array.from(this.limits.values()).reduce((sum, entry) => sum + entry.count, 0),
      isConnected: true
    };
  }

  async healthCheck() {
    return {
      status: 'healthy' as const,
      details: {
        type: 'in-memory',
        totalKeys: this.limits.size
      }
    };
  }

  async close() {
    this.limits.clear();
  }
}

// Export singleton instance
export const simpleRateLimiter = new SimpleRateLimiter();
