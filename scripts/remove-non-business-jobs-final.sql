-- FINAL cleanup: Remove non-business school jobs
-- This script is more intelligent about French/German translations

-- Step 1: Deactivate confirmed non-business jobs
UPDATE jobs
SET 
  status = 'inactive',
  filtered_reason = 'Non-business job type'
WHERE status = 'active'
AND (
  -- Healthcare (but exclude "health" in business context like "Healthcare Consultant")
  (title ~* '\y(nurse|doctor|medical assistant|clinical nurse|hospital worker|paramedic|physiotherapist|dentist|surgeon|radiographer)\y'
   AND title !~* 'consultant|analyst|manager|coordinator|administrator')
  
  -- Education/Teaching (but exclude "education" in business context)
  OR (title ~* '\y(teacher|tutor|lecturer|professor|teaching assistant|education assistant)\y'
      AND title !~* 'consultant|analyst|corporate|business|training manager')
  
  -- Retail Workers (not management)
  OR title ~* '\y(cashier|store worker|shop assistant|shelf stacker|checkout operator|stock assistant)\y'
  
  -- Manual Labor
  OR title ~* '\y(driver|warehouse operative|forklift|loader|packer|cleaner|janitor|maintenance worker|security guard)\y'
  
  -- Kitchen/Hospitality Workers (but ONLY if it's clearly a worker role)
  OR (title ~* '\y(kitchen trainee|kitchen assistant|waiter|waitress|bartender|barista|housekeeper|room attendant)\y'
      AND title !~* 'hospitality manager|hospitality coordinator|hospitality consultant|hospitality engineer|hospitality analyst')
  
  -- Healthcare Workers (specific French/Italian terms)
  OR title ~* '\y(infermiere|infirmier|cadre de santé|agent technique hospitalier)\y'
);

-- Step 2: Special handling for "Chef" - Only remove if it's clearly culinary
-- "Chef" in French means "Manager/Lead", so be very careful!
UPDATE jobs
SET 
  status = 'inactive',
  filtered_reason = 'Culinary role (non-business)'
WHERE status = 'active'
AND (
  -- ONLY remove if explicitly culinary (very narrow criteria)
  title ~* '\y(kitchen trainee|kitchen assistant|commis chef|sous chef|pastry chef|line cook|prep cook)\y'
  OR (title ~* '\y(chef|cook)\y' AND company ~* 'restaurant|catering|hotel.*kitchen')
)
-- ALWAYS keep these (French business titles)
AND title !~* 'chef de projet|chef de produit|chef d''équipe|chef des ventes|responsable';

-- Step 3: Remove "Delivery" ONLY if it's clearly logistics/driver
UPDATE jobs
SET 
  status = 'inactive',
  filtered_reason = 'Logistics worker (non-business)'
WHERE status = 'active'
AND title ~* '\y(delivery driver|delivery operative|courier|van driver|logistics driver)\y'
AND title !~* 'delivery manager|solution delivery|service delivery|project delivery';

-- Step 4: Verify what's left
SELECT 
  'Non-business jobs deactivated' as action,
  COUNT(*) as count
FROM jobs
WHERE status = 'inactive' 
  AND filtered_reason IN ('Non-business job type', 'Culinary role (non-business)', 'Logistics worker (non-business)');

-- Step 5: Check for any remaining problematic jobs
SELECT 
  title,
  company,
  city,
  categories
FROM jobs
WHERE status = 'active'
AND (
  title ~* 'nurse|doctor|teacher|kitchen trainee|warehouse operative'
)
LIMIT 10;

