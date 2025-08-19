#!/usr/bin/env node

/**
 * SCRAPER AUDIT & HARDENING SCRIPT
 * Bill Gates-level rigor for production readiness
 * 
 * Uses existing API infrastructure to test scrapers systematically
 */

const axios = require('axios');
const crypto = require('crypto');

// Test configuration
const API_BASE = 'http://localhost:3000/api';
const TEST_PLATFORMS = [
  'greenhouse',
  'lever', 
  'remoteok',
  'graduatejobs',
  'graduateland',
  'milkround',
  'eth-zurich',
  'eures',
  'iagora',
  'jobteaser',
  'smartrecruiters',
  'trinity-dublin',
  'tu-delft',
  'wellfound',
  'workday'
];

// Results tracking
const auditResults = {
  passed: [],
  failed: [],
  warnings: []
};

function generateRunId() {
  return `audit-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

async function testScraperViaAPI(platform) {
  console.log(`\n🔍 TESTING ${platform.toUpperCase()} VIA API`);
  console.log('='.repeat(50));
  
  const runId = generateRunId();
  const startTime = Date.now();
  
  try {
    // Test the scrape API endpoint
    const response = await axios.post(`${API_BASE}/scrape`, {
      platforms: [platform],
      runId: runId,
      testMode: true
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SCRAPE_API_KEY || 'test-api-key'}`
      },
      timeout: 60000 // 60 second timeout
    });
    
    const duration = Date.now() - startTime;
    const data = response.data;
    
    console.log(`⏱️ Completed in ${duration}ms`);
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    // Analyze results
    const results = data.results || {};
    const platformResult = results[platform];
    
    if (!platformResult) {
      throw new Error('No results found for platform');
    }
    
    console.log(`📈 PLATFORM RESULTS:`);
    console.log(`   Success: ${platformResult.success}`);
    console.log(`   Jobs found: ${platformResult.jobs || 0}`);
    console.log(`   Errors: ${platformResult.error || 'none'}`);
    
    // Debug: show full response structure for first few platforms
    if (Object.keys(auditResults.passed).length + Object.keys(auditResults.failed).length < 3) {
      console.log(`   Debug - Full result:`, JSON.stringify(platformResult, null, 2));
    }
    
    // ACCEPTANCE GATES
    let passed = true;
    const issues = [];
    
    // Gate 1: Success and jobs found
    if (!platformResult.success) {
      passed = false;
      issues.push(`Scraper failed: ${platformResult.error}`);
    }
    
    if (!platformResult.jobs || platformResult.jobs === 0) {
      passed = false;
      issues.push('No jobs returned');
    }
    
    // Gate 2: Error rate check
    if (platformResult.error && platformResult.error.includes('rate limit')) {
      issues.push('Rate limited - may need throttling adjustment');
    }
    
    if (platformResult.error && platformResult.error.includes('timeout')) {
      issues.push('Timeout - may need performance optimization');
    }
    
    // Log sample jobs if available
    if (data.jobs && data.jobs.length > 0) {
      console.log(`\n📝 SAMPLE JOBS:`);
      data.jobs.slice(0, 3).forEach((job, i) => {
        console.log(`   ${i + 1}. ${job.title} @ ${job.company} (${job.location})`);
      });
    }
    
    // Overall assessment
    if (passed && issues.length === 0) {
      console.log(`\n✅ ${platform.toUpperCase()} PASSED ALL GATES`);
      auditResults.passed.push({
        platform,
        metrics: {
          jobs: platformResult.jobs || 0,
          duration,
          success: platformResult.success
        }
      });
    } else {
      console.log(`\n❌ ${platform.toUpperCase()} FAILED:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
      
      auditResults.failed.push({
        platform,
        reason: issues.join('; '),
        metrics: {
          jobs: platformResult.jobs || 0,
          duration,
          success: platformResult.success
        }
      });
    }
    
  } catch (error) {
    console.error(`❌ ERROR TESTING ${platform}: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure the Next.js dev server is running on port 3000');
    }
    
    auditResults.failed.push({
      platform,
      reason: 'api_error',
      error: error.message
    });
  }
}

async function runFullAudit() {
  console.log('🚀 SCRAPER AUDIT & HARDENING - BILL GATES LEVEL RIGOR');
  console.log('='.repeat(70));
  console.log(`Testing ${TEST_PLATFORMS.length} scrapers via API`);
  console.log(`API Base: ${API_BASE}`);
  console.log(`Run started: ${new Date().toISOString()}`);
  
  // Check if API is available
  try {
    await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    console.log('✅ API health check passed');
  } catch (error) {
    console.error('❌ API health check failed - make sure dev server is running');
    console.error('   Run: npm run dev');
    process.exit(1);
  }
  
  // Test each scraper
  for (const platform of TEST_PLATFORMS) {
    await testScraperViaAPI(platform);
    
    // Brief pause between scrapers
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(70));
  
  console.log(`\n✅ PASSED (${auditResults.passed.length}):`);
  auditResults.passed.forEach(result => {
    console.log(`   ${result.platform}: ${result.metrics.jobs} jobs, ${result.metrics.duration}ms`);
  });
  
  console.log(`\n❌ FAILED (${auditResults.failed.length}):`);
  auditResults.failed.forEach(result => {
    console.log(`   ${result.platform}: ${result.reason}`);
  });
  
  const passRate = ((auditResults.passed.length / TEST_PLATFORMS.length) * 100).toFixed(1);
  console.log(`\n🎯 PASS RATE: ${passRate}% (${auditResults.passed.length}/${TEST_PLATFORMS.length})`);
  
  if (auditResults.failed.length === 0) {
    console.log(`\n🎉 ALL SCRAPERS PRODUCTION READY!`);
  } else {
    console.log(`\n⚠️ ${auditResults.failed.length} SCRAPERS NEED ATTENTION`);
  }
  
  // Return exit code for CI/CD
  process.exit(auditResults.failed.length > 0 ? 1 : 0);
}

// Run the audit
runFullAudit().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
