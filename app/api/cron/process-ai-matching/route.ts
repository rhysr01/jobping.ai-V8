import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuration
const BATCH_SIZE = parseInt(process.env.AI_MATCHING_BATCH_SIZE || '5');
const MAX_PROCESSING_TIME = parseInt(process.env.MAX_PROCESSING_TIME || '25000'); // 25 seconds (Vercel limit)

const processAIMatchingHandler = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting cron AI matching processing...');
    
    // Get pending AI matching jobs
    const { data: jobs, error: fetchError } = await supabase
      .from('job_queue')
      .select('*')
      .eq('type', 'ai_match')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('❌ Error fetching AI matching jobs:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch jobs',
        details: fetchError.message 
      }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      console.log('✅ No pending AI matching jobs to process');
      return NextResponse.json({ 
        message: 'No jobs to process',
        processed: 0,
        duration: Date.now() - startTime
      });
    }

    console.log(`🤖 Processing ${jobs.length} AI matching jobs...`);
    
    let processed = 0;
    let failed = 0;

    // Process each job
    for (const job of jobs) {
      // Check if we're running out of time
      if (Date.now() - startTime > MAX_PROCESSING_TIME) {
        console.log('⏰ Time limit reached, stopping processing');
        break;
      }

      try {
        // Mark as processing
        await supabase
          .from('job_queue')
          .update({ status: 'processing' })
          .eq('id', job.id);

        // Process the AI matching job
        const { userEmail, jobs: jobData, userPreferences } = job.payload;
        
        // Import AI matching service dynamically
        const { createConsolidatedMatcher } = await import('../../../../Utils/consolidatedMatching');
        
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY not configured');
        }
        
        const matcher = createConsolidatedMatcher(process.env.OPENAI_API_KEY);
        const result = await matcher.performMatching(jobData, userPreferences);

        // Save matches to database
        if (result.matches && result.matches.length > 0) {
          const matchInserts = result.matches.map((match: any) => ({
            user_email: userEmail,
            job_hash: match.job_hash,
            match_score: match.match_score,
            match_reason: match.match_reason,
            matched_at: new Date().toISOString(),
            match_method: result.method || 'ai'
          }));

          const { error: insertError } = await supabase
            .from('matches')
            .insert(matchInserts);

          if (insertError) {
            console.error('❌ Error inserting matches:', insertError);
          }
        }

        // Mark as completed
        await supabase
          .from('job_queue')
          .update({ 
            status: 'completed',
            result: { 
              matches: result.matches?.length || 0, 
              method: result.method 
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        processed++;
        console.log(`✅ Completed AI matching job ${job.id} for ${userEmail}: ${result.matches?.length || 0} matches`);

      } catch (error) {
        console.error(`❌ Failed to process AI matching job ${job.id}:`, error);
        
        // Handle failure with retry logic
        const newAttempts = (job.attempts || 0) + 1;
        const maxAttempts = job.max_attempts || 2;
        
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
          
          console.error(`❌ Job ${job.id} failed permanently after ${newAttempts} attempts`);
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
          
          console.log(`🔄 Job ${job.id} will retry in ${retryDelay}ms (attempt ${newAttempts}/${maxAttempts})`);
        }
        
        failed++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ AI matching processing complete: ${processed} processed, ${failed} failed in ${duration}ms`);

    return NextResponse.json({
      message: 'AI matching processing complete',
      processed,
      failed,
      total: jobs.length,
      duration
    });

  } catch (error) {
    console.error('❌ Cron AI matching processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      duration: Date.now() - startTime
    }, { status: 500 });
  }
};

// Export with auth wrapper
export const GET = withAuth(processAIMatchingHandler, {
  requireSystemKey: true,
  allowedMethods: ['GET'],
  rateLimit: true
});

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
