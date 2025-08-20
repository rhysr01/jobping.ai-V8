#!/usr/bin/env node

/**
 * Canary Scrape Test Script
 * 
 * Tests each scraper platform against Go/No-Go checklist requirements:
 * - Raw > 0
 * - Eligible ≥ 0.7*Raw (Workday ≥ 0.5 ok)
 * - Career-tag coverage ≥ 95%
 * - Unknown-location ≤ 25% (RemoteOK ≤ 40%)
 * - Inserted+Updated ≥ 1
 * - Errors < 10%
 */

const axios = require('axios');

const SCRAPER_API_URL = process.env.SCRAPER_API_URL || 'http://localhost:3000/api/scrape';
const API_KEY = process.env.SCRAPE_API_KEY || 'test-api-key';

const PLATFORMS = [
  'remoteok',
  'greenhouse', 
  'lever',
  'workday',
  'smartrecruiters',
  'eures',
  'graduatejobs',
  'iagora',
  'jobteaser',
  'milkround',
  'wellfound',
  'graduateland'
];

const REQUIREMENTS = {
  remoteok: {
    eligibleRatio: 0.7,
    unknownLocationCap: 0.4, // 40%
    eligibleRatioTarget: 0.7
  },
  workday: {
    eligibleRatio: 0.5, // Lower threshold for Workday
    unknownLocationCap: 0.25,
    eligibleRatioTarget: 0.5
  },
  default: {
    eligibleRatio: 0.7,
    unknownLocationCap: 0.25,
    eligibleRatioTarget: 0.7
  }
};

async function testPlatform(platform) {
  console.log(`\n🧪 Testing ${platform.toUpperCase()} scraper...`);
  
  try {
    const response = await axios.post(SCRAPER_API_URL, {
      platforms: [platform],
      runId: `canary-${platform}-${Date.now()}`
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      timeout: 30000 // 30 second timeout
    });

    const data = response.data;
    const requirements = REQUIREMENTS[platform] || REQUIREMENTS.default;
    
    // Extract metrics from response
    const metrics = {
      raw: data.raw || 0,
      eligible: data.eligible || 0,
      careerTagged: data.careerTagged || 0,
      locationTagged: data.locationTagged || 0,
      inserted: data.inserted || 0,
      updated: data.updated || 0,
      errors: data.errors?.length || 0,
      unknownLocationPct: data.unknownLocationPct || 0,
      eligibleRatio: data.eligibleRatio || 0
    };

    // Calculate career tag coverage
    const careerTagCoverage = metrics.raw > 0 ? (metrics.careerTagged / metrics.raw) : 0;
    
    // Check requirements
    const checks = {
      rawGreaterThanZero: metrics.raw > 0,
      eligibleRatioMet: metrics.eligibleRatio >= requirements.eligibleRatioTarget,
      careerTagCoverageMet: careerTagCoverage >= 0.95,
      unknownLocationUnderCap: metrics.unknownLocationPct <= requirements.unknownLocationCap,
      insertedOrUpdated: (metrics.inserted + metrics.updated) >= 1,
      errorsUnder10Percent: metrics.errors < (metrics.raw * 0.1)
    };

    // Print results
    console.log(`   📊 Metrics:`);
    console.log(`      Raw: ${metrics.raw}`);
    console.log(`      Eligible: ${metrics.eligible} (${(metrics.eligibleRatio * 100).toFixed(1)}%)`);
    console.log(`      Career Tagged: ${metrics.careerTagged} (${(careerTagCoverage * 100).toFixed(1)}%)`);
    console.log(`      Location Tagged: ${metrics.locationTagged}`);
    console.log(`      Unknown Location: ${(metrics.unknownLocationPct * 100).toFixed(1)}%`);
    console.log(`      Inserted: ${metrics.inserted}, Updated: ${metrics.updated}`);
    console.log(`      Errors: ${metrics.errors}`);
    
    console.log(`   ✅ Checks:`);
    console.log(`      Raw > 0: ${checks.rawGreaterThanZero ? '✅' : '❌'}`);
    console.log(`      Eligible ≥ ${(requirements.eligibleRatioTarget * 100).toFixed(0)}%: ${checks.eligibleRatioMet ? '✅' : '❌'}`);
    console.log(`      Career Tag ≥ 95%: ${checks.careerTagCoverageMet ? '✅' : '❌'}`);
    console.log(`      Unknown Location ≤ ${(requirements.unknownLocationCap * 100).toFixed(0)}%: ${checks.unknownLocationUnderCap ? '✅' : '❌'}`);
    console.log(`      Inserted + Updated ≥ 1: ${checks.insertedOrUpdated ? '✅' : '❌'}`);
    console.log(`      Errors < 10%: ${checks.errorsUnder10Percent ? '✅' : '❌'}`);

    const allPassed = Object.values(checks).every(check => check);
    console.log(`   🎯 Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    return {
      platform,
      passed: allPassed,
      metrics,
      checks
    };

  } catch (error) {
    console.error(`   ❌ Error testing ${platform}:`, error.message);
    return {
      platform,
      passed: false,
      error: error.message
    };
  }
}

async function runCanaryTests() {
  console.log('🚀 Starting Canary Scrape Tests...');
  console.log(`   API URL: ${SCRAPER_API_URL}`);
  console.log(`   Platforms: ${PLATFORMS.length}`);
  
  const results = [];
  
  for (const platform of PLATFORMS) {
    const result = await testPlatform(platform);
    results.push(result);
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n📋 CANARY TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Platforms: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Platforms:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.platform}: ${r.error || 'Requirements not met'}`);
    });
  }
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runCanaryTests().catch(error => {
    console.error('❌ Canary test failed:', error);
    process.exit(1);
  });
}

module.exports = { testPlatform, runCanaryTests };
