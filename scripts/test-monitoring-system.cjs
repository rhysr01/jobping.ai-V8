#!/usr/bin/env node

/**
 * Test Monitoring System
 * Tests all monitoring endpoints and functionality
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

const monitoringEndpoints = [
  { path: '/api/health', name: 'Health Check' },
  { path: '/api/metrics', name: 'Metrics Collection' },
  { path: '/api/monitoring/dashboard', name: 'Monitoring Dashboard' }
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
        'User-Agent': 'JobPing-Monitoring-Test/1.0'
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
  const url = `${BASE_URL}${endpoint.path}`;
  const startTime = Date.now();
  
  try {
    console.log(`🧪 Testing ${endpoint.name} (${endpoint.path})...`);
    
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ ${endpoint.name}: ${response.status} (${duration}ms)`);
      
      // Validate response structure based on endpoint
      validateResponse(endpoint.path, response.data);
      
      return { success: true, duration, status: response.status, data: response.data };
    } else {
      console.log(`❌ ${endpoint.name}: ${response.status} (${duration}ms)`);
      if (response.data) {
        console.log(`   Error:`, JSON.stringify(response.data, null, 2));
      }
      return { success: false, duration, status: response.status, data: response.data };
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ ${endpoint.name}: ERROR (${duration}ms) - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

function validateResponse(endpoint, data) {
  if (!data) {
    console.log(`   ⚠️  No response data for ${endpoint}`);
    return;
  }

  switch (endpoint) {
    case '/api/health':
      validateHealthResponse(data);
      break;
    case '/api/metrics':
      validateMetricsResponse(data);
      break;
    case '/api/monitoring/dashboard':
      validateDashboardResponse(data);
      break;
    default:
      console.log(`   ℹ️  No validation rules for ${endpoint}`);
  }
}

function validateHealthResponse(data) {
  const required = ['status', 'timestamp', 'duration', 'components'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    console.log(`   ⚠️  Missing health fields: ${missing.join(', ')}`);
  } else {
    console.log(`   ✅ Health response structure valid`);
  }
  
  // Check component health
  if (data.components) {
    const components = Object.keys(data.components);
    console.log(`   📊 Components: ${components.join(', ')}`);
    
    const unhealthy = components.filter(comp => 
      data.components[comp].status === 'unhealthy'
    );
    
    if (unhealthy.length > 0) {
      console.log(`   ⚠️  Unhealthy components: ${unhealthy.join(', ')}`);
    }
  }
}

function validateMetricsResponse(data) {
  const required = ['current', 'collection_time'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    console.log(`   ⚠️  Missing metrics fields: ${missing.join(', ')}`);
  } else {
    console.log(`   ✅ Metrics response structure valid`);
  }
  
  // Check metrics structure
  if (data.current) {
    const metrics = data.current;
    console.log(`   📊 Metrics collected: performance, business, queue, errors`);
    
    if (metrics.business) {
      console.log(`   👥 Users: ${metrics.business.total_users}, Jobs: ${metrics.business.total_jobs}`);
    }
    
    if (metrics.queue) {
      console.log(`   📋 Queue: ${metrics.queue.pending_jobs} pending, ${metrics.queue.failed_jobs} failed`);
    }
  }
}

function validateDashboardResponse(data) {
  const required = ['timestamp', 'generation_time', 'summary'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    console.log(`   ⚠️  Missing dashboard fields: ${missing.join(', ')}`);
  } else {
    console.log(`   ✅ Dashboard response structure valid`);
  }
  
  // Check summary
  if (data.summary) {
    const summary = data.summary;
    console.log(`   📊 Status: ${summary.overall_status}, Alerts: ${summary.total_alerts}`);
    
    if (summary.critical_alerts > 0) {
      console.log(`   🚨 Critical alerts: ${summary.critical_alerts}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Testing Monitoring System');
  console.log('============================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${SYSTEM_API_KEY ? 'Set' : 'Missing'}`);
  console.log('');

  const results = [];
  
  for (const endpoint of monitoringEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint: endpoint.name, ...result });
    
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
  
  // Performance analysis
  console.log('\n⚡ Performance Analysis');
  console.log('=======================');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.endpoint}: ${r.duration}ms`);
  });
  
  if (successful === results.length) {
    console.log('\n🎉 All monitoring endpoints are working correctly!');
    console.log('📈 Monitoring system is ready for production use.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some monitoring endpoints failed. Check the logs above.');
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
