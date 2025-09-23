#!/usr/bin/env node
/**
 * Simple schedule scraping entry point
 * Redirects to the full orchestrator for maximum compatibility
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 JobPing Schedule Scraper');
console.log('==========================');

// Path to the real orchestrator
const orchestratorPath = path.join(__dirname, '../automation/real-job-runner.cjs');

console.log('▶️  Delegating to full orchestrator (single-run mode)');

// Spawn the orchestrator with single-run mode
const child = spawn('node', [orchestratorPath, '--single-run'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    JOBPING_PRODUCTION_MODE: 'true',
    NODE_ENV: 'production'
  }
});

child.on('close', (code) => {
  console.log(`\n📋 Schedule scraping completed with exit code: ${code}`);
  process.exit(code);
});

child.on('error', (error) => {
  console.error('❌ Failed to start orchestrator:', error.message);
  process.exit(1);
});
