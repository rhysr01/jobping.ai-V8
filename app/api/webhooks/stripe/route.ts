import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/Utils/stripe';
import { getProductionRateLimiter } from '@/Utils/productionRateLimiter';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function getSupabaseClient() {
  // Only initialize during runtime, not build time
  if (typeof window !== 'undefined') {
    throw new Error('Supabase client should only be used server-side');
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(req: NextRequest) {
  // PRODUCTION: Rate limiting for Stripe webhooks (high limit, but still protected)
  const rateLimitResult = await getProductionRateLimiter().middleware(req, 'webhooks-stripe');
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  try {
    // Verify webhook signature
    const event = constructWebhookEvent(body, signature);
    const supabase = getSupabaseClient();

    console.log(`¦ Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabase);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription, supabase);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, supabase);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice, supabase);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, supabase);
        // Trigger automated payment recovery
        if (invoice.id) {
          await handlePaymentRecovery(invoice, supabase);
        }
        break;
      }

      default:
        console.log(` Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error(' Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any) {
  const { userId, email } = session.metadata || {};
  
  if (!userId || !email) {
    console.error(' Missing metadata in checkout session');
    return;
  }

  console.log(` Checkout completed for user: ${email}`);

  // Update user subscription status
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: 'premium',
      subscription_active: true,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
    })
    .eq('email', email);

  if (error) {
    console.error(' Failed to update user subscription:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  const { userId, email } = subscription.metadata || {};
  
  if (!userId || !email) {
    console.error(' Missing metadata in subscription');
    return;
  }

  console.log(` Subscription created for user: ${email}`);

  // Update user subscription status
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: 'premium',
      subscription_active: true,
      subscription_expires_at: new Date((subscription as any).current_period_end * 1000).toISOString(),
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
    })
    .eq('email', email);

  if (error) {
    console.error(' Failed to update user subscription:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  const { userId, email } = subscription.metadata || {};
  
  if (!userId || !email) {
    console.error(' Missing metadata in subscription');
    return;
  }

  console.log(` Subscription updated for user: ${email}`);

  const isActive = subscription.status === 'active';
  const expiresAt = new Date((subscription as any).current_period_end * 1000).toISOString();

  // Update user subscription status
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: isActive ? 'premium' : 'free',
      subscription_active: isActive,
      subscription_expires_at: expiresAt,
    })
    .eq('email', email);

  if (error) {
    console.error(' Failed to update user subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  const { userId, email } = subscription.metadata || {};
  
  if (!userId || !email) {
    console.error(' Missing metadata in subscription');
    return;
  }

  console.log(` Subscription cancelled for user: ${email}`);

  // Downgrade user to free tier
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_active: false,
      subscription_expires_at: null,
    })
    .eq('email', email);

  if (error) {
    console.error(' Failed to update user subscription:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  if (!(invoice as any).subscription) return;

  console.log(` Payment succeeded for subscription: ${(invoice as any).subscription}`);

  // Get subscription details
  const { data: subscription } = await supabase
    .from('users')
    .select('email')
    .eq('stripe_subscription_id', (invoice as any).subscription)
    .single();

  if (subscription) {
    console.log(` Payment processed for user: ${subscription.email}`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  if (!(invoice as any).subscription) return;

  console.log(` Payment failed for subscription: ${(invoice as any).subscription}`);

  // Get subscription details and potentially downgrade user
  const { data: subscription, error } = await supabase
    .from('users')
    .select('email')
    .eq('stripe_subscription_id', (invoice as any).subscription)
    .single();

  if (subscription) {
    console.log(` Payment failed for user: ${subscription.email}`);
    
    // Update subscription status to past_due
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', (invoice as any).subscription);
    
    // Optionally downgrade user to free tier after multiple failed payments
    // This would depend on your business logic
  }
}

async function handlePaymentRecovery(invoice: Stripe.Invoice, supabase: any) {
  try {
    console.log(` Initiating payment recovery for invoice: ${invoice.id}`);
    
    if (!(invoice as any).subscription) {
      console.warn('No subscription ID found for payment recovery');
      return;
    }

    // Get user email for notification
    const { data: subscription } = await supabase
      .from('users')
      .select('email')
      .eq('stripe_subscription_id', (invoice as any).subscription)
      .single();

    if (!subscription) {
      console.warn('No user found for subscription:', (invoice as any).subscription);
      return;
    }

    // Send payment recovery email
    await sendPaymentRecoveryEmail(subscription.email, invoice);
    
    console.log(` Payment recovery email sent to: ${subscription.email}`);
    
  } catch (error) {
    console.error('Error in payment recovery:', error);
  }
}

async function sendPaymentRecoveryEmail(userEmail: string, invoice: Stripe.Invoice) {
  try {
    // This would integrate with your email service (Resend, SendGrid, etc.)
    console.log(` Sending payment recovery email to ${userEmail} for invoice ${invoice.id}`);
    
    // Example implementation with Resend (you'd need to import and configure)
    // await resend.emails.send({
    //   from: 'billing@getjobping.com',
    //   to: userEmail,
    //   subject: 'Payment Failed - Action Required',
    //   html: `<p>Your payment failed. Please update your payment method.</p>`
    // });
    
  } catch (error) {
    console.error('Failed to send payment recovery email:', error);
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. This endpoint is designed for POST requests only.'
  }, { status: 405 });
}
