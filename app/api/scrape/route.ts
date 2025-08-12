import { NextRequest, NextResponse } from 'next/server';
import { scrapeGreenhouse } from '../../../scrapers/greenhouse';
import { scrapeLever } from '../../../scrapers/lever';
import { scrapeWorkday } from '../../../scrapers/workday';
import { scrapeRemoteOK } from '../../../scrapers/remoteok';
import { atomicUpsertJobs } from '../../../Utils/jobMatching';
import { runReliableScrapers } from '../../../Utils/reliableScrapers';
import { SecurityMiddleware, addSecurityHeaders, extractUserData, extractRateLimit } from '../../../Utils/securityMiddleware';
import crypto from 'crypto';

// Initialize security middleware
const securityMiddleware = new SecurityMiddleware();

// Company configurations for different platforms
const COMPANIES = {
  greenhouse: [
    { name: 'Stripe', url: 'https://boards.greenhouse.io/stripe', platform: 'greenhouse' as const },
    { name: 'Airbnb', url: 'https://boards.greenhouse.io/airbnb', platform: 'greenhouse' as const },
    { name: 'Shopify', url: 'https://boards.greenhouse.io/shopify', platform: 'greenhouse' as const },
  ],
  lever: [
    { name: 'Netflix', url: 'https://jobs.lever.co/netflix', platform: 'lever' as const },
    { name: 'Uber', url: 'https://jobs.lever.co/uber', platform: 'lever' as const },
    { name: 'Postmates', url: 'https://jobs.lever.co/postmates', platform: 'lever' as const },
  ],
  workday: [
    { name: 'Coinbase', url: 'https://coinbase.wd12.myworkdayjobs.com/External', platform: 'workday' as const },
    { name: 'Tesla', url: 'https://tesla.wd12.myworkdayjobs.com/External', platform: 'workday' as const },
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

    // NEW: Reliable Scrapers System (fast, no hanging)
    if (platforms.includes('all') || platforms.includes('reliable')) {
      console.log('🎯 Running reliable scraper system...');
      try {
        const reliableJobs = await runReliableScrapers(runId);
        const result = await atomicUpsertJobs(reliableJobs);
        results.reliable = {
          success: result.success,
          jobs: reliableJobs.length,
          inserted: result.inserted,
          updated: result.updated,
          errors: result.errors
        };
        console.log(`✅ Reliable scrapers: ${reliableJobs.length} jobs processed`);
      } catch (error: any) {
        results.reliable = { success: false, error: error.message };
        console.error('❌ Reliable scrapers failed:', error.message);
      }
    }

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

    // Scrape Greenhouse companies
    if (platforms.includes('all') || platforms.includes('greenhouse')) {
      console.log('📡 Scraping Greenhouse companies...');
      try {
        let allGreenhouseJobs: any[] = [];
        
        for (const company of COMPANIES.greenhouse) {
          try {
            const companyJobs = await scrapeGreenhouse(company, runId);
            allGreenhouseJobs = allGreenhouseJobs.concat(companyJobs);
            console.log(`🏢 ${company.name}: ${companyJobs.length} jobs found`);
          } catch (error: any) {
            console.error(`❌ ${company.name} failed:`, error.message);
          }
        }
        
        const result = await atomicUpsertJobs(allGreenhouseJobs);
        results.greenhouse = {
          success: result.success,
          jobs: allGreenhouseJobs.length,
          inserted: result.inserted,
          updated: result.updated,
          errors: result.errors
        };
        console.log(`✅ Greenhouse: ${allGreenhouseJobs.length} jobs processed`);
      } catch (error: any) {
        results.greenhouse = { success: false, error: error.message };
        console.error('❌ Greenhouse scrape failed:', error.message);
      }
    }

    // Scrape Lever companies
    if (platforms.includes('all') || platforms.includes('lever')) {
      console.log('📡 Scraping Lever companies...');
      try {
        let allLeverJobs: any[] = [];
        
        for (const company of COMPANIES.lever) {
          try {
            const companyJobs = await scrapeLever(company, runId);
            allLeverJobs = allLeverJobs.concat(companyJobs);
            console.log(`🏢 ${company.name}: ${companyJobs.length} jobs found`);
          } catch (error: any) {
            console.error(`❌ ${company.name} failed:`, error.message);
          }
        }
        
        const result = await atomicUpsertJobs(allLeverJobs);
        results.lever = {
          success: result.success,
          jobs: allLeverJobs.length,
          inserted: result.inserted,
          updated: result.updated,
          errors: result.errors
        };
        console.log(`✅ Lever: ${allLeverJobs.length} jobs processed`);
      } catch (error: any) {
        results.lever = { success: false, error: error.message };
        console.error('❌ Lever scrape failed:', error.message);
      }
    }

    // Scrape Workday companies
    if (platforms.includes('all') || platforms.includes('workday')) {
      console.log('📡 Scraping Workday companies...');
      try {
        let allWorkdayJobs: any[] = [];
        
        for (const company of COMPANIES.workday) {
          try {
            const companyJobs = await scrapeWorkday(company, runId);
            allWorkdayJobs = allWorkdayJobs.concat(companyJobs);
            console.log(`🏢 ${company.name}: ${companyJobs.length} jobs found`);
          } catch (error: any) {
            console.error(`❌ ${company.name} failed:`, error.message);
          }
        }
        
        const result = await atomicUpsertJobs(allWorkdayJobs);
        results.workday = {
          success: result.success,
          jobs: allWorkdayJobs.length,
          inserted: result.inserted,
          updated: result.updated,
          errors: result.errors
        };
        console.log(`✅ Workday: ${allWorkdayJobs.length} jobs processed`);
      } catch (error: any) {
        results.workday = { success: false, error: error.message };
        console.error('❌ Workday scrape failed:', error.message);
      }
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
      platforms: ['reliable', 'remoteok', 'greenhouse', 'lever', 'workday', 'graduatejobs', 'graduateland', 'iagora', 'smartrecruiters', 'wellfound', 'all'],
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
