/**
 * 🚀 PRODUCTION MONITORING SYSTEM
 * 
 * Comprehensive monitoring, logging, and alerting for JobPing scrapers
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

interface ScrapingMetrics {
  runId: string;
  timestamp: string;
  platform: string;
  success: boolean;
  jobsFound: number;
  jobsInserted: number;
  jobsUpdated: number;
  errors: string[];
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
}

interface SystemHealth {
  timestamp: string;
  api: 'healthy' | 'degraded' | 'down';
  database: 'healthy' | 'degraded' | 'down';
  scrapers: 'healthy' | 'degraded' | 'down';
  totalJobs: number;
  activeJobs: number;
  recentJobs: number;
  errorRate: number;
}

class ProductionMonitor {
  private static instance: ProductionMonitor;
  private metrics: ScrapingMetrics[] = [];
  private logDir: string;
  private supabase: any;

  private constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDir();
    this.initializeSupabase();
  }

  static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private initializeSupabase(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Log scraping metrics
   */
  async logScrapingRun(metrics: ScrapingMetrics): Promise<void> {
    try {
      // Add to in-memory metrics
      this.metrics.push(metrics);
      
      // Keep only last 1000 entries in memory
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Write to file log
      await this.writeToLogFile('scraping.log', {
        timestamp: metrics.timestamp,
        level: metrics.success ? 'INFO' : 'ERROR',
        runId: metrics.runId,
        platform: metrics.platform,
        message: `Scraping ${metrics.success ? 'completed' : 'failed'}`,
        data: {
          jobsFound: metrics.jobsFound,
          jobsInserted: metrics.jobsInserted,
          jobsUpdated: metrics.jobsUpdated,
          duration: metrics.duration,
          errors: metrics.errors,
          memoryUsage: metrics.memoryUsage
        }
      });

      // Store in database if available
      if (this.supabase) {
        await this.supabase.from('scraping_logs').insert({
          run_id: metrics.runId,
          platform: metrics.platform,
          success: metrics.success,
          jobs_found: metrics.jobsFound,
          jobs_inserted: metrics.jobsInserted,
          jobs_updated: metrics.jobsUpdated,
          errors: metrics.errors,
          duration_ms: metrics.duration,
          memory_usage: metrics.memoryUsage,
          created_at: metrics.timestamp
        });
      }

      // Check for alerts
      await this.checkAlerts(metrics);

    } catch (error) {
      console.error('❌ Failed to log scraping metrics:', error);
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const timestamp = new Date().toISOString();
    
    try {
      // Check API health
      const apiHealth = await this.checkApiHealth();
      
      // Check database health
      const dbHealth = await this.checkDatabaseHealth();
      
      // Check scraper health
      const scraperHealth = await this.checkScraperHealth();
      
      // Get job statistics
      const jobStats = await this.getJobStatistics();
      
      // Calculate error rate
      const errorRate = await this.calculateErrorRate();

      return {
        timestamp,
        api: apiHealth,
        database: dbHealth,
        scrapers: scraperHealth,
        totalJobs: jobStats.totalJobs,
        activeJobs: jobStats.activeJobs,
        recentJobs: jobStats.recentJobs,
        errorRate
      };
    } catch (error) {
      console.error('❌ Failed to get system health:', error);
      return {
        timestamp,
        api: 'down',
        database: 'down',
        scrapers: 'down',
        totalJobs: 0,
        activeJobs: 0,
        recentJobs: 0,
        errorRate: 100
      };
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): any {
    const recentMetrics = this.metrics.slice(-100); // Last 100 runs
    
    if (recentMetrics.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        averageJobsPerRun: 0,
        totalRuns: 0
      };
    }

    const successfulRuns = recentMetrics.filter(m => m.success);
    const totalJobs = recentMetrics.reduce((sum, m) => sum + m.jobsFound, 0);
    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);

    return {
      averageDuration: Math.round(totalDuration / recentMetrics.length),
      successRate: Math.round((successfulRuns.length / recentMetrics.length) * 100),
      averageJobsPerRun: Math.round(totalJobs / recentMetrics.length),
      totalRuns: recentMetrics.length,
      memoryTrend: this.getMemoryTrend(recentMetrics)
    };
  }

  /**
   * Check for alerts and send notifications
   */
  private async checkAlerts(metrics: ScrapingMetrics): Promise<void> {
    const alerts = [];

    // High error rate alert
    const recentFailures = this.metrics.slice(-10).filter(m => !m.success).length;
    if (recentFailures >= 5) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `${recentFailures}/10 recent scraping runs failed`,
        severity: 'critical'
      });
    }

    // Low job discovery alert
    if (metrics.success && metrics.jobsFound === 0) {
      const recentZeroJobs = this.metrics.slice(-5).filter(m => m.success && m.jobsFound === 0).length;
      if (recentZeroJobs >= 3) {
        alerts.push({
          type: 'LOW_JOB_DISCOVERY',
          message: 'No jobs found in last 3 successful runs',
          severity: 'warning'
        });
      }
    }

    // High memory usage alert
    const memoryUsageMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 500) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        message: `Memory usage: ${memoryUsageMB.toFixed(1)}MB`,
        severity: 'warning'
      });
    }

    // Long duration alert
    if (metrics.duration > 60000) { // 60 seconds
      alerts.push({
        type: 'LONG_DURATION',
        message: `Scraping took ${(metrics.duration / 1000).toFixed(1)}s`,
        severity: 'warning'
      });
    }

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  private async checkApiHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:3002/api/health', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 200) {
        return 'healthy';
      } else {
        return 'degraded';
      }
    } catch (error) {
      return 'down';
    }
  }

  private async checkDatabaseHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    if (!this.supabase) return 'down';
    
    try {
      const { data, error } = await this.supabase
        .from('jobs')
        .select('id')
        .limit(1);
      
      if (error) {
        return 'degraded';
      }
      
      return 'healthy';
    } catch (error) {
      return 'down';
    }
  }

  private async checkScraperHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    const recentMetrics = this.metrics.slice(-10);
    
    if (recentMetrics.length === 0) {
      return 'down';
    }
    
    const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length;
    
    if (successRate >= 0.8) {
      return 'healthy';
    } else if (successRate >= 0.5) {
      return 'degraded';
    } else {
      return 'down';
    }
  }

  private async getJobStatistics(): Promise<{totalJobs: number, activeJobs: number, recentJobs: number}> {
    if (!this.supabase) {
      return { totalJobs: 0, activeJobs: 0, recentJobs: 0 };
    }
    
    try {
      // Total jobs
      const { count: totalJobs } = await this.supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });
      
      // Active jobs
      const { count: activeJobs } = await this.supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      // Recent jobs (last 24 hours)
      const { count: recentJobs } = await this.supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      return {
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        recentJobs: recentJobs || 0
      };
    } catch (error) {
      return { totalJobs: 0, activeJobs: 0, recentJobs: 0 };
    }
  }

  private async calculateErrorRate(): Promise<number> {
    const recentMetrics = this.metrics.slice(-50); // Last 50 runs
    
    if (recentMetrics.length === 0) {
      return 0;
    }
    
    const failures = recentMetrics.filter(m => !m.success).length;
    return Math.round((failures / recentMetrics.length) * 100);
  }

  private getMemoryTrend(metrics: ScrapingMetrics[]): string {
    if (metrics.length < 2) return 'stable';
    
    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private async writeToLogFile(filename: string, logEntry: any): Promise<void> {
    try {
      const logFile = path.join(this.logDir, filename);
      const logLine = JSON.stringify(logEntry) + '\n';
      
      fs.appendFileSync(logFile, logLine);
      
      // Rotate logs if file gets too large (>10MB)
      const stats = fs.statSync(logFile);
      if (stats.size > 10 * 1024 * 1024) {
        await this.rotateLogFile(logFile);
      }
    } catch (error) {
      console.error('❌ Failed to write to log file:', error);
    }
  }

  private async rotateLogFile(logFile: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveFile = logFile.replace('.log', `-${timestamp}.log`);
      
      fs.renameSync(logFile, archiveFile);
      
      // Compress archived log (optional)
      // You could add compression here if needed
    } catch (error) {
      console.error('❌ Failed to rotate log file:', error);
    }
  }

  private async sendAlert(alert: any): Promise<void> {
    try {
      // Log alert
      await this.writeToLogFile('alerts.log', {
        timestamp: new Date().toISOString(),
        level: 'ALERT',
        ...alert
      });

      // In production, you could send alerts to:
      // - Slack webhook
      // - Email
      // - SMS
      // - Discord
      // - PagerDuty
      
      console.log(`🚨 ALERT [${alert.severity}]: ${alert.message}`);
      
    } catch (error) {
      console.error('❌ Failed to send alert:', error);
    }
  }

  /**
   * Clean up old metrics and logs
   */
  async cleanup(): Promise<void> {
    try {
      // Remove metrics older than 24 hours
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      this.metrics = this.metrics.filter(m => 
        new Date(m.timestamp).getTime() > cutoff
      );

      // Clean up old log files (keep last 30 days)
      const logFiles = fs.readdirSync(this.logDir);
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      
      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('❌ Failed to cleanup:', error);
    }
  }
}

// Export singleton instance
export const productionMonitor = ProductionMonitor.getInstance();

// Export types
export type { ScrapingMetrics, SystemHealth };
