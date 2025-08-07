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

// Initialize Supabase client inside functions to avoid build-time issues
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // For daily batch processing - no userEmail needed
    const { limit = 50 } = await req.json();

    // 1. Fetch ALL active users (not just one)
    const supabase = getSupabaseClient();
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('active', true); // Assuming you have an active flag

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No active users found' });
    }

    // 2. Fetch fresh jobs (from past 24 hours, not 7 days)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .gte('created_at', twentyFourHoursAgo.toISOString()) // Use created_at not scraped_at
      .eq('is_sent', false) // Only unsent jobs
      .order('created_at', { ascending: false })
      .limit(limit);

    if (jobsError) {
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: 'No new jobs to process' });
    }

    // 3. Process each user
    const results = [];
    
    for (const user of users) {
      try {
        console.log(`Processing matches for ${user.email}`);
        
        // Match jobs using AI (and fallback if necessary)
        let matches: JobMatch[] = [];
        let matchType: 'ai_success' | 'fallback' | 'ai_failed' = 'ai_success';

        try {
          matches = await performEnhancedAIMatching(jobs, user, openai);
          if (!matches || matches.length === 0) {
            matchType = 'fallback';
            matches = generateFallbackMatches(jobs, user);
          }
        } catch (err) {
          console.error(`AI matching failed for ${user.email}:`, err);
          matchType = 'ai_failed';
          matches = generateFallbackMatches(jobs, user);
        }

        // 4. Save matches to database (only if we have matches)
        if (matches && matches.length > 0) {
          const matchEntries = matches.map(match => ({
            user_email: user.email,
            job_hash: match.job_hash,
            match_score: match.match_score,
            match_reason: match.match_reason,
            match_quality: match.match_quality,
            match_tags: match.match_tags,
            matched_at: new Date().toISOString(),
            created_at: new Date().toISOString() // Add created_at for consistency
          }));

          // Use insert instead of upsert for daily matches
          const { error: insertError } = await supabase
            .from('matches')
            .insert(matchEntries);

          if (insertError) {
            console.error(`Failed to save matches for ${user.email}:`, insertError);
          }
        }

        // 5. Log session for monitoring
        await logMatchSession(
          user.email,
          matchType,
          jobs.length,
          matches.length
        );

        results.push({
          user_email: user.email,
          matches_count: matches.length,
          fallback_used: matchType !== 'ai_success'
        });

      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        
        results.push({
          user_email: user.email,
          matches_count: 0,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }

    // 6. Mark processed jobs as sent (so they don't get reprocessed)
    if (jobs.length > 0) {
      await supabase
        .from('jobs')
        .update({ is_sent: true })
        .in('id', jobs.map(job => job.id));
    }

    return NextResponse.json({
      success: true,
      users_processed: users.length,
      jobs_processed: jobs.length,
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

// Optional: Add GET endpoint for single user testing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get('email');
  
  if (!userEmail) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();
    // Get user's recent matches
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        jobs!inner(*)
      `)
      .eq('user_email', userEmail)
      .gte('matched_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      .order('match_score', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ matches: matches || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}