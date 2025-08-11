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
}, runId: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    await sleep(500 + Math.random() * 1500);

    // Try JSON API first
    const jsonJobs = await scrapeWorkdayJSON(company, runId, userAgent);
    if (jsonJobs.length > 0) {
      return jsonJobs;
    }

    // Fallback to HTML scraping
    return await scrapeWorkdayHTML(company, runId, userAgent);

  } catch (error: any) {
    console.error(`❌ Workday scrape failed for ${company.name}:`, error.message);
    return [];
  }
}

async function scrapeWorkdayJSON(company: any, runId: string, userAgent: string): Promise<Job[]> {
  try {
    const { data, headers } = await backoffRetry(() =>
      axios.get(company.url, {
        headers: getRandomHeaders(userAgent),
        timeout: 15000,
      })
    );

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
      return [];
    }

    const jobs = [];
    for (const post of jobArray) {
      try {
        const job = await processWorkdayJob(post, company, runId, userAgent);
        if (job) jobs.push(job);
      } catch (err) {
        console.warn(`⚠️ Failed to process Workday job from ${company.name}:`, err);
      }
    }

    console.log(`✅ Scraped ${jobs.length} graduate jobs from Workday JSON at ${company.name}`);
    return jobs;

  } catch (error: any) {
    console.warn(`Workday JSON scraping failed for ${company.name}, trying HTML fallback`);
    throw error;
  }
}

async function scrapeWorkdayHTML(company: any, runId: string, userAgent: string): Promise<Job[]> {
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
      return [];
    }

    const jobs = [];
    for (let i = 0; i < jobElements.length; i++) {
      try {
        const job = await processWorkdayHTMLElement($, jobElements.eq(i), company, runId, userAgent);
        if (job) jobs.push(job);
      } catch (err) {
        console.warn(`⚠️ Failed to process HTML job element:`, err);
      }
    }

    console.log(`✅ Scraped ${jobs.length} graduate jobs from Workday HTML at ${company.name}`);
    return jobs;

  } catch (error: any) {
    console.error(`Workday HTML scraping failed for ${company.name}:`, error.message);
    return [];
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

  // Enhanced early career filter
  const titleLower = title.toLowerCase();
  const isEarlyCareer = /\b(intern|internship|graduate|grad|entry.?level|junior|trainee|early.?career|new.?grad|recent.?graduate|associate|0[-‒–—]?[12].?years?|entry.?position|campus|university)\b/.test(titleLower);
  
  if (!isEarlyCareer) return null;

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

  const job: Job = {
    title,
    company: company.name,
    location,
    job_url: jobUrl,
    description: description.slice(0, 2000),
    categories: [department, analysis.level, analysis.workEnv].filter(Boolean).join(', '),
    experience_required: analysis.experienceLevel,
    work_environment: analysis.workEnv,
    language_requirements: analysis.languages.join(', '),
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
  const isEarlyCareer = /\b(intern|graduate|entry|junior|trainee|early.?career)\b/.test(titleLower);
  
  if (!isEarlyCareer) return null;

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
    categories: [analysis.level, analysis.workEnv].filter(Boolean).join(', '),
    experience_required: analysis.experienceLevel,
    work_environment: analysis.workEnv,
    language_requirements: analysis.languages.join(', '),
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
    .then((jobs) => {
      if (jobs.length === 0) throw new Error('🛑 No jobs returned');
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