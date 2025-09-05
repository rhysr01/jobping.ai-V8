#!/usr/bin/env node

/**
 * Enhanced Adzuna Job Scraper with Expanded Keywords
 * Collects even more early-career jobs for pilot data
 */

// Load environment variables from .env.local first, then .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

console.log('🚀 Enhanced Adzuna Job Scraper - Collecting Maximum Jobs!\n');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check environment variables
const adzunaAppId = process.env.ADZUNA_APP_ID;
const adzunaAppKey = process.env.ADZUNA_APP_KEY;

if (!adzunaAppId || !adzunaAppKey) {
  console.log('❌ Missing Adzuna environment variables');
  process.exit(1);
}

console.log('✅ Adzuna credentials loaded');
console.log(`   APP_ID: ${adzunaAppId.substring(0, 8)}...`);
console.log(`   APP_KEY: ${adzunaAppKey.substring(0, 8)}...\n`);

// Helper function to create job hash
function makeJobHash(job) {
  const content = `${job.title}${job.company}${job.location}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Helper function to save jobs to database
async function saveJobsToDatabase(jobs) {
  if (jobs.length === 0) return 0;
  
  console.log(`💾 Saving ${jobs.length} jobs to database...`);
  
  const jobData = jobs.map(job => ({
    job_hash: makeJobHash(job),
    source: 'adzuna',
    title: job.title,
    company: job.company,
    location: job.location,
    job_url: job.url,
    description: job.description,
    created_at: new Date().toISOString(),
    is_sent: false,
    status: 'active',
    freshness_tier: 'fresh',
    original_posted_date: job.posted ? new Date(job.posted).toISOString() : new Date().toISOString(),
    last_seen_at: new Date().toISOString()
  }));
  
  try {
    const { data, error } = await supabase
      .from('jobs')
      .upsert(jobData, { 
        onConflict: 'job_hash',
        ignoreDuplicates: true 
      })
      .select();
      
    if (error) {
      console.error('❌ Database error:', error);
      return 0;
    }
    
    console.log(`✅ Successfully saved ${data.length} new jobs to database`);
    return data.length;
  } catch (error) {
    console.error('❌ Error saving jobs:', error);
    return 0;
  }
}

// Enhanced target cities with expanded keywords
const targetCities = [
  { 
    name: 'London', 
    country: 'gb', 
    keywords: [
      'graduate trainee', 'graduate scheme', 'entry level', 'new graduate', 'recent graduate',
      'junior assistant', 'graduate analyst', 'trainee', 'apprentice', 'internship', 'placement',
      '1 year experience', '2 year experience', '1-2 years', 'up to 2 years', '0-2 years'
    ] 
  },
  { 
    name: 'Madrid', 
    country: 'es', 
    keywords: [
      'becario', 'prácticas', 'nivel inicial', 'recién graduado', 'sin experiencia',
      'primer empleo', 'joven graduado', 'estudiante', 'aprendiz', 'formación', 'iniciación',
      '1 año experiencia', '2 años experiencia', '1-2 años', 'hasta 2 años', '0-2 años'
    ] 
  },
  { 
    name: 'Barcelona', 
    country: 'es', 
    keywords: [
      'becario', 'prácticas', 'nivel inicial', 'recién graduado', 'sin experiencia',
      'primer empleo', 'joven graduado', 'estudiante', 'aprendiz', 'formación', 'iniciación',
      '1 año experiencia', '2 años experiencia', '1-2 años', 'hasta 2 años', '0-2 años'
    ] 
  },
  { 
    name: 'Berlin', 
    country: 'de', 
    keywords: [
      'praktikum', 'trainee', 'einsteiger', 'berufseinsteiger', 'absolvent',
      'neueinsteiger', 'anfänger', 'ausbildung', 'werkstudent', 'student', 'erstes jahr',
      '1 jahr erfahrung', '2 jahre erfahrung', '1-2 jahre', 'bis 2 jahre', '0-2 jahre'
    ] 
  },
  { 
    name: 'Amsterdam', 
    country: 'nl', 
    keywords: [
      'stagiair', 'werkstudent', 'starter', 'afgestudeerde', 'eerste baan',
      'beginnersfunctie', 'leerling', 'trainee', 'junior', 'entry level', 'student',
      '1 jaar ervaring', '2 jaar ervaring', '1-2 jaar', 'tot 2 jaar', '0-2 jaar'
    ] 
  },
  { 
    name: 'Paris', 
    country: 'fr', 
    keywords: [
      'stagiaire', 'alternance', 'débutant', 'premier emploi', 'jeune diplômé',
      'sans expérience', 'formation', 'apprenti', 'étudiant', 'trainee', 'junior',
      '1 an expérience', '2 ans expérience', '1-2 ans', 'jusqu\'à 2 ans', '0-2 ans'
    ] 
  },
  { 
    name: 'Dublin', 
    country: 'gb', 
    keywords: [
      'graduate trainee', 'graduate scheme', 'entry level', 'new graduate', 'recent graduate',
      'junior assistant', 'graduate analyst', 'trainee', 'apprentice', 'internship', 'placement',
      '1 year experience', '2 year experience', '1-2 years', 'up to 2 years', '0-2 years',
      'springboard', 'springboard course', 'springboard graduate', 'springboard trainee',
      'springboard internship', 'springboard placement', 'springboard entry level'
    ] 
  },
  { 
    name: 'Munich', 
    country: 'de', 
    keywords: [
      'praktikum', 'trainee', 'einsteiger', 'berufseinsteiger', 'absolvent',
      'neueinsteiger', 'anfänger', 'ausbildung', 'werkstudent', 'student', 'erstes jahr',
      '1 jahr erfahrung', '2 jahre erfahrung', '1-2 jahre', 'bis 2 jahre', '0-2 jahre'
    ] 
  },
  { 
    name: 'Hamburg', 
    country: 'de', 
    keywords: [
      'praktikum', 'trainee', 'einsteiger', 'berufseinsteiger', 'absolvent',
      'neueinsteiger', 'anfänger', 'ausbildung', 'werkstudent', 'student', 'erstes jahr',
      '1 jahr erfahrung', '2 jahre erfahrung', '1-2 jahre', 'bis 2 jahre', '0-2 jahre'
    ] 
  },
  { 
    name: 'Zurich', 
    country: 'ch', 
    keywords: [
      'praktikum', 'trainee', 'einsteiger', 'berufseinsteiger', 'absolvent',
      'neueinsteiger', 'anfänger', 'ausbildung', 'werkstudent', 'student', 'erstes jahr',
      '1 jahr erfahrung', '2 jahre erfahrung', '1-2 jahre', 'bis 2 jahre', '0-2 jahre'
    ] 
  },
  { 
    name: 'Cork', 
    country: 'gb', 
    keywords: [
      'graduate trainee', 'graduate scheme', 'entry level', 'new graduate', 'recent graduate',
      'junior assistant', 'graduate analyst', 'trainee', 'apprentice', 'internship', 'placement',
      '1 year experience', '2 year experience', '1-2 years', 'up to 2 years', '0-2 years',
      'springboard', 'springboard course', 'springboard graduate', 'springboard trainee'
    ] 
  },
  { 
    name: 'Galway', 
    country: 'gb', 
    keywords: [
      'graduate trainee', 'graduate scheme', 'entry level', 'new graduate', 'recent graduate',
      'junior assistant', 'graduate analyst', 'trainee', 'apprentice', 'internship', 'placement',
      '1 year experience', '2 year experience', '1-2 years', 'up to 2 years', '0-2 years',
      'springboard', 'springboard course', 'springboard graduate', 'springboard trainee'
    ] 
  }
];

// Scrape jobs from a city with enhanced error handling
const scrapeCityJobs = async (city, keywords) => {
  const jobs = [];
  
  for (const keyword of keywords) {
    try {
      console.log(`📍 Searching ${city.name} for: ${keyword}`);
      
      const url = `https://api.adzuna.com/v1/api/jobs/${city.country}/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(city.name)}&results_per_page=25&sort_by=date`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'JobPing/1.0 (https://jobping.com)',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.results && response.data.results.length > 0) {
        console.log(`   ✅ Found ${response.data.results.length} jobs for "${keyword}"`);
        
        // Process and format jobs with enhanced data
        response.data.results.forEach(job => {
          const formattedJob = {
            title: job.title,
            company: job.company?.display_name || 'Company not specified',
            location: job.location?.display_name || city.name,
            description: job.description?.substring(0, 200) + '...',
            url: job.redirect_url,
            posted: job.created,
            salary: job.salary_min && job.salary_max ? 
              `£${job.salary_min.toLocaleString()} - £${job.salary_max.toLocaleString()}` : 
              'Salary not specified',
            category: job.category?.label || 'General',
            keyword: keyword,
            contract: job.contract_time || 'Not specified',
            experience: job.experience_level || 'Not specified'
          };
          
          jobs.push(formattedJob);
        });
      } else {
        console.log(`   ⚠️  No jobs found for "${keyword}"`);
      }
      
      // Slightly longer delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`   ⏳ Rate limited for "${keyword}", waiting 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`   ❌ Error searching for "${keyword}": ${error.response?.status || error.message}`);
      }
    }
  }
  
  return jobs;
};

