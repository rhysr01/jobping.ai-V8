import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { asyncHandler, AppError } from '@/lib/errors';

export const GET = asyncHandler(async (_req: NextRequest) => {
  // Check if API key exists
  if (!process.env.RESEND_API_KEY) {
    throw new AppError('RESEND_API_KEY not configured', 500, 'CONFIG_ERROR');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  // Send a test email
  const { data, error } = await resend.emails.send({
    from: 'JobPing <hello@getjobping.com>',
    to: ['delivered@resend.dev'], // Resend test email
    subject: 'Test Email from JobPing',
    html: '<h1>Test Email</h1><p>If you see this, your email is working!</p>',
  });

  if (error) {
    console.error('Email error:', error);
    throw new AppError('Failed to send email', 500, 'EMAIL_SEND_ERROR', { error });
  }

  return NextResponse.json({ 
    success: true,
    message: 'Test email sent successfully!',
    emailId: data?.id,
    note: 'Check https://resend.com/emails for delivery status'
  });
});

