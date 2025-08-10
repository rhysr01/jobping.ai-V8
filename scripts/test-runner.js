#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE TEST RUNNER
 * 
 * This script runs all tests and provides detailed reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testTypes: ['unit', 'integration', 'api', 'scrapers'],
  coverageThreshold: 80,
  failOnError: true
};

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      api: { passed: 0, failed: 0, total: 0 },
      scrapers: { passed: 0, failed: 0, total: 0 }
    };
    this.errors = [];
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive test suite...\n');
    
    try {
      // Run linting first
      await this.runLinting();
      
      // Run type checking
      await this.runTypeChecking();
      
      // Run unit tests
      await this.runUnitTests();
      
      // Run integration tests
      await this.runIntegrationTests();
      
      // Run API tests
      await this.runAPITests();
      
      // Run scraper tests
      await this.runScraperTests();
      
      // Generate coverage report
      await this.generateCoverageReport();
      
      // Print summary
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runLinting() {
    console.log('🔍 Running linting...');
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      console.log('✅ Linting passed\n');
    } catch (error) {
      console.error('❌ Linting failed');
      if (CONFIG.failOnError) throw error;
    }
  }

  async runTypeChecking() {
    console.log('🔍 Running type checking...');
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      console.log('✅ Type checking passed\n');
    } catch (error) {
      console.error('❌ Type checking failed');
      if (CONFIG.failOnError) throw error;
    }
  }

  async runUnitTests() {
    console.log('🧪 Running unit tests...');
    try {
      execSync('npm run test -- --testPathPattern=Utils --coverage', { stdio: 'inherit' });
      console.log('✅ Unit tests passed\n');
    } catch (error) {
      console.error('❌ Unit tests failed');
      this.results.unit.failed++;
      if (CONFIG.failOnError) throw error;
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');
    try {
      execSync('npm run test -- --testPathPattern=integration --coverage', { stdio: 'inherit' });
      console.log('✅ Integration tests passed\n');
    } catch (error) {
      console.error('❌ Integration tests failed');
      this.results.integration.failed++;
      if (CONFIG.failOnError) throw error;
    }
  }

  async runAPITests() {
    console.log('🌐 Running API tests...');
    try {
      execSync('npm run test -- --testPathPattern=api --coverage', { stdio: 'inherit' });
      console.log('✅ API tests passed\n');
    } catch (error) {
      console.error('❌ API tests failed');
      this.results.api.failed++;
      if (CONFIG.failOnError) throw error;
    }
  }

  async runScraperTests() {
    console.log('🕷️ Running scraper tests...');
    try {
      execSync('npm run test -- --testPathPattern=scrapers --coverage', { stdio: 'inherit' });
      console.log('✅ Scraper tests passed\n');
    } catch (error) {
      console.error('❌ Scraper tests failed');
      this.results.scrapers.failed++;
      if (CONFIG.failOnError) throw error;
    }
  }

  async generateCoverageReport() {
    console.log('📊 Generating coverage report...');
    try {
      execSync('npm run test:coverage', { stdio: 'inherit' });
      console.log('✅ Coverage report generated\n');
    } catch (error) {
      console.error('❌ Coverage report generation failed');
      if (CONFIG.failOnError) throw error;
    }
  }

  printSummary() {
    console.log('📋 TEST SUMMARY');
    console.log('==============');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    
    Object.entries(this.results).forEach(([type, result]) => {
      const total = result.passed + result.failed;
      totalTests += total;
      totalPassed += result.passed;
      totalFailed += result.failed;
      
      console.log(`${type.toUpperCase()}: ${result.passed}/${total} passed`);
    });
    
    console.log(`\nTOTAL: ${totalPassed}/${totalTests} tests passed`);
    
    if (totalFailed > 0) {
      console.log(`\n❌ ${totalFailed} tests failed`);
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
    }
  }
}

// Run the test suite
const runner = new TestRunner();
runner.runAllTests().catch(console.error);
