// Career Path Backfill Utility
// For existing jobs lacking career: tags, run a background pass using mapping rules

import { createClient } from '@supabase/supabase-js';
import { createJobCategories, extractCareerPathFromCategories } from '../scrapers/types';
import { extractCareerPath } from './jobMatching';

// Initialize Supabase client
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase client should only be used server-side');
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export interface BackfillResult {
  totalJobs: number;
  updatedJobs: number;
  skippedJobs: number;
  errors: string[];
  careerPathDistribution: Record<string, number>;
}

export async function backfillCareerPaths(batchSize: number = 100): Promise<BackfillResult> {
  const supabase = getSupabaseClient();
  const result: BackfillResult = {
    totalJobs: 0,
    updatedJobs: 0,
    skippedJobs: 0,
    errors: [],
    careerPathDistribution: {}
  };

  try {
    console.log('🔄 Starting career path backfill...');
    
    // Get jobs that don't have career: tags
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title, description, categories')
      .or('categories.is.null,categories.not.like.*career:*')
      .limit(batchSize);

    if (fetchError) {
      throw fetchError;
    }

    if (!jobs || jobs.length === 0) {
      console.log('✅ No jobs need career path backfill');
      return result;
    }

    result.totalJobs = jobs.length;
    console.log(`📊 Processing ${jobs.length} jobs for career path backfill`);

    // Process jobs in batches
    for (const job of jobs) {
      try {
        // Check if job already has a career path
        const existingCareerPath = extractCareerPathFromCategories(job.categories);
        if (existingCareerPath !== 'unknown') {
          result.skippedJobs++;
          continue;
        }

        // Extract career path from title and description
        const careerPath = extractCareerPath(job.title, job.description);
        
        // Create new categories with career path
        const newCategories = createJobCategories(careerPath, 
          job.categories ? job.categories.split('|').filter((tag: string) => !tag.startsWith('career:')) : []
        );

        // Update the job
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ 
            categories: newCategories,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (updateError) {
          result.errors.push(`Job ${job.id}: ${updateError.message}`);
        } else {
          result.updatedJobs++;
          result.careerPathDistribution[careerPath] = (result.careerPathDistribution[careerPath] || 0) + 1;
        }

      } catch (jobError: any) {
        result.errors.push(`Job ${job.id}: ${jobError.message}`);
      }
    }

    // Log results
    console.log(`✅ Backfill completed:`);
    console.log(`   - Total jobs processed: ${result.totalJobs}`);
    console.log(`   - Jobs updated: ${result.updatedJobs}`);
    console.log(`   - Jobs skipped: ${result.skippedJobs}`);
    console.log(`   - Errors: ${result.errors.length}`);
    
    if (Object.keys(result.careerPathDistribution).length > 0) {
      console.log(`   - Career path distribution:`);
      Object.entries(result.careerPathDistribution)
        .sort(([,a], [,b]) => b - a)
        .forEach(([path, count]) => {
          console.log(`     ${path}: ${count}`);
        });
    }

    return result;

  } catch (error: any) {
    console.error('❌ Career path backfill failed:', error);
    result.errors.push(error.message);
    return result;
  }
}

// CLI function for running backfill
export async function runCareerPathBackfill() {
  console.log('🚀 Starting career path backfill process...');
  
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  while (true) {
    const result = await backfillCareerPaths(100);
    
    totalProcessed += result.totalJobs;
    totalUpdated += result.updatedJobs;
    totalErrors += result.errors.length;
    
    console.log(`📊 Batch complete: ${result.updatedJobs}/${result.totalJobs} updated`);
    
    // Stop if no more jobs to process
    if (result.totalJobs === 0 || result.updatedJobs === 0) {
      break;
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`🎉 Backfill process completed:`);
  console.log(`   - Total jobs processed: ${totalProcessed}`);
  console.log(`   - Total jobs updated: ${totalUpdated}`);
  console.log(`   - Total errors: ${totalErrors}`);
}

// Export for use in scripts
if (require.main === module) {
  runCareerPathBackfill().catch(console.error);
}
