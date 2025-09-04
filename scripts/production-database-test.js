#!/usr/bin/env node

// 🧪 PRODUCTION DATABASE TEST
// This verifies that your Railway automation is actually saving jobs to the database

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testProductionDatabase() {
  console.log('🧪 PRODUCTION DATABASE TEST');
  console.log('============================');
  console.log('Testing if Railway automation is populating your database...\n');

  try {
    // Test 1: Check total jobs count
    console.log('📊 Test 1: Total Jobs Count');
    const { data: totalJobs, error: totalError } = await supabase
      .from('jobs')
      .select('id', { count: 'exact' });
    
    if (totalError) throw totalError;
    
    console.log(`   Total jobs in database: ${totalJobs.length}`);
    console.log('   ✅ Database connection successful\n');

    // Test 2: Check recent jobs (last 24 hours)
    console.log('🕐 Test 2: Recent Jobs (Last 24 Hours)');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentJobs, error: recentError } = await supabase
      .from('jobs')
      .select('id, title, company, created_at, source')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });
    
    if (recentError) throw recentError;
    
    console.log(`   Recent jobs (24h): ${recentJobs.length}`);
    
    if (recentJobs.length > 0) {
      console.log('   📋 Sample recent jobs:');
      recentJobs.slice(0, 5).forEach((job, index) => {
        const timeAgo = Math.round((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60));
        console.log(`      ${index + 1}. ${job.title} at ${job.company} (${timeAgo}h ago, source: ${job.source})`);
      });
    } else {
      console.log('   ⚠️  No jobs in last 24 hours - automation may not be running yet');
    }
    console.log('');

    // Test 3: Check jobs by source (scraper)
    console.log('🏷️  Test 3: Jobs by Source (Scraper)');
    const { data: sourceBreakdown, error: sourceError } = await supabase
      .from('jobs')
      .select('source');
    
    if (sourceError) throw sourceError;
    
    const sourceCounts = sourceBreakdown.reduce((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   Jobs by source:');
    Object.entries(sourceCounts).forEach(([source, count]) => {
      console.log(`      ${source}: ${count} jobs`);
    });
    console.log('');

    // Test 4: Check automation health
    console.log('🏥 Test 4: Automation Health Check');
    const { data: lastJob, error: lastJobError } = await supabase
      .from('jobs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (lastJobError) throw lastJobError;
    
    if (lastJob && lastJob.length > 0) {
      const lastJobTime = new Date(lastJob[0].created_at);
      const hoursSinceLastJob = Math.round((Date.now() - lastJobTime.getTime()) / (1000 * 60 * 60));
      
      if (hoursSinceLastJob <= 24) {
        console.log(`   ✅ Last job: ${hoursSinceLastJob} hours ago (Healthy)`);
      } else if (hoursSinceLastJob <= 48) {
        console.log(`   ⚠️  Last job: ${hoursSinceLastJob} hours ago (Warning - may need attention)`);
      } else {
        console.log(`   ❌ Last job: ${hoursSinceLastJob} hours ago (Critical - automation may be broken)`);
      }
    } else {
      console.log('   ❌ No jobs found - database may be empty');
    }
    console.log('');

    // Test 5: Production Readiness Assessment
    console.log('🎯 Test 5: Production Readiness Assessment');
    const totalJobsCount = totalJobs.length;
    const recentJobsCount = recentJobs.length;
    const hasMultipleSources = Object.keys(sourceCounts).length > 1;
    const isRecent = recentJobsCount > 0;
    
    let productionScore = 0;
    let recommendations = [];
    
    if (totalJobsCount > 100) {
      productionScore += 25;
      console.log('   ✅ Good job volume: 100+ total jobs');
    } else {
      recommendations.push('Need more job volume (currently ' + totalJobsCount + ')');
    }
    
    if (recentJobsCount > 10) {
      productionScore += 25;
      console.log('   ✅ Recent activity: 10+ jobs in 24h');
    } else {
      recommendations.push('Need more recent job activity (currently ' + recentJobsCount + ' in 24h)');
    }
    
    if (hasMultipleSources) {
      productionScore += 25;
      console.log('   ✅ Multiple sources: ' + Object.keys(sourceCounts).length + ' scrapers active');
    } else {
      recommendations.push('Need multiple scraper sources active');
    }
    
    if (isRecent) {
      productionScore += 25;
      console.log('   ✅ Recent activity: Jobs being added regularly');
    } else {
      recommendations.push('Need regular job additions');
    }
    
    console.log(`\n   📊 Production Readiness Score: ${productionScore}/100`);
    
    if (productionScore >= 75) {
      console.log('   🎉 EXCELLENT: Your automation is production-ready!');
    } else if (productionScore >= 50) {
      console.log('   🟡 GOOD: Your automation is working but could be optimized');
    } else {
      console.log('   🔴 NEEDS WORK: Your automation needs attention');
    }
    
    if (recommendations.length > 0) {
      console.log('\n   💡 Recommendations:');
      recommendations.forEach(rec => console.log(`      - ${rec}`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testProductionDatabase();
