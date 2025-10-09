import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const { email, promoCode } = await req.json();

    if (!email || !promoCode) {
      return NextResponse.json(
        { error: 'Email and promo code required' },
        { status: 400 }
      );
    }

    // Verify promo code is "rhys"
    if (promoCode.toLowerCase() !== 'rhys') {
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, subscription_active')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Update existing user to premium (activate subscription)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to upgrade user' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Upgraded to premium with promo code!' 
      });
    }

    // Create new user with premium tier (subscription active)
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        subscription_active: true,
        email_verified: true,
        target_cities: [], // Required field with default
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Premium activated with promo code!' 
    });

  } catch (error) {
    console.error('Promo code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

