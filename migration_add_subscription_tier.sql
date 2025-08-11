-- Migration: Add subscription tier support to users table
-- This enables free vs premium user differentiation for email templates and job matching

-- Add subscription tier column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));

-- Add subscription status columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for subscription tier queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Create index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_users_subscription_active ON users(subscription_active) WHERE subscription_active = TRUE;

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.subscription_tier IS 'User subscription tier: free or premium';
COMMENT ON COLUMN users.subscription_active IS 'Whether the user subscription is currently active';
COMMENT ON COLUMN users.subscription_expires_at IS 'When the subscription expires (NULL for free tier)';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for managing subscriptions';

-- Update existing users to have free tier by default
UPDATE users 
SET subscription_tier = 'free', subscription_active = TRUE
WHERE subscription_tier IS NULL;

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('subscription_tier', 'subscription_active', 'subscription_expires_at', 'stripe_customer_id', 'stripe_subscription_id')
ORDER BY column_name;
