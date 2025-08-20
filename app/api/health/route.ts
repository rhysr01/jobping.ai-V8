import { NextRequest, NextResponse } from 'next/server';
import { productionRateLimiter } from '@/Utils/productionRateLimiter';
import { createClient } from '@supabase/supabase-js';
import { createClient as createRedisClient } from 'redis';
import OpenAI from 'openai';
import { PerformanceMonitor } from '@/Utils/performanceMonitor';
import { getScraperConfig, logScraperConfig } from '@/Utils/scraperConfig';

// Helper function to check Supabase health
async function checkSupabaseHealth(): Promise<'healthy' | 'degraded' | 'critical'> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return 'critical';
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Simple query to test connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase health check error:', error);
      return 'degraded';
    }
    
    return 'healthy';
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return 'critical';
  }
}

// Helper function to check Redis health
async function checkRedisHealth(): Promise<'healthy' | 'degraded' | 'critical'> {
  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      return 'critical';
    }
    
    const redis = createRedisClient({ url: redisUrl });
    
    // Set a test key with short TTL
    await redis.set('health_check', 'ok', { EX: 10 });
    const result = await redis.get('health_check');
    await redis.quit();
    
    if (result === 'ok') {
      return 'healthy';
    } else {
      return 'degraded';
    }
  } catch (error) {
    console.error('Redis health check failed:', error);
    return 'critical';
  }
}

// Helper function to check OpenAI health
async function checkOpenAIHealth(): Promise<'healthy' | 'degraded' | 'critical'> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      return 'critical';
    }
    
    const openai = new OpenAI({ apiKey: openaiKey });
    
    // Simple API call to test connection
    const response = await openai.models.list();
    
    if (response && response.data) {
      return 'healthy';
    } else {
      return 'degraded';
    }
  } catch (error) {
    console.error('OpenAI health check failed:', error);
    return 'degraded';
  }
}

// Helper function to check Resend health
async function checkResendHealth(): Promise<'healthy' | 'degraded' | 'critical'> {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    
    if (!resendKey) {
      return 'critical';
    }
    
    const { Resend } = require('resend');
    const resend = new Resend(resendKey);
    
    // Simple API call to test connection (list domains)
    const response = await resend.domains.list();
    
    if (response && response.data) {
      return 'healthy';
    } else {
      return 'degraded';
    }
  } catch (error) {
    console.error('Resend health check failed:', error);
    return 'degraded';
  }
}

// Helper function to get scraper status
function getScraperStatus() {
  const config = getScraperConfig();
  
  return {
    platforms: {
      greenhouse: config.enableGreenhouse,
      lever: config.enableLever,
      workday: config.enableWorkday,
      remoteok: config.enableRemoteOK,
      reliable: config.enableReliableScrapers,
      university: config.enableUniversityScrapers
    },
    features: {
      debugMode: config.debugMode,
      telemetry: config.enableTelemetry,
      rateLimiting: config.enableRateLimiting,
      browserPool: config.enableBrowserPool
    },
    settings: {
      batchSize: config.batchSize,
      maxRetries: config.maxRetries,
      requestsPerMinute: config.requestsPerMinute
    }
  };
}

// Helper function to get performance metrics
function getPerformanceMetrics() {
  const report = PerformanceMonitor.getPerformanceReport();
  
  return {
    operations: Object.keys(report),
    summary: {
      totalOperations: Object.keys(report).length,
      averageLatency: Object.values(report).reduce((sum: any, op: any) => 
        sum + (op.average || 0), 0) / Math.max(Object.keys(report).length, 1)
    },
    topOperations: Object.entries(report)
      .map(([name, stats]: [string, any]) => ({
        name,
        average: stats.average || 0,
        count: stats.count || 0
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5)
  };
}

export async function GET(req: NextRequest) {
  // PRODUCTION: Rate limiting for health endpoint (higher limit for monitoring)
  const rateLimitResult = await productionRateLimiter.middleware(req, 'default', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute for health checks
  });
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const startTime = Date.now();
    
    // Check all dependencies in parallel
    const [supabaseHealth, redisHealth, openaiHealth, resendHealth] = await Promise.allSettled([
      checkSupabaseHealth(),
      checkRedisHealth(),
      checkOpenAIHealth(),
      checkResendHealth()
    ]);
    
    const healthCheckTime = Date.now() - startTime;
    
    // Determine overall status
    const services = {
      api: 'operational',
      database: supabaseHealth.status === 'fulfilled' ? supabaseHealth.value : 'critical',
      redis: redisHealth.status === 'fulfilled' ? redisHealth.value : 'critical',
      openai: openaiHealth.status === 'fulfilled' ? openaiHealth.value : 'critical',
      resend: resendHealth.status === 'fulfilled' ? resendHealth.value : 'critical'
    };
    
    const criticalServices = Object.values(services).filter(s => s === 'critical').length;
    const overallStatus = criticalServices === 0 ? 'healthy' : 
                         criticalServices <= 1 ? 'degraded' : 'critical';
    
    // Get git SHA for version tracking
    const getGitSHA = () => {
      try {
        const { execSync } = require('child_process');
        return execSync('git rev-parse --short HEAD').toString().trim();
      } catch {
        return 'unknown';
      }
    };

    // Build comprehensive health response
    const health = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      gitSHA: getGitSHA(),
      responseTime: healthCheckTime,
      services,
      scraper: getScraperStatus(),
      performance: getPerformanceMetrics(),
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasRedisUrl: !!process.env.REDIS_URL,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasScrapeApiKey: !!process.env.SCRAPE_API_KEY,
        hasResendKey: !!process.env.RESEND_API_KEY
      }
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'critical', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}
