import { StatsD } from 'hot-shots';

// Lazy Datadog StatsD client to avoid test mode connections
let dogstatsd: StatsD | null = null;
let isInitialized = false;

function getDogstatsd(): StatsD {
  if (!dogstatsd) {
    // Skip Datadog initialization in test mode
    if (process.env.NODE_ENV === 'test' || process.env.JOBPING_TEST_MODE === '1') {
      console.log('🧪 Test mode: Skipping Datadog initialization');
      // Return a mock StatsD client for tests
      dogstatsd = {
        increment: () => {},
        histogram: () => {},
        timing: () => {},
        gauge: () => {},
        close: () => {}
      } as any;
    } else {
      dogstatsd = new StatsD();
    }
    isInitialized = true;
  }
  return dogstatsd;
}

export { getDogstatsd as dogstatsd };

export async function teardownDatadog() {
  if (dogstatsd && isInitialized) {
    try {
      dogstatsd.close();
      console.log('🔌 Datadog client closed');
    } catch (error) {
      console.error('❌ Error closing Datadog client:', error);
    }
  }
  dogstatsd = null;
  isInitialized = false;
}

/**
 * Production-ready metrics collector for Datadog monitoring
 * Tracks: cache hit rate, p95 latency, error rates, scraper performance
 */
export class DatadogMetrics {
  
  // Cache metrics for 60% hit rate target
  static trackCacheHit(cacheType: 'ai-matching' | 'rate-limit' | 'general' = 'general') {
    getDogstatsd().increment('cache.hits', 1, [`cache_type:${cacheType}`]);
  }
  
  static trackCacheMiss(cacheType: 'ai-matching' | 'rate-limit' | 'general' = 'general') {
    getDogstatsd().increment('cache.misses', 1, [`cache_type:${cacheType}`]);
  }
  
  // Latency metrics for p95 <20s target
  static trackMatchingLatency(durationMs: number, userCount: number = 1) {
    getDogstatsd().histogram('match.latency', durationMs, [`user_count:${userCount}`]);
    getDogstatsd().timing('match.duration', durationMs);
  }
  
  static trackAPILatency(endpoint: string, durationMs: number, statusCode: number) {
    getDogstatsd().histogram('api.latency', durationMs, [
      `endpoint:${endpoint}`, 
      `status:${statusCode}`,
      `status_class:${Math.floor(statusCode / 100)}xx`
    ]);
  }
  
  // Error rate metrics for <1% target
  static trackAPIError(endpoint: string, errorType: string, statusCode: number = 500) {
    getDogstatsd().increment('api.errors', 1, [
      `endpoint:${endpoint}`, 
      `error_type:${errorType}`,
      `status:${statusCode}`
    ]);
  }
  
  static trackAPISuccess(endpoint: string, statusCode: number = 200) {
    getDogstatsd().increment('api.requests', 1, [
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
    getDogstatsd().increment('scraper.runs', 1, [
      `platform:${platform}`, 
      `result:${success ? 'success' : 'failure'}`
    ]);
    getDogstatsd().gauge('scraper.jobs_found', jobsFound, [`platform:${platform}`]);
    getDogstatsd().histogram('scraper.duration', durationMs, [`platform:${platform}`]);
  }
  
  // Job queue metrics
  static trackJobQueueLatency(jobType: string, durationMs: number) {
    getDogstatsd().histogram('queue.job_duration', durationMs, [`job_type:${jobType}`]);
  }
  
  static trackJobQueueBackoff(jobType: string, attemptNumber: number) {
    getDogstatsd().increment('queue.backoff', 1, [
      `job_type:${jobType}`, 
      `attempt:${attemptNumber}`
    ]);
  }
  
  // Rate limiting metrics
  static trackRateLimit(endpoint: string, allowed: boolean, remaining: number) {
    getDogstatsd().increment('rate_limit.requests', 1, [
      `endpoint:${endpoint}`, 
      `result:${allowed ? 'allowed' : 'blocked'}`
    ]);
    getDogstatsd().gauge('rate_limit.remaining', remaining, [`endpoint:${endpoint}`]);
  }
  
  // Business metrics
  static trackUserRegistration(source: string = 'tally') {
    getDogstatsd().increment('business.user_registrations', 1, [`source:${source}`]);
  }
  
  static trackMatchDelivery(userEmail: string, matchCount: number, tier: string) {
    getDogstatsd().increment('business.matches_delivered', 1, [`tier:${tier}`]);
    getDogstatsd().gauge('business.matches_per_delivery', matchCount, [`tier:${tier}`]);
  }
  
  // System health metrics
  static trackMemoryUsage() {
    const usage = process.memoryUsage();
    getDogstatsd().gauge('system.memory.rss', usage.rss);
    getDogstatsd().gauge('system.memory.heap_used', usage.heapUsed);
    getDogstatsd().gauge('system.memory.heap_total', usage.heapTotal);
  }
  
  static trackRedisConnection(service: string, connected: boolean) {
    getDogstatsd().gauge('redis.connected', connected ? 1 : 0, [`service:${service}`]);
  }
  
  // Utility method for custom metrics
  static custom(metricName: string, value: number, tags: string[] = []) {
    getDogstatsd().gauge(metricName, value, tags);
  }
  
  // Graceful shutdown
  static close(): Promise<void> {
    return new Promise((resolve) => {
      getDogstatsd().close((error) => {
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
