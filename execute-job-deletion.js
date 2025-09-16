import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { refinedJobDeletion } from './refined-job-deletion.js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeJobDeletion() {
  try {
    console.log('🗑️  EXECUTING CONSERVATIVE JOB DELETION');
    console.log('='.repeat(40));
    console.log('⚠️  Removing only CLEARLY unsuitable jobs');
    console.log('');
    
    // Get the job IDs to delete
    console.log('🔍 Re-running analysis to get job IDs...');
    const idsToDelete = await refinedJobDeletion();
    
    if (idsToDelete.length === 0) {
      console.log('✅ No jobs identified for deletion');
      return;
    }
    
    console.log(`\n🎯 About to delete ${idsToDelete.length} jobs`);
    console.log('📊 This represents only clearly unsuitable roles');
    
    // Get current total for before/after comparison
    const { count: beforeCount, error: beforeError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    if (beforeError) throw beforeError;
    
    console.log(`\n📈 BEFORE DELETION: ${beforeCount} total jobs`);
    
    // Execute deletion in batches (Supabase has limits)
    const batchSize = 100;
    let deletedCount = 0;
    
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      
      console.log(`🗑️  Deleting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(idsToDelete.length/batchSize)} (${batch.length} jobs)...`);
      
      const { error } = await supabase
        .from('jobs')
        .delete()
        .in('id', batch);
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
        continue;
      }
      
      deletedCount += batch.length;
      console.log(`✅ Deleted ${deletedCount}/${idsToDelete.length} jobs`);
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Get final count
    const { count: afterCount, error: afterError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    if (afterError) throw afterError;
    
    console.log(`\n📊 DELETION COMPLETE:`);
    console.log(`   📉 Before: ${beforeCount} jobs`);
    console.log(`   📈 After: ${afterCount} jobs`);
    console.log(`   🗑️  Deleted: ${beforeCount - afterCount} jobs`);
    console.log(`   📍 Kept: ${((afterCount/beforeCount)*100).toFixed(1)}% of original jobs`);
    
    // Verify database quality
    const { data: sampleJobs, error: sampleError } = await supabase
      .from('jobs')
      .select('title, company, location')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!sampleError && sampleJobs.length > 0) {
      console.log(`\n✨ SAMPLE REMAINING JOBS (High Quality):`);
      sampleJobs.forEach((job, i) => {
        console.log(`   ${i+1}. "${job.title}" at ${job.company} (${job.location.split(',')[0]})`);
      });
    }
    
    console.log(`\n🎉 SUCCESS! Database cleaned of clearly unsuitable jobs`);
    console.log(`🎯 Remaining jobs are all relevant for business school graduates`);
    
  } catch (error) {
    console.error('❌ Deletion failed:', error.message);
    process.exit(1);
  }
}

// Run the deletion
executeJobDeletion();
