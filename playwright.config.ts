import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', // Look for tests in the 'e2e' directory relative to this config file
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list']
  ],
}); 