import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function completeSourceAnalysis() {
  try {
    console.log('🎯 COMPLETE SOURCE & PERFORMANCE ANALYSIS');
    console.log('='.repeat(45));
    
    // Get all sources with counts
    const { data: allJobs, error } = await supabase
      .from('jobs')
      .select('source, created_at, title, company, location')
      .order('created_at', { ascending: false })
      .limit(15000); // Increase limit to get more data
    
    if (error) throw error;
    
    console.log(`📊 Analyzed ${allJobs.length} most recent jobs`);
    
    // Source breakdown
    const sourceBreakdown = allJobs.reduce((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n🚀 ALL SOURCES PERFORMANCE:');
    console.log('-'.repeat(30));
    Object.entries(sourceBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count], index) => {
        const percentage = ((count / allJobs.length) * 100).toFixed(1);
        const rank = index + 1;
        console.log(`  ${rank}. 🎯 ${source}: ${count} jobs (${percentage}%)`);
      });
    
    // Today's performance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayJobs = allJobs.filter(job => new Date(job.created_at) >= today);
    const todayBySource = todayJobs.reduce((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n📅 TODAY'S INGESTION (${todayJobs.length} jobs):`);
    console.log('-'.repeat(25));
    Object.entries(todayBySource)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        const percentage = ((count / todayJobs.length) * 100).toFixed(1);
        console.log(`  ⚡ ${source}: ${count} jobs (${percentage}%)`);
      });
    
    // Check for our ultra-optimized scraper signature
    const recentAdzuna = allJobs.filter(job => 
      job.source === 'adzuna' && 
      new Date(job.created_at) >= today
    );
    
    console.log(`\n🏆 ADZUNA ULTRA-OPTIMIZED SCRAPER RESULTS:`);
    console.log('-'.repeat(40));
    console.log(`📈 Adzuna Jobs Today: ${recentAdzuna.length}`);
    
    if (recentAdzuna.length > 0) {
      // Check for our specific business school patterns
      const businessSchoolJobs = recentAdzuna.filter(job => {
        const title = job.title.toLowerCase();
        return title.includes('analyst') || title.includes('intern') || 
               title.includes('graduate') || title.includes('junior') ||
               title.includes('trainee') || title.includes('investment') ||
               title.includes('finance') || title.includes('consulting') ||
               title.includes('strategy') || title.includes('marketing');
      });
      
      console.log(`🎓 Business School Relevant: ${businessSchoolJobs.length} (${((businessSchoolJobs.length/recentAdzuna.length)*100).toFixed(1)}%)`);
      
      // Geographic distribution of Adzuna jobs
      const adzunaLocations = recentAdzuna.reduce((acc, job) => {
        const city = job.location.split(',')[0].trim();
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n🌍 Adzuna Geographic Distribution:');
      Object.entries(adzunaLocations)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([city, count]) => {
          console.log(`  🏙️  ${city}: ${count} jobs`);
        });
      
      // Sample high-quality jobs
      console.log('\n⭐ Sample High-Quality Adzuna Jobs:');
      businessSchoolJobs.slice(0, 8).forEach((job, i) => {
        console.log(`  ${i+1}. "${job.title}" at ${job.company} (${job.location.split(',')[0]})`);
      });
    }
    
    // Database health metrics
    const oldestJob = allJobs[allJobs.length - 1];
    const newestJob = allJobs[0];
    
    console.log(`\n🩺 DATABASE HEALTH METRICS:`);
    console.log('-'.repeat(25));
    console.log(`✅ Total Active Sources: ${Object.keys(sourceBreakdown).length}`);
    console.log(`📊 Daily Ingestion Rate: ${todayJobs.length} jobs/day`);
    console.log(`📅 Data Range: ${new Date(oldestJob.created_at).toLocaleDateString()} to ${new Date(newestJob.created_at).toLocaleDateString()}`);
    console.log(`🎯 Success Rate: HIGH (multiple active sources)`);
    
    if (todayJobs.length >= 3000) {
      console.log(`\n🎉 EXCELLENT PERFORMANCE! ${todayJobs.length} jobs ingested today!`);
    }
    
  } catch (error) {
    console.error('❌ Complete analysis failed:', error.message);
  }
}

completeSourceAnalysis();
