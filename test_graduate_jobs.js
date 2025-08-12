#!/usr/bin/env node

// Quick test to generate and display graduate jobs
const crypto = require('crypto');

// Sample graduate jobs data - this is what your scrapers should be finding
const generateGraduateJobs = () => {
  const cities = ['London', 'Dublin', 'Madrid', 'Berlin', 'Amsterdam', 'Paris'];
  const companies = ['Google', 'Microsoft', 'Stripe', 'Airbnb', 'Netflix', 'Uber', 'Coinbase', 'Tesla'];
  const jobTypes = [
    'Graduate Software Engineer',
    'Data Analyst Graduate Programme',
    'Marketing Intern',
    'Product Management Graduate',
    'Financial Analyst Graduate',
    'Consulting Graduate Programme',
    'UX Design Intern',
    'Software Engineering Intern',
    'Graduate Data Scientist',
    'Business Analyst Graduate'
  ];

  const jobs = [];
  
  cities.forEach(city => {
    // Generate 3-5 jobs per city
    const jobCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < jobCount; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      const isInternship = jobType.includes('Intern');
      const isGraduate = jobType.includes('Graduate');
      
      const job = {
        id: crypto.randomUUID(),
        title: `${jobType} - ${city}`,
        company: `${company} ${city}`,
        location: city,
        job_url: `https://jobs.example.com/${jobType.toLowerCase().replace(/\s+/g, '-')}-${city.toLowerCase()}`,
        description: `${isInternship ? 'Internship' : 'Graduate position'} in ${jobType.replace('Graduate ', '').replace(' Intern', '')} at ${company} in ${city}. ${isGraduate ? 'Perfect for recent graduates looking to start their career.' : 'Great opportunity for students and new graduates.'}`,
        experience_required: isInternship ? 'Internship' : (isGraduate ? 'Graduate' : 'Entry Level'),
        work_environment: ['remote', 'hybrid', 'office'][Math.floor(Math.random() * 3)],
        source: 'graduatejobs',
        categories: `${isInternship ? 'internship' : 'graduate'},${jobType.includes('Software') || jobType.includes('Data') ? 'technology' : 'business'},entry-level`,
        salary_range: isInternship ? '€25k - €35k' : '€35k - €55k',
        posted_days_ago: Math.floor(Math.random() * 7) + 1,
        visa_sponsored: Math.random() > 0.5,
        freshness_tier: 'fresh',
        match_score: 85 + Math.floor(Math.random() * 15) // 85-99%
      };
      
      jobs.push(job);
    }
  });
  
  return jobs;
};

// Display jobs in a nice format
const displayJobs = (jobs) => {
  console.log('\n🎓 GRADUATE JOBS & INTERNSHIPS FOUND:');
  console.log('=' .repeat(60));
  
  jobs.forEach((job, index) => {
    console.log(`\n${index + 1}. ${job.title}`);
    console.log(`   🏢 Company: ${job.company}`);
    console.log(`   📍 Location: ${job.location}`);
    console.log(`   💼 Type: ${job.experience_required}`);
    console.log(`   🏠 Work: ${job.work_environment}`);
    console.log(`   💰 Salary: ${job.salary_range}`);
    console.log(`   📅 Posted: ${job.posted_days_ago} days ago`);
    console.log(`   🎯 Match: ${job.match_score}%`);
    console.log(`   🔗 Apply: ${job.job_url}`);
    
    if (job.visa_sponsored) {
      console.log(`   ✅ Visa sponsorship available`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 SUMMARY: ${jobs.length} graduate opportunities found`);
  
  // Group by city
  const jobsByCity = jobs.reduce((acc, job) => {
    acc[job.location] = (acc[job.location] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📍 JOBS BY CITY:');
  Object.entries(jobsByCity).forEach(([city, count]) => {
    console.log(`   ${city}: ${count} jobs`);
  });
  
  // Group by type
  const jobsByType = jobs.reduce((acc, job) => {
    const type = job.experience_required;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n💼 JOBS BY TYPE:');
  Object.entries(jobsByType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} jobs`);
  });
  
  console.log('\n🎉 These are the types of jobs your scrapers should be finding!');
  console.log('🔧 Once we fix the hanging issues, you\'ll get real data like this.\n');
};

// Run the demo
const jobs = generateGraduateJobs();
displayJobs(jobs);

// Also save to a JSON file for reference
const fs = require('fs');
fs.writeFileSync('sample_graduate_jobs.json', JSON.stringify(jobs, null, 2));
console.log('💾 Sample jobs saved to sample_graduate_jobs.json');
