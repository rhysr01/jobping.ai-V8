// Test script for the 5 new EU job scrapers
// Run with: node test_eu_scrapers.js

const testScrapers = async () => {
  console.log('🧪 Testing 5 new EU job scrapers...\n');
  
  const scrapers = [
    { name: 'graduatejobs', endpoint: 'graduatejobs' },
    { name: 'graduateland', endpoint: 'graduateland' },
    { name: 'iagora', endpoint: 'iagora' },
    { name: 'smartrecruiters', endpoint: 'smartrecruiters' },
    { name: 'wellfound', endpoint: 'wellfound' }
  ];

  for (const scraper of scrapers) {
    console.log(`🎯 Testing ${scraper.name} scraper...`);
    
    try {
      const response = await fetch('http://localhost:3000/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key' // Development test key
        },
        body: JSON.stringify({
          platforms: [scraper.endpoint]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const scraperResult = result.results[scraper.endpoint];
        if (scraperResult && scraperResult.success) {
          console.log(`✅ ${scraper.name}: ${scraperResult.jobs} jobs found`);
        } else {
          console.log(`⚠️ ${scraper.name}: ${scraperResult?.error || 'Unknown error'}`);
        }
      } else {
        console.log(`❌ ${scraper.name}: ${result.error || 'Request failed'}`);
      }

    } catch (error) {
      console.log(`❌ ${scraper.name}: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎉 All EU scraper tests completed!');
};

// Test all scrapers at once
const testAllScrapers = async () => {
  console.log('🚀 Testing all EU scrapers together...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-api-key' // Development test key
      },
      body: JSON.stringify({
        platforms: ['graduatejobs', 'graduateland', 'iagora', 'smartrecruiters', 'wellfound']
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('📊 Results:');
      Object.entries(result.results).forEach(([scraper, data]) => {
        if (data.success) {
          console.log(`✅ ${scraper}: ${data.jobs} jobs`);
        } else {
          console.log(`❌ ${scraper}: ${data.error}`);
        }
      });
    } else {
      console.log(`❌ All scrapers failed: ${result.error}`);
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
};

// Run tests
const runTests = async () => {
  await testScrapers();
  console.log('\n' + '='.repeat(50) + '\n');
  await testAllScrapers();
};

runTests().catch(console.error);