// Display jobs in a nice format with enhanced info
const displayJobs = (jobs, cityName) => {
  if (jobs.length === 0) {
    console.log(`\n📭 No jobs found for ${cityName}`);
    return;
  }
  
  console.log(`\n🏢 ${cityName.toUpperCase()} - ${jobs.length} Jobs Found:`);
  console.log('='.repeat(70));
  
  jobs.forEach((job, index) => {
    console.log(`\n${index + 1}. ${job.title}`);
    console.log(`   Company: ${job.company}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   Category: ${job.category}`);
    console.log(`   Keyword: ${job.keyword}`);
    console.log(`   Contract: ${job.contract}`);
    console.log(`   Experience: ${job.experience}`);
    console.log(`   Salary: ${job.salary}`);
    console.log(`   Posted: ${job.posted}`);
    console.log(`   Description: ${job.description}`);
    console.log(`   Apply: ${job.url}`);
    console.log('   ' + '-'.repeat(60));
  });
};

// Main scraping function with enhanced statistics
const scrapeAllCities = async () => {
  console.log('🎯 Starting enhanced job search across all cities...\n');
  
  let allJobs = [];
  let totalJobs = 0;
  let keywordStats = {};
  
  for (const city of targetCities) {
    console.log(`\n🌍 Processing ${city.name}...`);
    const cityJobs = await scrapeCityJobs(city, city.keywords);
    
    if (cityJobs.length > 0) {
      displayJobs(cityJobs, city.name);
      allJobs = allJobs.concat(cityJobs);
      totalJobs += cityJobs.length;
      
      // Track keyword performance
      cityJobs.forEach(job => {
        keywordStats[job.keyword] = (keywordStats[job.keyword] || 0) + 1;
      });
    }
    
    console.log(`   📊 ${city.name}: ${cityJobs.length} jobs found`);
  }
  
  // Enhanced summary with keyword analysis
  console.log('\n🎉 ENHANCED SCRAPING COMPLETE!');
  console.log('='.repeat(70));
  console.log(`📊 Total Jobs Found: ${totalJobs}`);
  console.log(`🌍 Cities Processed: ${targetCities.length}`);
  console.log(`🔍 Total Keywords Searched: ${targetCities.reduce((sum, city) => sum + city.keywords.length, 0)}`);
  
  // Show keyword performance
  console.log(`\n📈 Keyword Performance:`);
  Object.entries(keywordStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([keyword, count]) => {
      console.log(`   "${keyword}": ${count} jobs`);
    });
  
  // Show some stats
  const companies = [...new Set(allJobs.map(job => job.company))];
  const categories = [...new Set(allJobs.map(job => job.category))];
  const contracts = [...new Set(allJobs.map(job => job.contract))];
  
  console.log(`\n📊 Job Statistics:`);
  console.log(`   Unique Companies: ${companies.length}`);
  console.log(`   Job Categories: ${categories.length} different types`);
  console.log(`   Contract Types: ${contracts.filter(c => c !== 'Not specified').join(', ')}`);
  
  if (allJobs.length > 0) {
    console.log(`\n💡 Top Job Opportunities:`);
    allJobs.slice(0, 8).forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title} at ${job.company} (${job.location})`);
    });
  }
  
  // Save all jobs to database
  console.log(`\n💾 Saving all jobs to database...`);
  const savedCount = await saveJobsToDatabase(allJobs);
  
  console.log('\n✅ Enhanced Adzuna job scraping completed successfully!');
  console.log('🚀 You now have maximum early-career job data for your pilot!');
  console.log(`💾 Total jobs collected: ${totalJobs} across ${targetCities.length} cities`);
  console.log(`💾 Total jobs saved to database: ${savedCount}`);
};

// Run the enhanced scraper
console.log('🚀 Starting Enhanced Adzuna Job Scraper...\n');
scrapeAllCities().catch(error => {
  console.error('❌ Enhanced scraping failed:', error.message);
});
