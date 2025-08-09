# Automated Scraping Infrastructure Setup

## Overview

This guide sets up automated job scraping with API endpoints, scheduling, and job lifecycle management.

## 1. Environment Variables

Add these to your `.env.local` file:

```bash
# API Authentication
SCRAPE_API_KEY=your-secure-api-key-here

# Database (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Custom API URLs (defaults to your domain)
SCRAPE_API_URL=https://your-domain.com/api/scrape
CLEANUP_API_URL=https://your-domain.com/api/cleanup-jobs
```

## 2. Database Schema Updates

Run the migration to add job lifecycle tracking:

```sql
-- Add job lifecycle columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP DEFAULT NOW();
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs (is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen_at ON jobs (last_seen_at);
CREATE INDEX IF NOT EXISTS idx_jobs_active_last_seen ON jobs (is_active, last_seen_at);
```

## 3. API Endpoints

### Scraping Endpoint: `/api/scrape`

**POST** - Trigger scraping for specified platforms

```bash
curl -X POST https://your-domain.com/api/scrape \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "platforms": ["all"],
    "companies": []
  }'
```

**Response:**
```json
{
  "success": true,
  "runId": "uuid-here",
  "timestamp": "2024-01-01T12:00:00Z",
  "results": {
    "remoteok": {
      "success": true,
      "jobs": 25,
      "inserted": 20,
      "updated": 5
    },
    "greenhouse": [
      {
        "company": "Stripe",
        "success": true,
        "jobs": 15,
        "inserted": 12,
        "updated": 3
      }
    ]
  }
}
```

### Cleanup Endpoint: `/api/cleanup-jobs`

**POST** - Mark old jobs as inactive

```bash
curl -X POST https://your-domain.com/api/cleanup-jobs \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "daysThreshold": 7
  }'
```

**GET** - Get job statistics

```bash
curl https://your-domain.com/api/cleanup-jobs \
  -H "x-api-key: your-api-key"
```

## 4. Scheduling Options

### Option A: GitHub Actions (Recommended)

1. **Add Secrets** to your GitHub repository:
   - `SCRAPE_API_URL`: Your scraping API endpoint
   - `CLEANUP_API_URL`: Your cleanup API endpoint
   - `SCRAPE_API_KEY`: Your API key
   - `SLACK_WEBHOOK_URL`: (Optional) Slack notifications

2. **The workflow runs automatically** every 4 hours

3. **Manual triggering** via GitHub Actions UI

### Option B: Cron Jobs (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add these lines:
# Scrape every 4 hours
0 */4 * * * cd /path/to/your/project && SCRAPE_API_KEY=your-key node scripts/schedule-scraping.js

# Cleanup daily at 2 AM
0 2 * * * cd /path/to/your/project && SCRAPE_API_KEY=your-key node scripts/schedule-scraping.js cleanup
```

### Option C: Windows Task Scheduler

1. Create a new task
2. Set trigger to run every 4 hours
3. Action: Start a program
4. Program: `node`
5. Arguments: `scripts/schedule-scraping.js`
6. Start in: Your project directory

### Option D: Vercel Cron Jobs

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/cleanup-jobs",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## 5. Testing the Setup

### Test API Endpoints

```bash
# Test scraping
curl -X POST https://your-domain.com/api/scrape \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"platforms": ["remoteok"]}'

# Test cleanup
curl -X POST https://your-domain.com/api/cleanup-jobs \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"daysThreshold": 1}'

# Get statistics
curl https://your-domain.com/api/cleanup-jobs \
  -H "x-api-key: your-api-key"
```

### Test Scheduling Script

```bash
# Test full schedule
node scripts/schedule-scraping.js

# Test scraping only
node scripts/schedule-scraping.js scrape

# Test cleanup only
node scripts/schedule-scraping.js cleanup

