import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, STRIPE_CONFIG } from '@/Utils/stripe';
import { productionRateLimiter } from '@/Utils/productionRateLimiter';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: NextRequest) {
  // PRODUCTION: Rate limiting for payment checkout (prevent abuse)
  const rateLimitResult = await productionRateLimiter.middleware(req, 'create-checkout-session');
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { email, priceId, userId } = await req.json();

    // Validate required fields
    if (!email || !priceId || !userId) {
      return NextResponse.json({
        error: 'Missing required fields: email, priceId, userId'
      }, { status: 400 });
    }

    // Validate price ID
    const validPriceIds = Object.values(STRIPE_CONFIG.PRODUCTS);
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json({
        error: 'Invalid price ID'
      }, { status: 400 });
    }

    // Verify user exists and is email verified
    const supabase = getSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('email_verified', true)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        error: 'User not found or email not verified'
      }, { status: 404 });
    }

    // Create checkout session
    const session = await createCheckoutSession({
      email,
      priceId,
      userId,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Failed to create checkout session:', error);
    return NextResponse.json({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. This endpoint is designed for POST requests only.'
  }, { status: 405 });
}
