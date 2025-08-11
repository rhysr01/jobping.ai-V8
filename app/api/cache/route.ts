import { NextRequest, NextResponse } from 'next/server';
import { enhancedAIMatchingCache } from '@/Utils/enhancedCache';
import { SecurityMiddleware } from '@/Utils/securityMiddleware';
import { addSecurityHeaders } from '@/Utils/securityMiddleware';

const securityMiddleware = new SecurityMiddleware();

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

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = enhancedAIMatchingCache.getStats();
      
      const response = securityMiddleware.createSuccessResponse({
        success: true,
        cache: 'ai-matching',
        stats,
        timestamp: new Date().toISOString(),
        user: {
          tier: authResult.userData?.tier || 'unknown',
          userId: authResult.userData?.userId || 'unknown'
        }
      }, authResult.rateLimit);
      
      return addSecurityHeaders(response);
    }

    // Default: return cache info
    const stats = enhancedAIMatchingCache.getStats();
    const size = stats.size || 0;

    const response = securityMiddleware.createSuccessResponse({
      success: true,
      cache: 'ai-matching',
      info: {
        size,
        hitRate: stats.hitRate,
        avgTTL: stats.avgTTL,
        totalHits: stats.hits,
        totalMisses: stats.misses,
        evictions: stats.evictions
      },
      endpoints: {
        GET: 'Get cache information and statistics',
        POST: 'Cache management actions (clear, reset)'
      },
      actions: ['stats', 'clear', 'reset'],
      timestamp: new Date().toISOString(),
      user: {
        tier: authResult.userData?.tier || 'unknown',
        userId: authResult.userData?.userId || 'unknown'
      }
    }, authResult.rateLimit);

    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error('❌ Cache endpoint error:', error);
    const response = securityMiddleware.createErrorResponse(
      'Internal server error',
      500,
      { details: error.message }
    );
    return addSecurityHeaders(response);
  }
}

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
    const { action } = body;

    if (!action) {
      const response = securityMiddleware.createErrorResponse(
        'Missing required field: action',
        400
      );
      return addSecurityHeaders(response);
    }

    switch (action) {
      case 'clear':
        await enhancedAIMatchingCache.clearCache();
        break;
      
      case 'reset':
        await enhancedAIMatchingCache.clearCache();
        // Reset would also reset statistics, but we'll keep it simple for now
        break;
      
      default:
        const errorResponse = securityMiddleware.createErrorResponse(
          'Invalid action. Supported actions: clear, reset',
          400
        );
        return addSecurityHeaders(errorResponse);
    }

    const successResponse = securityMiddleware.createSuccessResponse({
      success: true,
      message: `Cache ${action} completed successfully`,
      timestamp: new Date().toISOString(),
      user: {
        tier: authResult.userData?.tier || 'unknown',
        userId: authResult.userData?.userId || 'unknown'
      }
    }, authResult.rateLimit);

    return addSecurityHeaders(successResponse);

  } catch (error: any) {
    console.error('❌ Cache POST endpoint error:', error);
    const response = securityMiddleware.createErrorResponse(
      'Internal server error',
      500,
      { details: error.message }
    );
    return addSecurityHeaders(response);
  }
}
