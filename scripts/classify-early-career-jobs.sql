-- ============================================================================
-- CLASSIFY EARLY CAREER JOBS - Production Script
-- ============================================================================
-- This script flags early career roles and filters out mid/senior positions
-- Run this after every job scraping session to ensure quality matching
-- 
-- Usage: psql $DATABASE_URL -f scripts/classify-early-career-jobs.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: FLAG INTERNSHIP ROLES
-- ============================================================================

UPDATE jobs
SET 
  is_internship = true,
  updated_at = now()
WHERE is_active = true
  AND is_internship = false
  AND (
    -- English
    LOWER(title) LIKE '%intern%'
    OR LOWER(title) LIKE '%internship%'
    OR LOWER(title) LIKE '%placement%'
    
    -- Spanish/Portuguese
    OR LOWER(title) LIKE '%prácticas%'
    OR LOWER(title) LIKE '%practicas%'
    OR LOWER(title) LIKE '%beca %'
    OR LOWER(title) LIKE '% beca'
    OR LOWER(title) LIKE '%becario%'
    
    -- Italian
    OR LOWER(title) LIKE '%stagista%'
    OR LOWER(title) LIKE '%tirocinio%'
    OR LOWER(title) LIKE '%tirocinante%'
    OR LOWER(title) LIKE '%stage)%'
    OR LOWER(title) LIKE '%stages%'
    
    -- French
    OR LOWER(title) LIKE '%stage %'
    OR LOWER(title) LIKE '% stage'
    OR LOWER(title) LIKE '%stagiaire%'
    
    -- German
    OR LOWER(title) LIKE '%praktikum%'
    OR LOWER(title) LIKE '%praktikant%'
    OR LOWER(title) LIKE '%werkstudent%'
    
    -- Dutch/Belgian
    OR LOWER(title) LIKE '%stagiair%'
    OR LOWER(title) LIKE '%stagiar%'
    OR LOWER(title) LIKE '%jobstudent%'
    
    -- English working student
    OR LOWER(title) LIKE '%working student%'
  );

-- ============================================================================
-- PART 2: FLAG GRADUATE/TRAINEE/JUNIOR ROLES
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND (
    -- Graduate programs
    LOWER(title) LIKE '%graduate%'
    OR LOWER(title) LIKE '%grad %'
    OR LOWER(title) LIKE '% grad'
    OR LOWER(title) LIKE '%new grad%'
    
    -- Trainee programs
    OR LOWER(title) LIKE '%trainee%'
    
    -- Junior roles
    OR LOWER(title) LIKE '%junior%'
    OR LOWER(title) LIKE '%junor%'  -- Common typo
    
    -- Entry level
    OR LOWER(title) LIKE '%entry level%'
    OR LOWER(title) LIKE '%entry-level%'
    
    -- Apprenticeships
    OR LOWER(title) LIKE '%apprentice%'
    OR LOWER(title) LIKE '%rotational%'
    
    -- German apprenticeships
    OR LOWER(title) LIKE '%ausbildung%'
    OR LOWER(title) LIKE '%fachausbildung%'
    OR LOWER(title) LIKE '%azubi%'
    OR LOWER(title) LIKE '%lehrling%'
    OR LOWER(title) LIKE '%nachwuchsführungskraft%'
    
    -- French work-study
    OR LOWER(title) LIKE '%alternance%'
    OR LOWER(title) LIKE '%alternant%'
    OR LOWER(title) LIKE '%apprentissage%'
    
    -- PhD/Academic early career
    OR LOWER(title) LIKE '%phd%'
    OR LOWER(title) LIKE '%ph.d%'
    OR LOWER(title) LIKE '%doctorate%'
    OR LOWER(title) LIKE '%doctoral%'
    OR LOWER(title) LIKE '%doktoratsstelle%'
    OR (LOWER(title) LIKE '%fellow%' AND LOWER(title) NOT LIKE '%senior%')
    
    -- Bank/company graduate programmes
    OR LOWER(title) LIKE '%itp%'  -- ING Talent Programme
    OR LOWER(title) LIKE '%talent community%'
    OR LOWER(title) LIKE '%bankeinstieg%'
    
    -- Insight/spring programmes
    OR LOWER(title) LIKE '%insight%'
    OR LOWER(title) LIKE '%spring week%'
    OR LOWER(title) LIKE '%spring program%'
    OR LOWER(title) LIKE '%spring programme%'
    OR LOWER(title) LIKE '%assessment centre%'
    OR LOWER(title) LIKE '%discovery%program%'
    
    -- Spanish recent graduates
    OR LOWER(title) LIKE '%recién graduado%'
    
    -- French VIE (international volunteer)
    OR LOWER(title) LIKE '%vie %'
    OR LOWER(title) LIKE '% vie'
    OR LOWER(title) LIKE '%vie-%'
    
    -- Year-specific programs (2025, 2026)
    OR title ~ '202[56]'
    
    -- Dual study programs
    OR LOWER(title) LIKE '%dualer%student%'
  );

