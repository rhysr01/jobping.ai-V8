// app/api/match-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import {
  performEnhancedAIMatching,
  generateFallbackMatches,
  logMatchSession,
} from '@/Utils/jobMatching';
import type { JobMatch } from '@/Utils/jobMatching';

// Enhanced monitoring and performance tracking
interface PerformanceMetrics {
  jobFetchTime: number;
  tierDistributionTime: number;
  aiMatchingTime: number;
  totalProcessingTime: number;
  memoryUsage: number;
}

// Simple in-memory rate limiting - upgrade to Redis when you scale
const rateLimitMap = new Map<string, number>();
const jobReservationMap = new Map<string, number>(); // Job locking mechanism

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 requests per 15 minutes

// Performance and cost optimization settings
const MAX_JOBS_PER_USER = {
  free: 50,      // Reduced from 500 to control AI costs
  premium: 100   // Premium gets more but still reasonable
};

// Freshness tier distribution with fallback logic
const TIER_DISTRIBUTION = {
  free: {
    ultra_fresh: 2,
    fresh: 2,
    comprehensive: 1,
    fallback_order: ['fresh', 'comprehensive', 'ultra_fresh'] // If tier is empty, try these
  },
  premium: {
    ultra_fresh: 5,
    fresh: 7,
    comprehensive: 3,
    fallback_order: ['fresh', 'ultra_fresh', 'comprehensive']
  }
};

// Production-ready job interface with validation
interface JobWithFreshness {
  id: string;
  title: string;
  company: string;
  location: string;
  job_url: string;
  description: string;
  created_at: string;
  job_hash: string;
  is_sent: boolean;
  status: string;
  freshness_tier: 'ultra_fresh' | 'fresh' | 'comprehensive' | null;
  original_posted_date: string | null;
  last_seen_at: string | null;
}

// Database schema validation
async function validateDatabaseSchema(supabase: any): Promise<boolean> {
  try {
    // Check if required columns exist by attempting a sample query
    const { data, error } = await supabase
      .from('jobs')
      .select('status, freshness_tier, original_posted_date, last_seen_at')
      .limit(1);
    
    if (error) {
      console.error('Database schema validation failed:', error.message);
      return false;
    }
    
    console.log('Database schema validation passed');
    return true;
  } catch (err) {
    console.error('Database schema validation error:', err);
    return false;
  }
}

// Enhanced rate limiting with job reservation
function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const lastCallTime = rateLimitMap.get(identifier) || 0;
  
  if (now - lastCallTime < RATE_LIMIT_WINDOW_MS) {
    console.log(`Rate limit hit for ${identifier}. Last call: ${new Date(lastCallTime).toISOString()}`);
    return true;
  }
  
  rateLimitMap.set(identifier, now);
  return false;
}

// Job reservation system to prevent race conditions
function reserveJobs(jobIds: string[], reservationId: string): boolean {
  const now = Date.now();
  
  // Check if any jobs are already reserved
  for (const jobId of jobIds) {
    const existingReservation = jobReservationMap.get(jobId);
    if (existingReservation && (now - existingReservation) < 300000) { // 5 minute reservation
      console.log(`Job ${jobId} already reserved`);
      return false;
    }
  }
  
  // Reserve all jobs
  for (const jobId of jobIds) {
    jobReservationMap.set(jobId, now);
  }
  
  return true;
}

// UTC-safe date calculation
function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(0, 0, 0, 0); // Start of day UTC
  return date;
}

