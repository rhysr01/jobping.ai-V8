#!/usr/bin/env node

/**
 * 📰 TOTALJOBS UK SCRAPER - No API Required!
 * 
 * Scrapes graduate and early-career jobs from TotalJobs UK
 * Expected: 50-100 jobs per run
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Job normalization function
function normalizeJob(jobData, source = 'totaljobs') {
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

async function scrapeTotalJobs() {
  console.log('📰 Starting TotalJobs UK scraper...');
  
  let browser;
  let allJobs = [];
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Search terms for early-career jobs
    const searchTerms = [
      'graduate',
      'junior',
      'trainee',
      'entry level',
      'intern',
      'associate',
      'new graduate',
      'recent graduate',
      'campus hire'
    ];
    
    // UK locations
    const locations = [
      'London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Belfast',
      'Leeds', 'Liverpool', 'Bristol', 'Cardiff', 'Newcastle', 'Nottingham'
    ];
    
    for (const location of locations.slice(0, 6)) { // Limit to avoid rate limits
      for (const term of searchTerms.slice(0, 3)) { // Limit terms per location
        try {
          console.log(`🔍 Searching: "${term}" in ${location}`);
          
          // Navigate to TotalJobs search
          const searchUrl = `https://www.totaljobs.com/jobs/${encodeURIComponent(term)}/in-${encodeURIComponent(location)}`;
          await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Wait for job listings to load
          await page.waitForSelector('[data-test="job-card"]', { timeout: 10000 });
          
          // Extract job data
          const jobs = await page.evaluate(() => {
            const jobCards = document.querySelectorAll('[data-test="job-card"]');
            const jobData = [];
            
            jobCards.forEach(card => {
              try {
                const titleEl = card.querySelector('[data-test="job-title"]');
                const companyEl = card.querySelector('[data-test="job-company"]');
                const locationEl = card.querySelector('[data-test="job-location"]');
                const urlEl = card.querySelector('a[data-test="job-title"]');
                
                if (titleEl && companyEl) {
                  jobData.push({
                    title: titleEl.textContent?.trim() || '',
                    company: companyEl.textContent?.trim() || '',
                    location: locationEl?.textContent?.trim() || '',
                    url: urlEl?.href || '',
                    description: '', // TotalJobs doesn't show description in listing
                    postedAt: new Date().toISOString()
                  });
                }
              } catch (e) {
                console.log('Error parsing job card:', e);
              }
            });
            
            return jobData;
          });
          
          console.log(`   Found ${jobs.length} jobs for "${term}" in ${location}`);
          allJobs.push(...jobs);
          
          // Small delay between searches
          await page.waitForTimeout(1000);
          
        } catch (error) {
          console.log(`   Error searching "${term}" in ${location}:`, error.message);
        }
      }
    }
    
    // Normalize and filter jobs
    const normalizedJobs = allJobs.map(job => normalizeJob(job, 'totaljobs')).filter(job => job !== null);
    const earlyCareerJobs = normalizedJobs.filter(job => job.is_graduate);
    
    console.log(`✅ TotalJobs: ${allJobs.length} total jobs, ${earlyCareerJobs.length} early-career`);
    
    // Save to database
    const savedCount = await saveJobsToDatabase(earlyCareerJobs, 'totaljobs');
    
    return {
      total: allJobs.length,
      earlyCareer: earlyCareerJobs.length,
      saved: savedCount,
      jobs: earlyCareerJobs
    };
    
  } catch (error) {
    console.error('❌ TotalJobs scraper error:', error);
    return { total: 0, earlyCareer: 0, saved: 0, jobs: [] };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the scraper
if (require.main === module) {
  scrapeTotalJobs()
    .then(result => {
      console.log('\n🎯 TOTALJOBS SCRAPER RESULTS:');
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

module.exports = { scrapeTotalJobs };
