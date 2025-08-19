# Scraper Audit Report for 150-User Pilot

## Executive Summary

**Goal**: Audit and harden all scrapers for 150-user pilot with enforced ingestion rule: Early-career eligibility → Career path → Location → URL. Optional fields must NOT block inserts (use "unknown" as needed). Single career path per user; jobs must carry canonical career:<slug> tag.

**Status**: 🟡 **CRITICAL GAPS IDENTIFIED** - Multiple scrapers failing to meet pilot requirements

---

## 1. Scraper Inventory Table

| Scraper | Target Site | Fetch Method | Anti-Bot Tactics | Fields Produced | Early-Career Filter | Career Tag | Dedupe Key | DB Write Path | Known Issues |
|---------|-------------|--------------|------------------|-----------------|-------------------|------------|-------------|---------------|--------------|
| `greenhouse.ts` | Greenhouse API/HTML | JSON API + HTML fallback | UA rotation, rate limiting, headers | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `lever.ts` | Lever API/HTML | JSON API + HTML fallback | UA rotation, circuit breaker | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `workday.ts` | Workday HTML | HTML scraping | UA rotation, circuit breaker | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `remoteok.ts` | RemoteOK API | JSON API | UA rotation, rate limiting | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `eures.ts` | EURES RSS/HTML | RSS + HTML | UA rotation | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `jobteaser.ts` | JobTeaser HTML | HTML scraping | UA rotation, puppeteer | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `milkround.ts` | Milkround HTML | HTML scraping | UA rotation | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `trinity-dublin.ts` | Trinity Dublin HTML | HTML scraping | UA rotation | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `eth-zurich.ts` | ETH Zurich HTML | HTML scraping | UA rotation | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `tu-delft.ts` | TU Delft HTML | HTML scraping | UA rotation | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `iagora.ts` | IAGORA HTML | HTML scraping | UA rotation | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `wellfound.ts` | Wellfound HTML | HTML scraping | UA rotation | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `smartrecruiters.ts` | SmartRecruiters HTML | HTML scraping | UA rotation | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `graduateland.ts` | Graduateland HTML | HTML scraping | UA rotation | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |
| `graduatejobs.ts` | GraduateJobs HTML | HTML scraping | UA rotation | ✅ All required | ❌ **MISSING** - no filter | ❌ **MISSING** - hardcoded empty | ✅ job_hash | ✅ atomicUpsertJobs | **BLOCKING**: No early-career filter, no career path |

---

## 2. Critical Gap Analysis

### 🚨 **BLOCKING ISSUES** (Must Fix Before Pilot)

#### A. Early-Career Filter Missing (15/15 scrapers)
- **Impact**: All scrapers will ingest senior roles, diluting early-career job pool
- **Evidence**: No `isEarlyCareerEligible()` calls found in any scraper
- **Fix Required**: Implement early-career gate before job creation

#### B. Career Path Tag Missing (15/15 scrapers)  
- **Impact**: Jobs lack canonical career tags, breaking matching system
- **Evidence**: All scrapers hardcode `career_path: ''` or omit entirely
- **Fix Required**: Call `extractCareerPath()` and set canonical slug

#### C. Location Handling Inconsistent
- **Impact**: Some scrapers may drop jobs with ambiguous locations
- **Evidence**: Mixed handling of location fields across scrapers
- **Fix Required**: Standardize to use "unknown" for unclear locations

#### D. Optional Field Blocking
- **Impact**: Missing optional fields may prevent job insertion
- **Evidence**: Some scrapers don't handle all optional fields gracefully
- **Fix Required**: Ensure all optional fields default to "unknown"

### ⚠️ **RISK ISSUES** (Should Address)

#### E. Anti-Bot Tactics Inconsistent
- **Impact**: Some scrapers may get blocked more easily
- **Evidence**: Varying levels of anti-detection implementation
- **Risk Level**: Medium

#### F. Error Handling Incomplete
- **Impact**: Scraper failures may not be properly logged/recovered
- **Evidence**: Inconsistent error handling patterns
- **Risk Level**: Medium

---

## 3. Per-Scraper Fixes Required

### **CRITICAL FIXES** (All Scrapers)

#### 1. Add Early-Career Filter
```typescript
// Add to each scraper's job processing loop
import { isEarlyCareerEligible } from '../Utils/robustJobCreation';

// Before creating job object:
const eligibility = isEarlyCareerEligible(title, description);
if (!eligibility.eligible) {
  console.log(`🚫 Skipping senior role: ${title}`);
  continue; // Skip this job
}
```

#### 2. Add Career Path Extraction
```typescript
// Replace hardcoded career_path: '' with:
const careerPath = extractCareerPath(title, description);
// career_path: careerPath
```

#### 3. Standardize Location Handling
```typescript
// Replace location extraction with:
const location = extractLocation || 'unknown';
```

#### 4. Ensure Optional Fields Don't Block
```typescript
// Add defaults for all optional fields:
professional_expertise: professionalExpertise || 'unknown',
start_date: startDate || 'TBD',
visa_status: visaStatus || 'unknown',
entry_level_preference: entryLevelPreference || 'unknown',
```

