-- Enhanced atomic rate limiting
-- This script provides atomic operations for rate limiting with sliding window
-- Usage: EVAL script 1 key limit windowMs currentTimestamp

local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Clean expired entries (remove entries older than window)
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

-- Always refresh TTL to prevent key expiration
redis.call('EXPIRE', key, math.ceil(window / 1000))

-- Get current count of requests in the window
local current = redis.call('ZCARD', key)

if current < limit then
  -- Add request with unique ID to prevent collisions
  local member_id = now .. ":" .. redis.sha1hex(key .. now .. math.random())
  redis.call('ZADD', key, now, member_id)
  return {1, limit - current - 1}
else
  return {0, 0}
end
