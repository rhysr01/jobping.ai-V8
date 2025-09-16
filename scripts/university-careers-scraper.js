#!/usr/bin/env node

/**
 * 🎓 UNIVERSITY CAREERS SCRAPER - No API Required!
 * 
 * Scrapes public job listings from top EU universities:
 * - Imperial College London
 * - LSE (London School of Economics) 
 * - ETH Zurich
 * - TUM Munich
 * 
 * Expected: 80-160 jobs per run
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// University configurations
const UNIVERSITIES = [
  {
    name: 'Imperial College London',
    country: 'UK',
    baseUrl: 'https://www.imperial.ac.uk',
    searchUrl: 'https://www.imperial.ac.uk/jobs/search-jobs/',
    type: 'external-search'
  },
  {
    name: 'LSE',
    country: 'UK', 
    baseUrl: 'https://jobs.lse.ac.uk',
    searchUrl: 'https://jobs.lse.ac.uk/VacanciesV2.aspx',
    type: 'ats-pagination'
  },
  {
    name: 'ETH Zurich',
    country: 'Switzerland',
    baseUrl: 'https://jobs.ethz.ch',
    searchUrl: 'https://jobs.ethz.ch/en/jobs/',
    type: 'job-board'
  },
  {
    name: 'TUM Munich',
    country: 'Germany',
    baseUrl: 'https://portal.mytum.de',
    searchUrl: 'https://portal.mytum.de/jobs',
    type: 'job-portal'
  }
];

// Job normalization function
function normalizeJob(jobData, source = 'university-careers') {
  const crypto = require('crypto');
  const title = jobData.title || '';
  const company = jobData.company || jobData.department || '';
  const location = jobData.location || '';
  const description = jobData.description || '';
  const url = jobData.url || '';
  
  const hashString = `${title.toLowerCase().trim()}|${company.toLowerCase().trim()}|${location.toLowerCase().trim()}`;
  const jobHash = crypto.createHash('sha256').update(hashString).digest('hex');
  const text = `${title} ${description}`.toLowerCase();
  
  // Enhanced early-career detection for university roles
  const earlyCareerTerms = /(graduate|junior|trainee|entry.?level|intern|apprentice|fresh|new.?grad|praktikant|einsteiger|absolvent|stagiaire|jeune diplome|debutant|becario|practicante|recien graduado|stagista|neo laureato|stagiair|starter|associate|assistant|career.?starter|entry|recent.?graduate|campus.?hire|research.?assistant|teaching.?assistant|postdoc|phd.?student|doctoral|werkstudent|praktikum)/i;
  const seniorTerms = /(senior|lead|principal|manager|director|head|chief|vp|vice.?president|executive|5\+.?years|7\+.?years|10\+.?years|experienced|expert|specialist|consultant|coordinator|professor|chair)/i;
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
    categories: isEarlyCareer ? ['early-career', 'university'] : ['university'],
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
    is_internship: /intern|praktikum/i.test(title),
    region: '',
    board: 'university'
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

// Parse Imperial College London jobs
async function scrapeImperial() {
  console.log('🏛️ Scraping Imperial College London...');
  
  try {
    const html = await fetchHTML('https://www.imperial.ac.uk/jobs/search-jobs/');
    
    // Parse job listings from search results
    const jobs = [];
    const titleRegex = /<h[1-6][^>]*class="[^"]*job[^"]*title[^"]*"[^>]*>(.*?)<\/h[1-6]>/gi;
    const linkRegex = /<a[^>]*href="([^"]*\/jobs\/[^"]*)"[^>]*>/gi;
    
    let titleMatch, linkMatch;
    const titles = [];
    const links = [];
    
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      titles.push(titleMatch[1].replace(/<[^>]*>/g, '').trim());
    }
    
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      links.push(linkMatch[1]);
    }
    
    for (let i = 0; i < Math.min(titles.length, 20); i++) {
      if (titles[i] && !titles[i].includes('cookie') && !titles[i].includes('privacy')) {
        jobs.push({
          title: titles[i],
          company: 'Imperial College London',
          location: 'London, UK',
          description: `Job at Imperial College London`,
          url: links[i] ? `https://www.imperial.ac.uk${links[i]}` : 'https://www.imperial.ac.uk/jobs/',
          postedAt: new Date().toISOString()
        });
      }
    }
    
    console.log(`   Found ${jobs.length} jobs`);
    return jobs;
    
  } catch (error) {
    console.log(`   Error scraping Imperial: ${error.message}`);
    return [];
  }
}

// Parse LSE jobs
async function scrapeLSE() {
  console.log('🎓 Scraping LSE (London School of Economics)...');
  
  try {
    const html = await fetchHTML('https://jobs.lse.ac.uk/VacanciesV2.aspx');
    
    // Parse job listings from ATS
    const jobs = [];
    const vacancyRegex = /<tr[^>]*class="[^"]*vacancy[^"]*"[^>]*>(.*?)<\/tr>/gi;
    const titleRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
    
    let vacancyMatch, titleMatch;
    
    while ((vacancyMatch = vacancyRegex.exec(html)) !== null) {
      const vacancyHtml = vacancyMatch[1];
      
      // Extract title and link from vacancy row
      const titleMatch = titleRegex.exec(vacancyHtml);
      if (titleMatch) {
        jobs.push({
          title: titleMatch[2].trim(),
          company: 'LSE (London School of Economics)',
          location: 'London, UK',
          description: `Job at LSE`,
          url: `https://jobs.lse.ac.uk${titleMatch[1]}`,
          postedAt: new Date().toISOString()
        });
      }
    }
    
    console.log(`   Found ${jobs.length} jobs`);
    return jobs;
    
  } catch (error) {
    console.log(`   Error scraping LSE: ${error.message}`);
    return [];
  }
}

// Parse ETH Zurich jobs
async function scrapeETH() {
  console.log('🏛️ Scraping ETH Zurich...');
  
  try {
    const html = await fetchHTML('https://jobs.ethz.ch/en/jobs/');
    
    // Parse job listings from job board
    const jobs = [];
    const jobRegex = /<div[^>]*class="[^"]*job[^"]*"[^>]*>(.*?)<\/div>/gi;
    const titleRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/gi;
    
    let jobMatch, titleMatch, linkMatch;
    
    while ((jobMatch = jobRegex.exec(html)) !== null) {
      const jobHtml = jobMatch[1];
      
      // Extract title and link
      const titleMatch = titleRegex.exec(jobHtml);
      const linkMatch = linkRegex.exec(jobHtml);
      
      if (titleMatch) {
        jobs.push({
          title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
          company: 'ETH Zurich',
          location: 'Zurich, Switzerland',
          description: `Job at ETH Zurich`,
          url: linkMatch ? `https://jobs.ethz.ch${linkMatch[1]}` : 'https://jobs.ethz.ch/',
          postedAt: new Date().toISOString()
        });
      }
    }
    
    console.log(`   Found ${jobs.length} jobs`);
    return jobs;
    
  } catch (error) {
    console.log(`   Error scraping ETH: ${error.message}`);
    return [];
  }
}

// Parse TUM Munich jobs
async function scrapeTUM() {
  console.log('🏛️ Scraping TUM Munich...');
  
  try {
    const html = await fetchHTML('https://portal.mytum.de/jobs');
    
    // Parse job listings from job portal
    const jobs = [];
    const jobRegex = /<div[^>]*class="[^"]*job[^"]*"[^>]*>(.*?)<\/div>/gi;
    const titleRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/gi;
    
    let jobMatch, titleMatch, linkMatch;
    
    while ((jobMatch = jobRegex.exec(html)) !== null) {
      const jobHtml = jobMatch[1];
      
      // Extract title and link
      const titleMatch = titleRegex.exec(jobHtml);
      const linkMatch = linkRegex.exec(jobHtml);
      
      if (titleMatch) {
        jobs.push({
          title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
          company: 'TUM Munich',
          location: 'Munich, Germany',
          description: `Job at TUM Munich`,
          url: linkMatch ? `https://portal.mytum.de${linkMatch[1]}` : 'https://portal.mytum.de/jobs',
          postedAt: new Date().toISOString()
        });
      }
    }
    
    console.log(`   Found ${jobs.length} jobs`);
    return jobs;
    
  } catch (error) {
    console.log(`   Error scraping TUM: ${error.message}`);
    return [];
  }
}

async function scrapeUniversityCareers() {
  console.log('🎓 Starting University Careers scraper...');
  
  let allJobs = [];
  
  // Scrape each university
  const imperialJobs = await scrapeImperial();
  const lseJobs = await scrapeLSE();
  const ethJobs = await scrapeETH();
  const tumJobs = await scrapeTUM();
  
  allJobs = [...imperialJobs, ...lseJobs, ...ethJobs, ...tumJobs];
  
  // Normalize and filter jobs
  const normalizedJobs = allJobs.map(job => normalizeJob(job, 'university-careers')).filter(job => job !== null);
  const earlyCareerJobs = normalizedJobs.filter(job => job.is_graduate);
  
  console.log(`✅ University Careers: ${allJobs.length} total jobs, ${earlyCareerJobs.length} early-career`);
  
  // Save to database
  const savedCount = await saveJobsToDatabase(earlyCareerJobs, 'university-careers');
  
  return {
    total: allJobs.length,
    earlyCareer: earlyCareerJobs.length,
    saved: savedCount,
    jobs: earlyCareerJobs,
    breakdown: {
      imperial: imperialJobs.length,
      lse: lseJobs.length,
      eth: ethJobs.length,
      tum: tumJobs.length
    }
  };
}

// Run the scraper
if (require.main === module) {
  scrapeUniversityCareers()
    .then(result => {
      console.log('\n🎯 UNIVERSITY CAREERS SCRAPER RESULTS:');
      console.log(`📊 Total jobs found: ${result.total}`);
      console.log(`🎯 Early-career jobs: ${result.earlyCareer}`);
      console.log(`💾 Jobs saved to database: ${result.saved}`);
      
      console.log('\n📋 Breakdown by University:');
      console.log(`   🏛️ Imperial College London: ${result.breakdown.imperial} jobs`);
      console.log(`   🎓 LSE: ${result.breakdown.lse} jobs`);
      console.log(`   🏛️ ETH Zurich: ${result.breakdown.eth} jobs`);
      console.log(`   🏛️ TUM Munich: ${result.breakdown.tum} jobs`);
      
      if (result.jobs.length > 0) {
        console.log('\n📋 Sample jobs:');
        result.jobs.slice(0, 5).forEach((job, i) => {
          console.log(`   ${i+1}. ${job.title} - ${job.company} (${job.location})`);
        });
      }
    })
    .catch(console.error);
}

module.exports = { scrapeUniversityCareers };
