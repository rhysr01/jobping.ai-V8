import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailVerificationOracle } from '@/Utils/emailVerification';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token required' }, 
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const result = await EmailVerificationOracle.verifyEmail(token, supabase);
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });
    
  } catch (error) {
    console.error('❌ Verify email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Email verification endpoint active',
    method: 'POST',
    required: { token: 'string' }
  });
}
