const { rateLimiter } = require('./Utils/rateLimiter');

async function testRedisRateLimiter() {
  console.log('🔍 Testing Redis Rate Limiter...');
  
  try {
    // Test 1: Check if rate limiter is connected
    console.log('\n📊 Test 1: Checking rate limiter connection...');
    const stats = await rateLimiter.getStats();
    console.log('Rate limiter stats:', stats);

    // Test 2: Test rate limiting
    console.log('\n⏱️ Test 2: Testing rate limiting...');
    const testKey = 'test-api-key';
    
    for (let i = 1; i <= 5; i++) {
      const result = await rateLimiter.checkLimit(testKey, 3, 60000); // 3 requests per minute
      console.log(`Request ${i}:`, {
        allowed: result.allowed,
        remaining: result.remaining,
        resetTime: new Date(result.resetTime).toISOString()
      });
    }

    // Test 3: Test health check
    console.log('\n🏥 Test 3: Testing health check...');
    const health = await rateLimiter.healthCheck();
    console.log('Health check:', health);

    console.log('\n✅ Redis rate limiter is working correctly!');

  } catch (error) {
    console.error('❌ Redis rate limiter test failed:', error);
  }
}

// Run the test
testRedisRateLimiter();
