/**
 * Tests for Database Query Optimizer
 */

import { DatabaseQueryOptimizer, type QueryConfig, type OptimizedQueryResult } from '@/Utils/database/queryOptimizer';

describe('DatabaseQueryOptimizer', () => {
  let optimizer: DatabaseQueryOptimizer;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis()
    };

    optimizer = new DatabaseQueryOptimizer(mockSupabaseClient);
  });

  describe('constructor', () => {
    it('should initialize with Supabase client', () => {
      expect(optimizer).toBeDefined();
      expect(optimizer['supabase']).toBe(mockSupabaseClient);
    });

    it('should initialize empty query cache', () => {
      expect(optimizer['queryCache']).toBeDefined();
      expect(optimizer['queryCache'].size).toBe(0);
    });
  });

  describe('getOptimizedJobs', () => {
    it('should fetch jobs with default configuration', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', company: 'Tech Corp' },
        { id: '2', title: 'Data Analyst', company: 'Data Corp' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockJobs, 
        error: null,
        count: 2
      });

      const result = await optimizer.getOptimizedJobs();

      expect(result.data).toEqual(mockJobs);
      expect(result.count).toBe(2);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.cacheHit).toBe(false);
      expect(result.query).toBeDefined();
    });

    it('should fetch jobs with custom configuration', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', company: 'Tech Corp' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockJobs, 
        error: null,
        count: 1
      });

      const result = await optimizer.getOptimizedJobs({
        limit: 10,
        categories: ['tech'],
        locations: ['London'],
        excludeSent: true,
        useCache: false
      });

      expect(result.data).toEqual(mockJobs);
      expect(result.count).toBe(1);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs_norm');
    });

    it('should use cache when enabled', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', company: 'Tech Corp' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockJobs, 
        error: null,
        count: 1
      });

      // First call - should cache
      await optimizer.getOptimizedJobs({ useCache: true });
      
      // Second call - should use cache
      const result = await optimizer.getOptimizedJobs({ useCache: true });

      expect(result.cacheHit).toBe(true);
      expect(mockSupabaseClient.range).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.range.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' }
      });

      const result = await optimizer.getOptimizedJobs();

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('getOptimizedUsers', () => {
    it('should fetch users with default configuration', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', subscription_tier: 'free' },
        { id: '2', email: 'user2@example.com', subscription_tier: 'premium' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockUsers, 
        error: null,
        count: 2
      });

      const result = await optimizer.getOptimizedUsers();

      expect(result.data).toEqual(mockUsers);
      expect(result.count).toBe(2);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
    });

    it('should fetch users with custom filters', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', subscription_tier: 'premium' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockUsers, 
        error: null,
        count: 1
      });

      const result = await optimizer.getOptimizedUsers({
        subscriptionTier: 'premium',
        limit: 5,
        useCache: false
      });

      expect(result.data).toEqual(mockUsers);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('subscription_tier', 'premium');
    });
  });

  describe('getOptimizedMatches', () => {
    it('should fetch matches with default configuration', async () => {
      const mockMatches = [
        { id: '1', user_email: 'user1@example.com', job_hash: 'job1', match_score: 85 },
        { id: '2', user_email: 'user2@example.com', job_hash: 'job2', match_score: 90 }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockMatches, 
        error: null,
        count: 2
      });

      const result = await optimizer.getOptimizedMatches();

      expect(result.data).toEqual(mockMatches);
      expect(result.count).toBe(2);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('job_matches');
    });

    it('should fetch matches with custom filters', async () => {
      const mockMatches = [
        { id: '1', user_email: 'user1@example.com', job_hash: 'job1', match_score: 85 }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockMatches, 
        error: null,
        count: 1
      });

      const result = await optimizer.getOptimizedMatches({
        userEmail: 'user1@example.com',
        minScore: 80,
        limit: 10,
        useCache: false
      });

      expect(result.data).toEqual(mockMatches);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_email', 'user1@example.com');
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('match_score', 80);
    });
  });

  describe('cache management', () => {
    it('should generate cache keys correctly', () => {
      const key1 = optimizer['generateCacheKey']('jobs', { limit: 10, categories: ['tech'] });
      const key2 = optimizer['generateCacheKey']('jobs', { limit: 10, categories: ['tech'] });
      const key3 = optimizer['generateCacheKey']('jobs', { limit: 20, categories: ['tech'] });

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it('should clear expired cache entries', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', company: 'Tech Corp' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockJobs, 
        error: null,
        count: 1
      });

      // Add expired cache entry
      const expiredKey = 'expired-key';
      optimizer['queryCache'].set(expiredKey, {
        data: mockJobs,
        timestamp: Date.now() - 10000,
        ttl: 5000
      });

      await optimizer.getOptimizedJobs({ useCache: true });

      expect(optimizer['queryCache'].has(expiredKey)).toBe(false);
    });

    it('should clear all cache entries', () => {
      optimizer['queryCache'].set('key1', { data: [], timestamp: Date.now(), ttl: 1000 });
      optimizer['queryCache'].set('key2', { data: [], timestamp: Date.now(), ttl: 1000 });

      optimizer.clearCache();

      expect(optimizer['queryCache'].size).toBe(0);
    });
  });

  describe('query optimization', () => {
    it('should apply proper indexing hints', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', company: 'Tech Corp' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockJobs, 
        error: null,
        count: 1
      });

      await optimizer.getOptimizedJobs({
        categories: ['tech'],
        locations: ['London']
      });

      expect(mockSupabaseClient.in).toHaveBeenCalledWith('categories', ['tech']);
      expect(mockSupabaseClient.in).toHaveBeenCalledWith('location', ['London']);
    });

    it('should apply proper ordering', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', company: 'Tech Corp' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockJobs, 
        error: null,
        count: 1
      });

      await optimizer.getOptimizedJobs();

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should apply proper pagination', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', company: 'Tech Corp' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockJobs, 
        error: null,
        count: 1
      });

      await optimizer.getOptimizedJobs({ limit: 10 });

      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 9);
    });
  });

  describe('performance monitoring', () => {
    it('should track execution time', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', company: 'Tech Corp' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockJobs, 
        error: null,
        count: 1
      });

      const result = await optimizer.getOptimizedJobs();

      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should track cache hit rate', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', company: 'Tech Corp' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockJobs, 
        error: null,
        count: 1
      });

      // First call - cache miss
      await optimizer.getOptimizedJobs({ useCache: true });
      
      // Second call - cache hit
      const result = await optimizer.getOptimizedJobs({ useCache: true });

      expect(result.cacheHit).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle Supabase client errors', async () => {
      mockSupabaseClient.range.mockRejectedValue(new Error('Connection failed'));

      const result = await optimizer.getOptimizedJobs();

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should handle malformed query results', async () => {
      mockSupabaseClient.range.mockResolvedValue({ 
        data: null, 
        error: null,
        count: null
      });

      const result = await optimizer.getOptimizedJobs();

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty result sets', async () => {
      mockSupabaseClient.range.mockResolvedValue({ 
        data: [], 
        error: null,
        count: 0
      });

      const result = await optimizer.getOptimizedJobs();

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should handle very large result sets', async () => {
      const largeJobs = Array.from({ length: 1000 }, (_, i) => ({
        id: `job${i}`,
        title: `Job ${i}`,
        company: `Company ${i}`
      }));

      mockSupabaseClient.range.mockResolvedValue({ 
        data: largeJobs, 
        error: null,
        count: 1000
      });

      const result = await optimizer.getOptimizedJobs({ limit: 1000 });

      expect(result.data).toHaveLength(1000);
      expect(result.count).toBe(1000);
    });

    it('should handle concurrent cache access', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', company: 'Tech Corp' }
      ];

      mockSupabaseClient.range.mockResolvedValue({ 
        data: mockJobs, 
        error: null,
        count: 1
      });

      // Simulate concurrent access
      const promises = [
        optimizer.getOptimizedJobs({ useCache: true }),
        optimizer.getOptimizedJobs({ useCache: true }),
        optimizer.getOptimizedJobs({ useCache: true })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.data).toEqual(mockJobs);
      });
    });
  });
});
