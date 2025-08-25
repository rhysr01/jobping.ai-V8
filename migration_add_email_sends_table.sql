-- Migration: Add email_sends table for idempotency and tracking
-- This enables proper email delivery tracking and prevents duplicate sends

-- Create email_sends table
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  send_token TEXT NOT NULL UNIQUE, -- Format: user_email_YYYY-MM-DD_jobshash
  user_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'job_matches', 'followup')),
  jobs_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_sends_send_token ON email_sends(send_token);
CREATE INDEX IF NOT EXISTS idx_email_sends_user_email ON email_sends(user_email);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_type_sent ON email_sends(email_type, sent_at DESC);

-- Add comments for documentation
COMMENT ON TABLE email_sends IS 'Tracks all email sends for idempotency and delivery monitoring';
COMMENT ON COLUMN email_sends.send_token IS 'Unique token for idempotency: user_email_YYYY-MM-DD_jobshash';
COMMENT ON COLUMN email_sends.user_email IS 'Email address of the recipient';
COMMENT ON COLUMN email_sends.email_type IS 'Type of email: welcome, job_matches, followup';
COMMENT ON COLUMN email_sends.jobs_count IS 'Number of jobs included in this email';
COMMENT ON COLUMN email_sends.sent_at IS 'When the email was sent';
COMMENT ON COLUMN email_sends.status IS 'Delivery status: pending, sent, failed, bounced';
COMMENT ON COLUMN email_sends.error_message IS 'Error message if delivery failed';

-- Verify the migration
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'email_sends'
ORDER BY ordinal_position;
