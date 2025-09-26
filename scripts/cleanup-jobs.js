#!/usr/bin/env node

/**
 * Job Database Cleanup Script
 * 
 * This script cleans up the jobs table to ensure all jobs have
 * the essential fields: company, location, and job_url
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupJobs() {
  try {
    console.log('🧹 Starting job database cleanup...\n');

    // Step 1: Check current state
    console.log('📊 Checking current job data quality...');
    const { data: beforeStats, error: beforeError } = await supabase
      .from('jobs')
      .select('id, company, location, job_url');

    if (beforeError) {
      console.error('❌ Error fetching jobs:', beforeError);
      return;
    }

    const totalJobs = beforeStats.length;
    const qualityJobs = beforeStats.filter(job => 
      job.company && job.company.trim() !== '' &&
      job.location && job.location.trim() !== '' &&
      job.job_url && job.job_url.trim() !== ''
    ).length;

    console.log(`📈 Before cleanup:`);
    console.log(`   Total jobs: ${totalJobs}`);
    console.log(`   Quality jobs: ${qualityJobs}`);
    console.log(`   Jobs to remove: ${totalJobs - qualityJobs}\n`);

    // Step 2: Get jobs to delete
    const jobsToDelete = beforeStats.filter(job => 
      !job.company || job.company.trim() === '' ||
      !job.location || job.location.trim() === '' ||
      !job.job_url || job.job_url.trim() === ''
    );

    console.log(`🗑️  Deleting ${jobsToDelete.length} low-quality jobs...`);

    // Step 3: Delete jobs in batches
    const batchSize = 100;
    let deletedCount = 0;

    for (let i = 0; i < jobsToDelete.length; i += batchSize) {
      const batch = jobsToDelete.slice(i, i + batchSize);
      const ids = batch.map(job => job.id);

      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.error(`❌ Error deleting batch ${i / batchSize + 1}:`, deleteError);
        continue;
      }

      deletedCount += batch.length;
      console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} jobs`);
    }

    // Step 4: Remove duplicates based on job_url
    console.log('\n🔄 Removing duplicate jobs...');
    
    const { data: remainingJobs, error: remainingError } = await supabase
      .from('jobs')
      .select('id, job_url')
      .order('created_at', { ascending: true });

    if (remainingError) {
      console.error('❌ Error fetching remaining jobs:', remainingError);
      return;
    }

    // Group by job_url and keep only the first occurrence
    const urlGroups = {};
    const duplicatesToDelete = [];

    remainingJobs.forEach(job => {
      if (!urlGroups[job.job_url]) {
        urlGroups[job.job_url] = job.id;
      } else {
        duplicatesToDelete.push(job.id);
      }
    });

    if (duplicatesToDelete.length > 0) {
      console.log(`   Found ${duplicatesToDelete.length} duplicate jobs to remove...`);
      
      // Delete duplicates in batches
      for (let i = 0; i < duplicatesToDelete.length; i += batchSize) {
        const batch = duplicatesToDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('jobs')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error(`❌ Error deleting duplicate batch:`, deleteError);
          continue;
        }
      }
    }

    // Step 5: Final quality check
    console.log('\n✅ Final quality check...');
    const { data: finalStats, error: finalError } = await supabase
      .from('jobs')
      .select('id, company, location, job_url');

    if (finalError) {
      console.error('❌ Error fetching final stats:', finalError);
      return;
    }

    const finalTotal = finalStats.length;
    const finalQuality = finalStats.filter(job => 
      job.company && job.company.trim() !== '' &&
      job.location && job.location.trim() !== '' &&
      job.job_url && job.job_url.trim() !== ''
    ).length;

    console.log(`📊 After cleanup:`);
    console.log(`   Total jobs: ${finalTotal}`);
    console.log(`   Quality jobs: ${finalQuality}`);
    console.log(`   Jobs removed: ${totalJobs - finalTotal}`);
    console.log(`   Quality improvement: ${((finalQuality / finalTotal) * 100).toFixed(1)}%`);

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('💡 All remaining jobs now have company, location, and URL data.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupJobs();
