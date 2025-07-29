import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { Job } from '../../../scrapers/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL! as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY! as string
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Match result structure
type MatchResult = {
  job_id: string;
  match_score: number;
  match_reason: string;
};

// User preference structure
type UserPreferences = {
  email: string;
  target_cities: string[];
  professional_experience: string;
  work_environment: string;
  visa_status: string;
  entry_level_preference: string;
  languages_spoken: string[];
  company_types: string[];
  career_path: string;
  roles_selected: string[];
};

export async function POST(req: NextRequest) {
  try {
    console.log("🎯 Starting AI job matching process...");
    
    const { userEmail, limit = 50 } = await req.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    // 1. Fetch user preferences
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      console.error('❌ User not found:', userEmail);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Fetch recent jobs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .gte('scraped_at', sevenDaysAgo.toISOString())
      .order('scraped_at', { ascending: false })
      .limit(limit);

    if (jobsError) {
      console.error('❌ Failed to fetch jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      console.log('⚠️ No recent jobs found for matching');
      return NextResponse.json({ matches: [] });
    }

    console.log(`📊 Matching ${jobs.length} jobs for user: ${userEmail}`);

    // 3. Prepare user preferences for GPT
    const userPrefs: UserPreferences = {
      email: userData.email,
      target_cities: Array.isArray(userData.target_cities) ? userData.target_cities : [userData.target_cities].filter(Boolean),
      professional_experience: userData.professional_experience || '',
      work_environment: userData.work_environment || '',
      visa_status: userData.visa_status || '',
      entry_level_preference: userData.entry_level_preference || '',
      languages_spoken: Array.isArray(userData.languages_spoken) ? userData.languages_spoken : [userData.languages_spoken].filter(Boolean),
      company_types: Array.isArray(userData.company_types) ? userData.company_types : [userData.company_types].filter(Boolean),
      career_path: userData.career_path || '',
      roles_selected: Array.isArray(userData.roles_selected) ? userData.roles_selected : [userData.roles_selected].filter(Boolean),
    };

    // 4. Run AI matching
    const matches = await performAIMatching(jobs, userPrefs);
    
    // 5. Store matches in database
    const matchEntries = matches.map(match => ({
      user_email: userEmail,
      job_hash: match.job_id,
      match_score: match.match_score,
      match_reason: match.match_reason,
      matched_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('matches')
      .upsert(matchEntries, { onConflict: 'user_email,job_hash' });

    if (insertError) {
      console.error('❌ Failed to store matches:', insertError);
      // Continue anyway - we still return the matches
    }

    console.log(`✅ Successfully matched ${matches.length} jobs for ${userEmail}`);
    
    return NextResponse.json({ 
      matches,
      total_jobs_processed: jobs.length,
      user_email: userEmail 
    });

  } catch (error: unknown) {
    console.error('🚨 AI Matching Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Unknown server error' }, { status: 500 });
  }
}

async function performAIMatching(jobs: Job[], userPrefs: UserPreferences): Promise<MatchResult[]> {
  const matches: MatchResult[] = [];
  
  // Process jobs in batches to avoid rate limits
  const batchSize = 10;
  
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchMatches = await processJobBatch(batch, userPrefs);
    matches.push(...batchMatches);
    
    // Small delay between batches
    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Sort by match score (highest first)
  return matches.sort((a, b) => b.match_score - a.match_score);
}

async function processJobBatch(jobs: Job[], userPrefs: UserPreferences): Promise<MatchResult[]> {
  try {
    const prompt = buildMatchingPrompt(jobs, userPrefs);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert job matching AI for early-career professionals. 
          Analyze job listings against user preferences and return ONLY valid JSON with match scores from 0.0 to 1.0.
          Be strict with scoring - only give high scores (0.8+) for excellent matches.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate JSON response
    const parsedMatches = parseAndValidateMatches(response, jobs);
    
    return parsedMatches;
    
  } catch (error) {
    console.error('❌ AI Matching batch error:', error);
    // Return empty matches for this batch on error
    return [];
  }
}

function buildMatchingPrompt(jobs: Job[], userPrefs: UserPreferences): string {
  const userContext = `
USER PREFERENCES:
- Target Cities: ${userPrefs.target_cities.join(', ') || 'Any'}
- Professional Experience: ${userPrefs.professional_experience || 'Not specified'}
- Work Environment: ${userPrefs.work_environment || 'Any'}
- Visa Status: ${userPrefs.visa_status || 'Not specified'}
- Entry Level Preference: ${userPrefs.entry_level_preference || 'Any'}
- Languages: ${userPrefs.languages_spoken.join(', ') || 'Any'}
- Company Types: ${userPrefs.company_types.join(', ') || 'Any'}
- Career Path: ${userPrefs.career_path || 'Not specified'}
- Roles: ${userPrefs.roles_selected.join(', ') || 'Any'}

JOBS TO MATCH:
${jobs.map((job, index) => `
Job ${index + 1}:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Categories: ${job.categories.join(', ')}
- Experience Required: ${job.experience_required || 'Not specified'}
- Work Environment: ${job.work_environment || 'Not specified'}
- Languages: ${job.language_requirements?.join(', ') || 'Not specified'}
- Source: ${job.source}
- Job Hash: ${job.job_hash}
`).join('\n')}

SCORING GUIDELINES:
- 0.9-1.0: Perfect match (location, experience, role all align)
- 0.8-0.89: Excellent match (most criteria met)
- 0.7-0.79: Good match (several criteria met)
- 0.6-0.69: Fair match (some criteria met)
- 0.5-0.59: Basic match (few criteria met)
- 0.0-0.49: Poor match (minimal alignment)

PRIORITY FACTORS:
1. Location match (highest weight)
2. Experience level alignment
3. Work environment preference
4. Visa requirements compatibility
5. Language skills match
6. Career path alignment

Return ONLY valid JSON in this exact format:
[
  {
    "job_id": "job_hash_here",
    "match_score": 0.85,
    "match_reason": "Brief explanation of why this job matches well"
  }
]`;

  return userContext;
}

function parseAndValidateMatches(response: string, jobs: Job[]): MatchResult[] {
  try {
    // Clean the response - remove any markdown formatting
    const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    
    const parsed = JSON.parse(cleanResponse);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    // Validate each match
    const validMatches: MatchResult[] = [];
    const jobHashes = new Set(jobs.map(job => job.job_hash));
    
    for (const match of parsed) {
      if (
        typeof match === 'object' &&
        match.job_id &&
        typeof match.match_score === 'number' &&
        match.match_score >= 0 &&
        match.match_score <= 1 &&
        typeof match.match_reason === 'string' &&
        jobHashes.has(match.job_id)
      ) {
        validMatches.push({
          job_id: match.job_id,
          match_score: Math.round(match.match_score * 100) / 100, // Round to 2 decimal places
          match_reason: match.match_reason.substring(0, 200) // Limit reason length
        });
      }
    }
    
    return validMatches;
    
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    console.error('Raw response:', response);
    return [];
  }
} 