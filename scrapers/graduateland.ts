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
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': languages[Math.floor(Math.random() * languages.length)],
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'DNT': '1',
    'Referer': referrers[Math.floor(Math.random() * referrers.length)],
    'X-Forwarded-For': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    'X-Real-IP': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// EU Cities for Graduateland
const EU_CITIES = ['London', 'Madrid', 'Berlin', 'Amsterdam', 'Paris', 'Dublin', 'Stockholm', 'Zurich', 'Barcelona', 'Munich'];

// Graduateland API configuration
const GRADUATELAND_API_BASE = 'https://graduateland.com/api/v2';
const API_ENDPOINTS = {
  jobs: '/jobs',
  companies: '/companies'
};

export async function scrapeGraduateland(runId: string): Promise<Job[]> {
  const startTime = Date.now();
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  
  console.log('🎓 Starting Graduateland API scraping...');
  
  try {
    const allJobs: Job[] = [];
    
    // Scrape jobs for each EU city
    for (const city of EU_CITIES) {
      console.log(`📍 Scraping Graduateland for ${city}...`);
      
      try {
        const cityJobs = await scrapeCityJobs(city, runId, userAgent);
        allJobs.push(...cityJobs);
        console.log(`✅ ${city}: ${cityJobs.length} jobs found`);
        
        // Rate limiting between cities
        await sleep(1000 + Math.random() * 2000);
        
      } catch (error) {
        console.error(`❌ Failed to scrape ${city}:`, error);
        continue;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`🎓 Graduateland scraping completed: ${allJobs.length} jobs in ${duration}ms`);
    
    // Use atomicUpsertJobs for database insertion
    const result = await atomicUpsertJobs(allJobs);
    console.log(`💾 Graduateland database result: ${result.inserted} inserted, ${result.updated} updated`);
    
    return allJobs;
    
  } catch (error) {
    console.error('❌ Graduateland scraping failed:', error);
    throw error;
  }
}

async function scrapeCityJobs(city: string, runId: string, userAgent: string): Promise<Job[]> {
  const jobs: Job[] = [];
  
  try {
    // Try API first
    const apiJobs = await tryGraduatelandAPI(city, runId, userAgent);
    if (apiJobs.length > 0) {
      return apiJobs;
    }
    
    // Fallback to web scraping if API fails
    console.log('API failed, falling back to web scraping...');
    return await scrapeGraduatelandWeb(city, runId, userAgent);
    
  } catch (error) {
    console.error(`Error scraping Graduateland for ${city}:`, error);
    return [];
  }
}

async function tryGraduatelandAPI(city: string, runId: string, userAgent: string): Promise<Job[]> {
  try {
    const apiUrl = `${GRADUATELAND_API_BASE}${API_ENDPOINTS.jobs}`;
    
    const params = {
      location: city,
      type: 'graduate',
      limit: 50,
      offset: 0,
      sort: 'date'
    };
    
    const response = await axios.get(apiUrl, {
      params,
      headers: getRandomHeaders(userAgent),
      timeout: 15000
    });
    
    if (!response.data || !response.data.jobs || !Array.isArray(response.data.jobs)) {
      console.log('Invalid API response format');
      return [];
    }
    
    const apiJobs = response.data.jobs
      .filter((job: any) => {
        // Filter for graduate/entry-level positions
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        const content = `${title} ${description}`;
        
        return /\b(graduate|entry|junior|intern|trainee|new.grad|recent.graduate)\b/.test(content);
      })
      .map((job: any) => {
        // Extract posting date
        const postedAt = job.created_at || job.updated_at || job.posted_at || new Date().toISOString();
        
        // Analyze job content
        const analysis = analyzeJobContent(job.title || '', job.description || '');
        
        // Create job hash
        const jobHash = crypto.createHash('md5').update(`${job.title}-${job.company}-${job.id}`).digest('hex');
        
        return {
          title: job.title || 'Graduate Position',
          company: job.company?.name || job.company || 'Company not specified',
          location: job.location?.city || job.location || city,
          job_url: job.url || job.apply_url || `https://graduateland.com/jobs/${job.id}`,
          description: job.description || 'Description not available',
          experience_required: analysis.experienceLevel,
          work_environment: analysis.workEnv,
          language_requirements: analysis.languages.join(', '),
          source: 'graduateland',
          categories: job.category?.name || 'Graduate Jobs',
          company_profile_url: job.company?.url || '',
          scrape_timestamp: new Date().toISOString(),
          original_posted_date: postedAt,
          posted_at: postedAt,
          last_seen_at: new Date().toISOString(),
          is_active: true,
          job_hash: jobHash,
          scraper_run_id: runId,
          created_at: new Date().toISOString()
        };
      });
    
    console.log(`API returned ${apiJobs.length} jobs for ${city}`);
    return apiJobs;
    
  } catch (error) {
    console.error(`Graduateland API failed for ${city}:`, error);
    return [];
  }
}

async function scrapeGraduatelandWeb(city: string, runId: string, userAgent: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const baseUrl = 'https://graduateland.com/jobs';
  
  try {
    const response = await axios.get(`${baseUrl}?location=${encodeURIComponent(city)}`, {
      headers: getRandomHeaders(userAgent),
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for job listings (adjust selectors based on actual site structure)
    const jobElements = $('.job-listing, .job-card, .job-item, [data-job-id]');
    
    jobElements.each((index, element) => {
      if (index >= 30) return; // Limit to 30 jobs per city
      
      try {
        const job = processJobElementCheerio($, $(element), city, runId, userAgent);
        if (job) {
          jobs.push(job);
        }
      } catch (error) {
        console.error('Error processing job element:', error);
      }
    });
    
    console.log(`Web scraping found ${jobs.length} jobs for ${city}`);
    return jobs;
    
  } catch (error) {
    console.error(`Web scraping failed for ${city}:`, error);
    return [];
  }
}

function processJobElementCheerio($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>, city: string, runId: string, userAgent: string): Job | null {
  try {
    // Try multiple possible selectors for job data
    const title = $el.find('.job-title, .title, h3, h4').first().text().trim();
    const company = $el.find('.company-name, .company, .employer').first().text().trim();
    const location = $el.find('.location, .job-location, .city').first().text().trim() || city;
    const jobUrl = $el.find('a').attr('href') || '';
    
    if (!title || !company) {
      return null;
    }
    
    // Extract job description if available
    let description = $el.find('.description, .job-description, .summary').text().trim();
    if (!description) {
      description = `Graduate position at ${company} in ${location}. ${title}`;
    }
    
    // Analyze job content
    const analysis = analyzeJobContent(title, description);
    
    // Create job hash
    const jobHash = crypto.createHash('md5').update(`${title}-${company}-${jobUrl}`).digest('hex');
    
    // Extract posting date
    const dateResult = extractPostingDate(description, 'graduateland', jobUrl);
    
    const job: Job = {
      title: title,
      company: company,
      location: location,
      job_url: jobUrl.startsWith('http') ? jobUrl : `https://graduateland.com${jobUrl}`,
      description: description,
      experience_required: analysis.experienceLevel,
      work_environment: analysis.workEnv,
      language_requirements: analysis.languages.join(', '),
      source: 'graduateland',
      categories: 'Graduate Jobs',
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
    console.error('Error processing job element with cheerio:', error);
    return null;
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
