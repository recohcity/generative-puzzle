#!/usr/bin/env node

/**
 * Test CI/CD Integration Script
 * 
 * This script tests the CI/CD integration functionality locally
 * before pushing to GitHub Actions.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing CI/CD Integration Locally');
console.log('====================================\n');

// Test environment variables
const testEnvVars = {
  CI: 'true',
  GITHUB_ACTIONS: 'true',
  GITHUB_REF_NAME: 'test-branch',
  GITHUB_SHA: 'abc123def456',
  NODE_ENV: 'test'
};

// Set test environment variables
Object.entries(testEnvVars).forEach(([key, value]) => {
  process.env[key] = value;
});

console.log('🌍 Test Environment Variables:');
Object.entries(testEnvVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});
console.log('');

const tests = [
  {
    name: 'Quality Detection Demo',
    command: 'npm run quality:detection-demo',
    description: 'Run quality detection analysis',
    allowFailure: false
  },
  {
    name: 'Advanced Metrics Demo',
    command: 'npm run quality:advanced-metrics-demo',
    description: 'Run advanced quality metrics',
    allowFailure: false
  },
  {
    name: 'CI/CD Integration Demo',
    command: 'npm run quality:cicd-demo',
    description: 'Run CI/CD integration demo',
    allowFailure: false
  },
  {
    name: 'Quality System Unit Tests',
    command: 'npm run quality:test',
    description: 'Run quality system unit tests',
    allowFailure: true
  },
  {
    name: 'TypeScript Check (Quality System Only)',
    command: 'npx tsc --noEmit src/quality-system/**/*.ts --skipLibCheck',
    description: 'Check TypeScript compilation for quality system files only',
    allowFailure: true
  }
];

const results = [];

for (const test of tests) {
  console.log(`🔍 Running: ${test.name}`);
  console.log(`   Description: ${test.description}`);
  
  const startTime = Date.now();
  
  try {
    const output = execSync(test.command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000 // 1 minute timeout
    });
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Passed (${duration}ms)`);
    results.push({
      name: test.name,
      status: 'passed',
      duration,
      output: output.substring(0, 500) // Truncate long output
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (test.allowFailure) {
      console.log(`   ⚠️  Failed (allowed) (${duration}ms)`);
      console.log(`   Error: ${error.message.substring(0, 200)}`);
      results.push({
        name: test.name,
        status: 'failed-allowed',
        duration,
        error: error.message.substring(0, 500)
      });
    } else {
      console.log(`   ❌ Failed (${duration}ms)`);
      console.log(`   Error: ${error.message.substring(0, 200)}`);
      results.push({
        name: test.name,
        status: 'failed',
        duration,
        error: error.message.substring(0, 500)
      });
    }
  }
  
  console.log('');
}

// Generate summary report
console.log('📊 Test Summary');
console.log('===============');

const passed = results.filter(r => r.status === 'passed').length;
const failedAllowed = results.filter(r => r.status === 'failed-allowed').length;
const failed = results.filter(r => r.status === 'failed').length;
const total = results.length;

console.log(`Total Tests: ${total}`);
console.log(`✅ Passed: ${passed}`);
console.log(`⚠️  Failed (Allowed): ${failedAllowed}`);
console.log(`❌ Failed: ${failed}`);
console.log('');

// Determine overall status
const overallSuccess = failed === 0;
console.log(`Overall Status: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILURE'}`);

// Generate detailed report
const reportDir = 'quality-reports';
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportPath = path.join(reportDir, 'cicd-test-report.json');
const report = {
  timestamp: new Date().toISOString(),
  environment: testEnvVars,
  summary: {
    total,
    passed,
    failedAllowed,
    failed,
    overallSuccess
  },
  results
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

// Generate markdown report
const markdownPath = path.join(reportDir, 'cicd-test-report.md');
let markdown = `# CI/CD Integration Test Report\n\n`;
markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
markdown += `## Summary\n\n`;
markdown += `- **Total Tests:** ${total}\n`;
markdown += `- **Passed:** ${passed} ✅\n`;
markdown += `- **Failed (Allowed):** ${failedAllowed} ⚠️\n`;
markdown += `- **Failed:** ${failed} ❌\n`;
markdown += `- **Overall Status:** ${overallSuccess ? 'SUCCESS ✅' : 'FAILURE ❌'}\n\n`;

markdown += `## Test Results\n\n`;
results.forEach(result => {
  const emoji = result.status === 'passed' ? '✅' : 
                result.status === 'failed-allowed' ? '⚠️' : '❌';
  markdown += `### ${emoji} ${result.name}\n\n`;
  markdown += `- **Status:** ${result.status.toUpperCase()}\n`;
  markdown += `- **Duration:** ${result.duration}ms\n`;
  
  if (result.error) {
    markdown += `- **Error:** \`${result.error}\`\n`;
  }
  
  if (result.output) {
    markdown += `- **Output Preview:** \`${result.output.substring(0, 200)}...\`\n`;
  }
  
  markdown += `\n`;
});

markdown += `## Environment\n\n`;
Object.entries(testEnvVars).forEach(([key, value]) => {
  markdown += `- **${key}:** ${value}\n`;
});

fs.writeFileSync(markdownPath, markdown);
console.log(`📄 Markdown report saved to: ${markdownPath}`);

// Exit with appropriate code
process.exit(overallSuccess ? 0 : 1);