import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler, ValidationError, AppError } from '@/lib/errors';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const POST = asyncHandler(async (req: NextRequest) => {
  const { email, promoCode } = await req.json();

  if (!email || !promoCode) {
    throw new ValidationError('Email and promo code required');
  }

  // Verify promo code is "rhys"
  if (promoCode.toLowerCase() !== 'rhys') {
    throw new ValidationError('Invalid promo code');
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, subscription_active')
    .eq('email', email)
    .single();

  if (existingUser) {
    // EXISTING USER: Upgrade to premium instantly
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating user:', updateError);
      throw new AppError('Failed to upgrade user', 500, 'DB_UPDATE_ERROR', { error: updateError.message });
    }

    return NextResponse.json({ 
      success: true,
      existingUser: true,
      message: '🎉 Upgraded to premium! You\'re all set.',
      redirectUrl: null // No redirect needed - user already has profile
    });
  }

  // NEW USER: Store promo in session/temp table, redirect to Tally
  // Store the promo code validation in a temporary table or session
  // so Tally webhook can apply it after profile creation
  const { error: tempError } = await supabase
    .from('promo_pending')
    .upsert({
      email,
      promo_code: 'rhys',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      created_at: new Date().toISOString()
    }, {
      onConflict: 'email'
    });

  if (tempError) {
    console.error('Error storing promo pending:', tempError);
    // Don't fail - just log and continue
  }

  // Return redirect URL to Tally form
  const tallyFormUrl = 'https://tally.so/r/mJEqx4';
  
  return NextResponse.json({ 
    success: true,
    existingUser: false,
    message: '✅ Promo code valid! Please complete your profile to activate premium.',
    redirectUrl: `${tallyFormUrl}?email=${encodeURIComponent(email)}&promo=rhys&tier=premium`
  });
});

