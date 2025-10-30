import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/Utils/databasePool';

const HEALTH_SLO_MS = 100; // SLO: health checks should respond in <100ms

export async function GET(req: NextRequest) {
  const start = Date.now();
  
  try {
    // Simple health checks using existing patterns
    const checks = {
      database: await checkDatabase(),
      environment: checkEnvironment(),
      uptime: process.uptime()
    };

    const duration = Date.now() - start;
    
    // SLO check: warn if health check exceeds target
    if (duration > HEALTH_SLO_MS) {
      console.warn(`Health check SLO violation: ${duration}ms > ${HEALTH_SLO_MS}ms target`);
    }
    
    const healthy = Object.values(checks).every(check => 
      typeof check === 'number' ? true : 
      typeof check === 'boolean' ? check : 
      check.status === 'healthy'
    );

    return NextResponse.json({ 
      ok: healthy,
      status: healthy ? 'healthy' : 'degraded',
      checks,
      responseTime: duration,
      duration: duration, // Add duration for test compatibility
      timestamp: new Date().toISOString(),
      slo: {
        target: HEALTH_SLO_MS,
        actual: duration,
        met: duration <= HEALTH_SLO_MS
      }
    }, { 
      status: healthy ? 200 : 503 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    const duration = Date.now() - start;
    return NextResponse.json({ 
      ok: false,
      status: 'unhealthy',
      error: 'Health check failed',
      responseTime: duration,
      duration: duration,
      slo: {
        target: HEALTH_SLO_MS,
        actual: duration,
        met: duration <= HEALTH_SLO_MS
      }
    }, { status: 503 });
  }
}

async function checkDatabase(): Promise<{ status: string; message: string }> {
  try {
    const supabase = getDatabaseClient();
    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      return { status: 'unhealthy', message: 'Database connection failed' };
    }
    
    return { status: 'healthy', message: 'Database connection OK' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

function checkEnvironment(): { status: string; message: string } {
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPEN_API_KEY', 'RESEND_API_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    return { 
      status: 'unhealthy', 
      message: `Missing environment variables: ${missing.join(', ')}` 
    };
  }
  
  return { status: 'healthy', message: 'All required environment variables present' };
}
