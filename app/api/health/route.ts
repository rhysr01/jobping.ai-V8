import { NextRequest, NextResponse } from 'next/server';
import { productionRateLimiter } from '@/Utils/productionRateLimiter';

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
    // Basic health check without external dependencies
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'operational',
        database: 'unknown', // Will be checked when env vars are set
        redis: 'unknown',    // Will be checked when env vars are set
        openai: 'unknown'    // Will be checked when env vars are set
      }
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
