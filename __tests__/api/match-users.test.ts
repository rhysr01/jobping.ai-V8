/**
 * Tests for Match Users API Route
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/match-users/route';

// Mock dependencies
jest.mock('@/Utils/security/hmac', () => ({
  hmacVerify: jest.fn()
}));

jest.mock('@/lib/auth', () => ({
  withAuth: jest.fn((handler) => handler)
}));

jest.mock('@/Utils/productionRateLimiter', () => ({
  getProductionRateLimiter: jest.fn()
}));

jest.mock('@/Utils/supabase', () => ({
  getSupabaseClient: jest.fn()
}));

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn()
}));

jest.mock('@/Utils/matching/logging.service', () => ({
  logMatchSession: jest.fn()
}));

jest.mock('@/Utils/consolidatedMatching', () => ({
  createConsolidatedMatcher: jest.fn()
}));

jest.mock('@/services/user-matching.service', () => ({
  userMatchingService: {
    getActiveUsers: jest.fn(),
    saveMatches: jest.fn()
  }
}));

describe('Match Users API Route', () => {
  let mockRequest: NextRequest;
  let mockSupabaseClient: any;
  let mockRateLimiter: any;
  let mockMatcher: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      headers: {
        get: jest.fn()
      },
      json: jest.fn()
    } as any;

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    };

    mockRateLimiter = {
      middleware: jest.fn().mockResolvedValue(null)
    };

    mockMatcher = {
      performMatching: jest.fn()
    };

    require('@/Utils/security/hmac').hmacVerify.mockReturnValue(true);
    require('@/lib/auth').withAuth.mockImplementation((handler) => handler);
    require('@/Utils/productionRateLimiter').getProductionRateLimiter.mockReturnValue(mockRateLimiter);
    require('@/Utils/supabase').getSupabaseClient.mockReturnValue(mockSupabaseClient);
    require('@/Utils/consolidatedMatching').createConsolidatedMatcher.mockReturnValue(mockMatcher);
  });

  describe('POST /api/match-users', () => {
    it('should process match users request successfully', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          subscription_tier: 'free',
          career_path: ['tech'],
          target_cities: ['London'],
          work_environment: 'hybrid'
        }
      ];

      const mockJobs = [
        {
          id: 'job1',
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'London',
          categories: ['tech', 'early-career']
        }
      ];

      const mockMatches = [
        {
          user_email: 'user1@example.com',
          job_hash: 'job1',
          match_score: 85,
          match_reason: 'Great match'
        }
      ];

      mockRequest.json.mockResolvedValue({
        testMode: true,
        limit: 10
      });

      require('@/services/user-matching.service').userMatchingService.getActiveUsers.mockResolvedValue(mockUsers);
      mockSupabaseClient.limit.mockResolvedValue({ data: mockJobs, error: null });
      mockMatcher.performMatching.mockResolvedValue({
        matches: mockMatches,
        metrics: { processingTime: 1000 }
      });
      require('@/services/user-matching.service').userMatchingService.saveMatches.mockResolvedValue({ success: true });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.metrics).toBeDefined();
    });

    it('should handle no users found', async () => {
      mockRequest.json.mockResolvedValue({
        testMode: true,
        limit: 10
      });

      require('@/services/user-matching.service').userMatchingService.getActiveUsers.mockResolvedValue([]);

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('No active users found');
    });

    it('should handle database errors', async () => {
      mockRequest.json.mockResolvedValue({
        testMode: true,
        limit: 10
      });

      require('@/services/user-matching.service').userMatchingService.getActiveUsers.mockRejectedValue(new Error('Database error'));

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Database error');
    });

    it('should handle matching errors', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          subscription_tier: 'free',
          career_path: ['tech'],
          target_cities: ['London'],
          work_environment: 'hybrid'
        }
      ];

      mockRequest.json.mockResolvedValue({
        testMode: true,
        limit: 10
      });

      require('@/services/user-matching.service').userMatchingService.getActiveUsers.mockResolvedValue(mockUsers);
      mockSupabaseClient.limit.mockResolvedValue({ data: [], error: null });
      mockMatcher.performMatching.mockRejectedValue(new Error('Matching failed'));

      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Matching failed');
    });

    it('should handle rate limiting', async () => {
      mockRateLimiter.middleware.mockResolvedValue({
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limited' })
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(429);
    });

    it('should handle invalid request body', async () => {
      mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));

      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid JSON');
    });

    it('should process users in batches', async () => {
      const mockUsers = Array.from({ length: 60 }, (_, i) => ({
        id: `user${i}`,
        email: `user${i}@example.com`,
        subscription_tier: 'free',
        career_path: ['tech'],
        target_cities: ['London'],
        work_environment: 'hybrid'
      }));

      mockRequest.json.mockResolvedValue({
        testMode: false,
        limit: 50
      });

      require('@/services/user-matching.service').userMatchingService.getActiveUsers.mockResolvedValue(mockUsers);
      mockSupabaseClient.limit.mockResolvedValue({ data: [], error: null });
      mockMatcher.performMatching.mockResolvedValue({
        matches: [],
        metrics: { processingTime: 1000 }
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      // Should process users in batches of 50
      expect(mockMatcher.performMatching).toHaveBeenCalledTimes(2);
    });

    it('should handle test mode correctly', async () => {
      process.env.NODE_ENV = 'test';
      
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          subscription_tier: 'free',
          career_path: ['tech'],
          target_cities: ['London'],
          work_environment: 'hybrid'
        }
      ];

      mockRequest.json.mockResolvedValue({
        testMode: true,
        limit: 3
      });

      require('@/services/user-matching.service').userMatchingService.getActiveUsers.mockResolvedValue(mockUsers);
      mockSupabaseClient.limit.mockResolvedValue({ data: [], error: null });
      mockMatcher.performMatching.mockResolvedValue({
        matches: [],
        metrics: { processingTime: 1000 }
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      // Should use test limits (3 users, 300 jobs)
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(300);
    });

    it('should log match sessions', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          subscription_tier: 'free',
          career_path: ['tech'],
          target_cities: ['London'],
          work_environment: 'hybrid'
        }
      ];

      const mockMatches = [
        {
          user_email: 'user1@example.com',
          job_hash: 'job1',
          match_score: 85,
          match_reason: 'Great match'
        }
      ];

      mockRequest.json.mockResolvedValue({
        testMode: true,
        limit: 10
      });

      require('@/services/user-matching.service').userMatchingService.getActiveUsers.mockResolvedValue(mockUsers);
      mockSupabaseClient.limit.mockResolvedValue({ data: [], error: null });
      mockMatcher.performMatching.mockResolvedValue({
        matches: mockMatches,
        metrics: { processingTime: 1000 }
      });
      require('@/services/user-matching.service').userMatchingService.saveMatches.mockResolvedValue({ success: true });

      await POST(mockRequest);

      expect(require('@/Utils/matching/logging.service').logMatchSession).toHaveBeenCalled();
    });

    it('should handle Sentry error reporting', async () => {
      const error = new Error('Test error');
      mockRequest.json.mockRejectedValue(error);

      await POST(mockRequest);

      expect(require('@sentry/nextjs').captureException).toHaveBeenCalledWith(error);
    });
  });
});
