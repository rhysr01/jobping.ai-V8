import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { HTTP_STATUS } from '@/Utils/constants';
import { Resend } from 'resend';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Database configuration missing',
        timestamp: new Date().toISOString()
      }, { status: HTTP_STATUS.INTERNAL_ERROR });
    }
    
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    
    // Simple database health check
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      // Alert for database issues
      // await criticalAlerts.alertDatabaseIssue('health_check', error.message);
      
      return NextResponse.json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: HTTP_STATUS.INTERNAL_ERROR });
    }
    
    // Check email readiness
    async function checkEmailReadiness() {
      const checks = {
        resendApiKey: !!process.env.RESEND_API_KEY,
        resendDnsVerified: !!process.env.RESEND_DNS_VERIFIED || false,
        unsubscribeSecret: !!process.env.UNSUBSCRIBE_SECRET,
        systemApiKey: !!process.env.SYSTEM_API_KEY,
        resendWebhookSecret: !!process.env.RESEND_WEBHOOK_SECRET
      };
      
      // Test Resend connection if API key exists
      let resendConnected = false;
      if (checks.resendApiKey) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY!);
          // Try to get domains to test connection
          await resend.domains.list();
          resendConnected = true;
        } catch (error) {
          console.warn('Resend connection test failed:', error);
        }
      }
      
      const emailReady = Object.values(checks).every(Boolean) && resendConnected;
      
      return {
        ready: emailReady,
        checks: {
          ...checks,
          resendConnected
        }
      };
    }

    // Check environment variables
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'RAPIDAPI_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Missing required environment variables',
        missing: missingEnvVars,
        timestamp: new Date().toISOString()
      }, { status: HTTP_STATUS.INTERNAL_ERROR });
    }
    
    // Check email system readiness
    const emailStatus = await checkEmailReadiness();
    
    // Check alerting system status
    // const alertStatus = criticalAlerts.getStatus();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({ 
      status: emailStatus.ready ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      email: {
        ready: emailStatus.ready,
        ...emailStatus.checks
      },
      alerting: {
        slackConfigured: false,
        emailConfigured: emailStatus.ready,
        openaiBudgetLimit: false
      },
      uptime: process.uptime()
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Alert for health check failures
    // await criticalAlerts.alertApiFailure(
    //   '/api/health', 
    //   error instanceof Error ? error.message : String(error),
    //   500
    // );
    
    return NextResponse.json({ 
      status: 'error', 
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}