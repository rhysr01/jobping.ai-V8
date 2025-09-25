-- ============================================================================
-- CREATE ALERTS TABLE FOR MONITORING
-- ============================================================================

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
    component TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON public.system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_component ON public.system_alerts(component);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON public.system_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_timestamp ON public.system_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_alerts_active ON public.system_alerts(resolved, timestamp) WHERE resolved = FALSE;

-- Enable RLS
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Service role full access to system_alerts" ON public.system_alerts;
CREATE POLICY "Service role full access to system_alerts" ON public.system_alerts
    FOR ALL USING ((select current_setting('role')) = 'service_role') 
    WITH CHECK ((select current_setting('role')) = 'service_role');

-- Create update trigger for updated_at
DROP TRIGGER IF EXISTS update_system_alerts_updated_at ON public.system_alerts;
CREATE TRIGGER update_system_alerts_updated_at
    BEFORE UPDATE ON public.system_alerts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample alert for testing
INSERT INTO public.system_alerts (id, type, component, message, metadata)
VALUES (
    'test_alert_' || extract(epoch from now()),
    'info',
    'monitoring',
    'System monitoring initialized',
    '{"test": true, "version": "1.0.0"}'
) ON CONFLICT (id) DO NOTHING;

-- Verify table creation
SELECT 'system_alerts table created successfully' as status;

-- Show table structure
\d public.system_alerts;

-- Show sample data
SELECT * FROM public.system_alerts ORDER BY timestamp DESC LIMIT 5;
