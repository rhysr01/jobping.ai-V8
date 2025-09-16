#!/usr/bin/env node

/**
 * 🎓 ADVANCED UNIVERSITY CAREERS SCRAPER - Puppeteer Edition
 * 
 * Scrapes public job listings from top EU universities using Puppeteer:
 * - Imperial College London (external candidates only)
 * - LSE (engage|ats with pagination)
 * - ETH Zurich (job board with metadata)
 * - TUM Munich (job portal + RSS)
 * 
 * Expected: 80-160 jobs per run
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// University configurations with specific URLs
const UNIVERSITIES = [
  {
    name: 'Imperial College London',
    country: 'UK',
    baseUrl: 'https://www.imperial.ac.uk',
    searchUrl: 'https://www.imperial.ac.uk/jobs/search-jobs/',
    type: 'external-search',
    selectors: {
      jobCards: '[data-test="job-card"], .job-listing, .vacancy-item',
      title: 'h3, h4, .job-title, .vacancy-title',
      company: '.job-company, .employer, .department',
      location: '.job-location, .location',
      link: 'a[href*="/jobs/"]',
      description: '.job-description, .vacancy-summary'
    }
  },
  {
    name: 'LSE',
    country: 'UK', 
    baseUrl: 'https://jobs.lse.ac.uk',
    searchUrl: 'https://jobs.lse.ac.uk/VacanciesV2.aspx',
    type: 'ats-pagination',
    selectors: {
      jobCards: '.vacancy-row, tr[class*="vacancy"]',
      title: '.vacancy-title, .job-title',
      company: '.department, .area',
      location: '.location',
      link: 'a[href*="VacancyDetails"]',
      description: '.vacancy-summary'
    }
  },
  {
    name: 'ETH Zurich',
    country: 'Switzerland',
    baseUrl: 'https://jobs.ethz.ch',
    searchUrl: 'https://jobs.ethz.ch/en/jobs/',
    type: 'job-board',
    selectors: {
      jobCards: '.job-item, .position-item, .vacancy-card',
      title: '.job-title, .position-title, h3',
      company: '.department, .institute, .unit',
      location: '.location, .workplace',
      link: 'a[href*="/jobs/"]',
      description: '.job-summary, .position-summary'
    }
  },
  {
    name: 'TUM Munich',
    country: 'Germany',
    baseUrl: 'https://portal.mytum.de',
    searchUrl: 'https://portal.mytum.de/jobs',
    type: 'job-portal',
    selectors: {
      jobCards: '.job-card, .position-card, .vacancy-item',
      title: '.job-title, .position-title, h3',
      company: '.employer, .company, .department',
      location: '.location, .workplace',
      link: 'a[href*="/jobs/"]',
      description: '.job-description, .position-summary'
    }
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
  const earlyCareerTerms = /(graduate|junior|trainee|entry.?level|intern|apprentice|fresh|new.?grad|praktikant|einsteiger|absolvent|stagiaire|jeune diplome|debutant|becario|practicante|recien graduado|stagista|neo laureato|stagiair|starter|associate|assistant|career.?starter|entry|recent.?graduate|campus.?hire|research.?assistant|teaching.?assistant|postdoc|phd.?student|doctoral|werkstudent|praktikum|wissenschaftlicher.?mitarbeiter|wissenschaftliche.?hilfskraft)/i;
  const seniorTerms = /(senior|lead|principal|manager|director|head|chief|vp|vice.?president|executive|5\+.?years|7\+.?years|10\+.?years|experienced|expert|specialist|consultant|coordinator|professor|chair|prof\.|ordentlicher|extraordinarius)/i;
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

// Scrape Imperial College London
async function scrapeImperial(page) {
  console.log('🏛️ Scraping Imperial College London...');
  
  try {
    await page.goto('https://www.imperial.ac.uk/jobs/search-jobs/', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for job listings to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const jobs = await page.evaluate(() => {
      const jobCards = document.querySelectorAll('[data-test="job-card"], .job-listing, .vacancy-item, .search-result');
      const jobData = [];
      
      jobCards.forEach(card => {
        try {
          const titleEl = card.querySelector('h3, h4, .job-title, .vacancy-title, .search-result-title');
          const companyEl = card.querySelector('.job-company, .employer, .department, .search-result-department');
          const locationEl = card.querySelector('.job-location, .location, .search-result-location');
          const linkEl = card.querySelector('a[href*="/jobs/"]');
          const descEl = card.querySelector('.job-description, .vacancy-summary, .search-result-summary');
          
          if (titleEl && linkEl) {
            const title = titleEl.textContent?.trim() || '';
            const company = companyEl?.textContent?.trim() || 'Imperial College London';
            const location = locationEl?.textContent?.trim() || 'London, UK';
            const url = linkEl.href.startsWith('http') ? linkEl.href : `https://www.imperial.ac.uk${linkEl.href}`;
            const description = descEl?.textContent?.trim() || '';
            
            if (title && !title.includes('cookie') && !title.includes('privacy')) {
              jobData.push({
                title,
                company,
                location,
                description,
                url,
                postedAt: new Date().toISOString()
              });
            }
          }
        } catch (e) {
          console.log('Error parsing Imperial job card:', e);
        }
      });
      
      return jobData;
    });
    
    console.log(`   Found ${jobs.length} jobs`);
    return jobs;
    
  } catch (error) {
    console.log(`   Error scraping Imperial: ${error.message}`);
    return [];
  }
}

// Scrape LSE
async function scrapeLSE(page) {
  console.log('🎓 Scraping LSE (London School of Economics)...');
  
  try {
    await page.goto('https://jobs.lse.ac.uk/VacanciesV2.aspx', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for ATS to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const jobs = await page.evaluate(() => {
      const jobRows = document.querySelectorAll('.vacancy-row, tr[class*="vacancy"], .job-row');
      const jobData = [];
      
      jobRows.forEach(row => {
        try {
          const titleEl = row.querySelector('.vacancy-title, .job-title, td:nth-child(2)');
          const linkEl = row.querySelector('a[href*="VacancyDetails"], a[href*="vacancy"]');
          const departmentEl = row.querySelector('.department, .area, td:nth-child(3)');
          const dateEl = row.querySelector('.date, .posted-date, td:nth-child(4)');
          
          if (titleEl && linkEl) {
            const title = titleEl.textContent?.trim() || '';
            const company = departmentEl?.textContent?.trim() || 'LSE (London School of Economics)';
            const location = 'London, UK';
            const url = linkEl.href.startsWith('http') ? linkEl.href : `https://jobs.lse.ac.uk/${linkEl.href}`;
            
            if (title && !title.includes('cookie') && !title.includes('privacy')) {
              jobData.push({
                title,
                company,
                location,
                description: `Job at LSE - ${company}`,
                url,
                postedAt: dateEl?.textContent?.trim() || new Date().toISOString()
              });
            }
          }
        } catch (e) {
          console.log('Error parsing LSE job row:', e);
        }
      });
      
      return jobData;
    });
    
    console.log(`   Found ${jobs.length} jobs`);
    return jobs;
    
  } catch (error) {
    console.log(`   Error scraping LSE: ${error.message}`);
    return [];
  }
}

// Scrape ETH Zurich
async function scrapeETH(page) {
  console.log('🏛️ Scraping ETH Zurich...');
  
  try {
    await page.goto('https://jobs.ethz.ch/en/jobs/', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for job board to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const jobs = await page.evaluate(() => {
      const jobItems = document.querySelectorAll('.job-item, .position-item, .vacancy-card, .job-listing');
      const jobData = [];
      
      jobItems.forEach(item => {
        try {
          const titleEl = item.querySelector('.job-title, .position-title, h3, h4');
          const linkEl = item.querySelector('a[href*="/jobs/"], a[href*="/position/"]');
          const departmentEl = item.querySelector('.department, .institute, .unit, .employer');
          const locationEl = item.querySelector('.location, .workplace');
          const workloadEl = item.querySelector('.workload, .percentage');
          const descEl = item.querySelector('.job-summary, .position-summary, .description');
          
          if (titleEl && linkEl) {
            const title = titleEl.textContent?.trim() || '';
            const company = departmentEl?.textContent?.trim() || 'ETH Zurich';
            const location = locationEl?.textContent?.trim() || 'Zurich, Switzerland';
            const url = linkEl.href.startsWith('http') ? linkEl.href : `https://jobs.ethz.ch${linkEl.href}`;
            const description = descEl?.textContent?.trim() || `Position at ETH Zurich - ${workloadEl?.textContent?.trim() || ''}`;
            
            if (title && !title.includes('cookie') && !title.includes('privacy')) {
              jobData.push({
                title,
                company,
                location,
                description,
                url,
                postedAt: new Date().toISOString()
              });
            }
          }
        } catch (e) {
          console.log('Error parsing ETH job item:', e);
        }
      });
      
      return jobData;
    });
    
    console.log(`   Found ${jobs.length} jobs`);
    return jobs;
    
  } catch (error) {
    console.log(`   Error scraping ETH: ${error.message}`);
    return [];
  }
}

// Scrape TUM Munich
async function scrapeTUM(page) {
  console.log('🏛️ Scrape TUM Munich...');
  
  try {
    await page.goto('https://portal.mytum.de/jobs', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for job portal to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const jobs = await page.evaluate(() => {
      const jobCards = document.querySelectorAll('.job-card, .position-card, .vacancy-item, .job-listing');
      const jobData = [];
      
      jobCards.forEach(card => {
        try {
          const titleEl = card.querySelector('.job-title, .position-title, h3, h4');
          const linkEl = card.querySelector('a[href*="/jobs/"], a[href*="/position/"]');
          const employerEl = card.querySelector('.employer, .company, .department');
          const locationEl = card.querySelector('.location, .workplace');
          const contractEl = card.querySelector('.contract-type, .job-type');
          const descEl = card.querySelector('.job-description, .position-summary');
          
          if (titleEl && linkEl) {
            const title = titleEl.textContent?.trim() || '';
            const company = employerEl?.textContent?.trim() || 'TUM Munich';
            const location = locationEl?.textContent?.trim() || 'Munich, Germany';
            const url = linkEl.href.startsWith('http') ? linkEl.href : `https://portal.mytum.de${linkEl.href}`;
            const description = descEl?.textContent?.trim() || `Position at TUM Munich - ${contractEl?.textContent?.trim() || ''}`;
            
            if (title && !title.includes('cookie') && !title.includes('privacy')) {
              jobData.push({
                title,
                company,
                location,
                description,
                url,
                postedAt: new Date().toISOString()
              });
            }
          }
        } catch (e) {
          console.log('Error parsing TUM job card:', e);
        }
      });
      
      return jobData;
    });
    
    console.log(`   Found ${jobs.length} jobs`);
    return jobs;
    
  } catch (error) {
    console.log(`   Error scraping TUM: ${error.message}`);
    return [];
  }
}

async function scrapeUniversityCareersAdvanced() {
  console.log('🎓 Starting Advanced University Careers scraper...');
  
  let browser;
  let allJobs = [];
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Scrape each university
    const imperialJobs = await scrapeImperial(page);
    const lseJobs = await scrapeLSE(page);
    const ethJobs = await scrapeETH(page);
    const tumJobs = await scrapeTUM(page);
    
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
    
  } catch (error) {
    console.error('❌ University Careers scraper error:', error);
    return { total: 0, earlyCareer: 0, saved: 0, jobs: [], breakdown: { imperial: 0, lse: 0, eth: 0, tum: 0 } };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the scraper
if (require.main === module) {
  scrapeUniversityCareersAdvanced()
    .then(result => {
      console.log('\n🎯 ADVANCED UNIVERSITY CAREERS SCRAPER RESULTS:');
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

module.exports = { scrapeUniversityCareersAdvanced };
