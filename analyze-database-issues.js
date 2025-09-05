#!/usr/bin/env node

// 🔍 COMPREHENSIVE DATABASE ANALYSIS - JOB QUALITY ISSUES

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Analyzing Database Job Quality Issues\n');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabaseIssues() {
  try {
    console.log('📊 COMPREHENSIVE DATABASE ANALYSIS\n');

    // 1. Analyze job sources
    console.log('1️⃣ JOB SOURCE ANALYSIS');
    const { data: sourceData, error: sourceError } = await supabase
      .from('jobs')
      .select('source, count(*)')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'active');

    if (sourceError) {
      console.error('❌ Error analyzing sources:', sourceError);
    } else {
      console.log('📈 Job Sources (past 30 days):');
      const sourceCounts = {};
      sourceData.forEach(job => {
        sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1;
      });
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`   • ${source}: ${count} jobs`);
      });
    }

    // 2. Analyze job titles for quality issues
    console.log('\n2️⃣ JOB TITLE QUALITY ANALYSIS');
    const { data: titleData, error: titleError } = await supabase
      .from('jobs')
      .select('title, company, source')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'active')
      .limit(100);

    if (titleError) {
      console.error('❌ Error analyzing titles:', titleError);
    } else {
      console.log('📋 Sample Job Titles:');
      titleData.slice(0, 20).forEach((job, index) => {
        console.log(`   ${index + 1}. "${job.title}" at ${job.company} (${job.source})`);
      });

      // Check for problematic patterns
      const problematicTitles = titleData.filter(job => 
        job.title.includes('AUTO-SAVED') || 
        job.title.includes('European Job') ||
        job.title.includes('Test') ||
        job.title.includes('Sample')
      );
      
      if (problematicTitles.length > 0) {
        console.log(`\n⚠️  PROBLEMATIC TITLES FOUND: ${problematicTitles.length}`);
        problematicTitles.slice(0, 10).forEach((job, index) => {
          console.log(`   ${index + 1}. "${job.title}" (${job.source})`);
        });
      }
    }

    // 3. Analyze company quality
    console.log('\n3️⃣ COMPANY QUALITY ANALYSIS');
    const { data: companyData, error: companyError } = await supabase
      .from('jobs')
      .select('company, count(*)')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'active')
      .order('count', { ascending: false })
      .limit(20);

    if (companyError) {
      console.error('❌ Error analyzing companies:', companyError);
    } else {
      console.log('🏢 Top Companies by Job Count:');
      const companyCounts = {};
      companyData.forEach(job => {
        companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
      });
      Object.entries(companyCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([company, count]) => {
          console.log(`   • ${company}: ${count} jobs`);
        });
    }

    // 4. Analyze location distribution
    console.log('\n4️⃣ LOCATION DISTRIBUTION ANALYSIS');
    const { data: locationData, error: locationError } = await supabase
      .from('jobs')
      .select('location, count(*)')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'active');

    if (locationError) {
      console.error('❌ Error analyzing locations:', locationError);
    } else {
      console.log('📍 Top Locations by Job Count:');
      const locationCounts = {};
      locationData.forEach(job => {
        locationCounts[job.location] = (locationCounts[job.location] || 0) + 1;
      });
      Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([location, count]) => {
          console.log(`   • ${location}: ${count} jobs`);
        });
    }

    // 5. Analyze job descriptions for quality
    console.log('\n5️⃣ JOB DESCRIPTION QUALITY ANALYSIS');
    const { data: descData, error: descError } = await supabase
      .from('jobs')
      .select('description, title, company')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'active')
      .limit(50);

    if (descError) {
      console.error('❌ Error analyzing descriptions:', descError);
    } else {
      // Check for empty or poor descriptions
      const poorDescriptions = descData.filter(job => 
        !job.description || 
        job.description.length < 100 ||
        job.description.includes('AUTO-SAVED') ||
        job.description.includes('Test description')
      );
      
      console.log(`📝 Description Quality:`);
      console.log(`   • Total analyzed: ${descData.length}`);
      console.log(`   • Poor descriptions: ${poorDescriptions.length} (${Math.round(poorDescriptions.length/descData.length*100)}%)`);
      
      if (poorDescriptions.length > 0) {
        console.log(`\n⚠️  POOR DESCRIPTIONS FOUND:`);
        poorDescriptions.slice(0, 5).forEach((job, index) => {
          console.log(`   ${index + 1}. "${job.title}" - ${job.description?.substring(0, 100)}...`);
        });
      }
    }

    // 6. Analyze what customers actually need
    console.log('\n6️⃣ CUSTOMER REQUIREMENTS ANALYSIS');
    console.log('🎯 What customers need:');
    console.log('   • EU-based tech companies (not generic job boards)');
    console.log('   • Early career positions (graduate/junior level)');
    console.log('   • Quality job descriptions (not auto-generated)');
    console.log('   • Real companies (not test data)');
    console.log('   • Fresh opportunities (not stale listings)');

    // 7. Identify specific issues
    console.log('\n7️⃣ IDENTIFIED ISSUES');
    
    // Check for Reed jobs specifically
    const { data: reedData, error: reedError } = await supabase
      .from('jobs')
      .select('title, company, location, source')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'active')
      .ilike('source', '%reed%');

    if (reedError) {
      console.error('❌ Error analyzing Reed jobs:', reedError);
    } else {
      console.log(`\n🔍 REED JOBS ANALYSIS:`);
      console.log(`   • Total Reed jobs: ${reedData.length}`);
      
      if (reedData.length > 0) {
        console.log(`   • Sample Reed jobs:`);
        reedData.slice(0, 5).forEach((job, index) => {
          console.log(`     ${index + 1}. "${job.title}" at ${job.company} (${job.location})`);
        });
        
        // Check if Reed jobs are quality
        const qualityReedJobs = reedData.filter(job => 
          job.title && 
          job.title.length > 10 &&
          !job.title.includes('AUTO-SAVED') &&
          job.company &&
          job.company.length > 2
        );
        
        console.log(`   • Quality Reed jobs: ${qualityReedJobs.length}/${reedData.length} (${Math.round(qualityReedJobs.length/reedData.length*100)}%)`);
      }
    }

    // 8. Recommendations
    console.log('\n8️⃣ RECOMMENDATIONS');
    console.log('🚀 Immediate Actions Needed:');
    console.log('   1. Remove auto-generated/test jobs from database');
    console.log('   2. Focus on quality job sources (Greenhouse, company sites)');
    console.log('   3. Implement better job validation before saving');
    console.log('   4. Add company whitelist for known quality employers');
    console.log('   5. Improve early career detection algorithms');
    console.log('   6. Add job description quality scoring');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
analyzeDatabaseIssues().then(() => {
  console.log('\n🎯 Analysis completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Analysis error:', error);
  process.exit(1);
});
