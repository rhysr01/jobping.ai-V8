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
  formId: z.string(),
  responseId: z.string(),
  data: z.object({
    fields: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.string(),
      value: z.union([z.string(), z.array(z.string()), z.null()]).optional()
    })).min(1)
  }).optional()
});

type TallyWebhookData = z.infer<typeof TallyWebhookSchema>;

// Clients
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

function getOpenAIClient() {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    throw new Error('Missing OpenAI API key: OPENAI_API_KEY must be set');
  }
  
  return new OpenAI({
    apiKey: openaiKey,
  });
}

// Extract user data with business rules - FIXED VERSION
function extractUserData(fields: NonNullable<TallyWebhookData['data']>['fields']) {
  const userData: Record<string, string | string[] | boolean> = { 
    email: ''
  };
  
  fields.forEach((field: any) => {
    if (!field.value) return;
    
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    
    // Apply business rules
    if (key.includes('cities') || key.includes('location') || label.includes('location')) {
      // Handle target cities as array
      if (Array.isArray(field.value)) {
        userData.target_cities = field.value.slice(0, 3); // Max 3 cities
      } else {
        userData.target_cities = [field.value];
      }
    } else if (key.includes('career_path') || key.includes('career') || label.includes('career')) {
      // Single career path
      userData.career_path = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('email') || label.includes('email')) {
      userData.email = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('name') || label.includes('name')) {  // FIXED: Removed "&& key.includes('full')"
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
    
    // Handle cases where data might be undefined
    if (!rawPayload || !rawPayload.data) {
      console.warn('Webhook received without data field:', rawPayload);
      return NextResponse.json({ 
        message: 'Webhook received but no data field found',
        received: rawPayload 
      }, { status: 400 });
    }
    
    const payload = TallyWebhookSchema.parse(rawPayload);
    
    if (payload.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ message: 'Event type not handled' });
    }

    const supabase = getSupabaseClient();
    const userData = extractUserData(payload.data?.fields || []);
    
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
    if (existingUser && (existingUser as any).email_verified) {
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
      // Keep arrays as arrays since your schema has TEXT[] columns
      languages_spoken: Array.isArray(userData.languages_spoken) ? userData.languages_spoken : (userData.languages_spoken ? [userData.languages_spoken] : []),
      company_types: Array.isArray(userData.company_types) ? userData.company_types : (userData.company_types ? [userData.company_types] : []),
      roles_selected: Array.isArray(userData.roles_selected) ? userData.roles_selected : (userData.roles_selected ? [userData.roles_selected] : []),
      target_cities: Array.isArray(userData.target_cities) ? userData.target_cities : (userData.target_cities ? [userData.target_cities] : []),
      updated_at: now,
      email_verified: isNewUser ? false : ((existingUser as any)?.email_verified || false),
      verification_token: isNewUser ? verificationToken : ((existingUser as any)?.verification_token || null),
      active: true,
      ...(isNewUser && { created_at: now })
    };

    console.log('Upserting user with data:', {
      email: userRecord.email,
      full_name: userRecord.full_name,
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
    let matchType: 'ai_success' | 'fallback' | 'ai_failed' = 'ai_failed';
    let jobs: any[] = [];

    // Only generate matches for verified users or if this is a verification callback
    if ((existingUser && (existingUser as any).email_verified) || !isNewUser) {
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
        } catch (aiError) {
          console.error(`❌ AI matching failed for ${userData.email}:`, aiError);
          matchType = 'ai_failed';
          matches = generateFallbackMatches(jobs, userData as unknown as UserPreferences);
        }
      }
    }

    // Log match session
    await logMatchSession(
      userData.email as string,
      matchType,
      jobs.length,
      matches.length
    );

    // Send welcome email for new users
    if (isNewUser) {
      try {
        await sendWelcomeEmail({
          to: userData.email as string,
          userName: userData.full_name as string,
          matchCount: matches.length
        });
        console.log(`📧 Welcome email sent to: ${userData.email}`);
      } catch (emailError) {
        console.error(`❌ Welcome email failed for ${userData.email}:`, emailError);
      }
    }

    // Send matched jobs email if matches were generated
    if (matches.length > 0) {
      try {
        await sendMatchedJobsEmail({
          to: userData.email as string,
          jobs: matches,
          userName: userData.full_name as string
        });
        console.log(`📧 Matched jobs email sent to: ${userData.email}`);
      } catch (emailError) {
        console.error(`❌ Matched jobs email failed for ${userData.email}:`, emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: isNewUser ? 'User registered successfully' : 'User updated successfully',
      email: userData.email,
      matchesGenerated: matches.length,
      requiresVerification: isNewUser && !((existingUser as any)?.email_verified || false)
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('❌ Tally webhook validation error:', error.errors);
      return NextResponse.json({
        error: 'Invalid webhook payload structure',
        details: error.errors
      }, { status: 400 });
    }
    
    console.error('❌ Tally webhook internal error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    return NextResponse.json({
      error: 'Registration failed',
      details: error instanceof Error ? error.message : JSON.stringify(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Tally webhook active',
    timestamp: new Date().toISOString()
  });
}