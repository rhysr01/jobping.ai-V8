#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

async function findActiveGreenhouseCompanies() {
  console.log('🔍 FINDING ACTIVE GREENHOUSE COMPANIES WITH JOBS');
  console.log('='.repeat(50));
  
  // Companies known to be actively hiring
  const companies = [
    'gong',
    'mongodb', 
    'twilio',
    'grammarly',
    'coinbase',
    'robinhood',
    'plaid',
    'zapier',
    'gitlab',
    'airtable'
  ];
  
  for (const company of companies) {
    const url = `https://boards.greenhouse.io/${company}`;
    console.log(`\n📡 Testing ${company}...`);
    
    try {
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        },
        timeout: 8000
      });
      
      const $ = cheerio.load(html);
      
      // Test multiple selectors
      const selectors = [
        '.opening',
        'div[data-qa="opening"]',
        '.section-wrapper .opening',
        'section.level-0 .opening',
        'a[href*="job_app"]',
        '.posting',
        'div[class*="opening"]'
      ];
      
      let foundJobs = false;
      for (const selector of selectors) {
        const count = $(selector).length;
        if (count > 0) {
          console.log(`✅ ${company}: ${count} jobs found with "${selector}"`);
          foundJobs = true;
          
          // Show sample jobs
          $(selector).slice(0, 3).each((i, el) => {
            const $el = $(el);
            const title = $el.text().trim().split('\n')[0].substring(0, 80);
            const href = $el.attr('href') || $el.find('a').attr('href');
            console.log(`  ${i+1}. ${title}`);
            if (href) console.log(`     -> ${href}`);
          });
          break;
        }
      }
      
      if (!foundJobs) {
        console.log(`⚠️ ${company}: Page loads but no jobs found`);
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ ${company}: 404 - company not found`);
      } else {
        console.log(`❌ ${company}: ${error.message}`);
      }
    }
  }
}

findActiveGreenhouseCompanies();
