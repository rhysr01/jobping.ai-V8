# Job Ingestion Contract Implementation

## TL;DR (Pin This)

**If it's early-career and Europe-relevant, save it—always.**
**Then add career role and location if you can.**
**Everything else is optional.**

## Overview

The Job Ingestion Contract has been successfully implemented across the jobping platform, providing a standardized, robust approach to job filtering and categorization. This contract ensures that only relevant early-career opportunities in Europe are saved to the database while maintaining comprehensive metadata for analysis.

## Core Implementation

### 1. Enhanced Robust Job Creation (`Utils/robustJobCreation.ts`)

The main job creation function `createRobustJob()` now implements the complete Job Ingestion Contract:

```typescript
export function createRobustJob(params: {
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  companyUrl: string;
  description: string;
  department?: string;
  postedAt?: string;
  runId: string;
  source: string;
  isRemote?: boolean;
  platformId?: string; // For native platform IDs (Greenhouse/Lever/Workday)
}): JobCreationResult
```

### 2. Early-Career Eligibility Check

**RECALL-FIRST APPROACH**: Jobs are included unless clearly senior-level.

**Positive Signals** (any of these = eligible):
- `intern`, `internship`, `graduate`, `trainee`, `junior`, `entry-level`
- `0-2 years`, `no experience required`, `new grad`, `recent graduate`
- `entry level`, `associate`, `assistant`, `coordinator`
- `0 years`, `1 year`, `2 years`, `no experience`, `fresh graduate`
- `student`, `apprentice`, `entry level position`

**Senior Signals** (exclude only when unambiguous):
- `senior`, `sr.`, `principal`, `staff`, `lead`, `director`, `architect`
- `10+ years`, `experienced.*(5|6|7|8|9|10)`, `vp`, `vice president`
- `head of`, `chief`, `manager.*(5|6|7|8|9|10)`, `senior manager`
- `senior director`, `senior principal`, `senior staff`, `senior lead`
- `minimum.*(5|6|7|8|9|10).*years`, `at least.*(5|6|7|8|9|10).*years`

**Ambiguous Cases** (include with uncertain flag):
- `manager trainee`, `trainee manager`, `graduate specialist`
- `junior manager`, `associate director`, `entry level lead`
- `graduate manager`, `trainee director`, `junior director`

### 3. Location Tagging (EU-First)

**EU Countries**: Germany, France, Italy, Spain, Netherlands, Belgium, Austria, Ireland, Denmark, Sweden, Finland, Norway, Switzerland, Poland, Czech Republic, Hungary, Romania, Bulgaria, Croatia, Slovenia, Slovakia, Estonia, Latvia, Lithuania, Luxembourg, Malta, Cyprus, Greece, Portugal, United Kingdom

**EU Cities**: Comprehensive list including Berlin, Paris, Madrid, Amsterdam, Brussels, Vienna, Dublin, London, Copenhagen, Stockholm, Helsinki, Oslo, Zurich, Warsaw, Prague, Budapest, Bucharest, Sofia, Zagreb, Ljubljana, Bratislava, Tallinn, Riga, Vilnius, Luxembourg City, Valletta, Nicosia, Athens, Lisbon

**Location Tags**:
- `loc:eu-country` or `loc:eu-city-slug` for EU locations
- `loc:eu-remote` for EU remote positions
- `loc:unknown` for non-EU or unknown locations

### 4. Required Database Fields

**Must populate on insert**:
- `title` (text) - Job title
- `company` (text) - Company name
- `job_url` (text) - Canonicalized URL (lowercase, no query/hash, no trailing slash)
- `source` (text) - Scraper name/domain
- `posted_at` (timestamptz) - Use site value; if missing, set to scrape time
- `job_hash` (text) - Stable hash of normalized (title + company + url)
- `categories` (text) - Pipe-delimited tags including exactly one `career:<slug>` and location tags

**Optional fields** (never block save):
- `location`, `description` (truncated to safe length), `languages_required[]`, `work_environment`, `company_profile_url`

### 5. Enhanced Categories System

