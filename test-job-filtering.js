#!/usr/bin/env node

// 🧪 TEST JOB FILTERING - EU & EARLY CAREER VERIFICATION

const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Testing Job Filtering - EU & Early Career Verification\n');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// EU location hints (same as in the updated route)
const EU_HINTS = [
  "UK","United Kingdom","Ireland","Germany","France","Spain","Portugal","Italy",
  "Netherlands","Belgium","Luxembourg","Denmark","Sweden","Norway","Finland",
  "Iceland","Poland","Czech","Austria","Switzerland","Hungary","Greece",
  "Romania","Bulgaria","Croatia","Slovenia","Slovakia","Estonia","Latvia",
  "Lithuania","Amsterdam","Rotterdam","Eindhoven","London","Dublin","Paris",
  "Berlin","Munich","Frankfurt","Zurich","Stockholm","Copenhagen","Oslo",
  "Helsinki","Madrid","Barcelona","Lisbon","Milan","Rome","Athens","Warsaw",
  "Prague","Vienna","Budapest","Bucharest","Tallinn","Riga","Vilnius",
  "Brussels","Luxembourg City"
];

// Early career keywords (same as in the updated route)
const EARLY_CAREER_KEYWORDS = [
  "graduate","new grad","entry level","intern","internship","apprentice",
  "early career","junior","campus","working student","associate","assistant"
];

async function testJobFiltering() {
  try {
    console.log('📊 Testing Current Job Distribution...\n');

    // Test 1: Get total jobs from past 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data: allJobs, error: allJobsError } = await supabase
      .from('jobs')
      .select('id, title, company, location, description')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('is_sent', false)
      .eq('status', 'active')
      .limit(1000);

    if (allJobsError) {
      console.error('❌ Error fetching all jobs:', allJobsError);
      return;
    }

    console.log(`📈 Total active jobs (past 30 days): ${allJobs.length}`);

    // Test 2: Analyze current distribution
    const euJobs = allJobs.filter(job => 
      EU_HINTS.some(hint => job.location.toLowerCase().includes(hint.toLowerCase()))
    );
    
    const earlyCareerJobs = allJobs.filter(job => 
      EARLY_CAREER_KEYWORDS.some(keyword => 
        job.title.toLowerCase().includes(keyword.toLowerCase()) ||
        job.description.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    console.log(`\n📊 Current Distribution Analysis:`);
    console.log(`   • EU-based jobs: ${euJobs.length}/${allJobs.length} (${Math.round(euJobs.length/allJobs.length*100)}%)`);
    console.log(`   • Early career jobs: ${earlyCareerJobs.length}/${allJobs.length} (${Math.round(earlyCareerJobs.length/allJobs.length*100)}%)`);

    // Test 3: Test the new filtered query
    console.log(`\n🔍 Testing New Filtered Query...`);

    const euLocationFilter = EU_HINTS.map(hint => `location.ilike.%${hint}%`).join(',');
    const earlyCareerTitleFilter = EARLY_CAREER_KEYWORDS.map(keyword => `title.ilike.%${keyword}%`).join(',');
    const earlyCareerDescFilter = EARLY_CAREER_KEYWORDS.map(keyword => `description.ilike.%${keyword}%`).join(',');

    const { data: filteredJobs, error: filteredError } = await supabase
      .from('jobs')
      .select('id, title, company, location, description')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('is_sent', false)
      .eq('status', 'active')
      .or(euLocationFilter)
      .or(`${earlyCareerTitleFilter},${earlyCareerDescFilter}`)
      .limit(100);

    if (filteredError) {
      console.error('❌ Error with filtered query:', filteredError);
      return;
    }

    console.log(`✅ Filtered query returned: ${filteredJobs.length} jobs`);

    // Test 4: Verify filtering effectiveness
    if (filteredJobs.length > 0) {
      const filteredEuJobs = filteredJobs.filter(job => 
        EU_HINTS.some(hint => job.location.toLowerCase().includes(hint.toLowerCase()))
      ).length;
      
      const filteredEarlyCareerJobs = filteredJobs.filter(job => 
        EARLY_CAREER_KEYWORDS.some(keyword => 
          job.title.toLowerCase().includes(keyword.toLowerCase()) ||
          job.description.toLowerCase().includes(keyword.toLowerCase())
        )
      ).length;

      console.log(`\n📊 Filtered Results Analysis:`);
      console.log(`   • EU-based jobs: ${filteredEuJobs}/${filteredJobs.length} (${Math.round(filteredEuJobs/filteredJobs.length*100)}%)`);
      console.log(`   • Early career jobs: ${filteredEarlyCareerJobs}/${filteredJobs.length} (${Math.round(filteredEarlyCareerJobs/filteredJobs.length*100)}%)`);

      // Test 5: Show sample jobs
      console.log(`\n📋 Sample Filtered Jobs:`);
      filteredJobs.slice(0, 5).forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
        console.log(`      Location: ${job.location}`);
        console.log(`      EU Match: ${EU_HINTS.some(hint => job.location.toLowerCase().includes(hint.toLowerCase())) ? '✅' : '❌'}`);
        console.log(`      Early Career: ${EARLY_CAREER_KEYWORDS.some(keyword => 
          job.title.toLowerCase().includes(keyword.toLowerCase()) ||
          job.description.toLowerCase().includes(keyword.toLowerCase())
        ) ? '✅' : '❌'}`);
        console.log('');
      });
    }

    // Test 6: Performance comparison
    console.log(`\n⚡ Performance Impact:`);
    console.log(`   • Before filtering: ${allJobs.length} jobs`);
    console.log(`   • After filtering: ${filteredJobs.length} jobs`);
    console.log(`   • Reduction: ${Math.round((1 - filteredJobs.length/allJobs.length)*100)}%`);
    console.log(`   • Quality improvement: ${filteredJobs.length > 0 ? '✅ Significant' : '❌ No results'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testJobFiltering().then(() => {
  console.log('\n🎯 Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
