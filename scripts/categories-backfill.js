#!/usr/bin/env node

// Categories Backfill Script
// Cleans historical job categories to pipe-string format for database compatibility

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Normalize categories to pipe-string format
function normalizeCategories(categories) {
  if (!categories) {
    return 'career:unknown|early-career|loc:unknown';
  }
  
  if (Array.isArray(categories)) {
    return categories.filter(Boolean).join('|');
  }
  
  if (typeof categories === 'object' && categories !== null) {
    const values = Object.values(categories).filter(Boolean);
    return values.join('|');
  }
  
  if (typeof categories === 'string') {
    // Clean up the string
    return categories
      .trim()
      .replace(/\|\s*\|\s*/g, '|') // Remove duplicate pipes
      .replace(/\|\s*$/g, '') // Remove trailing pipe
      .replace(/^\|\s*/g, '') // Remove leading pipe
      .replace(/career:([^|]+)/gi, (match, slug) => `career:${slug.toLowerCase()}`); // Lowercase career slugs
  }
  
  return 'career:unknown|early-career|loc:unknown';
}

// Convert pipe-string to PostgreSQL array format
function toPostgreSQLArray(categoriesString) {
  const tags = categoriesString.split('|').filter(tag => tag.trim().length > 0);
  return `{${tags.map(tag => `"${tag.trim()}"`).join(',')}}`;
}

async function backfillCategories() {
  console.log('🔄 Starting categories backfill...');
  
  try {
    // Get a safe window of recent jobs (last 10k by created_at)
    console.log('📊 Fetching recent jobs for backfill...');
    
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, categories, created_at')
      .order('created_at', { ascending: false })
      .limit(10000);
    
    if (fetchError) {
      console.error('❌ Error fetching jobs:', fetchError);
      return;
    }
    
    console.log(`📋 Found ${jobs.length} jobs to process`);
    
    let processed = 0;
    let updated = 0;
    let errors = 0;
    
    // Process jobs in batches
    const batchSize = 100;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)}`);
      
      for (const job of batch) {
        processed++;
        
        try {
          // Normalize categories to pipe-string
          const normalizedString = normalizeCategories(job.categories);
          
          // Convert to PostgreSQL array format
          const postgresArray = toPostgreSQLArray(normalizedString);
          
          // Update the job
          const { error: updateError } = await supabase
            .from('jobs')
            .update({ categories: postgresArray })
            .eq('id', job.id);
          
          if (updateError) {
            console.error(`❌ Error updating job ${job.id}:`, updateError);
            errors++;
          } else {
            updated++;
          }
          
          // Log progress every 100 jobs
          if (processed % 100 === 0) {
            console.log(`📊 Progress: ${processed}/${jobs.length} processed, ${updated} updated, ${errors} errors`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing job ${job.id}:`, error);
          errors++;
        }
      }
      
      // Small delay between batches to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n✅ Categories backfill completed!');
    console.log(`📊 Summary:`);
    console.log(`   Total processed: ${processed}`);
    console.log(`   Successfully updated: ${updated}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Success rate: ${((updated / processed) * 100).toFixed(1)}%`);
    
    // Verify the backfill worked
    console.log('\n🔍 Verifying backfill...');
    const { data: sampleJobs, error: verifyError } = await supabase
      .from('jobs')
      .select('id, categories')
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Error verifying backfill:', verifyError);
    } else {
      console.log('📋 Sample jobs after backfill:');
      sampleJobs.forEach((job, i) => {
        console.log(`   ${i + 1}. Job ${job.id}: ${job.categories}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
  }
}

// Run the backfill
backfillCategories().then(() => {
  console.log('🎉 Categories backfill script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Categories backfill script failed:', error);
  process.exit(1);
});
