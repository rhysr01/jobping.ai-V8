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

    // Scrape Greenhouse companies
    if (platforms.includes('all') || platforms.includes('greenhouse')) {
      console.log('📡 Scraping Greenhouse companies...');
      results.greenhouse = [];
      
      for (const company of COMPANIES.greenhouse) {
        try {
          const jobs = await scrapeGreenhouse(company, runId);
          const result = await atomicUpsertJobs(jobs);
          results.greenhouse.push({
            company: company.name,
            success: result.success,
            jobs: jobs.length,
            inserted: result.inserted,
            updated: result.updated,
            errors: result.errors
          });
          console.log(`✅ ${company.name}: ${jobs.length} jobs processed`);
        } catch (error: any) {
          results.greenhouse.push({
            company: company.name,
            success: false,
            error: error.message
          });
          console.error(`❌ ${company.name} scrape failed:`, error.message);
        }
      }
    }

    // Scrape Lever companies
    if (platforms.includes('all') || platforms.includes('lever')) {
      console.log('📡 Scraping Lever companies...');
      results.lever = [];
      
      for (const company of COMPANIES.lever) {
        try {
          const jobs = await scrapeLever(company, runId);
          const result = await atomicUpsertJobs(jobs);
          results.lever.push({
            company: company.name,
            success: result.success,
            jobs: jobs.length,
            inserted: result.inserted,
            updated: result.updated,
            errors: result.errors
          });
          console.log(`✅ ${company.name}: ${jobs.length} jobs processed`);
        } catch (error: any) {
          results.lever.push({
            company: company.name,
            success: false,
            error: error.message
          });
          console.error(`❌ ${company.name} scrape failed:`, error.message);
        }
      }
    }

    // Scrape Workday companies
    if (platforms.includes('all') || platforms.includes('workday')) {
      console.log('📡 Scraping Workday companies...');
      results.workday = [];
      
      for (const company of COMPANIES.workday) {
        try {
          const jobs = await scrapeWorkday(company, runId);
          const result = await atomicUpsertJobs(jobs);
          results.workday.push({
            company: company.name,
            success: result.success,
            jobs: jobs.length,
            inserted: result.inserted,
            updated: result.updated,
            errors: result.errors
          });
          console.log(`✅ ${company.name}: ${jobs.length} jobs processed`);
        } catch (error: any) {
          results.workday.push({
            company: company.name,
            success: false,
            error: error.message
          });
          console.error(`❌ ${company.name} scrape failed:`, error.message);
        }
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
      platforms: ['remoteok', 'greenhouse', 'lever', 'workday', 'all'],
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
