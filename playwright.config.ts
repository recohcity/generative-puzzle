import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试目录
  testDir: './e2e',
  // 忽略临时测试目录
   testIgnore: ['temp/**'],
  // 报告配置
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list']
  ],
  // 全局超时，提升健壮性（流程断言为唯一判定标准，性能极优不会导致fail）
  timeout: 60 * 1000, // 单个测试最大60秒
  // 自动重试失败用例（高性能环境下偶发竞态可自动兜底）
  retries: 2, // 如需更快反馈可设为1
  // 本地服务自动启动
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  // 全局use配置，提升调试和CI友好性
  use: {
    baseURL: 'http://localhost:3000',
    headless: true, // CI建议true，本地可false
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure', // 失败时保留视频
    screenshot: 'only-on-failure',
    trace: 'on-first-retry', // 只在重试时开启trace，避免性能损耗
  },
  // 多浏览器配置（如需全兼容性测试）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 如需firefox/webkit可解注释
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  // 说明：
  // 1. 测试通过/失败只由流程断言决定，性能极优不会导致fail。
  // 2. retries、timeout、trace等配置建议，便于团队理解高性能环境下的自动化测试机制。
}); 