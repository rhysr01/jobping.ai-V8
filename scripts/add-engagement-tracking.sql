-- Add engagement tracking fields to users table
-- This enables pausing email delivery for inactive users

-- Add engagement tracking columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_email_opened TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_email_clicked TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_engagement_score INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS delivery_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS re_engagement_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_engagement_date TIMESTAMP WITH TIME ZONE;

-- Create index for efficient engagement queries
CREATE INDEX IF NOT EXISTS idx_users_engagement 
ON public.users (delivery_paused, last_engagement_date, email_engagement_score);

-- Create index for re-engagement queries
CREATE INDEX IF NOT EXISTS idx_users_re_engagement 
ON public.users (delivery_paused, re_engagement_sent, last_engagement_date) 
WHERE delivery_paused = TRUE;

-- Update existing users to have engagement score of 100 (fully engaged)
UPDATE public.users 
SET email_engagement_score = 100,
    last_engagement_date = COALESCE(last_email_sent, created_at, NOW())
WHERE email_engagement_score IS NULL;

-- Add comment explaining the engagement system
COMMENT ON COLUMN public.users.last_email_opened IS 'Timestamp of last email open event';
COMMENT ON COLUMN public.users.last_email_clicked IS 'Timestamp of last email click event';
COMMENT ON COLUMN public.users.email_engagement_score IS 'Engagement score 0-100, users below 30 are considered inactive';
COMMENT ON COLUMN public.users.delivery_paused IS 'Whether email delivery is paused for this user';
COMMENT ON COLUMN public.users.re_engagement_sent IS 'Whether re-engagement email has been sent';
COMMENT ON COLUMN public.users.last_engagement_date IS 'Last date of any engagement (open, click, or email sent)';

-- Create function to update engagement score
CREATE OR REPLACE FUNCTION update_user_engagement(
    user_email TEXT,
    engagement_type TEXT DEFAULT 'email_sent'
) RETURNS VOID AS $$
DECLARE
    current_score INTEGER;
    new_score INTEGER;
    engagement_date TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get current engagement score
    SELECT email_engagement_score INTO current_score
    FROM public.users 
    WHERE email = user_email;
    
    -- Calculate new score based on engagement type
    CASE engagement_type
        WHEN 'email_opened' THEN
            new_score := LEAST(100, current_score + 10);
        WHEN 'email_clicked' THEN
            new_score := LEAST(100, current_score + 15);
        WHEN 'email_sent' THEN
            new_score := GREATEST(0, current_score - 2);
        ELSE
            new_score := current_score;
    END CASE;
    
    -- Update user engagement
    UPDATE public.users 
    SET 
        email_engagement_score = new_score,
        last_engagement_date = engagement_date,
        delivery_paused = CASE 
            WHEN new_score < 30 AND delivery_paused = FALSE THEN TRUE
            WHEN new_score >= 30 AND delivery_paused = TRUE THEN FALSE
            ELSE delivery_paused
        END,
        last_email_opened = CASE 
            WHEN engagement_type = 'email_opened' THEN engagement_date
            ELSE last_email_opened
        END,
        last_email_clicked = CASE 
            WHEN engagement_type = 'email_clicked' THEN engagement_date
            ELSE last_email_clicked
        END
    WHERE email = user_email;
END;
$$ LANGUAGE plpgsql;

-- Create function to get users eligible for re-engagement
CREATE OR REPLACE FUNCTION get_users_for_re_engagement()
RETURNS TABLE (
    email TEXT,
    full_name TEXT,
    last_engagement_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.email,
        u.full_name,
        u.last_engagement_date
    FROM public.users u
    WHERE u.delivery_paused = TRUE 
        AND u.re_engagement_sent = FALSE
        AND u.last_engagement_date < NOW() - INTERVAL '30 days'
        AND u.email_verified = TRUE
        AND u.active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_engagement(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_for_re_engagement() TO authenticated;

-- Insert sample data for testing (remove in production)
-- This is just for testing the engagement system
INSERT INTO public.users (
    email, 
    full_name, 
    email_verified, 
    active,
    email_engagement_score,
    delivery_paused,
    last_engagement_date
) VALUES (
    'test-engaged@example.com',
    'Test Engaged User',
    TRUE,
    TRUE,
    85,
    FALSE,
    NOW() - INTERVAL '5 days'
), (
    'test-inactive@example.com', 
    'Test Inactive User',
    TRUE,
    TRUE,
    15,
    TRUE,
    NOW() - INTERVAL '45 days'
) ON CONFLICT (email) DO NOTHING;

SELECT 'Engagement tracking system added successfully' as status;
