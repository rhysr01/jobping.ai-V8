import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Job } from './types';
import { atomicUpsertJobs, extractPostingDate, extractProfessionalExpertise, extractCareerPath, extractStartDate } from '../Utils/jobMatching';
import { FunnelTelemetryTracker, logFunnelMetrics, isEarlyCareerEligible } from '../Utils/robustJobCreation';

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

// EU Companies using SmartRecruiters platform
const EU_COMPANIES = [
  { name: 'Spotify', url: 'https://jobs.smartrecruiters.com/Spotify' },
  { name: 'Klarna', url: 'https://jobs.smartrecruiters.com/Klarna' },
  { name: 'Adidas', url: 'https://jobs.smartrecruiters.com/Adidas' },
  { name: 'Volkswagen', url: 'https://jobs.smartrecruiters.com/Volkswagen' },
  { name: 'BMW', url: 'https://jobs.smartrecruiters.com/BMW' },
  { name: 'Siemens', url: 'https://jobs.smartrecruiters.com/Siemens' },
  { name: 'Bosch', url: 'https://jobs.smartrecruiters.com/Bosch' },
  { name: 'Philips', url: 'https://jobs.smartrecruiters.com/Philips' },
  { name: 'Unilever', url: 'https://jobs.smartrecruiters.com/Unilever' },
  { name: 'Nestle', url: 'https://jobs.smartrecruiters.com/Nestle' },
  { name: 'IKEA', url: 'https://jobs.smartrecruiters.com/IKEA' },
  { name: 'H&M', url: 'https://jobs.smartrecruiters.com/HM' },
  { name: 'Zalando', url: 'https://jobs.smartrecruiters.com/Zalando' },
  { name: 'Delivery Hero', url: 'https://jobs.smartrecruiters.com/DeliveryHero' },
  { name: 'HelloFresh', url: 'https://jobs.smartrecruiters.com/HelloFresh' },
  { name: 'N26', url: 'https://jobs.smartrecruiters.com/N26' },
  { name: 'Revolut', url: 'https://jobs.smartrecruiters.com/Revolut' },
  { name: 'Monzo', url: 'https://jobs.smartrecruiters.com/Monzo' },
  { name: 'TransferWise', url: 'https://jobs.smartrecruiters.com/TransferWise' },
  { name: 'Booking.com', url: 'https://jobs.smartrecruiters.com/Bookingcom' }
];

