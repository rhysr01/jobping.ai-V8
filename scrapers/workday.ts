/**
 * Simplified Workday Scraper using IngestJob format
 * Phase 4 of IngestJob implementation
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { atomicUpsertJobs } from '../Utils/jobMatching.js';
import { 
  IngestJob, 
  classifyEarlyCareer, 
  inferRole, 
  parseLocation, 
  makeJobHash, 
  validateJob, 
  convertToDatabaseFormat, 
  shouldSaveJob, 
  logJobProcessing 
} from './utils.js';
import { RobotsCompliance, RespectfulRateLimiter, JOBPING_USER_AGENT } from '../Utils/robotsCompliance.js';
import { getGraduateEmployersByPlatform, GraduateEmployer } from '../Utils/graduateEmployers.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced retry with jitter
async function backoffRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      return await fn();
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

export async function scrapeWorkday(runId: string, opts?: { pageLimit?: number }): Promise<{ raw: number; eligible: number; careerTagged: number; locationTagged: number; inserted: number; updated: number; errors: string[]; samples: string[] }> {
  // Simplified metrics tracking
  let rawCount = 0;
  let eligibleCount = 0;
  let savedCount = 0;
  const errors: string[] = [];
  const samples: string[] = [];

  console.log('🎯 Starting Workday scraper with CURATED graduate employers...');
  
  // Get ONLY companies that actually have graduate programs
  const graduateEmployers = getGraduateEmployersByPlatform('workday');
  console.log(`📋 Found ${graduateEmployers.length} curated graduate employers on Workday`);
  
  for (const employer of graduateEmployers) {
    console.log(`🏢 Scraping graduate jobs from: ${employer.name}`);
    
    try {
      // Check robots.txt compliance before scraping
      const robotsCheck = await RobotsCompliance.isScrapingAllowed(employer.url);
      if (!robotsCheck.allowed) {
        console.log(`🚫 Robots.txt disallows scraping for ${employer.name}: ${robotsCheck.reason}`);
        errors.push(`Robots.txt disallows: ${robotsCheck.reason}`);
        continue;
      }
      console.log(`✅ Robots.txt allows scraping for ${employer.name}`);

      // Wait for respectful rate limiting
      await RespectfulRateLimiter.waitForDomain(new URL(employer.url).hostname);

      // Simple rate limiting
      await sleep(1000 + Math.random() * 2000);

      // Build Workday URL for this specific employer
      const workdayUrl = employer.url;
      
      console.log(`🔗 Scraping: ${workdayUrl}`);
      
      // Fetch HTML using axios
      const { data: html } = await backoffRetry(() =>
        axios.get(workdayUrl, {
          headers: {
            'User-Agent': JOBPING_USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 15000,
        })
      );

      const $ = cheerio.load(html);
      
      console.log(`🌐 HTML size: ${html.length} chars, Title: ${$('title').text()}`);
      
      // Try multiple selectors for different Workday layouts
      const jobSelectors = [
        '[data-automation-id="job-card"]',  // Standard Workday
        '.job-card',                        // Alternative layout
        '.job-posting',                     // Custom layout
        '[data-job-id]',                    // Data attribute
        '.careers-job',                     // Alternative
        '.position',                        // Legacy
        '.job-item'                         // Simple layout
      ];
      
      let jobElements = $();
      for (const selector of jobSelectors) {
        const elements = $(selector);
        console.log(`🔍 Selector "${selector}": ${elements.length} elements`);
        if (elements.length > 0) {
          jobElements = elements;
          console.log(`✅ Using selector: ${selector} (found ${elements.length} jobs)`);
          break;
        }
      }

      if (jobElements.length === 0) {
        console.warn(`⚠️ No jobs found at ${employer.name} - trying API fallback`);
        const apiResult = await tryWorkdayAPI(employer, runId);
        
        if (apiResult.length > 0) {
          // Convert API results to database format and insert
          const databaseJobs = apiResult.map(convertToDatabaseFormat);
          const result = await atomicUpsertJobs(databaseJobs);
          
          console.log(`✅ Workday API (${employer.name}): ${result.inserted} inserted, ${result.updated} updated`);
          
          return {
            raw: apiResult.length,
            eligible: apiResult.length,
            careerTagged: apiResult.length,
            locationTagged: apiResult.length,
            inserted: result.inserted,
            updated: result.updated,
            errors: result.errors,
            samples: apiResult.slice(0, 5).map(job => job.title)
          };
        }
        
        return {
          raw: 0,
          eligible: 0,
          careerTagged: 0,
          locationTagged: 0,
          inserted: 0,
          updated: 0,
          errors: ['No jobs found via API fallback'],
          samples: []
        };
      }
      
      console.log(`🔍 Found ${jobElements.length} job elements at ${employer.name}`);

      // Process jobs using new IngestJob format
      const ingestJobs: IngestJob[] = [];
      
      for (let i = 0; i < jobElements.length; i++) {
        rawCount++;
        
        try {
          const ingestJob = await processJobElement($, $(jobElements[i]), employer, runId);
          if (ingestJob) {
            eligibleCount++;
            
            // Check if job should be saved based on north-star rule
            if (shouldSaveJob(ingestJob)) {
              savedCount++;
              ingestJobs.push(ingestJob);
              samples.push(ingestJob.title);
              
              logJobProcessing(ingestJob, 'SAVED', { company: employer.name });
            } else {
              logJobProcessing(ingestJob, 'FILTERED', { company: employer.name });
            }
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          console.warn(`⚠️ Error processing job at ${employer.name}:`, errorMsg);
          errors.push(errorMsg);
        }
      }

      // Convert IngestJobs to database format and insert
      if (ingestJobs.length > 0) {
        try {
          const databaseJobs = ingestJobs.map(convertToDatabaseFormat);
          const result = await atomicUpsertJobs(databaseJobs);
          
          console.log(`✅ Workday DATABASE (${employer.name}): ${result.inserted} inserted, ${result.updated} updated, ${result.errors.length} errors`);
          
          if (result.errors.length > 0) {
            console.error('❌ Workday upsert errors:', result.errors.slice(0, 3));
            errors.push(...result.errors);
          }
        } catch (error: any) {
          const errorMsg = error instanceof Error ? error.message : 'Database error';
          console.error(`❌ Workday database upsert failed for ${employer.name}:`, errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`✅ Scraped ${savedCount} graduate jobs from ${employer.name} (${eligibleCount} eligible, ${rawCount} total)`);
      
      // Log scraping activity for compliance monitoring
      RobotsCompliance.logScrapingActivity('workday', employer.url, true);
      
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Workday scrape failed for ${employer.name}:`, errorMsg);
      
      // Log failed scraping activity for compliance monitoring
      RobotsCompliance.logScrapingActivity('workday', employer.url, false);
      
      errors.push(errorMsg);
    }
  }
  
  return {
    raw: rawCount,
    eligible: eligibleCount,
    careerTagged: savedCount,
    locationTagged: savedCount,
    inserted: savedCount,
    updated: 0,
    errors,
    samples
  };
}

async function processJobElement(
  $: cheerio.CheerioAPI, 
  $el: cheerio.Cheerio<any>, 
  employer: GraduateEmployer, 
  runId: string
): Promise<IngestJob | null> {
  
  // Extract title with multiple fallbacks for Workday
  const title = (
    $el.find('[data-automation-id="job-title"]').text().trim() ||
    $el.find('.job-title').text().trim() ||
    $el.find('h3, h4').first().text().trim() ||
    $el.find('a').first().text().trim() ||
    $el.text().split('\n')[0]?.trim()
  );

  if (!title) {
    console.log(`⚠️ No title found for job element`);
    return null;
  }

  // Extract job URL
  const jobUrl = (
    $el.find('a').first().attr('href') ||
    $el.find('[data-job-id]').attr('href') ||
    $el.find('.job-link').attr('href')
  );

  if (!jobUrl) {
    console.log(`⚠️ No URL found for job: "${title}"`);
    return null;
  }

  // Extract location
  const location = (
    $el.find('[data-automation-id="job-location"]').text().trim() ||
    $el.find('.job-location').text().trim() ||
    $el.find('.location').text().trim() ||
    $el.find('[data-location]').text().trim() ||
    'Location not specified'
  );

  // Extract department/team
  const department = (
    $el.find('[data-automation-id="job-department"]').text().trim() ||
    $el.find('.job-department').text().trim() ||
    $el.find('.department').text().trim() ||
    'General'
  );

  // Scrape job description
  const description = await scrapeWorkdayJobDescription(jobUrl);
  
  // Create simple IngestJob
  const ingestJob: IngestJob = {
    title: title.trim(),
    company: employer.name,
    location: location.trim(),
    description: description.trim(),
    url: jobUrl,
    posted_at: new Date().toISOString(), // Simplified date handling
    source: 'workday'
  };

  // Validate the job
  const validation = validateJob(ingestJob);
  if (!validation.valid) {
    console.log(`❌ Invalid job: "${title}" - ${validation.errors.join(', ')}`);
    return null;
  }

  return ingestJob;
}

async function scrapeWorkdayJobDescription(jobUrl: string): Promise<string> {
  try {
    await sleep(300 + Math.random() * 500); // Respectful delay
    
    const { data: html } = await axios.get(jobUrl, {
      headers: { 
        'User-Agent': JOBPING_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000,
    });
    
    const $ = cheerio.load(html);
    
    // Try multiple selectors for job description
    const descriptionSelectors = [
      '[data-automation-id="job-description"]',
      '.job-description',
      '.description',
      '.job-content',
      '.posting-content',
      '.main-content',
      '[data-job-description]'
    ];
    
    for (const selector of descriptionSelectors) {
      const desc = $(selector).text().trim();
      if (desc && desc.length > 100) {
        return desc.slice(0, 2000); // Limit description length
      }
    }
    
    // Fallback: get main content
    const mainContent = $('.content, .main-content').text().trim();
    if (mainContent && mainContent.length > 100) {
      return mainContent.slice(0, 2000);
    }
    
    return $('body').text().slice(0, 1000);
    
  } catch (err) {
    console.warn(`Failed to scrape Workday description from ${jobUrl}:`, err);
    return 'Description not available';
  }
}

// Fallback: Try Workday API endpoint
async function tryWorkdayAPI(employer: GraduateEmployer, runId: string): Promise<IngestJob[]> {
  try {
    // Extract company ID from URL
    const companyMatch = employer.url.match(/workday\.com\/([^\/]+)/);
    if (!companyMatch) return [];
    
    const companyId = companyMatch[1];
    const apiUrl = `https://${companyId}.myworkdayjobs.com/wday/cxs/${companyId}/jobs`;
    
    const { data } = await axios.post(apiUrl, {
      limit: 20,
      offset: 0,
      searchText: "graduate OR intern OR entry OR junior"
    }, {
      headers: { 
        'User-Agent': JOBPING_USER_AGENT,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000,
    });
    
    if (!data.jobPostings || !Array.isArray(data.jobPostings)) return [];
    
    return data.jobPostings
      .filter((job: any) => {
        const title = job.title?.toLowerCase() || '';
        return /\b(intern|graduate|entry|junior|trainee)\b/.test(title);
      })
      .map((job: any): IngestJob => ({
        title: job.title,
        company: employer.name,
        location: job.locationsText || 'Location not specified',
        description: job.bulletFields?.join(' ') || 'Description not available',
        url: job.externalPath,
        posted_at: job.postedOn || new Date().toISOString(),
        source: 'workday'
      }))
      .filter((ingestJob: IngestJob) => {
        // Apply north-star rule: save if early-career and in Europe
        return shouldSaveJob(ingestJob);
      });
      
  } catch (err) {
    console.warn(`Workday API fallback failed for ${employer.name}:`, err);
    return [];
  }
}

// Test runner
if (require.main === module) {
  const testRunId = 'test-run-' + Date.now();

  scrapeWorkday(testRunId)
    .then((result) => {
      console.log(`🧪 Test: ${result.inserted + result.updated} jobs processed`);
      console.log(`📊 WORKDAY TEST FUNNEL: Raw=${result.raw}, Eligible=${result.eligible}, Inserted=${result.inserted}, Updated=${result.updated}`);
      if (result.samples.length > 0) {
        console.log(`📝 Sample titles: ${result.samples.join(' | ')}`);
      }
      console.log('---');
    })
    .catch(err => console.error('🛑 Test failed:', err));
}