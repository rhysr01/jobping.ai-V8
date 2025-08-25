const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const subscriptionActiveMigrationSQL = `
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
`;

async function applySubscriptionActiveMigration() {
  console.log('🔑 Applying Subscription Active Migration...');
  console.log('📊 Database URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('🔑 Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Apply the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: subscriptionActiveMigrationSQL
    });
    
    if (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      return;
    }
    
    console.log('✅ Subscription Active Migration applied successfully!');
    
    // Verify the migration
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('email, subscription_active')
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return;
    }
    
    console.log('✅ Migration verification successful');
    console.log('📊 Sample users with subscription_active:', verifyData);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
applySubscriptionActiveMigration();
