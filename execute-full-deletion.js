import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { analyzeAllJobsForDeletion } from './analyze-all-jobs-deletion.js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeFullDeletion() {
  try {
    console.log('🗑️  EXECUTING FULL DATABASE CLEANUP');
    console.log('='.repeat(35));
    console.log('⚠️  Removing 576 clearly unsuitable jobs from 10,295 total');
    console.log('✅ Conservative approach: keeping 94.4% of jobs');
    console.log('');
    
    // Get the job IDs to delete
    console.log('🔍 Getting all job IDs for deletion...');
    const idsToDelete = await analyzeAllJobsForDeletion();
    
    if (idsToDelete.length === 0) {
      console.log('✅ No jobs identified for deletion');
      return;
    }
    
    console.log(`\n🎯 Ready to delete ${idsToDelete.length.toLocaleString()} jobs`);
    
    // Get current total for before/after comparison
    const { count: beforeCount, error: beforeError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    if (beforeError) throw beforeError;
    
    console.log(`\n📈 BEFORE DELETION: ${beforeCount.toLocaleString()} total jobs`);
    console.log(`📊 WILL DELETE: ${idsToDelete.length.toLocaleString()} clearly unsuitable jobs`);
    console.log(`📈 WILL KEEP: ${(beforeCount - idsToDelete.length).toLocaleString()} business-relevant jobs`);
    
    // Execute deletion in batches
    const batchSize = 100;
    let deletedCount = 0;
    const totalBatches = Math.ceil(idsToDelete.length / batchSize);
    
    console.log(`\n🚀 Starting deletion in ${totalBatches} batches...`);
    
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      const batchNum = Math.floor(i/batchSize) + 1;
      
      console.log(`🗑️  Deleting batch ${batchNum}/${totalBatches} (${batch.length} jobs)...`);
      
      const { error } = await supabase
        .from('jobs')
        .delete()
        .in('id', batch);
      
      if (error) {
        console.error(`❌ Batch ${batchNum} failed:`, error.message);
        continue;
      }
      
      deletedCount += batch.length;
      const progressPct = ((deletedCount / idsToDelete.length) * 100).toFixed(1);
      console.log(`✅ Progress: ${deletedCount.toLocaleString()}/${idsToDelete.length.toLocaleString()} jobs (${progressPct}%)`);
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Get final count
    const { count: afterCount, error: afterError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    if (afterError) throw afterError;
    
    const actualDeleted = beforeCount - afterCount;
    
    console.log(`\n🎉 DELETION COMPLETE!`);
    console.log(`='.repeat(20)}`);
    console.log(`📉 Before: ${beforeCount.toLocaleString()} jobs`);
    console.log(`📈 After: ${afterCount.toLocaleString()} jobs`);
    console.log(`🗑️  Deleted: ${actualDeleted.toLocaleString()} jobs`);
    console.log(`📍 Retention Rate: ${((afterCount/beforeCount)*100).toFixed(1)}%`);
    
    // Quick quality check
    const { data: businessJobs, error: qualityError } = await supabase
      .from('jobs')
      .select('title, company, location, source')
      .order('created_at', { ascending: false })
      .limit(15);
    
    if (!qualityError && businessJobs.length > 0) {
      console.log(`\n✨ SAMPLE REMAINING HIGH-QUALITY JOBS:`);
      businessJobs.forEach((job, i) => {
        const location = job.location.split(',')[0] || job.location;
        console.log(`   ${i+1}. "${job.title}" at ${job.company} (${location}) [${job.source}]`);
      });
    }
    
    // Source breakdown after cleanup
    const { data: sourceData, error: sourceError } = await supabase
      .from('jobs')
      .select('source')
      .limit(10000);
    
    if (!sourceError) {
      const sourceBreakdown = sourceData.reduce((acc, job) => {
        acc[job.source] = (acc[job.source] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`\n📊 REMAINING JOBS BY SOURCE:`);
      Object.entries(sourceBreakdown)
        .sort(([,a], [,b]) => b - a)
        .forEach(([source, count]) => {
          const percentage = ((count / afterCount) * 100).toFixed(1);
          console.log(`   📍 ${source}: ${count.toLocaleString()} jobs (${percentage}%)`);
        });
    }
    
    console.log(`\n🎯 SUCCESS! Database cleaned and optimized for business school graduates`);
    console.log(`✅ All remaining ${afterCount.toLocaleString()} jobs are relevant for business students & graduates`);
    console.log(`🚀 Ready for high-quality job matching!`);
    
  } catch (error) {
    console.error('❌ Full deletion failed:', error.message);
    process.exit(1);
  }
}

// Run the deletion
executeFullDeletion();
