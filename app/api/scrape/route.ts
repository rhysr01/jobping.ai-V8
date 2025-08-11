import { NextRequest, NextResponse } from 'next/server';
import { scrapeGreenhouse } from '../../../scrapers/greenhouse';
import { scrapeLever } from '../../../scrapers/lever';
import { scrapeWorkday } from '../../../scrapers/workday';
import { scrapeRemoteOK } from '../../../scrapers/remoteok';
import { atomicUpsertJobs } from '../../../Utils/jobMatching';
import { SecurityMiddleware, addSecurityHeaders, extractUserData, extractRateLimit } from '../../../Utils/securityMiddleware';
import crypto from 'crypto';

// Initialize security middleware
const securityMiddleware = new SecurityMiddleware();

// Company configurations for different platforms
const COMPANIES = {
  greenhouse: [
    { name: 'Stripe', url: 'https://stripe.com/jobs', platform: 'greenhouse' as const },
    { name: 'Notion', url: 'https://notion.so/careers', platform: 'greenhouse' as const },
    { name: 'Figma', url: 'https://figma.com/careers', platform: 'greenhouse' as const },
  ],
  lever: [
    { name: 'Linear', url: 'https://linear.app/careers', platform: 'lever' as const },
    { name: 'Vercel', url: 'https://vercel.com/careers', platform: 'lever' as const },
    { name: 'Railway', url: 'https://railway.app/careers', platform: 'lever' as const },
  ],
  workday: [
    { name: 'Google', url: 'https://careers.google.com/jobs', platform: 'workday' as const },
    { name: 'Microsoft', url: 'https://careers.microsoft.com/jobs', platform: 'workday' as const },
  ]
};