# Test with specific platforms
SCRAPE_PLATFORMS=greenhouse,lever node scripts/schedule-scraping.js
```

## 6. Monitoring & Alerts

### Key Metrics to Monitor

```sql
-- Active jobs by source
SELECT source, COUNT(*) as active_jobs
FROM jobs 
WHERE is_active = true
GROUP BY source
ORDER BY active_jobs DESC;

-- Jobs by freshness tier
SELECT freshness_tier, COUNT(*) as count
FROM jobs 
WHERE is_active = true
GROUP BY freshness_tier
ORDER BY count DESC;

-- Recent scraping activity
SELECT 
  DATE(created_at) as date,
  source,
  COUNT(*) as jobs_added
FROM jobs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), source
ORDER BY date DESC, jobs_added DESC;

-- Cleanup statistics
SELECT 
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE is_active = true) as active_jobs,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_jobs,
  ROUND(COUNT(*) FILTER (WHERE is_active = false) * 100.0 / COUNT(*), 2) as inactive_percentage
FROM jobs;
```

### Health Check Endpoint

Create `/api/health` for monitoring:

```typescript
export async function GET() {
  const supabase = getSupabaseClient();
  
  try {
    // Check database connection
    const { count: totalJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    // Check recent activity
    const { count: recentJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        totalJobs: totalJobs || 0,
        recentJobs: recentJobs || 0
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}
```

## 7. Security Considerations

### API Key Security

1. **Generate a strong API key**:
   ```bash
   openssl rand -base64 32
   ```

2. **Rotate keys regularly** (every 90 days)

3. **Use environment variables** - never hardcode

4. **Limit access** - only trusted systems should have the key

### Rate Limiting

The endpoints include rate limiting:
- Scraping: 5 requests per minute per IP
- Cleanup: 2 requests per 5 minutes per IP

### Network Security

1. **Use HTTPS** for all API calls
2. **Validate API key** on every request
3. **Log access** for security monitoring

## 8. Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Check environment variables
   - Verify key is correctly set
   - Ensure no extra spaces

2. **Rate Limited**
   - Wait for rate limit to reset
   - Check if multiple processes are running
   - Adjust rate limits if needed

3. **Database Errors**
   - Check Supabase connection
   - Verify schema migrations
   - Check service role permissions

4. **Scraping Failures**
   - Check if job sites changed
   - Verify network connectivity
   - Check for IP blocking

### Debug Commands

```bash
# Check API status
curl https://your-domain.com/api/scrape

# Test with verbose output
node scripts/schedule-scraping.js --verbose

# Check recent logs
tail -f /var/log/your-app.log

# Monitor database
psql -d your-database -c "SELECT COUNT(*) FROM jobs WHERE is_active = true;"
```

## 9. Performance Optimization

### Database Optimization

```sql
-- Analyze table performance
ANALYZE jobs;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'jobs'
ORDER BY idx_scan DESC;

-- Monitor slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%jobs%'
ORDER BY mean_time DESC
LIMIT 10;
```

### Scraping Optimization

1. **Batch processing**: Process jobs in batches of 100
2. **Concurrent scraping**: Run multiple platforms simultaneously
3. **Caching**: Cache job descriptions to avoid re-scraping
4. **Connection pooling**: Use connection pooling for database

## 10. Scaling Considerations

### Horizontal Scaling

1. **Multiple scrapers**: Run scrapers on different servers
2. **Load balancing**: Distribute scraping load
3. **Database sharding**: Split jobs table by source or date

### Vertical Scaling

1. **Increase memory**: For larger job batches
2. **Faster CPU**: For complex date extraction
3. **SSD storage**: For better database performance

## 11. Maintenance

### Regular Tasks

1. **Monitor logs** daily for errors
2. **Check job statistics** weekly
3. **Rotate API keys** every 90 days
4. **Update scrapers** when job sites change
5. **Clean old logs** monthly

### Backup Strategy

1. **Database backups** daily
2. **Configuration backups** weekly
3. **Code backups** on every deployment

This automated infrastructure will provide reliable, scalable job scraping with proper monitoring and maintenance.
