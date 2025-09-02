#!/usr/bin/env node

/**
 * Test script for standalone scrapers
 * Tests each scraper independently using tsx
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Testing Standalone Scrapers\n');

// Test Adzuna scraper
async function testAdzunaScraper() {
  console.log('📍 Testing Adzuna scraper...');
  
  return new Promise((resolve) => {
    const testCode = `
      import 'dotenv/config';
      import AdzunaScraper from '../scrapers/adzuna-scraper-standalone.ts';
      
      try {
        const scraper = new AdzunaScraper();
        console.log('✅ Adzuna scraper instantiated successfully');
        
        const stats = scraper.getDailyStats();
        console.log('📊 Daily stats:', stats);
        
        console.log('✅ Adzuna scraper test passed');
      } catch (error) {
        console.error('❌ Adzuna scraper test failed:', error.message);
        process.exit(1);
      }
    `;
    
    const tempFile = path.join(__dirname, 'temp-adzuna-standalone.js');
    require('fs').writeFileSync(tempFile, testCode);
    
    const child = spawn('npx', ['tsx', tempFile], { 
      stdio: 'pipe',
      cwd: __dirname 
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      require('fs').unlinkSync(tempFile);
      console.log(output);
      resolve(code === 0);
    });
  });
}

// Test Reed scraper
async function testReedScraper() {
  console.log('📍 Testing Reed scraper...');
  
  return new Promise((resolve) => {
    const testCode = `
      import 'dotenv/config';
      import ReedScraper from '../scrapers/reed-scraper-standalone.ts';
      
      try {
        const scraper = new ReedScraper();
        console.log('✅ Reed scraper instantiated successfully');
        
        const status = scraper.getStatus();
        console.log('📊 Status:', status);
        
        console.log('✅ Reed scraper test passed');
      } catch (error) {
        console.error('❌ Reed scraper test failed:', error.message);
        process.exit(1);
      }
    `;
    
    const tempFile = path.join(__dirname, 'temp-reed-standalone.js');
    require('fs').writeFileSync(tempFile, testCode);
    
    const child = spawn('npx', ['tsx', tempFile], { 
      stdio: 'pipe',
      cwd: __dirname 
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      require('fs').unlinkSync(tempFile);
      console.log(output);
      resolve(code === 0);
    });
  });
}

// Test InfoJobs scraper
async function testInfoJobsScraper() {
  console.log('📍 Testing InfoJobs scraper...');
  
  return new Promise((resolve) => {
    const testCode = `
      import 'dotenv/config';
      import InfoJobsScraper from '../scrapers/infojobs-scraper-standalone.ts';
      
      try {
        const scraper = new InfoJobsScraper();
        console.log('✅ InfoJobs scraper instantiated successfully');
        
        const status = scraper.getStatus();
        console.log('📊 Status:', status);
        
        console.log('✅ InfoJobs scraper test passed');
      } catch (error) {
        console.error('❌ InfoJobs scraper test failed:', error.message);
        process.exit(1);
      }
    `;
    
    const tempFile = path.join(__dirname, 'temp-infojobs-standalone.js');
    require('fs').writeFileSync(tempFile, testCode);
    
    const child = spawn('npx', ['tsx', tempFile], { 
      stdio: 'pipe',
      cwd: __dirname 
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      require('fs').unlinkSync(tempFile);
      console.log(output);
      resolve(code === 0);
    });
  });
}

// Test actual API calls
async function testReedAPI() {
  console.log('📍 Testing Reed API call...');
  
  return new Promise((resolve) => {
    const testCode = `
      import 'dotenv/config';
      import ReedScraper from '../scrapers/reed-scraper-standalone.ts';
      
      (async () => {
        try {
          const scraper = new ReedScraper();
          console.log('✅ Reed scraper ready');
          
          console.log('🔄 Attempting to scrape London...');
          const result = await scraper.scrapeLondon();
          
          console.log('✅ London scraping completed');
          console.log('📊 Results:', {
            jobsFound: result.jobs.length,
            metrics: result.metrics
          });
          
          if (result.jobs.length > 0) {
            console.log('📋 Sample job:', {
              title: result.jobs[0].title,
              company: result.jobs[0].company,
              location: result.jobs[0].location,
              source: result.jobs[0].source
            });
          }
          
          console.log('✅ Reed API test passed');
        } catch (error) {
          console.error('❌ Reed API test failed:', error.message);
          if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
          }
          process.exit(1);
        }
      })();
    `;
    
    const tempFile = path.join(__dirname, 'temp-reed-api.js');
    require('fs').writeFileSync(tempFile, testCode);
    
    const child = spawn('npx', ['tsx', tempFile], { 
      stdio: 'pipe',
      cwd: __dirname 
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      require('fs').unlinkSync(tempFile);
      console.log(output);
      resolve(code === 0);
    });
  });
}

async function main() {
  console.log('🧪 Running standalone scraper tests...\n');
  
  const results = [];
  
  // Test each scraper instantiation
  results.push(await testAdzunaScraper());
  console.log('\n' + '='.repeat(50) + '\n');
  
  results.push(await testReedScraper());
  console.log('\n' + '='.repeat(50) + '\n');
  
  results.push(await testInfoJobsScraper());
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test Reed API call
  results.push(await testReedAPI());
  
  // Summary
  console.log('\n🎯 Standalone Scraper Test Results Summary:');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All standalone scraper tests passed!');
    console.log('The scrapers are working independently and ready for use.');
    console.log('\n📝 Next steps:');
    console.log('• Run individual scrapers as needed');
    console.log('• Schedule them independently');
    console.log('• Integrate with your job processing pipeline');
  } else {
    console.log('\n💥 Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAdzunaScraper,
  testReedScraper,
  testInfoJobsScraper,
  testReedAPI
};
