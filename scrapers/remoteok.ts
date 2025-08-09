import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Job } from './types';
import { atomicUpsertJobs, extractPostingDate } from '../Utils/jobMatching';

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
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

  try {
    await sleep(500 + Math.random() * 1500);

    const { data: html } = await backoffRetry(() =>
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
          title,
          company,
          location,
          job_url: jobUrl,
          description: description || 'Description not available',
          categories: ['Remote', 'Tech', analysis.level].filter(Boolean).join(', '),
          experience_required: analysis.experienceLevel,
          work_environment: 'remote', // RemoteOK is all remote jobs
          language_requirements: analysis.languages.join(', '),
          source: 'remoteok',
          job_hash,
          posted_at: postedAt,
          scraper_run_id: runId,
          company_profile_url: url, // RemoteOK main page as fallback
          created_at: new Date().toISOString(),
          extracted_posted_date: dateExtraction.success ? dateExtraction.date : undefined,
          // Add missing required fields
          professional_expertise: '',
          start_date: '',
          visa_status: '',
          entry_level_preference: '',
          career_path: '',
        };

        jobs.push(job);
      } catch (err) {
        console.warn(`⚠️ Error processing RemoteOK job:`, err);
      }
    });

    console.log(`✅ Scraped ${jobs.length} early-career remote jobs from RemoteOK`);
    return jobs;
  } catch (error: any) {
    console.error('❌ RemoteOK scrape failed:', error.message);
    return [];
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
  
  return {
    experienceLevel,
    languages,
    level
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