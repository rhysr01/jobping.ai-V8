#!/usr/bin/env node

// Simple Adzuna scraper with direct database saving
const { scrapeAllCities } = require('./adzuna-job-functions.js');
const { createClient } = require('@supabase/supabase-js');
const { convertToDatabaseFormat } = require('../scrapers/utils.js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('🚀 Starting Adzuna with Database Saving...\n');
    
    // Use the working Adzuna scraper
    const results = await scrapeAllCities({ verbose: true });
    console.log(`\n📊 Found ${results.jobs.length} jobs total`);
    
    // Save to database in batches
    let savedCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < results.jobs.length; i += batchSize) {
      const batch = results.jobs.slice(i, i + batchSize).map(job => {
        const dbJob = convertToDatabaseFormat(job);
        const { metadata, ...clean } = dbJob;
        return clean;
      });
      
      console.log(`💾 Saving batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(results.jobs.length/batchSize)} (${batch.length} jobs)...`);
      
      const { error } = await supabase
        .from('jobs')
        .upsert(batch, { onConflict: 'job_hash', ignoreDuplicates: false });
      
      if (error) {
        console.error(`❌ Batch error:`, error.message);
      } else {
        savedCount += batch.length;
        console.log(`✅ Saved ${savedCount}/${results.jobs.length} jobs`);
      }
    }
    
    // Print canonical success line for orchestrator
    console.log(`\n✅ Adzuna: ${savedCount} jobs saved to database`);
    
  } catch (error) {
    console.error('❌ Adzuna scraping failed:', error.message);
    process.exit(1);
  }
})();
