#!/usr/bin/env node

/**
 * Show City Coverage for All Scrapers
 * Displays which cities each scraper targets
 */

console.log('🌍 JobPing City Coverage Summary\n');

// Adzuna Coverage
console.log('📍 Adzuna Scraper:');
console.log('   • London (GB) - English');
console.log('   • Madrid (ES) - Spanish');
console.log('   • Berlin (DE) - German');
console.log('   • Barcelona (ES) - Spanish');
console.log('   • Amsterdam (NL) - Dutch');
console.log('   📊 Total: 5 cities across 5 countries\n');

// Reed Coverage
console.log('📍 Reed Scraper:');
console.log('   • London (GB) - English');
console.log('   📊 Total: 1 city (UK focus)\n');

// InfoJobs Coverage (Removed - No API key)
console.log('📍 InfoJobs Scraper:');
console.log('   • Removed - No API key available\n');

// Multi-Source Coverage
console.log('🎯 Multi-Source Orchestrator:');
console.log('   • London (GB) - English');
console.log('   • Madrid (ES) - Spanish');
console.log('   • Berlin (DE) - German');
console.log('   • Barcelona (ES) - Spanish');
console.log('   • Amsterdam (NL) - Dutch');
console.log('   📊 Total: 5 cities across 5 countries\n');

// Language Support
console.log('🌐 Language Support:');
console.log('   • English: London');
console.log('   • Spanish: Madrid, Barcelona');
console.log('   • German: Berlin');
console.log('   • Dutch: Amsterdam\n');

// Early Career Patterns
console.log('🎓 Early Career Detection:');
console.log('   • English: intern, graduate, junior, trainee, entry-level');
console.log('   • Spanish: becario, prácticas, junior, recién graduado');
console.log('   • German: praktikant, praktikum, trainee, berufseinsteiger');
console.log('   • Dutch: stagiair, werkstudent, junior, starter\n');

console.log('✅ Working scrapers: Reed (London), Adzuna (5 cities)');
console.log('📝 Next: Focus on working scrapers and expand coverage');