// Tier distribution with intelligent fallback logic
function distributeJobsByFreshness(
  jobs: JobWithFreshness[], 
  userTier: 'free' | 'premium' = 'free',
  userId: string
): { jobs: JobWithFreshness[], metrics: any } {
  const startTime = Date.now();
  
  console.log(`Distributing jobs for ${userTier} user ${userId}. Total jobs: ${jobs.length}`);
  
  // Validate and clean job data
  const validJobs = jobs.filter(job => {
    // Skip jobs with invalid data
    if (!job.freshness_tier || !job.original_posted_date) {
      console.warn(`Job ${job.id} missing freshness data, assigning fallback`);
      // Assign fallback freshness tier based on created_at
      job.freshness_tier = assignFallbackFreshnessTier(job.created_at);
      job.original_posted_date = job.created_at; // Use created_at as fallback
    }
    return job.job_hash && job.title && job.company;
  });
  
  // Separate jobs by freshness tier
  const ultraFreshJobs = validJobs.filter(job => job.freshness_tier === 'ultra_fresh');
  const freshJobs = validJobs.filter(job => job.freshness_tier === 'fresh');
  const comprehensiveJobs = validJobs.filter(job => job.freshness_tier === 'comprehensive');
  
  const tierCounts = {
    ultra_fresh: ultraFreshJobs.length,
    fresh: freshJobs.length,
    comprehensive: comprehensiveJobs.length
  };
  
  console.log(`Job breakdown for ${userId} - Ultra Fresh: ${tierCounts.ultra_fresh}, Fresh: ${tierCounts.fresh}, Comprehensive: ${tierCounts.comprehensive}`);
  
  // Get distribution limits based on user tier
  const config = TIER_DISTRIBUTION[userTier];
  const selectedJobs: JobWithFreshness[] = [];
  
  // Smart selection with fallback logic
  selectedJobs.push(...selectJobsFromTier(ultraFreshJobs, config.ultra_fresh, 'ultra_fresh'));
  selectedJobs.push(...selectJobsFromTier(freshJobs, config.fresh, 'fresh'));
  selectedJobs.push(...selectJobsFromTier(comprehensiveJobs, config.comprehensive, 'comprehensive'));
  
  // Fallback logic: if we don't have enough jobs, pull from other tiers
  const targetTotal = config.ultra_fresh + config.fresh + config.comprehensive;
  const maxAllowed = MAX_JOBS_PER_USER[userTier];
  
  if (selectedJobs.length < targetTotal && selectedJobs.length < maxAllowed) {
    const remainingSlots = Math.min(targetTotal - selectedJobs.length, maxAllowed - selectedJobs.length);
    const usedJobHashes = new Set(selectedJobs.map(job => job.job_hash));
    
    // Try fallback tiers in order
    for (const fallbackTier of config.fallback_order) {
      if (remainingSlots <= 0) break;
      
      const tierJobs = validJobs.filter(job => 
        job.freshness_tier === fallbackTier && !usedJobHashes.has(job.job_hash)
      );
      
      const additionalJobs = selectJobsFromTier(tierJobs, remainingSlots, fallbackTier);
      selectedJobs.push(...additionalJobs);
      
      additionalJobs.forEach(job => usedJobHashes.add(job.job_hash));
    }
  }
  
  const processingTime = Date.now() - startTime;
  
  console.log(`Selected ${selectedJobs.length} jobs for ${userId} (${userTier} tier) in ${processingTime}ms`);
  
  return {
    jobs: selectedJobs,
    metrics: {
      processingTime,
      originalJobCount: jobs.length,
      validJobCount: validJobs.length,
      selectedJobCount: selectedJobs.length,
      tierCounts,
      fallbacksUsed: selectedJobs.length < targetTotal
    }
  };
}

// Helper function to select jobs from a specific tier
function selectJobsFromTier(tierJobs: JobWithFreshness[], limit: number, tierName: string): JobWithFreshness[] {
  return tierJobs
    .sort((a, b) => {
      // Primary sort: original posting date (most recent first)
      const dateA = new Date(a.original_posted_date || a.created_at);
      const dateB = new Date(b.original_posted_date || b.created_at);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      // Secondary sort: last seen (most recently confirmed first)
      const lastSeenA = new Date(a.last_seen_at || a.created_at);
      const lastSeenB = new Date(b.last_seen_at || b.created_at);
      return lastSeenB.getTime() - lastSeenA.getTime();
    })
    .slice(0, limit);
}