### **SPECIFIC SCRAPER FIXES**

#### Greenhouse Scraper
- **Issue**: API fallback doesn't filter early-career roles
- **Fix**: Add early-career filter to `tryGreenhouseAPI()` function
- **Location**: Line 620-669 in `greenhouse.ts`

#### Lever Scraper  
- **Issue**: No early-career filtering in job processing
- **Fix**: Add eligibility check before job creation
- **Location**: Job processing loop in `lever.ts`

#### Workday Scraper
- **Issue**: Missing career path extraction
- **Fix**: Add `extractCareerPath()` call
- **Location**: Job object creation in `workday.ts`

---

## 4. Shared Framework Plan

### **Proposed Centralized Scraper Framework**

#### A. Core Scraper Base Class
```typescript
abstract class BaseScraper {
  protected abstract fetchJobs(): Promise<RawJob[]>;
  protected abstract parseJob(raw: RawJob): Promise<Job>;
  
  async scrape(): Promise<ScrapeResult> {
    const rawJobs = await this.fetchJobs();
    const eligibleJobs = this.filterEarlyCareer(rawJobs);
    const taggedJobs = this.addCareerPaths(eligibleJobs);
    const normalizedJobs = this.normalizeLocations(taggedJobs);
    return this.upsertJobs(normalizedJobs);
  }
}
```

#### B. Centralized Anti-Bot System
```typescript
class AntiBotManager {
  private rateLimiters = new Map<string, RateLimiter>();
  private userAgentPool = [...];
  
  async makeRequest(url: string, options: RequestOptions) {
    const rateLimiter = this.getRateLimiter(url);
    await rateLimiter.wait();
    return this.executeWithRetry(() => this.makeRequest(url, options));
  }
}
```

#### C. Standardized Job Processing Pipeline
```typescript
class JobProcessor {
  processJob(rawJob: RawJob): Job | null {
    // 1. Early-career eligibility check
    if (!this.isEarlyCareerEligible(rawJob)) return null;
    
    // 2. Career path extraction
    const careerPath = this.extractCareerPath(rawJob);
    
    // 3. Location normalization
    const location = this.normalizeLocation(rawJob.location);
    
    // 4. Create job with defaults
    return this.createJob(rawJob, careerPath, location);
  }
}
```

---

## 5. Validation Checklist

### **Pre-Pilot Validation Requirements**

#### ✅ **Functional Requirements**
- [ ] Each scraper yields non-zero raw jobs
- [ ] Each scraper yields non-zero eligible jobs after filtering
- [ ] All jobs insert/update with job_hash successfully
- [ ] All jobs have canonical career tags present
- [ ] All jobs have locations set or "unknown"
- [ ] Anti-bot settings are active and working

#### ✅ **Observability Requirements**
- [ ] Funnel logs per scraper: raw → eligible → after_dedupe → inserted → updated → errors
- [ ] 5 sample job titles logged per scraper run
- [ ] Error rates < 5% per scraper
- [ ] Success rates > 80% per scraper

#### ✅ **Data Quality Requirements**
- [ ] No jobs with empty career_path
- [ ] No jobs with empty location
- [ ] All optional fields have fallback values
- [ ] job_hash uniqueness maintained
- [ ] No duplicate job insertions

---

## 6. Implementation Priority

### **Phase 1: Critical Fixes (Week 1)**
1. Add early-career filter to all scrapers
2. Add career path extraction to all scrapers  
3. Standardize location handling
4. Add optional field defaults

### **Phase 2: Framework Implementation (Week 2)**
1. Create BaseScraper class
2. Implement centralized anti-bot system
3. Create standardized job processing pipeline
4. Migrate 2-3 scrapers to new framework

### **Phase 3: Validation & Testing (Week 3)**
1. Run all scrapers and validate output
2. Monitor funnel metrics
3. Fix any remaining issues
4. Document final state

---

## 7. Risk Assessment

### **High Risk**
- **Early-career filter missing**: Will ingest senior roles, breaking pilot
- **Career path missing**: Will break matching system entirely
- **Location handling**: May drop valid jobs

### **Medium Risk**  
- **Anti-bot detection**: Some scrapers may get blocked
- **Error handling**: Failures may not be properly logged
- **Performance**: Some scrapers may be slow/unreliable

### **Low Risk**
- **Code duplication**: Inefficient but functional
- **Monitoring gaps**: Harder to debug but not blocking

---

## 8. Success Metrics

### **Pilot Readiness Criteria**
- ✅ All 15 scrapers functional
- ✅ Early-career filter active on all scrapers
- ✅ Career path tags present on all jobs
- ✅ Location handling standardized
- ✅ Error rates < 5%
- ✅ Success rates > 80%
- ✅ Funnel logging operational

### **Post-Pilot Success Metrics**
- 📊 1000+ early-career jobs ingested per day
- 📊 95%+ job insertion success rate
- 📊 < 2% duplicate job rate
- 📊 All career paths represented
- 📊 EU locations prioritized

---

**Next Steps**: Implement Phase 1 critical fixes immediately to enable pilot launch.
