import { NextResponse } from 'next/server';
import { healthChecker } from '../../../Utils/monitoring/healthChecker';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Perform comprehensive health check
    const healthResult = await healthChecker.performHealthCheck();
    
    // Determine HTTP status based on health result
    let httpStatus = 200;
    if (healthResult.status === 'degraded') {
      httpStatus = 200; // Still operational but degraded
    } else if (healthResult.status === 'unhealthy') {
      httpStatus = 503; // Service unavailable
    }

    return NextResponse.json(healthResult, { status: httpStatus });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'unhealthy', 
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    }, { status: 500 });
  }
}