Categories now include:
- `career:<slug>` - Exactly one career path (or `career:unknown`)
- `early-career` or `eligibility:uncertain` - Early-career marker
- `loc:eu-country` / `loc:eu-city-slug` / `loc:eu-remote` / `loc:unknown` - Location tags
- `mode:remote|hybrid|office` - Work mode (if known)
- `freshness:known|unknown` - Posting date availability
- `dept:<department>` - Department/team
- `platform:id:<id>` - Native platform IDs for analysis

### 6. Platform ID Tracking

Native platform IDs are now tracked in categories for analysis:
- Greenhouse: `gh:id:12345`
- Lever: `lever:id:abc123`
- Workday: `workday:id:xyz789`

**Note**: Platform IDs are for analysis only; `job_hash` remains the primary deduplication key.

## Updated Scrapers

### Greenhouse (`scrapers/greenhouse.ts`)
- ✅ Uses `createRobustJob()` with platform ID extraction
- ✅ Enhanced early-career filtering
- ✅ Improved location tagging

### Lever (`scrapers/lever.ts`)
- ✅ Updated to use `createRobustJob()` with platform ID extraction
- ✅ Enhanced early-career filtering
- ✅ Improved location tagging

### Workday (`scrapers/workday.ts`)
- ✅ Updated to use `createRobustJob()` with platform ID extraction
- ✅ Enhanced early-career filtering
- ✅ Improved location tagging

## Funnel Logging & Telemetry

### Enhanced Metrics
- **Raw** → **Eligible** → **Career-Tagged** → **Location-Tagged** → **Inserted** → **Updated** → **Errors**
- Sample titles (up to 5) for debugging
- Eligible ratio calculation and warnings
- Unknown location percentage tracking

### Quality Targets
- **Eligible Ratio**: ≥ 70% (Workday: ≥ 50% initially)
- **Unknown Location**: ≤ 25% (RemoteOK: ≤ 40%)
- **Sample Titles**: Up to 5 per run for debugging

### Warning Thresholds
- Eligible ratio below minimum triggers warning
- Unknown location ratio above cap triggers warning
- Suspicious patterns (raw jobs but 0 upserts) trigger warning

## Testing Results

All core functionality has been tested and verified:

### Early-Career Eligibility
✅ Software Engineering Intern - ELIGIBLE (positive_signal)
✅ Graduate Software Engineer - ELIGIBLE (positive_signal)
❌ Senior Software Engineer - NOT_ELIGIBLE (senior_signal)
✅ Junior Developer - ELIGIBLE (positive_signal)
✅ Product Manager - ELIGIBLE (no_clear_signals)

### Location Tagging
✅ Berlin, Germany → loc:berlin-germany
✅ Remote (EU) → loc:eu-remote
✅ London, UK → loc:london-uk
✅ New York, USA → loc:unknown
✅ Unknown → loc:unknown

## Key Benefits

1. **Consistent Quality**: All scrapers now use the same filtering logic
2. **Recall-First**: Minimizes false negatives for early-career opportunities
3. **EU-Focused**: Prioritizes European opportunities while maintaining global coverage
4. **Enhanced Analytics**: Platform IDs and comprehensive tagging enable better analysis
5. **Robust Error Handling**: Graceful handling of missing or invalid data
6. **Comprehensive Logging**: Detailed funnel metrics for monitoring and debugging

## Rollback Plan

If issues arise, the system can be rolled back by:
1. Reverting scrapers to use manual job creation
2. Disabling enhanced filtering in `createRobustJob()`
3. Removing platform ID tracking
4. Reverting to basic location tagging

## Future Enhancements

1. **Machine Learning**: Train models on job classification for better accuracy
2. **Dynamic Thresholds**: Adjust filtering based on market conditions
3. **Geographic Expansion**: Add more EU cities and regions
4. **Career Path Refinement**: Improve career path extraction accuracy
5. **Real-time Monitoring**: Dashboard for funnel metrics and quality indicators

## Conclusion

The Job Ingestion Contract has been successfully implemented across the jobping platform, providing a robust, standardized approach to job filtering and categorization. The system now ensures high-quality, relevant job opportunities are captured while maintaining comprehensive metadata for analysis and improvement.
