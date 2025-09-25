#!/usr/bin/env node

/**
 * Test Cron Endpoints
 * Tests the reliability of cron-triggered queue processing
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const SYSTEM_API_KEY = process.env.SYSTEM_API_KEY;

if (!SYSTEM_API_KEY) {
  console.error('❌ SYSTEM_API_KEY environment variable is required');
  process.exit(1);
}

const endpoints = [
  '/api/cron/process-email-queue',
  '/api/cron/process-scraping-queue', 
  '/api/cron/process-ai-matching',
  '/api/cron/process-queue'
];

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const options = {
      method: 'GET',
      headers: {
        'x-system-api-key': SYSTEM_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'JobPing-Cron-Test/1.0'
      },
      timeout: 30000 // 30 seconds
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  try {
    console.log(`🧪 Testing ${endpoint}...`);
    
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ ${endpoint}: ${response.status} (${duration}ms)`);
      if (response.data) {
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      }
      return { success: true, duration, status: response.status, data: response.data };
    } else {
      console.log(`❌ ${endpoint}: ${response.status} (${duration}ms)`);
      if (response.data) {
        console.log(`   Error:`, JSON.stringify(response.data, null, 2));
      }
      return { success: false, duration, status: response.status, data: response.data };
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ ${endpoint}: ERROR (${duration}ms) - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Cron Endpoints');
  console.log('========================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${SYSTEM_API_KEY ? 'Set' : 'Missing'}`);
  console.log('');

  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint, ...result });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Average duration: ${avgDuration.toFixed(0)}ms`);
  
  if (failed > 0) {
    console.log('\n❌ Failed endpoints:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.endpoint}: ${r.error || r.data?.error || 'Unknown error'}`);
    });
  }
  
  if (successful === results.length) {
    console.log('\n🎉 All cron endpoints are working correctly!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some cron endpoints failed. Check the logs above.');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test terminated');
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
