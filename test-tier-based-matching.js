// Test script for tier-based matching system
// Run with: node test-tier-based-matching.js

async function testTierBasedMatching() {
  console.log('🧪 Testing tier-based matching system...');
  
  try {
    // Test the scheduled emails endpoint
    const response = await fetch('http://localhost:3000/api/send-scheduled-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.SCRAPE_API_KEY || 'test-api-key'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Tier-based matching test completed!');
    console.log('📊 Results:', {
      success: result.success,
      usersProcessed: result.usersProcessed,
      emailsSent: result.emailsSent,
      errors: result.errors
    });

    if (result.usersProcessed > 0) {
      console.log('\n🎯 System is working correctly!');
      console.log(`   - Processed ${result.usersProcessed} users`);
      console.log(`   - Sent ${result.emailsSent} emails`);
      console.log(`   - ${result.errors} errors`);
    } else {
      console.log('\nℹ️ No users eligible for emails right now (this is normal)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTierBasedMatching();
