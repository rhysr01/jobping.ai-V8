import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Job } from './types';
import { atomicUpsertJobs, extractPostingDate, extractProfessionalExpertise, extractCareerPath, extractStartDate } from '../Utils/jobMatching';
import { PerformanceMonitor } from '../Utils/performanceMonitor';

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

// Enhanced Browser Pool with connection pooling and health checks
class SimpleBrowserPool {
  private static browsers: any[] = [];
  private static maxSize = 5;
  private static healthCheckInterval = 300000; // 5 minutes
  private static lastHealthCheck = 0;

  static async getBrowser() {
    // Health check all browsers periodically
    await this.performHealthCheck();
    
    if (this.browsers.length > 0) {
      const browser = this.browsers.pop();
      console.log(`🔄 Reusing browser (${this.browsers.length} remaining)`);
      return browser;
    }

    console.log('🆕 Creating new browser');
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--disable-client-side-phishing-detection',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--ignore-certificate-errors-spki-list',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        ignoreHTTPSErrors: true,
        timeout: 30000
      });

      return browser;
    } catch (error) {
      console.error('Failed to create browser:', error);
      throw error;
    }
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
    if (now - this.lastHealthCheck < this.healthCheckInterval) return;
    
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
      console.log('Error closing browser:', error);
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

async function backoffRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      
      console.log(`⚠️ Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

// EU Cities for Wellfound
const EU_CITIES = ['London', 'Madrid', 'Berlin', 'Amsterdam', 'Paris', 'Dublin', 'Stockholm', 'Zurich', 'Barcelona', 'Munich'];

export async function scrapeWellfound(runId: string): Promise<Job[]> {
  const startTime = Date.now();
  const circuitBreaker = new CircuitBreaker();
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  
  console.log('🚀 Starting Wellfound scraping...');
  
  try {
    const allJobs: Job[] = [];
    
    // Scrape jobs for each EU city
    for (const city of EU_CITIES) {
      console.log(`📍 Scraping Wellfound for ${city}...`);
      
      try {
        const cityJobs = await circuitBreaker.execute(async () => {
          return await scrapeCityJobs(city, runId, userAgent);
        });
        
        allJobs.push(...cityJobs);
        console.log(`✅ ${city}: ${cityJobs.length} jobs found`);
        
        // Rate limiting between cities
        await sleep(2000 + Math.random() * 3000);
        
      } catch (error) {
        console.error(`❌ Failed to scrape ${city}:`, error);
        continue;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`🚀 Wellfound scraping completed: ${allJobs.length} jobs in ${duration}ms`);
    
    // Use atomicUpsertJobs for database insertion
    const result = await atomicUpsertJobs(allJobs);
    console.log(`💾 Wellfound database result: ${result.inserted} inserted, ${result.updated} updated`);
    
    return allJobs;
    
  } catch (error) {
    console.error('❌ Wellfound scraping failed:', error);
    throw error;
  } finally {
    await SimpleBrowserPool.cleanup();
  }
}

async function scrapeCityJobs(city: string, runId: string, userAgent: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const baseUrl = 'https://wellfound.com/jobs';
  
  try {
    // Try with Puppeteer first
    const browser = await SimpleBrowserPool.getBrowser();
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      await page.setExtraHTTPHeaders(getRandomHeaders(userAgent));
      
      // Navigate to search page with city filter and visa sponsorship
      const searchUrl = `${baseUrl}?location=${encodeURIComponent(city)}&visa_sponsorship=true`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for job cards to load
      await page.waitForSelector('.job-card, .job-listing, .job-item', { timeout: 10000 });
      
      // Extract job data
      const jobElements = await page.$$('.job-card, .job-listing, .job-item');
      
      for (const element of jobElements.slice(0, 20)) { // Limit to 20 jobs per city
        try {
          const job = await processJobElement(page, element, city, runId, userAgent);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.error('Error processing job element:', error);
          continue;
        }
      }
      
      await page.close();
      
    } finally {
      await SimpleBrowserPool.returnBrowser(browser);
    }
    
  } catch (error) {
    console.log('Puppeteer failed, falling back to axios...');
    
    // Fallback to axios
    try {
      const response = await axios.get(`${baseUrl}?location=${encodeURIComponent(city)}&visa_sponsorship=true`, {
        headers: getRandomHeaders(userAgent),
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const jobElements = $('.job-card, .job-listing, .job-item');
      
      jobElements.each((index, element) => {
        if (index >= 20) return; // Limit to 20 jobs per city
        
        try {
          const job = processJobElementCheerio($, $(element), city, runId, userAgent);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.error('Error processing job element:', error);
        }
      });
      
    } catch (axiosError) {
      console.error(`Axios fallback failed for ${city}:`, axiosError);
    }
  }
  
  return jobs;
}

async function processJobElement(page: any, element: any, city: string, runId: string, userAgent: string): Promise<Job | null> {
  try {
    // Extract basic job info
    const title = await element.$eval('.job-title, .title, h3', (el: any) => el.textContent?.trim() || '');
    const company = await element.$eval('.company-name, .company, .employer', (el: any) => el.textContent?.trim() || '');
    const location = await element.$eval('.job-location, .location, .city', (el: any) => el.textContent?.trim() || city);
    const jobUrl = await element.$eval('a', (el: any) => el.href || '');
    
    if (!title || !company || !jobUrl) {
      return null;
    }
    
    // Extract job description
    const description = await scrapeJobDescription(jobUrl, userAgent);
    
    // Analyze job content
    const analysis = analyzeJobContent(title, description);
    
    // Create job hash
    const jobHash = crypto.createHash('md5').update(`${title}-${company}-${jobUrl}`).digest('hex');
    
    // Extract posting date
    const dateResult = extractPostingDate(description, 'wellfound', jobUrl);
    
    const job: Job = {
      title: title,
      company: company,
      location: location,
      job_url: jobUrl,
      description: description,
      experience_required: analysis.experienceLevel,
      work_environment: analysis.workEnv,
      language_requirements: analysis.languages.join(', '),
      source: 'wellfound',
      categories: ['Startup Jobs'],
      company_profile_url: '',
      scrape_timestamp: new Date().toISOString(),
      original_posted_date: dateResult.success ? dateResult.date! : new Date().toISOString(),
      posted_at: dateResult.success ? dateResult.date! : new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_active: true,
      job_hash: jobHash,
      scraper_run_id: runId,
      created_at: new Date().toISOString()
    };
    
    return job;
    
  } catch (error) {
    console.error('Error processing job element:', error);
    return null;
  }
}

function processJobElementCheerio($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>, city: string, runId: string, userAgent: string): Job | null {
  try {
    const title = $el.find('.job-title, .title, h3').first().text().trim();
    const company = $el.find('.company-name, .company, .employer').first().text().trim();
    const location = $el.find('.job-location, .location, .city').first().text().trim() || city;
    const jobUrl = $el.find('a').attr('href') || '';
    
    if (!title || !company || !jobUrl) {
      return null;
    }
    
    // For cheerio fallback, we'll use a basic description
    const description = `Startup position at ${company} in ${location}. ${title}`;
    
    // Analyze job content
    const analysis = analyzeJobContent(title, description);
    
    // Create job hash
    const jobHash = crypto.createHash('md5').update(`${title}-${company}-${jobUrl}`).digest('hex');
    
    const job: Job = {
      title: title,
      company: company,
      location: location,
      job_url: jobUrl.startsWith('http') ? jobUrl : `https://wellfound.com${jobUrl}`,
      description: description,
      experience_required: analysis.experienceLevel,
      work_environment: analysis.workEnv,
      language_requirements: analysis.languages.join(', '),
      source: 'wellfound',
      categories: ['Startup Jobs'],
      company_profile_url: '',
      scrape_timestamp: new Date().toISOString(),
      original_posted_date: new Date().toISOString(),
      posted_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_active: true,
      job_hash: jobHash,
      scraper_run_id: runId,
      created_at: new Date().toISOString()
    };
    
    return job;
    
  } catch (error) {
    console.error('Error processing job element with cheerio:', error);
    return null;
  }
}

