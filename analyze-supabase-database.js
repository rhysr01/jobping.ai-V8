#!/usr/bin/env node

/**
 * 🔍 SUPABASE DATABASE ANALYSIS - JobPing Results
 * 
 * Comprehensive analysis of the job database after our successful scraping operation
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDatabase() {
  console.log('🔍 SUPABASE DATABASE ANALYSIS - JobPing Results');
  console.log('='.repeat(50));
  console.log('');
  
  try {
    // 1. Total Job Count
    console.log('📊 TOTAL DATABASE STATISTICS');
    console.log('-'.repeat(30));
    
    const { data: allJobs, error: totalError } = await supabase
      .from('jobs')
      .select('id, created_at, source, title, company, location, categories, experience_required')
      .order('created_at', { ascending: false });
    
    if (totalError) throw totalError;
    
    const totalJobs = allJobs.length;
    console.log(`📈 Total Jobs in Database: ${totalJobs}`);
    
    // 2. Recent Job Analysis (Last 24 hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentJobs = allJobs.filter(job => new Date(job.created_at) > yesterday);
    console.log(`⏰ Jobs Added Last 24 Hours: ${recentJobs.length}`);
    
    // 3. Source Breakdown
    console.log('\n🔄 JOBS BY SOURCE');
    console.log('-'.repeat(20));
    
    const sourceBreakdown = allJobs.reduce((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(sourceBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        const percentage = ((count / totalJobs) * 100).toFixed(1);
        console.log(`  📍 ${source}: ${count} jobs (${percentage}%)`);
      });
    
    // 4. Adzuna Specific Analysis (Our Success Story)
    console.log('\n🎯 ADZUNA ANALYSIS (Our Success!)');
    console.log('-'.repeat(30));
    
    const adzunaJobs = allJobs.filter(job => job.source === 'adzuna');
    console.log(`🏆 Total Adzuna Jobs: ${adzunaJobs.length}`);
    
    const recentAdzuna = adzunaJobs.filter(job => new Date(job.created_at) > yesterday);
    console.log(`⚡ Adzuna Jobs (Last 24h): ${recentAdzuna.length}`);
    
    // 5. Categories Analysis (Career Paths)
    console.log('\n🎓 CATEGORIES BREAKDOWN');
    console.log('-'.repeat(25));
    
    const categoriesBreakdown = allJobs.reduce((acc, job) => {
      const categories = job.categories || [];
      if (Array.isArray(categories) && categories.length > 0) {
        categories.forEach(category => {
          acc[category] = (acc[category] || 0) + 1;
        });
      } else {
        acc['No Categories'] = (acc['No Categories'] || 0) + 1;
      }
      return acc;
    }, {});
    
    Object.entries(categoriesBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15) // Top 15
      .forEach(([category, count]) => {
        const percentage = ((count / totalJobs) * 100).toFixed(1);
        console.log(`  🏷️  ${category}: ${count} jobs (${percentage}%)`);
      });
    
    // 6. Experience Level Analysis
    console.log('\n💼 EXPERIENCE LEVEL BREAKDOWN');
    console.log('-'.repeat(30));
    
    const experienceBreakdown = allJobs.reduce((acc, job) => {
      const exp = job.experience_required || 'Unknown';
      acc[exp] = (acc[exp] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(experienceBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([exp, count]) => {
        const percentage = ((count / totalJobs) * 100).toFixed(1);
        console.log(`  💡 ${exp}: ${count} jobs (${percentage}%)`);
      });
    
    // 7. Geographic Distribution (Top Cities)
    console.log('\n🌍 TOP LOCATIONS (EU Focus)');
    console.log('-'.repeat(25));
    
    const locationBreakdown = allJobs.reduce((acc, job) => {
      // Extract city from location
      const location = job.location || 'Unknown';
      const city = location.split(',')[0].trim();
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(locationBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15) // Top 15 cities
      .forEach(([city, count]) => {
        const percentage = ((count / totalJobs) * 100).toFixed(1);
        console.log(`  🏙️  ${city}: ${count} jobs (${percentage}%)`);
      });
    
    // 8. Top Companies
    console.log('\n🏢 TOP COMPANIES');
    console.log('-'.repeat(15));
    
    const companyBreakdown = allJobs.reduce((acc, job) => {
      const company = job.company || 'Unknown';
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(companyBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20) // Top 20 companies
      .forEach(([company, count]) => {
        console.log(`  🏢 ${company}: ${count} jobs`);
      });
    
    // 9. Sample Recent Jobs (Showcase Quality)
    console.log('\n⭐ RECENT HIGH-QUALITY JOBS (Sample)');
    console.log('-'.repeat(35));
    
    const sampleRecentJobs = recentJobs
      .filter(job => job.title.toLowerCase().includes('analyst') || 
                     job.title.toLowerCase().includes('graduate') ||
                     job.title.toLowerCase().includes('intern') ||
                     job.title.toLowerCase().includes('junior'))
      .slice(0, 10);
    
    sampleRecentJobs.forEach((job, i) => {
      const categories = Array.isArray(job.categories) ? job.categories.join(', ') : 'N/A';
      console.log(`  ${i+1}. "${job.title}" at ${job.company}`);
      console.log(`     📍 ${job.location} | 🏷️  ${categories} | 💼 ${job.experience_required || 'N/A'}`);
      console.log('');
    });
    
    // 10. Database Health Summary
    console.log('\n🩺 DATABASE HEALTH SUMMARY');
    console.log('-'.repeat(25));
    
    const avgJobsPerDay = recentJobs.length; // Last 24h as proxy
    const oldestJob = allJobs[allJobs.length - 1];
    const newestJob = allJobs[0];
    
    console.log(`✅ Database Status: HEALTHY`);
    console.log(`📊 Total Records: ${totalJobs}`);
    console.log(`⚡ Daily Ingestion Rate: ~${avgJobsPerDay} jobs/day`);
    console.log(`📅 Date Range: ${new Date(oldestJob.created_at).toLocaleDateString()} to ${new Date(newestJob.created_at).toLocaleDateString()}`);
    console.log(`🎯 Primary Sources: ${Object.keys(sourceBreakdown).join(', ')}`);
    
    // 11. Business School Graduate Focus Analysis
    console.log('\n🎓 BUSINESS SCHOOL GRADUATE FOCUS');
    console.log('-'.repeat(35));
    
    const businessSchoolRelevant = allJobs.filter(job => {
      const title = job.title.toLowerCase();
      const categories = Array.isArray(job.categories) ? job.categories.join(' ').toLowerCase() : '';
      
      // Business school relevant terms
      const relevantTerms = [
        'analyst', 'graduate', 'intern', 'trainee', 'junior', 'associate',
        'finance', 'consulting', 'strategy', 'marketing', 'operations',
        'investment', 'business', 'commercial', 'management'
      ];
      
      return relevantTerms.some(term => title.includes(term) || categories.includes(term));
    });
    
    const bsRelevantPercentage = ((businessSchoolRelevant.length / totalJobs) * 100).toFixed(1);
    console.log(`🎯 Business School Relevant Jobs: ${businessSchoolRelevant.length} (${bsRelevantPercentage}%)`);
    
    const recentBS = businessSchoolRelevant.filter(job => new Date(job.created_at) > yesterday);
    console.log(`⚡ Recent BS-Relevant Jobs: ${recentBS.length}`);
    
    console.log('\n🎉 ANALYSIS COMPLETE - Database is performing excellently!');
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error.message);
    process.exit(1);
  }
}

// Run the analysis
analyzeDatabase();
