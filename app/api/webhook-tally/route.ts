import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';
import {
  performEnhancedAIMatching,
  generateFallbackMatches,
  logMatchSession,
  type UserPreferences,
} from '@/Utils/jobMatching';
import { sendMatchedJobsEmail, sendWelcomeEmail } from '@/Utils/emailUtils';

// Validation Schema
const TallyWebhookSchema = z.object({
  eventId: z.string(),
  eventType: z.literal('FORM_RESPONSE'),
  createdAt: z.string(),
  data: z.object({
    responseId: z.string(),
    submissionId: z.string(),
    respondentId: z.string().optional(),
    formId: z.string(),
    formName: z.string(),
    createdAt: z.string(),
    fields: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.string(),
      value: z.union([z.string(), z.array(z.string()), z.null()]).optional()
    })).min(1)
  })
});

type TallyWebhookData = z.infer<typeof TallyWebhookSchema>;

// Clients
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

// Extract user data with business rules
function extractUserData(fields: TallyWebhookData['data']['fields']) {
  const userData: Record<string, string | boolean> = { 
    email: '',
    active: true
  };
  
  fields.forEach(field => {
    if (!field.value) return;
    
    const key = field.key.toLowerCase();
    let value = Array.isArray(field.value) ? field.value.join(', ') : field.value;
    
    // Apply business rules
    if (key.includes('cities') || key.includes('location')) {
      // Max 3 cities
      if (Array.isArray(field.value)) {
        value = field.value.slice(0, 3).join(', ');
      }
      userData.target_cities = value;
    } else if (key.includes('career_path') || key.includes('career')) {
      // Single career path
      userData.career_path = Array.isArray(field.value) ? field.value[0] : value;
    } else if (key.includes('email')) {
      userData.email = value;
    } else if (key.includes('name') && key.includes('full')) {
      userData.full_name = value;
    } else if (key.includes('expertise') || key.includes('background')) {
      userData.professional_expertise = value;
    } else if (key.includes('start_date') || key.includes('availability')) {
      userData.start_date = value;
    } else if (key.includes('work_environment') || key.includes('work_preference')) {
      userData.work_environment = value;
    } else if (key.includes('visa')) {
      userData.visa_status = value;
    } else if (key.includes('entry_level') || key.includes('experience_level')) {
      userData.entry_level_preference = value;
    } else if (key.includes('target_date') || key.includes('graduation')) {
      userData.target_date = value;
    } else if (key.includes('languages')) {
      userData.languages_spoken = value;
    } else if (key.includes('company')) {
      userData.company_types = value;
    } else if (key.includes('roles') || key.includes('target_roles')) {
      userData.roles_selected = value;
    }
  });

  return userData;
}

export async function POST(req: NextRequest) {
  try {
    // Parse and validate
    const rawPayload = await req.json();
    const payload = TallyWebhookSchema.parse(rawPayload);
    
    if (payload.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ message: 'Event type not handled' });
    }

    const supabase = getSupabaseClient();
    const userData = extractUserData(payload.data.fields);
    
    if (!userData.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`Processing submission for: ${userData.email}`);

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('email, created_at')
      .eq('email', userData.email)
      .single();

    const isNewUser = !existingUser;

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Upsert user
    const now = new Date().toISOString();
    const userRecord = {
      ...userData,
      updated_at: now,
      ...(isNewUser && { created_at: now })
    };

    const { error: upsertError } = await supabase
      .from('users')
      .upsert(userRecord, { onConflict: 'email' });

    if (upsertError) throw upsertError;

    // Generate matches for new users
    let matches: any[] = [];
    let matchType: 'ai_success' | 'fallback' | 'ai_failed' | 'skipped' = 'skipped';
    let jobs: any[] = [];

    if (isNewUser) {
      console.log(`New user: ${userData.email}. Generating matches...`);
      
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data: fetchedJobs } = await supabase
        .from('jobs')
        .select('*')
        .gte('created_at', threeDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

      if (fetchedJobs && fetchedJobs.length > 0) {
        jobs = fetchedJobs;
        
        try {
          const openai = getOpenAIClient();
          matches = await performEnhancedAIMatching(jobs, userData as unknown as UserPreferences, openai);
          matchType = 'ai_success';
          
          if (!matches || matches.length === 0) {
            matchType = 'fallback';
            matches = generateFallbackMatches(jobs, userData as unknown as UserPreferences);
          }
        } catch (err) {
          console.error(`AI matching failed for ${userData.email}:`, err);
          matchType = 'ai_failed';
          matches = generateFallbackMatches(jobs, userData as unknown as UserPreferences);
        }

        if (matches.length > 0) {
          const matchEntries = matches.map(match => ({
            user_email: String(userData.email),
            job_hash: match.job_hash,
            match_score: match.match_score,
            match_reason: match.match_reason,
            match_quality: match.match_quality,
            match_tags: match.match_tags,
            matched_at: now,
            created_at: now
          }));

          await supabase.from('matches').insert(matchEntries);
          await logMatchSession(String(userData.email), matchType, jobs.length, matches.length);
        }
      }
    }

    // Send emails for new users with matches
    if (isNewUser && matches.length > 0) {
      try {
        await sendWelcomeEmail({
          to: String(userData.email),
          userName: userData.full_name as string || 'there',
          matchCount: matches.length,
        });

        const jobDetails = matches.map(match => {
          const job = jobs.find((j: any) => j.job_hash === match.job_hash);
          return { ...job, match_reason: match.match_reason };
        });

        await sendMatchedJobsEmail({
          to: String(userData.email),
          jobs: jobDetails,
          userName: userData.full_name as string || 'there',
        });

        console.log(`Emails sent to ${userData.email}`);
      } catch (emailError) {
        console.error(`Email failed for ${userData.email}:`, emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: isNewUser ? 'New user registered' : 'User updated',
      user: userData.email,
      is_new_user: isNewUser,
      welcome_matches: matches.length,
      fallback_used: matchType === 'fallback' || matchType === 'ai_failed'
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Tally webhook active',
    timestamp: new Date().toISOString()
  });
}