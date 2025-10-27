# Developer Instructions Summary

## What You Need to Do

Your emails don't match your website preview. Here's the fix:

### The Problem
- **Website shows**: Purple gradients, modern hot match styling
- **Emails send**: Gray/white design, no purple branding
- **Impact**: Brand inconsistency † users confused

### The Solution (2 weeks of work)

1. **Create new template file** (2-3 hours)
   - File: `/Utils/email/productionReadyTemplates.ts`
   - Add purple gradient header
   - Add hot match styling for 90%+ scores
   - Make email client compatible (Outlook VML fallbacks)
   - Use inline styles only (Gmail requirement)

2. **Add feature flag** (30 mins)
   - Edit: `/Utils/email/optimizedSender.ts`
   - Add gradual rollout capability (0% † 5% † 25% † 50% † 100%)

3. **Test thoroughly** (2-3 hours)
   - Gmail web + mobile
   - Outlook 2016+
   - Apple Mail
   - All links work, buttons clickable

4. **Gradual rollout** (1-2 weeks)
   - Week 1: 5% of users
   - Monitor metrics (open rate, click rate, unsubscribes)
   - Week 2: Scale to 100% if metrics good

5. **Clean up** (1 hour)
   - Archive old templates
   - Remove feature flag code
   - Update documentation

### Files to Create/Edit

**CREATE**:
- `/Utils/email/productionReadyTemplates.ts` (main work)
- `/scripts/test-email.ts` (testing)

**EDIT**:
- `/Utils/email/optimizedSender.ts` (add feature flag)

**DON'T TOUCH**:
- `/Utils/email/types.ts`
- `/Utils/email/clients.ts`
- `/Utils/email/engagementTracking.ts`
- All your existing sending logic (it works perfectly)

### Success Criteria

-  Emails match website preview exactly
-  Purple branding throughout
-  Works in Gmail, Outlook, Apple Mail
-  Open/click rates improve or stay flat
-  No increase in unsubscribes

### Full Details

Read: `/DEVELOPER_EMAIL_INSTRUCTIONS.md` for:
- Complete code examples
- Email client compatibility rules
- Testing checklist
- Rollout schedule
- Troubleshooting guide

### Quick Start

```bash
# 1. Create new template file
touch Utils/email/productionReadyTemplates.ts

# 2. Follow Step 1 in DEVELOPER_EMAIL_INSTRUCTIONS.md
# 3. Test locally
npx tsx scripts/test-email.ts

# 4. Deploy with 0% rollout
vercel env add NEW_EMAIL_TEMPLATE_ROLLOUT
# Enter: 0

# 5. Gradually increase over 2 weeks
```

### Questions?
- Read `/DEVELOPER_EMAIL_INSTRUCTIONS.md`
- Check `/EMAIL_UPGRADE_PLAN.md` for context
- Slack: #engineering
