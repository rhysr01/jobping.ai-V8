import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL! as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY! as string
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '10');
    const minScore = parseFloat(searchParams.get('minScore') || '0.5');

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    console.log(`📋 Fetching matches for ${userEmail} (limit: ${limit}, minScore: ${minScore})`);

    // Get user's matches with job details
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        match_score,
        match_reason,
        matched_at,
        jobs (
          title,
          company,
          location,
          job_url,
          description,
          categories,
          experience_required,
          work_environment,
          language_requirements,
          source
        )
      `)
      .eq('user_email', userEmail)
      .gte('match_score', minScore)
      .order('match_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch matches:', error);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    // Transform the data to a cleaner format
    const formattedMatches = matches?.map(match => ({
      job: match.jobs,
      match_score: match.match_score,
      match_reason: match.match_reason,
      matched_at: match.matched_at,
    })).filter(match => match.job) || [];

    console.log(`✅ Found ${formattedMatches.length} matches for ${userEmail}`);

    return NextResponse.json({
      matches: formattedMatches,
      user_email: userEmail,
      total_matches: formattedMatches.length
    });

  } catch (error: unknown) {
    console.error('🚨 User Matches Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Unknown server error' }, { status: 500 });
  }
}

// POST endpoint to trigger matching for a user
export async function POST(req: NextRequest) {
  try {
    const { userEmail, limit = 50 } = await req.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    console.log(`🔄 Triggering matching for ${userEmail}`);

    // Call the match-users endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/match-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
        limit
      }),
    });

    if (!response.ok) {
      throw new Error(`Matching API returned ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: `Triggered matching for ${userEmail}`,
      matches_found: result.matches?.length || 0
    });

  } catch (error: unknown) {
    console.error('🚨 Trigger Matching Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Unknown server error' }, { status: 500 });
  }
} 