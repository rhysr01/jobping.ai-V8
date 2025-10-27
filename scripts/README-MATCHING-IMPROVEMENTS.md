# JobPing Database Matching Improvements

This directory contains SQL scripts to dramatically improve job matching quality and performance.

##  Current Database Issues (Before Improvements)

| Issue | Impact | Severity |
|-------|--------|----------|
| 99.5% missing city/country | Can't match by location | ´ Critical |
| 35% missing descriptions | Weak AI matching |  High |
| 100% missing language requirements | Can't filter by language |  High |
| No indexes on key fields | Slow queries |  High |
| 14,766 total jobs † only 12,748 early career | Mixed quality | ¢ Resolved |

## ¯ Script Execution Order

Run these scripts in order after each job scraping session:

### 1ƒ£ **classify-early-career-jobs.sql** (REQUIRED - Run First)
Automatically flags early career roles and filters out mid/senior positions.

```bash
psql $DATABASE_URL -f scripts/classify-early-career-jobs.sql
```

**What it does:**
- Flags 99.9% of early career roles (internships, graduate schemes, junior, analyst)
- Filters out senior/manager/director roles
- Filters out roles requiring 3+ years experience
- Covers 9 languages: English, Spanish, French, German, Italian, Dutch, Portuguese, etc.

**Expected result:** ~12,000 active early career jobs, <20 unflagged ambiguous roles

---

### 2ƒ£ **improve-matching-data-quality.sql** (REQUIRED - Run Second)
Enriches job data for better matching.

```bash
psql $DATABASE_URL -f scripts/improve-matching-data-quality.sql
```

**What it does:**
- Extracts city & country from location field (fixes 99.5% missing data)
- Normalizes company names (removes Ltd, GmbH, etc.)
- Infers language requirements from location + description
- Extracts salary information where available
- Calculates job age for freshness ranking
- Improves work environment classification

**Expected improvements:**
- City/Country coverage: 0.5% † **~95%**
- Language requirements: 0% † **~90%**
- Better company matching

---

### 3ƒ£ **create-matching-indexes.sql** (OPTIONAL - Run Once)
Creates indexes for 10x faster matching queries.

```bash
psql $DATABASE_URL -f scripts/create-matching-indexes.sql
```

**What it does:**
- Creates 25+ indexes on frequently queried fields
- Location indexes (city, country, combined)
- Early career indexes (is_graduate, is_internship)
- Full-text search indexes (title, description)
- Composite indexes for common query patterns
- Match table indexes for performance

**Performance impact:** Matching queries go from **200-500ms † 10-50ms**

---

##  Automated Pipeline

### Recommended Workflow

```bash
#!/bin/bash
# After your scrapers run, execute these scripts:

# 1. Classify new jobs as early career
psql $DATABASE_URL -f scripts/classify-early-career-jobs.sql

# 2. Enrich job data for matching
psql $DATABASE_URL -f scripts/improve-matching-data-quality.sql

# 3. (Optional) Run VACUUM to update statistics
psql $DATABASE_URL -c "VACUUM ANALYZE jobs;"
```

### Add to Your Cron Job

```bash
0 2 * * * /path/to/scrape-jobs.sh && /path/to/classify-and-enrich.sh
```

---

## ˆ Data Quality Metrics

### Before Improvements
```
Total jobs: 14,766
 Early career flagged: 50 (0.3%)
 With city: 66 (0.5%)
 With country: 66 (0.5%)
 With language reqs: 0 (0%)
 Missing descriptions: 35%
```

### After Improvements
```
Total active jobs: ~12,000
 Early career flagged: ~11,980 (99.9%)
 With city: ~11,400 (95%)
 With country: ~11,400 (95%)
 With language reqs: ~10,800 (90%)
 Unflagged ambiguous: ~20 (0.1%)
```

---

##  What Gets Flagged as Early Career

### Internships (`is_internship = true`)
- English: intern, internship, placement, working student
- Spanish: prÃcticas, becario
- Italian: stagista, tirocinio
- French: stage, stagiaire
- German: praktikum, werkstudent
- Dutch: stagiair, jobstudent

