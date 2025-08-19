import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Job } from './types';
import { atomicUpsertJobs, extractPostingDate, extractProfessionalExpertise, extractCareerPath, extractStartDate } from '../Utils/jobMatching';

const USER_AGENTS = [
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
      
      console.warn(`🔁 Lever retrying ${err?.response?.status || 'unknown error'} in ${Math.round(delay)}ms (attempt ${attempt}/${maxRetries})`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

export async function scrapeLever(company: {
  name: string;
  url: string;
  platform: 'lever';
  tags?: string[];
}, runId: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    await sleep(500 + Math.random() * 1500);

    const { data: html } = await backoffRetry(() =>
      axios.get(company.url, {
        headers: getRandomHeaders(userAgent),
        timeout: 15000,
      })
    );

    const $ = cheerio.load(html);
    
    // Try multiple selectors for different Lever layouts
    const jobSelectors = [
      '.posting',                    // Standard Lever
      '.job-posting',               // Alternative layout
      '.position',                  // Custom layout
      '[data-qa="posting"]',        // Data attribute
      '.careers-posting',           // Corporate site
      '.job-item',                  // Simple layout
    ];
    
    let jobElements = $();
    for (const selector of jobSelectors) {
      jobElements = $(selector);
      if (jobElements.length > 0) {
        console.log(`Found ${jobElements.length} jobs using selector: ${selector} at ${company.name}`);
        break;
      }
    }

    if (jobElements.length === 0) {
      console.warn(`⚠️ No jobs found at ${company.name} - trying API fallback`);
      return await tryLeverAPI(company, runId, userAgent);
    }

    const processedJobs = await Promise.all(
      jobElements.map(async (_, el) => {
        try {
          return await processLeverJobElement($, $(el), company, runId, userAgent);
        } catch (err) {
          console.warn(`⚠️ Error processing Lever job at ${company.name}:`, err);
          return null;
        }
      }).get()
    );

    const validJobs = processedJobs.filter((job): job is Job => job !== null);
    console.log(`✅ Scraped ${validJobs.length} graduate jobs from ${company.name}`);
    
    return validJobs;
    
  } catch (error: any) {
    console.error(`❌ Lever scrape failed for ${company.name}:`, error.message);
    return [];
  }
}

async function processLeverJobElement(
  $: cheerio.CheerioAPI, 
  $el: cheerio.Cheerio<any>, 
  company: any, 
  runId: string,
  userAgent: string
): Promise<Job | null> {
  
  // Extract title with multiple fallbacks
  const title = (
    $el.find('.posting-title > h5').text().trim() ||
    $el.find('.posting-title h4, .posting-title h3').text().trim() ||
    $el.find('.job-title, .position-title').text().trim() ||
    $el.find('h5, h4, h3').first().text().trim() ||
    $el.find('a').first().text().trim()
  );

  if (!title) return null;

  // Relaxed relevance filter - include more job types
  const titleLower = title.toLowerCase();
  const descLower = $el.text().toLowerCase();
  const content = `${titleLower} ${descLower}`;
  
  // Skip only clearly senior/management positions
  const isSenior = /\b(senior|sr\.|lead|principal|staff|director|manager|mgr|head.of|chief|vp|vice.president|architect|expert|specialist.*(5|6|7|8|9|10)\+?.years)\b/.test(content);
  
  if (isSenior) return null;

  // Skip remote-only jobs - focus on local/hybrid opportunities for better early-career prospects
  const isRemoteOnly = /\b(remote|100%\s*remote|fully\s*remote|remote\s*only)\b/i.test(content) && 
                     !/\b(hybrid|on-site|office|in-person)\b/i.test(content);
  
  if (isRemoteOnly) return null;

  // Extract URL with better handling
  let jobUrl = $el.find('a').first().attr('href') || '';
  
  if (jobUrl.startsWith('http')) {
    // Already absolute URL
  } else if (jobUrl.startsWith('/')) {
    // Root-relative URL
    jobUrl = `https://jobs.lever.co${jobUrl}`;
  } else if (jobUrl) {
    // Relative URL
    jobUrl = `${company.url.replace(/\/$/, '')}/${jobUrl}`;
  } else {
    // Try to find URL in parent elements
    jobUrl = $el.closest('a').attr('href') || '';
    if (jobUrl.startsWith('/')) {
      jobUrl = `https://jobs.lever.co${jobUrl}`;
    }
  }

  if (!jobUrl || jobUrl === company.url) return null;

  // Extract location with multiple strategies
  const location = extractLeverLocation($, $el);
  
  // Extract department/team with fallbacks
  const department = (
    $el.find('.posting-categories > span').last().text().trim() ||
    $el.find('.department, .team, .category').text().trim() ||
    $el.find('.posting-categories span').eq(1).text().trim() ||
    'General'
  );

  // Scrape job description
  const description = await scrapeLeverJobDescription(jobUrl, userAgent);
  
  // Try to extract real posting date from the job page
  const dateExtraction = extractPostingDate(
    description, 
    'lever', 
    jobUrl
  );
  
  const postedAt = dateExtraction.success && dateExtraction.date 
    ? dateExtraction.date 
    : new Date().toISOString();
  
  // Analyze job content
  const analysis = analyzeLeverJobContent(title, description);
  
  const job: Job = {
    title,
    company: company.name,
    location,
    job_url: jobUrl,
    description: description.slice(0, 2000),
    categories: [department, analysis.level, analysis.workEnv].filter(Boolean),
    experience_required: analysis.experienceLevel,
    work_environment: analysis.workEnv,
    language_requirements: analysis.languages.join(', '),
    source: 'lever',
    job_hash: crypto.createHash('md5').update(`${title}-${company.name}-${jobUrl}`).digest('hex'),
    posted_at: postedAt,
    scraper_run_id: runId,
    company_profile_url: company.url,
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: postedAt,
    last_seen_at: new Date().toISOString(),
    is_active: true,
    freshness_tier: undefined,
    created_at: new Date().toISOString(),
  };

  return job;
}

function extractLeverLocation($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string {
  // Try multiple location selectors specific to Lever
  const locationSelectors = [
    '.posting-categories > span:first-child',  // Standard Lever location
    '.posting-categories .location',
    '.job-location',
    '.location',
    '.office',
    '.city',
    '[data-location]'
  ];
  
  for (const selector of locationSelectors) {
    const loc = $el.find(selector).text().trim();
    if (loc && loc.length > 0 && loc !== 'Remote') {
      return loc;
    }
  }
  
  // Try to extract from categories span elements
  const categorySpans = $el.find('.posting-categories > span');
  if (categorySpans.length >= 2) {
    const firstSpan = categorySpans.first().text().trim();
    if (firstSpan && !firstSpan.toLowerCase().includes('full') && !firstSpan.toLowerCase().includes('part')) {
      return firstSpan;
    }
  }
  
  // Check for remote indicators in title or nearby text
  const nearbyText = $el.text().toLowerCase();
  if (/\b(remote|distributed|work.from.home)\b/.test(nearbyText)) {
    return 'Remote';
  }
  
  return 'Location not specified';
}

async function scrapeLeverJobDescription(jobUrl: string, userAgent: string): Promise<string> {
  try {
    await sleep(300 + Math.random() * 500); // Respectful delay
    
    const { data: html } = await axios.get(jobUrl, {
      headers: { 
        'User-Agent': userAgent,
        'Referer': 'https://jobs.lever.co/'
      },
      timeout: 10000,
    });
    
    const $ = cheerio.load(html);
    
    // Lever-specific description selectors
    const descriptionSelectors = [
      '.section-wrapper .section:contains("Description")',
      '.posting-content',
      '.section-wrapper',
      '.posting-description',
      '.job-description',
      '.content'
    ];
    
    for (const selector of descriptionSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // For sections containing "Description", get the next content
        if (selector.includes('contains')) {
          const desc = element.nextAll('.section').first().text().trim() ||
                      element.find('.section-body').text().trim() ||
                      element.next().text().trim();
          if (desc && desc.length > 100) return desc;
        } else {
          const desc = element.text().trim();
          if (desc && desc.length > 100) return desc;
        }
      }
    }
    
    // Fallback: get main content
    const mainContent = $('.posting-content, .main-content').text().trim();
    if (mainContent && mainContent.length > 100) {
      return mainContent.slice(0, 1500);
    }
    
    return $('body').text().slice(0, 1000);
    
  } catch (err) {
    console.warn(`Failed to scrape Lever description from ${jobUrl}:`, err);
    return 'Description not available';
  }
}

function analyzeLeverJobContent(title: string, description: string) {
  const content = `${title} ${description}`.toLowerCase();
  
  // Determine experience level
  let experienceLevel = 'entry-level';
  if (/\b(intern|internship)\b/.test(content)) experienceLevel = 'internship';
  else if (/\b(graduate|grad.program|graduate.program)\b/.test(content)) experienceLevel = 'graduate';
  else if (/\b(junior|entry|associate|trainee)\b/.test(content)) experienceLevel = 'entry-level';
  
  // Determine work environment
  let workEnv = 'hybrid';
  if (/\b(remote|distributed|work.from.home|fully.remote)\b/.test(content)) workEnv = 'remote';
  else if (/\b(on.?site|office|in.person|onsite)\b/.test(content)) workEnv = 'on-site';
  else if (/\b(hybrid|flexible)\b/.test(content)) workEnv = 'hybrid';
  
  // Extract language requirements
  const languages: string[] = [];
  const langPatterns = [
    /\b(english|spanish|french|german|dutch|portuguese|italian|mandarin|japanese)\b/g,
    /\b(native|fluent|proficient).{1,10}(english|spanish|french|german)\b/g
  ];
  
  for (const pattern of langPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      languages.push(...matches.map(match => match.toLowerCase().replace(/\b(native|fluent|proficient)\b/g, '').trim()));
    }
  }
  
  // Remove duplicates and clean up
  const uniqueLanguages = [...new Set(languages)].filter(lang => lang.length > 2);
  
  // Determine level category for categories
  const level = experienceLevel === 'internship' ? 'internship' : 
                experienceLevel === 'graduate' ? 'graduate' : 'entry-level';
  
  // Check for visa sponsorship indicators
  const visaFriendly = /\b(visa.sponsorship|work.permit|international.candidates|relocation.support|sponsor.visa|work.authorization)\b/.test(content);
  
  // Extract professional expertise using the new function
  const professionalExpertise = extractProfessionalExpertise(title, description);
  
  // Extract career path using the new function
  const careerPath = extractCareerPath(title, description);
  
  // Extract start date using the new function
  const startDate = extractStartDate(description);
  
  return {
    experienceLevel,
    workEnv,
    languages: uniqueLanguages,
    level,
    visaFriendly,
    professionalExpertise,
    careerPath,
    startDate
  };
}