export async function scrapeSmartRecruiters(runId: string): Promise<{ raw: number; eligible: number; careerTagged: number; locationTagged: number; inserted: number; updated: number; errors: string[]; samples: string[] }> {
  const startTime = Date.now();
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const telemetry = new FunnelTelemetryTracker();
  
  console.log('🏢 Starting SmartRecruiters scraping...');
  
  try {
    const allJobs: Job[] = [];
    
    // Scrape jobs for each EU company
    for (const company of EU_COMPANIES) {
      console.log(`🏢 Scraping ${company.name}...`);
      
      try {
        const companyJobs = await scrapeCompanyJobs(company, runId, userAgent);
        allJobs.push(...companyJobs);
        console.log(`✅ ${company.name}: ${companyJobs.length} jobs found`);
        
        // Rate limiting between companies
        await sleep(2000 + Math.random() * 3000);
        
      } catch (error) {
        console.error(`❌ Failed to scrape ${company.name}:`, error);
        continue;
      }
    }
    
    // Track telemetry for all jobs found
    for (let i = 0; i < allJobs.length; i++) {
      telemetry.recordRaw();
      telemetry.recordEligibility();
      telemetry.recordCareerTagging();
      telemetry.recordLocationTagging();
      telemetry.addSampleTitle(allJobs[i].title);
    }
    
    const duration = Date.now() - startTime;
    console.log(`🏢 SmartRecruiters scraping completed: ${allJobs.length} jobs in ${duration}ms`);
    
    // Use atomicUpsertJobs for database insertion
    if (allJobs.length > 0) {
      try {
        const result = await atomicUpsertJobs(allJobs);
        console.log(`💾 SmartRecruiters database result: ${result.inserted} inserted, ${result.updated} updated`);
        
        // Track upsert results
        for (let i = 0; i < result.inserted; i++) telemetry.recordInserted();
        for (let i = 0; i < result.updated; i++) telemetry.recordUpdated();
        
        if (result.errors.length > 0) {
          result.errors.forEach(error => telemetry.recordError(error));
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : 'Database error';
        console.error(`❌ SmartRecruiters database error:`, errorMsg);
        telemetry.recordError(errorMsg);
      }
    }
    
    // Log standardized funnel metrics
    logFunnelMetrics('smartrecruiters', telemetry.getTelemetry());
    
    return telemetry.getTelemetry();
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ SmartRecruiters scraping failed:', errorMsg);
    telemetry.recordError(errorMsg);
    
    logFunnelMetrics('smartrecruiters', telemetry.getTelemetry());
    return telemetry.getTelemetry();
  }
}

async function scrapeCompanyJobs(company: { name: string; url: string }, runId: string, userAgent: string): Promise<Job[]> {
  const jobs: Job[] = [];
  
  try {
    // Try to get jobs from company's SmartRecruiters page
    const response = await axios.get(company.url, {
      headers: getRandomHeaders(userAgent),
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for job listings (SmartRecruiters specific selectors)
    const jobElements = $('.job-card, .job-listing, .job-item, [data-job-id]');
    
    jobElements.each((index, element) => {
      if (index >= 15) return; // Limit to 15 jobs per company
      
      try {
        const job = processJobElement($, $(element), company, runId, userAgent);
        if (job) {
          jobs.push(job);
        }
      } catch (error) {
        console.error('Error processing job element:', error);
      }
    });
    
    // If no jobs found with standard selectors, try alternative approach
    if (jobs.length === 0) {
      console.log(`No jobs found for ${company.name}, trying alternative selectors...`);
      
      // Try different selectors that might be used by SmartRecruiters
      const altJobElements = $('.sr-job, .job, .position, [class*="job"]');
      
      altJobElements.each((index, element) => {
        if (index >= 15) return;
        
        try {
          const job = processJobElementAlt($, $(element), company, runId, userAgent);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.error('Error processing alternative job element:', error);
        }
      });
    }
    
    console.log(`Found ${jobs.length} jobs for ${company.name}`);
    return jobs;
    
  } catch (error) {
    console.error(`Error scraping ${company.name}:`, error);
    return [];
  }
}

function processJobElement($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>, company: { name: string; url: string }, runId: string, userAgent: string): Job | null {
  try {
    // Extract job information using SmartRecruiters selectors
    const title = $el.find('.job-title, .title, h3, h4').first().text().trim();
    const location = $el.find('.job-location, .location, .city').first().text().trim();
    const jobUrl = $el.find('a').attr('href') || '';
    
    if (!title) {
      return null;
    }
    
    // Extract job description if available
    let description = $el.find('.job-description, .description, .summary').text().trim();
    if (!description) {
      description = `Position at ${company.name} in ${location || 'various locations'}. ${title}`;
    }
    
    // Analyze job content
    const analysis = analyzeJobContent(title, description);
    
    // Create job hash
    const jobHash = crypto.createHash('md5').update(`${title}-${company.name}-${jobUrl}`).digest('hex');
    
    // Extract posting date
    const dateResult = extractPostingDate(description, 'smartrecruiters', jobUrl);
    
    // Check early-career eligibility before creating job
    const eligibility = isEarlyCareerEligible(title, description);
    
    // Only create job if eligible (permissive filter)
    if (!eligibility.eligible) {
      return null;
    }
    
    const job: Job = {
      title: title,
      company: company.name,
      location: location || 'Various Locations',
      job_url: jobUrl.startsWith('http') ? jobUrl : `${company.url}${jobUrl}`,
      description: description,
      experience_required: analysis.experienceLevel,
      work_environment: analysis.workEnv,
      language_requirements: analysis.languages.join(', '),
      source: 'smartrecruiters',
      categories: ['Corporate Jobs'],
      company_profile_url: company.url,
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

function processJobElementAlt($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>, company: { name: string; url: string }, runId: string, userAgent: string): Job | null {
  try {
    // Alternative processing for different SmartRecruiters layouts
    const title = $el.find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
    const location = $el.find('[class*="location"], [class*="city"], .location').first().text().trim();
    const jobUrl = $el.find('a').attr('href') || '';
    
    if (!title) {
      return null;
    }
    
    // Create basic description
    const description = `Position at ${company.name} in ${location || 'various locations'}. ${title}`;
    
    // Analyze job content
    const analysis = analyzeJobContent(title, description);
    
    // Create job hash
    const jobHash = crypto.createHash('md5').update(`${title}-${company.name}-${jobUrl}`).digest('hex');
    
    // Check early-career eligibility before creating job
    const eligibility = isEarlyCareerEligible(title, description);
    
    // Only create job if eligible (permissive filter)
    if (!eligibility.eligible) {
      return null;
    }
    
    const job: Job = {
      title: title,
      company: company.name,
      location: location || 'Various Locations',
      job_url: jobUrl.startsWith('http') ? jobUrl : `${company.url}${jobUrl}`,
      description: description,
      experience_required: analysis.experienceLevel,
      work_environment: analysis.workEnv,
      language_requirements: analysis.languages.join(', '),
      source: 'smartrecruiters',
      categories: ['Corporate Jobs'],
      company_profile_url: company.url,
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
    console.error('Error processing alternative job element:', error);
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
