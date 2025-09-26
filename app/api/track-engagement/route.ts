/**
 * EMAIL ENGAGEMENT TRACKING ENDPOINT
 * Tracks email opens and clicks for engagement scoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateUserEngagement } from '@/Utils/engagementTracker';
import { extractOriginalUrl } from '@/Utils/email/engagementTracking';

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json();
    
    if (!email || !type) {
      return NextResponse.json({ 
        error: 'Email and type are required' 
      }, { status: 400 });
    }

    if (!['email_opened', 'email_clicked'].includes(type)) {
      return NextResponse.json({ 
        error: 'Type must be email_opened or email_clicked' 
      }, { status: 400 });
    }

    // Update user engagement
    await updateUserEngagement(email, type as 'email_opened' | 'email_clicked');
    
    console.log(`✅ Tracked ${type} for ${email}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Engagement tracked: ${type}` 
    });

  } catch (error) {
    console.error('❌ Failed to track engagement:', error);
    return NextResponse.json({
      error: 'Failed to track engagement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type');
    const url = searchParams.get('url');
    
    if (!email || !type) {
      return NextResponse.json({ 
        error: 'Email and type are required' 
      }, { status: 400 });
    }

    if (!['email_opened', 'email_clicked'].includes(type)) {
      return NextResponse.json({ 
        error: 'Type must be email_opened or email_clicked' 
      }, { status: 400 });
    }

    // Update user engagement
    await updateUserEngagement(email, type as 'email_opened' | 'email_clicked');
    
    console.log(`✅ Tracked ${type} for ${email}`);
    
    // For click tracking, redirect to the original URL
    if (type === 'email_clicked' && url) {
      const originalUrl = decodeURIComponent(url);
      return NextResponse.redirect(originalUrl);
    }
    
    // For open tracking, return a 1x1 transparent pixel
    if (type === 'email_opened') {
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      
      return new NextResponse(pixel, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Engagement tracked: ${type}` 
    });

  } catch (error) {
    console.error('❌ Failed to track engagement:', error);
    return NextResponse.json({
      error: 'Failed to track engagement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
