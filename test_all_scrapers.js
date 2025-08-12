#!/usr/bin/env node

// Comprehensive scraper testing script
// Tests all scrapers individually and together
// Run with: node test_all_scrapers.js

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const API_KEY = process.env.JOBPING_API_KEY || 'test-api-key';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = (color, message) => console.log(color + message + colors.reset);

// All available scrapers
const SCRAPERS = [
  { name: 'RemoteOK', endpoint: 'remoteok', priority: 'high' },
  { name: 'Greenhouse', endpoint: 'greenhouse', priority: 'high' },
  { name: 'Lever', endpoint: 'lever', priority: 'high' },
  { name: 'Workday', endpoint: 'workday', priority: 'high' },
  { name: 'GraduateJobs', endpoint: 'graduatejobs', priority: 'medium' },
  { name: 'Graduateland', endpoint: 'graduateland', priority: 'medium' },
  { name: 'iAgora', endpoint: 'iagora', priority: 'medium' },
  { name: 'SmartRecruiters', endpoint: 'smartrecruiters', priority: 'medium' },
  { name: 'Wellfound', endpoint: 'wellfound', priority: 'medium' }
];

// Test individual scraper
async function testScraper(scraper, timeout = 30000) {
  log(colors.blue, `🧪 Testing ${scraper.name} scraper...`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${BASE_URL}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        platforms: [scraper.endpoint]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      const scraperResult = result.results[scraper.endpoint];
      if (scraperResult && scraperResult.success) {
        log(colors.green, `✅ ${scraper.name}: ${scraperResult.jobs} jobs found (${scraperResult.inserted} new, ${scraperResult.updated} updated)`);
        return {
          success: true,
          jobs: scraperResult.jobs || 0,
          inserted: scraperResult.inserted || 0,
          updated: scraperResult.updated || 0,
          errors: scraperResult.errors || []
        };
      } else {
        log(colors.yellow, `⚠️ ${scraper.name}: ${scraperResult?.error || 'Unknown error'}`);
        return { success: false, error: scraperResult?.error || 'Unknown error' };
      }
    } else {
      log(colors.red, `❌ ${scraper.name}: ${result.error || 'Request failed'}`);
      return { success: false, error: result.error || 'Request failed' };
    }

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      log(colors.red, `❌ ${scraper.name}: Timeout after ${timeout/1000}s`);
      return { success: false, error: 'Timeout' };
    }
    log(colors.red, `❌ ${scraper.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test all scrapers individually
async function testAllScrapersIndividually() {
  log(colors.magenta, '\n🚀 TESTING ALL SCRAPERS INDIVIDUALLY\n');
  
  const results = {};
  let totalJobs = 0;
  let successCount = 0;
  
  for (const scraper of SCRAPERS) {
    const result = await testScraper(scraper);
    results[scraper.endpoint] = result;
    
    if (result.success) {
      successCount++;
      totalJobs += result.jobs || 0;
    }
    
    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  log(colors.cyan, `\n📊 Individual Test Summary:`);
  log(colors.white, `✅ Successful: ${successCount}/${SCRAPERS.length}`);
  log(colors.white, `📦 Total jobs found: ${totalJobs}`);
  
  return results;
}

// Test all scrapers together
async function testAllScrapersTogether() {
  log(colors.magenta, '\n🎯 TESTING ALL SCRAPERS TOGETHER\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        platforms: ['all']
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      log(colors.green, '✅ All scrapers executed successfully');
      log(colors.cyan, '\n📊 Combined Results:');
      
      let totalJobs = 0;
      let successCount = 0;
      
      Object.entries(result.results).forEach(([scraper, data]) => {
        if (data.success) {
          log(colors.green, `✅ ${scraper}: ${data.jobs} jobs (${data.inserted} new, ${data.updated} updated)`);
          totalJobs += data.jobs || 0;
          successCount++;
        } else {
          log(colors.red, `❌ ${scraper}: ${data.error}`);
        }
      });
      
      log(colors.white, `\n📦 Combined total: ${totalJobs} jobs from ${successCount} scrapers`);
      return { success: true, totalJobs, successCount };
    } else {
      log(colors.red, `❌ All scrapers failed: ${result.error}`);
      return { success: false, error: result.error };
    }

  } catch (error) {
    log(colors.red, `❌ Combined test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test API endpoint availability
async function testAPIEndpoint() {
  log(colors.blue, '🔌 Testing API endpoint availability...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/scrape`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    log(colors.green, '✅ API endpoint is accessible');
    log(colors.white, `📋 Available platforms: ${result.platforms?.join(', ') || 'Unknown'}`);
    return true;
  } catch (error) {
    log(colors.red, `❌ API endpoint test failed: ${error.message}`);
    return false;
  }
}

// Test specific high-priority scrapers
async function testHighPriorityScrapers() {
  log(colors.magenta, '\n⭐ TESTING HIGH-PRIORITY SCRAPERS\n');
  
  const highPriorityScrapers = SCRAPERS.filter(s => s.priority === 'high');
  const results = {};
  let successCount = 0;
  
  for (const scraper of highPriorityScrapers) {
    const result = await testScraper(scraper);
    results[scraper.endpoint] = result;
    
    if (result.success) {
      successCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  log(colors.cyan, `\n📊 High-Priority Summary: ${successCount}/${highPriorityScrapers.length} successful`);
  return results;
}

// Check scraper dependencies
async function checkScraperDependencies() {
  log(colors.blue, '\n🔍 CHECKING SCRAPER DEPENDENCIES\n');
  
  const dependencies = ['axios', 'cheerio', 'crypto'];
  const checks = [];
  
  for (const dep of dependencies) {
    try {
      require.resolve(dep);
      log(colors.green, `✅ ${dep}: Available`);
      checks.push({ dependency: dep, available: true });
    } catch (error) {
      log(colors.red, `❌ ${dep}: Missing`);
      checks.push({ dependency: dep, available: false });
    }
  }
  
  return checks;
}

// Performance test
async function performanceTest() {
  log(colors.magenta, '\n⚡ PERFORMANCE TEST\n');
  
  const startTime = Date.now();
  
  // Test a fast scraper (RemoteOK)
  const result = await testScraper(SCRAPERS.find(s => s.endpoint === 'remoteok'));
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  log(colors.cyan, `⏱️ RemoteOK scraper completed in ${duration}ms`);
  
  if (duration < 10000) {
    log(colors.green, '✅ Performance: Excellent (<10s)');
  } else if (duration < 30000) {
    log(colors.yellow, '⚠️ Performance: Good (<30s)');
  } else {
    log(colors.red, '❌ Performance: Slow (>30s)');
  }
  
  return { duration, result };
}

// Main test runner
async function runAllTests() {
  console.clear();
  log(colors.cyan, '🎯 JOBPING SCRAPER COMPREHENSIVE TEST SUITE');
  log(colors.white, '='.repeat(50));
  log(colors.white, `Base URL: ${BASE_URL}`);
  log(colors.white, `API Key: ${API_KEY.substring(0, 8)}...`);
  log(colors.white, '='.repeat(50));
  
  // 1. Check dependencies
  await checkScraperDependencies();
  
  // 2. Test API endpoint
  const apiAvailable = await testAPIEndpoint();
  if (!apiAvailable) {
    log(colors.red, '\n❌ API endpoint not available. Stopping tests.');
    return;
  }
  
  // 3. Performance test
  await performanceTest();
  
  // 4. Test high-priority scrapers
  await testHighPriorityScrapers();
  
  // 5. Test all scrapers individually
  const individualResults = await testAllScrapersIndividually();
  
  // 6. Test all scrapers together
  const combinedResults = await testAllScrapersTogether();
  
  // Final summary
  log(colors.magenta, '\n🎉 TEST SUITE COMPLETED');
  log(colors.white, '='.repeat(50));
  
  const successfulScrapers = Object.values(individualResults).filter(r => r.success).length;
  const totalJobs = Object.values(individualResults).reduce((sum, r) => sum + (r.jobs || 0), 0);
  
  log(colors.cyan, `📊 FINAL SUMMARY:`);
  log(colors.white, `✅ Working scrapers: ${successfulScrapers}/${SCRAPERS.length}`);
  log(colors.white, `📦 Total jobs available: ${totalJobs}`);
  
  if (successfulScrapers === SCRAPERS.length) {
    log(colors.green, '🎉 ALL SCRAPERS ARE WORKING PERFECTLY!');
  } else if (successfulScrapers >= 6) {
    log(colors.yellow, '⚠️ Most scrapers working - check failed ones');
  } else {
    log(colors.red, '❌ Multiple scrapers failing - needs attention');
  }
  
  log(colors.white, '\n' + '='.repeat(50));
}

// Handle script arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log(colors.cyan, `
📖 SCRAPER TEST SCRIPT USAGE:

node test_all_scrapers.js              # Run full test suite
node test_all_scrapers.js --quick      # Test high-priority scrapers only
node test_all_scrapers.js --performance # Performance test only
node test_all_scrapers.js --deps       # Check dependencies only
node test_all_scrapers.js --individual # Test scrapers individually only

Environment variables:
NEXT_PUBLIC_URL     # Base URL (default: http://localhost:3000)
JOBPING_API_KEY     # API key for authentication (default: test-key)
`);
  process.exit(0);
}

// Run specific tests based on arguments
if (args.includes('--quick')) {
  testHighPriorityScrapers().then(() => process.exit(0));
} else if (args.includes('--performance')) {
  performanceTest().then(() => process.exit(0));
} else if (args.includes('--deps')) {
  checkScraperDependencies().then(() => process.exit(0));
} else if (args.includes('--individual')) {
  testAllScrapersIndividually().then(() => process.exit(0));
} else {
  runAllTests().then(() => process.exit(0));
}
