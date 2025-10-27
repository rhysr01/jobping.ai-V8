//  OPTIMIZED EMAIL SENDER - PRODUCTION READY

// Deprecated: prefer optimizedSender with personalization. Keep compatibility by delegating.
import { sendMatchedJobsEmail as optimizedSendMatched, sendWelcomeEmail as optimizedSendWelcome } from './optimizedSender';

// Optimized welcome email sender
export async function sendWelcomeEmail(args: { to: string; userName?: string; matchCount: number; tier?: 'free' | 'premium'; }) {
  return optimizedSendWelcome(args);
}

// Optimized job matches email sender
export async function sendMatchedJobsEmail(args: {
  to: string;
  jobs: any[];
  userName?: string;
  subscriptionTier?: 'free' | 'premium';
  isSignupEmail?: boolean;
  subjectOverride?: string;
  personalization?: {
    role?: string;
    location?: string;
    salaryRange?: string;
    dayText?: string;
    entryLevelLabel?: string;
  };
}) {
  return optimizedSendMatched(args);
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
