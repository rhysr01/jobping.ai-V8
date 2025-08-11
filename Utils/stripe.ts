import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

// Stripe configuration
export const STRIPE_CONFIG = {
  // Product IDs - you'll need to create these in your Stripe dashboard
  PRODUCTS: {
    PREMIUM_MONTHLY: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
    PREMIUM_YEARLY: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
  },
  
  // Webhook endpoint secret
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  
  // Success/cancel URLs
  SUCCESS_URL: process.env.NEXT_PUBLIC_BASE_URL + '/payment/success',
  CANCEL_URL: process.env.NEXT_PUBLIC_BASE_URL + '/payment/cancel',
};

// Create a checkout session for subscription
export async function createCheckoutSession({
  email,
  priceId,
  userId,
  successUrl,
  cancelUrl,
}: {
  email: string;
  priceId: string;
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || STRIPE_CONFIG.SUCCESS_URL,
      cancel_url: cancelUrl || STRIPE_CONFIG.CANCEL_URL,
      metadata: {
        userId,
        email,
      },
      subscription_data: {
        metadata: {
          userId,
          email,
        },
      },
    });

    return session;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
}

// Create a customer portal session for subscription management
export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Failed to create customer portal session:', error);
    throw error;
  }
}

// Get customer by email
export async function getCustomerByEmail(email: string) {
  try {
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    return customers.data[0] || null;
  } catch (error) {
    console.error('Failed to get customer by email:', error);
    throw error;
  }
}

// Get subscription by ID
export async function getSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Failed to get subscription:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
}

// Update subscription
export async function updateSubscription(subscriptionId: string, priceId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
    });
  } catch (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }
}

// Verify webhook signature
export function constructWebhookEvent(payload: string, signature: string) {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_CONFIG.WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}
