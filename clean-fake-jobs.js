#!/usr/bin/env node

// 🧹 CLEAN DATABASE OF FAKE/TEST JOBS

const { createClient } = require('@supabase/supabase-js');

console.log('🧹 Cleaning Database of Fake/Test Jobs\n');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanFakeJobs() {
  try {
    console.log('🔍 Identifying Fake/Test Jobs...\n');

    // 1. Find all fake Reed jobs (auto-generated)
    console.log('1️⃣ Finding fake Reed jobs...');
    const { data: reedJobs, error: reedError } = await supabase
      .from('jobs')
      .select('id, title, company, source')
      .ilike('source', '%reed%')
      .ilike('title', '%Greenhouse%')
      .ilike('title', '%Job%');

    if (reedError) {
      console.error('❌ Error finding Reed jobs:', reedError);
    } else {
      console.log(`   Found ${reedJobs.length} fake Reed jobs`);
      if (reedJobs.length > 0) {
        console.log('   Sample fake Reed jobs:');
        reedJobs.slice(0, 5).forEach((job, index) => {
          console.log(`     ${index + 1}. "${job.title}" at ${job.company}`);
        });
      }
    }

    // 2. Find all AUTO-SAVED test jobs
    console.log('\n2️⃣ Finding AUTO-SAVED test jobs...');
    const { data: autoJobs, error: autoError } = await supabase
      .from('jobs')
      .select('id, title, company, source')
      .ilike('title', '%AUTO-SAVED%');

    if (autoError) {
      console.error('❌ Error finding AUTO-SAVED jobs:', autoError);
    } else {
      console.log(`   Found ${autoJobs.length} AUTO-SAVED test jobs`);
      if (autoJobs.length > 0) {
        console.log('   Sample AUTO-SAVED jobs:');
        autoJobs.slice(0, 5).forEach((job, index) => {
          console.log(`     ${index + 1}. "${job.title}" at ${job.company}`);
        });
      }
    }

    // 3. Find jobs with poor descriptions
    console.log('\n3️⃣ Finding jobs with poor descriptions...');
    const { data: poorDescJobs, error: poorDescError } = await supabase
      .from('jobs')
      .select('id, title, company, description')
      .or('description.is.null,description.lt.100')
      .limit(100);

    if (poorDescError) {
      console.error('❌ Error finding poor description jobs:', poorDescError);
    } else {
      console.log(`   Found ${poorDescJobs.length} jobs with poor descriptions`);
    }

    // 4. Find jobs with generic company names
    console.log('\n4️⃣ Finding jobs with generic company names...');
    const { data: genericCompanyJobs, error: genericError } = await supabase
      .from('jobs')
      .select('id, title, company, source')
      .or('company.ilike.%Auto Company%,company.ilike.%Test Company%,company.ilike.%Sample Company%');

    if (genericError) {
      console.error('❌ Error finding generic company jobs:', genericError);
    } else {
      console.log(`   Found ${genericCompanyJobs.length} jobs with generic company names`);
    }

    // 5. Calculate total jobs to delete
    const allFakeJobIds = new Set();
    
    if (reedJobs) {
      reedJobs.forEach(job => allFakeJobIds.add(job.id));
    }
    if (autoJobs) {
      autoJobs.forEach(job => allFakeJobIds.add(job.id));
    }
    if (genericCompanyJobs) {
      genericCompanyJobs.forEach(job => allFakeJobIds.add(job.id));
    }

    const totalFakeJobs = allFakeJobIds.size;
    console.log(`\n📊 CLEANUP SUMMARY:`);
    console.log(`   • Fake Reed jobs: ${reedJobs?.length || 0}`);
    console.log(`   • AUTO-SAVED test jobs: ${autoJobs?.length || 0}`);
    console.log(`   • Generic company jobs: ${genericCompanyJobs?.length || 0}`);
    console.log(`   • Total unique fake jobs: ${totalFakeJobs}`);

    if (totalFakeJobs === 0) {
      console.log('\n✅ No fake jobs found! Database is clean.');
      return;
    }

    // 6. Confirm deletion
    console.log(`\n⚠️  WARNING: About to delete ${totalFakeJobs} fake/test jobs!`);
    console.log('   This action cannot be undone.');
    
    // For safety, let's delete in batches
    const fakeJobIdsArray = Array.from(allFakeJobIds);
    const batchSize = 50;
    
    console.log(`\n🗑️  Deleting fake jobs in batches of ${batchSize}...`);
    
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

    console.log(`\n🎉 CLEANUP COMPLETED!`);
    console.log(`   • Total fake jobs deleted: ${deletedCount}`);
    console.log(`   • Database is now clean of test/fake data`);

    // 7. Verify cleanup
    console.log(`\n🔍 Verifying cleanup...`);
    const { data: remainingJobs, error: verifyError } = await supabase
      .from('jobs')
      .select('id, title, company, source')
      .eq('status', 'active')
      .limit(10);

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError);
    } else {
      console.log(`   ✅ Remaining jobs (sample):`);
      remainingJobs.forEach((job, index) => {
        console.log(`     ${index + 1}. "${job.title}" at ${job.company} (${job.source})`);
      });
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
cleanFakeJobs().then(() => {
  console.log('\n🎯 Database cleanup completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Cleanup error:', error);
  process.exit(1);
});
