-- ============================================================================
-- FINAL COMPREHENSIVE BUSINESS SCHOOL FILTER
-- Removes 129 non-business jobs with multilingual pattern matching
-- VERY CAREFUL to avoid false positives
-- ============================================================================

BEGIN;

-- 1. HEALTHCARE: Doctors & Dentists (26 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Healthcare: Doctor/Dentist'
WHERE status = 'active'
AND (
  -- French dentists
  title ~* '\y(chirurgien-dentiste|dentiste)\y'
  -- Doctors/Physicians
  OR title ~* '\y(médecin|chirurgien plastique|dermatologue)\y'
  OR title ~* '\y(doctor|physician|surgeon|arzt|dottore)\y'
  -- Medical trainees (non-business)
  OR title ~* '\y(clinical fellow|junior physician|assistant physician|junior clinical fellow)\y'
)
-- KEEP business healthcare roles
AND title !~* 'healthcare consultant|medical sales|health economist|healthcare operations|clinical research coordinator|clinical trial manager';

-- 2. HEALTHCARE: Nurses (6 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Healthcare: Nurse'
WHERE status = 'active'
AND title ~* '\y(nurse|infirmier|infermiere|krankenschwester|verpleegkundige)\y'
AND title !~* 'consultant|manager|coordinator';

-- 3. HEALTHCARE: Pharmacists - "Farmacista" in Italian (3 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Healthcare: Pharmacist'
WHERE status = 'active'
AND title ~* '\y(pharmacist|farmacista|apotheker)\y'
AND title !~* 'sales|marketing|consultant|informatore scientifico';

-- 4. HEALTHCARE: Medical Specialists - French (14 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Healthcare: Medical Specialist'
WHERE status = 'active'
AND title ~* '\y(sage-femme|kinésithérapeute|masseur-kinésithérapeute|pédiatre|cadre masseur)\y';

-- 5. HEALTHCARE: Therapists (2 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Healthcare: Therapist'
WHERE status = 'active'
AND title ~* '\y(massage therapist|physiotherapist|psychologist|counsellor|thérapeute)\y'
AND title !~* 'investment counsellor'; -- Keep "Investment Counsellor"!

-- 6. HEALTHCARE: Medical Support (4 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Healthcare: Medical Support'
WHERE status = 'active'
AND title ~* '\y(aide médico-psychologique|assistant secteur médico-social)\y';

-- 7. RETAIL: Sales Assistants (37 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Retail: Sales Assistant'
WHERE status = 'active'
AND (
  title ~* '\y(sales assistant|shop assistant|store assistant|vendeur(?! conseil)|vendeuse|commesso/commessa)\y'
  OR title ~* 'stage sales assistant' -- Italian internships as retail workers
  OR title ~* 'tirocinio.*commesso' -- Italian retail trainee
)
-- KEEP business sales roles
AND title !~* 'sales (development|operations|analyst|coordinator|manager)|visual merchandiser|inside sales';

-- 8. RETAIL: Stock/Warehouse Workers (4 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Retail: Stock/Warehouse'
WHERE status = 'active'
AND title ~* '\y(magazziniere|shelf stacker|stock assistant|stock replenisher)\y'
AND title !~* 'warehouse manager|logistics analyst';

-- 9. HOSPITALITY: Kitchen/Culinary Workers (13 jobs)
-- VERY CAREFUL: "Commis" can mean waiter OR commissioning engineer!
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Hospitality: Kitchen Staff'
WHERE status = 'active'
AND (
  -- French kitchen staff
  title ~* '\y(commis de cuisine|commis de salle|commis de bar|chef de rang)\y'
  -- Italian kitchen staff
  OR title ~* '\y(commis di cucina|aiuto cuoco|stagista aiuto cuoco)\y'
  -- English/German kitchen staff
  OR title ~* '\y(kitchen trainee|kitchen assistant|kitchen porter|dishwasher|prep cook|line cook)\y'
  -- Cooks (but NOT "Chef de Projet" = Project Manager)
  OR (title ~* '\y(cook|cuoco|koch|köchin)\y' AND title !~* 'chef de projet')
  -- Culinary professionals
  OR title ~* '\y(pastry chef|sous chef|commis chef)\y'
)
-- ALWAYS KEEP commissioning engineers!
AND title !~* 'commissioning (engineer|technician|manager)';

-- 10. HOSPITALITY: Service Staff (2 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Hospitality: Service Staff'
WHERE status = 'active'
AND title ~* '\y(waiter|waitress|bartender|barman|barista|serveur|cameriere|kellner|officier barman)\y';

-- 11. HOSPITALITY: Housekeeping (6 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Hospitality: Housekeeping'
WHERE status = 'active'
AND title ~* '\y(housekeeper|housekeeping|room attendant|femme de chambre|governante)\y'
AND title !~* 'housekeeping manager|housekeeping operations';

-- 12. HOSPITALITY: Hotel Reception (1 job)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Hospitality: Front Desk'
WHERE status = 'active'
AND title ~* '\y(front desk agent|front desk trainee)\y'
AND company ~* 'hotel';

-- 13. MANUAL LABOR: Drivers/Delivery (3 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Manual Labor: Driver'
WHERE status = 'active'
AND title ~* '\y(chauffeur|autista|fahrer|lkw fahrer|c-chauffeur)\y'
AND title !~* 'delivery manager|solution delivery|service delivery';

-- 14. MANUAL LABOR: Production Workers (4 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Manual Labor: Production'
WHERE status = 'active'
AND title ~* '\y(produktionshelfer|produktionsmitarbeiter|production operative|assembly line|helfer)\y'
AND title !~* 'production manager|production analyst';

-- 15. MANUAL LABOR: Cleaning (1 job)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Manual Labor: Cleaning'
WHERE status = 'active'
AND title ~* '\y(addetto pulizie|cleaner|nettoyeur|cleaning)\y';

-- 16. LEGAL SUPPORT: Paralegals (3 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Legal: Paralegal/Secretary'
WHERE status = 'active'
AND title ~* '\y(paralegal|legal secretary)\y'
AND title !~* 'legal analyst|compliance|legal operations';

-- 17. SOCIAL WORK: Care Workers (8 jobs)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Social Work: Care/Education'
WHERE status = 'active'
AND title ~* '\y(éducateur|moniteur éducateur)\y';

-- 18. EDUCATION: Teachers (counted under emergency services by mistake)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Education: Teaching'
WHERE status = 'active'
AND title ~* '\y(teacher|professor|lecturer|enseignant|professeur|lehrer)\y'
AND title !~* 'education tech|corporate trainer|training consultant';

-- 19. CREATIVE ARTS (1 job)
UPDATE jobs
SET status = 'inactive', filtered_reason = 'Creative Arts'
WHERE status = 'active'
AND title ~* '\y(technical artist cfx)\y'
AND title !~* 'graphic|ux|product designer';

COMMIT;

-- ============================================================================
-- RESULTS & VERIFICATION
-- ============================================================================

-- Summary by category
SELECT 
  filtered_reason,
  COUNT(*) as jobs_removed
FROM jobs
WHERE status = 'inactive'
AND filtered_reason LIKE 'Healthcare:%' 
   OR filtered_reason LIKE 'Retail:%'
   OR filtered_reason LIKE 'Hospitality:%'
   OR filtered_reason LIKE 'Manual Labor:%'
   OR filtered_reason LIKE 'Legal:%'
   OR filtered_reason LIKE 'Social Work:%'
   OR filtered_reason LIKE 'Education:%'
   OR filtered_reason LIKE 'Creative Arts'
GROUP BY filtered_reason
ORDER BY jobs_removed DESC;

-- Total summary
SELECT 
  'TOTAL NON-BUSINESS JOBS REMOVED' as summary,
  COUNT(*) as total_removed
FROM jobs
WHERE status = 'inactive'
AND (
  filtered_reason LIKE 'Healthcare:%' 
  OR filtered_reason LIKE 'Retail:%'
  OR filtered_reason LIKE 'Hospitality:%'
  OR filtered_reason LIKE 'Manual Labor:%'
  OR filtered_reason LIKE 'Legal:%'
  OR filtered_reason LIKE 'Social Work:%'
  OR filtered_reason LIKE 'Education:%'
  OR filtered_reason = 'Creative Arts'
);

-- Active business jobs remaining
SELECT 
  'BUSINESS-APPROPRIATE JOBS REMAINING' as summary,
  COUNT(*) as total_active
FROM jobs
WHERE status = 'active';

-- Sample check: Verify we kept good jobs
SELECT 
  'Sample of KEPT jobs (should all be business roles)' as check_type,
  title,
  company,
  categories
FROM jobs
WHERE status = 'active'
AND (
  title ~* 'analyst|consultant|engineer|coordinator|manager|specialist|associate'
  OR categories && ARRAY['strategy-business-design', 'finance-investment', 'tech-transformation']
)
LIMIT 20;