export async function POST(req: NextRequest) {
  try {
    // Enhanced authentication and rate limiting
    const authResult = await securityMiddleware.authenticate(req);
    
    if (!authResult.success) {
      const response = securityMiddleware.createErrorResponse(
        authResult.error || 'Authentication failed',
        authResult.status || 401,
        authResult.rateLimit ? { retryAfter: authResult.rateLimit.retryAfter } : undefined
      );
      return addSecurityHeaders(response);
    }

    // Extract user data and rate limit info
    const userData = authResult.userData;
    const rateLimit = authResult.rateLimit;

    // Log the scrape request
    console.log(`🚀 Scrape request from user ${userData?.userId || 'unknown'} (tier: ${userData?.tier || 'unknown'})`);

    const { platforms = ['all'], companies = [] } = await req.json();
    const runId = crypto.randomUUID();
    const results: any = {};

    console.log(`🚀 Starting scrape run ${runId} for platforms: ${platforms.join(', ')}`);

    // Scrape RemoteOK (always included)
    if (platforms.includes('all') || platforms.includes('remoteok')) {
      console.log('📡 Scraping RemoteOK...');
      try {
        const remoteOKJobs = await scrapeRemoteOK(runId);
        const result = await atomicUpsertJobs(remoteOKJobs);
        results.remoteok = {
          success: result.success,
          jobs: remoteOKJobs.length,
          inserted: result.inserted,
          updated: result.updated,
          errors: result.errors
        };
        console.log(`✅ RemoteOK: ${remoteOKJobs.length} jobs processed`);
      } catch (error: any) {
        results.remoteok = { success: false, error: error.message };
        console.error('❌ RemoteOK scrape failed:', error.message);
      }
    }

    // Scrape Greenhouse companies - TEMPORARILY DISABLED
    if (platforms.includes('all') || platforms.includes('greenhouse')) {
      console.log('📡 Scraping Greenhouse companies... (DISABLED)');
      results.greenhouse = {
        success: false,
        error: 'Scraping temporarily disabled for production build'
      };
    }

    // Scrape Lever companies - TEMPORARILY DISABLED
    if (platforms.includes('all') || platforms.includes('lever')) {
      console.log('📡 Scraping Lever companies... (DISABLED)');
      results.lever = {
        success: false,
        error: 'Scraping temporarily disabled for production build'
      };
    }

    // Scrape Workday companies - TEMPORARILY DISABLED
    if (platforms.includes('all') || platforms.includes('workday')) {
      console.log('📡 Scraping Workday companies... (DISABLED)');
      results.workday = {
        success: false,
        error: 'Scraping temporarily disabled for production build'
      };
    }

    // Scrape GraduateJobs - NEW EU SCRAPER
    if (platforms.includes('graduatejobs') || platforms.includes('all')) {
      try {
        console.log('🎓 Scraping GraduateJobs...');
        const { scrapeGraduateJobs } = await import('@/scrapers/graduatejobs');
        const graduateJobs = await scrapeGraduateJobs(runId);
        results.graduatejobs = {
          success: true,
          jobs: graduateJobs.length,
          inserted: graduateJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ GraduateJobs: ${graduateJobs.length} jobs processed`);
      } catch (error: any) {
        results.graduatejobs = { success: false, error: error.message };
        console.error('❌ GraduateJobs scrape failed:', error.message);
      }
    }

    // Scrape Graduateland - NEW EU SCRAPER
    if (platforms.includes('graduateland') || platforms.includes('all')) {
      try {
        console.log('🎓 Scraping Graduateland...');
        const { scrapeGraduateland } = await import('@/scrapers/graduateland');
        const graduatelandJobs = await scrapeGraduateland(runId);
        results.graduateland = {
          success: true,
          jobs: graduatelandJobs.length,
          inserted: graduatelandJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ Graduateland: ${graduatelandJobs.length} jobs processed`);
      } catch (error: any) {
        results.graduateland = { success: false, error: error.message };
        console.error('❌ Graduateland scrape failed:', error.message);
      }
    }

    // Scrape iAgora - NEW EU SCRAPER
    if (platforms.includes('iagora') || platforms.includes('all')) {
      try {
        console.log('🌍 Scraping iAgora...');
        const { scrapeIAgora } = await import('@/scrapers/iagora');
        const iagoraJobs = await scrapeIAgora(runId);
        results.iagora = {
          success: true,
          jobs: iagoraJobs.length,
          inserted: iagoraJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ iAgora: ${iagoraJobs.length} jobs processed`);
      } catch (error: any) {
        results.iagora = { success: false, error: error.message };
        console.error('❌ iAgora scrape failed:', error.message);
      }
    }

    // Scrape SmartRecruiters - NEW EU SCRAPER
    if (platforms.includes('smartrecruiters') || platforms.includes('all')) {
      try {
        console.log('🏢 Scraping SmartRecruiters...');
        const { scrapeSmartRecruiters } = await import('@/scrapers/smartrecruiters');
        const smartRecruitersJobs = await scrapeSmartRecruiters(runId);
        results.smartrecruiters = {
          success: true,
          jobs: smartRecruitersJobs.length,
          inserted: smartRecruitersJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ SmartRecruiters: ${smartRecruitersJobs.length} jobs processed`);
      } catch (error: any) {
        results.smartrecruiters = { success: false, error: error.message };
        console.error('❌ SmartRecruiters scrape failed:', error.message);
      }
    }

    // Scrape Wellfound - NEW EU SCRAPER
    if (platforms.includes('wellfound') || platforms.includes('all')) {
      try {
        console.log('🚀 Scraping Wellfound...');
        const { scrapeWellfound } = await import('@/scrapers/wellfound');
        const wellfoundJobs = await scrapeWellfound(runId);
        results.wellfound = {
          success: true,
          jobs: wellfoundJobs.length,
          inserted: wellfoundJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ Wellfound: ${wellfoundJobs.length} jobs processed`);
      } catch (error: any) {
        results.wellfound = { success: false, error: error.message };
        console.error('❌ Wellfound scrape failed:', error.message);
      }
    }

    console.log(`✅ Scrape run ${runId} completed`);

    // Create success response with rate limit headers
    const response = securityMiddleware.createSuccessResponse({
      success: true,
      runId,
      timestamp: new Date().toISOString(),
      results,
      user: {
        tier: userData?.tier || 'unknown',
        userId: userData?.userId || 'unknown'
      }
    }, rateLimit);

    return addSecurityHeaders(response);

  } catch (error: any) {
    console.error('❌ Scrape endpoint error:', error);
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

    const response = securityMiddleware.createSuccessResponse({
      message: 'Scrape API active',
      endpoints: {
        POST: 'Trigger scraping for specified platforms',
        GET: 'API status'
      },
      platforms: ['remoteok', 'greenhouse', 'lever', 'workday', 'graduatejobs', 'graduateland', 'iagora', 'smartrecruiters', 'wellfound', 'all'],
      timestamp: new Date().toISOString(),
      user: {
        tier: authResult.userData?.tier || 'unknown',
        userId: authResult.userData?.userId || 'unknown'
      }
    }, authResult.rateLimit);

    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error('❌ Scrape GET endpoint error:', error);
    const response = securityMiddleware.createErrorResponse(
      'Internal server error',
      500,
      { details: error.message }
    );
    return addSecurityHeaders(response);
  }
}
