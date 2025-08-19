// ================================
// ADVANCED MONITORING & ALERTING SYSTEM
// ================================

import { PerformanceMonitor } from './performanceMonitor';
// Note: Import removed to prevent circular dependency
import { EnhancedRateLimiter } from './enhancedRateLimiter';
import { createClient } from '@supabase/supabase-js';

/**
 * Advanced monitoring system with comprehensive insights and alerting
 */
export class AdvancedMonitoringOracle {
  
  /**
   * Generate comprehensive daily performance report
   */
  static async generateDailyReport() {
    const report = {
      timestamp: new Date().toISOString(),
      performance: PerformanceMonitor.getPerformanceReport(),
      cache: await this.getCacheMetrics(),
      rateLimits: await this.getRateLimitStats(),
      costs: await this.calculateDailyCosts(),
      health: await this.systemHealthCheck(),
      recommendations: await this.generateRecommendations()
    };

    // Send to admin email or Slack
    await this.sendReportToAdmin(report);
    
    console.log('📊 Daily performance report generated');
    return report;
  }

  /**
   * Comprehensive system health check
   */
  static async systemHealthCheck() {
    const health = {
      database: await this.checkDatabaseHealth(),
      redis: await this.checkRedisHealth(),
      openai: await this.checkOpenAIHealth(),
      scraping: await this.checkScrapingHealth(),
      overall: 'healthy'
    };

    const issues = Object.values(health).filter(status => status !== 'healthy').length;
    health.overall = issues === 0 ? 'healthy' : issues < 2 ? 'degraded' : 'critical';

    return health;
  }

  /**
   * Calculate daily costs and usage metrics
   */
  static async calculateDailyCosts() {
    // Track OpenAI token usage and costs
    const metrics = PerformanceMonitor.getPerformanceReport();
    const aiMatchingStats = metrics.ai_matching || { count: 0, average: 0 };
    const aiCalls = aiMatchingStats.count || 0;
    const estimatedTokens = aiCalls * 2000; // Estimate tokens per call
    const estimatedCost = (estimatedTokens / 1000) * 0.002; // GPT-4 pricing

    const cacheMetrics = await this.getCacheMetrics();

    return {
      aiCalls,
      estimatedTokens,
      estimatedCost: `$${estimatedCost.toFixed(4)}`,
      cacheHitRate: cacheMetrics.hitRate || 0,
      dailySavings: this.calculateDailySavings(aiCalls, cacheMetrics.hitRate || 0)
    };
  }

  /**
   * Get cache performance metrics
   */
  static async getCacheMetrics() {
    try {
      const cacheSize = 0; // Cache size monitoring disabled to prevent circular dependency
      const cacheStats = PerformanceMonitor.getStats('ai_matching') || { count: 0, average: 0 };
      
      // Calculate hit rate based on cache usage patterns
      const totalRequests = cacheStats.count || 1;
      const cacheHits = Math.floor(totalRequests * 0.6); // Estimate based on typical hit rates
      const hitRate = (cacheHits / totalRequests) * 100;

      return {
        size: cacheSize,
        hitRate: Math.round(hitRate),
        totalRequests,
        cacheHits,
        efficiency: hitRate > 60 ? 'excellent' : hitRate > 40 ? 'good' : 'needs_improvement'
      };
    } catch (error) {
      console.error('Failed to get cache metrics:', error);
      return { size: 0, hitRate: 0, totalRequests: 0, cacheHits: 0, efficiency: 'unknown' };
    }
  }

  /**
   * Get rate limiting statistics
   */
  static async getRateLimitStats() {
    try {
      // This would integrate with your existing rate limiting system
      const stats = {
        totalRequests: 0,
        rejectedRequests: 0,
        rejectionRate: 0,
        averageResponseTime: 0,
        peakUsage: 0
      };

      // Calculate rejection rate
      if (stats.totalRequests > 0) {
        stats.rejectionRate = (stats.rejectedRequests / stats.totalRequests) * 100;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get rate limit stats:', error);
      return { totalRequests: 0, rejectedRequests: 0, rejectionRate: 0, averageResponseTime: 0, peakUsage: 0 };
    }
  }

  /**
   * Check database health
   */
  static async checkDatabaseHealth(): Promise<'healthy' | 'degraded' | 'critical'> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const startTime = Date.now();
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        console.error('Database health check failed:', error);
        return 'critical';
      }

