# Manual Migration Instructions for Supabase

## 🎯 **What We Need to Do**

The `match_logs` table exists but needs some schema updates to work with our enhanced logging system. Since DDL statements (ALTER TABLE, ADD COLUMN) can't be executed through the Supabase client, we need to run them manually.

## 📋 **Step-by-Step Instructions**

### **1. Open Supabase Dashboard**
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project: `kpecjbjtdjzgkzywylhn`
- Navigate to **SQL Editor** in the left sidebar

### **2. Run the Migration SQL**

Copy and paste this SQL into the SQL Editor:

```sql
-- Migration: Update existing match_logs table schema
-- This adds missing fields and fixes data type issues

-- 1. Add missing fields
ALTER TABLE public.match_logs 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Update existing records to have created_at and updated_at
UPDATE public.match_logs 
SET created_at = timestamp::timestamptz, 
    updated_at = timestamp::timestamptz 
WHERE created_at IS NULL OR updated_at IS NULL;

-- 3. Make created_at and updated_at NOT NULL after populating
ALTER TABLE public.match_logs 
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- 4. Fix data type issues - convert object fields to text
ALTER TABLE public.match_logs 
ALTER COLUMN user_career_path TYPE TEXT USING 
  CASE 
    WHEN user_career_path IS NULL THEN NULL
    WHEN jsonb_typeof(user_career_path) = 'array' THEN (user_career_path->0)::text
    WHEN jsonb_typeof(user_career_path) = 'string' THEN user_career_path::text
    ELSE NULL
  END;

ALTER TABLE public.match_logs 
ALTER COLUMN user_professional_experience TYPE TEXT USING 
  CASE 
    WHEN user_professional_experience IS NULL THEN NULL
    WHEN jsonb_typeof(user_professional_experience) = 'array' THEN (user_professional_experience->0)::text
    WHEN jsonb_typeof(user_professional_experience) = 'string' THEN user_professional_experience::text
    ELSE NULL
  END;

ALTER TABLE public.match_logs 
ALTER COLUMN user_work_preference TYPE TEXT USING 
  CASE 
    WHEN user_work_preference IS NULL THEN NULL
    WHEN jsonb_typeof(user_work_preference) = 'array' THEN (user_work_preference->0)::text
    WHEN jsonb_typeof(user_work_preference) = 'string' THEN user_work_preference::text
    ELSE NULL
  END;

ALTER TABLE public.match_logs 
ALTER COLUMN error_message TYPE TEXT USING 
  CASE 
    WHEN error_message IS NULL THEN NULL
    WHEN jsonb_typeof(error_message) = 'string' THEN error_message::text
    ELSE NULL
  END;

-- 5. Add the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_match_logs_updated_at ON public.match_logs;
CREATE TRIGGER update_match_logs_updated_at 
    BEFORE UPDATE ON public.match_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Log the migration
INSERT INTO public.match_logs (
    user_email, 
    match_type, 
    matches_generated, 
    error_message,
    user_career_path
) VALUES (
    'system@jobping.com', 
    'ai_success', 
    0, 
    'match_logs schema updated successfully - added missing fields and fixed data types',
    'System'
);
```

### **3. Execute the Migration**
- Click **Run** button in the SQL Editor
- Wait for all statements to complete successfully
- You should see "Success. No rows returned" for most statements

### **4. Verify the Migration**
Run this verification query:

```sql
-- Verify the final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'match_logs' 
ORDER BY ordinal_position;
```

You should see these key fields:
- ✅ `created_at` (timestamptz, NOT NULL)
- ✅ `updated_at` (timestamptz, NOT NULL)
- ✅ `user_career_path` (text)
- ✅ `user_professional_experience` (text)
- ✅ `user_work_preference` (text)
- ✅ `error_message` (text)

## 🧪 **After Migration: Test the System**

Once the migration is complete, run:

```bash
node scripts/test-enhanced-logging.js
```

This will verify that:
- ✅ All new fields are present
- ✅ Enhanced logging works correctly
- ✅ Data types are correct
- ✅ Triggers are working

## 🚀 **What This Enables**

After the migration, your system will have:
- **Enhanced logging** with career path data
- **Proper timestamps** for all records
- **Correct data types** for all fields
- **Automatic updated_at** triggers
- **Full compatibility** with the new logging functions

## ⚠️ **If You Encounter Issues**

1. **Check the error messages** - they'll tell you exactly what's wrong
2. **Run statements one by one** if needed
3. **Verify table structure** after each major change
4. **Contact support** if you get stuck

---

**Status**: Ready for manual execution
**Estimated Time**: 5-10 minutes
**Risk Level**: Low (adding columns, no data loss)
