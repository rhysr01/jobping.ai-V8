import { NextResponse } from 'next/server';
import { healthChecker } from '../../../Utils/monitoring/healthChecker';
import { asyncHandler } from '@/lib/errors';

export const GET = asyncHandler(async () => {
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
});