async function scrapeJobDescription(jobUrl: string, userAgent: string): Promise<string> {
  try {
    const response = await axios.get(jobUrl, {
      headers: getRandomHeaders(userAgent),
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract job description from various possible selectors
    const description = $('.job-description, .description, .job-details, .content').text().trim();
    
    if (description) {
      return description;
    }
    
    // Fallback: extract from body
    return $('body').text().trim().substring(0, 2000);
    
  } catch (error) {
    console.error('Error scraping job description:', error);
    return 'Description not available';
  }
}

function analyzeJobContent(title: string, description: string) {
  const content = `${title} ${description}`.toLowerCase();
  
  // Determine experience level
  let experienceLevel = 'entry-level';
  if (/\b(intern|internship)\b/.test(content)) experienceLevel = 'internship';
  else if (/\b(graduate|grad)\b/.test(content)) experienceLevel = 'graduate';
  else if (/\b(junior|entry)\b/.test(content)) experienceLevel = 'entry-level';
  
  // Determine work environment
  let workEnv = 'hybrid';
  if (/\b(remote|work.from.home|distributed)\b/.test(content)) workEnv = 'remote';
  else if (/\b(on.?site|office|in.person)\b/.test(content)) workEnv = 'office';
  
  // Extract language requirements
  const languages: string[] = [];
  const langMatches = content.match(/\b(english|spanish|french|german|dutch|portuguese|italian)\b/g);
  if (langMatches) {
    languages.push(...[...new Set(langMatches)]);
  }
  
  // Extract professional expertise using the helper function
  const professionalExpertise = extractProfessionalExpertise(title, description);
  
  // Extract career path using the helper function
  const careerPath = extractCareerPath(title, description);
  
  // Extract start date using the helper function
  const startDate = extractStartDate(description);
  
  return {
    experienceLevel,
    workEnv,
    languages,
    professionalExpertise,
    careerPath,
    startDate
  };
}
