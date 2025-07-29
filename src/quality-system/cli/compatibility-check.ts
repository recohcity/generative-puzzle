#!/usr/bin/env node

// CLI tool for running compatibility checks

import { CompatibilityChecker } from '../utils/compatibility';

async function main() {
  console.log('🚀 Starting Quality System Compatibility Check...\n');

  const checker = new CompatibilityChecker();
  
  try {
    const checks = await checker.runAllChecks();
    const report = checker.generateReport(checks);
    
    console.log(report);
    
    // Exit with error code if any required checks failed
    const criticalFailures = checks.filter(c => c.required && c.status === 'fail');
    if (criticalFailures.length > 0) {
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Compatibility check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main };