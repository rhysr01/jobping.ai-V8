/**
 * API endpoint to generate a real email preview with actual jobs
 * Uses WOW AI matching for authentic match reasons
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/Utils/supabase';
import { createConsolidatedMatcher } from '@/Utils/consolidatedMatching';
import { asyncHandler, NotFoundError } from '@/lib/errors';

export const GET = asyncHandler(async (_req: NextRequest) => {
  const supabase = getSupabaseClient();
  
  // Fetch 50 recent quality jobs from popular cities
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('job_hash, title, company, location, description, job_url, source, created_at')
    .eq('status', 'active')
    .in('location', ['London', 'Berlin', 'Amsterdam', 'Paris', 'Madrid'])
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error || !jobs || jobs.length === 0) {
    throw new NotFoundError('No jobs found for preview');
  }
  
  // Create a sample user profile (typical business student)
  const sampleUser = {
    email: 'sample@example.com',
    full_name: 'Alex',
    career_path: 'Finance',
    target_cities: ['London', 'Berlin'],
    entry_level_preference: 'entry',
    languages_spoken: ['English'],
    work_environment: 'Hybrid',
    roles_selected: ['Analyst', 'Associate'],
    subscription_tier: 'free'
  };
  
  // Use AI matching to get 5 best matches with WOW reasons
  const matcher = createConsolidatedMatcher();
  const result = await matcher.performMatching(
    jobs as any[],
    sampleUser as any
  );
  
  // Extract matches array and take top 5
  const topMatches = result.matches.slice(0, 5);
  
  return NextResponse.json({
    success: true,
    matches: topMatches,
    userName: 'Alex',
    userProfile: {
      cities: sampleUser.target_cities,
      role: sampleUser.career_path
    }
  });
});

