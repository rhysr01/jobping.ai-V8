/**
 * RE-ENGAGEMENT EMAIL SERVICE
 * Sends re-engagement emails to inactive users
 */

import { Resend } from 'resend';
import { getReEngagementCandidates, markReEngagementSent } from '../engagementTracker';
import { getResendClient, EMAIL_CONFIG, assertValidFrom } from './clients';
import { getUnsubscribeUrl } from '../url-helpers';
// import { generateReEngagementEmail, generateReEngagementSubject } from './reEngagementTemplate';

export interface ReEngagementResult {
  success: boolean;
  emailsSent: number;
  errors: string[];
}

/**
 * Send re-engagement emails to inactive users
 */
export async function sendReEngagementEmails(): Promise<ReEngagementResult> {
  console.log(' Starting re-engagement email process...');
  
  const result: ReEngagementResult = {
    success: true,
    emailsSent: 0,
    errors: []
  };

  try {
    // Get users who need re-engagement
    const candidates = await getReEngagementCandidates();
    
    if (candidates.length === 0) {
      console.log(' No users need re-engagement emails');
      return result;
    }

    console.log(` Found ${candidates.length} users for re-engagement`);

    // Send emails to each candidate
    for (const user of candidates) {
      try {
        await sendReEngagementEmail(user);
        await markReEngagementSent(user.email);
        result.emailsSent++;
        console.log(` Re-engagement email sent to ${user.email}`);
      } catch (error) {
        const errorMessage = `Failed to send re-engagement email to ${user.email}: ${error}`;
        console.error(` ${errorMessage}`);
        result.errors.push(errorMessage);
        result.success = false;
      }
    }

    console.log(` Re-engagement complete: ${result.emailsSent} emails sent, ${result.errors.length} errors`);
    
  } catch (error) {
    const errorMessage = `Re-engagement process failed: ${error}`;
    console.error(` ${errorMessage}`);
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
  const unsubscribeUrl = getUnsubscribeUrl(user.email);
  
  const emailData = {
    to: user.email,
    userName: user.full_name || 'there',
    unsubscribeUrl
  };

  const html = `<h1>We Miss You!</h1><p>Hi ${emailData.userName}, we haven't seen you in a while. Check out these new opportunities!</p>`;
  const subject = `We Miss You - New Opportunities Await!`;

  const resend = getResendClient();
  const fromAddress = EMAIL_CONFIG.from;
  assertValidFrom(fromAddress);

  const { error } = await resend.emails.send({
    from: fromAddress,
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
