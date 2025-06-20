import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', // Look for tests in the 'e2e' directory relative to this config file
  globalTeardown: require.resolve('./scripts/playwright-teardown.js'),
}); 