#!/usr/bin/env node

/**
 * COMPREHENSIVE JOB ANALYSIS FOR TARGET AUDIENCE OPTIMIZATION
 * 
 * This script analyzes your current 3,156 jobs to understand:
 * - Why early-career relevance is only 40.9%
 * - Which sources are bringing in senior-level jobs
 * - Geographic distribution quality
 * - Company quality assessment
 * - Specific filtering improvements needed
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeCurrentJobs() {
  try {
    console.log('🎯 COMPREHENSIVE JOB ANALYSIS FOR TARGET AUDIENCE OPTIMIZATION\n');
    console.log('='.repeat(80));
    
    // Get all jobs
    const { data: allJobs, error } = await supabase
      .from('jobs')
      .select('title, company, location, description, source, categories, experience_required, is_graduate, is_internship, created_at, posted_at')
      .limit(5000);
    
    if (error) throw error;
    
    const totalJobs = allJobs.length;
    console.log(`📊 TOTAL JOBS ANALYZED: ${totalJobs}\n`);
    
    // 1. SOURCE BREAKDOWN WITH QUALITY ASSESSMENT
    console.log('📊 SOURCE BREAKDOWN WITH QUALITY ASSESSMENT:');
    console.log('-'.repeat(50));
    
    const sourceCounts = {};
    const sourceQuality = {
      'adzuna': { quality: 'Medium', reason: 'Job board aggregator, mixed quality, high volume' },
      'reed': { quality: 'Good', reason: 'UK-focused, decent quality' },
      'lever': { quality: 'High', reason: 'Direct company postings, VC-backed startups' },
      'muse': { quality: 'High', reason: 'Curated tech jobs, good early-career focus' },
      'greenhouse': { quality: 'High', reason: 'Direct company postings, graduate programs' },
      'jsearch': { quality: 'Medium', reason: 'API aggregator, mixed quality' }
    };
    
    allJobs.forEach(job => {
      sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1;
    });
    
    Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        const percentage = ((count / totalJobs) * 100).toFixed(1);
        const quality = sourceQuality[source] || { quality: 'Unknown', reason: 'Unknown source' };
        const icon = quality.quality === 'High' ? '✅' : quality.quality === 'Good' ? '🟡' : '⚠️';
        console.log(`   ${icon} ${source}: ${count} (${percentage}%) - ${quality.quality} quality`);
        console.log(`      Reason: ${quality.reason}`);
      });
    
    // 2. EARLY CAREER ANALYSIS BY SOURCE
    console.log('\n🎓 EARLY CAREER ANALYSIS BY SOURCE:');
    console.log('-'.repeat(50));
    
    const sourceAnalysis = {};
    Object.keys(sourceCounts).forEach(source => {
      const sourceJobs = allJobs.filter(job => job.source === source);
      
      const graduateJobs = sourceJobs.filter(job => job.is_graduate === true).length;
      const internshipJobs = sourceJobs.filter(job => job.is_internship === true).length;
      const entryLevelJobs = sourceJobs.filter(job => job.experience_required === 'entry-level').length;
      
      const earlyCareerTitles = sourceJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        return /(graduate|junior|trainee|entry.?level|intern|apprentice|fresh|new.?grad|associate|assistant|starter|career.?starter)/i.test(title);
      }).length;
      
      const seniorTitles = sourceJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        return /(senior|lead|principal|manager|director|head|chief|vp|vice.?president|executive)/i.test(title);
      }).length;
      
      const totalEarlyCareer = graduateJobs + internshipJobs + entryLevelJobs + earlyCareerTitles;
      const earlyCareerPercentage = ((totalEarlyCareer / sourceJobs.length) * 100).toFixed(1);
      
      sourceAnalysis[source] = {
        total: sourceJobs.length,
        earlyCareer: totalEarlyCareer,
        earlyCareerPercentage,
        seniorTitles,
        graduateJobs,
        internshipJobs,
        entryLevelJobs,
        earlyCareerTitles
      };
    });
    
    Object.entries(sourceAnalysis)
      .sort((a, b) => parseFloat(b[1].earlyCareerPercentage) - parseFloat(a[1].earlyCareerPercentage))
      .forEach(([source, data]) => {
        const status = parseFloat(data.earlyCareerPercentage) >= 70 ? '✅' : 
                      parseFloat(data.earlyCareerPercentage) >= 50 ? '🟡' : '❌';
        console.log(`   ${status} ${source}: ${data.earlyCareerPercentage}% early-career relevance`);
        console.log(`      Total: ${data.total} jobs | Early-career: ${data.earlyCareer} | Senior: ${data.seniorTitles}`);
        console.log(`      Breakdown: ${data.graduateJobs} graduate, ${data.internshipJobs} internship, ${data.entryLevelJobs} entry-level, ${data.earlyCareerTitles} early-career titles`);
      });
    
    // 3. PROBLEMATIC JOBS ANALYSIS
    console.log('\n❌ PROBLEMATIC JOBS ANALYSIS:');
    console.log('-'.repeat(50));
    
    // US Jobs
    const usJobs = allJobs.filter(job => {
      const location = job.location?.toLowerCase() || '';
      return location.includes('dallas') || location.includes('tx') || location.includes('usa') || 
             location.includes('united states') || location.includes('california') || location.includes('new york');
    });
    
    if (usJobs.length > 0) {
      console.log(`🇺🇸 US JOBS FOUND: ${usJobs.length} (should be 0)`);
      usJobs.slice(0, 5).forEach(job => {
        console.log(`   - ${job.title} - ${job.company} (${job.location}) [${job.source}]`);
      });
    }
    
    // Senior Jobs by Source
    console.log('\n👔 SENIOR-LEVEL JOBS BY SOURCE:');
    Object.entries(sourceAnalysis).forEach(([source, data]) => {
      const seniorPercentage = ((data.seniorTitles / data.total) * 100).toFixed(1);
      const status = parseFloat(seniorPercentage) > 15 ? '❌' : parseFloat(seniorPercentage) > 10 ? '⚠️' : '✅';
      console.log(`   ${status} ${source}: ${data.seniorTitles} senior jobs (${seniorPercentage}%)`);
    });
    
    // 4. GEOGRAPHIC DISTRIBUTION
    console.log('\n🌍 GEOGRAPHIC DISTRIBUTION:');
    console.log('-'.repeat(50));
    
    const locationCounts = {};
    allJobs.forEach(job => {
      const location = job.location?.toLowerCase() || 'unknown';
      if (location.includes('london')) locationCounts['London'] = (locationCounts['London'] || 0) + 1;
      else if (location.includes('berlin')) locationCounts['Berlin'] = (locationCounts['Berlin'] || 0) + 1;
      else if (location.includes('madrid')) locationCounts['Madrid'] = (locationCounts['Madrid'] || 0) + 1;
      else if (location.includes('paris')) locationCounts['Paris'] = (locationCounts['Paris'] || 0) + 1;
      else if (location.includes('amsterdam')) locationCounts['Amsterdam'] = (locationCounts['Amsterdam'] || 0) + 1;
      else if (location.includes('munich')) locationCounts['Munich'] = (locationCounts['Munich'] || 0) + 1;
      else if (location.includes('barcelona')) locationCounts['Barcelona'] = (locationCounts['Barcelona'] || 0) + 1;
      else if (location.includes('rome')) locationCounts['Rome'] = (locationCounts['Rome'] || 0) + 1;
      else if (location.includes('milan')) locationCounts['Milan'] = (locationCounts['Milan'] || 0) + 1;
      else if (location.includes('dublin')) locationCounts['Dublin'] = (locationCounts['Dublin'] || 0) + 1;
      else if (location.includes('stockholm')) locationCounts['Stockholm'] = (locationCounts['Stockholm'] || 0) + 1;
      else if (location.includes('copenhagen')) locationCounts['Copenhagen'] = (locationCounts['Copenhagen'] || 0) + 1;
    });
    
    Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
      .forEach(([location, count]) => {
        console.log(`   ${location}: ${count} jobs`);
      });
    
    // 5. RECOMMENDATIONS
    console.log('\n💡 STRATEGIC RECOMMENDATIONS:');
    console.log('-'.repeat(50));
    
    // Find best performing sources
    const bestSources = Object.entries(sourceAnalysis)
      .filter(([source, data]) => parseFloat(data.earlyCareerPercentage) >= 50)
      .sort((a, b) => parseFloat(b[1].earlyCareerPercentage) - parseFloat(a[1].earlyCareerPercentage));
    
    const worstSources = Object.entries(sourceAnalysis)
      .filter(([source, data]) => parseFloat(data.earlyCareerPercentage) < 50)
      .sort((a, b) => parseFloat(a[1].earlyCareerPercentage) - parseFloat(b[1].earlyCareerPercentage));
    
    console.log('🎯 SCALE THESE HIGH-PERFORMING SOURCES:');
    bestSources.forEach(([source, data]) => {
      console.log(`   ✅ ${source}: ${data.earlyCareerPercentage}% early-career relevance`);
      console.log(`      Target: Scale from ${data.total} to ${Math.floor(data.total * 3)} jobs`);
    });
    
    console.log('\n⚠️ IMPROVE OR REDUCE THESE LOW-PERFORMING SOURCES:');
    worstSources.forEach(([source, data]) => {
      console.log(`   ❌ ${source}: ${data.earlyCareerPercentage}% early-career relevance`);
      console.log(`      Current: ${data.total} jobs | Senior jobs: ${data.seniorTitles}`);
      console.log(`      Action: Improve filtering or reduce dependency`);
    });
    
    // 6. SPECIFIC ACTION ITEMS
    console.log('\n🚀 IMMEDIATE ACTION ITEMS:');
    console.log('-'.repeat(50));
    
    console.log('1. 🔧 FILTERING IMPROVEMENTS:');
    console.log('   - Add stricter senior-level job exclusion');
    console.log('   - Improve early-career title detection');
    console.log('   - Remove US location filtering completely');
    
    console.log('\n2. 📈 SOURCE SCALING STRATEGY:');
    console.log('   - Reduce Adzuna dependency (82.9% → 50%)');
    console.log('   - Scale Greenhouse, Lever, Muse (high-quality sources)');
    console.log('   - Add Ashby scraper for tech companies');
    
    console.log('\n3. 🎯 TARGET IMPROVEMENTS:');
    console.log('   - Focus on companies with graduate programs');
    console.log('   - Add more EU cities to location targeting');
    console.log('   - Implement company quality scoring');
    
    // 7. OVERALL ASSESSMENT
    console.log('\n🏆 OVERALL ASSESSMENT:');
    console.log('-'.repeat(50));
    
    const totalEarlyCareer = Object.values(sourceAnalysis).reduce((sum, data) => sum + data.earlyCareer, 0);
    const overallEarlyCareerPercentage = ((totalEarlyCareer / totalJobs) * 100).toFixed(1);
    
    let grade = 'F';
    let gradeColor = '❌';
    
    if (overallEarlyCareerPercentage >= 70) {
      grade = 'A';
      gradeColor = '🟢';
    } else if (overallEarlyCareerPercentage >= 60) {
      grade = 'B';
      gradeColor = '🟡';
    } else if (overallEarlyCareerPercentage >= 50) {
      grade = 'C';
      gradeColor = '🟠';
    } else if (overallEarlyCareerPercentage >= 40) {
      grade = 'D';
      gradeColor = '🔴';
    }
    
    console.log(`   ${gradeColor} OVERALL GRADE: ${grade} (${overallEarlyCareerPercentage}% early-career relevance)`);
    console.log(`   📊 Current state: ${totalJobs} jobs, ${totalEarlyCareer} early-career relevant`);
    console.log(`   🎯 Target: 70%+ early-career relevance`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ANALYSIS COMPLETE - Ready for strategic improvements!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the analysis
analyzeCurrentJobs();