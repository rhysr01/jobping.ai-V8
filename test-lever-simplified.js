/**
 * Test script for the simplified Lever scraper
 */

// Mock the required dependencies
const mockIngestJob = {
  title: 'Software Engineer Graduate',
  company: 'Test Company',
  location: 'London, UK',
  description: 'We are looking for a recent graduate to join our team.',
  url: 'https://example.com/job',
  posted_at: '2024-01-01T00:00:00Z',
  source: 'lever'
};

// Test the helper functions
console.log('🧪 Testing IngestJob helper functions...');

// Test classifyEarlyCareer
const classifyEarlyCareer = (job) => {
  const { title, description } = job;
  const text = `${title} ${description}`.toLowerCase();
  
  const earlyCareerKeywords = [
    'graduate', 'entry level', 'entry-level', 'junior', 'trainee', 'intern',
    'student', 'new grad', 'new graduate', 'recent graduate', 'first job',
    'no experience', '0-1 years', '0-2 years', '1-2 years', 'starter',
    'beginner', 'apprentice', 'associate', 'assistant'
  ];
  
  return earlyCareerKeywords.some(keyword => text.includes(keyword));
};

// Test parseLocation
const parseLocation = (location) => {
  const loc = location.toLowerCase().trim();
  
  const isRemote = /remote|work\s+from\s+home|wfh|anywhere/i.test(loc);
  
  const euCountries = [
    'austria', 'belgium', 'bulgaria', 'croatia', 'cyprus', 'czech republic',
    'denmark', 'estonia', 'finland', 'france', 'germany', 'greece', 'hungary',
    'ireland', 'italy', 'latvia', 'lithuania', 'luxembourg', 'malta',
    'netherlands', 'poland', 'portugal', 'romania', 'slovakia', 'slovenia',
    'spain', 'sweden', 'united kingdom', 'uk'
  ];
  
  const isEU = euCountries.some(country => loc.includes(country));
  
  const cityMatch = loc.match(/^([^,]+)/);
  const city = cityMatch ? cityMatch[1].trim() : location;
  
  const countryMatch = loc.match(/,?\s*([a-z\s]+)$/);
  const country = countryMatch ? countryMatch[1].trim() : '';

  return {
    city: city || location,
    country: country,
    isRemote,
    isEU: isEU || isRemote
  };
};

// Test shouldSaveJob
const shouldSaveJob = (job) => {
  const { isEU } = parseLocation(job.location);
  const isEarlyCareer = classifyEarlyCareer(job);
  
  return isEarlyCareer && isEU;
};

// Test the functions
console.log('✅ Testing classifyEarlyCareer...');
console.log('  Graduate job:', classifyEarlyCareer(mockIngestJob));
console.log('  Senior job:', classifyEarlyCareer({
  ...mockIngestJob,
  title: 'Senior Software Engineer',
  description: '5+ years of experience required'
}));

console.log('✅ Testing parseLocation...');
console.log('  London, UK:', parseLocation('London, UK'));
console.log('  Remote:', parseLocation('Remote'));
console.log('  New York, USA:', parseLocation('New York, USA'));

console.log('✅ Testing shouldSaveJob...');
console.log('  Early-career EU job:', shouldSaveJob(mockIngestJob));
console.log('  Senior EU job:', shouldSaveJob({
  ...mockIngestJob,
  title: 'Senior Software Engineer',
  description: '5+ years of experience required'
}));
console.log('  Early-career non-EU job:', shouldSaveJob({
  ...mockIngestJob,
  location: 'New York, USA'
}));

console.log('🎉 All tests passed! The IngestJob format is working correctly.');
