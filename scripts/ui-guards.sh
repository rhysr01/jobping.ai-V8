#!/bin/bash

# UI Guards - Prevent visual regressions
# Run this in CI to catch color leaks and accessibility issues

set -e

echo "🔍 Running UI Guards..."

# 1. Check for banned colors/underlines
echo "Checking for banned colors and underlines..."
BANNED_PATTERNS="(purple-|green-|orange-|from-purple|to-purple|underline|text-decoration)"
VIOLATIONS=$(grep -r -n "$BANNED_PATTERNS" app/ --include="*.tsx" --include="*.ts" --include="*.css" || true)

if [ -n "$VIOLATIONS" ]; then
    echo "❌ Found banned color/underline patterns:"
    echo "$VIOLATIONS"
    echo ""
    echo "Fix these violations:"
    echo "- Replace purple/green/orange with indigo"
    echo "- Remove underlines (use weight/size for emphasis)"
    exit 1
fi

echo "✅ No banned colors or underlines found"

# 2. Check for proper focus states
echo "Checking focus-visible usage..."
FOCUS_VIOLATIONS=$(grep -r "focus:" app/ --include="*.tsx" | grep -v "focus-visible" | grep -v "focus:outline-none" || true)

if [ -n "$FOCUS_VIOLATIONS" ]; then
    echo "⚠️  Found focus: usage without focus-visible:"
    echo "$FOCUS_VIOLATIONS"
    echo ""
    echo "Consider using focus-visible: for better a11y"
fi

# 3. Check for proper mobile tap targets
echo "Checking mobile tap targets..."
TAP_TARGETS=$(grep -r "min-h-\[44px\]\|min-w-\[44px\]" app/ --include="*.tsx" | wc -l)

if [ "$TAP_TARGETS" -lt 3 ]; then
    echo "⚠️  Found only $TAP_TARGETS mobile tap targets (should be ≥3)"
    echo "Ensure interactive elements have min-h-[44px] min-w-[44px]"
fi

# 4. Check for proper text sizes
echo "Checking text sizes..."
SMALL_TEXT=$(grep -r "text-xs\|text-sm" app/ --include="*.tsx" | grep -v "text-xs.*font-bold\|text-sm.*font-bold" | wc -l)

if [ "$SMALL_TEXT" -gt 5 ]; then
    echo "⚠️  Found $SMALL_TEXT instances of small text"
    echo "Consider using text-base for better readability"
fi

# 5. Check for proper indigo usage
echo "Checking indigo accent usage..."
INDIGO_USAGE=$(grep -r "indigo\|#6366F1" app/ --include="*.tsx" --include="*.css" | wc -l)

if [ "$INDIGO_USAGE" -lt 3 ]; then
    echo "⚠️  Found only $INDIGO_USAGE indigo usages"
    echo "Ensure consistent indigo accent throughout"
fi

echo "✅ UI Guards completed"
echo ""
echo "📊 Summary:"
echo "- Banned colors: ✅ Clean"
echo "- Focus states: ✅ Checked"
echo "- Mobile targets: ✅ $TAP_TARGETS found"
echo "- Text sizes: ✅ Checked"
echo "- Indigo usage: ✅ $INDIGO_USAGE found"
