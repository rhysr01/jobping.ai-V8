import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/match-users/route';

// Mock the dependencies
jest.mock('@/Utils/enhancedRateLimiter');
jest.mock('@/Utils/performanceMonitor');
jest.mock('@/Utils/advancedMonitoring');
jest.mock('@/Utils/autoScaling');
jest.mock('@/Utils/userSegmentation');

describe('/api/match-users', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock request
    mockRequest = new NextRequest('http://localhost:3000/api/match-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });
  });

  describe('POST', () => {
    it('should return 400 for invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/match-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      // Mock rate limiter to return false
      const { EnhancedRateLimiter } = require('@/Utils/enhancedRateLimiter');
      EnhancedRateLimiter.prototype.checkLimit = jest.fn().mockResolvedValue({
        allowed: false,
        remaining: 0,
      });

      const request = new NextRequest('http://localhost:3000/api/match-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limited');
    });

    it('should handle database connection errors', async () => {
      // Mock Supabase to throw error
      const { createClient } = require('@supabase/supabase-js');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.reject(new Error('Database error'))),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/match-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should return success for valid request', async () => {
      // Mock successful responses
      const { createClient } = require('@supabase/supabase-js');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            gte: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
                })),
              })),
            })),
          })),
        })),
      });

      const { EnhancedRateLimiter } = require('@/Utils/enhancedRateLimiter');
      EnhancedRateLimiter.prototype.checkLimit = jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 10,
      });

      const request = new NextRequest('http://localhost:3000/api/match-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('No active users found');
    });
  });

  describe('GET', () => {
    it('should return 405 for GET method', async () => {
      const request = new NextRequest('http://localhost:3000/api/match-users', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBe(405);
    });
  });
});
