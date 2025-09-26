import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import OpenAI from 'openai';
import { z } from 'zod';
import { getProductionRateLimiter } from '@/Utils/productionRateLimiter';
import { errorResponse } from '@/Utils/errorResponse';
import { validateTallyWebhook, getSecurityHeaders } from '@/Utils/security/webhookSecurity';
import { performMemoryCleanup } from '@/Utils/performance/memoryManager';
import {
  performEnhancedAIMatching
} from '@/Utils/jobMatching';
import {
  generateRobustFallbackMatches
} from '@/Utils/matching';
import {
  logMatchSession
} from '@/Utils/matching/logging.service';
import type { UserPreferences } from '@/Utils/matching/types';
import { sendMatchedJobsEmail, sendWelcomeEmail } from '@/Utils/email';
import { buildPersonalizedSubject } from '@/Utils/email/subjectBuilder';
import { EmailVerificationOracle } from '@/Utils/emailVerification';

// Test mode helper
const isTestMode = () => process.env.NODE_ENV === 'test' || process.env.JOBPING_TEST_MODE === '1';

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
import { getDatabaseClient } from '@/Utils/databasePool';

function getSupabaseClient() {
  // Only initialize during runtime, not build time
  if (typeof window !== 'undefined') {
    throw new Error('Supabase client should only be used server-side');
  }
  
  // Use database pool for connection reuse
  try {
    return getDatabaseClient();
  } catch (error) {
    // In test environment, return a mock client instead of throwing
    if (process.env.NODE_ENV === 'test') {
      console.log('🧪 Test mode: Using mock Supabase client for webhook-tally');
      return {
        from: (_table: string) => ({
          select: (_columns?: string) => ({
            eq: (_column: string, _value: any) => ({
              single: () => Promise.resolve({ data: null, error: null })
            }),
            gte: (_column: string, _value: any) => ({
              order: (_column: string, _options?: any) => ({
                limit: (_count: number) => Promise.resolve({ data: [], error: null })
              })
            }),
            limit: (_count: number) => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: null })
          }),
          upsert: (_data: any) => Promise.resolve({ data: null, error: null }),
          insert: (_data: any) => Promise.resolve({ data: null, error: null }),
          update: (_data: any) => ({
            eq: (_column: string, _value: any) => Promise.resolve({ data: null, error: null })
          })
        })
      };
    }
    throw new Error('Database connection failed: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function getOpenAIClient() {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    // In test environment, return a mock client instead of throwing
    if (process.env.NODE_ENV === 'test') {
      console.log('🧪 Test mode: Using mock OpenAI client for webhook-tally');
      return {
        chat: {
          completions: {
            create: () => Promise.resolve({ choices: [{ message: { content: 'Mock response' } }] })
          }
        }
      } as any;
    }
    throw new Error('Missing OpenAI API key: OPENAI_API_KEY must be set');
  }
  
  return new OpenAI({
    apiKey: openaiKey,
  });
}

