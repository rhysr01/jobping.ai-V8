const redis = require('redis');

async function testRedisSimple() {
  console.log('🔍 Testing Redis Connection...');
  
  try {
    // Create Redis client
    const client = redis.createClient({
      url: 'redis://localhost:6379'
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    // Connect to Redis
    await client.connect();
    
    // Test basic operations
    console.log('\n📊 Test 1: Basic Redis operations...');
    
    // Set a test value
    await client.set('test-key', 'test-value');
    console.log('✅ Set test key');
    
    // Get the test value
    const value = await client.get('test-key');
    console.log('✅ Get test key:', value);
    
    // Test rate limiting pattern
    console.log('\n⏱️ Test 2: Rate limiting pattern...');
    const rateKey = 'rate_limit:test-api-key';
    const now = Date.now();
    
    // Add a test entry
    await client.zAdd(rateKey, {
      score: now,
      value: `${now}-${Math.random()}`
    });
    console.log('✅ Added rate limit entry');
    
    // Get count
    const count = await client.zCard(rateKey);
    console.log('✅ Rate limit count:', count);
    
    // Clean up
    await client.del(rateKey);
    await client.del('test-key');
    console.log('✅ Cleaned up test data');
    
    // Close connection
    await client.quit();
    console.log('✅ Redis connection closed');
    
    console.log('\n🎉 Redis is working perfectly!');

  } catch (error) {
    console.error('❌ Redis test failed:', error);
  }
}

// Run the test
testRedisSimple();
