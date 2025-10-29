import { NextRequest, NextResponse } from 'next/server';
import { createUnifiedHandler, RATE_LIMITS } from '@/Utils/api/unified-api-handler';
import { getEnhancedMonitoringManager } from '@/Utils/monitoring/enhanced-monitoring';

export const GET = createUnifiedHandler(async (_req: NextRequest) => {
  const start = Date.now();
  const monitor = getEnhancedMonitoringManager();
  
  // Run comprehensive health checks
  const healthChecks = await monitor.runHealthChecks();
  const healthStatus = monitor.getHealthStatus();
  const dashboard = monitor.getDashboardData();

  const duration = Date.now() - start;
  const healthy = healthStatus.status === 'healthy';

  // Record health check metrics
  monitor.recordHistogram('health.check.duration', duration);
  monitor.incrementCounter('health.check.total', 1, { status: healthStatus.status });

  return NextResponse.json({ 
    ok: healthy,
    status: healthStatus.status,
    checks: healthChecks,
    summary: healthStatus.summary,
    dashboard,
    responseTime: duration,
    timestamp: new Date().toISOString()
  }, { 
    status: healthy ? 200 : 503 
  });
}, {
  rateLimit: RATE_LIMITS.GENERAL,
  allowedMethods: ['GET']
});