// Fallback: Try Lever API endpoint
async function tryLeverAPI(company: any, runId: string, userAgent: string): Promise<Job[]> {
  try {
    // Extract company ID from URL
    const companyMatch = company.url.match(/lever\.co\/([^\/]+)/);
    if (!companyMatch) return [];
    
    const companyId = companyMatch[1];
    const apiUrl = `https://api.lever.co/v0/postings/${companyId}?mode=json`;
    
    const { data } = await axios.get(apiUrl, {
      headers: { 
        'User-Agent': userAgent,
        'Accept': 'application/json'
      },
      timeout: 10000,
    });
    
    if (!Array.isArray(data)) return [];
    
    return data
      .filter((job: any) => {
        const title = job.text?.toLowerCase() || '';
        return /\b(intern|graduate|entry|junior|trainee)\b/.test(title);
      })
      .map((job: any) => ({
        title: job.text,
        company: company.name,
        location: job.categories?.location || 'Location not specified',
        job_url: job.hostedUrl || job.applyUrl,
        description: job.description || 'Description not available',
        categories: [job.categories?.team || 'General'],
        experience_required: 'entry-level',
        work_environment: 'hybrid',
        language_requirements: '',
        source: 'lever',
        job_hash: crypto.createHash('md5').update(`${job.text}-${company.name}-${job.hostedUrl}`).digest('hex'),
        posted_at: job.createdAt || new Date().toISOString(),
        scraper_run_id: runId,
        company_profile_url: company.url,
        scrape_timestamp: new Date().toISOString(),
        original_posted_date: job.createdAt || new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        is_active: true,
        freshness_tier: undefined,
        created_at: new Date().toISOString(),
      }));
      
  } catch (err) {
    console.warn(`Lever API fallback failed for ${company.name}:`, err);
    return [];
  }
}

// Test runner
if (require.main === module) {
  const testCompany = {
    name: 'ExampleCompany',
    url: 'https://jobs.lever.co/examplecompany',
    platform: 'lever' as const,
    tags: ['test']
  };

  scrapeLever(testCompany, 'test-run-123')
    .then((jobs) => {
      console.log(`🧪 Test: ${jobs.length} jobs`);
      jobs.slice(0, 2).forEach(job => {
        console.log(`- ${job.title} at ${job.company}`);
        console.log(`  Location: ${job.location}`);
        console.log(`  Experience: ${job.experience_required}`);
        console.log(`  Work: ${job.work_environment}`);
        console.log('---');
      });
    })
    .catch(err => console.error('🛑 Test failed:', err));
}