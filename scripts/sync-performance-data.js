const fse = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const src = path.join(__dirname, '../playwright-test-logs/performance_trend_data.json');
const dest = path.join(__dirname, '../public/performance_trend_data.json');

async function main() {
  try {
    await fse.copy(src, dest);
    console.log('Synced performance_trend_data.json to public directory.');
  } catch (e) {
    console.error('Failed to sync performance_trend_data.json:', e);
  }
}

if (require.main === module) {
  main();
}
execSync('node scripts/generate-performance-trend-data.js', { stdio: 'inherit' });
require('./sync-performance-data')();