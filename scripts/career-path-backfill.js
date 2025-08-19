#!/usr/bin/env node

/**
 * Career Path Backfill Script
 * 
 * This script backfills career path tags for existing jobs that don't have them.
 * Run this after deploying the new career path taxonomy system.
 */

require('dotenv').config();

const { runCareerPathBackfill } = require('../Utils/careerPathBackfill');

async function main() {
  console.log('🎯 Career Path Backfill Script');
  console.log('================================');
  console.log('');
  
  try {
    await runCareerPathBackfill();
    console.log('');
    console.log('✅ Backfill completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Backfill failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
