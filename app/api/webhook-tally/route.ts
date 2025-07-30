import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL! as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY! as string
);

// Type for Tally webhook payload
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

// User registration data extracted from Tally form
type UserRegistrationData = {
  email: string;
  fullName?: string;
  university?: string;
  graduationYear?: string;
  preferredRole?: string;
  skills?: string[];
  locationPreference?: string;
  workEnvironmentPreference?: 'remote' | 'hybrid' | 'on-site' | 'any';
  plan?: 'free' | 'premium';
};

export async function POST(req: NextRequest) {
  try {
    // Verify webhook authenticity (add proper verification in production)
    const signature = req.headers.get('tally-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const payload: TallyWebhookData = await req.json();
    
    console.log('📝 Received Tally webhook:', payload.eventType);

    // Only process form submissions
    if (payload.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ message: 'Event type not handled' });
    }

    // Extract user data from Tally form fields
    const userData = extractUserDataFromTallyFields(payload.data.fields);
    
    if (!userData.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      console.log(`👤 User ${userData.email} already exists, updating preferences`);
      
      // Update existing user preferences
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: userData.fullName,
          university: userData.university,
          graduation_year: userData.graduationYear,
          preferred_role: userData.preferredRole,
          skills: userData.skills,
          location_preference: userData.locationPreference,
          work_environment_preference: userData.workEnvironmentPreference,
          plan: userData.plan,
          updated_at: new Date().toISOString(),
        })
        .eq('email', userData.email);

      if (updateError) {
        console.error('❌ Failed to update user:', updateError);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }
    } else {
      console.log(`✨ Creating new user: ${userData.email}`);
      
      // Create new user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          full_name: userData.fullName,
          university: userData.university,
          graduation_year: userData.graduationYear,
          preferred_role: userData.preferredRole,
          skills: userData.skills,
          location_preference: userData.locationPreference,
          work_environment_preference: userData.workEnvironmentPreference,
          plan: userData.plan || 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('❌ Failed to create user:', insertError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    // Optionally trigger initial job matching for the user
    if (process.env.NODE_ENV === 'production') {
      try {
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000';
        
        await fetch(`${baseUrl}/api/match-users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: userData.email, limit: 10 }),
        });
        
        console.log(`🎯 Triggered initial matching for ${userData.email}`);
      } catch (matchError) {
        console.error('⚠️ Failed to trigger initial matching:', matchError);
        // Don't fail the webhook if matching fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      user: userData.email 
    });

  } catch (error: unknown) {
    console.error('🚨 Webhook processing error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Unknown server error' }, { status: 500 });
  }
}

// Extract user data from Tally form fields
function extractUserDataFromTallyFields(fields: TallyWebhookData['data']['fields']): UserRegistrationData {
  const userData: UserRegistrationData = { email: '' };
  
  fields.forEach(field => {
    const value = Array.isArray(field.value) ? field.value.join(', ') : field.value;
    
    // Map Tally field keys to user data (adjust based on your actual form structure)
    switch (field.key.toLowerCase()) {
      case 'email':
      case 'email_address':
        userData.email = value;
        break;
      case 'full_name':
      case 'name':
        userData.fullName = value;
        break;
      case 'university':
      case 'school':
        userData.university = value;
        break;
      case 'graduation_year':
      case 'grad_year':
        userData.graduationYear = value;
        break;
      case 'preferred_role':
      case 'role':
        userData.preferredRole = value;
        break;
      case 'skills':
        userData.skills = Array.isArray(field.value) ? field.value : [value];
        break;
      case 'location':
      case 'location_preference':
        userData.locationPreference = value;
        break;
      case 'work_environment':
      case 'remote_preference':
        userData.workEnvironmentPreference = value as 'remote' | 'hybrid' | 'on-site' | 'any';
        break;
      case 'plan':
      case 'pricing_plan':
        userData.plan = value as 'free' | 'premium';
        break;
    }
  });
  
  return userData;
}
