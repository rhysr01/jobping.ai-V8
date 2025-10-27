import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    
    // Log the webhook event for debugging
    console.log('[RESEND_WEBHOOK]', {
      type: event.type,
      id: event.id,
      timestamp: new Date().toISOString(),
      data: event.data
    });
    
    // TODO: Persist event.id, event.type, event.data to logs/DB
    // This helps track delivery status and debug issues
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[RESEND_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
