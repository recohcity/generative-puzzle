import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', // Look for tests in the 'e2e' directory relative to this config file
  testIgnore: ['temp/**'],
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list']
  ],
  
  // Add the webServer configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // Increase timeout for server start
  },

  // Use the baseURL from the webServer
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
}); 