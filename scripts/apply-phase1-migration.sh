#!/bin/bash

# ============================================================================
# PHASE 1 MIGRATION SCRIPT
# Apply database truth migration to development database
# ============================================================================

echo "🚀 Starting Phase 1: Database Truth Migration"
echo "=============================================="

# Check if we have the required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Extract database URL from Supabase URL
DB_URL="postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${NEXT_PUBLIC_SUPABASE_URL#https://}"

echo "📊 Applying migration to: ${NEXT_PUBLIC_SUPABASE_URL}"

# Apply the migration
echo "📝 Executing Phase 1 migration..."
psql "$DB_URL" -f scripts/phase1-missing-pieces.sql

if [ $? -eq 0 ]; then
    echo "✅ Phase 1 migration completed successfully!"
    echo ""
    echo "🎯 What was accomplished:"
    echo "  ✅ Added performance-critical indexes"
    echo "  ✅ Created utility functions for idempotency"
    echo "  ✅ Enabled RLS policies"
    echo "  ✅ Set up email suppression checks"
    echo ""
    echo "🚀 Ready for Phase 2: App Behavior"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
