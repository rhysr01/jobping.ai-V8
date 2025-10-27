import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../../../../lib/auth';
import { asyncHandler, AppError } from '@/lib/errors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuration
const BATCH_SIZE = parseInt(process.env.EMAIL_BATCH_SIZE || '5');
const MAX_PROCESSING_TIME = parseInt(process.env.MAX_PROCESSING_TIME || '25000'); // 25 seconds (Vercel limit)

const processEmailQueueHandler = asyncHandler(async (_request: NextRequest) => {
  const startTime = Date.now();
  
  console.log(' Starting cron email queue processing...');
  
  // Get pending email jobs
  const { data: jobs, error: fetchError } = await supabase
    .from('job_queue')
    .select('*')
    .eq('type', 'email_send')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error(' Error fetching email jobs:', fetchError);
    throw new AppError('Failed to fetch jobs', 500, 'DB_FETCH_ERROR', { details: fetchError.message });
  }

  if (!jobs || jobs.length === 0) {
    console.log(' No pending email jobs to process');
    return NextResponse.json({ 
      message: 'No jobs to process',
      processed: 0,
      duration: Date.now() - startTime
    });
  }

  console.log(` Processing ${jobs.length} email jobs...`);
  
  let processed = 0;
  let failed = 0;

  // Process each job
  for (const job of jobs) {
    // Check if we're running out of time
    if (Date.now() - startTime > MAX_PROCESSING_TIME) {
      console.log(' Time limit reached, stopping processing');
      break;
    }

    try {
      // Mark as processing
      await supabase
        .from('job_queue')
        .update({ status: 'processing' })
        .eq('id', job.id);

      // Process the email job
      const { userEmail, jobs: jobData } = job.payload;
      
      // Import email service dynamically
      const { sendMatchedJobsEmail } = await import('../../../../Utils/email/optimizedSender');
      
      await sendMatchedJobsEmail({
        to: userEmail,
        jobs: jobData,
        personalization: {
          role: 'Software Developer', // TODO: Get from user preferences
          location: 'Europe',
          salaryRange: '‚¬40k+'
        }
      });

      // Mark as completed
      await supabase
        .from('job_queue')
        .update({ 
          status: 'completed',
          result: { emailsSent: 1 },
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      processed++;
      console.log(` Completed email job ${job.id} for ${userEmail}`);

    } catch (error) {
      console.error(` Failed to process email job ${job.id}:`, error);
      
      // Handle failure with retry logic
      const newAttempts = (job.attempts || 0) + 1;
      const maxAttempts = job.max_attempts || 3;
      
      if (newAttempts >= maxAttempts) {
        // Max attempts reached, mark as failed
        await supabase
          .from('job_queue')
          .update({ 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
        
        console.error(` Job ${job.id} failed permanently after ${newAttempts} attempts`);
      } else {
        // Retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, newAttempts), 300000); // Max 5 minutes
        const retryTime = new Date(Date.now() + retryDelay);
        
        await supabase
          .from('job_queue')
          .update({
            attempts: newAttempts,
            status: 'retrying',
            scheduled_for: retryTime.toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', job.id);
        
        console.log(` Job ${job.id} will retry in ${retryDelay}ms (attempt ${newAttempts}/${maxAttempts})`);
      }
      
      failed++;
    }
  }

  const duration = Date.now() - startTime;
  console.log(` Email queue processing complete: ${processed} processed, ${failed} failed in ${duration}ms`);

  return NextResponse.json({
    message: 'Email queue processing complete',
    processed,
    failed,
    total: jobs.length,
    duration
  });
});

// Export with auth wrapper
export const GET = withAuth(processEmailQueueHandler, {
  requireSystemKey: true,
  allowedMethods: ['GET'],
  rateLimit: true
});

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
