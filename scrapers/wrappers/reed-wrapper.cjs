#!/usr/bin/env node

// Wrapper for Reed scraper - standardizes output format
async function main() {
  try {
    require('../../scrapers/reed-scraper-standalone.cjs');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Reed failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };


