-- Create email_suppression table for bounce/complaint suppression
-- Run this once in your Supabase database

CREATE TABLE IF NOT EXISTS email_suppression (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL, -- e.g., 'bounce_permanent', 'complaint_spam'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_data JSONB, -- Store additional webhook data
  
  -- Indexes for performance
  CONSTRAINT email_suppression_user_email_key UNIQUE (user_email)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_suppression_user_email ON email_suppression(user_email);
CREATE INDEX IF NOT EXISTS idx_email_suppression_created_at ON email_suppression(created_at);
CREATE INDEX IF NOT EXISTS idx_email_suppression_reason ON email_suppression(reason);

-- Add RLS (Row Level Security) if needed
-- ALTER TABLE email_suppression ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE email_suppression IS 'Email addresses that should not receive further emails due to bounces or complaints';
COMMENT ON COLUMN email_suppression.user_email IS 'Email address to suppress';
COMMENT ON COLUMN email_suppression.reason IS 'Reason for suppression (bounce_permanent, complaint_spam, etc.)';
COMMENT ON COLUMN email_suppression.event_data IS 'Additional data from the webhook event';
