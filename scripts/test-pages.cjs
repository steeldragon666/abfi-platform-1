/**
 * ABFI Platform Page Testing Script
 * Tests all pages for accessibility, loads, and basic functionality
 *
 * Usage: node scripts/test-pages.js [baseUrl]
 * Default baseUrl: http://localhost:3001
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.argv[2] || 'http://localhost:3001';

// All routes from App.tsx
const PAGES = [
  // Public pages
  { path: '/', name: 'Home (Landing Page)', requiresAuth: false },
  { path: '/for-growers', name: 'For Growers', requiresAuth: false },
  { path: '/for-developers', name: 'For Developers', requiresAuth: false },
  { path: '/for-lenders', name: 'For Lenders', requiresAuth: false },
  { path: '/platform-features', name: 'Platform Features', requiresAuth: false },
  { path: '/browse', name: 'Browse Marketplace', requiresAuth: false },
  { path: '/futures', name: 'Futures Marketplace', requiresAuth: false },
  { path: '/map', name: 'Map View', requiresAuth: false },
  { path: '/feedstock-map', name: 'Feedstock Map', requiresAuth: false },
  { path: '/financial-onboarding', name: 'Financial Onboarding', requiresAuth: false },
  { path: '/bankability-explainer', name: 'Bankability Explainer', requiresAuth: false },
  { path: '/grower-benefits', name: 'Grower Benefits', requiresAuth: false },
  { path: '/project-registration', name: 'Project Registration', requiresAuth: false },
  { path: '/certificate-verification', name: 'Certificate Verification', requiresAuth: false },
  { path: '/producer-registration', name: 'Producer Registration', requiresAuth: false },

  // Auth-required pages (will return 200 but show login prompt)
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/bankability', name: 'Bankability Dashboard', requiresAuth: true },
  { path: '/supplier/futures', name: 'Supplier Futures', requiresAuth: true },
  { path: '/buyer/eois', name: 'Buyer EOIs', requiresAuth: true },
  { path: '/lender-portal', name: 'Lender Portal', requiresAuth: true },
  { path: '/compliance-dashboard', name: 'Compliance Dashboard', requiresAuth: true },
  { path: '/admin', name: 'Admin Dashboard', requiresAuth: true },
  { path: '/notifications', name: 'Notifications', requiresAuth: true },

  // 404 test
  { path: '/nonexistent-page-test', name: '404 Page', requiresAuth: false, expect404: true },
];

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
  startTime: new Date(),
  endTime: null,
};

// HTTP request helper
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();

    const req = client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: Date.now() - startTime,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Check for common issues in HTML
function analyzeResponse(response, page) {
  const issues = [];
  const body = response.body;

  // Check for React error boundaries
  if (body.includes('Something went wrong') || body.includes('error boundary')) {
    issues.push('React error boundary triggered');
  }

  // Check for common error messages
  if (body.includes('Cannot read properties of') || body.includes('undefined is not')) {
    issues.push('JavaScript runtime error detected');
  }

  // Check for missing chunks/assets
  if (body.includes('ChunkLoadError') || body.includes('Loading chunk')) {
    issues.push('Chunk loading error');
  }

  // Check for hydration errors
  if (body.includes('Hydration failed') || body.includes('hydration mismatch')) {
    issues.push('React hydration error');
  }

  // Check response time
  if (response.responseTime > 3000) {
    issues.push(`Slow response: ${response.responseTime}ms`);
  }

  // Check for basic HTML structure
  if (!body.includes('<!DOCTYPE html>') && !body.includes('<!doctype html>')) {
    if (!body.includes('<html') && !body.includes('<div id="root"')) {
      issues.push('Missing HTML structure');
    }
  }

  return issues;
}

// Test a single page
async function testPage(page) {
  const url = `${BASE_URL}${page.path}`;
  const testResult = {
    name: page.name,
    path: page.path,
    url: url,
    status: 'unknown',
    statusCode: null,
    responseTime: null,
    issues: [],
  };

  try {
    const response = await fetchPage(url);
    testResult.statusCode = response.statusCode;
    testResult.responseTime = response.responseTime;

    // Check status code
    if (page.expect404) {
      // For 404 test, we expect the page to load but show 404 content
      if (response.statusCode === 200 && response.body.includes('404')) {
        testResult.status = 'passed';
      } else if (response.statusCode === 404) {
        testResult.status = 'passed';
      } else {
        testResult.status = 'failed';
        testResult.issues.push(`Expected 404, got ${response.statusCode}`);
      }
    } else if (response.statusCode === 200) {
      testResult.status = 'passed';

      // Analyze for issues
      const issues = analyzeResponse(response, page);
      if (issues.length > 0) {
        testResult.status = 'warning';
        testResult.issues = issues;
      }
    } else {
      testResult.status = 'failed';
      testResult.issues.push(`HTTP ${response.statusCode}`);
    }

  } catch (error) {
    testResult.status = 'failed';
    testResult.issues.push(error.message);
  }

  return testResult;
}

// Generate report
function generateReport() {
  results.endTime = new Date();
  const duration = (results.endTime - results.startTime) / 1000;

  console.log('\n' + '='.repeat(70));
  console.log('ABFI PLATFORM - PAGE TEST REPORT');
  console.log('='.repeat(70));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Date: ${results.startTime.toISOString()}`);
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log('='.repeat(70));

  // Summary
  const total = results.passed.length + results.failed.length + results.warnings.length;
  console.log('\nSUMMARY:');
  console.log(`  Total Pages Tested: ${total}`);
  console.log(`  ✅ Passed: ${results.passed.length}`);
  console.log(`  ⚠️  Warnings: ${results.warnings.length}`);
  console.log(`  ❌ Failed: ${results.failed.length}`);

  // Passed pages
  if (results.passed.length > 0) {
    console.log('\n✅ PASSED PAGES:');
    results.passed.forEach(r => {
      console.log(`  [${r.responseTime}ms] ${r.name} (${r.path})`);
    });
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log('\n⚠️  PAGES WITH WARNINGS:');
    results.warnings.forEach(r => {
      console.log(`  ${r.name} (${r.path})`);
      r.issues.forEach(issue => console.log(`    - ${issue}`));
    });
  }

  // Failed pages
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED PAGES:');
    results.failed.forEach(r => {
      console.log(`  ${r.name} (${r.path})`);
      r.issues.forEach(issue => console.log(`    - ${issue}`));
    });
  }

  // Response time stats
  const allResults = [...results.passed, ...results.warnings, ...results.failed];
  const times = allResults.filter(r => r.responseTime).map(r => r.responseTime);
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    console.log('\nRESPONSE TIME STATS:');
    console.log(`  Average: ${avgTime.toFixed(0)}ms`);
    console.log(`  Fastest: ${minTime}ms`);
    console.log(`  Slowest: ${maxTime}ms`);
  }

  console.log('\n' + '='.repeat(70));

  // Exit code based on failures
  if (results.failed.length > 0) {
    console.log('TEST RESULT: FAILED');
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.log('TEST RESULT: PASSED WITH WARNINGS');
    process.exit(0);
  } else {
    console.log('TEST RESULT: ALL PASSED');
    process.exit(0);
  }
}

// Main execution
async function main() {
  console.log('ABFI Platform Page Tester');
  console.log(`Testing ${PAGES.length} pages against ${BASE_URL}`);
  console.log('-'.repeat(50));

  for (const page of PAGES) {
    process.stdout.write(`Testing ${page.name}... `);
    const result = await testPage(page);

    if (result.status === 'passed') {
      console.log(`✅ (${result.responseTime}ms)`);
      results.passed.push(result);
    } else if (result.status === 'warning') {
      console.log(`⚠️  (${result.responseTime}ms)`);
      results.warnings.push(result);
    } else {
      console.log(`❌ ${result.issues.join(', ')}`);
      results.failed.push(result);
    }
  }

  generateReport();
}

main().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
