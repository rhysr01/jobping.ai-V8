import { NextRequest, NextResponse } from 'next/server';
import { scrapeGreenhouse } from '../../../scrapers/greenhouse';
import { scrapeLever } from '../../../scrapers/lever';
import { scrapeWorkday } from '../../../scrapers/workday';
import { scrapeRemoteOK } from '../../../scrapers/remoteok';
import { atomicUpsertJobs } from '../../../Utils/jobMatching';
import { runReliableScrapers } from '../../../Utils/reliableScrapers';
import { SecurityMiddleware, addSecurityHeaders, extractUserData, extractRateLimit } from '../../../Utils/securityMiddleware';
import { getActiveCompaniesForPlatform } from '../../../Utils/dynamicCompanyDiscovery';
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
    { name: 'Spotify', url: 'https://jobs.lever.co/spotify', platform: 'lever' as const },
    { name: 'Discord', url: 'https://jobs.lever.co/discord', platform: 'lever' as const },
    { name: 'Reddit', url: 'https://jobs.lever.co/reddit', platform: 'lever' as const },
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

    // Scrape Greenhouse companies with dynamic discovery
    if (platforms.includes('all') || platforms.includes('greenhouse')) {
      console.log('📡 Discovering active Greenhouse companies with early-career jobs...');
      try {
        let allGreenhouseJobs: any[] = [];
        
        // Get active companies dynamically focused on early-career roles
        const activeCompanies = await getActiveCompaniesForPlatform('greenhouse', 5);
        console.log(`🎯 Found ${activeCompanies.length} companies with early-career openings`);
        
        for (const company of activeCompanies) {
          try {
            const companyJobs = await scrapeGreenhouse({ ...company, platform: 'greenhouse' as const }, runId);
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

    // Scrape Lever companies with dynamic discovery
    if (platforms.includes('all') || platforms.includes('lever')) {
      console.log('📡 Discovering active Lever companies with early-career jobs...');
      try {
        let allLeverJobs: any[] = [];
        
        // Get active companies dynamically focused on early-career roles
        const activeCompanies = await getActiveCompaniesForPlatform('lever', 5);
        console.log(`🎯 Found ${activeCompanies.length} companies with early-career openings`);
        
        for (const company of activeCompanies) {
          try {
            const companyJobs = await scrapeLever({ ...company, platform: 'lever' as const }, runId);
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

    // Scrape JobTeaser - replaces Graduateland
    if (platforms.includes('jobteaser') || platforms.includes('all')) {
      try {
        console.log('🎓 Scraping JobTeaser...');
        const { scrapeJobTeaser } = await import('@/scrapers/jobteaser');
        const jobteaserJobs = await scrapeJobTeaser(runId);
        results.jobteaser = {
          success: true,
          jobs: jobteaserJobs.length,
          inserted: jobteaserJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ JobTeaser: ${jobteaserJobs.length} jobs processed`);
      } catch (error: any) {
        results.jobteaser = { success: false, error: error.message };
        console.error('❌ JobTeaser scrape failed:', error.message);
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

    // Scrape Milkround - NEW EU SCRAPER
    if (platforms.includes('milkround') || platforms.includes('all')) {
      try {
        console.log('🥛 Scraping Milkround...');
        const { scrapeMilkround } = await import('@/scrapers/milkround');
        const milkroundJobs = await scrapeMilkround(runId);
        results.milkround = {
          success: true,
          jobs: milkroundJobs.length,
          inserted: milkroundJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ Milkround: ${milkroundJobs.length} jobs processed`);
      } catch (error: any) {
        results.milkround = { success: false, error: error.message };
        console.error('❌ Milkround scrape failed:', error.message);
      }
    }

    // Scrape EURES - NEW EU SCRAPER
    if (platforms.includes('eures') || platforms.includes('all')) {
      try {
        console.log('🇪🇺 Scraping EURES...');
        const { scrapeEures } = await import('@/scrapers/eures');
        const euresJobs = await scrapeEures(runId);
        results.eures = {
          success: true,
          jobs: euresJobs.length,
          inserted: euresJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ EURES: ${euresJobs.length} jobs processed`);
      } catch (error: any) {
        results.eures = { success: false, error: error.message };
        console.error('❌ EURES scrape failed:', error.message);
      }
    }

    // Scrape Trinity Dublin - UNIVERSITY CAREER PORTAL (requires login on some endpoints)
    if ((platforms.includes('trinity-dublin') || platforms.includes('all')) && process.env.ENABLE_UNI_SCRAPERS === 'true') {
      try {
        console.log('🎓 Scraping Trinity Dublin...');
        const { scrapeTrinityDublin } = await import('@/scrapers/trinity-dublin');
        const trinityJobs = await scrapeTrinityDublin(runId);
        results['trinity-dublin'] = {
          success: true,
          jobs: trinityJobs.length,
          inserted: trinityJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ Trinity Dublin: ${trinityJobs.length} jobs processed`);
      } catch (error: any) {
        results['trinity-dublin'] = { success: false, error: error.message };
        console.error('❌ Trinity Dublin scrape failed:', error.message);
      }
    } else if (platforms.includes('trinity-dublin')) {
      results['trinity-dublin'] = { success: false, error: 'Disabled: requires login. Set ENABLE_UNI_SCRAPERS=true to enable if you have access.' };
    }

    // Scrape TU Delft - UNIVERSITY CAREER PORTAL (may require login)
    if ((platforms.includes('tu-delft') || platforms.includes('all')) && process.env.ENABLE_UNI_SCRAPERS === 'true') {
      try {
        console.log('🇳🇱 Scraping TU Delft...');
        const { scrapeTUDelft } = await import('@/scrapers/tu-delft');
        const tuDelftJobs = await scrapeTUDelft(runId);
        results['tu-delft'] = {
          success: true,
          jobs: tuDelftJobs.length,
          inserted: tuDelftJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ TU Delft: ${tuDelftJobs.length} jobs processed`);
      } catch (error: any) {
        results['tu-delft'] = { success: false, error: error.message };
        console.error('❌ TU Delft scrape failed:', error.message);
      }
    } else if (platforms.includes('tu-delft')) {
      results['tu-delft'] = { success: false, error: 'Disabled: requires login. Set ENABLE_UNI_SCRAPERS=true to enable if you have access.' };
    }

    // Scrape ETH Zurich - UNIVERSITY CAREER PORTAL (may require login)
    if ((platforms.includes('eth-zurich') || platforms.includes('all')) && process.env.ENABLE_UNI_SCRAPERS === 'true') {
      try {
        console.log('🇨🇭 Scraping ETH Zurich...');
        const { scrapeETHZurich } = await import('@/scrapers/eth-zurich');
        const ethJobs = await scrapeETHZurich(runId);
        results['eth-zurich'] = {
          success: true,
          jobs: ethJobs.length,
          inserted: ethJobs.length,
          updated: 0,
          errors: []
        };
        console.log(`✅ ETH Zurich: ${ethJobs.length} jobs processed`);
      } catch (error: any) {
        results['eth-zurich'] = { success: false, error: error.message };
        console.error('❌ ETH Zurich scrape failed:', error.message);
      }
    } else if (platforms.includes('eth-zurich')) {
      results['eth-zurich'] = { success: false, error: 'Disabled: requires login. Set ENABLE_UNI_SCRAPERS=true to enable if you have access.' };
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
      platforms: ['reliable', 'remoteok', 'greenhouse', 'lever', 'workday', 'graduatejobs', 'jobteaser', 'milkround', 'eures', 'iagora', 'smartrecruiters', 'wellfound', 'all'],
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
