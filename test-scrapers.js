#!/usr/bin/env node

// Simple scraper test script
const https = require('https');
const fs = require('fs');

async function testRemoteOKAPI() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Testing RemoteOK API directly...');
    
    const url = 'https://remoteok.io/api';
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jobs = JSON.parse(data);
          console.log(`✅ RemoteOK API returned ${jobs.length} jobs`);
          
          if (jobs.length > 0) {
            console.log('📋 Sample jobs:');
            jobs.slice(1, 4).forEach((job, i) => { // Skip first item (metadata)
              console.log(`${i+1}. ${job.position || 'N/A'} at ${job.company || 'N/A'}`);
            });
          }
          
          resolve({ success: true, count: jobs.length });
        } catch (error) {
          console.error('❌ Failed to parse RemoteOK response:', error.message);
          reject(error);
        }
      });
      
    }).on('error', (error) => {
      console.error('❌ RemoteOK API request failed:', error.message);
      reject(error);
    });
  });
}

async function testGreenhouseAPI() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Testing Greenhouse API (Stripe board)...');
    
    const url = 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs';
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const jobs = response.jobs || [];
          console.log(`✅ Greenhouse (Stripe) returned ${jobs.length} jobs`);
          
          if (jobs.length > 0) {
            console.log('📋 Sample jobs:');
            jobs.slice(0, 3).forEach((job, i) => {
              console.log(`${i+1}. ${job.title || 'N/A'} (${job.location?.name || 'N/A'})`);
            });
          }
          
          resolve({ success: true, count: jobs.length });
        } catch (error) {
          console.error('❌ Failed to parse Greenhouse response:', error.message);
          reject(error);
        }
      });
      
    }).on('error', (error) => {
      console.error('❌ Greenhouse API request failed:', error.message);
      reject(error);
    });
  });
}

async function runTests() {
  console.log('🧪 Testing job scraper APIs...\n');
  
  try {
    const remoteOKResult = await testRemoteOKAPI();
    console.log('');
    
    const greenhouseResult = await testGreenhouseAPI();
    console.log('');
    
    const totalJobs = remoteOKResult.count + greenhouseResult.count;
    console.log(`🎯 Total jobs found: ${totalJobs}`);
    
    if (totalJobs === 0) {
      console.log('⚠️  No jobs found - this indicates scraper issues');
    } else {
      console.log('✅ Scrapers are finding jobs successfully!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
