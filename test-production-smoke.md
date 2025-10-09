# Production Smoke Test Checklist

Run these tests after deployment to verify everything works:

## ✅ Critical Path Tests

### 1. **Tally Webhook → Email Flow**
- [ ] Submit Tally form with 2 cities (e.g., London + Paris)
- [ ] Check logs for:
  ```
  ✅ Extracted location: London
  ✅ Extracted location: Paris
  cities: [ 'London', 'Paris' ]
  📍 Target distribution: London:3, Paris:2
  ✅ Rebuilt 5 matches with city diversity
  ```
- [ ] Receive email with:
  - Dark theme (black background, purple header)
  - 3 London jobs + 2 Paris jobs
  - Feedback buttons working
  - Application links copyable

### 2. **Promo Code Flow**
- [ ] Apply promo "rhys" with new email
- [ ] Should redirect to Tally form
- [ ] Fill out form
- [ ] Receive email with ⭐ Premium Member badge

### 3. **Cache Effectiveness**
- [ ] Check logs for cache hits:
  ```
  💰 Cache hit for user@example.com - saved AI call!
  ```
- [ ] Verify 2nd similar user gets cached results

### 4. **Cost Monitoring**
- [ ] After 10 signups, check OpenAI usage
- [ ] Should see mostly GPT-3.5-turbo calls (90%)
- [ ] Minimal GPT-4 calls (10%)

## ✅ Quality Checks

### 5. **Match Relevance**
- [ ] Finance user → only Finance jobs (no Sales/HR)
- [ ] Entry-level user → no Senior positions
- [ ] Consulting user → Strategy/Consulting roles only

### 6. **Location Accuracy**
- [ ] Dublin + Zurich → jobs from BOTH cities
- [ ] No Amsterdam jobs when not selected
- [ ] No London jobs when not selected

## 📊 Expected Logs (Production)

```
Found 1000 EU-based early career jobs
Location filter: 1000 → 324 jobs (cities: London, Paris)
Pre-filtered from 1000 to 100 jobs
📍 Target distribution: London:3, Paris:2
📍 London: Found 65 available jobs, need 3
  ✅ Added: Financial Analyst (score: 85)
  ✅ Added: Investment Banking Analyst (score: 82)
  ✅ Added: Junior Consultant (score: 78)
📍 Paris: Found 45 available jobs, need 2
  ✅ Added: Strategy Analyst (score: 88)
  ✅ Added: Business Analyst (score: 80)
✅ Rebuilt 5 matches with city diversity
📊 Final diversity: 2 sources, 2 cities (London, Paris)
```

## 🚨 Red Flags

If you see these, something is broken:

❌ `cities: [ 's', 's' ]` - Regex extraction broken
❌ `Location filter: 1000 → 0 jobs` - No jobs match cities
❌ `📊 City diversity: 1/2 cities covered` with no diversity enforcement
❌ Email with wrong cities (Amsterdam when selected London)
❌ All jobs from one source (jobspy-indeed only)
❌ `Failed to log match session: ai_cost_usd` - Expected, ignore

## 💰 Cost Verification

After 100 signups, verify:
- Cache hit rate: 60-80%
- GPT-3.5 usage: 85-90%
- GPT-4 usage: 10-15%
- Average cost per match: $0.01-0.02 (down from $0.10-0.12)

## ✅ Success Criteria

All of these must be true:
1. ✅ Users get jobs from ALL selected cities (3+2 or 2+2+1 split)
2. ✅ Jobs match user's career preferences (no irrelevant roles)
3. ✅ Emails look premium (dark theme, clean design)
4. ✅ Cache is working (see cache hit logs)
5. ✅ 90% of requests use GPT-3.5 (not GPT-4)
6. ✅ Promo code activates premium successfully
7. ✅ Feedback buttons work and save to database

If all pass → **System is production-ready!** 🚀

