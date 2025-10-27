//  EMAIL SENDER - PRODUCTION READY

import { getResendClient, EMAIL_CONFIG, assertValidFrom } from './clients';

// Welcome email sender
export async function sendWelcomeEmail(args: { to: string; userName?: string; matchCount: number; tier?: 'free' | 'premium'; }) {
  const resend = getResendClient();
  
  const textContent = `Welcome to JobPing!\n\nYour first ${args.matchCount} job matches will arrive within 48 hours.\n\nBest regards,\nThe JobPing Team`;
  const htmlContent = `<h1>Welcome to JobPing!</h1><p>Your first ${args.matchCount} job matches will arrive within 48 hours.</p><p>Best regards,<br>The JobPing Team</p>`;
  
  assertValidFrom(EMAIL_CONFIG.from);
  
  return resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: [args.to],
    subject: `Welcome to JobPing - Your First ${args.matchCount} Matches Arriving Soon!`,
    text: textContent,
    html: htmlContent,
  });
}

// Job matches email sender
export async function sendMatchedJobsEmail(args: {
  to: string;
  jobs: any[];
  userName?: string;
  subscriptionTier?: 'free' | 'premium';
  isSignupEmail?: boolean;
  subjectOverride?: string;
}) {
  const resend = getResendClient();
  
  const subject = args.subjectOverride || `Your ${args.jobs.length} New Job Matches - JobPing`;
  const textContent = `Hi ${args.userName || 'there'},\n\nHere are your latest job matches:\n\n${args.jobs.map((job, i) => `${i + 1}. ${job.title} at ${job.company}`).join('\n')}`;
  const htmlContent = `<h1>Your Job Matches</h1><p>Hi ${args.userName || 'there'},</p><p>Here are your latest job matches:</p><ul>${args.jobs.map(job => `<li><strong>${job.title}</strong> at ${job.company}</li>`).join('')}</ul>`;
  
  assertValidFrom(EMAIL_CONFIG.from);
  
  return resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: [args.to],
    subject,
    text: textContent,
    html: htmlContent,
  });
}

// Batch email sender for multiple recipients
export async function sendBatchEmails(
  emails: Array<{
    to: string;
    jobs: any[];
    userName?: string;
    subscriptionTier?: 'free' | 'premium';
    isSignupEmail?: boolean;
  }>,
  concurrency: number = 3
): Promise<any[]> {
  const results: any[] = [];
  
  // Process emails in batches for controlled concurrency
  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency);
    const batchPromises = batch.map(emailData => 
      sendMatchedJobsEmail(emailData).catch(error => ({
        error: error.message,
        email: emailData.to,
        status: 'failed'
      }))
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    ));
    
    // Small delay between batches to avoid overwhelming the email service
    if (i + concurrency < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// Performance monitoring
// Note: EMAIL_CACHE removed - using optimizedSender for email sending
export const EMAIL_PERFORMANCE_METRICS = {
  cacheHitRate: () => '0%',
  cacheSize: () => 0,
  clearCache: () => {},
  getCacheStats: () => ({
    size: 0,
    hitRate: '0%',
    ttl: '0s'
  })
};
