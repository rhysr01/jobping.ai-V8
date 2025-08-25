import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import { Job } from './types';
import { atomicUpsertJobs, extractPostingDate, extractProfessionalExpertise, extractCareerPath, extractStartDate } from '../Utils/jobMatching';
import { createJobCategories } from './types';
import { PerformanceMonitor } from '../Utils/performanceMonitor';
import { createRobustJob, FunnelTelemetryTracker, logFunnelMetrics, isEarlyCareerEligible } from '../Utils/robustJobCreation';

const USER_AGENTS = [
  'JobPingBot/1.0 (+https://getjobping.com/contact)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
];

// Enhanced anti-detection headers with rotating IP simulation
const getRandomHeaders = (userAgent: string) => {
  const referrers = [
    'https://www.google.com/',
    'https://www.linkedin.com/jobs/',
    'https://www.glassdoor.com/',
    'https://www.indeed.com/',
    'https://www.ziprecruiter.com/',
    'https://www.simplyhired.com/',
    'https://www.dice.com/',
    'https://www.angel.co/jobs',
    'https://www.wellfound.com/',
    'https://www.otta.com/'
  ];

  const languages = [
    'en-US,en;q=0.9,es;q=0.8,fr;q=0.7,de;q=0.6',
    'en-GB,en;q=0.9',
    'en-CA,en;q=0.9,fr;q=0.8',
    'en-AU,en;q=0.9',
    'en-US,en;q=0.9,zh;q=0.8,ja;q=0.7'
  ];

  return {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': languages[Math.floor(Math.random() * languages.length)],
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1',
    'Referer': referrers[Math.floor(Math.random() * referrers.length)],
    'X-Forwarded-For': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    'X-Real-IP': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced Browser Pool with connection pooling and health checks
class SimpleBrowserPool {
  private static browsers: any[] = [];
  private static maxSize = 5;
  private static healthCheckInterval = 300000; // 5 minutes
  private static lastHealthCheck = 0;

  static async getBrowser() {
    // Health check all browsers periodically
    await this.performHealthCheck();
    
    // Puppeteer not installed - falling back to axios
    console.log('⚠️ Puppeteer not available, using axios only');
    return null;
  }

  static async returnBrowser(browser: any) {
    if (!browser) return;
    
    if (this.browsers.length < this.maxSize) {
      try {
        // Reset browser state
        const pages = await browser.pages();
        for (const page of pages.slice(1)) {
          await page.close();
        }
        
        // Clear cookies and cache
        const context = browser.defaultBrowserContext();
        await context.clearPermissionOverrides();
        
        this.browsers.push(browser);
        console.log(`✅ Browser returned to pool (${this.browsers.length}/${this.maxSize})`);
      } catch (error) {
        console.log('⚠️ Error returning browser to pool, closing instead');
        await this.closeBrowser(browser);
      }
    } else {
      await this.closeBrowser(browser);
    }
  }

  private static async performHealthCheck() {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return;
    }
    
    this.lastHealthCheck = now;
    console.log('🏥 Performing browser pool health check...');
    
    const healthyBrowsers = [];
    for (const browser of this.browsers) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          healthyBrowsers.push(browser);
        } else {
          await this.closeBrowser(browser);
        }
      } catch (error) {
        console.log('⚠️ Unhealthy browser detected, removing from pool');
        await this.closeBrowser(browser);
      }
    }
    
    this.browsers = healthyBrowsers;
    console.log(`🏥 Health check complete: ${this.browsers.length} healthy browsers`);
  }

  private static async closeBrowser(browser: any) {
    try {
      await browser.close();
    } catch (error) {
      console.log('⚠️ Error closing browser:', error);
    }
  }

  private static removeBrowser(browser: any) {
    const index = this.browsers.indexOf(browser);
    if (index > -1) {
      this.browsers.splice(index, 1);
    }
  }

  static async cleanup() {
    console.log('🧹 Cleaning up browser pool...');
    for (const browser of this.browsers) {
      await this.closeBrowser(browser);
    }
    this.browsers = [];
  }
}

