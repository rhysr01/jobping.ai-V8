# 🎓 University Career Portal Scrapers

## Overview

Added 3 high-quality university career portal scrapers to JobPing, targeting top European universities with excellent graduate job opportunities:

- **🇮🇪 Trinity Dublin** - Ireland's top university
- **🇳🇱 TU Delft** - Netherlands engineering powerhouse  
- **🇨🇭 ETH Zurich** - Swiss excellence in engineering & finance

## Expected Output

**Target: 1,000-1,500 high-quality graduate jobs** from these university career portals.

## Scraper Details

### 🎓 Trinity Dublin (`trinity-dublin.ts`)

**Target URLs:**
- `https://www.tcd.ie/careers/students/jobs/`
- `https://www.tcd.ie/careers/students/graduate-opportunities/`
- `https://www.tcd.ie/careers/students/internships/`
- `https://www.tcd.ie/careers/students/part-time-work/`

**Key Features:**
- Irish market focus (Dublin, Ireland)
- Graduate, internship, and part-time opportunities
- English language jobs
- Strong in: Technology, Finance, Consulting, Research

**Expected Jobs:** 200-300 per scrape

### 🇳🇱 TU Delft (`tu-delft.ts`)

**Target URLs:**
- `https://www.tudelft.nl/en/careers/`
- `https://careercenter.tudelft.nl/`
- `https://www.tudelft.nl/en/student/career-support/job-opportunities/`
- `https://www.tudelft.nl/en/student/career-support/internships/`
- `https://www.tudelft.nl/en/student/career-support/graduate-opportunities/`

**Key Features:**
- Dutch market focus (Delft, Netherlands)
- Bilingual support (Dutch + English)
- Engineering-heavy opportunities
- Target companies: ASML, Philips, Shell, ING, KLM, Unilever, TNO

**Expected Jobs:** 300-400 per scrape

### 🇨🇭 ETH Zurich (`eth-zurich.ts`)

**Target URLs:**
- `https://ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich/jobs.html`
- `https://ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich/student-jobs.html`
- `https://ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich/internships.html`
- `https://ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich/graduate-opportunities.html`
- `https://ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich/career-services.html`

**Key Features:**
- Swiss market focus (Zurich, Switzerland)
- Multilingual support (German, French, Italian, English)
- Engineering + Finance focus
- High-quality research opportunities

**Expected Jobs:** 200-300 per scrape

## Technical Implementation

### Smart Filtering

All scrapers include intelligent graduate role detection:

**Graduate Keywords (English):**
- `graduate`, `grad`, `recent graduate`, `graduate programme`
- `intern`, `internship`, `student`, `part-time`
- `entry level`, `junior`, `trainee`, `associate`, `starter`
- `0-1 year`, `0-2 year`, `no experience`

**Local Language Keywords:**
- **Dutch:** `afgestudeerd`, `starter`, `junior`, `trainee`, `stagiair`
- **German:** `absolvent`, `junior`, `trainee`, `praktikant`, `einstiegsposition`

**Senior Keywords (Excluded):**
- `senior`, `lead`, `principal`, `staff`, `director`, `manager`
- `5+ year`, `3+ year`, `experienced`, `expert`, `specialist`

### Multi-Format Parsing

Each scraper supports multiple page formats:

1. **Career Center Format** - University-specific layouts
2. **Student Portal Format** - Student-focused job boards
3. **Standard Format** - International job listing formats

### Rate Limiting & Anti-Detection

- **Random delays:** 2-5 seconds between requests
- **User agent rotation:** Multiple browser user agents
- **Accept-Language headers:** Localized for each university
- **Referer headers:** Google referer for natural traffic

### Content Analysis

**Experience Level Detection:**
- `internship` - Intern, stagiair, praktikant
- `graduate` - Graduate, absolvent, afgestudeerd  
- `entry-level` - Junior, starter, einstieg

**Language Requirements:**
- **Trinity:** English, Irish
- **TU Delft:** English, Dutch
- **ETH Zurich:** English, German, French, Italian

**Industry Categories:**
- Technology, Engineering, Finance, Research
- Consulting, Marketing, Healthcare, Manufacturing

