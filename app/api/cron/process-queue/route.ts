//  CRON-TRIGGERED QUEUE PROCESSING
// Processes N jobs per call - no setInterval workers
// Handles cold starts and scales automatically

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processEmailQueue } from '../../../../Utils/email/queueProcessor';
import { withAuth } from '../../../../lib/auth';
import { asyncHandler, AppError } from '@/lib/errors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuration
const BATCH_SIZE = parseInt(process.env.QUEUE_BATCH_SIZE || '10');
const MAX_PROCESSING_TIME = parseInt(process.env.MAX_PROCESSING_TIME || '25000'); // 25 seconds (Vercel limit)

const processQueueHandler = asyncHandler(async (_request: NextRequest) => {
  const startTime = Date.now();
  
  console.log(' Starting cron queue processing...');

  // Get pending batches from match_batch table
  const { data: pendingBatches, error: batchError } = await supabase
    .from('match_batch')
    .select('*')
    .eq('batch_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (batchError) {
    console.error(' Error fetching pending batches:', batchError);
    throw new AppError('Database error', 500, 'DB_FETCH_ERROR', { error: batchError.message });
  }

  if (!pendingBatches || pendingBatches.length === 0) {
    console.log(' No pending batches to process');
    return NextResponse.json({ 
      processed: 0, 
      message: 'No pending batches',
      duration: Date.now() - startTime
    });
  }

  console.log(`¦ Processing ${pendingBatches.length} batches...`);

  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;

  // Process each batch
  for (const batch of pendingBatches) {
    // Check if we're approaching time limit
    if (Date.now() - startTime > MAX_PROCESSING_TIME) {
      console.log(' Approaching time limit, stopping processing');
      break;
    }

    try {
      // Mark batch as processing
      await supabase
        .from('match_batch')
        .update({ 
          batch_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      // Process the email for this batch
      const result = await processEmailQueue(batch);
      
      if (result.success) {
        // Mark as sent
        await supabase
          .from('match_batch')
          .update({ 
            batch_status: 'sent',
            email_sent_at: new Date().toISOString(),
            matches_count: result.matchesCount || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', batch.id);

        successCount++;
        console.log(` Batch ${batch.id} processed successfully`);
      } else {
        // Mark as failed
        await supabase
          .from('match_batch')
          .update({ 
            batch_status: 'failed',
            error_message: result.error || 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', batch.id);

        errorCount++;
        console.log(` Batch ${batch.id} failed:`, result.error);
      }

      processedCount++;

    } catch (error) {
      console.error(` Error processing batch ${batch.id}:`, error);
      
      // Mark as failed
      await supabase
        .from('match_batch')
        .update({ 
          batch_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      errorCount++;
      processedCount++;
    }
  }

  const duration = Date.now() - startTime;
  const response = {
    processed: processedCount,
    successful: successCount,
    failed: errorCount,
    duration,
    message: `Processed ${processedCount} batches in ${duration}ms`
  };

  console.log(' Queue processing complete:', response);
  return NextResponse.json(response);
});

// Export with auth wrapper
export const GET = withAuth(processQueueHandler, {
  requireSystemKey: true,
  allowedMethods: ['GET'],
  rateLimit: true
});

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