// Fallback freshness tier assignment
function assignFallbackFreshnessTier(createdAt: string): 'ultra_fresh' | 'fresh' | 'comprehensive' {
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 48) return 'ultra_fresh';
  if (hoursAgo <= 168) return 'fresh'; // 168 hours = 1 week
  return 'comprehensive';
}

// Performance monitoring utility
function trackPerformance(): { startTime: number; getMetrics: () => PerformanceMetrics } {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  return {
    startTime,
    getMetrics: () => ({
      jobFetchTime: 0, // Set by caller
      tierDistributionTime: 0, // Set by caller
      aiMatchingTime: 0, // Set by caller
      totalProcessingTime: Date.now() - startTime,
      memoryUsage: process.memoryUsage().heapUsed - startMemory
    })
  };
}

// Pre-filter jobs by user preferences to reduce AI load
function preFilterJobsByUserPreferences(jobs: JobWithFreshness[], user: any): JobWithFreshness[] {
  // Basic filtering to reduce AI processing load
  let filteredJobs = jobs;
  
  // Filter by location preference if specified
  if (user.location_preference && user.location_preference !== 'anywhere') {
    filteredJobs = filteredJobs.filter(job => 
      job.location.toLowerCase().includes(user.location_preference.toLowerCase()) ||
      job.location.toLowerCase().includes('remote')
    );
  }
  
  // Filter by experience level keywords in title
  if (user.experience_level) {
    const experienceKeywords = {
      'entry': ['intern', 'internship', 'graduate', 'grad', 'entry', 'junior', 'trainee', 'associate'],
      'mid': ['analyst', 'specialist', 'coordinator', 'associate'],
      'senior': ['senior', 'lead', 'principal', 'manager', 'director']
    };
    
    const keywords = experienceKeywords[user.experience_level] || experienceKeywords['entry'];
    filteredJobs = filteredJobs.filter(job =>
      keywords.some(keyword => job.title.toLowerCase().includes(keyword))
    );
  }
  
  console.log(`Pre-filtered from ${jobs.length} to ${filteredJobs.length} jobs for user ${user.email}`);
  return filteredJobs;
}