-- ============================================================================
-- PART 3: FLAG ANALYST ROLES (Typically Entry-Level in Finance/Consulting)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- English analyst roles
    LOWER(title) LIKE '%analyst%'
    
    -- Spanish
    OR LOWER(title) LIKE '%analista%'
  )
  -- Exclude if clearly senior
  AND LOWER(title) NOT LIKE '%senior%'
  AND LOWER(title) NOT LIKE '%lead%'
  AND LOWER(title) NOT LIKE '%principal%'
  -- Only if description doesn't indicate mid/senior level
  AND (
    description IS NULL
    OR (
      LOWER(description) NOT LIKE '%5+ year%'
      AND LOWER(description) NOT LIKE '%7+ year%'
      AND LOWER(description) NOT LIKE '%extensive experience%'
      AND LOWER(description) NOT LIKE '%proven track record%'
    )
  );

-- ============================================================================
-- PART 4: FLAG ASSOCIATE & ASSISTANT ROLES
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- Associate (entry-level in finance/consulting)
    (LOWER(title) LIKE '%associate%' AND LOWER(title) NOT LIKE '%senior%')
    
    -- Assistant roles
    OR LOWER(title) LIKE '%assistant%'
    OR LOWER(title) LIKE '%asistente%'  -- Spanish
  );

-- ============================================================================
-- PART 5: FLAG JOBS WITH EARLY CAREER DESCRIPTION KEYWORDS
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND description IS NOT NULL
  AND (
    -- Years of experience
    LOWER(description) LIKE '%0-1 year%'
    OR LOWER(description) LIKE '%0-2 year%'
    OR LOWER(description) LIKE '%0 to 1 year%'
    OR LOWER(description) LIKE '%0 to 2 year%'
    OR LOWER(description) LIKE '%no experience%'
    OR LOWER(description) LIKE '%little to no experience%'
    
    -- Entry level indicators
    OR LOWER(description) LIKE '%entry level%'
    OR LOWER(description) LIKE '%entry-level%'
    OR LOWER(description) LIKE '%early career%'
    OR LOWER(description) LIKE '%first role%'
    OR LOWER(description) LIKE '%first job%'
    OR LOWER(description) LIKE '%kick%start%career%'
    
    -- Graduate indicators
    OR LOWER(description) LIKE '%recent graduate%'
    OR LOWER(description) LIKE '%new graduate%'
    OR LOWER(description) LIKE '%newly qualified%'
    OR LOWER(description) LIKE '%graduate programme%'
    OR LOWER(description) LIKE '%graduate program%'
    OR LOWER(description) LIKE '%graduate scheme%'
  );

-- ============================================================================
-- PART 6: FLAG AUDIT ROLES (Often Entry-Level)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%audit%'
  AND LOWER(title) NOT LIKE '%senior%';

-- ============================================================================
-- PART 7: FILTER OUT SENIOR/LEAD/MANAGER/DIRECTOR ROLES
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'senior_level_role',
  updated_at = now()
WHERE is_active = true
  AND (
    LOWER(title) LIKE '%senior%'
    OR LOWER(title) LIKE '%lead %'
    OR LOWER(title) LIKE '% lead'
    OR LOWER(title) LIKE '%manager%'
    OR LOWER(title) LIKE '%director%'
    OR LOWER(title) LIKE '%head of%'
    OR LOWER(title) LIKE '%principal%'
    OR LOWER(title) LIKE '% vp%'
    OR LOWER(title) LIKE '%vice president%'
    OR LOWER(title) LIKE '%chief %'
    OR LOWER(title) LIKE '%architect%'
    OR LOWER(title) LIKE '%expert%'
    OR LOWER(title) LIKE '%executive%'
    OR LOWER(title) LIKE '%leitung%'  -- German leadership
  );

-- ============================================================================
-- PART 8: FILTER OUT ROLES REQUIRING SIGNIFICANT EXPERIENCE
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'requires_experience',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND description IS NOT NULL
  AND (
    LOWER(description) LIKE '%3+ year%'
    OR LOWER(description) LIKE '%4+ year%'
    OR LOWER(description) LIKE '%5+ year%'
    OR LOWER(description) LIKE '%7+ year%'
    OR LOWER(description) LIKE '%10+ year%'
    OR LOWER(description) LIKE '%minimum 3 year%'
    OR LOWER(description) LIKE '%at least 3 year%'
    OR LOWER(description) LIKE '%at least 5 year%'
    OR LOWER(description) LIKE '%extensive experience%'
    OR LOWER(description) LIKE '%proven track record%'
    OR LOWER(description) LIKE '%significant experience%'
    OR LOWER(description) LIKE '%substantial experience%'
    OR LOWER(description) LIKE '%several years%experience%'
  );

