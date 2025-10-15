#!/bin/bash
# Test script to trigger email sending
# You need to set SYSTEM_API_KEY in your environment first

if [ -z "$SYSTEM_API_KEY" ]; then
  echo "❌ SYSTEM_API_KEY not set!"
  echo "Run: export SYSTEM_API_KEY=your-key-here"
  echo "Or find it in Vercel env vars"
  exit 1
fi

echo "🚀 Triggering email send..."
curl -X POST https://getjobping.com/api/send-scheduled-emails \
  -H "Content-Type: application/json" \
  -H "x-system-api-key: $SYSTEM_API_KEY" \
  -d '{"dryRun": false}' \
  -v

echo ""
echo "✅ Check Resend dashboard: https://resend.com/emails"
echo "✅ Check your Gmail inbox"

