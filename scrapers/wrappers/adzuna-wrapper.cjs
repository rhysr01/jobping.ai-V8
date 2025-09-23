#!/usr/bin/env node

// Wrapper for Adzuna scraper - standardizes output format
async function main() {
  try {
    process.env.INCLUDE_REMOTE = process.env.INCLUDE_REMOTE || 'false';
    const adzunaModule = require('../../scripts/adzuna-categories-scraper.cjs');
    const result = await adzunaModule.scrapeAllCitiesCategories({ verbose: false });
    const jobs = result.jobs.filter(job => !String(job.location || '').toLowerCase().includes('remote'));
    console.log(`✅ Adzuna: ${jobs.length} jobs saved to database`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Adzuna failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };


