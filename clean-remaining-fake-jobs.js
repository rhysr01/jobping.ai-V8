#!/usr/bin/env node

// 🧹 CLEAN REMAINING FAKE JOBS - THOROUGH CLEANUP

const { createClient } = require('@supabase/supabase-js');

console.log('🧹 Thorough Cleanup of Remaining Fake Jobs\n');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanRemainingFakeJobs() {
  try {
    console.log('🔍 Finding ALL remaining fake jobs...\n');

    // 1. Find all Reed jobs with generic patterns
    console.log('1️⃣ Finding remaining Reed fake jobs...');
    const { data: reedJobs, error: reedError } = await supabase
      .from('jobs')
      .select('id, title, company, source')
      .ilike('source', '%reed%')
      .or('title.ilike.%Reed Job%,title.ilike.%Greenhouse%,company.ilike.%Reed Company%');

    if (reedError) {
      console.error('❌ Error finding Reed jobs:', reedError);
    } else {
      console.log(`   Found ${reedJobs.length} remaining Reed fake jobs`);
      if (reedJobs.length > 0) {
        console.log('   Sample remaining Reed jobs:');
        reedJobs.slice(0, 10).forEach((job, index) => {
          console.log(`     ${index + 1}. "${job.title}" at ${job.company}`);
        });
      }
    }

    // 2. Find jobs with generic company patterns
    console.log('\n2️⃣ Finding jobs with generic company patterns...');
    const { data: genericJobs, error: genericError } = await supabase
      .from('jobs')
      .select('id, title, company, source')
      .or('company.ilike.%Company%,company.ilike.%Test%,company.ilike.%Sample%,company.ilike.%Auto%');

    if (genericError) {
      console.error('❌ Error finding generic jobs:', genericError);
    } else {
      console.log(`   Found ${genericJobs.length} jobs with generic company names`);
      if (genericJobs.length > 0) {
        console.log('   Sample generic company jobs:');
        genericJobs.slice(0, 10).forEach((job, index) => {
          console.log(`     ${index + 1}. "${job.title}" at ${job.company}`);
        });
      }
    }

    // 3. Find jobs with generic titles
    console.log('\n3️⃣ Finding jobs with generic titles...');
    const { data: genericTitleJobs, error: genericTitleError } = await supabase
      .from('jobs')
      .select('id, title, company, source')
      .or('title.ilike.%Job %,title.ilike.%Test%,title.ilike.%Sample%');

    if (genericTitleError) {
      console.error('❌ Error finding generic title jobs:', genericTitleError);
    } else {
      console.log(`   Found ${genericTitleJobs.length} jobs with generic titles`);
    }

    // 4. Find jobs with poor descriptions (short or generic)
    console.log('\n4️⃣ Finding jobs with poor descriptions...');
    const { data: poorDescJobs, error: poorDescError } = await supabase
      .from('jobs')
      .select('id, title, company, description')
      .or('description.is.null,description.lt.200,description.ilike.%European graduate program%');

    if (poorDescError) {
      console.error('❌ Error finding poor description jobs:', poorDescError);
    } else {
      console.log(`   Found ${poorDescJobs.length} jobs with poor descriptions`);
    }

    // 5. Calculate total jobs to delete
    const allFakeJobIds = new Set();
    
    if (reedJobs) {
      reedJobs.forEach(job => allFakeJobIds.add(job.id));
    }
    if (genericJobs) {
      genericJobs.forEach(job => allFakeJobIds.add(job.id));
    }
    if (genericTitleJobs) {
      genericTitleJobs.forEach(job => allFakeJobIds.add(job.id));
    }
    if (poorDescJobs) {
      poorDescJobs.forEach(job => allFakeJobIds.add(job.id));
    }

    const totalFakeJobs = allFakeJobIds.size;
    console.log(`\n📊 THOROUGH CLEANUP SUMMARY:`);
    console.log(`   • Remaining Reed fake jobs: ${reedJobs?.length || 0}`);
    console.log(`   • Generic company jobs: ${genericJobs?.length || 0}`);
    console.log(`   • Generic title jobs: ${genericTitleJobs?.length || 0}`);
    console.log(`   • Poor description jobs: ${poorDescJobs?.length || 0}`);
    console.log(`   • Total unique fake jobs: ${totalFakeJobs}`);

    if (totalFakeJobs === 0) {
      console.log('\n✅ No more fake jobs found! Database is completely clean.');
      return;
    }

    // 6. Delete remaining fake jobs
    console.log(`\n🗑️  Deleting remaining ${totalFakeJobs} fake jobs...`);
    
    const fakeJobIdsArray = Array.from(allFakeJobIds);
    const batchSize = 50;
    
    let deletedCount = 0;
    for (let i = 0; i < fakeJobIdsArray.length; i += batchSize) {
      const batch = fakeJobIdsArray.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .in('id', batch);
      
      if (deleteError) {
        console.error(`❌ Error deleting batch ${Math.floor(i/batchSize) + 1}:`, deleteError);
      } else {
        deletedCount += batch.length;
        console.log(`   ✅ Deleted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} jobs`);
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 THOROUGH CLEANUP COMPLETED!`);
    console.log(`   • Additional fake jobs deleted: ${deletedCount}`);
    console.log(`   • Total fake jobs removed in this session: ${deletedCount}`);

    // 7. Final verification - show remaining quality jobs
    console.log(`\n🔍 Final verification - remaining quality jobs...`);
    const { data: remainingJobs, error: verifyError } = await supabase
      .from('jobs')
      .select('id, title, company, source, location')
      .eq('status', 'active')
      .limit(20);

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError);
    } else {
      console.log(`   ✅ Remaining quality jobs (${remainingJobs.length} shown):`);
      remainingJobs.forEach((job, index) => {
        console.log(`     ${index + 1}. "${job.title}" at ${job.company} (${job.location}) - ${job.source}`);
      });
    }

    // 8. Count remaining jobs by source
    console.log(`\n📊 Remaining jobs by source:`);
    const sourceCounts = {};
    remainingJobs.forEach(job => {
      sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1;
    });
    Object.entries(sourceCounts).forEach(([source, count]) => {
      console.log(`   • ${source}: ${count} jobs`);
    });

  } catch (error) {
    console.error('❌ Thorough cleanup failed:', error);
  }
}

// Run the thorough cleanup
cleanRemainingFakeJobs().then(() => {
  console.log('\n🎯 Thorough database cleanup completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Cleanup error:', error);
  process.exit(1);
});
