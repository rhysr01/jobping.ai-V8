#!/usr/bin/env node

/**
 * 🇪🇺 EU JOB BOARDS SCRAPER - Simple HTTP Requests
 * 
 * Scrapes EU job boards with basic HTTP requests
 * No browser needed, fast and reliable
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// EU Job Boards to scrape
const EU_JOB_BOARDS = [
  {
    name: 'Jobs.ie',
    url: 'https://www.jobs.ie/graduate-jobs',
    country: 'Ireland'
  },
  {
    name: 'Irish Jobs',
    url: 'https://www.irishjobs.ie/graduate-jobs',
    country: 'Ireland'
  },
  {
    name: 'TotalJobs UK',
    url: 'https://www.totaljobs.com/jobs/graduate',
    country: 'UK'
  },
  {
    name: 'CV Library UK',
    url: 'https://www.cv-library.co.uk/graduate-jobs',
    country: 'UK'
  }
];

// Job normalization function
function normalizeJob(jobData, source = 'eu-boards') {
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
  const earlyCareerTerms = /(graduate|junior|trainee|entry.?level|intern|apprentice|fresh|new.?grad|praktikant|einsteiger|absolvent|stagiaire|jeune diplome|debutant|becario|practicante|recien graduado|stagista|neo laureato|stagiair|starter|associate|assistant|career.?starter|entry|recent.?graduate|campus.?hire)/i;
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
    platform: 'ats',
    work_environment: 'on-site',
    categories: isEarlyCareer ? ['early-career'] : [],
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
    board: null
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

// Fetch HTML page
async function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

// Parse HTML for job listings (basic implementation)
function parseHTMLForJobs(html, boardName) {
  const jobs = [];
  
  try {
    // Simple HTML parsing - look for common job listing patterns
    const titleRegex = /<h[1-6][^>]*class="[^"]*job[^"]*title[^"]*"[^>]*>(.*?)<\/h[1-6]>/gi;
    const companyRegex = /<span[^>]*class="[^"]*company[^"]*"[^>]*>(.*?)<\/span>/gi;
    const locationRegex = /<span[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/span>/gi;
    
    let titleMatch, companyMatch, locationMatch;
    const titles = [];
    const companies = [];
    const locations = [];
    
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      titles.push(titleMatch[1].replace(/<[^>]*>/g, '').trim());
    }
    
    while ((companyMatch = companyRegex.exec(html)) !== null) {
      companies.push(companyMatch[1].replace(/<[^>]*>/g, '').trim());
    }
    
    while ((locationMatch = locationRegex.exec(html)) !== null) {
      locations.push(locationMatch[1].replace(/<[^>]*>/g, '').trim());
    }
    
    // Create jobs from found data
    for (let i = 0; i < Math.min(titles.length, 10); i++) { // Limit to 10 jobs per board
      if (titles[i] && !titles[i].includes('cookie') && !titles[i].includes('privacy')) {
        jobs.push({
          title: titles[i],
          company: companies[i] || 'Unknown',
          location: locations[i] || 'Unknown',
          description: `Job found on ${boardName}`,
          url: `https://${boardName.toLowerCase().replace(' ', '')}.com`,
          postedAt: new Date().toISOString()
        });
      }
    }
    
  } catch (error) {
    console.log(`   Error parsing HTML: ${error.message}`);
  }
  
  return jobs;
}

async function scrapeEUJobBoards() {
  console.log('🇪🇺 Starting EU Job Boards scraper...');
  
  let allJobs = [];
  
  for (const board of EU_JOB_BOARDS.slice(0, 2)) { // Limit to avoid rate limits
    try {
      console.log(`📡 Scraping: ${board.name} (${board.country})`);
      
      const html = await fetchHTML(board.url);
      const jobs = parseHTMLForJobs(html, board.name);
      
      console.log(`   Found ${jobs.length} jobs`);
      allJobs.push(...jobs);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   Error scraping ${board.name}: ${error.message}`);
    }
  }
  
  // Normalize and filter jobs
  const normalizedJobs = allJobs.map(job => normalizeJob(job, 'eu-boards')).filter(job => job !== null);
  const earlyCareerJobs = normalizedJobs.filter(job => job.is_graduate);
  
  console.log(`✅ EU Job Boards: ${allJobs.length} total jobs, ${earlyCareerJobs.length} early-career`);
  
  // Save to database
  const savedCount = await saveJobsToDatabase(earlyCareerJobs, 'eu-boards');
  
  return {
    total: allJobs.length,
    earlyCareer: earlyCareerJobs.length,
    saved: savedCount,
    jobs: earlyCareerJobs
  };
}

// Run the scraper
if (require.main === module) {
  scrapeEUJobBoards()
    .then(result => {
      console.log('\n🎯 EU JOB BOARDS SCRAPER RESULTS:');
      console.log(`📊 Total jobs found: ${result.total}`);
      console.log(`🎯 Early-career jobs: ${result.earlyCareer}`);
      console.log(`💾 Jobs saved to database: ${result.saved}`);
      
      if (result.jobs.length > 0) {
        console.log('\n📋 Sample jobs:');
        result.jobs.slice(0, 5).forEach((job, i) => {
          console.log(`   ${i+1}. ${job.title} - ${job.company} (${job.location})`);
        });
      }
    })
    .catch(console.error);
}

module.exports = { scrapeEUJobBoards };
