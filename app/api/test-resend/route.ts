import { NextRequest, NextResponse } from 'next/server';
import { getResendClient, EMAIL_CONFIG, assertValidFrom } from '@/Utils/email/clients';

export const GET = async (req: NextRequest) => {
  console.log('=== RESEND TEST START ===');
  
  const resend = getResendClient();
  const url = new URL(req.url);
  const testRecipient = url.searchParams.get('to') || 'delivered@resend.dev';
  
  // Test 1: Basic API key validation
  let apiKeyTest = {
    success: false,
    error: null as any,
    details: ''
  };
  
  try {
    // Try to get domains to test API key
    const domains = await resend.domains.list();
    apiKeyTest.success = true;
    apiKeyTest.details = `Found ${Array.isArray(domains.data) ? domains.data.length : 0} domains`;
    console.log('✅ API Key valid, domains:', domains.data);
    
    // Check if getjobping.com is verified
    const domainsList = Array.isArray(domains.data) ? domains.data : [];
    const getjobpingDomain = domainsList.find((d: any) => d.name === 'getjobping.com');
    if (getjobpingDomain) {
      apiKeyTest.details += ` | getjobping.com verified: ${getjobpingDomain.status === 'verified'}`;
    } else {
      apiKeyTest.details += ' | getjobping.com NOT FOUND in domains';
    }
  } catch (error: any) {
    apiKeyTest.success = false;
    apiKeyTest.error = error.message;
    console.error('❌ API Key test failed:', error);
  }
  
  // Test 2: Send actual email
  let emailTest = {
    success: false,
    error: null as any,
    emailId: null as string | null,
    details: ''
  };
  
  try {
    console.log('Testing email send with config:', EMAIL_CONFIG);
    console.log('Test recipient:', testRecipient);
    
    // Validate from address before sending
    assertValidFrom(EMAIL_CONFIG.from);
    
    const payload = {
      from: EMAIL_CONFIG.from,
      to: [testRecipient],
      subject: 'JobPing Test Email - Domain Verification',
      html: `
        <h1>🎉 Resend Test Successful!</h1>
        <p>This email confirms that:</p>
        <ul>
          <li>✅ API key is valid</li>
          <li>✅ Domain (${EMAIL_CONFIG.from}) is verified</li>
          <li>✅ Email sending is working</li>
        </ul>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> ${EMAIL_CONFIG.from}</p>
        <p><strong>To:</strong> ${testRecipient}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
      `,
    };
    
    const { data, error } = await resend.emails.send(payload);
    
    if (error) {
      emailTest.error = error;
      console.error('❌ Email send failed:', error);
    } else {
      emailTest.success = true;
      emailTest.emailId = data?.id || null;
      emailTest.details = `Email sent successfully to ${testRecipient}`;
      console.log('✅ Email sent successfully:', data);
    }
  } catch (error: any) {
    const status = error?.status ?? 'unknown';
    const rid = error?.response?.headers?.get?.('x-resend-request-id') ?? 'n/a';
    const body = await error?.response?.json?.().catch(() => error?.message);
    console.error('[RESEND_ERROR]', { status, requestId: rid, body, payloadFrom: EMAIL_CONFIG.from });
    
    emailTest.error = error.message;
    console.error('❌ Email send exception:', error);
  }
  
  // Test 3: Environment variables
  const envTest = {
    hasApiKey: !!process.env.RESEND_API_KEY,
    apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
    apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) || 'none',
    emailDomain: process.env.EMAIL_DOMAIN || 'getjobping.com',
    fromAddress: EMAIL_CONFIG.from,
    environment: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
    allResendVars: Object.keys(process.env).filter(k => k.includes('RESEND'))
  };
  
  console.log('=== RESEND TEST END ===');
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {
      apiKey: apiKeyTest,
      email: emailTest,
      environment: envTest
    },
    summary: {
      apiKeyWorking: apiKeyTest.success,
      emailSending: emailTest.success,
      domainVerified: emailTest.success, // If email sends, domain is verified
      overallStatus: apiKeyTest.success && emailTest.success ? 'SUCCESS' : 'FAILED'
    }
  });
};
