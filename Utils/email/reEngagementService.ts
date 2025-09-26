/**
 * RE-ENGAGEMENT EMAIL SERVICE
 * Sends re-engagement emails to inactive users
 */

import { Resend } from 'resend';
import { getReEngagementCandidates, markReEngagementSent } from '../engagementTracker';
import { generateReEngagementEmail, generateReEngagementSubject } from './reEngagementTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ReEngagementResult {
  success: boolean;
  emailsSent: number;
  errors: string[];
}

/**
 * Send re-engagement emails to inactive users
 */
export async function sendReEngagementEmails(): Promise<ReEngagementResult> {
  console.log('🔄 Starting re-engagement email process...');
  
  const result: ReEngagementResult = {
    success: true,
    emailsSent: 0,
    errors: []
  };

  try {
    // Get users who need re-engagement
    const candidates = await getReEngagementCandidates();
    
    if (candidates.length === 0) {
      console.log('✅ No users need re-engagement emails');
      return result;
    }

    console.log(`📧 Found ${candidates.length} users for re-engagement`);

    // Send emails to each candidate
    for (const user of candidates) {
      try {
        await sendReEngagementEmail(user);
        await markReEngagementSent(user.email);
        result.emailsSent++;
        console.log(`✅ Re-engagement email sent to ${user.email}`);
      } catch (error) {
        const errorMessage = `Failed to send re-engagement email to ${user.email}: ${error}`;
        console.error(`❌ ${errorMessage}`);
        result.errors.push(errorMessage);
        result.success = false;
      }
    }

    console.log(`📊 Re-engagement complete: ${result.emailsSent} emails sent, ${result.errors.length} errors`);
    
  } catch (error) {
    const errorMessage = `Re-engagement process failed: ${error}`;
    console.error(`❌ ${errorMessage}`);
    result.errors.push(errorMessage);
    result.success = false;
  }

  return result;
}

/**
 * Send a single re-engagement email
 */
async function sendReEngagementEmail(user: {
  email: string;
  full_name: string | null;
}): Promise<void> {
  const unsubscribeUrl = `https://www.getjobping.com/api/unsubscribe/one-click?email=${encodeURIComponent(user.email)}`;
  
  const emailData = {
    to: user.email,
    userName: user.full_name || 'there',
    unsubscribeUrl
  };

  const html = generateReEngagementEmail(emailData);
  const subject = generateReEngagementSubject(user.full_name || undefined);

  const { error } = await resend.emails.send({
    from: 'JobPing <hello@getjobping.com>',
    to: [user.email],
    subject,
    html
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

/**
 * Check if re-engagement emails should be sent (run this as a cron job)
 */
export async function shouldRunReEngagement(): Promise<boolean> {
  try {
    const candidates = await getReEngagementCandidates();
    return candidates.length > 0;
  } catch (error) {
    console.error('Error checking re-engagement candidates:', error);
    return false;
  }
}

/**
 * Get re-engagement statistics
 */
export async function getReEngagementStats(): Promise<{
  totalCandidates: number;
  lastRun: string | null;
}> {
  try {
    const candidates = await getReEngagementCandidates();
    
    // In a real implementation, you'd track the last run time
    // For now, we'll return the current count
    return {
      totalCandidates: candidates.length,
      lastRun: null
    };
  } catch (error) {
    console.error('Error getting re-engagement stats:', error);
    return {
      totalCandidates: 0,
      lastRun: null
    };
  }
}
