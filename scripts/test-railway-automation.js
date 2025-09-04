#!/usr/bin/env node

// 🧪 RAILWAY AUTOMATION TEST
// This tests if your Railway automation is actually running and responding

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRailwayAutomation() {
  console.log('🧪 RAILWAY AUTOMATION TEST');
  console.log('===========================');
  console.log('Testing if Railway automation is actively running...\n');

  try {
    // Test 1: Check if jobs are being added in real-time
    console.log('📊 Test 1: Real-time Job Addition Check');
    
    // Get current job count
    const { data: currentJobs, error: currentError } = await supabase
      .from('jobs')
      .select('id', { count: 'exact' });
    
    if (currentError) throw currentError;
    
    const initialCount = currentJobs.length;
    console.log(`   Current job count: ${initialCount}`);
    
    // Wait 2 minutes to see if new jobs are added
    console.log('   ⏳ Waiting 2 minutes to check for new job additions...');
    console.log('   (This simulates checking if automation is actively running)');
    
    await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes
    
    // Check job count again
    const { data: newJobs, error: newError } = await supabase
      .from('jobs')
      .select('id', { count: 'exact' });
    
    if (newError) throw newError;
    
    const finalCount = newJobs.length;
    const jobsAdded = finalCount - initialCount;
    
    console.log(`   Final job count: ${finalCount}`);
    console.log(`   Jobs added during test: ${jobsAdded}`);
    
    if (jobsAdded > 0) {
      console.log('   🎉 SUCCESS: Automation is actively adding jobs!');
    } else {
      console.log('   ⚠️  No new jobs added - automation may be in idle period');
    }
    console.log('');

    // Test 2: Check recent job patterns
    console.log('🕐 Test 2: Recent Job Pattern Analysis');
    
    const { data: recentJobs, error: recentError } = await supabase
      .from('jobs')
      .select('created_at, source')
      .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Last 6 hours
      .order('created_at', { ascending: false });
    
    if (recentError) throw recentError;
    
    if (recentJobs.length > 0) {
      console.log(`   Jobs in last 6 hours: ${recentJobs.length}`);
      
      // Group by hour to see activity patterns
      const hourlyActivity = {};
      recentJobs.forEach(job => {
        const hour = new Date(job.created_at).getHours();
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      });
      
      console.log('   Hourly activity pattern:');
      Object.entries(hourlyActivity).forEach(([hour, count]) => {
        console.log(`      ${hour}:00 - ${count} jobs`);
      });
      
      // Check if there's hourly activity (automation indicator)
      const activeHours = Object.keys(hourlyActivity).length;
      if (activeHours >= 2) {
        console.log('   ✅ Multiple active hours detected - automation likely running hourly');
      } else {
        console.log('   ⚠️  Limited hourly activity - automation may be running less frequently');
      }
    }
    console.log('');

    // Test 3: Automation Health Summary
    console.log('🏥 Test 3: Automation Health Summary');
    
    const { data: lastJob, error: lastJobError } = await supabase
      .from('jobs')
      .select('created_at, source')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (lastJobError) throw lastJobError;
    
    if (lastJob && lastJob.length > 0) {
      const lastJobTime = new Date(lastJob[0].created_at);
      const minutesSinceLastJob = Math.round((Date.now() - lastJobTime.getTime()) / (1000 * 60));
      
      console.log(`   Last job: ${minutesSinceLastJob} minutes ago`);
      console.log(`   Source: ${lastJob[0].source}`);
      
      if (minutesSinceLastJob <= 60) {
        console.log('   🟢 EXCELLENT: Automation is very active (< 1 hour)');
      } else if (minutesSinceLastJob <= 180) {
        console.log('   🟡 GOOD: Automation is active (< 3 hours)');
      } else if (minutesSinceLastJob <= 360) {
        console.log('   🟠 WARNING: Automation may be slowing down (< 6 hours)');
      } else {
        console.log('   🔴 CRITICAL: Automation may be broken (> 6 hours)');
      }
    }
    
    console.log('\n🎯 RAILWAY AUTOMATION ASSESSMENT:');
    console.log('==================================');
    
    if (jobsAdded > 0 && finalCount > initialCount) {
      console.log('🎉 SUCCESS: Your Railway automation is working perfectly!');
      console.log('   - Jobs are being added in real-time');
      console.log('   - Database is actively being populated');
      console.log('   - Automation is running as expected');
    } else {
      console.log('⚠️  ATTENTION: Automation may need monitoring');
      console.log('   - Check Railway logs for any errors');
      console.log('   - Verify hourly cron jobs are running');
      console.log('   - Monitor for any rate limiting issues');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRailwayAutomation();
