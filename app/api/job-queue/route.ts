import { NextRequest, NextResponse } from 'next/server';
import { jobQueueManager, JobType } from '@/Utils/jobQueue';
import { SecurityMiddleware } from '@/Utils/securityMiddleware';
import { addSecurityHeaders } from '@/Utils/securityMiddleware';

const securityMiddleware = new SecurityMiddleware();

export async function POST(req: NextRequest) {
  try {
    // Enhanced authentication and rate limiting
    const authResult = await securityMiddleware.authenticate(req);
    
    if (!authResult.success) {
      const response = securityMiddleware.createErrorResponse(
        authResult.error || 'Authentication failed',
        authResult.status || 401
      );
      return addSecurityHeaders(response);
    }

    const body = await req.json();
    const { action, jobType, data, priority = 'normal' } = body;

    if (!action || !jobType) {
      const response = securityMiddleware.createErrorResponse(
        'Missing required fields: action and jobType',
        400
      );
      return addSecurityHeaders(response);
    }

    const runId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    switch (action) {
      case 'add':
        await addJobToQueue(jobType, data, runId, priority);
        break;
      
      case 'stats':
        const stats = await jobQueueManager.getQueueStats();
        const response = securityMiddleware.createSuccessResponse({
          success: true,
          stats,
          timestamp: new Date().toISOString(),
          user: {
            tier: authResult.userData?.tier || 'unknown',
            userId: authResult.userData?.userId || 'unknown'
          }
        }, authResult.rateLimit);
        return addSecurityHeaders(response);
      
      default:
        const errorResponse = securityMiddleware.createErrorResponse(
          'Invalid action. Supported actions: add, stats',
          400
        );
        return addSecurityHeaders(errorResponse);
    }

    const successResponse = securityMiddleware.createSuccessResponse({
      success: true,
      message: `Job added to ${jobType} queue`,
      runId,
      timestamp: new Date().toISOString(),
      user: {
        tier: authResult.userData?.tier || 'unknown',
        userId: authResult.userData?.userId || 'unknown'
      }
    }, authResult.rateLimit);

    return addSecurityHeaders(successResponse);

  } catch (error: any) {
    console.error('❌ Job queue endpoint error:', error);
    const response = securityMiddleware.createErrorResponse(
      'Internal server error',
      500,
      { details: error.message }
    );
    return addSecurityHeaders(response);
  }
}

export async function GET(req: NextRequest) {
  try {
    // Enhanced authentication and rate limiting
    const authResult = await securityMiddleware.authenticate(req);
    
    if (!authResult.success) {
      const response = securityMiddleware.createErrorResponse(
        authResult.error || 'Authentication failed',
        authResult.status || 401
      );
      return addSecurityHeaders(response);
    }

    const stats = await jobQueueManager.getQueueStats();

    const response = securityMiddleware.createSuccessResponse({
      success: true,
      stats,
      endpoints: {
        POST: 'Add jobs to queue or get statistics',
        GET: 'Get queue statistics'
      },
      jobTypes: Object.values(JobType),
      timestamp: new Date().toISOString(),
      user: {
        tier: authResult.userData?.tier || 'unknown',
        userId: authResult.userData?.userId || 'unknown'
      }
    }, authResult.rateLimit);

    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error('❌ Job queue GET endpoint error:', error);
    const response = securityMiddleware.createErrorResponse(
      'Internal server error',
      500,
      { details: error.message }
    );
    return addSecurityHeaders(response);
  }
}

async function addJobToQueue(jobType: string, data: any, runId: string, priority: 'high' | 'normal' | 'low') {
  switch (jobType) {
    case JobType.MATCH_USERS:
      if (!data.userIds || !Array.isArray(data.userIds)) {
        throw new Error('userIds array is required for match-users jobs');
      }
      await jobQueueManager.addMatchUsersJob(data.userIds, runId, priority);
      break;

    case JobType.SEND_EMAILS:
      if (!data.emailData || !Array.isArray(data.emailData)) {
        throw new Error('emailData array is required for send-emails jobs');
      }
      await jobQueueManager.addSendEmailsJob(data.emailData, runId, priority);
      break;

    case JobType.SCRAPE_JOBS:
      if (!data.platforms || !Array.isArray(data.platforms)) {
        throw new Error('platforms array is required for scrape-jobs');
      }
      await jobQueueManager.addScrapeJobsJob(data.platforms, runId, priority);
      break;

    case JobType.CLEANUP_JOBS:
      if (!data.olderThanDays || typeof data.olderThanDays !== 'number') {
        throw new Error('olderThanDays number is required for cleanup-jobs');
      }
      await jobQueueManager.addCleanupJobsJob(data.olderThanDays, runId, priority);
      break;

    default:
      throw new Error(`Unsupported job type: ${jobType}`);
  }
}
