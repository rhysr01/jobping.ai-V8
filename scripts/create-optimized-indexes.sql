-- Create Optimized Indexes for Category-Based Matching
-- Run this separately after the main optimization script

-- Main index for work type category filtering
CREATE INDEX IF NOT EXISTS idx_jobs_work_type_categories
ON jobs USING gin (categories)
WHERE is_active = true
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth',
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];

-- Composite index for category + location matching
CREATE INDEX IF NOT EXISTS idx_jobs_category_location
ON jobs USING btree (city, country)
WHERE is_active = true
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth',
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];

-- Index for early career + work type combinations
CREATE INDEX IF NOT EXISTS idx_jobs_early_career_work_type
ON jobs USING gin (categories)
WHERE is_active = true
  AND 'early-career' = ANY(categories)
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth',
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_jobs_strategy_business_design
ON jobs USING btree (id)
WHERE is_active = true
  AND 'strategy-business-design' = ANY(categories);

CREATE INDEX IF NOT EXISTS idx_jobs_data_analytics
ON jobs USING btree (id)
WHERE is_active = true
  AND 'data-analytics' = ANY(categories);

CREATE INDEX IF NOT EXISTS idx_jobs_marketing_growth
ON jobs USING btree (id)
WHERE is_active = true
  AND 'marketing-growth' = ANY(categories);

-- Update statistics for better query planning
ANALYZE jobs;

-- Final validation
SELECT 'INDEXES CREATED SUCCESSFULLY' as status;

SELECT
  'Index Performance Test' as test,
  COUNT(*) as total_indexed_jobs
FROM jobs
WHERE is_active = true
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth',
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];
