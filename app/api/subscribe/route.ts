import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const plan = formData.get('plan') as string;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, message: 'Database configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Insert new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          full_name: name,
          subscription_tier: plan,
          active: true,
          email_verified: false,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription successful',
      userId: newUser.id
    });
  } catch (error) {
    console.error('Subscribe endpoint error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
