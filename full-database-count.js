import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getFullDatabaseCount() {
  try {
    console.log('🔍 FULL DATABASE COUNT ANALYSIS');
    console.log('='.repeat(35));
    
    // Get total count using count query (more efficient)
    const { count: totalCount, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    console.log(`📊 TOTAL JOBS IN DATABASE: ${totalCount}`);
    
    // Get count by source
    const { data: sourceData, error: sourceError } = await supabase
      .from('jobs')
      .select('source')
      .order('created_at', { ascending: false });
    
    if (sourceError) throw sourceError;
    
    const sourceBreakdown = sourceData.reduce((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n🔄 COMPLETE SOURCE BREAKDOWN:');
    Object.entries(sourceBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        const percentage = ((count / totalCount) * 100).toFixed(1);
        console.log(`  🎯 ${source}: ${count} jobs (${percentage}%)`);
      });
    
    // Check for Adzuna specifically 
    const adzunaCount = sourceBreakdown.adzuna || 0;
    console.log(`\n🏆 ADZUNA PERFORMANCE:`);
    console.log(`  📈 Total Adzuna Jobs: ${adzunaCount}`);
    
    if (adzunaCount >= 3815) {
      console.log(`  🎉 SUCCESS! We have ${adzunaCount} Adzuna jobs (≥3,815 target!)`);
    } else if (adzunaCount >= 1000) {
      console.log(`  ✅ Good progress: ${adzunaCount} Adzuna jobs saved`);
    }
    
    // Check today's additions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount, error: todayError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    
    if (!todayError) {
      console.log(`\n📅 Jobs Added Today: ${todayCount}`);
    }
    
  } catch (error) {
    console.error('❌ Database count failed:', error.message);
  }
}

getFullDatabaseCount();
