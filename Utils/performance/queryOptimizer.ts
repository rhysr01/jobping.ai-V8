/**
 * Database Query Optimizer
 * Provides optimized query patterns and caching for common operations
 */

import { createClient } from '@supabase/supabase-js';

export interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

export interface OptimizedJobQuery {
  select: string[];
  filters: {
    isActive?: boolean;
    isSent?: boolean;
    source?: string[];
    dateRange?: {
      field: string;
      start: Date;
      end?: Date;
    };
  };
  orderBy: {
    field: string;
    ascending?: boolean;
  };
  limit?: number;
}

export class QueryOptimizer {
  private supabase: any;
  private cache: QueryCache = {};
  private defaultCacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Optimized job fetching with caching and efficient queries
   */
  async getJobsForMatching(query: OptimizedJobQuery): Promise<any[]> {
    const cacheKey = this.generateCacheKey('jobs_matching', query);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Cache hit for jobs matching query');
      return cached;
    }

    const startTime = Date.now();
    
    try {
      let queryBuilder = this.supabase
        .from('jobs')
        .select(query.select.join(', '));

      // Apply filters efficiently
      if (query.filters.isActive !== undefined) {
        queryBuilder = queryBuilder.eq('is_active', query.filters.isActive);
      }

      if (query.filters.isSent !== undefined) {
        queryBuilder = queryBuilder.eq('is_sent', query.filters.isSent);
      }


      if (query.filters.source && query.filters.source.length > 0) {
        queryBuilder = queryBuilder.in('source', query.filters.source);
      }

      if (query.filters.dateRange) {
        const { field, start, end } = query.filters.dateRange;
        queryBuilder = queryBuilder.gte(field, start.toISOString());
        if (end) {
          queryBuilder = queryBuilder.lte(field, end.toISOString());
        }
      }

      // Apply ordering
      queryBuilder = queryBuilder.order(query.orderBy.field, { 
        ascending: query.orderBy.ascending ?? false 
      });

      // Apply limit
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      const duration = Date.now() - startTime;
      console.log(`📊 Jobs query completed in ${duration}ms, returned ${data?.length || 0} jobs`);

      // Cache the result
      this.setCache(cacheKey, data || []);

      return data || [];

    } catch (error) {
      console.error('❌ Optimized job query failed:', error);
      throw error;
    }
  }

  /**
   * Optimized user fetching with minimal data
   */
  async getUsersForMatching(userEmails: string[]): Promise<any[]> {
    const cacheKey = this.generateCacheKey('users_matching', { emails: userEmails });
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Cache hit for users matching query');
      return cached;
    }

    const startTime = Date.now();

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, email, active, career_path, target_cities, languages_spoken, company_types, roles_selected, professional_expertise, entry_level_preference, work_environment, start_date')
        .in('email', userEmails)
        .eq('active', true);

      if (error) {
        throw new Error(`User query failed: ${error.message}`);
      }

      const duration = Date.now() - startTime;
      console.log(`📊 Users query completed in ${duration}ms, returned ${data?.length || 0} users`);

      // Cache for 2 minutes (users change less frequently)
      this.setCache(cacheKey, data || [], 2 * 60 * 1000);

      return data || [];

    } catch (error) {
      console.error('❌ Optimized user query failed:', error);
      throw error;
    }
  }

  /**
   * Batch job updates to reduce database round trips
   */
  async batchUpdateJobs(jobUpdates: Array<{ id: string; updates: any }>): Promise<void> {
    if (jobUpdates.length === 0) return;

    const startTime = Date.now();
    console.log(`🔄 Batch updating ${jobUpdates.length} jobs...`);

    // Process in chunks to avoid query size limits
    const chunkSize = 100;
    const chunks = [];
    
    for (let i = 0; i < jobUpdates.length; i += chunkSize) {
      chunks.push(jobUpdates.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      try {
        // Use upsert for batch updates
        const upsertData = chunk.map(({ id, updates }) => ({
          id,
          ...updates,
          updated_at: new Date().toISOString()
        }));

        const { error } = await this.supabase
          .from('jobs')
          .upsert(upsertData);

        if (error) {
          throw new Error(`Batch update failed: ${error.message}`);
        }

      } catch (error) {
        console.error('❌ Batch update chunk failed:', error);
        // Continue with other chunks
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Batch update completed in ${duration}ms`);

    // Clear related caches
    this.clearCachePattern('jobs_matching');
  }

  /**
   * Optimized match insertion with conflict handling
   */
  async batchInsertMatches(matches: any[]): Promise<void> {
    if (matches.length === 0) return;

    const startTime = Date.now();
    console.log(`🔄 Batch inserting ${matches.length} matches...`);

    try {
      const { error } = await this.supabase
        .from('matches')
        .upsert(matches, { 
          onConflict: 'user_email,job_hash',
          ignoreDuplicates: false 
        });

      if (error) {
        throw new Error(`Match insertion failed: ${error.message}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Match insertion completed in ${duration}ms`);

    } catch (error) {
      console.error('❌ Batch match insertion failed:', error);
      throw error;
    }
  }

  /**
   * Get recent jobs with optimized query
   */
  async getRecentJobs(limit: number = 50, hours: number = 24): Promise<any[]> {
    const cacheKey = this.generateCacheKey('recent_jobs', { limit, hours });
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const { data, error } = await this.supabase
        .from('jobs')
        .select('id, title, company, location_name, job_url, posted_at, source')
        .eq('is_active', true)
        .gte('posted_at', cutoffDate.toISOString())
        .order('posted_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Recent jobs query failed: ${error.message}`);
      }

      const duration = Date.now() - startTime;
      console.log(`📊 Recent jobs query completed in ${duration}ms`);

      // Cache for 1 minute (recent jobs change frequently)
      this.setCache(cacheKey, data || [], 60 * 1000);

      return data || [];

    } catch (error) {
      console.error('❌ Recent jobs query failed:', error);
      throw error;
    }
  }

  /**
   * Get job statistics efficiently
   */
  async getJobStats(): Promise<any> {
    const cacheKey = 'job_stats';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();

    try {
      // Use a single query with aggregation
      const { data, error } = await this.supabase
        .from('jobs')
        .select('source, is_active, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        throw new Error(`Job stats query failed: ${error.message}`);
      }

      // Process stats in memory
      const stats = {
        total: data.length,
        bySource: {} as Record<string, number>,
        byTier: {} as Record<string, number>,
        active: data.filter((job: any) => job.is_active).length,
        inactive: data.filter((job: any) => !job.is_active).length
      };

      data.forEach((job: any) => {
        // Source stats
        if (!stats.bySource[job.source]) {
          stats.bySource[job.source] = 0;
        }
        stats.bySource[job.source]++;

        // Tier stats
        const tier = 'active';
        if (!stats.byTier[tier]) {
          stats.byTier[tier] = 0;
        }
        stats.byTier[tier]++;
      });

      const duration = Date.now() - startTime;
      console.log(`📊 Job stats query completed in ${duration}ms`);

      // Cache for 5 minutes
      this.setCache(cacheKey, stats, 5 * 60 * 1000);

      return stats;

    } catch (error) {
      console.error('❌ Job stats query failed:', error);
      throw error;
    }
  }

  // Cache management
  private generateCacheKey(prefix: string, params: any): string {
    return `${prefix}_${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache[key];
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      delete this.cache[key];
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number = this.defaultCacheTTL): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  }

  private clearCachePattern(pattern: string): void {
    Object.keys(this.cache).forEach(key => {
      if (key.includes(pattern)) {
        delete this.cache[key];
      }
    });
  }

  public clearCache(): void {
    this.cache = {};
    console.log('🗑️ Query cache cleared');
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache)
    };
  }
}

// Singleton instance
export const queryOptimizer = new QueryOptimizer();
