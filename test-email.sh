#!/bin/bash
# Quick email test script
EMAIL=${1:-"delivered@resend.dev"}
BASE_URL=${2:-"http://localhost:3000"}
echo "🧪 Testing email endpoint..."
echo "📧 Recipient: $EMAIL"
echo "🌐 URL: $BASE_URL/api/test-resend?to=$EMAIL"
echo ""
curl -s "$BASE_URL/api/test-resend?to=$EMAIL" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/api/test-resend?to=$EMAIL"
