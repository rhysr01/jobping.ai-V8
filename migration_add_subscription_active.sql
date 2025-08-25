-- Migration: Add subscription_active column to users table
-- This migration adds a subscription_active boolean column to track user subscription status

-- Add the subscription_active column with a default value of false
ALTER TABLE users 
ADD COLUMN subscription_active BOOLEAN DEFAULT false;

-- Add a comment to document the column purpose
COMMENT ON COLUMN users.subscription_active IS 'Whether the user has an active subscription';

-- Create an index on subscription_active for efficient queries
CREATE INDEX idx_users_subscription_active ON users(subscription_active);

-- Update existing users to have subscription_active = false by default
-- (This is already handled by the DEFAULT false above, but we can be explicit)
UPDATE users SET subscription_active = false WHERE subscription_active IS NULL;
