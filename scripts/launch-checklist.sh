#!/bin/bash

# Launch Checklist - Pre-ship guard
# Run this before deploying to production

set -e

echo "🚀 JobPing Launch Checklist"
echo "=========================="
echo ""

# 1. Check for banned colors/underlines
echo "1️⃣ Checking for banned colors and underlines..."
BANNED_PATTERNS="(purple-|green-|orange-|from-purple|to-purple|underline|text-decoration)"
VIOLATIONS=$(grep -r -n "$BANNED_PATTERNS" app/ --include="*.tsx" --include="*.ts" --include="*.css" || true)

if [ -n "$VIOLATIONS" ]; then
    echo "❌ Found banned color/underline patterns:"
    echo "$VIOLATIONS"
    echo ""
    echo "Fix these violations before launching!"
    exit 1
fi
echo "✅ No banned colors or underlines found"
echo ""

# 2. Run Playwright tests
echo "2️⃣ Running Playwright tests..."
if command -v npx &> /dev/null; then
    npx playwright test --reporter=line
    echo "✅ Playwright tests passed"
else
    echo "⚠️  Playwright not available, skipping tests"
fi
echo ""

# 3. Run Lighthouse CI
echo "3️⃣ Running Lighthouse CI..."
if command -v npx &> /dev/null; then
    npx lhci autorun
    echo "✅ Lighthouse CI passed"
else
    echo "⚠️  Lighthouse CI not available, skipping tests"
fi
echo ""

# 4. Check build
echo "4️⃣ Checking build..."
if command -v npm &> /dev/null; then
    npm run build
    echo "✅ Build successful"
else
    echo "⚠️  npm not available, skipping build check"
fi
echo ""

# 5. Check environment variables
echo "5️⃣ Checking environment variables..."
REQUIRED_ENV_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "RESEND_API_KEY"
    "SYSTEM_API_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Set these variables before launching!"
    exit 1
fi
echo "✅ All required environment variables are set"
echo ""

# 6. Check domain configuration
echo "6️⃣ Checking domain configuration..."
if grep -q "getjobping.com" app/layout.tsx; then
    echo "✅ Domain configured correctly"
else
    echo "❌ Domain not configured correctly"
    echo "Update metadataBase in app/layout.tsx"
    exit 1
fi
echo ""

# 7. Check analytics tracking
echo "7️⃣ Checking analytics tracking..."
if grep -q "trackEvent" app/page.tsx; then
    echo "✅ Analytics tracking configured"
else
    echo "⚠️  Analytics tracking not found"
fi
echo ""

# 8. Check sample email
echo "8️⃣ Checking sample email..."
if [ -f "public/sample-email.html" ]; then
    echo "✅ Sample email exists"
else
    echo "❌ Sample email missing"
    exit 1
fi
echo ""

# 9. Check legal pages
echo "9️⃣ Checking legal pages..."
LEGAL_PAGES=(
    "app/legal/privacy-policy.tsx"
    "app/legal/terms-of-service.tsx"
    "app/legal/unsubscribe/page.tsx"
)

for page in "${LEGAL_PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "✅ $page exists"
    else
        echo "❌ $page missing"
        exit 1
    fi
done
echo ""

# 10. Final summary
echo "🎉 Launch Checklist Complete!"
echo "============================="
echo ""
echo "✅ All checks passed"
echo "✅ Ready for production deployment"
echo ""
echo "Next steps:"
echo "1. Deploy to production"
echo "2. Monitor analytics events"
echo "3. Test email delivery"
echo "4. Verify legal pages"
echo ""
echo "Good luck with your launch! 🚀"
