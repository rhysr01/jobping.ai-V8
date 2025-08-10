const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function testScrapeEndpoint() {
  console.log('🔍 Testing Scrape Endpoint Directly...');
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const apiKey = 'test-api-key';
    
    console.log('📊 Base URL:', baseUrl);
    console.log('🔑 API Key:', apiKey);
    
    // Test 1: GET request to scrape endpoint
    console.log('\n📋 Test 1: GET /api/scrape');
    try {
      const response = await axios.get(`${baseUrl}/api/scrape`, {
        headers: {
          'x-api-key': apiKey
        },
        timeout: 15000
      });
      
      console.log('✅ GET /api/scrape successful:', {
        status: response.status,
        data: response.data
      });
    } catch (error) {
      console.error('❌ GET /api/scrape failed:', {
        status: error.response?.status,
        error: error.response?.data || error.message
      });
    }
    
    // Test 2: POST request to scrape endpoint
    console.log('\n📋 Test 2: POST /api/scrape');
    try {
      const response = await axios.post(`${baseUrl}/api/scrape`, {
        platforms: ['greenhouse']
      }, {
        headers: {
          'x-api-key': apiKey
        },
        timeout: 15000
      });
      
      console.log('✅ POST /api/scrape successful:', {
        status: response.status,
        data: response.data
      });
    } catch (error) {
      console.error('❌ POST /api/scrape failed:', {
        status: error.response?.status,
        error: error.response?.data || error.message
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testScrapeEndpoint();
