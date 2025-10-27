/**
 * Tests for Database Query Optimizer
 */

import { QueryOptimizer, type QueryCache, type OptimizedJobQuery } from '@/Utils/performance/queryOptimizer';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('QueryOptimizer', () => {
  let optimizer: QueryOptimizer;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabaseClient);
    optimizer = new QueryOptimizer();
  });

  describe('getJobsForMatching', () => {
    it('should fetch jobs with basic query', async () => {
      const mockJobs = [
        { id: 1, title: 'Software Engineer', company: 'Tech Corp', location: 'London' },
        { id: 2, title: 'Data Scientist', company: 'Data Inc', location: 'Berlin' }
      ];

      mockSupabaseClient.limit.mockResolvedValue({ data: mockJobs, error: null });

      const query: OptimizedJobQuery = {
        select: ['id', 'title', 'company', 'location'],
        filters: {
          isActive: true
        },
        orderBy: {
          field: 'created_at',
          ascending: false
        },
        limit: 10
      };

      const result = await optimizer.getJobsForMatching(query);

      expect(result).toEqual(mockJobs);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id,title,company,location');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(10);
    });

    it('should apply multiple filters', async () => {
      const mockJobs = [{ id: 1, title: 'Software Engineer', company: 'Tech Corp' }];

      mockSupabaseClient.limit.mockResolvedValue({ data: mockJobs, error: null });

      const query: OptimizedJobQuery = {
        select: ['id', 'title', 'company'],
        filters: {
          isActive: true,
          isSent: false,
          source: ['mantiks', 'reed']
        },
        orderBy: {
          field: 'created_at',
          ascending: false
        }
      };

      await optimizer.getJobsForMatching(query);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_sent', false);
      expect(mockSupabaseClient.in).toHaveBeenCalledWith('source', ['mantiks', 'reed']);
    });

    it('should apply date range filter', async () => {
      const mockJobs = [{ id: 1, title: 'Software Engineer' }];

      mockSupabaseClient.limit.mockResolvedValue({ data: mockJobs, error: null });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const query: OptimizedJobQuery = {
        select: ['id', 'title'],
        filters: {
          dateRange: {
            field: 'created_at',
            start: startDate,
            end: endDate
          }
        },
        orderBy: {
          field: 'created_at',
          ascending: false
        }
      };

      await optimizer.getJobsForMatching(query);

      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('created_at', startDate.toISOString());
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('created_at', endDate.toISOString());
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.limit.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const query: OptimizedJobQuery = {
        select: ['id', 'title'],
        filters: {},
        orderBy: {
          field: 'created_at',
          ascending: false
        }
      };

      await expect(optimizer.getJobsForMatching(query)).rejects.toThrow('Database error');
    });

    it('should return empty array when no data', async () => {
      mockSupabaseClient.limit.mockResolvedValue({ data: [], error: null });

      const query: OptimizedJobQuery = {
        select: ['id', 'title'],
        filters: {},
        orderBy: {
          field: 'created_at',
          ascending: false
        }
      };

      const result = await optimizer.getJobsForMatching(query);

      expect(result).toEqual([]);
    });
  });

  describe('getCachedQuery', () => {
    it('should return cached data when available', async () => {
      const cacheKey = 'test-query';
      const cachedData = [{ id: 1, title: 'Cached Job' }];
      
      // Manually set cache
      (optimizer as any).cache[cacheKey] = {
        data: cachedData,
        timestamp: Date.now(),
        ttl: 300000 // 5 minutes
      };

      const result = await optimizer.getCachedQuery(cacheKey);

      expect(result).toEqual(cachedData);
    });

    it('should return null when cache is expired', async () => {
      const cacheKey = 'expired-query';
      const expiredData = [{ id: 1, title: 'Expired Job' }];
      
      // Set expired cache
      (optimizer as any).cache[cacheKey] = {
        data: expiredData,
        timestamp: Date.now() - 600000, // 10 minutes ago
        ttl: 300000 // 5 minutes TTL
      };

      const result = await optimizer.getCachedQuery(cacheKey);

      expect(result).toBeNull();
    });

    it('should return null when cache key does not exist', async () => {
      const result = await optimizer.getCachedQuery('non-existent-key');

      expect(result).toBeNull();
    });
  });

  describe('setCachedQuery', () => {
    it('should cache query data', async () => {
      const cacheKey = 'test-query';
      const data = [{ id: 1, title: 'Test Job' }];

      await optimizer.setCachedQuery(cacheKey, data);

      const cached = (optimizer as any).cache[cacheKey];
      expect(cached.data).toEqual(data);
      expect(cached.timestamp).toBeDefined();
      expect(cached.ttl).toBeDefined();
    });

    it('should use custom TTL', async () => {
      const cacheKey = 'test-query';
      const data = [{ id: 1, title: 'Test Job' }];
      const customTTL = 600000; // 10 minutes

      await optimizer.setCachedQuery(cacheKey, data, customTTL);

      const cached = (optimizer as any).cache[cacheKey];
      expect(cached.ttl).toBe(customTTL);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      // Set some cache data
      (optimizer as any).cache['key1'] = { data: [], timestamp: Date.now(), ttl: 300000 };
      (optimizer as any).cache['key2'] = { data: [], timestamp: Date.now(), ttl: 300000 };

      await optimizer.clearCache();

      expect(Object.keys((optimizer as any).cache)).toHaveLength(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      // Set some cache data
      (optimizer as any).cache['key1'] = { data: [], timestamp: Date.now(), ttl: 300000 };
      (optimizer as any).cache['key2'] = { data: [], timestamp: Date.now(), ttl: 300000 };

      const stats = await optimizer.getCacheStats();

      expect(stats.totalKeys).toBe(2);
      expect(stats.hitRate).toBeDefined();
      expect(stats.memoryUsage).toBeDefined();
    });

    it('should return zero stats for empty cache', async () => {
      const stats = await optimizer.getCacheStats();

      expect(stats.totalKeys).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.memoryUsage).toBe(0);
    });
  });

  describe('optimizeQuery', () => {
    it('should optimize query structure', async () => {
      const query: OptimizedJobQuery = {
        select: ['id', 'title', 'company', 'location'],
        filters: {
          isActive: true,
          source: ['mantiks']
        },
        orderBy: {
          field: 'created_at',
          ascending: false
        },
        limit: 100
      };

      const optimized = optimizer.optimizeQuery(query);

      expect(optimized.select).toEqual(['id', 'title', 'company', 'location']);
      expect(optimized.filters).toEqual({
        isActive: true,
        source: ['mantiks']
      });
      expect(optimized.orderBy).toEqual({
        field: 'created_at',
        ascending: false
      });
      expect(optimized.limit).toBe(100);
    });

    it('should add default values for missing fields', async () => {
      const query: OptimizedJobQuery = {
        select: ['id', 'title'],
        filters: {},
        orderBy: {
          field: 'created_at',
          ascending: false
        }
      };

      const optimized = optimizer.optimizeQuery(query);

      expect(optimized.select).toEqual(['id', 'title']);
      expect(optimized.filters).toEqual({});
      expect(optimized.orderBy).toEqual({
        field: 'created_at',
        ascending: false
      });
      expect(optimized.limit).toBeUndefined();
    });
  });

  describe('batchQueries', () => {
    it('should execute multiple queries in batch', async () => {
      const mockJobs1 = [{ id: 1, title: 'Job 1' }];
      const mockJobs2 = [{ id: 2, title: 'Job 2' }];

      mockSupabaseClient.limit
        .mockResolvedValueOnce({ data: mockJobs1, error: null })
        .mockResolvedValueOnce({ data: mockJobs2, error: null });

      const queries = [
        {
          select: ['id', 'title'],
          filters: { isActive: true },
          orderBy: { field: 'created_at', ascending: false }
        },
        {
          select: ['id', 'title'],
          filters: { isActive: false },
          orderBy: { field: 'created_at', ascending: false }
        }
      ];

      const results = await optimizer.batchQueries(queries);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockJobs1);
      expect(results[1]).toEqual(mockJobs2);
    });

    it('should handle partial failures in batch', async () => {
      const mockJobs1 = [{ id: 1, title: 'Job 1' }];

      mockSupabaseClient.limit
        .mockResolvedValueOnce({ data: mockJobs1, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

      const queries = [
        {
          select: ['id', 'title'],
          filters: { isActive: true },
          orderBy: { field: 'created_at', ascending: false }
        },
        {
          select: ['id', 'title'],
          filters: { isActive: false },
          orderBy: { field: 'created_at', ascending: false }
        }
      ];

      await expect(optimizer.batchQueries(queries)).rejects.toThrow('Database error');
    });
  });

  describe('edge cases', () => {
    it('should handle missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => new QueryOptimizer()).toThrow();
    });

    it('should handle very large result sets', async () => {
      const largeJobArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        title: `Job ${i}`,
        company: `Company ${i}`
      }));

      mockSupabaseClient.limit.mockResolvedValue({ data: largeJobArray, error: null });

      const query: OptimizedJobQuery = {
        select: ['id', 'title', 'company'],
        filters: {},
        orderBy: {
          field: 'created_at',
          ascending: false
        }
      };

      const result = await optimizer.getJobsForMatching(query);

      expect(result).toHaveLength(10000);
    });

    it('should handle concurrent cache operations', async () => {
      const cacheKey = 'concurrent-test';
      const data = [{ id: 1, title: 'Concurrent Job' }];

      const promises = [
        optimizer.setCachedQuery(cacheKey, data),
        optimizer.getCachedQuery(cacheKey),
        optimizer.setCachedQuery(cacheKey, data)
      ];

      await Promise.all(promises);

      const cached = (optimizer as any).cache[cacheKey];
      expect(cached.data).toEqual(data);
    });
  });
});