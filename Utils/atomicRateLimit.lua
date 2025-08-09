-- Utils/atomicRateLimit.lua - OPTIMIZED VERSION
-- Enhanced atomic rate limiting with perfect TTL handling and collision prevention

local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Clean expired entries from sorted set
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

-- Always refresh TTL to prevent key expiration during active usage
redis.call('EXPIRE', key, math.ceil(window / 1000) + 1)

-- Get current count of requests in window
local current = redis.call('ZCARD', key)

if current < limit then
  -- Generate unique member ID to prevent collisions
  local member_id = now .. ":" .. redis.sha1hex(key .. now .. math.random())
  
  -- Add current request to sorted set
  redis.call('ZADD', key, now, member_id)
  
  -- Return: allowed=1, remaining_requests, reset_time
  return {1, limit - current - 1, now + window}
else
  -- Return: allowed=0, remaining_requests=0, reset_time
  return {0, 0, now + window}
end
