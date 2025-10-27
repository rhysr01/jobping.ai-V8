import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/Utils/supabase';
import { asyncHandler, ValidationError } from '@/lib/errors';

export const POST = asyncHandler(async (request: NextRequest) => {
  const { email } = await request.json();
  
  if (!email) {
    throw new ValidationError('Email is required');
  }

  const supabase = getSupabaseClient();

  console.log(`  Processing data deletion request for: ${email}`);

  // Delete user data from all relevant tables
  const deletions = await Promise.allSettled([
    // Delete user matches
    supabase
      .from('user_matches')
      .delete()
      .eq('user_email', email),
    
    // Delete user feedback
    supabase
      .from('user_feedback')
      .delete()
      .eq('user_email', email),
    
    // Delete feedback learning data
    supabase
      .from('feedback_learning_data')
      .delete()
      .eq('user_email', email),
    
    // Delete user feedback insights
    supabase
      .from('user_feedback_insights')
      .delete()
      .eq('user_email', email),
    
    // Delete email sends
    supabase
      .from('email_sends')
      .delete()
      .eq('user_email', email),
    
    // Delete email tracking
    supabase
      .from('email_tracking')
      .delete()
      .eq('user_email', email),
    
    // Delete match logs
    supabase
      .from('match_logs')
      .delete()
      .eq('user_email', email),
    
    // Finally, delete the user
    supabase
      .from('users')
      .delete()
      .eq('email', email)
  ]);

  // Log deletion results
  const results = deletions.map((result, index) => {
    const tableNames = [
      'user_matches', 'user_feedback', 'feedback_learning_data', 
      'user_feedback_insights', 'email_sends', 'email_tracking', 
      'match_logs', 'users'
    ];
    
    if (result.status === 'fulfilled') {
      const count = (result.value.data as any)?.length || 0;
      console.log(` Deleted from ${tableNames[index]}: ${count} records`);
      return { table: tableNames[index], success: true, count: count };
    } else {
      console.error(` Failed to delete from ${tableNames[index]}:`, result.reason);
      return { table: tableNames[index], success: false, error: result.reason };
    }
  });

  const successfulDeletions = results.filter(r => r.success);
  const failedDeletions = results.filter(r => !r.success);

  console.log(` Data deletion summary: ${successfulDeletions.length} successful, ${failedDeletions.length} failed`);

  if (failedDeletions.length > 0) {
    console.warn('  Some deletions failed:', failedDeletions);
  }

  // Return success even if some deletions failed (partial success is acceptable)
  return NextResponse.json({ 
    success: true, 
    message: 'User data deletion completed',
    summary: {
      totalTables: results.length,
      successful: successfulDeletions.length,
      failed: failedDeletions.length,
      details: results
    }
  });
});

// Also support GET for data deletion form
export const GET = asyncHandler(async () => {
  return NextResponse.json({
    message: 'Data deletion endpoint',
    usage: 'Send POST request with { "email": "user@example.com" }',
    note: 'This will permanently delete all user data'
  });
});
