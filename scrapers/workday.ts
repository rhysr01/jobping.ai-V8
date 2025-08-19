import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import { Job } from './types';
import { atomicUpsertJobs, extractPostingDate, extractProfessionalExpertise, extractCareerPath, extractStartDate } from '../Utils/jobMatching';
import { createJobCategories } from './types';
import { productionRateLimiter } from '../Utils/productionRateLimiter';
import { FunnelTelemetryTracker, logFunnelMetrics, isEarlyCareerEligible } from '../Utils/robustJobCreation';
import { RobotsCompliance, RespectfulRateLimiter, JOBPING_USER_AGENT } from '../Utils/robotsCompliance';

// Use JobPing-specific user agent for ethical scraping
const USER_AGENTS = [JOBPING_USER_AGENT];

// Use JobPing-specific headers for ethical scraping
const getRandomHeaders = (userAgent: string) => {
  return RobotsCompliance.getJobPingHeaders();
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      
      console.warn(`🔁 Workday retrying ${err?.response?.status || 'unknown error'} in ${Math.round(delay)}ms (attempt ${attempt}/${maxRetries})`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

export async function scrapeWorkday(company: {
  name: string;
  url: string;
  platform: 'workday';
  tags?: string[];
}, runId: string): Promise<{ raw: number; eligible: number; careerTagged: number; locationTagged: number; inserted: number; updated: number; errors: string[]; samples: string[] }> {
  const jobs: Job[] = [];
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const telemetry = new FunnelTelemetryTracker();

  try {
    // Skip pause check - method not available in current rate limiter
    // Rate limiting is handled by getScraperDelay below

    // Intelligent platform-specific rate limiting (Workday is most aggressive)
    const delay = await productionRateLimiter.getScraperDelay('workday');
    console.log(`⏱️ Workday: Waiting ${delay}ms before scraping ${company.name}`);
    await sleep(delay);

    // Try JSON API first
    const jsonResult = await scrapeWorkdayJSON(company, runId, userAgent, telemetry);
    if (jsonResult.raw > 0) {
      logFunnelMetrics('workday', jsonResult);
      return jsonResult;
    }

    // Fallback to HTML scraping
    const htmlResult = await scrapeWorkdayHTML(company, runId, userAgent, telemetry);
    logFunnelMetrics('workday', htmlResult);
    return htmlResult;

  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Workday scrape failed for ${company.name}:`, errorMsg);
    telemetry.recordError(errorMsg);
    
    logFunnelMetrics('workday', telemetry.getTelemetry());
    return telemetry.getTelemetry();
  }
}

async function scrapeWorkdayJSON(company: any, runId: string, userAgent: string, telemetry: FunnelTelemetryTracker): Promise<{ raw: number; eligible: number; careerTagged: number; locationTagged: number; inserted: number; updated: number; errors: string[]; samples: string[] }> {
  try {
    const response = await backoffRetry(() =>
      axios.get(company.url, {
        headers: getRandomHeaders(userAgent),
        timeout: 15000,
      })
    );
    
    const { data, headers } = response;
    
    // Check for blocks/rate limits (simplified)
    if (response.status === 429 || response.status === 403) {
      console.warn(`🚨 Block detected for Workday ${company.name}! Status: ${response.status}`);
      await productionRateLimiter.getScraperDelay('workday', true);
      throw new Error('Rate limit detected, will retry with throttling');
    }

    // Handle different Workday JSON response structures
    let jobArray = [];

    if (Array.isArray(data)) {
      jobArray = data;
    } else if (typeof data === 'object' && data) {
      // Common Workday response patterns
      const possibleArrayKeys = [
        'jobPostings',
        'jobs', 
        'positions',
        'openings',
        'requisitions',
        'searchResults',
        'body'
      ];

      for (const key of possibleArrayKeys) {
        if (data[key] && Array.isArray(data[key])) {
          jobArray = data[key];
          break;
        }
      }

      // Sometimes nested deeper
      if (jobArray.length === 0) {
        const keys = Object.keys(data);
        for (const key of keys) {
          if (data[key] && typeof data[key] === 'object') {
            const nested = Object.values(data[key]).find(val => Array.isArray(val));
            if (nested) {
              jobArray = nested as any[];
              break;
            }
          }
        }
      }
    }

    if (!Array.isArray(jobArray) || jobArray.length === 0) {
      console.warn(`⚠️ No valid job array found in Workday JSON for ${company.name}`);
      return telemetry.getTelemetry();
    }

    // Track raw jobs found
    for (let i = 0; i < jobArray.length; i++) {
      telemetry.recordRaw();
    }

    const jobs = [];
    for (const post of jobArray) {
      try {
        const job = await processWorkdayJob(post, company, runId, userAgent);
        if (job) {
          jobs.push(job);
          telemetry.recordEligibility();
          telemetry.recordCareerTagging();
          telemetry.recordLocationTagging();
          telemetry.addSampleTitle(job.title);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`⚠️ Failed to process Workday job from ${company.name}:`, errorMsg);
        telemetry.recordError(errorMsg);
      }
    }
    
    // CRITICAL: Insert jobs into database
    if (jobs.length > 0) {
      try {
        const result = await atomicUpsertJobs(jobs);
        console.log(`✅ Workday JSON DATABASE (${company.name}): ${result.inserted} inserted, ${result.updated} updated, ${result.errors.length} errors`);
        
        // Track upsert results
        for (let i = 0; i < result.inserted; i++) telemetry.recordInserted();
        for (let i = 0; i < result.updated; i++) telemetry.recordUpdated();
        
        if (result.errors.length > 0) {
          console.error('❌ Workday JSON upsert errors:', result.errors.slice(0, 3));
          result.errors.forEach(error => telemetry.recordError(error));
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : 'Database error';
        console.error(`❌ Workday JSON database upsert failed for ${company.name}:`, errorMsg);
        telemetry.recordError(errorMsg);
      }
    }
    
    console.log(`✅ Scraped ${jobs.length} graduate jobs from Workday JSON at ${company.name}`);
    return telemetry.getTelemetry();

  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Workday JSON scraping failed for ${company.name}, trying HTML fallback:`, errorMsg);
    telemetry.recordError(errorMsg);
    return telemetry.getTelemetry();
  }
}

async function scrapeWorkdayHTML(company: any, runId: string, userAgent: string, telemetry: FunnelTelemetryTracker): Promise<{ raw: number; eligible: number; careerTagged: number; locationTagged: number; inserted: number; updated: number; errors: string[]; samples: string[] }> {
  try {
    const { data: html } = await backoffRetry(() =>
      axios.get(company.url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 15000,
      })
    );

    const $ = cheerio.load(html);
    
    // Common Workday HTML selectors
    const jobSelectors = [
      '[data-automation-id="jobTitle"]',
      '.job-title',
      '.wd-job-title',
      '[data-automation-id="searchResultItem"]',
      '.jobs-list-item',
      '.job-posting'
    ];
    
    let jobElements = $();
    for (const selector of jobSelectors) {
      jobElements = $(selector);
      if (jobElements.length > 0) {
        console.log(`Found ${jobElements.length} jobs using HTML selector: ${selector}`);
        break;
      }
    }

    if (jobElements.length === 0) {
      console.warn(`⚠️ No jobs found in Workday HTML for ${company.name}`);
      return telemetry.getTelemetry();
    }

    // Track raw jobs found
    for (let i = 0; i < jobElements.length; i++) {
      telemetry.recordRaw();
    }

    const jobs = [];
    for (let i = 0; i < jobElements.length; i++) {
      try {
        const job = await processWorkdayHTMLElement($, jobElements.eq(i), company, runId, userAgent);
        if (job) {
          jobs.push(job);
          telemetry.recordEligibility();
          telemetry.recordCareerTagging();
          telemetry.recordLocationTagging();
          telemetry.addSampleTitle(job.title);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`⚠️ Failed to process HTML job element:`, errorMsg);
        telemetry.recordError(errorMsg);
      }
    }

    // CRITICAL: Insert jobs into database
    if (jobs.length > 0) {
      try {
        const result = await atomicUpsertJobs(jobs);
        console.log(`✅ Workday HTML DATABASE (${company.name}): ${result.inserted} inserted, ${result.updated} updated, ${result.errors.length} errors`);
        
        // Track upsert results
        for (let i = 0; i < result.inserted; i++) telemetry.recordInserted();
        for (let i = 0; i < result.updated; i++) telemetry.recordUpdated();
        
        if (result.errors.length > 0) {
          console.error('❌ Workday HTML upsert errors:', result.errors.slice(0, 3));
          result.errors.forEach(error => telemetry.recordError(error));
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : 'Database error';
        console.error(`❌ Workday HTML database upsert failed for ${company.name}:`, errorMsg);
        telemetry.recordError(errorMsg);
      }
    }
    
    console.log(`✅ Scraped ${jobs.length} graduate jobs from Workday HTML at ${company.name}`);
    return telemetry.getTelemetry();

  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Workday HTML scraping failed for ${company.name}:`, errorMsg);
    telemetry.recordError(errorMsg);
    return telemetry.getTelemetry();
  }
}

async function processWorkdayJob(post: any, company: any, runId: string, userAgent: string): Promise<Job | null> {
  // Extract title from various possible fields
  const title = (
    post.title?.trim() ||
    post.jobTitle?.trim() ||
    post.positionTitle?.trim() ||
    post.requisitionTitle?.trim() ||
    post.name?.trim() ||
    ''
  );

  if (!title) return null;

  // Relaxed relevance filter - include more job types
  const titleLower = title.toLowerCase();
  const descLower = (post.summary || post.description || '').toLowerCase();
  const content = `${titleLower} ${descLower}`;
  
  // Skip only clearly senior/management positions
  const isSenior = /\b(senior\s+|sr\.\s+|lead\s+|principal\s+|director|head\s+of|chief|vp|vice\s+president|(5|6|7|8|9|10)\+?\s*years|experienced\s+.*(5|6|7|8|9|10))\b/.test(content);
  
  if (isSenior) return null;

  // Skip remote-only jobs - focus on local/hybrid opportunities for better early-career prospects
  const isRemoteOnly = /\b(remote|100%\s*remote|fully\s*remote|remote\s*only)\b/i.test(content) && 
                     !/\b(hybrid|on-site|office|in-person)\b/i.test(content);
  
  if (isRemoteOnly) return null;

  // Extract location from various fields
  const location = (
    post.location?.trim() ||
    post.primaryLocation?.trim() ||
    post.workLocation?.trim() ||
    post.jobLocation?.trim() ||
    post.city?.trim() ||
    'Location not specified'
  );

  // Build job URL with better logic
  let jobUrl = '';
  if (post.externalPath) {
    // Determine base URL from company URL
    const baseUrl = company.url.includes('myworkdayjobs.com') 
      ? company.url.split('/')[0] + '//' + company.url.split('/')[2]
      : 'https://www.myworkdayjobs.com';
    jobUrl = `${baseUrl}${post.externalPath}`;
  } else if (post.jobUrl || post.url) {
    jobUrl = post.jobUrl || post.url;
  } else if (post.jobId || post.requisitionId) {
    // Construct URL from job ID
    const baseUrl = company.url.split('/jobs')[0];
    jobUrl = `${baseUrl}/job/${post.jobId || post.requisitionId}`;
  }

  if (!jobUrl) {
    console.warn(`No job URL found for: ${title} at ${company.name}`);
    return null;
  }

  // Scrape job description
  const description = await scrapeWorkdayJobDescription(jobUrl, userAgent);
  
  // Try to extract real posting date from the job page or API data
  let postedAt = post.postedDate || post.datePosted || new Date().toISOString();
  
  if (!post.postedDate && !post.datePosted) {
    const dateExtraction = extractPostingDate(
      description, 
      'workday', 
      jobUrl
    );
    
    if (dateExtraction.success && dateExtraction.date) {
      postedAt = dateExtraction.date;
    }
  }
  
  // Analyze job content
  const analysis = analyzeWorkdayJobContent(title, description, post);
  
  // Extract department/team
  const department = (
    post.department?.trim() ||
    post.team?.trim() ||
    post.businessUnit?.trim() ||
    post.jobFamily?.trim() ||
    'General'
  );

  // Check early-career eligibility before creating job
  const eligibility = isEarlyCareerEligible(title, description);
  
  // Only create job if eligible (permissive filter)
  if (!eligibility.eligible) {
    return null;
  }

  const job: Job = {
    title,
    company: company.name,
    location,
    job_url: jobUrl,
    description: description.slice(0, 2000),
    categories: createJobCategories(analysis.careerPath, [department, analysis.level, analysis.workEnv].filter(Boolean)),
    experience_required: analysis.experienceLevel,
    work_environment: analysis.workEnv,
    language_requirements: analysis.languages,
    source: 'workday',
    job_hash: crypto.createHash('md5').update(`${title}-${company.name}-${jobUrl}`).digest('hex'),
    posted_at: postedAt,
    scraper_run_id: runId,
    company_profile_url: company.url,
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: post.postedDate || post.datePosted || postedAt,
    last_seen_at: new Date().toISOString(),
    is_active: true,
    freshness_tier: undefined,
    created_at: new Date().toISOString(),
  };

  return job;
}

async function processWorkdayHTMLElement(
  $: cheerio.CheerioAPI, 
  $el: cheerio.Cheerio<any>, 
  company: any, 
  runId: string,
  userAgent: string
): Promise<Job | null> {
  
  const title = (
    $el.find('[data-automation-id="jobTitle"] a').text().trim() ||
    $el.find('.job-title a, .wd-job-title a').text().trim() ||
    $el.find('a').first().text().trim() ||
    $el.text().split('\n')[0]?.trim()
  );

  if (!title) return null;

  const titleLower = title.toLowerCase();
  const descLower = $el.text().toLowerCase();
  const content = `${titleLower} ${descLower}`;
  
  // Skip only clearly senior/management positions
  const isSenior = /\b(senior\s+|sr\.\s+|lead\s+|principal\s+|director|head\s+of|chief|vp|vice\s+president|(5|6|7|8|9|10)\+?\s*years|experienced\s+.*(5|6|7|8|9|10))\b/.test(content);
  
  if (isSenior) return null;

  // Skip remote-only jobs - focus on local/hybrid opportunities for better early-career prospects
  const isRemoteOnly = /\b(remote|100%\s*remote|fully\s*remote|remote\s*only)\b/i.test(content) && 
                     !/\b(hybrid|on-site|office|in-person)\b/i.test(content);
  
  if (isRemoteOnly) return null;

  // Extract URL
  let jobUrl = $el.find('a').first().attr('href') || '';
  if (jobUrl.startsWith('/')) {
    const baseUrl = company.url.split('/jobs')[0];
    jobUrl = baseUrl + jobUrl;
  }

  if (!jobUrl) return null;

  // Extract location
  const location = (
    $el.find('[data-automation-id="location"]').text().trim() ||
    $el.find('.location, .job-location').text().trim() ||
    'Location not specified'
  );

  const description = await scrapeWorkdayJobDescription(jobUrl, userAgent);
  
  // Try to extract real posting date from the job page
  const dateExtraction = extractPostingDate(
    description, 
    'workday', 
    jobUrl
  );
  
  const postedAt = dateExtraction.success && dateExtraction.date 
    ? dateExtraction.date 
    : new Date().toISOString();
  
  const analysis = analyzeWorkdayJobContent(title, description);

  return {
    title,
    company: company.name,
    location,
    job_url: jobUrl,
    description: description.slice(0, 2000),
            categories: createJobCategories('unknown', [analysis.level, analysis.workEnv].filter(Boolean)),
    experience_required: analysis.experienceLevel,
    work_environment: analysis.workEnv,
    language_requirements: analysis.languages,
    source: 'workday',
    job_hash: crypto.createHash('md5').update(`${title}-${company.name}-${jobUrl}`).digest('hex'),
    posted_at: postedAt,
    scraper_run_id: runId,
    company_profile_url: company.url,
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: dateExtraction.success && dateExtraction.date ? dateExtraction.date : postedAt,
    last_seen_at: new Date().toISOString(),
    is_active: true,
    freshness_tier: undefined,
    created_at: new Date().toISOString(),
  };
}

async function scrapeWorkdayJobDescription(jobUrl: string, userAgent: string): Promise<string> {
  try {
    await sleep(400 + Math.random() * 600);
    
    const { data: html } = await axios.get(jobUrl, {
      headers: { 
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 10000,
    });
    
    const $ = cheerio.load(html);
    
    // Workday-specific description selectors
    const descriptionSelectors = [
      '[data-automation-id="jobPostingDescription"]',
      '.wd-job-description',
      '[data-automation-id="jobPostingViewHeaderJobDescriptionDetails"]',
      '.job-description',
      '.jobDescription',
      '.wd-body-text'
    ];
    
    for (const selector of descriptionSelectors) {
      const desc = $(selector).text().trim();
      if (desc && desc.length > 100) {
        return desc;
      }
    }
    
    // Fallback: get main content
    const mainContent = $('main, .main-content, .content').text().trim();
    if (mainContent && mainContent.length > 100) {
      return mainContent.slice(0, 1500);
    }
    
    return $('body').text().slice(0, 1000);
    
  } catch (err) {
    console.warn(`Failed to scrape Workday description from ${jobUrl}:`, err);
    return 'Description not available';
  }
}

function analyzeWorkdayJobContent(title: string, description: string, apiData?: any) {
  const content = `${title} ${description}`.toLowerCase();
  
  // Determine experience level
  let experienceLevel = 'entry-level';
  if (/\b(intern|internship)\b/.test(content)) experienceLevel = 'internship';
  else if (/\b(graduate|grad.program|university.program|campus)\b/.test(content)) experienceLevel = 'graduate';
  else if (/\b(junior|entry|associate|trainee)\b/.test(content)) experienceLevel = 'entry-level';
  
  // Determine work environment
  let workEnv = 'hybrid';
  if (/\b(remote|work.from.home|distributed|virtual)\b/.test(content)) workEnv = 'remote';
  else if (/\b(on.?site|office|in.person|onsite)\b/.test(content)) workEnv = 'office';
  else if (/\b(hybrid|flexible)\b/.test(content)) workEnv = 'hybrid';
  
  // Extract language requirements
  const languages: string[] = [];
  const langMatches = content.match(/\b(english|spanish|french|german|dutch|portuguese|italian|mandarin|japanese|korean|arabic)\b/g);
  if (langMatches) {
    languages.push(...[...new Set(langMatches)]);
  }
  
  // Check API data for additional info
  if (apiData) {
    if (apiData.workLocation && /remote/i.test(apiData.workLocation)) {
      workEnv = 'remote';
    }
    if (apiData.jobType && /intern/i.test(apiData.jobType)) {
      experienceLevel = 'internship';
    }
  }
  
  const level = experienceLevel === 'internship' ? 'internship' : 
                experienceLevel === 'graduate' ? 'graduate' : 'entry-level';
  
  // Extract professional expertise using the new function
  const professionalExpertise = extractProfessionalExpertise(title, description);
  
  // Extract career path using the new function
  const careerPath = extractCareerPath(title, description);
  
  // Extract start date using the new function
  const startDate = extractStartDate(description);
  
  return {
    experienceLevel,
    workEnv,
    languages,
    level,
    professionalExpertise,
    careerPath,
    startDate
  };
}

// Test runner
if (require.main === module) {
  const testCompany = {
    name: 'ExampleCompany',
    url: 'https://careers.examplecompany.com/api/jobs',
    platform: 'workday' as const,
    tags: ['test']
  };

  scrapeWorkday(testCompany, 'test-run-123')
    .then((result) => {
      if (result.inserted + result.updated === 0) throw new Error('🛑 No jobs processed');
      console.log(`🧪 Test: ${result.inserted + result.updated} jobs processed`);
      console.log(`📊 WORKDAY TEST FUNNEL: Raw=${result.raw}, Eligible=${result.eligible}, Inserted=${result.inserted}, Updated=${result.updated}`);
      if (result.samples.length > 0) {
        console.log(`📝 Sample titles: ${result.samples.join(' | ')}`);
      }
      console.log('---');
    })
    .catch(err => console.error('🛑 Test failed:', err));
}