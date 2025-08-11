import { StatsD } from 'hot-shots';

// Simplified Datadog StatsD client for immediate production monitoring
export const dogstatsd = new StatsD();

/**
 * Production-ready metrics collector for Datadog monitoring
 * Tracks: cache hit rate, p95 latency, error rates, scraper performance
 */
export class DatadogMetrics {
  
  // Cache metrics for 60% hit rate target
  static trackCacheHit(cacheType: 'ai-matching' | 'rate-limit' | 'general' = 'general') {
    dogstatsd.increment('cache.hits', 1, [`cache_type:${cacheType}`]);
  }
  
  static trackCacheMiss(cacheType: 'ai-matching' | 'rate-limit' | 'general' = 'general') {
    dogstatsd.increment('cache.misses', 1, [`cache_type:${cacheType}`]);
  }
  
  // Latency metrics for p95 <20s target
  static trackMatchingLatency(durationMs: number, userCount: number = 1) {
    dogstatsd.histogram('match.latency', durationMs, [`user_count:${userCount}`]);
    dogstatsd.timing('match.duration', durationMs);
  }
  
  static trackAPILatency(endpoint: string, durationMs: number, statusCode: number) {
    dogstatsd.histogram('api.latency', durationMs, [
      `endpoint:${endpoint}`, 
      `status:${statusCode}`,
      `status_class:${Math.floor(statusCode / 100)}xx`
    ]);
  }
  
  // Error rate metrics for <1% target
  static trackAPIError(endpoint: string, errorType: string, statusCode: number = 500) {
    dogstatsd.increment('api.errors', 1, [
      `endpoint:${endpoint}`, 
      `error_type:${errorType}`,
      `status:${statusCode}`
    ]);
  }
  
  static trackAPISuccess(endpoint: string, statusCode: number = 200) {
    dogstatsd.increment('api.requests', 1, [
      `endpoint:${endpoint}`, 
      `status:${statusCode}`,
      `result:success`
    ]);
  }
  
  // Scraper performance metrics
  static trackScraperJob(
    platform: string, 
    jobsFound: number, 
    durationMs: number, 
    success: boolean
  ) {
    dogstatsd.increment('scraper.runs', 1, [
      `platform:${platform}`, 
      `result:${success ? 'success' : 'failure'}`
    ]);
    dogstatsd.gauge('scraper.jobs_found', jobsFound, [`platform:${platform}`]);
    dogstatsd.histogram('scraper.duration', durationMs, [`platform:${platform}`]);
  }
  
  // Job queue metrics
  static trackJobQueueLatency(jobType: string, durationMs: number) {
    dogstatsd.histogram('queue.job_duration', durationMs, [`job_type:${jobType}`]);
  }
  
  static trackJobQueueBackoff(jobType: string, attemptNumber: number) {
    dogstatsd.increment('queue.backoff', 1, [
      `job_type:${jobType}`, 
      `attempt:${attemptNumber}`
    ]);
  }
  
  // Rate limiting metrics
  static trackRateLimit(endpoint: string, allowed: boolean, remaining: number) {
    dogstatsd.increment('rate_limit.requests', 1, [
      `endpoint:${endpoint}`, 
      `result:${allowed ? 'allowed' : 'blocked'}`
    ]);
    dogstatsd.gauge('rate_limit.remaining', remaining, [`endpoint:${endpoint}`]);
  }
  
  // Business metrics
  static trackUserRegistration(source: string = 'tally') {
    dogstatsd.increment('business.user_registrations', 1, [`source:${source}`]);
  }
  
  static trackMatchDelivery(userEmail: string, matchCount: number, tier: string) {
    dogstatsd.increment('business.matches_delivered', 1, [`tier:${tier}`]);
    dogstatsd.gauge('business.matches_per_delivery', matchCount, [`tier:${tier}`]);
  }
  
  // System health metrics
  static trackMemoryUsage() {
    const usage = process.memoryUsage();
    dogstatsd.gauge('system.memory.rss', usage.rss);
    dogstatsd.gauge('system.memory.heap_used', usage.heapUsed);
    dogstatsd.gauge('system.memory.heap_total', usage.heapTotal);
  }
  
  static trackRedisConnection(service: string, connected: boolean) {
    dogstatsd.gauge('redis.connected', connected ? 1 : 0, [`service:${service}`]);
  }
  
  // Utility method for custom metrics
  static custom(metricName: string, value: number, tags: string[] = []) {
    dogstatsd.gauge(metricName, value, tags);
  }
  
  // Graceful shutdown
  static close(): Promise<void> {
    return new Promise((resolve) => {
      dogstatsd.close((error) => {
        if (error) {
          console.error('Error closing Datadog client:', error);
        }
        resolve();
      });
    });
  }
}

// Export singleton instance
export const metrics = DatadogMetrics;