// Circuit breaker pattern for robust error handling
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Enhanced retry with jitter and circuit breaker
async function backoffRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  const circuitBreaker = new CircuitBreaker();
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      return await circuitBreaker.execute(fn);
    } catch (err: any) {
      attempt++;
      
      // Don't retry on certain errors
      if (err?.response?.status === 404 || err?.response?.status === 401) {
        throw err;
      }
      
      if (attempt > maxRetries) {
        throw err;
      }
      
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      
      console.warn(`🔁 RemoteOK retrying ${err?.response?.status || 'unknown error'} in ${Math.round(delay)}ms (attempt ${attempt}/${maxRetries})`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

export async function scrapeRemoteOK(runId: string): Promise<{ jobs: Job[], funnel: any }> {
  const jobs: Job[] = [];
  const url = 'https://remoteok.com/';
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const browser: any = await SimpleBrowserPool.getBrowser();
  const scrapeStart = Date.now();
  
  // Initialize standardized funnel tracking
  const funnel = {
    raw: 0,
    eligible: 0,
    careerTagged: 0,
    locationTagged: 0,
    inserted: 0,
    updated: 0,
    errors: [] as string[],
    samples: [] as string[]
  };

  try {
    await sleep(500 + Math.random() * 1500);

    let html: string;
    
    if (browser) {
      // Use browser pool for enhanced scraping
      console.log('🌐 Using browser pool for RemoteOK scraping');
      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      html = await page.content();
      await page.close();
    } else {
      // Fallback to axios
      console.log('📡 Using axios fallback for RemoteOK scraping');
      const { data } = await backoffRetry(() =>
        axios.get(url, {
          headers: getRandomHeaders(userAgent),
          timeout: 15000,
        })
      );
      html = data;
    }

    const $ = cheerio.load(html);

    // Process each job posting
    $('tr.job').each((_, el) => {
      try {
        funnel.raw++; // Track raw jobs
        
        const $el = $(el);
        const rawTitle = $el.find('.company_and_position [itemprop="title"]').text().trim();
        const rawCompany = $el.find('.company_and_position [itemprop="name"]').text().trim();
        const rawLocation = $el.find('.location').text().trim() || 'Remote';
        const rawDescription = $el.find('.description').text().trim() || '';
        const relativeUrl = $el.attr('data-href');
        const jobUrl = relativeUrl ? `https://remoteok.com${relativeUrl}` : '';

        // Clean and validate data
        const title = cleanText(rawTitle);
        const company = cleanText(rawCompany);
        const location = normalizeLocation(rawLocation);
        const description = cleanText(rawDescription);

        if (!title || !company || !jobUrl) return;

        // Use standardized early-career eligibility check
        const eligibility = isEarlyCareerEligible(title, description);
        
        if (!eligibility.eligible) return;

        // DISABLED: Skip remote jobs - this is RemoteOK, a REMOTE job board!
        // const isRemoteOnly = /\b(remote|100%\s*remote|fully\s*remote|remote\s*only)\b/i.test(content) && 
        //                    !/\b(hybrid|on-site|office|in-person)\b/i.test(content);
        // if (isRemoteOnly) return;

        // Analyze job content (using same pattern as your other scrapers)
        const analysis = analyzeRemoteOKJobContent(title, description);

        // Generate job hash for deduplication
        const job_hash = crypto.createHash('md5').update(`${title}-${company}-${jobUrl}`).digest('hex');

        // Try to extract real posting date from the job element
        const dateExtraction = extractPostingDate(
          $el.html() || '', 
          'remoteok', 
          jobUrl
        );
        
        const postedAt = dateExtraction.success && dateExtraction.date 
          ? dateExtraction.date 
          : new Date().toISOString();

        // Use standardized robust job creation with Job Ingestion Contract
        const jobResult = createRobustJob({
          title,
          company,
          location,
          jobUrl,
          companyUrl: 'https://remoteok.com',
          description,
          department: 'General',
          postedAt,
          runId,
          source: 'remoteok',
          isRemote: true, // RemoteOK is all remote jobs
          platformId: relativeUrl?.split('/').pop() // Extract job ID from URL
        });

        // Record telemetry and debug filtering
        if (jobResult.job) {
          funnel.eligible++;
          funnel.careerTagged++;
          funnel.locationTagged++;
          
          // Add sample titles (up to 5)
          if (funnel.samples.length < 5) {
            funnel.samples.push(title);
          }
          
          jobs.push(jobResult.job);
        } else {
          console.log(`❌ Job filtered out: "${title}" - Stage: ${jobResult.funnelStage}, Reason: ${jobResult.reason}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error processing RemoteOK job:`, error);
      }
    });

    // CRITICAL: Insert jobs into database
    if (jobs.length > 0) {
      try {
        const result = await atomicUpsertJobs(jobs);
        funnel.inserted = result.inserted;
        funnel.updated = result.updated;
        funnel.errors.push(...result.errors);
        console.log(`✅ RemoteOK DATABASE: ${result.inserted} inserted, ${result.updated} updated, ${result.errors.length} errors`);
        if (result.errors.length > 0) {
          console.error('❌ RemoteOK upsert errors:', result.errors.slice(0, 3));
        }
      } catch (error: any) {
        console.error(`❌ RemoteOK database upsert failed:`, error.message);
        funnel.errors.push(error.message);
      }
    }
    
    console.log(`✅ Scraped ${jobs.length} jobs from RemoteOK`);
    
    // Track performance
    PerformanceMonitor.trackDuration('remoteok_scraping', scrapeStart);
    
    // Log standardized funnel metrics
    logFunnelMetrics('remoteok', funnel);
    
    return { jobs, funnel };
    
  } catch (error: any) {
    console.error(`❌ RemoteOK scrape failed:`, error.message);
    PerformanceMonitor.trackDuration('remoteok_scraping', scrapeStart);
    
    // Add error to funnel
    funnel.errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    return { jobs: [], funnel };
  } finally {
    // Return browser to pool
    await SimpleBrowserPool.returnBrowser(browser);
  }
}

// Content analysis function (matching your other scrapers)
function analyzeRemoteOKJobContent(title: string, description: string) {
  const content = `${title} ${description}`.toLowerCase();
  
  // Determine experience level
  let experienceLevel = 'entry-level';
  if (/\b(intern|internship)\b/.test(content)) experienceLevel = 'internship';
  else if (/\b(graduate|grad)\b/.test(content)) experienceLevel = 'graduate';
  else if (/\b(junior|entry|associate|trainee)\b/.test(content)) experienceLevel = 'entry-level';
  
  // Extract language requirements
  const languages: string[] = [];
  const langMatches = content.match(/\b(english|spanish|french|german|dutch|portuguese|italian)\b/g);
  if (langMatches) {
    languages.push(...[...new Set(langMatches)]);
  }
  
  // Add English as default for remote jobs
  if (languages.length === 0) {
    languages.push('English');
  }
  
  // Determine level category
  const level = experienceLevel === 'internship' ? 'internship' : 
                experienceLevel === 'graduate' ? 'graduate' : 'entry-level';
  
  // Extract professional expertise using the new function
  const professionalExpertise = extractProfessionalExpertise(title, description);
  
  // Extract career path using the new function
  const careerPath = extractCareerPath(title, description);
  
  // Extract start date using the new function
  const startDate = extractStartDate(description);
  
  // Determine work environment (RemoteOK is all remote)
  const workEnvironment = 'remote';
  
  // Extract categories
  const categories: string[] = ['remote'];
  if (experienceLevel === 'internship') categories.push('Internship');
  if (experienceLevel === 'graduate') categories.push('Graduate');
  if (experienceLevel === 'entry-level') categories.push('Entry-Level');
  
  // Determine freshness tier (default to comprehensive for now)
  const freshnessTier = 'comprehensive';
  
  return {
    experienceLevel,
    languages,
    level,
    professionalExpertise,
    careerPath,
    startDate,
    workEnvironment,
    categories,
    freshnessTier
  };
}

// Utility functions (matching your existing patterns)
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeLocation(location: string): string {
  if (!location || location.toLowerCase() === 'worldwide') {
    return 'Remote Worldwide';
  }
  return cleanText(location);
}

// Updated CLI runner to match your schema
if (require.main === module) {
  (async () => {
    const runId = crypto.randomUUID();
    console.log(`🚀 Starting RemoteOK scrape with run ID: ${runId}`);
    
    const { jobs, funnel } = await scrapeRemoteOK(runId);
    if (jobs.length === 0) {
      console.log('ℹ️ No early-career jobs found.');
      return;
    }

    // Use atomic upsert with unique constraint on job_hash
    const result = await atomicUpsertJobs(jobs);

    if (!result.success) {
      console.error('❌ Atomic upsert failed:', result.errors);
    } else {
      console.log(`✅ Atomic upsert completed: ${result.inserted} inserted, ${result.updated} updated`);
    }
  })();
}

// Export for use in scrapeAll.ts
// Function is already exported above