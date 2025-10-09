-- Create promo_pending table for temporary promo code storage
-- Run this in Supabase SQL Editor BEFORE testing promo code flow

CREATE TABLE IF NOT EXISTS promo_pending (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  promo_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_promo_pending_email ON promo_pending(email);
CREATE INDEX IF NOT EXISTS idx_promo_pending_expires ON promo_pending(expires_at);

-- RLS: Allow service role to insert/select/delete
ALTER TABLE promo_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage promo_pending" ON promo_pending
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify table created
SELECT 'promo_pending table created successfully' as status;
