# Atomic Upserts & Scraper Improvements

## Overview

This implementation replaces the traditional "check if exists then insert/update" pattern with atomic upsert operations using a unique constraint on `job_hash`. This provides better performance, data consistency, and enables advanced features like freshness tiering and real posting date extraction.

## Key Improvements

### 1. Atomic Upserts with Unique Constraint

**Before:**
```typescript
// Check if job exists, then insert/update
const { data: existing } = await supabase
  .from('jobs')
  .select('id')
  .eq('job_hash', jobHash)
  .single();

if (existing) {
  await supabase.from('jobs').update(job).eq('id', existing.id);
} else {
  await supabase.from('jobs').insert(job);
}
```

**After:**
```typescript
// Single atomic operation
const result = await atomicUpsertJobs(jobs);
```

### 2. Freshness Tier Calculation

Jobs are automatically categorized into freshness tiers for better prioritization:

- **ULTRA_FRESH**: < 24 hours
- **FRESH**: 1-3 days  
- **RECENT**: 3-7 days
- **STALE**: 7-30 days
- **OLD**: > 30 days

### 3. Real Posting Date Extraction

Instead of using scrape time, the system now attempts to extract actual posting dates from job sites:

- **Greenhouse**: Structured data, meta tags, API responses
- **Lever**: JSON-LD, meta tags, relative dates
- **Workday**: API data, meta tags, structured content
- **RemoteOK**: Relative dates ("2 days ago"), absolute dates

### 4. Enhanced Job Data

New fields added to the Job interface:

```typescript
interface Job {
  // ... existing fields ...
  freshness_tier?: FreshnessTier;       // Calculated freshness
  extracted_posted_date?: string;       // Real posting date if found
  scrape_timestamp?: string;            // When we scraped it
}
```

## Database Schema Changes

### Required Migration

Run the SQL migration to add the unique constraint:

```sql
-- Add unique constraint on job_hash column
ALTER TABLE jobs 
ADD CONSTRAINT jobs_job_hash_unique UNIQUE (job_hash);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_jobs_job_hash ON jobs (job_hash);
CREATE INDEX IF NOT EXISTS idx_jobs_freshness_tier ON jobs (freshness_tier);
-- ... additional indexes
```

### New Columns (Optional)