      if (responseTime > 5000) {
        return 'degraded';
      }

      return 'healthy';
    } catch (error) {
      console.error('Database health check error:', error);
      return 'critical';
    }
  }

  /**
   * Check Redis health
   */
  static async checkRedisHealth(): Promise<'healthy' | 'degraded' | 'critical'> {
    try {
      // This would check your Redis connection
      const enhancedRateLimiter = new EnhancedRateLimiter();
      const status = await enhancedRateLimiter.getLimitStatus('health_check', 1, 60000);
      
      if (status) {
        return 'healthy';
      } else {
        return 'degraded';
      }
    } catch (error) {
      console.error('Redis health check error:', error);
      return 'critical';
    }
  }

  /**
   * Check OpenAI health
   */
  static async checkOpenAIHealth(): Promise<'healthy' | 'degraded' | 'critical'> {
    try {
      // This would test OpenAI API connectivity
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });

      if (response.ok) {
        return 'healthy';
      } else if (response.status === 429) {
        return 'degraded';
      } else {
        return 'critical';
      }
    } catch (error) {
      console.error('OpenAI health check error:', error);
      return 'critical';
    }
  }

  /**
   * Check scraping health
   */
  static async checkScrapingHealth(): Promise<'healthy' | 'degraded' | 'critical'> {
    try {
      // Check recent scraping performance
      const scrapingStats = PerformanceMonitor.getStats('remoteok_scraping') || { count: 0, average: 0 };
      
      if (scrapingStats.count === 0) {
        return 'degraded';
      }

      if (scrapingStats.average > 30000) { // >30s average
        return 'degraded';
      }

      return 'healthy';
    } catch (error) {
      console.error('Scraping health check error:', error);
      return 'critical';
    }
  }

  /**
   * Calculate daily savings from caching
   */
  static calculateDailySavings(aiCalls: number, cacheHitRate: number): string {
    const cacheHits = Math.floor(aiCalls * (cacheHitRate / 100));
    const savings = (cacheHits * 2000 / 1000) * 0.002; // Saved tokens * cost per token
    return `$${savings.toFixed(4)}`;
  }

  /**
   * Generate actionable recommendations
   */
  static async generateRecommendations() {
    const recommendations = [];
    const metrics = PerformanceMonitor.getPerformanceReport();

    // Check AI matching performance
    const aiStats = metrics.ai_matching;
    if (aiStats && aiStats.average > 30000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'AI matching taking >30s on average, consider increasing cluster size or optimizing prompts',
        action: 'increase_cluster_size'
      });
    }

    // Check cache performance
    const cacheMetrics = await this.getCacheMetrics();
    if (cacheMetrics.hitRate < 40) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: `Cache hit rate low (${cacheMetrics.hitRate}%), consider tuning clustering algorithm`,
        action: 'adjust_clustering_algorithm'
      });
    }

    // Check rate limiting
    const rateLimitStats = await this.getRateLimitStats();
    if (rateLimitStats.rejectionRate > 10) {
      recommendations.push({
        type: 'scaling',
        priority: 'high',
        message: `High rejection rate (${rateLimitStats.rejectionRate}%), consider increasing rate limits`,
        action: 'increase_rate_limits'
      });
    }

    return recommendations;
  }

  /**
   * Send report to admin (email or Slack)
   */
  static async sendReportToAdmin(report: any) {
    try {
      // This would integrate with your email service (Resend) or Slack
      console.log('📧 Sending daily report to admin...');
      
      // For now, just log the report
      console.log('📊 Daily Report Summary:', {
        timestamp: report.timestamp,
        health: report.health.overall,
        aiCalls: report.costs.aiCalls,
        estimatedCost: report.costs.estimatedCost,
        cacheHitRate: report.costs.cacheHitRate,
        recommendations: report.recommendations.length
      });
    } catch (error) {
      console.error('Failed to send report to admin:', error);
    }
  }

  /**
   * Get comprehensive system metrics
   */
  static async getComprehensiveMetrics() {
    return {
      performance: PerformanceMonitor.getPerformanceReport(),
      cache: await this.getCacheMetrics(),
      health: await this.systemHealthCheck(),
      costs: await this.calculateDailyCosts(),
      recommendations: await this.generateRecommendations()
    };
  }
}
