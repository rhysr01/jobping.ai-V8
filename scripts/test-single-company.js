#!/usr/bin/env node

/**
 * Single Company Verification Script
 * Tests individual companies before adding them to your scraper configs
 */

const https = require('https');
const http = require('http');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'JobPing/1.0 (+https://jobping.com/bot)',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, parseError: true });
        }
      });
    }).on('error', (error) => {
      reject(error);
    }).on('timeout', () => {
      reject(new Error('Request timeout'));
    });
  });
}

async function testCompany(platform, boardId) {
  try {
    let url;
    if (platform === 'greenhouse') {
      url = `https://boards-api.greenhouse.io/v1/boards/${boardId}/jobs`;
    } else if (platform === 'ashby') {
      url = `https://api.ashbyhq.com/posting-api/job-board/${boardId}`;
    } else {
      throw new Error('Platform must be "greenhouse" or "ashby"');
    }

    console.log(`🔍 Testing ${platform}: ${boardId}`);
    console.log(`📞 URL: ${url}`);
    
    const response = await makeRequest(url);
    
    if (response.status === 404) {
      console.log(`❌ ${boardId}: Board not found (404)`);
      return { success: false, error: '404 - Board not found' };
    }
    
    if (response.status !== 200) {
      console.log(`❌ ${boardId}: HTTP ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    if (response.parseError) {
      console.log(`❌ ${boardId}: Invalid JSON response`);
      return { success: false, error: 'Invalid JSON' };
    }
    
    const jobs = platform === 'greenhouse' ? response.data?.jobs || [] : response.data || [];
    
    if (!Array.isArray(jobs)) {
      console.log(`❌ ${boardId}: Unexpected response format`);
      return { success: false, error: 'Unexpected response format' };
    }
    
    // Analyze job content for EU and early-career relevance
    const euJobs = jobs.filter(job => {
      const text = JSON.stringify(job).toLowerCase();
      return /london|dublin|berlin|amsterdam|paris|madrid|stockholm|zurich|copenhagen|vienna|brussels|prague|warsaw|barcelona|milan|rome|lisbon|athens|helsinki|oslo|eu\s|europe|remote.*eu|emea/i.test(text);
    });
    
    const earlyCareerJobs = jobs.filter(job => {
      const text = JSON.stringify(job).toLowerCase();
      return /graduate|intern|entry.level|junior|trainee|apprentice|early.career|campus|new.grad|recent.grad|grad.program|graduate.program|entry.position|starter|beginner/i.test(text);
    });
    
    const seniorJobs = jobs.filter(job => {
      const text = JSON.stringify(job).toLowerCase();
      return /senior|lead|principal|manager|director|head.of|staff|architect|expert|specialist.*\d+.*years|5\+.*years|7\+.*years|experienced/i.test(text);
    });
    
    // Sample jobs for manual inspection
    const sampleJobs = jobs.slice(0, 3).map(job => ({
      title: job.title || job.name || 'No title',
      location: job.location?.name || job.location?.locationName || 'No location'
    }));
    
    console.log(`✅ ${boardId}: ${jobs.length} total jobs`);
    console.log(`   🌍 EU-related: ${euJobs.length} (${((euJobs.length / jobs.length) * 100).toFixed(1)}%)`);
    console.log(`   🎓 Early-career: ${earlyCareerJobs.length} (${((earlyCareerJobs.length / jobs.length) * 100).toFixed(1)}%)`);
    console.log(`   👔 Senior-level: ${seniorJobs.length} (${((seniorJobs.length / jobs.length) * 100).toFixed(1)}%)`);
    
    // Show sample jobs
    console.log(`   📋 Sample jobs:`);
    sampleJobs.forEach((job, index) => {
      console.log(`      ${index + 1}. ${job.title} - ${job.location}`);
    });
    
    // Recommendation
    const relevanceScore = euJobs.length + earlyCareerJobs.length;
    const worthAdding = relevanceScore > 0;
    const priority = relevanceScore >= 10 ? 'HIGH' : relevanceScore >= 5 ? 'MEDIUM' : relevanceScore > 0 ? 'LOW' : 'SKIP';
    
    console.log(`   🎯 Recommendation: ${worthAdding ? `ADD (${priority} priority)` : 'SKIP - No relevant jobs'}`);
    
    return { 
      success: true, 
      jobs: jobs.length, 
      euJobs: euJobs.length, 
      earlyCareerJobs: earlyCareerJobs.length,
      seniorJobs: seniorJobs.length,
      relevanceScore,
      priority,
      worthAdding
    };
    
  } catch (error) {
    console.log(`❌ ${boardId}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Handle command line arguments
const [,, platform, boardId] = process.argv;

if (!platform || !boardId) {
  console.log(`
🔍 JobPing Company Verification Tool

Usage: node test-single-company.js <platform> <boardId>

Platforms:
  greenhouse  - Test Greenhouse board
  ashby       - Test Ashby board

Examples:
  node scripts/test-single-company.js greenhouse wise
  node scripts/test-single-company.js ashby retool
  node scripts/test-single-company.js greenhouse checkout
  node scripts/test-single-company.js ashby huggingface
  
High-Priority Tests:
  # Greenhouse
  node scripts/test-single-company.js greenhouse wise
  node scripts/test-single-company.js greenhouse checkout
  node scripts/test-single-company.js greenhouse zalando
  node scripts/test-single-company.js greenhouse contentful
  node scripts/test-single-company.js greenhouse twilio
  
  # Ashby  
  node scripts/test-single-company.js ashby retool
  node scripts/test-single-company.js ashby huggingface
  node scripts/test-single-company.js ashby miro
  node scripts/test-single-company.js ashby airtable
  `);
  process.exit(1);
}

console.log('🚀 JobPing Company Verification\n');
testCompany(platform, boardId);
