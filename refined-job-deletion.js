import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refinedJobDeletion() {
  try {
    console.log('🎯 REFINED JOB DELETION - ULTRA CONSERVATIVE');
    console.log('='.repeat(45));
    console.log('✅ ONLY deleting OBVIOUSLY unsuitable jobs');
    console.log('⚠️  When in doubt → KEEP the job');
    console.log('');
    
    // Get all jobs
    const { data: allJobs, error } = await supabase
      .from('jobs')
      .select('id, title, company, location, description, experience_required')
      .order('created_at', { ascending: false })
      .limit(15000);
    
    if (error) throw error;
    
    console.log(`📊 Analyzing ${allJobs.length} jobs with refined criteria...`);
    
    // ULTRA CONSERVATIVE - Only the most obvious deletions
    const CLEARLY_SENIOR_TITLES = [
      // Executive roles (100% senior)
      'chief executive', 'chief operating', 'chief financial', 'chief technology', 'chief marketing',
      'ceo', 'coo', 'cfo', 'cto', 'cmo', 'chief ',
      'president', 'vice president', 'vp ', 'executive vice president',
      'managing director', 'executive director', 'senior director',
      'head of department', 'head of division', 'department head',
      
      // Very senior management (10+ years experience implied)
      'senior partner', 'managing partner', 'principal partner',
      'senior principal', 'principal consultant', 'principal manager',
      'senior manager', 'senior team leader', 'senior supervisor'
    ];
    
    const CLEARLY_NOT_BUSINESS_SCHOOL = [
      // Healthcare/Medical (requiring specialized degrees)
      'nurse', 'nursing', 'doctor', 'physician', 'surgeon', 'medical doctor',
      'pharmacist', 'dentist', 'veterinarian', 'radiologist',
      'physical therapist', 'occupational therapist',
      
      // Manual labor/trades
      'truck driver', 'delivery driver', 'uber driver', 'taxi driver',
      'warehouse worker', 'factory worker', 'production worker',
      'construction worker', 'electrician', 'plumber', 'carpenter',
      'mechanic', 'technician', 'maintenance worker',
      'cleaner', 'janitor', 'security guard', 'groundskeeper',
      
      // Food service
      'chef', 'cook', 'kitchen', 'waiter', 'waitress', 'bartender', 'server',
      'dishwasher', 'food service', 'restaurant server',
      
      // Retail/Service (not analyst level)
      'cashier', 'store clerk', 'sales associate', 'shop assistant',
      'customer service representative', 'call center agent',
      
      // Education (requiring teaching credentials)
      'teacher', 'professor', 'lecturer', 'instructor', 'tutor',
      'school administrator', 'academic coordinator'
    ];
    
    // Identify jobs for deletion - VERY conservative
    const jobsToDelete = allJobs.filter(job => {
      const title = job.title.toLowerCase();
      const description = (job.description || '').toLowerCase();
      
      // Only delete if title CLEARLY contains senior terms
      const hasClearlySeniorTitle = CLEARLY_SENIOR_TITLES.some(term => {
        const termLower = term.toLowerCase().trim();
        // Must be exact match or at word boundaries
        return title.includes(termLower) && (
          title.startsWith(termLower) || 
          title.includes(` ${termLower}`) || 
          title.includes(`-${termLower}`) ||
          title.endsWith(termLower)
        );
      });
      
      // Only delete if title CLEARLY not business school relevant
      const isClearlyNotBusinessSchool = CLEARLY_NOT_BUSINESS_SCHOOL.some(term => {
        const termLower = term.toLowerCase().trim();
        return title.includes(termLower);
      });
      
      return hasClearlySeniorTitle || isClearlyNotBusinessSchool;
    });
    
    console.log(`🎯 Found ${jobsToDelete.length} jobs to delete (${((jobsToDelete.length/allJobs.length)*100).toFixed(1)}%)`);
    
    // Separate categories
    const seniorRoles = jobsToDelete.filter(job => {
      const title = job.title.toLowerCase();
      return CLEARLY_SENIOR_TITLES.some(term => title.includes(term.toLowerCase()));
    });
    
    const irrelevantRoles = jobsToDelete.filter(job => {
      const title = job.title.toLowerCase();
      return CLEARLY_NOT_BUSINESS_SCHOOL.some(term => title.includes(term.toLowerCase()));
    });
    
    console.log(`\n📋 REFINED DELETION BREAKDOWN:`);
    console.log(`  🎖️  Clearly Senior roles: ${seniorRoles.length}`);
    console.log(`  🚫 Clearly Irrelevant: ${irrelevantRoles.length}`);
    
    // Show ALL jobs we plan to delete for final review
    console.log(`\n🔍 ALL SENIOR ROLES TO DELETE (${seniorRoles.length}):`);
    seniorRoles.forEach((job, i) => {
      console.log(`  ${i+1}. "${job.title}" at ${job.company}`);
    });
    
    console.log(`\n🔍 ALL IRRELEVANT ROLES TO DELETE (${irrelevantRoles.length}):`);
    irrelevantRoles.forEach((job, i) => {
      console.log(`  ${i+1}. "${job.title}" at ${job.company}`);
    });
    
    // Final safety check
    const deletionPercentage = (jobsToDelete.length / allJobs.length) * 100;
    if (deletionPercentage > 15) {
      console.log(`\n⚠️  WARNING: Planning to delete ${deletionPercentage.toFixed(1)}% of jobs`);
      console.log(`   This might be too aggressive - please review carefully!`);
    }
    
    console.log(`\n✅ ULTRA CONSERVATIVE DELETION PLAN:`);
    console.log(`   📊 Keep: ${allJobs.length - jobsToDelete.length} jobs (${(((allJobs.length - jobsToDelete.length)/allJobs.length)*100).toFixed(1)}%)`);
    console.log(`   🗑️  Delete: ${jobsToDelete.length} jobs (${deletionPercentage.toFixed(1)}%)`);
    console.log(`   🎯 Perfect for: Business school students & graduates`);
    
    return jobsToDelete.map(job => job.id);
    
  } catch (error) {
    console.error('❌ Refined analysis failed:', error.message);
    return [];
  }
}

// Export for deletion script
export { refinedJobDeletion };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const idsToDelete = await refinedJobDeletion();
  console.log(`\n🎯 FINAL COUNT: ${idsToDelete.length} jobs identified for deletion`);
  console.log(`\n❓ Proceed with deletion? This will permanently remove these jobs.`);
}
