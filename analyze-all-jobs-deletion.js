import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeAllJobsForDeletion() {
  try {
    console.log('🔍 ANALYZING ALL 10,000+ JOBS FOR DELETION');
    console.log('='.repeat(45));
    console.log('⚠️  CONSERVATIVE: Only removing CLEARLY unsuitable jobs');
    console.log('✅ When in doubt → KEEP the job');
    console.log('');
    
    // Get total count first
    const { count: totalCount, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log(`📊 Total jobs in database: ${totalCount}`);
    
    // Get ALL jobs in batches (Supabase has query limits)
    let allJobs = [];
    const batchSize = 1000;
    let offset = 0;
    
    console.log(`📥 Fetching all jobs in batches of ${batchSize}...`);
    
    while (true) {
      const { data: batch, error } = await supabase
        .from('jobs')
        .select('id, title, company, location, description, experience_required, source')
        .range(offset, offset + batchSize - 1)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (batch.length === 0) break;
      
      allJobs = allJobs.concat(batch);
      offset += batchSize;
      
      console.log(`   📥 Fetched ${allJobs.length}/${totalCount} jobs...`);
      
      if (batch.length < batchSize) break; // Last batch
    }
    
    console.log(`✅ Loaded ${allJobs.length} jobs for analysis`);
    
    // ULTRA CONSERVATIVE deletion criteria
    const CLEARLY_SENIOR_TITLES = [
      // C-Suite & Executive
      'chief executive', 'chief operating', 'chief financial', 'chief technology', 'chief marketing',
      'ceo', 'coo', 'cfo', 'cto', 'cmo', 'chief ',
      'president', 'vice president', 'vp ', 'executive vice president', 'evp',
      'managing director', 'executive director', 'senior director',
      'head of department', 'head of division', 'department head', 'head of ',
      
      // Very senior management 
      'senior partner', 'managing partner', 'principal partner',
      'senior principal', 'principal consultant', 'principal manager',
      'senior manager', 'senior team leader', 'senior supervisor',
      'director of', 'regional director', 'country manager',
      
      // Board level
      'board member', 'board director', 'chairman', 'chairwoman'
    ];
    
    const CLEARLY_NOT_BUSINESS_SCHOOL = [
      // Healthcare/Medical 
      'nurse', 'nursing', 'doctor', 'physician', 'surgeon', 'medical doctor',
      'pharmacist', 'dentist', 'veterinarian', 'radiologist', 'therapist',
      'paramedic', 'medical assistant', 'healthcare worker',
      
      // Manual labor/trades
      'truck driver', 'delivery driver', 'driver', 'taxi driver',
      'warehouse worker', 'factory worker', 'production worker',
      'construction worker', 'electrician', 'plumber', 'carpenter',
      'mechanic', 'technician', 'maintenance worker', 'janitor',
      'cleaner', 'security guard', 'groundskeeper',
      
      // Food service & hospitality
      'chef', 'cook', 'kitchen', 'waiter', 'waitress', 'bartender', 'server',
      'dishwasher', 'food service', 'restaurant server', 'sous chef',
      'chef de rang', 'chef de partie',
      
      // Basic retail/service
      'cashier', 'store clerk', 'sales associate', 'shop assistant',
      'customer service representative', 'call center agent',
      
      // Education requiring teaching credentials
      'teacher', 'professor', 'lecturer', 'instructor', 'tutor',
      'school administrator', 'academic coordinator', 'professorship'
    ];
    
    // Analyze each job
    console.log(`\n🔍 Analyzing ${allJobs.length} jobs with ultra-conservative criteria...`);
    
    const jobsToDelete = allJobs.filter(job => {
      const title = job.title.toLowerCase();
      const description = (job.description || '').toLowerCase();
      
      // Check for clearly senior titles
      const hasClearlySeniorTitle = CLEARLY_SENIOR_TITLES.some(term => {
        const termLower = term.toLowerCase().trim();
        return title.includes(termLower) && (
          title.startsWith(termLower) || 
          title.includes(` ${termLower}`) || 
          title.includes(`-${termLower}`) ||
          title.endsWith(termLower)
        );
      });
      
      // Check for clearly non-business school roles
      const isClearlyNotBusinessSchool = CLEARLY_NOT_BUSINESS_SCHOOL.some(term => {
        const termLower = term.toLowerCase().trim();
        return title.includes(termLower);
      });
      
      return hasClearlySeniorTitle || isClearlyNotBusinessSchool;
    });
    
    // Categorize deletions
    const seniorRoles = jobsToDelete.filter(job => {
      const title = job.title.toLowerCase();
      return CLEARLY_SENIOR_TITLES.some(term => title.includes(term.toLowerCase()));
    });
    
    const irrelevantRoles = jobsToDelete.filter(job => {
      const title = job.title.toLowerCase();
      return CLEARLY_NOT_BUSINESS_SCHOOL.some(term => title.includes(term.toLowerCase()));
    });
    
    const deletionPercentage = (jobsToDelete.length / allJobs.length) * 100;
    
    console.log(`\n📊 DELETION ANALYSIS RESULTS:`);
    console.log(`   🎯 Total jobs analyzed: ${allJobs.length.toLocaleString()}`);
    console.log(`   🗑️  Jobs to delete: ${jobsToDelete.length.toLocaleString()} (${deletionPercentage.toFixed(1)}%)`);
    console.log(`   📊 Jobs to keep: ${(allJobs.length - jobsToDelete.length).toLocaleString()} (${(100 - deletionPercentage).toFixed(1)}%)`);
    
    console.log(`\n📋 DELETION BREAKDOWN:`);
    console.log(`   🎖️  Senior/Executive roles: ${seniorRoles.length.toLocaleString()}`);
    console.log(`   🚫 Non-business school roles: ${irrelevantRoles.length.toLocaleString()}`);
    
    // Show source breakdown of deletions
    const deletionsBySource = jobsToDelete.reduce((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n🔄 DELETIONS BY SOURCE:`);
    Object.entries(deletionsBySource)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        console.log(`   📍 ${source}: ${count.toLocaleString()} deletions`);
      });
    
    // Sample deletions for review
    console.log(`\n🔍 SAMPLE SENIOR ROLES TO DELETE (first 15):`);
    seniorRoles.slice(0, 15).forEach((job, i) => {
      console.log(`   ${i+1}. "${job.title}" at ${job.company} (${job.source})`);
    });
    
    console.log(`\n🔍 SAMPLE IRRELEVANT ROLES TO DELETE (first 15):`);
    irrelevantRoles.slice(0, 15).forEach((job, i) => {
      console.log(`   ${i+1}. "${job.title}" at ${job.company} (${job.source})`);
    });
    
    // Safety check
    if (deletionPercentage > 25) {
      console.log(`\n⚠️  WARNING: Planning to delete ${deletionPercentage.toFixed(1)}% of all jobs`);
      console.log(`   This seems aggressive - please review criteria carefully!`);
    } else {
      console.log(`\n✅ CONSERVATIVE APPROACH CONFIRMED:`);
      console.log(`   Only ${deletionPercentage.toFixed(1)}% of jobs marked for deletion`);
      console.log(`   This ensures we keep all potentially relevant business school jobs`);
    }
    
    return jobsToDelete.map(job => job.id);
    
  } catch (error) {
    console.error('❌ Full analysis failed:', error.message);
    return [];
  }
}

// Export for deletion script
export { analyzeAllJobsForDeletion };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const idsToDelete = await analyzeAllJobsForDeletion();
  console.log(`\n🎯 READY FOR DELETION: ${idsToDelete.length.toLocaleString()} job IDs identified`);
  console.log(`\n❓ Proceed with deletion of ALL clearly unsuitable jobs?`);
}
