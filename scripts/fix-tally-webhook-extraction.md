# Tally Webhook Data Extraction Issue

## Problem

Tally sends **inconsistent webhook payloads** for checkbox fields:

### ✅ Working (sends individual fields):
```json
{
  "label": "What is your preferred work location(s) ? (Dublin)",
  "value": true
}
```

### ❌ Not Working (sends only UUIDs):
```json
{
  "label": "What Language(s) can you speak to a professional level?",
  "value": ["fd986440-2ce3-47c5-a528-5fbbf6728be7", "36590810-6763-424d-b24b-02530f53365d"]
}
```

## Fields Affected

1. **Languages**: Only UUID array
2. **Visa Status**: Only UUID array  
3. **Career Path**: Only UUID array
4. **Professional Experience**: Only UUID array

## Root Cause

Tally's webhook payload format depends on **how the question is configured** in their form builder. Some checkbox fields expand into individual `field_key_optionId` entries, others don't.

## Solutions

### Option 1: Fix in Tally Dashboard (Recommended)
1. Go to your Tally form settings
2. For each problematic field, check "Advanced Settings"
3. Enable "Send individual options in webhook" (if available)
4. Save and test

### Option 2: Map UUIDs in Code (Fragile)
Create a hardcoded mapping of Tally option UUIDs to values:
```typescript
const TALLY_LANGUAGE_MAP = {
  'fd986440-2ce3-47c5-a528-5fbbf6728be7': 'English',
  '36590810-6763-424d-b24b-02530f53365d': 'French',
  // ... etc
}
```
**Problem**: UUIDs change if you recreate the form.

### Option 3: Use Tally's Hidden Fields API
Add hidden calculated fields that convert selections to comma-separated strings:
```
Languages_Text = @{languages.join(', ')}
```

## Next Steps

**Which option do you prefer?**
1. Check your Tally form settings (5 min fix)
2. I can implement UUID mapping (brittle, not recommended)
3. I can add hidden field extraction logic

Let me know and I'll implement it!

