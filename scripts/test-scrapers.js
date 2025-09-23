#!/usr/bin/env node

// Use .cjs filename would avoid ESM, but keep it JS and use dynamic import of CJS via createRequire
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testScraper(name, command, timeout = 30000) {
  console.log(`\n🧪 Testing ${name}...`);
  try {
    const { stdout, stderr } = await execAsync(command, { timeout });
    const hasSuccess = stdout.includes('✅') || stdout.toLowerCase().includes('jobs saved');
    const hasError = (stderr && stderr.includes('❌')) || (stderr && stderr.includes('Error'));
    if (hasSuccess && !hasError) {
      console.log(`✅ ${name} executed successfully`);
      console.log('Sample output:', stdout.substring(0, 200) + '...');
      return true;
    } else {
      console.log(`⚠️ ${name} completed but with warnings`);
      if (stderr) console.log('Warnings:', stderr.substring(0, 200) + '...');
      return false;
    }
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing scraper wrappers...');
  console.log('Note: This will run actual scraping operations with small limits\n');

  const tests = [
    ['Adzuna Wrapper', 'node scrapers/wrappers/adzuna-wrapper.cjs', 60000],
    ['JobSpy Wrapper', 'node scrapers/wrappers/jobspy-wrapper.cjs', 90000],
    ['Reed Wrapper', 'node scrapers/wrappers/reed-wrapper.cjs', 60000]
  ];

  let passed = 0;
  for (const [name, command, timeout] of tests) {
    const success = await testScraper(name, command, timeout);
    if (success) passed++;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n📊 Test Results: ${passed}/${tests.length} scrapers passed`);
  if (passed === tests.length) {
    console.log('🎉 All wrappers working! You can now run the orchestrator safely.');
  } else {
    console.log('⚠️ Some wrappers need attention. Check the error messages above.');
  }
}

await main();