// Initialize clients
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(req: NextRequest) {
  const performanceTracker = trackPerformance();
  const reservationId = `batch_${Date.now()}`;
  
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
            req.headers.get('x-real-ip') || 
            'unknown-ip';
  
  if (isRateLimited(ip)) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { 
        error: 'Rate limited. This endpoint processes expensive AI operations. Try again in 15 minutes.',
        retryAfter: 900
      },
      { 
        status: 429,
        headers: { 'Retry-After': '900' }
      }
    );
  }

  try {
    console.log(`Processing match-users request from IP: ${ip}`);
    
    const { limit = 1000, forceReprocess = false } = await req.json();
    const supabase = getSupabaseClient();
    
    // Validate database schema before proceeding
    const isSchemaValid = await validateDatabaseSchema(supabase);
    if (!isSchemaValid) {
      return NextResponse.json({ 
        error: 'Database schema validation failed. Missing required columns: status, freshness_tier, original_posted_date, last_seen_at' 
      }, { status: 500 });
    }

    // 1. Fetch active users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('active', true);

    if (usersError) {
      console.error('Failed to fetch users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      console.log('No active users found');
      return NextResponse.json({ message: 'No active users found' });
    }

    console.log(`Found ${users.length} active users to process`);

    // 2. Fetch jobs with UTC-safe date calculation
    const jobFetchStart = Date.now();
    const thirtyDaysAgo = getDateDaysAgo(30);

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        company,
        location,
        job_url,
        description,
        created_at,
        job_hash,
        is_sent,
        status,
        freshness_tier,
        original_posted_date,
        last_seen_at
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('is_sent', false)
      .eq('status', 'active')
      .order('original_posted_date', { ascending: false })
      .limit(limit);

    const jobFetchTime = Date.now() - jobFetchStart;

    if (jobsError) {
      console.error('Failed to fetch jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      console.log('No active jobs to process');
      return NextResponse.json({ message: 'No active jobs to process' });
    }

    console.log(`Found ${jobs.length} active jobs from past 30 days in ${jobFetchTime}ms`);

    // Reserve jobs to prevent race conditions
    const jobIds = jobs.map(job => job.id);
    if (!reserveJobs(jobIds, reservationId)) {
      console.warn('Jobs already reserved by another process');
      return NextResponse.json({ 
        error: 'Jobs currently being processed by another instance. Try again in a few minutes.' 
      }, { status: 409 });
    }

    // Log overall freshness distribution
    const globalTierCounts = jobs.reduce((acc, job) => {
      const tier = job.freshness_tier || 'unknown';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Global job freshness distribution:', globalTierCounts);

    // 3. Process each user with enhanced error handling
    const results = [];
    let totalAIProcessingTime = 0;
    let totalTierDistributionTime = 0;
    
    for (const user of users) {
      try {
        console.log(`Processing matches for ${user.email} (tier: ${user.tier || 'free'})`);
        
        // Pre-filter jobs to reduce AI processing load
        const preFilteredJobs = preFilterJobsByUserPreferences(jobs as JobWithFreshness[], user);
        
        // Apply freshness distribution with fallback logic
        const tierDistributionStart = Date.now();
        const { jobs: distributedJobs, metrics: tierMetrics } = distributeJobsByFreshness(
          preFilteredJobs, 
          user.tier || 'free',
          user.email
        );
        const tierDistributionTime = Date.now() - tierDistributionStart;
        totalTierDistributionTime += tierDistributionTime;

        // AI matching with performance tracking
        let matches: JobMatch[] = [];
        let matchType: 'ai_success' | 'fallback' | 'ai_failed' = 'ai_success';
        const aiMatchingStart = Date.now();

        try {
          const openai = getOpenAIClient();
          matches = await performEnhancedAIMatching(distributedJobs, user, openai);
          if (!matches || matches.length === 0) {
            matchType = 'fallback';
            matches = generateFallbackMatches(distributedJobs, user);
          }
        } catch (err) {
          console.error(`AI matching failed for ${user.email}:`, err);
          matchType = 'ai_failed';
          matches = generateFallbackMatches(distributedJobs, user);
        }
        
        const aiMatchingTime = Date.now() - aiMatchingStart;
        totalAIProcessingTime += aiMatchingTime;

        // Save matches with enhanced data
        if (matches && matches.length > 0) {
          const matchEntries = matches.map(match => {
            const originalJob = distributedJobs.find(job => job.job_hash === match.job_hash);
            
            return {
              user_email: user.email,
              job_hash: match.job_hash,
              match_score: match.match_score,
              match_reason: match.match_reason,
              match_quality: match.match_quality,
              match_tags: match.match_tags,
              freshness_tier: originalJob?.freshness_tier || 'comprehensive',
              processing_method: matchType,
              matched_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            };
          });

          const { error: insertError } = await supabase
            .from('matches')
            .insert(matchEntries);

          if (insertError) {
            console.error(`Failed to save matches for ${user.email}:`, insertError);
          }
        }

        // Enhanced logging
        await logMatchSession(
          user.email,
          matchType,
          distributedJobs.length,
          matches.length
        );

        // Calculate tier distribution for results
        const matchTierCounts = matches.reduce((acc, match) => {
          const job = distributedJobs.find(j => j.job_hash === match.job_hash);
          if (job?.freshness_tier) {
            acc[job.freshness_tier] = (acc[job.freshness_tier] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        results.push({
          user_email: user.email,
          user_tier: user.tier || 'free',
          matches_count: matches.length,
          tier_distribution: matchTierCounts,
          tier_metrics: tierMetrics,
          performance: {
            tier_distribution_time: tierDistributionTime,
            ai_matching_time: aiMatchingTime,
            pre_filter_reduction: preFilteredJobs.length / jobs.length
          },
          fallback_used: matchType !== 'ai_success',
          processing_method: matchType
        });

      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        
        results.push({
          user_email: user.email,
          user_tier: user.tier || 'free',
          matches_count: 0,
          tier_distribution: {},
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }

    // Mark processed jobs as sent with atomic operation
    if (jobs.length > 0) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ 
          is_sent: true,
          processed_at: new Date().toISOString()
        })
        .in('id', jobIds);
      
      if (updateError) {
        console.error('Failed to mark jobs as sent:', updateError);
      }
    }

    // Calculate final performance metrics
    const finalMetrics = performanceTracker.getMetrics();
    finalMetrics.jobFetchTime = jobFetchTime;
    finalMetrics.tierDistributionTime = totalTierDistributionTime;
    finalMetrics.aiMatchingTime = totalAIProcessingTime;

    console.log(`Successfully processed ${users.length} users and ${jobs.length} jobs with tiered freshness system`);
    console.log('Performance metrics:', finalMetrics);

    return NextResponse.json({
      success: true,
      users_processed: users.length,
      jobs_processed: jobs.length,
      freshness_distribution: globalTierCounts,
      performance_metrics: finalMetrics,
      cost_optimization: {
        pre_filter_enabled: true,
        max_jobs_per_user: MAX_JOBS_PER_USER,
        estimated_ai_calls: results.reduce((sum, r) => sum + (r.matches_count || 0), 0)
      },
      results
    });

  } catch (error: unknown) {
    console.error('Match users API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown server error' }, 
      { status: 500 }
    );
  }
}

// Enhanced GET endpoint with tier analytics
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
            req.headers.get('x-real-ip') || 
            'unknown-ip';
  
  const getLastCall = rateLimitMap.get(`get_${ip}`) || 0;
  const now = Date.now();
  
  if (now - getLastCall < 60000) {
    return NextResponse.json(
      { error: 'Rate limited. Try again in 1 minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  
  rateLimitMap.set(`get_${ip}`, now);
  
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get('email');
  const analytics = searchParams.get('analytics') === 'true';
  
  if (!userEmail) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
  }

  try {
    console.log(`GET request for user matches: ${userEmail} from IP: ${ip}`);
    
    const supabase = getSupabaseClient();
    
    // Get user's recent matches with performance tracking
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        jobs!inner(*)
      `)
      .eq('user_email', userEmail)
      .gte('matched_at', new Date(Date.now() - 48*60*60*1000).toISOString())
      .order('match_score', { ascending: false });

    if (error) {
      console.error('Failed to fetch user matches:', error);
      throw error;
    }

    // Group matches by freshness tier
    const groupedMatches = (matches || []).reduce((acc, match) => {
      const tier = match.freshness_tier || 'comprehensive';
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(match);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate tier performance analytics
    const tierAnalytics = analytics ? {
      application_rates: Object.keys(groupedMatches).reduce((acc, tier) => {
        const tierMatches = groupedMatches[tier];
        acc[tier] = {
          total_matches: tierMatches.length,
          avg_match_score: tierMatches.reduce((sum, m) => sum + (m.match_score || 0), 0) / tierMatches.length,
          match_quality_distribution: tierMatches.reduce((dist, m) => {
            const quality = m.match_quality || 'unknown';
            dist[quality] = (dist[quality] || 0) + 1;
            return dist;
          }, {} as Record<string, number>)
        };
        return acc;
      }, {} as Record<string, any>)
    } : null;

    console.log(`Found ${matches?.length || 0} matches for ${userEmail}, grouped by freshness`);

    return NextResponse.json({ 
      matches: matches || [],
      grouped_by_freshness: groupedMatches,
      tier_counts: Object.keys(groupedMatches).reduce((acc, tier) => {
        acc[tier] = groupedMatches[tier].length;
        return acc;
      }, {} as Record<string, number>),
      analytics: tierAnalytics
    });
  } catch (error: unknown) {
    console.error('GET matches error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}