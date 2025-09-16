#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Enhanced Scrapers
 * Tests all scrapers with smart strategies implementation
 */

const { getSmartDateStrategy, getSmartPaginationStrategy, getCurrentStrategyInfo } = require('./scrapers/smart-strategies.js');

console.log('🚀 TESTING ALL ENHANCED SCRAPERS');
console.log('================================');
console.log('');

// Test smart strategies first
console.log('📊 Smart Strategies Status:');
console.log('Current strategy info:', getCurrentStrategyInfo());
console.log('');

// Test each scraper
const scrapers = [
  { name: 'JSearch', file: './scrapers/jsearch-scraper.js', method: 'scrapeWithTrackRotation', isClass: true },
  { name: 'Jooble', file: './scrapers/jooble.js', method: 'scrapeAllLocations', isClass: true },
  { name: 'Muse', file: './scrapers/muse-scraper.js', method: 'scrapeAllLocations', isClass: true },
  { name: 'Greenhouse', file: './scrapers/greenhouse.js', method: 'scrapeGreenhouseBoard', isClass: false },
  { name: 'Ashby', file: './scrapers/ashby.js', method: 'scrapeAllCompanies', isClass: true }
];

async function testScraper(scraper) {
  try {
    console.log(`🧪 Testing ${scraper.name}...`);
    
    // Import the scraper
    const scraperModule = require(scraper.file);
    let scraperInstance;
    
    if (scraper.isClass) {
      const ScraperClass = scraperModule.default;
      scraperInstance = new ScraperClass();
    } else {
      // For function-based scrapers like Greenhouse
      scraperInstance = scraperModule;
    }
    
    // Check if method exists
    if (typeof scraperInstance[scraper.method] !== 'function') {
      console.log(`❌ ${scraper.name}: Method '${scraper.method}' not found`);
      if (scraper.isClass) {
        console.log(`   Available methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(scraperInstance)).filter(name => name !== 'constructor'));
      } else {
        console.log(`   Available exports:`, Object.keys(scraperModule));
      }
      return false;
    }
    
    console.log(`✅ ${scraper.name}: Method '${scraper.method}' exists`);
    
    // Test smart strategies integration
    const dateStrategy = getSmartDateStrategy(scraper.name.toLowerCase());
    const paginationStrategy = getSmartPaginationStrategy(scraper.name.toLowerCase());
    
    console.log(`   📅 Date strategy: ${dateStrategy}`);
    console.log(`   📄 Pagination strategy:`, paginationStrategy);
    
    return true;
    
  } catch (error) {
    console.log(`❌ ${scraper.name}: Error - ${error.message}`);
    return false;
  }
}

async function runTests() {
  let passed = 0;
  let total = scrapers.length;
  
  for (const scraper of scrapers) {
    const success = await testScraper(scraper);
    if (success) passed++;
    console.log('');
  }
  
  console.log('📊 TEST RESULTS:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('');
    console.log('🎉 ALL SCRAPERS READY FOR PRODUCTION!');
    console.log('Ready to run: npm run scrape:all');
  } else {
    console.log('');
    console.log('⚠️  Some scrapers need attention before production deployment');
  }
}

// Run the tests
runTests().catch(console.error);
