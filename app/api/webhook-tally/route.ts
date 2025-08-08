import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import {
  performEnhancedAIMatching,
  generateFallbackMatches,
  logMatchSession,
  type UserPreferences,
} from '@/Utils/jobMatching';

// Initialize Supabase client inside functions to avoid build-time issues
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Initialize OpenAI client inside functions to avoid build-time issues
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Tally Webhook Type
type TallyWebhookData = {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    responseId: string;
    submissionId: string;
    respondentId: string;
    formId: string;
    formName: string;
    createdAt: string;
    fields: Array<{
      key: string;
      label: string;
      type: string;
      value: string | string[];
    }>;
  };
};

// Extract user data matching your actual Tally form fields and Supabase schema
function extractUserDataFromTallyFields(fields: TallyWebhookData['data']['fields']) {
  const userData: Record<string, string | boolean> = { 
    email: '',
    active: true // Default to active for new signups
  };
  
  fields.forEach(field => {
    const value = Array.isArray(field.value) ? field.value.join(', ') : field.value;
    switch (field.key.toLowerCase()) {
      case 'email':
      case 'email_address':
        userData.email = value;
        break;
      case 'full_name':
      case 'name':
        userData.full_name = value;
        break;
      case 'professional_expertise':
      case 'background':
      case 'expertise':
        userData.professional_expertise = value;
        break;
      case 'start_date':
      case 'availability':
        userData.start_date = value;
        break;
      case 'work_environment':
      case 'work_preference':
        userData.work_environment = value;
        break;
      case 'visa_status':
        userData.visa_status = value;
        break;
      case 'entry_level_preference':
      case 'experience_level':
        userData.entry_level_preference = value;
        break;
      case 'career_path':
        userData.career_path = value;
        break;
      case 'target_date':
      case 'graduation_date':
        userData.target_date = value;
        break;
      case 'languages_spoken':
      case 'languages':
        userData.languages_spoken = value;
        break;
      case 'company_types':
      case 'company_preference':
        userData.company_types = value;
        break;
      case 'roles_selected':
      case 'target_roles':
      case 'preferred_roles':
        userData.roles_selected = value;
        break;
      default:
        console.log(`Unknown field: ${field.key} = ${value}`);
        break;
    }
  });

  return userData;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const payload: TallyWebhookData = await req.json();
    
    if (payload.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ message: 'Event type not handled' });
    }

    // Extract user data from form submission
    const userData = extractUserDataFromTallyFields(payload.data.fields);
    if (!userData.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`Processing Tally submission for: ${userData.email}`);

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('email, created_at')
      .eq('email', userData.email)
      .single();

    const isNewUser = !existingUser;

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Upsert user profile
    const userRecord = {
      ...userData,
      updated_at: new Date().toISOString(),
      ...(isNewUser && { created_at: new Date().toISOString() })
    };

    const { error: upsertError } = await supabase
      .from('users')
      .upsert(userRecord, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      throw upsertError;
    }

    // For new users, optionally generate initial matches
    let matches = [];
    let matchType: 'ai_success' | 'fallback' | 'ai_failed' | 'skipped' = 'skipped';

    if (isNewUser) {
      console.log(`New user detected: ${userData.email}. Generating welcome matches...`);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .gte('created_at', threeDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

      if (jobsError) {
        console.error('Failed to fetch jobs for new user matching:', jobsError);
      } else if (jobs && jobs.length > 0) {
        try {
          const openai = getOpenAIClient();
          matches = await performEnhancedAIMatching(jobs, userData as unknown as UserPreferences, openai);
          matchType = 'ai_success';
          if (!matches || matches.length === 0) {
            matchType = 'fallback';
            matches = generateFallbackMatches(jobs, userData as unknown as UserPreferences);
          }
        } catch (err) {
          console.error(`AI matching failed for new user ${userData.email}:`, err);
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
            matched_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }));

          const { error: matchError } = await supabase
            .from('matches')
            .insert(matchEntries);

          if (matchError) {
            console.error(`Failed to save welcome matches for ${userData.email}:`, matchError);
          }

          await logMatchSession(
            String(userData.email),
            matchType,
            jobs.length,
            matches.length
          );
        }
      }
    }

    // Send welcome email for new users (optional)
    if (isNewUser && matches.length > 0) {
      // Place your sendMatchedJobsEmail() call here if you want to trigger an email!
      console.log(`${matches.length} welcome matches generated for ${userData.email}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: isNewUser ? 'New user registered successfully' : 'User profile updated',
      user: userData.email,
      is_new_user: isNewUser,
      welcome_matches: matches.length,
      fallback_used: matchType === 'fallback' || matchType === 'ai_failed'
    });

  } catch (error: unknown) {
    console.error('Tally webhook processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown server error' }, 
      { status: 500 }
    );
  }
}

// Optional: Add GET endpoint for webhook testing
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Tally webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
