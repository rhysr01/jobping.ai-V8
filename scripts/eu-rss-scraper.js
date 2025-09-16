#!/usr/bin/env node

/**
 * 🇪🇺 EU RSS SCRAPER - No API Required!
 * 
 * Scrapes EU job boards via RSS feeds
 * Fast, simple, no browser needed
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// EU Job Board RSS Feeds
const EU_RSS_FEEDS = [
  // Germany
  'https://www.stepstone.de/rss/jobs.xml?keywords=graduate&location=berlin',
  'https://www.stepstone.de/rss/jobs.xml?keywords=junior&location=munich',
  'https://www.stepstone.de/rss/jobs.xml?keywords=trainee&location=berlin',
  
  // France
  'https://www.apec.fr/candidat/services-offres-d-emploi/feed/rss',
  'https://www.jobijoba.com/rss.xml?keywords=graduate',
  
  // Netherlands
  'https://www.nationalevacaturebank.nl/rss.xml',
  'https://www.jobbird.com/rss.xml?keywords=graduate',
  
  // Spain
  'https://www.infojobs.net/rss/ofertas.xml?keywords=graduate',
  'https://www.trabajos.com/rss.xml?keywords=junior',
  
  // Italy
  'https://www.jobrapido.it/rss.xml?keywords=graduate',
  'https://www.infojobs.it/rss.xml?keywords=junior',
  
  // Ireland
  'https://www.jobs.ie/rss.xml?keywords=graduate',
  'https://www.irishjobs.ie/rss.xml?keywords=junior'
];

// Job normalization function
function normalizeJob(jobData, source = 'eu-rss') {
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

// Parse RSS XML
function parseRSS(xmlData, source) {
  const jobs = [];
  
  try {
    // Simple RSS parsing (basic implementation)
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
    const linkRegex = /<link><!\[CDATA\[(.*?)\]\]><\/link>/g;
    const descriptionRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/g;
    
    let titleMatch, linkMatch, descMatch;
    const titles = [];
    const links = [];
    const descriptions = [];
    
    while ((titleMatch = titleRegex.exec(xmlData)) !== null) {
      titles.push(titleMatch[1]);
    }
    
    while ((linkMatch = linkRegex.exec(xmlData)) !== null) {
      links.push(linkMatch[1]);
    }
    
    while ((descMatch = descriptionRegex.exec(xmlData)) !== null) {
      descriptions.push(descMatch[1]);
    }
    
    // Match titles with links and descriptions
    for (let i = 0; i < titles.length; i++) {
      if (titles[i] && !titles[i].includes('RSS') && !titles[i].includes('Feed')) {
        const job = {
          title: titles[i],
          company: 'Unknown', // Extract from title if possible
          location: 'EU', // Extract from description if possible
          description: descriptions[i] || '',
          url: links[i] || '',
          postedAt: new Date().toISOString()
        };
        
        // Try to extract company from title
        const titleParts = titles[i].split(' - ');
        if (titleParts.length > 1) {
          job.company = titleParts[titleParts.length - 1].trim();
        }
        
        jobs.push(job);
      }
    }
    
  } catch (error) {
    console.log(`   Error parsing RSS: ${error.message}`);
  }
  
  return jobs;
}

// Fetch RSS feed
async function fetchRSSFeed(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

async function scrapeEURSS() {
  console.log('🇪🇺 Starting EU RSS scraper...');
  
  let allJobs = [];
  
  for (const feedUrl of EU_RSS_FEEDS.slice(0, 8)) { // Limit to avoid rate limits
    try {
      console.log(`📡 Fetching: ${feedUrl}`);
      
      const xmlData = await fetchRSSFeed(feedUrl);
      const jobs = parseRSS(xmlData, 'eu-rss');
      
      console.log(`   Found ${jobs.length} jobs`);
      allJobs.push(...jobs);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   Error fetching ${feedUrl}: ${error.message}`);
    }
  }
  
  // Normalize and filter jobs
  const normalizedJobs = allJobs.map(job => normalizeJob(job, 'eu-rss')).filter(job => job !== null);
  const earlyCareerJobs = normalizedJobs.filter(job => job.is_graduate);
  
  console.log(`✅ EU RSS: ${allJobs.length} total jobs, ${earlyCareerJobs.length} early-career`);
  
  // Save to database
  const savedCount = await saveJobsToDatabase(earlyCareerJobs, 'eu-rss');
  
  return {
    total: allJobs.length,
    earlyCareer: earlyCareerJobs.length,
    saved: savedCount,
    jobs: earlyCareerJobs
  };
}

// Run the scraper
if (require.main === module) {
  scrapeEURSS()
    .then(result => {
      console.log('\n🎯 EU RSS SCRAPER RESULTS:');
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

module.exports = { scrapeEURSS };
