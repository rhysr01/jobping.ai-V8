#!/usr/bin/env node

/**
 * Performance Optimization Test Suite
 * Tests all performance optimizations and measures improvements
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const SYSTEM_API_KEY = process.env.SYSTEM_API_KEY;

if (!SYSTEM_API_KEY) {
  console.error('❌ SYSTEM_API_KEY environment variable is required');
  process.exit(1);
}

const performanceTests = [
  { name: 'Health Check Performance', endpoint: '/api/health', expectedMaxTime: 5000 },
  { name: 'Metrics Collection Performance', endpoint: '/api/metrics', expectedMaxTime: 3000 },
  { name: 'Performance Metrics', endpoint: '/api/performance', expectedMaxTime: 2000 },
  { name: 'Monitoring Dashboard', endpoint: '/api/monitoring/dashboard', expectedMaxTime: 4000 }
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
        'User-Agent': 'JobPing-Performance-Test/1.0'
      },
      timeout: 30000
    };

    const startTime = performance.now();
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null,
            duration: duration,
            size: Buffer.byteLength(data, 'utf8')
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            duration: duration,
            size: Buffer.byteLength(data, 'utf8'),
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

async function testEndpoint(test) {
  const url = `${BASE_URL}${test.endpoint}`;
  
  try {
    console.log(`⚡ Testing ${test.name}...`);
    
    const response = await makeRequest(url);
    
    const passed = response.duration <= test.expectedMaxTime;
    const status = passed ? '✅' : '❌';
    
    console.log(`${status} ${test.name}: ${response.duration.toFixed(2)}ms (expected: ≤${test.expectedMaxTime}ms)`);
    console.log(`   Status: ${response.status}, Size: ${(response.size / 1024).toFixed(2)}KB`);
    
    return {
      name: test.name,
      endpoint: test.endpoint,
      duration: response.duration,
      expectedMaxTime: test.expectedMaxTime,
      passed,
      status: response.status,
      size: response.size,
      data: response.data
    };
    
  } catch (error) {
    console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    return {
      name: test.name,
      endpoint: test.endpoint,
      duration: null,
      expectedMaxTime: test.expectedMaxTime,
      passed: false,
      error: error.message
    };
  }
}

async function runLoadTest(endpoint, concurrentRequests = 10) {
  console.log(`🔄 Running load test: ${concurrentRequests} concurrent requests to ${endpoint}`);
  
  const promises = Array(concurrentRequests).fill().map(() => makeRequest(`${BASE_URL}${endpoint}`));
  const startTime = performance.now();
  
  const results = await Promise.allSettled(promises);
  const endTime = performance.now();
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  const totalTime = endTime - startTime;
  
  const durations = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.duration);
  
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  
  console.log(`   Results: ${successful} successful, ${failed} failed`);
  console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`   Avg duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`   Min duration: ${minDuration.toFixed(2)}ms`);
  console.log(`   Max duration: ${maxDuration.toFixed(2)}ms`);
  console.log(`   Requests/sec: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)}`);
  
  return {
    concurrentRequests,
    successful,
    failed,
    totalTime,
    avgDuration,
    minDuration,
    maxDuration,
    requestsPerSecond: concurrentRequests / (totalTime / 1000)
  };
}

async function testMemoryUsage() {
  console.log('🧠 Testing memory usage...');
  
  const memoryBefore = process.memoryUsage();
  
  // Make several requests to test memory stability
  const requests = Array(20).fill().map(() => makeRequest(`${BASE_URL}/api/performance`));
  await Promise.allSettled(requests);
  
  const memoryAfter = process.memoryUsage();
  
  const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
  const memoryIncreasePercent = (memoryIncrease / memoryBefore.heapUsed) * 100;
  
  console.log(`   Memory before: ${(memoryBefore.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Memory after: ${(memoryAfter.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${memoryIncreasePercent.toFixed(2)}%)`);
  
  return {
    memoryBefore,
    memoryAfter,
    memoryIncrease,
    memoryIncreasePercent
  };
}

async function runTests() {
  console.log('🚀 Performance Optimization Test Suite');
  console.log('=====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${SYSTEM_API_KEY ? 'Set' : 'Missing'}`);
  console.log('');

  const startTime = performance.now();
  const results = [];
  
  // Run individual performance tests
  console.log('📊 Individual Performance Tests');
  console.log('===============================');
  
  for (const test of performanceTests) {
    const result = await testEndpoint(test);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Run load tests
  console.log('\n🔄 Load Tests');
  console.log('==============');
  
  const loadTestResults = [];
  const loadTestEndpoints = ['/api/health', '/api/performance'];
  
  for (const endpoint of loadTestEndpoints) {
    const loadResult = await runLoadTest(endpoint, 10);
    loadTestResults.push({ endpoint, ...loadResult });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test memory usage
  console.log('\n🧠 Memory Usage Tests');
  console.log('======================');
  
  const memoryResults = await testMemoryUsage();

  const totalTime = performance.now() - startTime;

  // Summary
  console.log('\n📊 Performance Test Summary');
  console.log('============================');
  
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passedTests}/${results.length}`);
  console.log(`❌ Failed: ${failedTests}/${results.length}`);
  console.log(`⏱️  Total test time: ${(totalTime / 1000).toFixed(2)}s`);
  
  // Performance analysis
  console.log('\n⚡ Performance Analysis');
  console.log('=======================');
  
  results.forEach(result => {
    if (result.duration) {
      const efficiency = ((result.expectedMaxTime - result.duration) / result.expectedMaxTime) * 100;
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.duration.toFixed(2)}ms (${efficiency.toFixed(1)}% efficiency)`);
    }
  });
  
  // Load test summary
  console.log('\n🔄 Load Test Summary');
  console.log('====================');
  
  loadTestResults.forEach(result => {
    console.log(`${result.endpoint}: ${result.requestsPerSecond.toFixed(2)} req/s, ${result.avgDuration.toFixed(2)}ms avg`);
  });
  
  // Memory analysis
  console.log('\n🧠 Memory Analysis');
  console.log('==================');
  
  if (memoryResults.memoryIncreasePercent > 10) {
    console.log(`⚠️  High memory increase: ${memoryResults.memoryIncreasePercent.toFixed(2)}%`);
    console.log('   Consider investigating memory leaks');
  } else {
    console.log(`✅ Memory usage stable: ${memoryResults.memoryIncreasePercent.toFixed(2)}% increase`);
  }
  
  // Recommendations
  console.log('\n💡 Recommendations');
  console.log('==================');
  
  const slowEndpoints = results.filter(r => r.duration && r.duration > r.expectedMaxTime * 0.8);
  if (slowEndpoints.length > 0) {
    console.log('⚠️  Endpoints approaching performance limits:');
    slowEndpoints.forEach(endpoint => {
      console.log(`   - ${endpoint.name}: ${endpoint.duration.toFixed(2)}ms`);
    });
  }
  
  const lowThroughput = loadTestResults.filter(r => r.requestsPerSecond < 10);
  if (lowThroughput.length > 0) {
    console.log('⚠️  Endpoints with low throughput:');
    lowThroughput.forEach(result => {
      console.log(`   - ${result.endpoint}: ${result.requestsPerSecond.toFixed(2)} req/s`);
    });
  }
  
  if (passedTests === results.length && memoryResults.memoryIncreasePercent < 20) {
    console.log('🎉 All performance tests passed!');
    console.log('📈 System is optimized for production scale.');
    process.exit(0);
  } else {
    console.log('⚠️  Some performance issues detected. Check recommendations above.');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Performance test interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Performance test terminated');
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('❌ Performance test runner failed:', error);
  process.exit(1);
});
