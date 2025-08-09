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
import { EmailVerificationOracle } from '@/Utils/emailVerification';

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
  const userData: Record<string, string | string[] | boolean> = { 
    email: '',
    active: true
  };
  
  fields.forEach((field: any) => {
    if (!field.value) return;
    
    const key = field.key.toLowerCase();
    
    // Apply business rules
    if (key.includes('cities') || key.includes('location')) {
      // Handle target cities as array
      if (Array.isArray(field.value)) {
        userData.target_cities = field.value.slice(0, 3); // Max 3 cities
      } else {
        userData.target_cities = [field.value];
      }
    } else if (key.includes('career_path') || key.includes('career')) {
      // Single career path
      userData.career_path = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('email')) {
      userData.email = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('name') && key.includes('full')) {
      userData.full_name = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('expertise') || key.includes('background')) {
      userData.professional_expertise = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('start_date') || key.includes('availability')) {
      userData.start_date = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('work_environment') || key.includes('work_preference')) {
      userData.work_environment = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('visa')) {
      userData.visa_status = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('entry_level') || key.includes('experience_level')) {
      userData.entry_level_preference = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('target_date') || key.includes('graduation')) {
      userData.target_date = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('languages')) {
      // Handle languages as array
      if (Array.isArray(field.value)) {
        userData.languages_spoken = field.value;
      } else {
        userData.languages_spoken = [field.value];
      }
    } else if (key.includes('company')) {
      // Handle company types as array
      if (Array.isArray(field.value)) {
        userData.company_types = field.value;
      } else {
        userData.company_types = [field.value];
      }
    } else if (key.includes('roles') || key.includes('target_roles')) {
      // Handle roles as array
      if (Array.isArray(field.value)) {
        userData.roles_selected = field.value;
      } else {
        userData.roles_selected = [field.value];
      }
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
      .select('email, created_at, email_verified, verification_token')
      .eq('email', userData.email)
      .single();

    const isNewUser = !existingUser;

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // If user exists and is already verified, skip verification
    if (existingUser && existingUser.email_verified) {
      console.log(`User ${userData.email} already verified, skipping verification`);
    }

    // Generate verification token for new users
    let verificationToken = null;
    if (isNewUser) {
      verificationToken = EmailVerificationOracle.generateVerificationToken();
      console.log(`Generated verification token for new user: ${userData.email}`);
    }

    // Upsert user
    const now = new Date().toISOString();
    const userRecord: any = {
      ...userData,
      // Ensure arrays are properly formatted for Supabase
      languages_spoken: Array.isArray(userData.languages_spoken) ? userData.languages_spoken : [userData.languages_spoken || ''],
      company_types: Array.isArray(userData.company_types) ? userData.company_types : [userData.company_types || ''],
      roles_selected: Array.isArray(userData.roles_selected) ? userData.roles_selected : [userData.roles_selected || ''],
      target_cities: Array.isArray(userData.target_cities) ? userData.target_cities : [userData.target_cities || ''],
      updated_at: now,
      // NEW: Email verification fields
      email_verified: isNewUser ? false : (existingUser?.email_verified || false),
      verification_token: isNewUser ? verificationToken : (existingUser?.verification_token || null),
      ...(isNewUser && { created_at: now })
    };

    console.log('Upserting user with data:', {
      email: userRecord.email,
      email_verified: userRecord.email_verified,
      languages_spoken: userRecord.languages_spoken,
      company_types: userRecord.company_types,
      roles_selected: userRecord.roles_selected,
      target_cities: userRecord.target_cities
    });

    const { error: upsertError } = await supabase
      .from('users')
      .upsert(userRecord, { onConflict: 'email' });

    if (upsertError) {
      console.error('User upsert failed:', upsertError);
      throw upsertError;
    }

    // Send verification email for new users
    if (isNewUser && verificationToken) {
      try {
        await EmailVerificationOracle.sendVerificationEmail(
          userData.email as string,
          verificationToken,
          userData.full_name as string || 'there'
        );
        
        console.log(`📧 Verification email sent to: ${userData.email}`);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Please check your email to verify your account',
          email: userData.email,
          requiresVerification: true
        });
      } catch (emailError) {
        console.error(`❌ Verification email failed for ${userData.email}:`, emailError);
        // Continue with the process even if email fails
      }
    }

    // Generate matches for verified users only
    let matches: any[] = [];
    let matchType: 'ai_success' | 'fallback' | 'ai_failed' | 'skipped' = 'skipped';
    let jobs: any[] = [];

    // Only generate matches for verified users or if this is a verification callback
    if ((existingUser && existingUser.email_verified) || !isNewUser) {
      console.log(`Verified user: ${userData.email}. Generating matches...`);
      
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

    // Send emails for verified users with matches
    if ((existingUser && existingUser.email_verified) && matches.length > 0) {
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
      message: isNewUser ? 'Verification email sent' : 'User updated successfully',
      email: userData.email,
      requiresVerification: isNewUser,
      matchesGenerated: matches.length
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Tally webhook active',
    timestamp: new Date().toISOString()
  });
}