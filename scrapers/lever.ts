import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Job } from './types';
import { atomicUpsertJobs, extractPostingDate, extractProfessionalExpertise, extractCareerPath, extractStartDate } from '../Utils/jobMatching';

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      console.warn(`🔁 Lever retrying ${err?.response?.status} in ${delay}ms (attempt ${attempt})`);
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
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Referer': 'https://jobs.lever.co/',
        },
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

  // Enhanced early career filter
  const titleLower = title.toLowerCase();
  const isEarlyCareer = /\b(intern|internship|graduate|grad|entry.?level|junior|trainee|early.?career|new.?grad|recent.?graduate|associate|0[-‒–—]?[12].?years?|entry.?position)\b/.test(titleLower);
  
  if (!isEarlyCareer) return null;

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
    categories: [department, analysis.level, analysis.workEnv].filter(Boolean).join(', '),
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
  else if (/\b(on.?site|office|in.person|onsite)\b/.test(content)) workEnv = 'office';
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
        categories: [job.categories?.team || 'General'].join(', '),
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