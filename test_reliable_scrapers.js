#!/usr/bin/env node

// Test the new reliable scraper system
const JobScrapingOrchestrator = require('./scrapers/JobScrapingOrchestrator');

async function testReliableScrapers() {
  console.log('🧪 TESTING RELIABLE SCRAPER SYSTEM');
  console.log('='.repeat(50));
  
  const orchestrator = new JobScrapingOrchestrator();
  
  try {
    // Run all scrapers
    const results = await orchestrator.runAllScrapers();
    
    // Get all unique jobs
    const allJobs = orchestrator.getAllJobs();
    
    console.log('\n📋 SAMPLE JOBS FOUND:');
    console.log('-'.repeat(50));
    
    // Show first 5 jobs as samples
    allJobs.slice(0, 5).forEach((job, index) => {
      console.log(`\n${index + 1}. ${job.title}`);
      console.log(`   🏢 ${job.company}`);
      console.log(`   📍 ${job.location}`);
      console.log(`   💼 ${job.employment_type}`);
      console.log(`   🏠 ${job.remote_work}`);
      console.log(`   🔗 ${job.url}`);
      if (job.salary_range) {
        console.log(`   💰 ${job.salary_range}`);
      }
    });
    
    if (allJobs.length > 5) {
      console.log(`\n... and ${allJobs.length - 5} more jobs`);
    }
    
    console.log('\n🎯 SUCCESS! Reliable scrapers are working!');
    
    // Save results to file
    const fs = require('fs');
    fs.writeFileSync('reliable_scraper_results.json', JSON.stringify({
      summary: orchestrator.getSummary(),
      jobs: allJobs
    }, null, 2));
    
    console.log('💾 Results saved to reliable_scraper_results.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testReliableScrapers();
