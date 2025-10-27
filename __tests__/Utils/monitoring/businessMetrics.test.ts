/**
 * Tests for Business Metrics and Monitoring System
 */

import { BusinessMetricsCollector, type BusinessMetrics, type MetricTrend } from '@/Utils/monitoring/businessMetrics';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn()
}));

describe('BusinessMetricsCollector', () => {
  let collector: BusinessMetricsCollector;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabaseClient);
    collector = new BusinessMetricsCollector();
  });

  describe('collectUserMetrics', () => {
    it('should collect user metrics', async () => {
      const mockUserData = {
        total_users: 1000,
        active_users: 800,
        new_users: 50,
        retention_rate: 0.85,
        satisfaction_score: 4.2
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockUserData, error: null });

      const metrics = await collector.collectUserMetrics();

      expect(metrics.totalUsers).toBe(1000);
      expect(metrics.activeUsers).toBe(800);
      expect(metrics.newUsers).toBe(50);
      expect(metrics.userRetentionRate).toBe(0.85);
      expect(metrics.userSatisfactionScore).toBe(4.2);
    });

    it('should handle missing user data', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const metrics = await collector.collectUserMetrics();

      expect(metrics.totalUsers).toBe(0);
      expect(metrics.activeUsers).toBe(0);
      expect(metrics.newUsers).toBe(0);
      expect(metrics.userRetentionRate).toBe(0);
      expect(metrics.userSatisfactionScore).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const metrics = await collector.collectUserMetrics();

      expect(metrics.totalUsers).toBe(0);
      expect(metrics.activeUsers).toBe(0);
      expect(metrics.newUsers).toBe(0);
      expect(metrics.userRetentionRate).toBe(0);
      expect(metrics.userSatisfactionScore).toBe(0);
    });
  });

  describe('collectJobMetrics', () => {
    it('should collect job metrics', async () => {
      const mockJobData = {
        total_jobs: 5000,
        new_jobs: 200,
        matched_jobs: 1500,
        freshness_score: 0.75
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockJobData, error: null });

      const metrics = await collector.collectJobMetrics();

      expect(metrics.totalJobs).toBe(5000);
      expect(metrics.newJobs).toBe(200);
      expect(metrics.matchedJobs).toBe(1500);
      expect(metrics.jobFreshnessScore).toBe(0.75);
    });

    it('should handle missing job data', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const metrics = await collector.collectJobMetrics();

      expect(metrics.totalJobs).toBe(0);
      expect(metrics.newJobs).toBe(0);
      expect(metrics.matchedJobs).toBe(0);
      expect(metrics.jobFreshnessScore).toBe(0);
    });
  });

  describe('collectMatchingMetrics', () => {
    it('should collect matching metrics', async () => {
      const mockMatchingData = {
        total_matches: 3000,
        ai_matches: 2000,
        rule_based_matches: 1000,
        average_match_score: 78.5,
        match_success_rate: 0.85
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockMatchingData, error: null });

      const metrics = await collector.collectMatchingMetrics();

      expect(metrics.totalMatches).toBe(3000);
      expect(metrics.aiMatches).toBe(2000);
      expect(metrics.ruleBasedMatches).toBe(1000);
      expect(metrics.averageMatchScore).toBe(78.5);
      expect(metrics.matchSuccessRate).toBe(0.85);
    });

    it('should handle missing matching data', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const metrics = await collector.collectMatchingMetrics();

      expect(metrics.totalMatches).toBe(0);
      expect(metrics.aiMatches).toBe(0);
      expect(metrics.ruleBasedMatches).toBe(0);
      expect(metrics.averageMatchScore).toBe(0);
      expect(metrics.matchSuccessRate).toBe(0);
    });
  });

  describe('collectPerformanceMetrics', () => {
    it('should collect performance metrics', async () => {
      const mockPerformanceData = {
        average_latency: 250,
        cache_hit_rate: 0.75,
        error_rate: 0.02,
        system_uptime: 0.99
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockPerformanceData, error: null });

      const metrics = await collector.collectPerformanceMetrics();

      expect(metrics.averageLatency).toBe(250);
      expect(metrics.cacheHitRate).toBe(0.75);
      expect(metrics.errorRate).toBe(0.02);
      expect(metrics.systemUptime).toBe(0.99);
    });

    it('should handle missing performance data', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const metrics = await collector.collectPerformanceMetrics();

      expect(metrics.averageLatency).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.systemUptime).toBe(0);
    });
  });

  describe('collectRevenueMetrics', () => {
    it('should collect revenue metrics', async () => {
      const mockRevenueData = {
        monthly_revenue: 50000,
        total_subscribers: 500,
        conversion_rate: 0.15,
        churn_rate: 0.05
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockRevenueData, error: null });

      const metrics = await collector.collectRevenueMetrics();

      expect(metrics.monthlyRevenue).toBe(50000);
      expect(metrics.totalSubscribers).toBe(500);
      expect(metrics.conversionRate).toBe(0.15);
      expect(metrics.churnRate).toBe(0.05);
    });

    it('should handle missing revenue data', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const metrics = await collector.collectRevenueMetrics();

      expect(metrics.monthlyRevenue).toBe(0);
      expect(metrics.totalSubscribers).toBe(0);
      expect(metrics.conversionRate).toBe(0);
      expect(metrics.churnRate).toBe(0);
    });
  });

  describe('collectCostMetrics', () => {
    it('should collect cost metrics', async () => {
      const mockCostData = {
        ai_cost_per_match: 0.05,
        total_ai_cost: 1500,
        infrastructure_cost: 2000,
        cost_per_user: 3.5
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockCostData, error: null });

      const metrics = await collector.collectCostMetrics();

      expect(metrics.aiCostPerMatch).toBe(0.05);
      expect(metrics.totalAICost).toBe(1500);
      expect(metrics.infrastructureCost).toBe(2000);
      expect(metrics.costPerUser).toBe(3.5);
    });

    it('should handle missing cost data', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const metrics = await collector.collectCostMetrics();

      expect(metrics.aiCostPerMatch).toBe(0);
      expect(metrics.totalAICost).toBe(0);
      expect(metrics.infrastructureCost).toBe(0);
      expect(metrics.costPerUser).toBe(0);
    });
  });

  describe('collectAllMetrics', () => {
    it('should collect all metrics', async () => {
      const mockUserData = { total_users: 1000, active_users: 800, new_users: 50, retention_rate: 0.85, satisfaction_score: 4.2 };
      const mockJobData = { total_jobs: 5000, new_jobs: 200, matched_jobs: 1500, freshness_score: 0.75 };
      const mockMatchingData = { total_matches: 3000, ai_matches: 2000, rule_based_matches: 1000, average_match_score: 78.5, match_success_rate: 0.85 };
      const mockPerformanceData = { average_latency: 250, cache_hit_rate: 0.75, error_rate: 0.02, system_uptime: 0.99 };
      const mockRevenueData = { monthly_revenue: 50000, total_subscribers: 500, conversion_rate: 0.15, churn_rate: 0.05 };
      const mockCostData = { ai_cost_per_match: 0.05, total_ai_cost: 1500, infrastructure_cost: 2000, cost_per_user: 3.5 };

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockUserData, error: null })
        .mockResolvedValueOnce({ data: mockJobData, error: null })
        .mockResolvedValueOnce({ data: mockMatchingData, error: null })
        .mockResolvedValueOnce({ data: mockPerformanceData, error: null })
        .mockResolvedValueOnce({ data: mockRevenueData, error: null })
        .mockResolvedValueOnce({ data: mockCostData, error: null });

      const metrics = await collector.collectAllMetrics();

      expect(metrics.totalUsers).toBe(1000);
      expect(metrics.totalJobs).toBe(5000);
      expect(metrics.totalMatches).toBe(3000);
      expect(metrics.averageLatency).toBe(250);
      expect(metrics.monthlyRevenue).toBe(50000);
      expect(metrics.aiCostPerMatch).toBe(0.05);
    });

    it('should handle partial failures', async () => {
      const mockUserData = { total_users: 1000, active_users: 800, new_users: 50, retention_rate: 0.85, satisfaction_score: 4.2 };
      const mockJobData = { total_jobs: 5000, new_jobs: 200, matched_jobs: 1500, freshness_score: 0.75 };

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockUserData, error: null })
        .mockResolvedValueOnce({ data: mockJobData, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Database error' } })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const metrics = await collector.collectAllMetrics();

      expect(metrics.totalUsers).toBe(1000);
      expect(metrics.totalJobs).toBe(5000);
      expect(metrics.totalMatches).toBe(0);
      expect(metrics.averageLatency).toBe(0);
      expect(metrics.monthlyRevenue).toBe(0);
      expect(metrics.aiCostPerMatch).toBe(0);
    });
  });

  describe('getMetricTrends', () => {
    it('should calculate metric trends', async () => {
      const mockTrendData = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 110 },
        { date: '2024-01-03', value: 120 }
      ];

      mockSupabaseClient.limit.mockResolvedValue({ data: mockTrendData, error: null });

      const trends = await collector.getMetricTrends('total_users', 7);

      expect(trends).toHaveLength(3);
      expect(trends[0].value).toBe(100);
      expect(trends[1].value).toBe(110);
      expect(trends[2].value).toBe(120);
    });

    it('should handle missing trend data', async () => {
      mockSupabaseClient.limit.mockResolvedValue({ data: null, error: null });

      const trends = await collector.getMetricTrends('total_users', 7);

      expect(trends).toEqual([]);
    });
  });

  describe('generateReport', () => {
    it('should generate business report', async () => {
      const mockMetrics: BusinessMetrics = {
        totalUsers: 1000,
        activeUsers: 800,
        newUsers: 50,
        userRetentionRate: 0.85,
        userSatisfactionScore: 4.2,
        totalJobs: 5000,
        newJobs: 200,
        matchedJobs: 1500,
        jobFreshnessScore: 0.75,
        totalMatches: 3000,
        aiMatches: 2000,
        ruleBasedMatches: 1000,
        averageMatchScore: 78.5,
        matchSuccessRate: 0.85,
        averageLatency: 250,
        cacheHitRate: 0.75,
        errorRate: 0.02,
        systemUptime: 0.99,
        monthlyRevenue: 50000,
        totalSubscribers: 500,
        conversionRate: 0.15,
        churnRate: 0.05,
        aiCostPerMatch: 0.05,
        totalAICost: 1500,
        infrastructureCost: 2000,
        costPerUser: 3.5
      };

      const report = collector.generateReport(mockMetrics);

      expect(report.summary).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.alerts).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });

    it('should identify performance issues', async () => {
      const mockMetrics: BusinessMetrics = {
        totalUsers: 1000,
        activeUsers: 800,
        newUsers: 50,
        userRetentionRate: 0.85,
        userSatisfactionScore: 4.2,
        totalJobs: 5000,
        newJobs: 200,
        matchedJobs: 1500,
        jobFreshnessScore: 0.75,
        totalMatches: 3000,
        aiMatches: 2000,
        ruleBasedMatches: 1000,
        averageMatchScore: 78.5,
        matchSuccessRate: 0.85,
        averageLatency: 2000, // High latency
        cacheHitRate: 0.25, // Low cache hit rate
        errorRate: 0.15, // High error rate
        systemUptime: 0.85, // Low uptime
        monthlyRevenue: 50000,
        totalSubscribers: 500,
        conversionRate: 0.15,
        churnRate: 0.05,
        aiCostPerMatch: 0.05,
        totalAICost: 1500,
        infrastructureCost: 2000,
        costPerUser: 3.5
      };

      const report = collector.generateReport(mockMetrics);

      expect(report.alerts).toContain('High error rate detected');
      expect(report.alerts).toContain('Low system uptime');
      expect(report.recommendations).toContain('Investigate error sources');
    });
  });

  describe('edge cases', () => {
    it('should handle missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => new BusinessMetricsCollector()).toThrow();
    });

    it('should handle concurrent metric collection', async () => {
      const mockUserData = { total_users: 1000, active_users: 800, new_users: 50, retention_rate: 0.85, satisfaction_score: 4.2 };
      mockSupabaseClient.single.mockResolvedValue({ data: mockUserData, error: null });

      const promises = [
        collector.collectUserMetrics(),
        collector.collectUserMetrics(),
        collector.collectUserMetrics()
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.totalUsers).toBe(1000);
      });
    });

    it('should handle very large metric values', async () => {
      const mockUserData = {
        total_users: 1000000,
        active_users: 800000,
        new_users: 50000,
        retention_rate: 0.95,
        satisfaction_score: 4.9
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockUserData, error: null });

      const metrics = await collector.collectUserMetrics();

      expect(metrics.totalUsers).toBe(1000000);
      expect(metrics.activeUsers).toBe(800000);
      expect(metrics.newUsers).toBe(50000);
      expect(metrics.userRetentionRate).toBe(0.95);
      expect(metrics.userSatisfactionScore).toBe(4.9);
    });
  });
});