// Extract user data with business rules - UPDATED FOR ACTUAL SCHEMA
function extractUserData(fields: NonNullable<TallyWebhookData['data']>['fields'], referrerUrl?: string) {
  console.log('🧪 Test mode: Extracting user data from fields:', fields);
  console.log('🧪 Test mode: Referrer URL:', referrerUrl);
  
  const userData: Record<string, string | string[] | boolean> = { 
    email: ''
  };
  
  fields.forEach((field: any) => {
    if (!field.value) return;
    
    const key = field.key.toLowerCase();
    console.log(`🧪 Test mode: Processing field ${key} with value:`, field.value);
    
    // Map Tally form fields to your actual database columns
    if (key.includes('name')) {
      userData.full_name = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('email')) {
      userData.email = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('location') || key.includes('cities')) {
      // Handle target cities as array (TEXT[] in database)
      if (Array.isArray(field.value)) {
        userData.target_cities = field.value.slice(0, 3); // Max 3 cities
      } else {
        userData.target_cities = [field.value];
      }
    } else if (key.includes('languages')) {
      // Handle languages as array (TEXT[] in database)
      if (Array.isArray(field.value)) {
        userData.languages_spoken = field.value;
      } else {
        userData.languages_spoken = [field.value];
      }
    } else if (key.includes('target_date') || key.includes('employment_start')) {
      userData.target_employment_start_date = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('experience') && !key.includes('level')) {
      // Professional experience level (0, 6 months, 1 year, etc.)
      userData.professional_experience = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('work') && (key.includes('preference') || key.includes('environment'))) {
      // How do you want to work? (Office, Hybrid, Remote)
      userData.work_environment = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('authorization') || key.includes('citizen')) {
      // Work authorization status
      userData.work_authorization = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('entry_level') || key.includes('level_preference')) {
      // Entry-level preference (Internship, Graduate Programme, etc.)
      userData.entry_level_preference = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('companies') || key.includes('target_companies')) {
      // Target companies (TEXT[] in database)
      if (Array.isArray(field.value)) {
        userData.company_types = field.value;
      } else {
        userData.company_types = [field.value];
      }
    } else if (key.includes('career_path') || key.includes('career')) {
      // Career path - normalize to canonical slugs (TEXT[] in database)
      userData.career_path = Array.isArray(field.value) ? field.value : [field.value];
    } else if (key.includes('roles') || key.includes('target_roles')) {
      // Roles selected (JSONB in database)
      if (Array.isArray(field.value)) {
        userData.roles_selected = field.value;
      } else {
        userData.roles_selected = [field.value];
      }
    } else if (key.includes('expertise') || key.includes('background')) {
      userData.professional_expertise = Array.isArray(field.value) ? field.value[0] : field.value;
    } else if (key.includes('start_date') || key.includes('availability')) {
      userData.start_date = Array.isArray(field.value) ? field.value[0] : field.value;
    }
  });

  // Determine subscription tier based on referrer URL
  let subscriptionTier = 'free'; // default
  if (referrerUrl) {
    if (referrerUrl.includes('utm_campaign=premium') || referrerUrl.includes('campaign=premium')) {
      subscriptionTier = 'premium';
    } else if (referrerUrl.includes('utm_campaign=free') || referrerUrl.includes('campaign=free')) {
      subscriptionTier = 'free';
    }
  }
  
  userData.subscriptionTier = subscriptionTier;
  console.log('🧪 Test mode: Final user data:', userData);
  console.log('🧪 Test mode: Subscription tier determined:', subscriptionTier);
  return userData;
}

export async function POST(req: NextRequest) {
  // WEBHOOK DISABLED: Reverted to iframe implementation
  return NextResponse.json({ 
    error: 'Webhook endpoint disabled - using iframe implementation',
    status: 'disabled'
  }, { status: 410 }); // 410 Gone - indicates the resource is no longer available
}

// Test handler for email verification testing
async function handleEmailVerificationTest(req: NextRequest) {
  try {
    const { email, type } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    
    if (type === 'verification') {
      // Test verification email sending
      const token = await EmailVerificationOracle.generateVerificationToken(email);
      const success = await EmailVerificationOracle.sendVerificationEmail(
        email, 
        token, 
        'Test User'
      );
      
      if (success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Verification email sent',
          token: token.substring(0, 8) + '...',
          email 
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to send verification email' 
        }, { status: 500 });
      }
    } else if (type === 'welcome') {
      // Test welcome email sequence
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (user) {
        await sendWelcomeEmail({
          to: email,
          userName: user.full_name || 'there',
          matchCount: 5
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Welcome email sent',
          email 
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'User not found' 
        }, { status: 404 });
      }
    } else {
      return NextResponse.json({ 
        error: 'Invalid test type. Use "verification" or "welcome"' 
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. This endpoint is designed for POST requests only.'
  }, { status: 405 });
}