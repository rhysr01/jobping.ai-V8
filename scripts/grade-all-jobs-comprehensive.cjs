#!/usr/bin/env node

/**
 * Comprehensive Job Grading Script - Processes ALL jobs in database
 * Grades all 9,164+ jobs for early-career professionals
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simplified grading function for performance
function quickGradeJob(job) {
  const text = `${job.title} ${job.description}`.toLowerCase();
  
  // Early career score (0-40 points)
  const earlyCareerKeywords = ['graduate', 'junior', 'trainee', 'intern', 'internship', 'entry level', 'stagiaire', 'alternance', 'apprenticeship'];
  const seniorKeywords = ['senior', 'lead', 'principal', 'director', 'manager', '5+ years', '7+ years', 'experienced'];
  
  let earlyCareerScore = 20;
  earlyCareerKeywords.forEach(keyword => {
    if (text.includes(keyword)) earlyCareerScore += 3;
  });
  seniorKeywords.forEach(keyword => {
    if (text.includes(keyword)) earlyCareerScore -= 5;
  });
  earlyCareerScore = Math.max(0, Math.min(40, earlyCareerScore));

  // Location score (0-30 points)
  const location = job.location.toLowerCase();
  const targetLocations = ['london', 'berlin', 'paris', 'madrid', 'amsterdam', 'zurich', 'oslo', 'dublin', 'milan', 'rome', 'barcelona', 'munich', 'stockholm', 'copenhagen'];
  const isRemote = location.includes('remote') || location.includes('anywhere');
  let locationScore = 0;
  if (!isRemote && targetLocations.some(loc => location.includes(loc))) {
    locationScore = 30;
  } else if (!isRemote) {
    locationScore = 15;
  }

  // Company quality score (0-20 points)
  let companyScore = 10;
  const company = job.company.toLowerCase();
  if (company.includes('consulting') && !company.includes('mckinsey')) companyScore -= 5;
  if (company.includes('recruitment') || company.includes('agency')) companyScore -= 8;
  if (company.includes('training') && !company.includes('newto')) companyScore -= 3;

  // Freshness score (0-10 points)
  const daysOld = Math.floor((new Date() - new Date(job.created_at)) / (1000 * 60 * 60 * 24));
  let freshnessScore = Math.max(0, 10 - Math.floor(daysOld / 7));

  return earlyCareerScore + locationScore + companyScore + freshnessScore;
}

async function gradeAllJobs() {
  console.log('🎓 Comprehensive Job Grading for Early-Career Professionals');
  console.log('📋 Processing ALL jobs in database...');
  console.log('');

  const batchSize = 1000;
  let offset = 0;
  let allJobs = [];
  let totalProcessed = 0;

  // Fetch all jobs in batches
  while (true) {
    console.log(`📊 Fetching batch ${Math.floor(offset/batchSize) + 1}...`);
    
    const { data: batch, error } = await supabase
      .from('jobs')
      .select('id, title, company, location, description, source, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('❌ Error fetching batch:', error);
      break;
    }

    if (!batch || batch.length === 0) {
      break;
    }

    allJobs = allJobs.concat(batch);
    totalProcessed += batch.length;
    
    console.log(`   Processed ${totalProcessed} jobs so far...`);
    
    if (batch.length < batchSize) {
      break;
    }
    
    offset += batchSize;
  }

  console.log(`\n📊 Total jobs to analyze: ${allJobs.length}`);
  console.log('🎯 Grading jobs...');

  // Grade all jobs
  const gradedJobs = allJobs.map(job => ({
    ...job,
    grade: quickGradeJob(job)
  }));

  // Sort by grade
  gradedJobs.sort((a, b) => b.grade - a.grade);

  // Calculate statistics
  const gradeDistribution = {};
  const locationStats = {};
  const sourceStats = {};
  const companyStats = {};

  gradedJobs.forEach(job => {
    const category = job.grade >= 80 ? 'A+' : 
                    job.grade >= 70 ? 'A' : 
                    job.grade >= 60 ? 'B' : 
                    job.grade >= 50 ? 'C' : 'D';
    
    gradeDistribution[category] = (gradeDistribution[category] || 0) + 1;
    
    const location = job.location || 'Unknown';
    locationStats[location] = (locationStats[location] || 0) + 1;
    
    const source = job.source || 'Unknown';
    sourceStats[source] = (sourceStats[source] || 0) + 1;
    
    const company = job.company || 'Unknown';
    companyStats[company] = (companyStats[company] || 0) + 1;
  });

  // Display results
  console.log('\n🎯 COMPREHENSIVE GRADING RESULTS');
  console.log('================================');
  
  console.log('\n📊 Grade Distribution:');
  Object.entries(gradeDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([grade, count]) => {
      const percentage = ((count / allJobs.length) * 100).toFixed(1);
      console.log(`  ${grade}: ${count} jobs (${percentage}%)`);
    });

  console.log('\n🏆 Top 15 Highest Graded Jobs:');
  gradedJobs.slice(0, 15).forEach((job, index) => {
    console.log(`  ${index + 1}. [${job.grade}/100] ${job.title} at ${job.company} (${job.location})`);
  });

  console.log('\n⚠️  Bottom 15 Lowest Graded Jobs:');
  gradedJobs.slice(-15).reverse().forEach((job, index) => {
    console.log(`  ${index + 1}. [${job.grade}/100] ${job.title} at ${job.company} (${job.location})`);
  });

  console.log('\n🌍 Top 15 Locations:');
  Object.entries(locationStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([location, count]) => {
      const percentage = ((count / allJobs.length) * 100).toFixed(1);
      console.log(`  ${location}: ${count} jobs (${percentage}%)`);
    });

  console.log('\n📡 Source Distribution:');
  Object.entries(sourceStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      const percentage = ((count / allJobs.length) * 100).toFixed(1);
      console.log(`  ${source}: ${count} jobs (${percentage}%)`);
    });

  console.log('\n🏢 Top 15 Companies (by job count):');
  Object.entries(companyStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([company, count]) => {
      console.log(`  ${company}: ${count} jobs`);
    });

  // Quality metrics
  const avgGrade = (gradedJobs.reduce((sum, job) => sum + job.grade, 0) / allJobs.length).toFixed(1);
  const highQualityJobs = gradedJobs.filter(job => job.grade >= 70).length;
  const lowQualityJobs = gradedJobs.filter(job => job.grade < 50).length;
  const excellentJobs = gradedJobs.filter(job => job.grade >= 80).length;

  console.log('\n📈 Quality Metrics:');
  console.log(`  Average Grade: ${avgGrade}/100`);
  console.log(`  Excellent Jobs (A+): ${excellentJobs} (${((excellentJobs/allJobs.length)*100).toFixed(1)}%)`);
  console.log(`  High Quality Jobs (A): ${highQualityJobs} (${((highQualityJobs/allJobs.length)*100).toFixed(1)}%)`);
  console.log(`  Low Quality Jobs (C/D): ${lowQualityJobs} (${((lowQualityJobs/allJobs.length)*100).toFixed(1)}%)`);
  console.log(`  Total Jobs Analyzed: ${allJobs.length}`);

  // Early career analysis
  const earlyCareerJobs = gradedJobs.filter(job => {
    const text = `${job.title} ${job.description}`.toLowerCase();
    return text.includes('graduate') || text.includes('junior') || text.includes('trainee') || 
           text.includes('intern') || text.includes('entry level') || text.includes('stagiaire');
  });

  console.log('\n🎓 Early Career Analysis:');
  console.log(`  Jobs with early career keywords: ${earlyCareerJobs.length} (${((earlyCareerJobs.length/allJobs.length)*100).toFixed(1)}%)`);
  console.log(`  Average grade of early career jobs: ${(earlyCareerJobs.reduce((sum, job) => sum + job.grade, 0) / earlyCareerJobs.length).toFixed(1)}/100`);

  console.log('\n✅ Comprehensive grading completed!');
}

// Run the grading
gradeAllJobs().catch(console.error);
