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

// Enhanced anti-detection headers
const getRandomHeaders = (userAgent: string) => ({
  'User-Agent': userAgent,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,es;q=0.8,fr;q=0.7,de;q=0.6',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'DNT': '1',
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// NEW: Simple Browser Pool for enhanced scraping
class SimpleBrowserPool {
  private static browsers: any[] = [];
  private static maxSize = 3;

  static async getBrowser() {
    if (this.browsers.length > 0) {
      const browser = this.browsers.pop();
      console.log(`🔄 Reusing browser (${this.browsers.length} remaining)`);
      return browser;
    }

    console.log('🆕 Creating new browser');
    try {
      const puppeteer = require('puppeteer');
      return await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
    } catch (error) {
      console.log('⚠️ Puppeteer not available, falling back to axios');
      return null;
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
        this.browsers.push(browser);
        console.log(`✅ Browser returned to pool`);
      } catch (error) {
        console.log('⚠️ Error returning browser to pool, closing instead');
        await browser.close();
      }
    } else {
      await browser.close();
    }
  }
}

async function backoffRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries || ![429, 403, 503].includes(err?.response?.status)) {
        throw err;
      }
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000) + Math.random() * 1000;
      console.warn(`🔁 Retrying ${err?.response?.status} in ${delay}ms (attempt ${attempt})`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

export async function scrapeGreenhouse(company: {
  name: string;
  url: string;
  platform: 'greenhouse';
  tags?: string[];
}, runId: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const browser = await SimpleBrowserPool.getBrowser();
  const scrapeStart = Date.now();
  
  try {
    await sleep(500 + Math.random() * 1500);

    let html: string;
    
    if (browser) {
      // Use browser pool for enhanced scraping
      console.log(`🌐 Using browser pool for ${company.name} scraping`);
      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      await page.goto(company.url, { waitUntil: 'networkidle2', timeout: 15000 });
      html = await page.content();
      await page.close();
    } else {
      // Fallback to axios
      console.log(`📡 Using axios fallback for ${company.name} scraping`);
      const { data } = await backoffRetry(() =>
        axios.get(company.url, {
          headers: getRandomHeaders(userAgent),
          timeout: 15000,
        })
      );
      html = data;
    }

    const $ = cheerio.load(html);
    
    // Try multiple selectors for different Greenhouse layouts
    const jobSelectors = [
      '.opening',           // Standard Greenhouse
      '.job-post',         // Custom layout 1
      '.position',         // Custom layout 2
      '[data-job-id]',     // Data attribute
      '.careers-job',      // Alternative
    ];
    
    let jobElements = $();
    for (const selector of jobSelectors) {
      jobElements = $(selector);
      if (jobElements.length > 0) {
        console.log(`Found ${jobElements.length} jobs using selector: ${selector}`);
        break;
      }
    }

    if (jobElements.length === 0) {
      console.warn(`⚠️ No jobs found at ${company.name} - trying JSON endpoint`);
      return await tryGreenhouseAPI(company, runId, userAgent);
    }

    const processedJobs = await Promise.all(
      jobElements.map(async (_, el) => {
        try {
          return await processJobElement($, $(el), company, runId, userAgent);
        } catch (err) {
          console.warn(`⚠️ Error processing job at ${company.name}:`, err);
          return null;
        }
      }).get()
    );

    const validJobs = processedJobs.filter((job): job is Job => job !== null);
    console.log(`✅ Scraped ${validJobs.length} graduate jobs from ${company.name}`);
    
    // Track performance
    PerformanceMonitor.trackDuration(`greenhouse_scraping_${company.name}`, scrapeStart);
    
    return validJobs;
    
  } catch (error: any) {
    console.error(`❌ Greenhouse scrape failed for ${company.name}:`, error.message);
    PerformanceMonitor.trackDuration(`greenhouse_scraping_${company.name}`, scrapeStart);
    return [];
  } finally {
    // Return browser to pool
    await SimpleBrowserPool.returnBrowser(browser);
  }
}

async function processJobElement(
  $: cheerio.CheerioAPI, 
  $el: cheerio.Cheerio<any>, 
  company: any, 
  runId: string,
  userAgent: string
): Promise<Job | null> {
  
  // Extract title with multiple fallbacks
  const title = (
    $el.find('a').first().text().trim() ||
    $el.find('h3, h4, .job-title, [data-title]').first().text().trim() ||
    $el.text().split('\n')[0]?.trim()
  );

  if (!title) return null;

  // Enhanced early career filter with more comprehensive patterns
  const titleLower = title.toLowerCase();
  const isEarlyCareer = /\b(intern|graduate|entry|junior|trainee|early.?career|new.?grad|recent.?graduate|0[-‒–—]?[12].?years?|associate|apprentice|student|co.?op|coop|rotational|development.?program|leadership.?program|accelerator|fellowship|scholarship)\b/.test(titleLower);

  // Additional filtering for experience levels
  const experienceLevels = [
    'entry level', 'entry-level', 'entrylevel',
    'junior', 'jr', 'jr.',
    'associate', 'assoc',
    'trainee', 'training',
    'intern', 'internship',
    'graduate', 'grad',
    'new grad', 'new graduate',
    'recent graduate', 'recent grad',
    'early career', 'early-career',
    '0 years', '0-1 years', '0-2 years', '1 year', '1-2 years',
    'no experience', 'no prior experience',
    'first role', 'first job',
    'student', 'student program',
    'co-op', 'coop', 'cooperative',
    'rotational', 'rotation',
    'development program', 'leadership program',
    'accelerator', 'fellowship'
  ];

  const hasEarlyCareerKeywords = experienceLevels.some(level => 
    titleLower.includes(level.toLowerCase())
  );

  // Enhanced filtering logic
  if (!isEarlyCareer && !hasEarlyCareerKeywords) {
    // Additional check for description keywords
    const description = $el.text().toLowerCase();
    const descriptionHasEarlyCareer = experienceLevels.some(level => 
      description.includes(level.toLowerCase())
    );
    
    if (!descriptionHasEarlyCareer) {
      return null;
    }
  }

  // Extract URL with better handling
  let jobUrl = $el.find('a').first().attr('href') || '';
  if (jobUrl.startsWith('/')) {
    const baseUrl = new URL(company.url).origin;
    jobUrl = baseUrl + jobUrl;
  } else if (!jobUrl.startsWith('http')) {
    jobUrl = company.url.replace(/\/$/, '') + '/' + jobUrl;
  }

  if (!jobUrl || jobUrl === company.url) return null;

  // Extract location with multiple strategies
  const location = extractLocation($, $el);
  
  // Extract department/category
  const department = (
    $el.closest('.department').find('h3').text().trim() ||
    $el.find('.department, .team, .category').text().trim() ||
    'General'
  );

  // Scrape job description
  const description = await scrapeJobDescription(jobUrl, userAgent);
  
  // Try to extract real posting date from the job page
  const dateExtraction = extractPostingDate(
    description, 
    'greenhouse', 
    jobUrl
  );
  
  const postedAt = dateExtraction.success && dateExtraction.date 
    ? dateExtraction.date 
    : new Date().toISOString();
  
  // Analyze job details
  const analysis = analyzeJobContent(title, description);
  
  const job: Job = {
    title,
    company: company.name,
    location,
    job_url: jobUrl,
    description: description.slice(0, 2000), // Limit description length
    categories: [department, analysis.level, analysis.workEnv].filter(Boolean).join(', '),
    experience_required: analysis.experienceLevel,
    work_environment: analysis.workEnv,
    language_requirements: analysis.languages.join(', '),
    source: 'greenhouse',
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

function extractLocation($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string {
  // Try multiple location selectors
  const locationSelectors = [
    '.location',
    '.job-location', 
    '.office',
    '.city',
    '[data-location]'
  ];
  
  for (const selector of locationSelectors) {
    const loc = $el.find(selector).text().trim();
    if (loc) return loc;
  }
  
  // Try parent container
  const parentLoc = $el.closest('.opening, .job-post').find('.location').text().trim();
  if (parentLoc) return parentLoc;
  
  return 'Location not specified';
}

async function scrapeJobDescription(jobUrl: string, userAgent: string): Promise<string> {
  try {
    await sleep(200 + Math.random() * 300); // Small delay between requests
    
    const { data: html } = await axios.get(jobUrl, {
      headers: { 'User-Agent': userAgent },
      timeout: 10000,
    });
    
    const $ = cheerio.load(html);
    
    // Try multiple description selectors
    const descriptionSelectors = [
      '#job-description',
      '.job-description',
      '.content',
      '.job-content',
      '[data-description]'
    ];
    
    for (const selector of descriptionSelectors) {
      const desc = $(selector).text().trim();
      if (desc && desc.length > 100) {
        return desc;
      }
    }
    
    return $('body').text().slice(0, 1000); // Fallback
    
  } catch (err) {
    console.warn(`Failed to scrape description from ${jobUrl}:`, err);
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
  
  // Determine level category
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

// Fallback: Try Greenhouse API endpoint
async function tryGreenhouseAPI(company: any, runId: string, userAgent: string): Promise<Job[]> {
  try {
    const apiUrl = company.url.replace(/\/$/, '') + '/jobs.json';
    
    const { data } = await axios.get(apiUrl, {
      headers: { 'User-Agent': userAgent },
      timeout: 10000,
    });
    
    if (!data.jobs || !Array.isArray(data.jobs)) return [];
    
    return data.jobs
      .filter((job: any) => {
        const title = job.title?.toLowerCase() || '';
        return /\b(intern|graduate|entry|junior|trainee)\b/.test(title);
      })
      .map((job: any) => {
        // Try to extract posting date from job data
        const postedAt = job.updated_at || job.created_at || new Date().toISOString();
        
        return {
          title: job.title,
          company: company.name,
          location: job.location?.name || 'Location not specified',
          job_url: job.absolute_url,
          description: job.content || 'Description not available',
          categories: [job.departments?.[0]?.name || 'General'].join(', '),
          experience_required: 'entry-level',
          work_environment: 'hybrid',
          language_requirements: '',
          source: 'greenhouse',
          job_hash: crypto.createHash('md5').update(`${job.title}-${company.name}-${job.absolute_url}`).digest('hex'),
          posted_at: postedAt,
          scraper_run_id: runId,
          company_profile_url: company.url,
          created_at: new Date().toISOString(),
          extracted_posted_date: job.updated_at || job.created_at,
          // Add missing required fields
          professional_expertise: '',
          start_date: '',
          visa_status: '',
          entry_level_preference: '',
          career_path: '',
        };
      });
      
  } catch (err) {
    console.warn(`API fallback failed for ${company.name}:`, err);
    return [];
  }
}