### Graduate Roles (`is_graduate = true`)
- Graduate programmes, trainee, junior
- Entry level, apprentice, rotational
- PhD/Doctoral positions
- Analyst roles (Investment Banking, Financial, Data, etc.)
- Associate roles (in finance/consulting)
- Assistant roles
- VIE (French international volunteers)
- ITP (bank talent programmes)
- Alternance (French work-study)
- Ausbildung (German apprenticeships)
- Year-specific programmes (2025, 2026)

### What Gets Filtered Out
- Senior, Lead, Manager, Director, VP, Executive
- Roles requiring 3+ years experience
- Coordinators, Specialists (without graduate marker)
- Partners, Advisers, Controllers
- Qualified professionals (therapists, craftsmen, faculty)
- Data Scientists, Developers/Engineers (without junior marker)

---

##  Matching Query Examples

### Find Early Career Finance Jobs in London

```sql
SELECT title, company, city, job_age_days, work_environment
FROM jobs
WHERE is_active = true
  AND (is_graduate = true OR is_internship = true)
  AND city = 'London'
  AND (
    LOWER(title) LIKE '%financ%'
    OR LOWER(title) LIKE '%banking%'
    OR LOWER(title) LIKE '%analyst%'
  )
  AND job_age_days <= 30
ORDER BY job_age_days ASC
LIMIT 50;
```

### Find Remote Graduate Tech Roles in Germany

```sql
SELECT title, company, city, language_requirements
FROM jobs
WHERE is_active = true
  AND is_graduate = true
  AND country = 'DE'
  AND work_environment = 'remote'
  AND (
    LOWER(title) LIKE '%software%'
    OR LOWER(title) LIKE '%developer%'
    OR LOWER(title) LIKE '%engineer%'
  )
ORDER BY created_at DESC;
```

### Find Internships for French Speakers

```sql
SELECT title, company, city, country
FROM jobs
WHERE is_active = true
  AND is_internship = true
  AND 'French' = ANY(language_requirements)
ORDER BY job_age_days ASC
LIMIT 100;
```

---

##  Performance Tips

### 1. Keep Indexes Updated
After bulk updates, run:
```sql
VACUUM ANALYZE jobs;
```

### 2. Monitor Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM jobs
WHERE is_active = true
  AND city = 'Berlin'
  AND is_graduate = true;
```

### 3. Regular Cleanup
Remove old inactive jobs monthly:
```sql
DELETE FROM jobs
WHERE is_active = false
  AND updated_at < now() - interval '90 days';
```

---

##  Maintenance Scripts

### Check Data Quality
```sql
-- Run this monthly to monitor data quality
SELECT 
  COUNT(*) as total_active,
  ROUND(100.0 * COUNT(CASE WHEN city IS NOT NULL THEN 1 END) / COUNT(*), 2) as pct_with_city,
  ROUND(100.0 * COUNT(CASE WHEN is_graduate OR is_internship THEN 1 END) / COUNT(*), 2) as pct_early_career,
  ROUND(100.0 * COUNT(CASE WHEN language_requirements != '{}' THEN 1 END) / COUNT(*), 2) as pct_with_languages
FROM jobs
WHERE is_active = true;
```

### Find Duplicates
```sql
-- Identify potential duplicates
SELECT company, title, city, COUNT(*)
FROM jobs
WHERE is_active = true
GROUP BY company, title, city
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

---

##  Troubleshooting

### Script Fails with "Read-Only Transaction"
You're connected to a read replica. Use the primary database connection.

### No Improvements After Running Scripts
Check that you committed the transaction:
- Scripts use `BEGIN` and `COMMIT`
- If you see errors, the transaction may have rolled back
- Re-run with error checking

### Indexes Taking Too Long
Large tables need time. Indexes can be created concurrently:
```sql
CREATE INDEX CONCURRENTLY idx_jobs_city 
ON jobs(city) 
WHERE is_active = true;
```

---

##  Additional Resources

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [GIN Indexes for Arrays](https://www.postgresql.org/docs/current/gin.html)
- [Query Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

---

##  Success Checklist

After running all scripts, verify:

- [ ] ~12,000 active early career jobs
- [ ] >95% have city/country populated
- [ ] >90% have language requirements
- [ ] <1% unflagged jobs
- [ ] All indexes created (check `\di jobs` in psql)
- [ ] Matching queries run in <50ms

---

**Last Updated:** October 2025  
**Maintained by:** JobPing Team