## Integration

### API Endpoint

The scrapers are integrated into `/api/scrape` route:

```typescript
// Scrape Trinity Dublin
if (platforms.includes('trinity-dublin') || platforms.includes('all')) {
  const { scrapeTrinityDublin } = await import('@/scrapers/trinity-dublin');
  const trinityJobs = await scrapeTrinityDublin(runId);
}

// Scrape TU Delft  
if (platforms.includes('tu-delft') || platforms.includes('all')) {
  const { scrapeTUDelft } = await import('@/scrapers/tu-delft');
  const tuDelftJobs = await scrapeTUDelft(runId);
}

// Scrape ETH Zurich
if (platforms.includes('eth-zurich') || platforms.includes('all')) {
  const { scrapeETHZurich } = await import('@/scrapers/eth-zurich');
  const ethJobs = await scrapeETHZurich(runId);
}
```

### Production Scraper

Automatically included in production scraping cycles via the API endpoint.

### CLI Testing

Each scraper can be tested individually:

```bash
# Test Trinity Dublin
node scrapers/trinity-dublin.js

# Test TU Delft  
node scrapers/tu-delft.js

# Test ETH Zurich
node scrapers/eth-zurich.js
```

## Database Schema Compatibility

All scrapers output jobs compatible with the existing `jobs` table schema:

```sql
CREATE TABLE public.jobs (
  id                  SERIAL PRIMARY KEY,
  title               TEXT              NOT NULL,
  company             TEXT              NOT NULL,
  location            TEXT              NOT NULL,
  job_url             TEXT              NOT NULL,
  description         TEXT              NOT NULL,
  categories          TEXT              NULL,        -- String format
  experience_required TEXT              NULL,
  language_requirements TEXT            NULL,        -- String format
  work_environment    TEXT              NOT NULL,
  source              TEXT              NOT NULL,    -- 'trinity-dublin', 'tu-delft', 'eth-zurich'
  job_hash            TEXT              NOT NULL UNIQUE,
  posted_at           TIMESTAMP WITH TIME ZONE NOT NULL,
  -- ... other fields
);
```

## Monitoring & Performance

### Performance Tracking

- **Duration tracking:** Via `PerformanceMonitor.trackDuration()`
- **Memory usage:** Monitored in production scraper
- **Success rates:** Tracked per scraper

### Expected Metrics

- **Success Rate:** 85-95% (university sites are stable)
- **Response Time:** 2-5 seconds per page
- **Job Quality:** High (university-curated opportunities)
- **Freshness:** Very fresh (university jobs are typically recent)

## Benefits

### For Job Seekers

1. **High-Quality Opportunities:** University-curated jobs
2. **Graduate-Focused:** Specifically targets entry-level roles
3. **Geographic Diversity:** Ireland, Netherlands, Switzerland
4. **Industry Variety:** Engineering, Finance, Technology, Research

### For JobPing

1. **New Job Sources:** 3 additional high-quality sources
2. **Geographic Expansion:** European market coverage
3. **Quality Improvement:** University jobs are typically well-curated
4. **Competitive Advantage:** Unique university career portal access

## Future Enhancements

### Potential Additions

1. **More Universities:**
   - Imperial College London
   - Technical University of Munich
   - Delft University of Technology
   - University of Amsterdam

2. **Enhanced Features:**
   - Salary range extraction
   - Application deadline tracking
   - Company profile enrichment
   - Alumni network integration

3. **Advanced Filtering:**
   - Course-specific job matching
   - Visa sponsorship detection
   - Language proficiency requirements

## Maintenance

### Regular Checks

- **URL Validation:** Monthly check of target URLs
- **Selector Updates:** Quarterly review of CSS selectors
- **Performance Monitoring:** Weekly success rate analysis
- **Content Quality:** Monthly job quality assessment

### Troubleshooting

**Common Issues:**
- University website redesigns
- Rate limiting from university servers
- Changes in job posting formats
- Language detection improvements needed

**Resolution:**
- Update selectors in scraper files
- Adjust rate limiting parameters
- Enhance parsing logic
- Improve language detection algorithms
