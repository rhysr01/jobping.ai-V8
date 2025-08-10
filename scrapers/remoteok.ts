import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Job } from './types';
import { atomicUpsertJobs, extractPostingDate, extractProfessionalExpertise, extractCareerPath, extractStartDate } from '../Utils/jobMatching';
import { PerformanceMonitor } from '../Utils/performanceMonitor';

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// NEW: Simple Browser Pool for enhanced scraping
class SimpleBrowserPool {
  private static browsers: any[] = [];
  private static maxSize = 3;

  static async getBrowser() {
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
      console.warn(`🔁 RemoteOK retrying ${err?.response?.status} in ${delay}ms (attempt ${attempt})`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

export async function scrapeRemoteOK(runId: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const url = 'https://remoteok.com/';
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const browser: any = await SimpleBrowserPool.getBrowser();
  const scrapeStart = Date.now();

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
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Cache-Control': 'no-cache',
          },
          timeout: 15000,
        })
      );
      html = data;
    }

    const $ = cheerio.load(html);

    // Process each job posting
    $('tr.job').each((_, el) => {
      try {
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

        // Early-career relevance filter
        const titleLower = title.toLowerCase();
        const isEarlyCareer = /\b(intern|internship|graduate|grad|entry.?level|junior|trainee|early.?career|new.?grad|recent.?graduate|associate|0[-‒–—]?[12].?years?|entry.?position)\b/.test(titleLower);
        
        if (!isEarlyCareer) return;

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

        const job: Job = {
          job_hash,
          title,
          company,
          location,
          job_url: jobUrl,
          description,
          experience_required: analysis.experienceLevel,
          work_environment: analysis.workEnvironment,
          source: 'remoteok',
          categories: analysis.categories.join(', '),
          company_profile_url: '',
          language_requirements: analysis.languages.join(', '),
          scrape_timestamp: new Date().toISOString(),
          original_posted_date: postedAt,
          posted_at: postedAt,
          last_seen_at: new Date().toISOString(),
          is_active: true,
          freshness_tier: analysis.freshnessTier,
          scraper_run_id: runId,
          created_at: new Date().toISOString()
        };

        jobs.push(job);
      } catch (error) {
        console.warn(`⚠️ Error processing RemoteOK job:`, error);
      }
    });

    console.log(`✅ Scraped ${jobs.length} graduate jobs from RemoteOK`);
    
    // Track performance
    PerformanceMonitor.trackDuration('remoteok_scraping', scrapeStart);
    
    return jobs;
    
  } catch (error: any) {
    console.error(`❌ RemoteOK scrape failed:`, error.message);
    PerformanceMonitor.trackDuration('remoteok_scraping', scrapeStart);
    return [];
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
  const categories: string[] = ['Remote'];
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
    
    const jobs = await scrapeRemoteOK(runId);
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