-- ============================================================================
-- PART 9: FILTER OUT MID-LEVEL ROLES
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'mid_level_role',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- Coordinators/Supervisors
    LOWER(title) LIKE '%coordinator%'
    OR LOWER(title) LIKE '%coordinateur%'
    OR LOWER(title) LIKE '%coordinadora%'
    OR LOWER(title) LIKE '%supervisor%'
    OR LOWER(title) LIKE '%koordinierender%'
    
    -- Partners/Advisers
    OR LOWER(title) LIKE '%partner%'
    OR LOWER(title) LIKE '%adviser%'
    OR LOWER(title) LIKE '%advisor%'
    
    -- Specialists (without graduate marker)
    OR (LOWER(title) LIKE '%specialist%' AND LOWER(title) NOT LIKE '%graduate%')
    
    -- Controllers
    OR LOWER(title) LIKE '%controller%'
    
    -- Trainers/Facilitators
    OR LOWER(title) LIKE '%trainer%'
    OR LOWER(title) LIKE '%facilitator%'
    
    -- French mid-level
    OR LOWER(title) LIKE '%responsable%'
    OR LOWER(title) LIKE '%comptable%'
    OR (LOWER(title) LIKE '%chargé%' AND LOWER(title) NOT LIKE '%alternance%')
    
    -- German mid-level
    OR LOWER(title) LIKE '%personalreferent%'
    OR LOWER(title) LIKE '%projektmitarbeiter%'
    OR LOWER(title) LIKE '%kundenberater%'
    OR LOWER(title) LIKE '%referent%in%'
    OR LOWER(title) LIKE '%sachbearbeit%'
    
    -- Spanish with experience
    OR LOWER(title) LIKE '%con experiencia%'
    
    -- Accountants (mid-level)
    OR LOWER(title) LIKE '%accountant%'
    
    -- HRBP
    OR LOWER(title) LIKE '%hrbp%'
    OR LOWER(title) LIKE '%hr business partner%'
    
    -- PMO
    OR LOWER(title) LIKE '%pmo%'
    
    -- Economists
    OR LOWER(title) LIKE '%economist%'
    
    -- Data Scientists
    OR LOWER(title) LIKE '%data scientist%'
    
    -- Dutch mid-level
    OR LOWER(title) LIKE '%medior%'
  );

-- ============================================================================
-- PART 10: FILTER OUT QUALIFIED PROFESSIONALS & SPECIALIZED ROLES
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'qualified_professional',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- Academic positions
    LOWER(title) LIKE '%faculty%'
    OR LOWER(title) LIKE '%professor%'
    OR LOWER(title) LIKE '%lecturer%'
    
    -- Healthcare professionals
    OR LOWER(title) LIKE '%therapist%'
    OR LOWER(title) LIKE '%therapeut%'
    OR LOWER(title) LIKE '%heilpädagoge%'
    OR LOWER(title) LIKE '%sozialpädagoge%'
    
    -- German master craftsmen
    OR LOWER(title) LIKE '%meister%'
    
    -- Surveyors
    OR LOWER(title) LIKE '%surveyor%'
    
    -- Developers (without graduate marker)
    OR (LOWER(title) LIKE '%entwickler%' AND LOWER(title) NOT LIKE '%graduate%')
    OR (LOWER(title) LIKE '%developer%' AND LOWER(title) NOT LIKE '%graduate%' AND LOWER(title) NOT LIKE '%junior%')
    OR (LOWER(title) LIKE '%engineer%' AND LOWER(title) NOT LIKE '%graduate%' AND LOWER(title) NOT LIKE '%junior%' AND LOWER(title) NOT LIKE '%trainee%')
    
    -- Technicians
    OR LOWER(title) LIKE '%technician%'
    OR LOWER(title) LIKE '%technicien%'
    OR LOWER(title) LIKE '%técnico%'
    OR LOWER(title) LIKE '%techniker%'
    
    -- Sales agents (experienced)
    OR LOWER(title) LIKE '%vertriebsmitarbeiter%'
    OR LOWER(title) LIKE '%agente immobiliare%'
    
    -- Traders
    OR LOWER(title) LIKE '%trader%'
    
    -- Delegates
    OR LOWER(title) LIKE '%delegado%'
    
    -- Opticians (qualified)
    OR LOWER(title) LIKE '%augenoptiker%'
  );

-- ============================================================================
-- STATISTICS & SUMMARY
-- ============================================================================

SELECT 
  '========================================' as divider;

SELECT 
  'JOB CLASSIFICATION COMPLETE' as status;

SELECT 
  COUNT(*) as total_active_jobs,
  COUNT(CASE WHEN is_internship = true THEN 1 END) as internships,
  COUNT(CASE WHEN is_graduate = true AND is_internship = false THEN 1 END) as graduate_roles,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as total_early_career_flagged,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as unflagged_ambiguous,
  ROUND(100.0 * COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) / COUNT(*), 2) || '%' as pct_early_career_coverage
FROM jobs
WHERE is_active = true;

SELECT 
  filtered_reason,
  COUNT(*) as jobs_filtered
FROM jobs
WHERE is_active = false
  AND filtered_reason IS NOT NULL
GROUP BY filtered_reason
ORDER BY COUNT(*) DESC;

COMMIT;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

