import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/Utils/supabase';

/**
 * Job redirect endpoint
 * Redirects users to actual job URLs while tracking clicks
 * Fixes "content blocked" errors from job boards
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobHash = searchParams.get('job');
    const userEmail = searchParams.get('email');

    if (!jobHash) {
      return NextResponse.json({ error: 'Missing job parameter' }, { status: 400 });
    }

    // Fetch job URL from database
    const supabase = getSupabaseClient();
    const { data: job, error } = await supabase
      .from('jobs')
      .select('job_url, title, company')
      .eq('job_hash', jobHash)
      .single();

    if (error || !job || !job.job_url) {
      console.error('Job not found:', jobHash, error);
      return NextResponse.redirect('https://getjobping.com?error=job-not-found');
    }

    // Optional: Track click analytics
    if (userEmail) {
      console.log(` Job click: ${userEmail} † ${job.title} at ${job.company}`);
      // Could save to analytics table here
    }

    // Redirect to actual job URL with headers to bypass blocking
    return NextResponse.redirect(job.job_url, {
      headers: {
        'Referrer-Policy': 'no-referrer-when-downgrade',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.redirect('https://getjobping.com?error=redirect-failed');
  }
}

