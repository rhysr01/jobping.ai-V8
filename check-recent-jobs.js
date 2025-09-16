import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentJobs() {
  try {
    console.log('🔍 CHECKING FOR TODAY\'S ULTRA-OPTIMIZED SCRAPER RESULTS');
    console.log('='.repeat(55));
    
    // Check jobs from last 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    
    const { data: recentJobs, error } = await supabase
      .from('jobs')
      .select('id, created_at, source, title, company, location')
      .gte('created_at', fourHoursAgo.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`📊 Jobs Added in Last 4 Hours: ${recentJobs.length}`);
    
    // Break down by source
    const sourceBreakdown = recentJobs.reduce((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 RECENT JOBS BY SOURCE:');
    Object.entries(sourceBreakdown).forEach(([source, count]) => {
      console.log(`  🎯 ${source}: ${count} jobs`);
    });
    
    // Check for our specific scraper signature
    const adzunaRecent = recentJobs.filter(job => job.source === 'adzuna');
    console.log(`\n🏆 Recent Adzuna Jobs: ${adzunaRecent.length}`);
    
    if (adzunaRecent.length > 0) {
      console.log('\n✨ SAMPLE RECENT ADZUNA JOBS:');
      adzunaRecent.slice(0, 5).forEach((job, i) => {
        const timeAgo = Math.round((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60));
        console.log(`  ${i+1}. "${job.title}" at ${job.company}`);
        console.log(`     📍 ${job.location} | ⏰ ${timeAgo} min ago`);
      });
    }
    
    // Check for specific patterns from our scraper
    const businessTermJobs = recentJobs.filter(job => {
      const title = job.title.toLowerCase();
      return title.includes('analyst') || title.includes('intern') || 
             title.includes('graduate') || title.includes('junior') ||
             title.includes('trainee');
    });
    
    console.log(`\n🎓 Business School Relevant (Recent): ${businessTermJobs.length}`);
    
    if (recentJobs.length >= 3000) {
      console.log('\n🎉 SUCCESS! Large batch detected - likely our 3,815 jobs!');
    }
    
  } catch (error) {
    console.error('❌ Recent jobs check failed:', error.message);
  }
}

checkRecentJobs();
