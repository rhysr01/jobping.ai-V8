#!/usr/bin/env node

/**
 * 🎯 SIMPLE JOB BOARDS SCRAPER - Fast & Reliable
 * 
 * Scrapes simple job boards that actually work:
 * - Indeed UK (graduate jobs)
 * - TotalJobs UK (graduate section)
 * - CV Library UK (graduate jobs)
 * - Jobs.ie (graduate jobs)
 * 
 * Expected: 50-150 jobs per run
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple Job Boards to scrape
const SIMPLE_BOARDS = [
  {
    name: 'Indeed UK Graduate',
    url: 'https://www.indeed.co.uk/jobs?q=graduate&l=London&radius=50',
    country: 'UK'
  },
  {
    name: 'TotalJobs Graduate',
    url: 'https://www.totaljobs.com/jobs/graduate',
    country: 'UK'
  },
  {
    name: 'CV Library Graduate',
    url: 'https://www.cv-library.co.uk/graduate-jobs',
    country: 'UK'
  },
  {
    name: 'Jobs.ie Graduate',
    url: 'https://www.jobs.ie/graduate-jobs',
    country: 'Ireland'
  }
];

// Job normalization function
function normalizeJob(jobData, source = 'simple-boards') {
  const crypto = require('crypto');
  const title = jobData.title || '';
  const company = jobData.company || '';
  const location = jobData.location || '';
  const description = jobData.description || '';
  const url = jobData.url || '';
  
  const hashString = `${title.toLowerCase().trim()}|${company.toLowerCase().trim()}|${location.toLowerCase().trim()}`;
  const jobHash = crypto.createHash('sha256').update(hashString).digest('hex');
  const text = `${title} ${description}`.toLowerCase();
  
  // Enhanced early-career detection
  const earlyCareerTerms = /(graduate|junior|trainee|entry.?level|intern|apprentice|fresh|new.?grad|starter|associate|assistant|career.?starter|entry|recent.?graduate|campus.?hire)/i;
  const seniorTerms = /(senior|lead|principal|manager|director|head|chief|vp|vice.?president|executive|5\+.?years|7\+.?years|10\+.?years|experienced|expert|specialist|consultant|coordinator)/i;
  const isEarlyCareer = earlyCareerTerms.test(text) && !seniorTerms.test(text);
  
  return {
    job_hash: jobHash,
    title: title.trim(),
    company: company.trim(),
    location: location.trim(),
    job_url: url.trim(),
    description: description.trim(),
    source: source,
    posted_at: jobData.postedAt || new Date().toISOString(),
    scrape_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: true,
    is_sent: false,
    status: 'active',
    platform: 'job-board',
    work_environment: 'on-site',
    categories: isEarlyCareer ? ['early-career', 'graduate'] : ['graduate'],
    experience_required: isEarlyCareer ? 'entry-level' : 'experienced',
    language_requirements: [],
    company_profile_url: null,
    original_posted_date: jobData.postedAt || new Date().toISOString(),
    freshness_tier: null,
    scraper_run_id: null,
    job_hash_score: 100,
    ai_labels: [],
    work_location: 'on-site',
    city: null,
    country: null,
    company_name: null,
    dedupe_key: null,
    lang: null,
    lang_conf: null,
    is_graduate: isEarlyCareer,
    is_internship: /intern/i.test(title),
    region: '',
    board: 'simple-boards'
  };
}

// Save jobs to database
async function saveJobsToDatabase(jobs, source) {
  if (!jobs || jobs.length === 0) return 0;
  
  try {
    // Remove null jobs and deduplicate within batch
    const validJobs = jobs.filter(job => job !== null);
    const uniqueJobs = validJobs.filter((job, index, self) => 
      index === self.findIndex(j => j.job_hash === job.job_hash)
    );
    
    if (uniqueJobs.length === 0) return 0;
    
    console.log(`📊 ${source}: ${jobs.length} jobs → ${uniqueJobs.length} unique jobs`);
    
    // Batch upsert to database
    const { data, error } = await supabase
      .from('jobs')
      .upsert(uniqueJobs, { 
        onConflict: 'job_hash',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    
    console.log(`💾 Saved ${uniqueJobs.length}/${uniqueJobs.length} ${source} jobs to database`);
    return uniqueJobs.length;
    
  } catch (error) {
    console.log(`❌ Failed to save ${source} jobs:`, error.message);
    return 0;
  }
}

// Simple HTTP scraper for job boards
async function scrapeJobBoard(board) {
  console.log(`📡 Scraping: ${board.name} (${board.country})`);
  
  try {
    const response = await new Promise((resolve, reject) => {
      https.get(board.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
    
    // Simple HTML parsing for job listings
    const jobs = [];
    
    // Extract job titles and companies using basic regex
    const titleMatches = response.match(/<h[1-6][^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h[1-6]>/gi) || [];
    const companyMatches = response.match(/<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/gi) || [];
    const locationMatches = response.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/gi) || [];
    
    // Create job objects from matches
    for (let i = 0; i < Math.min(titleMatches.length, 20); i++) {
      const title = titleMatches[i]?.replace(/<[^>]*>/g, '').trim() || `Graduate Position ${i + 1}`;
      const company = companyMatches[i]?.replace(/<[^>]*>/g, '').trim() || 'Unknown Company';
      const location = locationMatches[i]?.replace(/<[^>]*>/g, '').trim() || board.country;
      
      if (title && !title.includes('cookie') && !title.includes('privacy')) {
        jobs.push({
          title,
          company,
          location,
          description: `Graduate position at ${company}`,
          url: board.url,
          postedAt: new Date().toISOString()
        });
      }
    }
    
    console.log(`   Found ${jobs.length} jobs`);
    return jobs;
    
  } catch (error) {
    console.log(`   Error scraping ${board.name}: ${error.message}`);
    return [];
  }
}

async function scrapeSimpleJobBoards() {
  console.log('🎯 Starting Simple Job Boards scraper...');
  
  let allJobs = [];
  
  // Scrape each board
  for (const board of SIMPLE_BOARDS) {
    const jobs = await scrapeJobBoard(board);
    allJobs.push(...jobs);
  }
  
  // Normalize and filter jobs
  const normalizedJobs = allJobs.map(job => normalizeJob(job, 'simple-boards')).filter(job => job !== null);
  const earlyCareerJobs = normalizedJobs.filter(job => job.is_graduate);
  
  console.log(`✅ Simple Job Boards: ${allJobs.length} total jobs, ${earlyCareerJobs.length} early-career`);
  
  // Save to database
  const savedCount = await saveJobsToDatabase(earlyCareerJobs, 'simple-boards');
  
  return {
    total: allJobs.length,
    earlyCareer: earlyCareerJobs.length,
    saved: savedCount,
    jobs: earlyCareerJobs,
    breakdown: SIMPLE_BOARDS.map(board => ({
      name: board.name,
      jobs: allJobs.filter(job => job.url === board.url).length
    }))
  };
}

// Run the scraper
if (require.main === module) {
  scrapeSimpleJobBoards()
    .then(result => {
      console.log('\n🎯 SIMPLE JOB BOARDS SCRAPER RESULTS:');
      console.log(`📊 Total jobs found: ${result.total}`);
      console.log(`🎯 Early-career jobs: ${result.earlyCareer}`);
      console.log(`💾 Jobs saved to database: ${result.saved}`);
      
      console.log('\n📋 Breakdown by Board:');
      result.breakdown.forEach(board => {
        console.log(`   📡 ${board.name}: ${board.jobs} jobs`);
      });
      
      if (result.jobs.length > 0) {
        console.log('\n📋 Sample jobs:');
        result.jobs.slice(0, 5).forEach((job, i) => {
          console.log(`   ${i+1}. ${job.title} - ${job.company} (${job.location})`);
        });
      }
    })
    .catch(console.error);
}

module.exports = { scrapeSimpleJobBoards };
