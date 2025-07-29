// Test script for AI matching pipeline
// Run with: node test-matching.js

const testUserEmail = 'test@example.com'; // Replace with actual test user email

async function testMatching() {
  console.log('🧪 Testing AI matching pipeline...');
  
  try {
    // Test the match-users endpoint
    const response = await fetch('http://localhost:3000/api/match-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: testUserEmail,
        limit: 5 // Small limit for testing
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Matching test completed!');
    console.log('📊 Results:', {
      user_email: result.user_email,
      total_jobs_processed: result.total_jobs_processed,
      matches_found: result.matches?.length || 0
    });

    if (result.matches && result.matches.length > 0) {
      console.log('\n🎯 Top matches:');
      result.matches.slice(0, 3).forEach((match, index) => {
        console.log(`${index + 1}. Score: ${match.match_score} - ${match.match_reason}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test user matches endpoint
async function testUserMatches() {
  console.log('\n📋 Testing user matches retrieval...');
  
  try {
    const response = await fetch(`http://localhost:3000/api/user-matches?email=${testUserEmail}&limit=5&minScore=0.5`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ User matches test completed!');
    console.log('📊 Results:', {
      user_email: result.user_email,
      total_matches: result.total_matches
    });

  } catch (error) {
    console.error('❌ User matches test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testMatching();
  await testUserMatches();
  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error); 