If you want to track the new fields, add these columns:

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freshness_tier TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS extracted_posted_date TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scrape_timestamp TIMESTAMP;
```

## Implementation Details

### 1. Atomic Upsert Function

```typescript
export async function atomicUpsertJobs(jobs: Job[]): Promise<JobUpsertResult> {
  const supabase = getSupabaseClient();
  
  // Prepare jobs with calculated fields
  const preparedJobs = jobs.map(job => ({
    ...job,
    freshness_tier: calculateFreshnessTier(job.posted_at),
    scrape_timestamp: new Date().toISOString()
  }));

  // Perform atomic upsert
  const { data, error } = await supabase
    .from('jobs')
    .upsert(preparedJobs, {
      onConflict: 'job_hash',
      ignoreDuplicates: false
    });

  return { success: !error, inserted: jobs.length, updated: 0, errors: [] };
}
```

### 2. Date Extraction

```typescript
export function extractPostingDate(
  html: string, 
  source: string, 
  url: string
): DateExtractionResult {
  // Platform-specific extraction patterns
  const patterns = [
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/g,  // ISO dates
    /(\d+)\s+(day|days|hour|hours)\s+ago/gi,    // Relative dates
    /<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/gi, // Meta tags
  ];
  
  // Try each pattern and return best match
  // Platform-specific logic for Greenhouse, Lever, Workday, RemoteOK
}
```

### 3. Freshness Tier Calculation

```typescript
export function calculateFreshnessTier(postedAt: string): FreshnessTier {
  const postedDate = new Date(postedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 24) return FreshnessTier.ULTRA_FRESH;
  if (hoursDiff < 72) return FreshnessTier.FRESH;
  if (hoursDiff < 168) return FreshnessTier.RECENT;
  if (hoursDiff < 720) return FreshnessTier.STALE;
  return FreshnessTier.OLD;
}
```

## Updated Scraper Pattern

All scrapers now follow this pattern:

```typescript
export async function scrapePlatform(company: Company, runId: string): Promise<Job[]> {
  const jobs: Job[] = [];
  
  // ... scraping logic ...
  
  for (const jobElement of jobElements) {
    // Extract basic job data
    const title = extractTitle(jobElement);
    const jobUrl = extractUrl(jobElement);
    
    // Scrape full description
    const description = await scrapeJobDescription(jobUrl);
    
    // Extract real posting date
    const dateExtraction = extractPostingDate(description, 'platform', jobUrl);
    const postedAt = dateExtraction.success && dateExtraction.date 
      ? dateExtraction.date 
      : new Date().toISOString();
    
    // Create job object with all required fields
    const job: Job = {
      title,
      company: company.name,
      location: extractLocation(jobElement),
      job_url: jobUrl,
      description,
      // ... other fields ...
      posted_at: postedAt,
      extracted_posted_date: dateExtraction.success ? dateExtraction.date : undefined,
      // Add missing required fields
      professional_expertise: '',
      start_date: '',
      visa_status: '',
      entry_level_preference: '',
      career_path: '',
    };
    
    jobs.push(job);
  }
  
  // Use atomic upsert
  const result = await atomicUpsertJobs(jobs);
  
  if (!result.success) {
    console.error('❌ Atomic upsert failed:', result.errors);
  } else {
    console.log(`✅ Atomic upsert completed: ${result.inserted} inserted, ${result.updated} updated`);
  }
  
  return jobs;
}
```

## Benefits

### 1. Performance
- **Eliminates race conditions**: No more "check then insert" race conditions
- **Reduces database calls**: Single operation instead of multiple queries
- **Better concurrency**: Multiple scrapers can run simultaneously without conflicts

### 2. Data Quality
- **Real posting dates**: More accurate job freshness
- **Freshness tiers**: Better job prioritization for users
- **Consistent data**: Atomic operations ensure data integrity

### 3. Scalability
- **Batch processing**: Can handle large job batches efficiently
- **Error handling**: Better error reporting and recovery
- **Monitoring**: Track insert vs update ratios

### 4. User Experience
- **Fresher jobs**: Real posting dates improve job relevance
- **Better matching**: Freshness tiers help prioritize recent opportunities
- **Faster updates**: Atomic operations reduce processing time

## Migration Guide

### 1. Database Setup
```bash
# Run the migration
psql -d your_database -f migration_add_job_hash_unique_constraint.sql
```

### 2. Update Scrapers
- Replace individual scraper upsert logic with `atomicUpsertJobs()`
- Add date extraction calls
- Update job creation to include all required fields

### 3. Update Matching Logic
- Use `freshness_tier` for job prioritization
- Consider `extracted_posted_date` for more accurate matching
- Update queries to use new indexes

### 4. Testing
- Test atomic upserts with duplicate jobs
- Verify date extraction accuracy
- Check freshness tier calculations
- Monitor performance improvements

## Monitoring & Analytics

### Key Metrics to Track
- **Upsert success rate**: Should be > 99%
- **Date extraction success rate**: Platform-specific
- **Freshness tier distribution**: Should skew toward FRESH/RECENT
- **Processing time**: Should be faster than before

### Example Queries
```sql
-- Check freshness tier distribution
SELECT freshness_tier, COUNT(*) 
FROM jobs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY freshness_tier;

-- Check date extraction success
SELECT source, 
       COUNT(*) as total_jobs,
       COUNT(extracted_posted_date) as with_real_dates,
       ROUND(COUNT(extracted_posted_date) * 100.0 / COUNT(*), 2) as extraction_rate
FROM jobs 
GROUP BY source;

-- Monitor upsert performance
SELECT DATE(created_at) as date,
       COUNT(*) as jobs_processed,
       AVG(EXTRACT(EPOCH FROM (created_at - scrape_timestamp))) as avg_processing_seconds
FROM jobs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Troubleshooting

### Common Issues

1. **Unique constraint violations**
   - Check for duplicate job_hash generation
   - Verify hash algorithm consistency across scrapers

2. **Date extraction failures**
   - Check if job sites changed their HTML structure
   - Update extraction patterns for new formats

3. **Performance issues**
   - Monitor index usage
   - Consider batch size adjustments
   - Check for long-running transactions

### Debug Commands
```sql
-- Check for duplicate job_hashes
SELECT job_hash, COUNT(*) 
FROM jobs 
GROUP BY job_hash 
HAVING COUNT(*) > 1;

-- Check recent upsert activity
SELECT source, 
       DATE(created_at) as date,
       COUNT(*) as jobs_added
FROM jobs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY source, DATE(created_at)
ORDER BY date DESC, jobs_added DESC;
```

## Future Enhancements

1. **Machine Learning Date Extraction**: Use ML models for better date parsing
2. **Real-time Freshness Updates**: Background job to update freshness tiers
3. **Advanced Deduplication**: Fuzzy matching for similar jobs
4. **Performance Optimization**: Connection pooling, query optimization
5. **Analytics Dashboard**: Real-time monitoring of scraper performance
